import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ServiceDocument } from '../../services/schemas/service.schema';
import type { HttpVerb } from '@virtualservice/shared/model';
import { AuditService } from '../audit.service';
import { AuthenticatedUser } from '../../auth/interfaces/request-with-user.interface';
import type { ToolDeps } from './_tool-deps';

/**
 * Errore strutturato MCP nel formato concordato in `claude/mcp.md`:
 * `{ code: STRING_CONST, message, details? }`. Restituito come content
 * testuale + flag `isError: true` così che i client possano distinguerlo.
 */
export function mcpError(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): CallToolResult {
  const payload = {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  return {
    isError: true,
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  };
}

/**
 * Risultato di successo MCP. Restituiamo sempre la versione testuale
 * (per client text-only) e quella strutturata (per client schema-aware).
 */
export function mcpResult(payload: unknown): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload as { [key: string]: unknown },
  };
}

export interface NestErrorMapOptions {
  /** Codice MCP da emettere su `NotFoundException` (default `NOT_FOUND`). */
  notFoundCode?: string;
  /** Codice MCP da emettere su `ForbiddenException` (default `FORBIDDEN`). */
  forbiddenCode?: string;
  /** Codice MCP da emettere su `BadRequestException` (default `VALIDATION_FAILED`). */
  badRequestCode?: string;
}

/**
 * Mappa eccezioni Nest comuni in errori strutturati MCP. Se non riconosce
 * il caso restituisce `null`, lasciando l'eccezione gestire dal try/catch
 * generico del controller.
 */
export function nestErrorToMcp(
  err: unknown,
  options: NestErrorMapOptions = {},
): CallToolResult | null {
  if (!err || typeof err !== 'object') return null;
  const e = err as { name?: string; message?: string; status?: number };
  if (e.name === 'NotFoundException') {
    return mcpError(options.notFoundCode ?? 'NOT_FOUND', e.message ?? 'Not found');
  }
  if (e.name === 'ForbiddenException') {
    return mcpError(options.forbiddenCode ?? 'FORBIDDEN', e.message ?? 'Forbidden');
  }
  if (e.name === 'BadRequestException') {
    return mcpError(
      options.badRequestCode ?? 'VALIDATION_FAILED',
      e.message ?? 'Validation failed',
    );
  }
  return null;
}

interface MutationAuditCtx {
  tool: string;
  args: unknown;
  user: AuthenticatedUser;
  apiKeyId: string;
  audit: AuditService;
}

/**
 * Esegue una tool callback di mutation registrando automaticamente il suo
 * esito su `mcp-audit`. Estrae `errorCode` da `result.structuredContent.error.code`
 * se la callback ritorna `isError: true`, oppure registra `INTERNAL_ERROR`
 * se l'eccezione esce dal try (e poi rethrow).
 */
export async function withMutationAudit(
  ctx: MutationAuditCtx,
  fn: () => Promise<CallToolResult>,
): Promise<CallToolResult> {
  try {
    const result = await fn();
    const errorCode = result.isError
      ? ((result.structuredContent as { error?: { code?: string } } | undefined)
          ?.error?.code ?? 'UNKNOWN')
      : null;
    ctx.audit.recordMutation({
      userId: ctx.user.userId,
      keyId: ctx.apiKeyId,
      tool: ctx.tool,
      args: ctx.args,
      success: !result.isError,
      errorCode,
    });
    return result;
  } catch (err) {
    ctx.audit.recordMutation({
      userId: ctx.user.userId,
      keyId: ctx.apiKeyId,
      tool: ctx.tool,
      args: ctx.args,
      success: false,
      errorCode: 'INTERNAL_ERROR',
    });
    throw err;
  }
}

/**
 * Riconosce duplicate-key di Mongo (`code === 11000` o messaggio "duplicate key").
 */
export function isMongoDuplicateKey(err: unknown): boolean {
  const e = err as { code?: number; message?: string } | null;
  if (!e) return false;
  if (e.code === 11000) return true;
  return typeof e.message === 'string' && e.message.toLowerCase().includes('duplicate key');
}

