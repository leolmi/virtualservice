import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AuthenticatedUser } from '../../auth/interfaces/request-with-user.interface';
import { mcpError, mcpResult, nestErrorToMcp } from './_helpers';
import { ToolDeps } from './_tool-deps';
import { HTTP_VERBS } from './_schemas';

const DEFAULT_PORT = 3000;
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Sostituisce i marcatori `{name}` nel call.path con i valori passati
 * dall'agente. Throws se manca un valore.
 */
function substitutePathPlaceholders(
  callPath: string,
  pathValues: Record<string, string | number | boolean>,
): string {
  return callPath.replace(/\{(\w+)\}/g, (_, name: string) => {
    const v = pathValues[name];
    if (v === undefined || v === null) {
      throw new Error(`Missing pathValue for "{${name}}"`);
    }
    return encodeURIComponent(String(v));
  });
}

/**
 * Tool MCP `invoke_call` — esegue una **HTTP loopback** verso il proprio
 * mock service per debug/verifica.
 *
 * La request passa per il `MockServerController` reale (con path matching,
 * rules, response, logging) — quindi è il modo più realistico di simulare
 * cosa farebbe il client che l'utente sta sviluppando. La request è
 * marcata con header interno `X-Vs-Mcp: 1`: il `MockServerService` la tagga
 * `mcp: true` nel log e la `ThrottlerModule` skippa il bucket `'service'`
 * per non doppiare il limite (il `'mcp'` lato MCP fa già da guardrail).
 */
export function registerInvokeCall(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'invoke_call',
    {
      title: 'Invoke a mock call (HTTP loopback)',
      description:
        "Performs an HTTP loopback to one of the user's mock services for debug/verification. Path placeholders (`{name}`) in `callPath` are substituted with `pathValues`. Headers and body are forwarded; an internal `X-Vs-Mcp: 1` is added so the call is tagged as MCP-originated in the monitor log and the service-throttle is bypassed. Returns the actual HTTP status, headers, and body.",
      inputSchema: {
        serviceId: z.string().min(1),
        callPath: z.string(),
        callVerb: z.enum(HTTP_VERBS),
        pathValues: z
          .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
          .optional(),
        params: z
          .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
          .optional(),
        body: z.unknown().optional(),
        headers: z.record(z.string(), z.string()).optional(),
        timeoutMs: z.number().int().positive().max(60_000).optional(),
      },
    },
    async (input) => {
      // Verifica ownership e recupera il path del service
      let service;
      try {
        service = await deps.servicesService.findOne(
          input.serviceId,
          user.userId,
          user.role,
        );
      } catch (err) {
        const mapped = nestErrorToMcp(err, { notFoundCode: 'SERVICE_NOT_FOUND' });
        if (mapped) return mapped;
        throw err;
      }

      // Sostituisci i placeholder nel call path
      let resolvedCallPath: string;
      try {
        resolvedCallPath = substitutePathPlaceholders(
          input.callPath,
          input.pathValues ?? {},
        );
      } catch (err) {
        return mcpError('VALIDATION_FAILED', (err as Error).message);
      }

      // Costruisci URL loopback
      const port = parseInt(
        deps.config.get<string>('PORT') ?? String(DEFAULT_PORT),
        10,
      );
      const cleanCallPath = resolvedCallPath.replace(/^\/+/, '');
      const url = new URL(
        `http://127.0.0.1:${port}/service/${service.path}/${cleanCallPath}`,
      );
      for (const [k, v] of Object.entries(input.params ?? {})) {
        url.searchParams.append(k, String(v));
      }

      // Headers: X-Vs-Mcp + content-type se body è oggetto/array senza tipo esplicito
      const userHeaders = input.headers ?? {};
      const headers: Record<string, string> = { ...userHeaders, 'X-Vs-Mcp': '1' };
      let bodyToSend: string | undefined;
      if (input.body !== undefined && input.body !== null) {
        if (typeof input.body === 'string') {
          bodyToSend = input.body;
        } else {
          bodyToSend = JSON.stringify(input.body);
          const hasContentType = Object.keys(userHeaders).some(
            (k) => k.toLowerCase() === 'content-type',
          );
          if (!hasContentType) {
            headers['Content-Type'] = 'application/json';
          }
        }
      }

      // Esegui la request con timeout
      const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const startedAt = Date.now();

      try {
        const response = await fetch(url, {
          method: input.callVerb,
          headers,
          body: bodyToSend,
          signal: controller.signal,
        });

        const responseText = await response.text();
        let parsedBody: unknown;
        try {
          parsedBody = responseText.length > 0 ? JSON.parse(responseText) : null;
        } catch {
          parsedBody = responseText;
        }

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((v, k) => {
          responseHeaders[k] = v;
        });

        return mcpResult({
          url: url.toString(),
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          body: parsedBody,
          elapsedMs: Date.now() - startedAt,
        });
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') {
          return mcpError(
            'INTERNAL_ERROR',
            `Loopback request timed out after ${timeoutMs}ms`,
            { url: url.toString() },
          );
        }
        return mcpError(
          'INTERNAL_ERROR',
          `Loopback request failed: ${(err as Error).message}`,
          { url: url.toString() },
        );
      } finally {
        clearTimeout(timer);
      }
    },
  );
}
