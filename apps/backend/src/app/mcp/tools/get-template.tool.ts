import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AuthenticatedUser } from '../../auth/interfaces/request-with-user.interface';
import { mcpError, mcpResult, nestErrorToMcp } from './_helpers';
import { ToolDeps } from './_tool-deps';

/**
 * Tool MCP `get_template` — dettaglio completo del template.
 *
 * Cerca prima nei system templates (id stabile string), poi nei community
 * (id = ObjectId). Restituisce sempre il `source` per disambiguare.
 */
export function registerGetTemplate(
  server: McpServer,
  _user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'get_template',
    {
      title: 'Get template',
      description:
        'Returns the full template structure (calls, dbo, schedulerFn, interval, tags, etc.) for either a system or community template. Looks up `id` in system templates first, then community.',
      inputSchema: {
        id: z.string().min(1),
      },
    },
    async ({ id }) => {
      // System templates: id stringa stabile
      const sys = deps.systemTemplates.findById(id);
      if (sys) {
        return mcpResult({
          id: sys.id,
          title: sys.title,
          description: sys.description,
          tags: sys.tags ?? [],
          source: sys.source,
          ownerEmail: sys.ownerEmail,
          calls: sys.calls,
          dbo: sys.dbo ?? '',
          schedulerFn: sys.schedulerFn ?? '',
          interval: sys.interval ?? 0,
          installs: sys.installs,
        });
      }

      // Community: id = ObjectId string
      try {
        const tpl = await deps.templatesService.findOne(id);
        return mcpResult({
          id: String(tpl._id),
          title: tpl.title,
          description: tpl.description,
          tags: tpl.tags ?? [],
          source: 'community',
          ownerId: tpl.ownerId,
          ownerEmail: tpl.ownerEmail,
          calls: tpl.calls,
          dbo: tpl.dbo ?? '',
          schedulerFn: tpl.schedulerFn ?? '',
          interval: tpl.interval ?? 0,
          installs: tpl.installs,
          creationDate: tpl.creationDate,
        });
      } catch (err) {
        const mapped = nestErrorToMcp(err);
        if (mapped) {
          // Sia community che system non lo hanno → not found di alto livello
          return mcpError('NOT_FOUND', `Template not found: ${id}`);
        }
        throw err;
      }
    },
  );
}
