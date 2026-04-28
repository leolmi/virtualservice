import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AuthenticatedUser } from '../../auth/interfaces/request-with-user.interface';
import { mcpResult, nestErrorToMcp, withMutationAudit } from './_helpers';
import { ToolDeps } from './_tool-deps';

/**
 * Tool MCP `restart_service` — reset della cache `dbo` + restart dello
 * `schedulerFn` di un service. Usato dopo modifiche al `dbo` per ripartire
 * dallo stato pulito.
 *
 * Operazione di "scrittura logica" (l'effetto è in-memory sul cache),
 * registrata su `mcp-audit`. Non genera snapshot perché non muta dati
 * persistenti.
 */
export function registerRestartService(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'restart_service',
    {
      title: 'Restart service cache',
      description:
        "Resets the in-memory cache (`dbo`) and restarts the `schedulerFn` timer of a service. Use after editing `dbo` or `schedulerFn` to make changes take effect immediately. Does NOT modify any persisted data.",
      inputSchema: {
        id: z.string().min(1),
      },
    },
    async (input) => {
      const args = input;
      return withMutationAudit(
        {
          tool: 'restart_service',
          args,
          user,
          apiKeyId: deps.apiKeyId,
          audit: deps.auditService,
        },
        async () => {
          try {
            await deps.servicesService.restart(
              input.id,
              user.userId,
              user.role,
            );
            return mcpResult({ restarted: true, id: input.id });
          } catch (err) {
            const mapped = nestErrorToMcp(err, {
              notFoundCode: 'SERVICE_NOT_FOUND',
            });
            if (mapped) return mapped;
            throw err;
          }
        },
      );
    },
  );
}
