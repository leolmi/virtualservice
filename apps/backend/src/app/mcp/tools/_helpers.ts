import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

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
