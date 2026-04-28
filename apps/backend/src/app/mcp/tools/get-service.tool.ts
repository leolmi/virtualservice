import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AuthenticatedUser } from '../../auth/interfaces/request-with-user.interface';
import { mcpResult, nestErrorToMcp } from './_helpers';
import { ToolDeps } from './_tool-deps';

/**
 * Tool MCP `get_service` — vista lightweight di un servizio.
 *
 * Per il dettaglio completo della singola call usare `get_call`.
 */
export function registerGetService(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'get_service',
    {
      title: 'Get service',
      description:
        'Returns the lightweight view of a service: top-level fields (name, description, path, active, dbo, schedulerFn, interval, timestamps) and a compact call list (only path/verb/description per call). Use get_call for a single call detail.',
      inputSchema: {
        id: z.string().min(1).describe('Service _id'),
      },
    },
    async ({ id }) => {
      try {
        const service = await deps.servicesService.findOne(
          id,
          user.userId,
          user.role,
        );
        return mcpResult({
          id: String(service._id),
          name: service.name,
          description: service.description,
          path: service.path,
          active: service.active,
          starred: service.starred,
          dbo: service.dbo,
          schedulerFn: service.schedulerFn,
          interval: service.interval,
          creationDate: service.creationDate,
          lastChange: service.lastChange,
          calls: (service.calls ?? []).map((c) => ({
            path: c.path,
            verb: c.verb,
            description: c.description,
          })),
        });
      } catch (err) {
        const mapped = nestErrorToMcp(err, { notFoundCode: 'SERVICE_NOT_FOUND' });
        if (mapped) return mapped;
        throw err;
      }
    },
  );
}
