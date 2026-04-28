/**
 * Stringa `instructions` passata all'`McpServer` al boot. Caricata da Claude
 * (o altri client MCP) durante l'handshake e tenuta nel context per tutta la
 * sessione.
 *
 * Pensata come **indice operativo** (~1-2KB): nomi puntuali e sintassi
 * essenziale, con rinvio esplicito alle resources `vs://reference/*` per
 * ogni dettaglio. Ogni espansione che porti questa stringa sopra i 2KB va
 * spostata su una resource dedicata.
 */
export const VS_INSTRUCTIONS = `
You are connected to VirtualService — an authoring backend for mock web services.
Use the tools below to **create / edit / inspect** the user's mocks. Mocks are
**served** under \`/service/<path>/...\` and are NOT consumed via MCP except for
debug via \`invoke_call\`.

## When you write JS expressions

Every \`response\`, \`dbo\`, \`schedulerFn\`, and rule \`expression\` is a
JavaScript snippet evaluated in a sandboxed worker.

**Read \`vs://reference/expressions\` BEFORE writing any expression** — it is
the canonical reference. Below is the index only.

Variables in scope:
- \`params\` (query-string), \`data\` (body), \`db\` (shared in-memory store),
  \`headers\` (case-insensitive), \`cookies\`, \`pathValue\` (path placeholders).
- \`value\` is present **only inside rules.expression**.

Globals:
- \`_\` — full lodash 4.x.
- \`samples\` — built-in datasets (Northwind, countries, lorem, …). See
  \`vs://reference/samples\` for the schema; many simple mocks need no \`dbo\`
  at all and can return \`samples.*\` directly.
- \`guid(mask?)\` — random hex token.
- \`setTimeout\` — standard Node setTimeout.

Available **only in \`response\`**:
- \`setExitCode(code)\` — override success status code.
- \`throwError(message, code = 500)\` — abort with a clean HTTP status.

Three writing modes (auto-detected by prefix):
- \`= expr\` — single expression, return value automatic.
- \`{...}\` or \`[...]\` — JSON-literal, implicit \`return\`.
- otherwise — full function body, must use explicit \`return\`.

## Workflow tips

- Call \`get_workspace_info\` at session start to see user, stats, limits, and
  the full list of MCP resources you can read.
- \`list_services\` returns a compact view; use \`get_service\` for the call
  list of a specific service and \`get_call\` for full call detail.
- Path uniqueness is **global**. On \`PATH_TAKEN\`, the error carries
  \`details.suggested\` you can offer to the user.
- All mutating tools support **optimistic locking** via \`expectedUpdatedAt\`.
  On \`STALE_VERSION\`, re-fetch and confirm with the user before retrying.
- Snapshots are kept automatically before each mutation; use
  \`list_history\` and \`restore_snapshot\` to recover.

## Reference resources (read on demand)

- \`vs://reference/expressions\` — JS scope, helpers, syntax, pattern catalog.
- \`vs://reference/samples\` — built-in dataset shapes.
- \`vs://reference/error-codes\` — structured error catalog with recovery hints.
- \`vs://reference/best-practices\` — authoring conventions (placeholder).
`.trim();
