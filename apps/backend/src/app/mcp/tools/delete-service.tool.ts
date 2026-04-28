import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AuthenticatedUser } from '../../auth/interfaces/request-with-user.interface';
import {
  mcpResult,
  nestErrorToMcp,
  withMutationAudit,
} from './_helpers';
import { ToolDeps } from './_tool-deps';

/**
 * Tool MCP `delete_service` — elimina un service.
 *
 * Modalità `dryRun`: senza scrivere nulla, ritorna una preview della
 * cancellazione (`name`, `callsCount`, `logsCount`) per dare all'agente
 * materiale per chiedere conferma all'utente.
 *
 * In modalità reale: cattura snapshot, poi elimina. Audit registrato.
 */
export function registerDeleteService(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'delete_service',
    {
      title: 'Delete service',
      description:
        "Deletes a service permanently. Use `dryRun: true` to preview the impact (returns the service name, calls count, and number of associated log rows) without writing. The actual deletion captures a snapshot first when none from the last hour exists.",
      inputSchema: {
        id: z.string().min(1),
        dryRun: z.boolean().optional(),
      },
    },
    async (input) => {
      const args = input;
      const isDryRun = !!input.dryRun;

      // Dry-run: niente snapshot/audit perché non muta nulla.
      if (isDryRun) {
        try {
          const service = await deps.servicesService.findOne(
            input.id,
            user.userId,
            user.role,
          );
          const logs = await deps.logService.findByService(
            input.id,
            user.userId,
            undefined,
            user.role,
          );
          return mcpResult({
            dryRun: true,
            id: String(service._id),
            name: service.name,
            path: service.path,
            callsCount: service.calls?.length ?? 0,
            logsCount: logs.length,
          });
        } catch (err) {
          const mapped = nestErrorToMcp(err, {
            notFoundCode: 'SERVICE_NOT_FOUND',
          });
          if (mapped) return mapped;
          throw err;
        }
      }

      return withMutationAudit(
        {
          tool: 'delete_service',
          args,
          user,
          apiKeyId: deps.apiKeyId,
          audit: deps.auditService,
        },
        async () => {
          await deps.snapshotService.captureBeforeMutation(
            user.userId,
            input.id,
            'delete_service',
            args,
          );

          try {
            await deps.servicesService.remove(
              input.id,
              user.userId,
              user.role,
            );
            return mcpResult({ deleted: true, id: input.id });
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
