import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AuthenticatedUser } from '../../auth/interfaces/request-with-user.interface';
import { mcpResult } from './_helpers';
import { ToolDeps } from './_tool-deps';

/**
 * Tool MCP `list_services` — vista compatta dei servizi dell'utente.
 */
export function registerListServices(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'list_services',
    {
      title: 'List services',
      description:
        "Returns a compact list of the authenticated user's mock services. Each entry contains: id, name, path, active, callsCount, lastChange (epoch ms). Sorted by lastChange desc. Use get_service for details on a specific entry.",
    },
    async () => {
      const services = await deps.servicesService.findAll(user.userId);
      const items = services.map((s) => ({
        id: String(s._id),
        name: s.name,
        path: s.path,
        active: s.active,
        callsCount: Array.isArray(s.calls) ? s.calls.length : 0,
        lastChange: s.lastChange,
      }));
      return mcpResult({ items });
    },
  );
}
