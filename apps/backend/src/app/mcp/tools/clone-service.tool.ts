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

/**
 * Tool MCP `clone_service` — duplica un service esistente in un altro path.
 *
 * Il nuovo service ha un `_id` nuovo; le rules ricevono uuid v4 freschi al
 * primo save (pre-save hook). Validazione path identica a `create_service`:
 * su `PATH_TAKEN` ritorna `details.suggested`.
 */
export function registerCloneService(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'clone_service',
    {
      title: 'Clone service',
      description:
        "Duplicates an existing service of the current user into a new one with the given `newPath`. Optionally renames it via `newName` (defaults to the source name). Rules in the cloned calls receive fresh uuids on save. On path conflict returns PATH_TAKEN with `details.suggested`.",
      inputSchema: {
        sourceId: z.string().min(1),
        newPath: z.string().min(1),
        newName: z.string().optional(),
      },
    },
    async (input) => {
      const args = input;
      return withMutationAudit(
        {
          tool: 'clone_service',
          args,
          user,
          apiKeyId: deps.apiKeyId,
          audit: deps.auditService,
        },
        async () => {
          let source;
          try {
            source = await deps.servicesService.findOne(
              input.sourceId,
              user.userId,
              user.role,
            );
          } catch (err) {
            const mapped = nestErrorToMcp(err, {
              notFoundCode: 'SERVICE_NOT_FOUND',
            });
            if (mapped) return mapped;
            throw err;
          }

          // Calls con id rules azzerati: il pre-save hook li rigenera.
          const calls = (source.calls ?? []).map((c) => {
            const obj = (c as { toObject?: () => unknown }).toObject?.() ?? c;
            const plain = JSON.parse(JSON.stringify(obj)) as {
              rules?: { id?: string }[];
            };
            for (const rule of plain.rules ?? []) {
              delete rule.id;
            }
            return plain;
          });

          const dto: Record<string, unknown> = {
            name: (input.newName ?? source.name).trim(),
            description: source.description,
            path: input.newPath.trim(),
            active: source.active,
            starred: false,
            dbo: source.dbo,
            schedulerFn: source.schedulerFn,
            interval: source.interval,
            calls,
          };

          try {
            const created = await deps.servicesService.save(
              dto,
              user.userId,
              user.role,
            );
            return mcpResult({
              newServiceId: String(created._id),
              name: created.name,
              path: created.path,
              callsCount: created.calls?.length ?? 0,
              lastChange: created.lastChange,
            });
          } catch (err) {
            if (isMongoDuplicateKey(err)) {
              const suggested = await deps.servicesService.suggestPath(
                input.newPath,
              );
              return mcpError(
                'PATH_TAKEN',
                `Service path "${input.newPath}" is already in use`,
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
