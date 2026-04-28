import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AuthenticatedUser } from '../../auth/interfaces/request-with-user.interface';
import { mcpResult } from './_helpers';
import { ToolDeps } from './_tool-deps';

interface TemplateSearchItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  callsCount: number;
  source: 'community' | 'system';
}

/**
 * Tool MCP `search_templates` — gallery merge community (DB) + system
 * (immutabili, caricati al boot da `assets/system-templates/`).
 *
 * Ricerca testuale case-insensitive su `title` e `tags`. Senza query
 * restituisce tutti i template.
 */
export function registerSearchTemplates(
  server: McpServer,
  _user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'search_templates',
    {
      title: 'Search templates',
      description:
        'Returns the merged catalog of community templates (DB) and system templates (immutable, bundled with the server). Each entry contains: id, title, description, tags, callsCount, source. Optional `query` filters by title/tag match (case-insensitive substring).',
      inputSchema: {
        query: z.string().optional(),
      },
    },
    async ({ query }) => {
      const community = await deps.templatesService.findAll();
      const system = deps.systemTemplates.list();

      const all: TemplateSearchItem[] = [
        ...system.map<TemplateSearchItem>((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          tags: t.tags ?? [],
          callsCount: Array.isArray(t.calls) ? t.calls.length : 0,
          source: 'system',
        })),
        ...community.map<TemplateSearchItem>((t) => ({
          id: String(t._id),
          title: t.title,
          description: t.description,
          tags: t.tags ?? [],
          callsCount: Array.isArray(t.calls) ? t.calls.length : 0,
          source: 'community',
        })),
      ];

      const needle = query?.trim().toLowerCase();
      const items = needle
        ? all.filter(
            (t) =>
              t.title.toLowerCase().includes(needle) ||
              t.tags.some((tag) => tag.toLowerCase().includes(needle)),
          )
        : all;

      return mcpResult({ items });
    },
  );
}
