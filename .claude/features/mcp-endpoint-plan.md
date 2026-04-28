# Piano implementativo — MCP endpoint + API keys

> Compagno operativo di `mcp-endpoint.md` (analisi e decisioni di design).
> Strutturato per **slice verticali** ordinate per dipendenze. Ogni slice deve lasciare il branch in stato deployabile.

## Slice 0 — Foundations

Lavoro parallelizzabile sulle shared libs.

- `libs/shared/model`: aggiungere `IApiKey`; aggiungere campo `source: 'system' | 'community'` su `ITemplate` (default `'community'`).
- `libs/shared/dto`: DTO `GenerateApiKeyDto`, `ApiKeyResponseDto`, `RevokeApiKeyDto`. DTO comuni MCP (eventuali wrapper response).
- `libs/shared/utils`: refactor parser OpenAPI da `apps/frontend/src/app/services/import/parsers/` a `libs/shared/utils/src/parsers/` (`openapi.parser.ts`, `file-parser.ts`). Aggiungere supporto YAML via `js-yaml` (~10 righe nel `parse()`).
- Frontend: aggiornare gli import dei parser a `@virtualservice/shared/utils`.

## Slice 1 — API keys end-to-end

- Backend module `api-keys`: schema Mongoose, service, controller, `ApiKeyGuard`.
  - Format key: `vsk_<prefix>_<secret>` (32 byte random base64url, prefix = primi 8 char visibili).
  - DB: `prefix` + `hash` (sha256 o bcrypt). Mostrata in chiaro **solo alla generazione**.
  - `revokedAt` per soft-delete; `lastUsedAt` aggiornato fire-and-forget.
  - Campo `scopes: string[]` con default `['*']` — schema-only, non enforced nell'MVP.
  - Limite max 10 key attive per utente.
- Frontend pagina "API & MCP" **versione minima**: lista key (prefix + name + lastUsedAt + createdAt + revoke), bottone genera con dialog `name`, modal con copy-to-clipboard del secret in chiaro.
- Store NgRx `apiKeys` (state, actions, reducer, effects, selectors).
- `apps/frontend/proxy.conf.json` += `/api-keys`.
- Env `VIRTUALSERVICE_MCP_ENABLED` (default `true`) — dichiarato qui come kill-switch.

## Slice 2 — MCP scaffold + bootstrap context

- Install `@modelcontextprotocol/sdk`.
- Backend module `mcp`: controller Streamable HTTP (single endpoint `POST /mcp`), SDK montato come handler, handshake funzionante.
- **3 resources markdown** in `apps/backend/src/assets/mcp-resources/`:
  - `expressions.md` — manuale completo dello scope JS (variabili, helpers, sintassi `=`/`{`/`[`, esempi pattern).
  - `samples.md` — schema dei dataset built-in (shape-first, non dati).
  - `error-codes.md` — catalogo errori del punto 7 (`mcp-endpoint.md`).
  - (`best-practices.md` placeholder vuoto, popolato post-MVP).
- Handler `list_resources` / `read_resource` esposti come `vs://reference/*`.
- `instructions` popolato come **indice operativo** (~1-2KB): variabili in scope, helpers (solo nomi), 3 regole sintassi, pointer espliciti alle resources.
- `system-templates` registry: `SystemTemplatesRegistry` carica al boot da `apps/backend/src/assets/system-templates/*.json`. 2-3 esempi iniziali.
- Tool `get_workspace_info` (vedi punto 8 in `mcp-endpoint.md`).
- `apps/frontend/proxy.conf.json` += `/mcp`.
- **Outcome verificabile**: Claude Desktop si collega via API key, riceve `instructions`, lista/legge resources, invoca `get_workspace_info`.

## Slice 3 — Read-only tools

- `list_services` — compatto: `{ id, name, path, active, callsCount, lastChange }`.
- `get_service` — lightweight: meta + lista call con solo `{ path, verb, description }`.
- `get_call(serviceId, callPath, callVerb)` — dettaglio completo della singola call.
- `get_logs` — params: `limit?` (default 100), `since?`, `pathFilter?`.
- `search_templates`, `get_template` (read).

## Slice 4 — Snapshot + audit infrastructure

- Collection `service-snapshots`: 1 slot per `(userId, serviceId)`, threshold 1h, TTL 24h. Contenuto = service completo pre-modifica + `{ tool, args, ts }`.
- Collection `mcp-audit`: `{ userId, keyId, tool, args (truncated 4KB), success, errorCode?, ts, argsTruncated? }`. Mutation-only, fire-and-forget, TTL 30gg.
- Hook in `services.service.ts` (o helper dedicato) che crea snapshot prima di mutation MCP-flagged.
- Tool `list_history(serviceId)`, `restore_snapshot(snapshotId)`.

