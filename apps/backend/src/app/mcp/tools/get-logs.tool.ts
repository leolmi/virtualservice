import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AuthenticatedUser } from '../../auth/interfaces/request-with-user.interface';
import { mcpResult, nestErrorToMcp } from './_helpers';
import { ToolDeps } from './_tool-deps';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

/**
 * Tool MCP `get_logs` — log delle invocazioni mock per un servizio.
 *
 * Per i log corposi (es. body grandi) si confida nei truncate naturali del
 * `request-logger` middleware; ulteriore filtering può essere fatto via
 * `pathFilter`.
 */
export function registerGetLogs(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'get_logs',
    {
      title: 'Get logs',
      description:
        'Returns mock-call logs for a service. Sorted by time desc. Supports limit (default 100, max 500), since (epoch ms cursor — only logs with time >= since), and pathFilter (substring match on the request path of each log).',
      inputSchema: {
        serviceId: z.string().min(1),
        limit: z.number().int().positive().max(MAX_LIMIT).optional(),
        since: z.number().int().nonnegative().optional(),
        pathFilter: z.string().optional(),
      },
    },
    async ({ serviceId, limit, since, pathFilter }) => {
      try {
        // Verifica ownership rispettando admin role
        await deps.servicesService.findOne(serviceId, user.userId, user.role);

        const all = await deps.logService.findByService(
          serviceId,
          user.userId,
          since,
          user.role,
        );

        let filtered = all;
        if (pathFilter && pathFilter.trim()) {
          const needle = pathFilter.trim().toLowerCase();
          filtered = all.filter((log) => {
            const req = log.request as { url?: string; path?: string } | undefined;
            const url = (req?.url ?? req?.path ?? '').toLowerCase();
            return url.includes(needle);
          });
        }

        const cap = limit ?? DEFAULT_LIMIT;
        const items = filtered.slice(0, cap).map((log) => ({
          time: log.time,
          serviceId: log.serviceId,
          owner: log.owner,
          elapsed: log.elapsed,
          error: log.error,
          request: log.request,
          response: log.response,
          call: log.call,
        }));

        return mcpResult({
          serviceId,
          totalMatched: filtered.length,
          returned: items.length,
          items,
        });
      } catch (err) {
        const mapped = nestErrorToMcp(err, { notFoundCode: 'SERVICE_NOT_FOUND' });
        if (mapped) return mapped;
        throw err;
      }
    },
  );
}
