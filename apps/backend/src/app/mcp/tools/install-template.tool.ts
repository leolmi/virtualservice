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
 * Tool MCP `install_template` — installa un template (system o community)
 * creando un nuovo service per l'utente corrente.
 *
 * Lookup ordering: prima system (id stabile string), poi community (ObjectId).
 * Su path conflict ritorna `PATH_TAKEN` con `details.suggested`.
 *
 * Il payload di ritorno include la lista delle call installate (`{ path, verb,
 * description }`) per dare all'agente la "documentazione d'uso" del mock
 * appena creato.
 */
export function registerInstallTemplate(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'install_template',
    {
      title: 'Install template',
      description:
        "Installs a template (system or community) into a new service for the current user. The new service inherits the template's calls, dbo, schedulerFn and interval. Returns the new serviceId and the call list to use as a usage doc. On path conflict returns PATH_TAKEN with `details.suggested`.",
      inputSchema: {
        id: z.string().min(1),
        path: z.string().min(1),
        name: z.string().optional(),
      },
    },
    async (input) => {
      const args = input;
      return withMutationAudit(
        {
          tool: 'install_template',
          args,
          user,
          apiKeyId: deps.apiKeyId,
          audit: deps.auditService,
        },
        async () => {
          // 1) System template path
          const sys = deps.systemTemplates.findById(input.id);
          if (sys) {
            const dto: Record<string, unknown> = {
              name: (input.name ?? sys.title).trim(),
              description: sys.description,
              starred: false,
              active: true,
              path: input.path.trim(),
              dbo: sys.dbo ?? '',
              schedulerFn: sys.schedulerFn ?? '',
              interval: sys.interval ?? 0,
              calls: sys.calls ?? [],
            };
            try {
              const saved = await deps.servicesService.save(
                dto,
                user.userId,
                user.role,
              );
              return mcpResult({
                serviceId: String(saved._id),
                source: 'system',
                templateId: input.id,
                calls: (saved.calls ?? []).map((c) => ({
                  path: c.path,
                  verb: c.verb,
                  description: c.description,
                })),
                lastChange: saved.lastChange,
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
          }

          // 2) Community template path — delegate to TemplatesService.install
          //    (gestisce internamente l'increment del counter installs).
          try {
            const saved = await deps.templatesService.install(
              input.id,
              user.userId,
              { path: input.path.trim(), name: input.name },
            );
            return mcpResult({
              serviceId: String(saved._id),
              source: 'community',
              templateId: input.id,
              calls: (saved.calls ?? []).map((c) => ({
                path: c.path,
                verb: c.verb,
                description: c.description,
              })),
              lastChange: saved.lastChange,
            });
          } catch (err) {
            // ConflictException ('Path già in uso') → PATH_TAKEN
            if ((err as { name?: string }).name === 'ConflictException') {
              const suggested = await deps.servicesService.suggestPath(
                input.path,
              );
              return mcpError(
                'PATH_TAKEN',
                `Service path "${input.path}" is already in use`,
                { suggested },
              );
            }
            // BadRequest da install (path vuoto o calls vuote) → VALIDATION_FAILED
            // NotFound (community template inesistente) → NOT_FOUND
            const mapped = nestErrorToMcp(err);
            if (mapped) return mapped;
            // Mongo dup-key naked (se la save lo lanciasse)
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
            throw err;
          }
        },
      );
    },
  );
}