interface CallMutationCtx {
  /** Nome del tool MCP (per audit). */
  tool: string;
  /** Args completi della tool call (per audit + snapshot). */
  args: unknown;
  serviceId: string;
  callPath: string;
  callVerb: HttpVerb;
  /** Optimistic locking opzionale. */
  expectedLastChange?: number;
}

type CallDto = { calls: Array<Record<string, unknown>>; [k: string]: unknown };

/**
 * Helper di alto livello per i tool che mutano un sotto-array di una call
 * (rules, parameters, headers, cookies). Si occupa di:
 *
 * 1. `withMutationAudit` wrapping (audit success/failure automatico)
 * 2. `captureBeforeMutation` (snapshot pre-write se serve)
 * 3. `findOne` con mappatura a `SERVICE_NOT_FOUND`
 * 4. Lookup della call per `(callPath, callVerb)` con `CALL_NOT_FOUND`
 * 5. Esecuzione del callback `mutate(call)` — se torna un `CallToolResult`
 *    l'errore viene propagato senza salvare; altrimenti si salva
 * 6. Save con `expectedLastChange` e mappatura `STALE_VERSION`
 * 7. Costruzione del payload di successo via `buildResult` (fallback al
 *    payload generico `{ serviceId, callPath, callVerb, lastChange }`)
 */
export async function withCallMutation(
  user: AuthenticatedUser,
  deps: ToolDeps,
  ctx: CallMutationCtx,
  mutate: (call: Record<string, unknown>) => CallToolResult | undefined,
  buildResult?: (
    saved: ServiceDocument,
    mutatedCall: Record<string, unknown>,
  ) => unknown,
): Promise<CallToolResult> {
  return withMutationAudit(
    {
      tool: ctx.tool,
      args: ctx.args,
      user,
      apiKeyId: deps.apiKeyId,
      audit: deps.auditService,
    },
    async () => {
      await deps.snapshotService.captureBeforeMutation(
        user.userId,
        ctx.serviceId,
        ctx.tool,
        ctx.args,
      );

      let service: ServiceDocument;
      try {
        service = await deps.servicesService.findOne(
          ctx.serviceId,
          user.userId,
          user.role,
        );
      } catch (err) {
        const mapped = nestErrorToMcp(err, { notFoundCode: 'SERVICE_NOT_FOUND' });
        if (mapped) return mapped;
        throw err;
      }

      const dto = service.toObject() as unknown as CallDto;
      const idx = dto.calls.findIndex(
        (c) => c['path'] === ctx.callPath && c['verb'] === ctx.callVerb,
      );
      if (idx < 0) {
        return mcpError(
          'CALL_NOT_FOUND',
          `No call with path "${ctx.callPath}" and verb "${ctx.callVerb}" in service ${ctx.serviceId}`,
        );
      }

      const earlyError = mutate(dto.calls[idx]);
      if (earlyError) return earlyError;

      try {
        const saved = await deps.servicesService.save(
          dto as Record<string, unknown>,
          user.userId,
          user.role,
          { expectedLastChange: ctx.expectedLastChange },
        );
        const mutatedCall =
          (saved.calls ?? [])[idx] as unknown as Record<string, unknown>;
        const payload = buildResult
          ? buildResult(saved, mutatedCall)
          : {
              serviceId: String(saved._id),
              callPath: ctx.callPath,
              callVerb: ctx.callVerb,
              lastChange: saved.lastChange,
            };
        return mcpResult(payload);
      } catch (err) {
        if ((err as { name?: string }).name === 'StaleVersionException') {
          const e = err as { currentLastChange: number };
          return mcpError(
            'STALE_VERSION',
            'Service was modified since the expected version. Re-fetch with get_service and retry with the new lastChange.',
            { currentLastChange: e.currentLastChange },
          );
        }
        const mapped = nestErrorToMcp(err);
        if (mapped) return mapped;
        throw err;
      }
    },
  );
}
