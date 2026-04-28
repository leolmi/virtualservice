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
import { serviceScalarPatch } from './_schemas';

/**
 * Tool MCP `update_service` — modifica i soli campi scalari del service.
 *
 * **Non tocca `calls`**: per quelle si usano `add_call` / `update_call` /
 * `remove_call` (slice 6) e i tool atomici per rules/params/headers/cookies
 * (slice 7). Optimistic locking opzionale via `expectedLastChange`.
 */
export function registerUpdateService(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'update_service',
    {
      title: 'Update service (scalars only)',
      description:
        "Updates the top-level scalar fields of a service (name, description, path, active, dbo, schedulerFn, interval). Does NOT touch the `calls` array — use add_call / update_call / remove_call for those. Pass `expectedLastChange` (from get_service) to enable optimistic locking; on mismatch returns STALE_VERSION with the current value. Captures a snapshot before the mutation when none from the last hour exists.",
      inputSchema: {
        id: z.string().min(1),
        patch: z.object(serviceScalarPatch),
        expectedLastChange: z.number().int().optional(),
      },
    },
    async (input) => {
      const args = input;
      return withMutationAudit(
        {
          tool: 'update_service',
          args,
          user,
          apiKeyId: deps.apiKeyId,
          audit: deps.auditService,
        },
        async () => {
          await deps.snapshotService.captureBeforeMutation(
            user.userId,
            input.id,
            'update_service',
            args,
          );

          try {
            const dto: Record<string, unknown> = {
              _id: input.id,
              ...input.patch,
            };
            if (input.patch.name !== undefined) {
              dto['name'] = input.patch.name.trim();
            }
            if (input.patch.path !== undefined) {
              dto['path'] = input.patch.path.trim();
            }

            const updated = await deps.servicesService.save(
              dto,
              user.userId,
              user.role,
              { expectedLastChange: input.expectedLastChange },
            );
            return mcpResult({
              id: String(updated._id),
              name: updated.name,
              path: updated.path,
              active: updated.active,
              lastChange: updated.lastChange,
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
            if (isMongoDuplicateKey(err) && input.patch.path) {
              const suggested = await deps.servicesService.suggestPath(
                input.patch.path,
              );
              return mcpError(
                'PATH_TAKEN',
                `Service path "${input.patch.path}" is already in use`,
                { suggested },
              );
            }
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
