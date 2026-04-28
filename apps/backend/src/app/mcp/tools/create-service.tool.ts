import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AuthenticatedUser } from '../../auth/interfaces/request-with-user.interface';
import {
  isMongoDuplicateKey,
  mcpError,
  mcpResult,
  nestErrorToMcp,
  withMutationAudit,
} from './_helpers';
import { ToolDeps } from './_tool-deps';
import { callSchema } from './_schemas';

/**
 * Tool MCP `create_service` — crea un nuovo service per l'utente corrente.
 *
 * Tutti i sub-elementi sono opzionali: si può creare un service "vuoto" e
 * aggiungere call/dbo/scheduler in seguito (`add_call`, `update_service`).
 * In caso di `path` già preso, la response include `details.suggested` con
 * un'alternativa libera computata server-side.
 */
export function registerCreateService(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'create_service',
    {
      title: 'Create service',
      description:
        "Creates a new mock service for the authenticated user. The path must be globally unique; on conflict the response carries an alternative in `details.suggested`. All sub-elements are optional and can be added later via add_call / update_service. Returns the new service's id and lastChange timestamp.",
      inputSchema: {
        name: z.string().min(1),
        path: z.string().min(1),
        description: z.string().optional(),
        active: z.boolean().optional(),
        dbo: z.string().optional(),
        schedulerFn: z.string().optional(),
        interval: z.number().int().nonnegative().optional(),
        calls: z.array(callSchema).optional(),
      },
    },
    async (input) => {
      const args = input;
      return withMutationAudit(
        {
          tool: 'create_service',
          args,
          user,
          apiKeyId: deps.apiKeyId,
          audit: deps.auditService,
        },
        async () => {
          try {
            const dto: Record<string, unknown> = {
              name: input.name.trim(),
              path: input.path.trim(),
              description: input.description ?? '',
              active: input.active ?? true,
              dbo: input.dbo ?? '',
              schedulerFn: input.schedulerFn ?? '',
              interval: input.interval ?? 0,
              calls: input.calls ?? [],
            };
            const created = await deps.servicesService.save(
              dto,
              user.userId,
              user.role,
            );
            return mcpResult({
              id: String(created._id),
              path: created.path,
              name: created.name,
              lastChange: created.lastChange,
              callsCount: created.calls?.length ?? 0,
            });
          } catch (err) {
            if (isMongoDuplicateKey(err)) {
              const suggested = await deps.servicesService.suggestPath(
                input.path,
              );
              return mcpError(
                'PATH_TAKEN',
                `Service path "${input.path}" is already in use`,
                { suggested },
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