## Slice 5 — Authoring top-level + clone

- Pre-save hook Mongoose su `Service`: backfill uuid v4 sulle rules senza id (UI o MCP).
- Optimistic locking: `services.service.save()` accetta `expectedUpdatedAt`, errore `STALE_VERSION` con `details.currentUpdatedAt` se diverge.
- Tool `create_service` (monolitico, accetta calls/dbo/schedulerFn/interval inline).
- Tool `update_service` — **solo scalari** (name, description, path, active, dbo, schedulerFn, interval). Non tocca `calls`.
- Tool `delete_service` — con `dryRun: true` opzionale che ritorna `{ name, callsCount, logsCount }`.
- Tool `clone_service(sourceId, newPath, newName?)` — duplica server-side, rimette `userId`, genera nuovi uuid rules. Validazione path identica a create (errore `PATH_TAKEN` con `suggested`).

## Slice 6 — Call CRUD scalare

- Tool `add_call(serviceId, call)`.
- Tool `update_call(serviceId, callPath, callVerb, patch)` — **solo campi scalari** (path, verb, response, description). NON tocca array.
- Tool `remove_call(serviceId, callPath, callVerb)`.

## Slice 7 — Tool atomici sub-array (12 tool)

Pattern: `add/update/remove` × `rules/params/headers/cookies`.

- `params`/`headers`/`cookies`: identificazione per `name`.
- `rules`: identificazione per `id` (uuid v4 server-side).
- 12 tool totali.

## Slice 8 — Import OpenAPI

- Tool `import_from_openapi_url(url, path?, name?)` — backend fetch.
- Tool `import_from_openapi_content(content, path?, name?)` — fallback per URL interni.
- SSRF guard **prod-only**: blocklist IP privati / loopback / link-local + timeout 10s.
- Errore strutturato `URL_NOT_REACHABLE` con suggerimento di passare a content.
- Env `VIRTUALSERVICE_OPENAPI_SIZE_LIMIT` (default `5_000_000` bytes), errore `OPENAPI_TOO_LARGE`.
- `dryRun: true` opzionale → `{ wouldCreateService: {...minimal...}, callsCount, conflicts: [...] }`.

## Slice 9 — Templates write

- Tool `install_template(id, path, name?)` → `{ serviceId, calls: [{ path, verb, description }] }`.
- System templates immutabili: `create_template`/`delete_template` rifiutano con `SYSTEM_TEMPLATE_PROTECTED`.
- Validazione path identica a create.

## Slice 10 — Verify/debug + throttle

- Tool `invoke_call(serviceId, callPath, callVerb, pathValues?, params?, body?, headers?)` — HTTP loopback su `http://localhost:${PORT}/service/...`.
- Header interno `X-Vs-Mcp: 1` propagato dal loopback al MockServerController.
- `request-logger` middleware setta `mcp: true` nella riga di log.
- MockServerController, se vede `X-Vs-Mcp: 1`, **bypassa il throttle `'service'`**.
- Tool `restart_service(id)`.
- Throttle bucket `'mcp'` dedicato, env `VIRTUALSERVICE_MCP_THROTTLE_PER_MIN` (default 200).

## Slice 11 — Frontend "API & MCP" completion

- Snippet copia-incolla Claude Desktop config (`mcpServers`).
- Lista tool MCP disponibili con descrizioni (documentazione utente).
- Endpoint URL display.

## Slice 12 — Doc + closeout

- Nuovo file `claude/mcp.md`: catalogo errori (formato `{ code, message, details? }`, **messaggi in inglese**) + workflow utente MCP.
- Aggiornare `CLAUDE.md` principale con le 3 env nuove (`VIRTUALSERVICE_OPENAPI_SIZE_LIMIT`, `VIRTUALSERVICE_MCP_THROTTLE_PER_MIN`, `VIRTUALSERVICE_MCP_ENABLED`).
- Popolare `best-practices.md` con i pattern emersi dal dogfooding (post-MVP).

---

## Note di metodo

- Ogni slice è uno o più commit, deve lasciare il branch in stato deployabile.
- Le slice 5/6/7 sono un blocco di authoring grosso ma omogeneo — review intermedie consigliate.
- `best-practices.md` viene popolato dopo aver visto come l'agente sbaglia in pratica. Suo file in attesa con placeholder dalla slice 2.
- Tutti i `message` di errore nel catalogo MCP sono in **inglese** (li legge l'agente, non l'utente).
