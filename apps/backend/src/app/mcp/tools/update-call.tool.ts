import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AuthenticatedUser } from '../../auth/interfaces/request-with-user.interface';
import {
  mcpError,
  mcpResult,
  nestErrorToMcp,
  withMutationAudit,
} from './_helpers';
import { ToolDeps } from './_tool-deps';
import { callScalarPatch, HTTP_VERBS } from './_schemas';

/**
 * Tool MCP `update_call` — modifica i soli campi scalari di una call.
 *
 * **Non tocca array** (rules, parameters, headers, cookies): per quelli
 * usare i tool atomici di slice 7. La call è identificata per `path + verb`
 * (più stabile dell'indice). Se il patch cambia path/verb, viene verificata
 * l'unicità della nuova coppia.
 */
export function registerUpdateCall(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'update_call',
    {
      title: 'Update call (scalars only)',
      description:
        "Updates the scalar fields of a call (path, verb, description, response, file, respType, body) identified by current `callPath` + `callVerb`. Does NOT touch arrays (rules, parameters, headers, cookies) — use the atomic tools for those. Optimistic locking via `expectedLastChange`.",
      inputSchema: {
        serviceId: z.string().min(1),
        callPath: z.string(),
        callVerb: z.enum(HTTP_VERBS),
        patch: z.object(callScalarPatch),
        expectedLastChange: z.number().int().optional(),
      },
    },
    async (input) => {
      const args = input;
      return withMutationAudit(
        {
          tool: 'update_call',
          args,
          user,
          apiKeyId: deps.apiKeyId,
          audit: deps.auditService,
        },
        async () => {
          await deps.snapshotService.captureBeforeMutation(
            user.userId,
            input.serviceId,
            'update_call',
            args,
          );

          let service;
          try {
            service = await deps.servicesService.findOne(
              input.serviceId,
              user.userId,
              user.role,
            );
          } catch (err) {
            const mapped = nestErrorToMcp(err, {
              notFoundCode: 'SERVICE_NOT_FOUND',
            });
            if (mapped) return mapped;
            throw err;
          }

          const dto = service.toObject() as unknown as {
            calls: Array<Record<string, unknown>>;
            [key: string]: unknown;
          };
          const idx = dto.calls.findIndex(
            (c) => c['path'] === input.callPath && c['verb'] === input.callVerb,
          );
          if (idx < 0) {
            return mcpError(
              'CALL_NOT_FOUND',
              `No call with path "${input.callPath}" and verb "${input.callVerb}" in service ${input.serviceId}`,
            );
          }

          const merged = { ...dto.calls[idx], ...input.patch };
          if (input.patch.path !== undefined) {
            merged['path'] = input.patch.path.trim();
          }

          // Se path o verb sono cambiati, controlla collisioni con altre call
          const newPath = (merged['path'] as string) ?? input.callPath;
          const newVerb = (merged['verb'] as string) ?? input.callVerb;
          if (newPath !== input.callPath || newVerb !== input.callVerb) {
            const collides = dto.calls.some(
              (c, i) =>
                i !== idx && c['path'] === newPath && c['verb'] === newVerb,
            );
            if (collides) {
              return mcpError(
                'VALIDATION_FAILED',
                `Cannot rename: a call with path "${newPath}" and verb "${newVerb}" already exists in this service`,
              );
            }
          }

          dto.calls[idx] = merged;

          try {
            const saved = await deps.servicesService.save(
              dto as Record<string, unknown>,
              user.userId,
              user.role,
              { expectedLastChange: input.expectedLastChange },
            );
            const updated = (saved.calls ?? [])[idx];
            return mcpResult({
              serviceId: String(saved._id),
              updatedCall: updated
                ? {
                    path: updated.path,
                    verb: updated.verb,
                    description: updated.description,
                  }
                : null,
              lastChange: saved.lastChange,
            });
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
    },
  );
}
