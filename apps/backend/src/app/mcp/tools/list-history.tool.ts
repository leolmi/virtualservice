import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AuthenticatedUser } from '../../auth/interfaces/request-with-user.interface';
import { mcpResult } from './_helpers';
import { ToolDeps } from './_tool-deps';

/**
 * Tool MCP `list_history` — snapshot disponibili per un service.
 *
 * Per design (1 slot per (utente, service) + TTL 24h) restituisce 0 o 1
 * entry. Il payload **non** include `content` per non far esplodere il
 * response — usa `restore_snapshot` per applicarlo.
 */
export function registerListHistory(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'list_history',
    {
      title: 'List service history snapshots',
      description:
        'Returns the snapshot(s) available for a specific service of the current user. By design at most one snapshot per (user, service) is kept (1h freshness threshold, 24h TTL). Each entry contains: id, serviceId, tool (which mutation triggered it), args, createdAt. Use restore_snapshot to apply one.',
      inputSchema: {
        serviceId: z.string().min(1),
      },
    },
    async ({ serviceId }) => {
      const items = await deps.snapshotService.list(user.userId, serviceId);
      return mcpResult({
        items: items.map((s) => ({
          id: s.id,
          serviceId: s.serviceId,
          tool: s.tool,
          args: s.args,
          createdAt: s.createdAt.toISOString(),
        })),
      });
    },
  );
}
