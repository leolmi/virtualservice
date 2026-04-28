export interface McpToolEntry {
  name: string;
  description: string;
}

export interface McpToolGroup {
  title: string;
  hint?: string;
  tools: McpToolEntry[];
}

/**
 * Catalogo dei tool MCP esposti dall'endpoint `/mcp`.
 *
 * Mostrato come documentazione utente sulla pagina "API & MCP" — riflette
 * fedelmente i tool registrati in `apps/backend/src/app/mcp/mcp-server.factory.ts`.
 * In caso di aggiunta/rimozione di un tool, aggiornare anche questa lista.
 */
export const MCP_TOOL_GROUPS: McpToolGroup[] = [
  {
    title: 'Bootstrap',
    hint: 'Call this once at the start of a session to get user info, limits, and the list of reference resources.',
    tools: [
      {
        name: 'get_workspace_info',
        description:
          'Returns user/admin flag, services and API keys counts, operational limits, server version, MCP protocol version, and the list of available `vs://reference/*` resources.',
      },
    ],
  },
  {
    title: 'Inspect — services and templates',
    tools: [
      { name: 'list_services', description: 'Compact list of your mock services.' },
      { name: 'get_service', description: 'Lightweight view of a service (top-level fields + call summary). Use get_call for full call detail.' },
      { name: 'get_call', description: 'Full ServiceCall structure for a specific call (path, verb, response, rules, parameters, headers, cookies).' },
      { name: 'get_logs', description: 'Mock-call log entries for a service. Supports limit, since (cursor), pathFilter.' },
      { name: 'search_templates', description: 'Merged catalog of system + community templates with optional title/tag filter.' },
      { name: 'get_template', description: 'Full template structure (calls, dbo, schedulerFn, interval, source).' },
    ],
  },
  {
    title: 'Recovery (snapshots)',
    hint: 'Each MCP mutation captures a service snapshot if none exists from the last hour. Snapshots auto-expire after 24h.',
    tools: [
      { name: 'list_history', description: 'List snapshots for a service (one per session).' },
      { name: 'restore_snapshot', description: 'Restore a service from a snapshot.' },
    ],
  },
  {
    title: 'Authoring — service top-level',
    hint: 'Mutations support optimistic locking via `expectedLastChange` (from get_service).',
    tools: [
      { name: 'create_service', description: 'Create a new service. On path collision returns PATH_TAKEN with a `details.suggested` alternative.' },
      { name: 'update_service', description: 'Update top-level scalar fields only (no calls).' },
      { name: 'delete_service', description: 'Delete a service. `dryRun: true` previews impact (callsCount, logsCount) without writing.' },
      { name: 'clone_service', description: 'Duplicate an existing service into a new path; rules get fresh uuids on save.' },
    ],
  },
  {
    title: 'Authoring — call CRUD',
    tools: [
      { name: 'add_call', description: 'Append a new call to a service. (path, verb) must be unique within the service.' },
      { name: 'update_call', description: 'Update scalar fields of a call (path, verb, description, response, file, respType, body). Identified by (path, verb).' },
      { name: 'remove_call', description: 'Remove a call from a service.' },
    ],
  },
  {
    title: 'Authoring — atomic editing of rules / params / headers / cookies',
    hint: 'Rules are identified by `id` (uuid v4 generated on first save). Params/headers/cookies are identified by `name`.',
    tools: [
      { name: 'add_rule', description: 'Append a rule to a call.' },
      { name: 'update_rule', description: 'Update a rule (by id) on a call.' },
      { name: 'remove_rule', description: 'Remove a rule (by id) from a call.' },
      { name: 'add_param', description: 'Append a parameter to a call.' },
      { name: 'update_param', description: 'Update a parameter (by name) on a call.' },
      { name: 'remove_param', description: 'Remove a parameter (by name) from a call.' },
      { name: 'add_header', description: 'Add a response header to a call.' },
      { name: 'update_header', description: 'Update the value of an existing response header.' },
      { name: 'remove_header', description: 'Remove a response header from a call.' },
      { name: 'add_cookie', description: 'Add a response cookie to a call.' },
      { name: 'update_cookie', description: 'Update the value of an existing response cookie.' },
      { name: 'remove_cookie', description: 'Remove a response cookie from a call.' },
    ],
  },
  {
    title: 'Import — OpenAPI',
    hint: 'In production, `import_from_openapi_url` enforces an SSRF guard (blocks private/loopback IPs). If the URL is not reachable use `import_from_openapi_content` and pass the document body directly.',
    tools: [
      { name: 'import_from_openapi_url', description: 'Fetch an OpenAPI 2.x/3.x JSON or YAML from a URL and create a new service. `dryRun` available.' },
      { name: 'import_from_openapi_content', description: 'Same, but accepts the document inline as `content` string.' },
    ],
  },
  {
    title: 'Templates write',
    tools: [
      { name: 'install_template', description: 'Install a template (system or community) into a new service. Returns the call list as a usage doc.' },
    ],
  },
  {
    title: 'Verify / debug',
    tools: [
      { name: 'invoke_call', description: 'HTTP loopback to one of your mock calls. Path placeholders are substituted with `pathValues`. The call is tagged `mcp: true` in the monitor log.' },
      { name: 'restart_service', description: 'Reset the in-memory `dbo` cache and restart the `schedulerFn` timer of a service.' },
    ],
  },
];
