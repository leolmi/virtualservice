# MCP Endpoint

L'endpoint **Model Context Protocol** di virtualservice permette a un client
MCP (tipicamente Claude Desktop o Claude Code) di **comporre, evolvere,
ispezionare e debuggare** i mock services dell'utente attraverso conversazione
con un agente.

> Nota: l'endpoint serve a **scrivere/modificare** i mock, non a consumarli.
> Le request reali ai mock continuano a passare per `/service/<path>/...` come
> sempre. L'unica eccezione è `invoke_call`, che fa un loopback HTTP per debug.

---

## Endpoint

| Path  | Methods    | Auth                  | Throttle                                         |
|-------|------------|-----------------------|--------------------------------------------------|
| `/mcp`| ALL        | API key (Bearer)      | bucket `'mcp'` (env `VIRTUALSERVICE_MCP_THROTTLE_PER_MIN`, default 200/min) |

Trasporto: **Streamable HTTP stateless** (`@modelcontextprotocol/sdk`).
Per ogni request HTTP viene creata una nuova istanza `McpServer` + transport;
le tool callbacks chiudono sull'utente autenticato e sull'`apiKeyId` (per
l'audit), senza propagare context request-scoped del SDK.

Kill-switch: se `VIRTUALSERVICE_MCP_ENABLED=false` l'endpoint risponde 503
con `{ error: { code: 'MCP_DISABLED' } }`.

---

## Autenticazione

L'utente genera una API key dalla pagina **API & MCP** del frontend. La key
ha formato `vsk_<8charPrefix>_<secret>` (32 byte random base64url) e viene
mostrata in chiaro **una sola volta** alla creazione. In DB salviamo solo
`prefix` (in chiaro per identificare la key) e `hash` (sha256 della stringa
completa).

Il client MCP autentica ogni request con:

```
Authorization: Bearer vsk_<prefix>_<secret>
```

`ApiKeyGuard`:
1. Estrae `vsk_*` dal header
2. Lookup per `prefix` nella collection `apikeys`
3. Verifica `sha256(rawKey) === hash`
4. Verifica `revokedAt` null
5. Aggiorna `lastUsedAt` fire-and-forget
6. Popola `req.user` (stessa shape di `JwtAuthGuard`) e `req.apiKeyId`

Limite: max **10 key attive** per utente (costante `MAX_ACTIVE_KEYS_PER_USER`
in `api-keys.service.ts`).

---

## Tool catalog (33 tool)

I tool sono registrati in `apps/backend/src/app/mcp/mcp-server.factory.ts`.
Sono raggruppati per scopo nel codice e nel catalogo della pagina UI
(`apps/frontend/src/app/api-keys/mcp-tools-catalog.ts`).

### Bootstrap

- **`get_workspace_info`** — primo tool da chiamare a inizio sessione.
  Restituisce `{ user, stats, limits, server, availableResources }`.

### Inspect

- **`list_services`** — lista compatta `{ id, name, path, active, callsCount, lastChange }`.
- **`get_service(id)`** — vista lightweight (campi top-level + lista call ridotta a `{ path, verb, description }`). Per il dettaglio completo della call usare `get_call`.
- **`get_call(serviceId, callPath, callVerb)`** — `IServiceCall` completa.
- **`get_logs(serviceId, limit?, since?, pathFilter?)`** — log delle invocazioni mock. Default `limit: 100`, max 500.
- **`search_templates(query?)`** — merge community (DB) + system (in-memory) con filtro substring su title/tags.
- **`get_template(id)`** — struttura completa, lookup prima system poi community.

### Recovery (snapshot)

- **`list_history(serviceId)`** — snapshot per il service (al massimo 1).
- **`restore_snapshot(snapshotId)`** — applica lo snapshot, sostituendo il service.

Comportamento snapshot:
- 1 slot per `(userId, serviceId)`, threshold 1h: prima di ogni mutation
  l'esistente viene preservato se più recente di 1h ("stato di inizio
  sessione"), altrimenti sovrascritto.
- TTL 24h sull'index `createdAt`: snapshot vecchi auto-rimossi.

### Authoring — service top-level

- **`create_service`** — accetta `name`, `path`, opzionalmente `description`, `active`, `dbo`, `schedulerFn`, `interval`, `calls`. Su path collision → `PATH_TAKEN` con `details.suggested`.
- **`update_service(id, patch, expectedLastChange?)`** — solo campi scalari. **Non tocca** `calls` (per quelle: `add_call`/`update_call`/`remove_call`).
- **`delete_service(id, dryRun?)`** — `dryRun: true` ritorna `{ name, callsCount, logsCount }` senza scrivere.
- **`clone_service(sourceId, newPath, newName?)`** — duplica con nuovo `_id`; le rules ricevono uuid nuovi al primo save.

### Authoring — call CRUD

- **`add_call(serviceId, call, expectedLastChange?)`** — `(path, verb)` deve essere unico nel service.
- **`update_call(serviceId, callPath, callVerb, patch, expectedLastChange?)`** — solo scalari (`path`, `verb`, `description`, `response`, `file`, `respType`, `body`). **Non tocca array** (rules/parameters/headers/cookies).
- **`remove_call(serviceId, callPath, callVerb, expectedLastChange?)`**.

### Authoring — atomic editing sub-array (12 tool)

Pattern: `add/update/remove` × `rules/params/headers/cookies`.

- **rules**: identificazione per `id` (uuid v4 generato al primo save da pre-save hook). Su servizi pre-feature, le rules potrebbero non avere id — `update_rule` restituisce un hint operativo che suggerisce un save preliminare.
- **params**: identificazione per `name`, unicità enforced.
- **headers / cookies**: `Record<string, string>`, identificazione per chiave; `add_*` fallisce se la chiave esiste, `update_*`/`remove_*` falliscono se manca.

### Import

- **`import_from_openapi_url(url, path?, name?, dryRun?)`** — backend fetch.
  - **SSRF guard prod-only**: se `NODE_ENV === 'production'`, blocca hostname testuali (`localhost`, `*.local`, `*.internal`) e IP risolti via DNS che cadono in range privati / loopback / link-local.
  - Timeout 10s, controllo `Content-Length`, size limit `VIRTUALSERVICE_OPENAPI_SIZE_LIMIT` (default 5 MB).
  - Su errori: `URL_NOT_REACHABLE` con `details.hint` che suggerisce l'alternativa content.
- **`import_from_openapi_content(content, path?, name?, dryRun?)`** — content inline (JSON o YAML), bypassa SSRF.
- `dryRun: true` ritorna `{ wouldCreateService, formatLabel, title, version, callsCount, conflicts: [{ type, path, suggested }] }` senza scrivere.

Conversione OpenAPI → IService: tutte le operations confluiscono in **un singolo service** (dedup per `(verb, path)`). Per separare per tag, l'agente fa import successivi o usa `clone_service`. La conversione vive in `libs/shared/utils/.../openapi-converter.ts` ed è condivisa frontend/backend (il converter del frontend conserva una variante user-driven con selezione + supporto VS native source).

### Templates write

- **`install_template(id, path, name?)`** — installa system o community. Restituisce `{ serviceId, source, calls: [{ path, verb, description }] }` per dare all'agente la "documentazione d'uso" del mock appena creato.

System templates immutabili: i loro `id` sono stringhe stabili (es. `system-northwind-products`), non `ObjectId`, quindi naturalmente respinti da qualsiasi tentativo di delete via UI / community endpoint.

### Verify / debug

- **`invoke_call(serviceId, callPath, callVerb, pathValues?, params?, body?, headers?, timeoutMs?)`** — HTTP loopback verso `http://127.0.0.1:${PORT}/service/<service.path>/<resolvedCallPath>`. Aggiunge header interno `X-Vs-Mcp: 1`:
  - `MockServerService` tagga `mcp: true` nel log corrispondente
  - Il bucket `'service'` nello `ThrottlerModule.skipIf` viene bypassato (il bucket `'mcp'` lato MCP è già il guardrail)
- **`restart_service(id)`** — reset cache `dbo` + restart timer `schedulerFn`. Effetto in-memory (no snapshot).

---

## Reference resources MCP

Esposte via `list_resources` / `read_resource` come URI `vs://reference/*`.
File markdown bundlati da `apps/backend/src/assets/mcp-resources/*.md`.

| URI                                | Contenuto                                                           |
|------------------------------------|---------------------------------------------------------------------|
| `vs://reference/expressions`       | Manuale completo dello scope JS (variabili, helpers, sintassi `=`/`{`/`[`, pattern CRUD/error/pagination/etag/scheduler) |
| `vs://reference/samples`           | Schema dei dataset built-in (`samples.northwind`, `samples.italia`, `samples.nations`, `samples.currencies`, `samples.us`, `samples.http`, `samples.lorem`, `samples.colors`) |
| `vs://reference/error-codes`       | Catalogo errori MCP (vedi sotto, mirror)                            |
| `vs://reference/best-practices`    | Pattern consigliati (placeholder, popolato post-MVP)                |

Le `instructions` passate al client MCP all'handshake (`apps/backend/src/app/mcp/instructions.ts`, ~1.5KB) sono un **indice operativo**: nomi puntuali e sintassi essenziale, con rinvio esplicito alle resources per ogni dettaglio. Token-efficient: l'agente carica le resources on-demand quando serve.

---

## Catalogo errori MCP

Forma uniforme: `{ code: STRING_CONST, message, details? }`. **Messaggi sempre in inglese** (li legge l'agente — la traduzione conversazionale la fa lui se serve).

### Lookup

| Code                  | Quando                                                | `details`            |
|-----------------------|-------------------------------------------------------|----------------------|
| `SERVICE_NOT_FOUND`   | Service inesistente o non di proprietà dell'utente    | —                    |
| `CALL_NOT_FOUND`      | Call con `(path, verb)` mancante                      | —                    |
| `RULE_NOT_FOUND`      | Rule `id` non trovato                                 | —                    |
| `PARAM_NOT_FOUND`     | Parameter `name` non trovato                          | —                    |
| `HEADER_NOT_FOUND`    | Header `name` non trovato                             | —                    |
| `COOKIE_NOT_FOUND`    | Cookie `name` non trovato                             | —                    |
| `SNAPSHOT_NOT_FOUND`  | Snapshot inesistente o scaduto                        | —                    |

### Validazione / conflict

| Code                    | Quando                                              | `details`                            |
|-------------------------|-----------------------------------------------------|--------------------------------------|
| `PATH_TAKEN`            | Service path già in uso                             | `{ suggested: string }`              |
| `STALE_VERSION`         | `expectedLastChange` diverso dal valore in DB       | `{ currentLastChange: number }`      |
| `EXPRESSION_TOO_LARGE`  | `string-js` oltre `VIRTUALSERVICE_EXPRESSION_SIZE_LIMIT` | `{ field, size, limit }`        |
| `DB_TOO_LARGE`          | `db` cache oltre `VIRTUALSERVICE_DB_SIZE_LIMIT`     | `{ size, limit }`                    |
| `OPENAPI_TOO_LARGE`     | OpenAPI content oltre `VIRTUALSERVICE_OPENAPI_SIZE_LIMIT` | `{ size, limit }`               |
| `INVALID_OPENAPI`       | Documento OpenAPI non valido (parse fallito)        | `{ reason: string }`                 |
| `URL_NOT_REACHABLE`     | Fetch dell'URL fallito (rete, SSRF, timeout, HTTP)  | `{ url, hint, status? }`             |
| `VALIDATION_FAILED`     | Class-validator / Mongoose / catch-all              | `{ errors: [...] }` (variabile)      |

### Templates

| Code                          | Quando                                              | `details`                  |
|-------------------------------|-----------------------------------------------------|----------------------------|
| `SYSTEM_TEMPLATE_PROTECTED`   | Tentativo di delete/edit su template di sistema     | `{ templateId: string }`   |

### Throttle

| Code             | Quando                                          | `details`                       |
|------------------|-------------------------------------------------|---------------------------------|
| `RATE_LIMITED`   | Bucket `'mcp'` esaurito per la key              | `{ retryAfterSec: number }`     |

### Auth

| Code                  | Quando                                              | `details`                |
|-----------------------|-----------------------------------------------------|--------------------------|
| `UNAUTHORIZED_KEY`    | Header mancante/malformato o prefix sconosciuto     | —                        |
| `KEY_REVOKED`         | Key esiste ma è stata revocata                      | —                        |
| `KEY_LIMIT_EXCEEDED`  | Limite di key attive raggiunto                      | `{ max: number }`        |

### Generici

| Code               | Quando                                              | `details`     |
|--------------------|-----------------------------------------------------|---------------|
| `NOT_FOUND`        | Lookup generico fallito (es. `get_template`)        | —             |
| `FORBIDDEN`        | Accesso negato                                      | —             |
| `INTERNAL_ERROR`   | Eccezione non riconducibile a uno degli altri code  | —             |

---

## Audit log e snapshot

### `mcp-audit` — write only

Collection con TTL 30gg su `ts`. Contiene **solo le mutation** (write tools); le read non vengono registrate.

Forma del record:
```ts
{
  userId: string,
  keyId: string,
  tool: string,
  args: unknown,           // troncati a 4KB
  argsTruncated: boolean,
  success: boolean,
  errorCode: string | null,
  ts: Date,
}
```

Implementato in `audit.service.ts`. Il pattern è centralizzato in `withMutationAudit(ctx, fn)` (helper in `_helpers.ts`) che wrappa la tool callback registrando esito automaticamente.

### `service-snapshots` — recovery

Collection con TTL 24h su `createdAt`. Cattura lo stato del service prima di una mutation MCP, con threshold 1h (sotto il quale il vecchio snapshot resta come "stato di inizio sessione"). Forma del record:
```ts
{
  userId: string,
  serviceId: string,
  tool: string,            // tool che ha innescato la cattura
  args: unknown,
  content: object,         // service completo (output di Mongoose toObject)
  createdAt: Date,
}
```

Implementato in `snapshot.service.ts`. La cattura è opportunistica e fire-and-forget — un fallimento dello snapshot **non blocca** la mutation principale (warning a console).

---

## Throttle

`ThrottlerModule.forRootAsync` in `app.module.ts` configura 4 bucket:

| Bucket    | Limit (default)                         | Scope                               |
|-----------|-----------------------------------------|-------------------------------------|
| `default` | 60/min                                  | Globale (skip esplicito per controller) |
| `strict`  | 5/min                                   | Esplicito via `@Throttle({ strict })` |
| `service` | env `VIRTUALSERVICE_SERVICE_THROTTLE_LIMIT` (300/min) | Solo `/service/*`. Bypass su header `X-Vs-Mcp: 1` |
| `mcp`     | env `VIRTUALSERVICE_MCP_THROTTLE_PER_MIN` (200/min) | Solo `/mcp` |

Lo scoping di `service` e `mcp` è implementato via `skipIf` per-bucket, non via `@SkipThrottle` per controller. Più pulito e meno invasivo sui controller esistenti.

Bypass loopback: `invoke_call` setta `X-Vs-Mcp: 1` sulla request loopback. Il bucket `'service'` lo skipper, evitando il doppio limit (la chiamata MCP iniziale è già limitata da `'mcp'`).

---

## Workflow tipici

### 1. Bootstrap di sessione

```
agent → get_workspace_info
agent → read_resource(vs://reference/expressions)
agent → list_services
```

### 2. Creazione di un service da specifica esterna

```
user: "creami un mock dal file OpenAPI di petstore"
agent → import_from_openapi_url(url=..., dryRun=true)
agent: "Sto per creare un service con N call. Confermi?"
user: "sì"
agent → import_from_openapi_url(url=..., dryRun=false)
agent: "Fatto. Hai un service /petstore con N call. Ti mostro le call principali..."
```

### 3. Modifica iterativa

```
user: "aggiungi una rule che blocca le request senza Authorization"
agent → get_call(serviceId, '/products', 'GET')
agent → add_rule(serviceId, callPath='/products', callVerb='GET', rule={ ... })
```

### 4. Verifica

```
user: "per category 5 ci sono davvero solo 4 prodotti?"
agent → invoke_call(serviceId, callPath='/products', callVerb='GET', params={ categoryId: '5' })
agent: "Sì, 4 prodotti: ..."
```

### 5. Recovery

```
user: "ho fatto un casino, ridammi lo stato precedente"
agent → list_history(serviceId)
agent → restore_snapshot(snapshotId)
```

---

## Riferimenti codice

- Module: `apps/backend/src/app/mcp/`
- Factory + tool registration: `mcp-server.factory.ts`
- Tools: `tools/<name>.tool.ts` (con helper condivisi in `_helpers.ts` e shape zod riusabili in `_schemas.ts`)
- Resources loader: `resources/mcp-resources.service.ts`
- System templates registry: `resources/system-templates.registry.ts`
- Snapshot/audit: `snapshot.service.ts`, `audit.service.ts`
- API key: `apps/backend/src/app/api-keys/`
- Frontend page: `apps/frontend/src/app/api-keys/`
- Tool catalog visualizzato in UI: `apps/frontend/src/app/api-keys/mcp-tools-catalog.ts` (mantenere allineato con la factory)
