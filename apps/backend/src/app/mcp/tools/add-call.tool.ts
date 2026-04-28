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
import { callSchema } from './_schemas';

/**
 * Tool MCP `add_call` — aggiunge una nuova call al service.
 *
 * Validazione di unicità: non si possono avere due call con stessa
 * `(path, verb)` nello stesso service. Optimistic locking opzionale.
 */
export function registerAddCall(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'add_call',
    {
      title: 'Add call',
      description:
        "Appends a new call to a service. The (path, verb) pair must be unique within the service. Optionally accepts `expectedLastChange` (from get_service) for optimistic locking. Captures a snapshot before the mutation when none from the last hour exists.",
      inputSchema: {
        serviceId: z.string().min(1),
        call: callSchema,
        expectedLastChange: z.number().int().optional(),
      },
    },
    async (input) => {
      const args = input;
      return withMutationAudit(
        {
          tool: 'add_call',
          args,
          user,
          apiKeyId: deps.apiKeyId,
          audit: deps.auditService,
        },
        async () => {
          await deps.snapshotService.captureBeforeMutation(
            user.userId,
            input.serviceId,
            'add_call',
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

          const duplicate = (service.calls ?? []).some(
            (c) => c.path === input.call.path && c.verb === input.call.verb,
          );
          if (duplicate) {
            return mcpError(
              'VALIDATION_FAILED',
              `Call ${input.call.verb} ${input.call.path} already exists in service ${input.serviceId}`,
            );
          }

          const dto = service.toObject() as unknown as Record<string, unknown>;
          dto['calls'] = [...((dto['calls'] as unknown[]) ?? []), input.call];

          try {
            const saved = await deps.servicesService.save(
              dto,
              user.userId,
              user.role,
              { expectedLastChange: input.expectedLastChange },
            );
            const added = (saved.calls ?? []).find(
              (c) => c.path === input.call.path && c.verb === input.call.verb,
            );
            return mcpResult({
              serviceId: String(saved._id),
              addedCall: added
                ? {
                    path: added.path,
                    verb: added.verb,
                    description: added.description,
                  }
                : null,
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
