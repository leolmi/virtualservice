import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AuthenticatedUser } from '../../auth/interfaces/request-with-user.interface';
import {
  mcpError,
  mcpResult,
  nestErrorToMcp,
  withMutationAudit,
} from './_helpers';
import { ToolDeps } from './_tool-deps';
import { HTTP_VERBS } from './_schemas';

/**
 * Tool MCP `remove_call` — elimina una call dal service.
 *
 * Identifica la call per `path + verb`. Optimistic locking opzionale.
 */
export function registerRemoveCall(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'remove_call',
    {
      title: 'Remove call',
      description:
        "Removes a call from a service. Identified by `callPath` + `callVerb`. Optimistic locking via `expectedLastChange`. Captures a snapshot before the mutation when none from the last hour exists.",
      inputSchema: {
        serviceId: z.string().min(1),
        callPath: z.string(),
        callVerb: z.enum(HTTP_VERBS),
        expectedLastChange: z.number().int().optional(),
      },
    },
    async (input) => {
      const args = input;
      return withMutationAudit(
        {
          tool: 'remove_call',
          args,
          user,
          apiKeyId: deps.apiKeyId,
          audit: deps.auditService,
        },
        async () => {
          await deps.snapshotService.captureBeforeMutation(
            user.userId,
            input.serviceId,
            'remove_call',
            args,
          );

          let service;
          try {
            service = await deps.servicesService.findOne(
              input.serviceId,
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

          const dto = service.toObject() as unknown as {
            calls: Array<Record<string, unknown>>;
            [key: string]: unknown;
          };
          const idx = dto.calls.findIndex(
            (c) => c['path'] === input.callPath && c['verb'] === input.callVerb,
          );
          if (idx < 0) {
            return mcpError(
              'CALL_NOT_FOUND',
              `No call with path "${input.callPath}" and verb "${input.callVerb}" in service ${input.serviceId}`,
            );
          }

          dto.calls.splice(idx, 1);

          try {
            const saved = await deps.servicesService.save(
              dto as Record<string, unknown>,
              user.userId,
              user.role,
              { expectedLastChange: input.expectedLastChange },
            );
            return mcpResult({
              serviceId: String(saved._id),
              removed: { path: input.callPath, verb: input.callVerb },
              callsCount: saved.calls?.length ?? 0,
              lastChange: saved.lastChange,
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
            const mapped = nestErrorToMcp(err);
            if (mapped) return mapped;
            throw err;
          }
        },
      );
    },
  );
}
