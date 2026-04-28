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
 * Tool MCP `restore_snapshot` — ripristina un service da snapshot.
 *
 * Operazione di scrittura, registrata su `mcp-audit`. Lo snapshot ricevuto
 * sostituisce il contenuto del service (manteniamo `_id`/`owner`/`creationDate`).
 * Se il service originale è stato cancellato, viene re-inserito con un nuovo
 * `_id` (lo `_id` originale non si reusa una volta eliminato dal DB).
 */
export function registerRestoreSnapshot(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'restore_snapshot',
    {
      title: 'Restore snapshot',
      description:
        'Restores a service to the state captured in a snapshot. The snapshot must belong to the current user. Returns the id of the restored (or recreated) service. Note: if the original service was deleted, restore re-inserts it; if its path is now used by a different service, the restore fails with PATH_TAKEN.',
      inputSchema: {
        snapshotId: z.string().min(1),
      },
    },
    async ({ snapshotId }) => {
      const args = { snapshotId };
      return withMutationAudit(
        {
          tool: 'restore_snapshot',
          args,
          user,
          apiKeyId: deps.apiKeyId,
          audit: deps.auditService,
        },
        async () => {
          try {
            const out = await deps.snapshotService.restore(
              snapshotId,
              user.userId,
              user.role,
            );
            return mcpResult(out);
          } catch (err) {
            const mapped = nestErrorToMcp(err, {
              notFoundCode: 'SNAPSHOT_NOT_FOUND',
            });
            if (mapped) return mapped;
            if (isMongoDuplicateKey(err)) {
              return mcpError(
                'PATH_TAKEN',
                'The original path is already in use by another service. Rename or delete the conflicting service before restoring.',
              );
            }
            throw err;
          }
        },
      );
    },
  );
}
