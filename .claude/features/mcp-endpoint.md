# Feature: MCP endpoint + API keys utente

> Analisi e design — discussione preliminare. Nessun codice scritto.
> Va ripreso in una sessione successiva per il piano implementativo.

## Contesto e obiettivo

Aggiungere a virtualservice un endpoint **Model Context Protocol** che permetta a un client MCP (tipicamente Claude Desktop o Claude Code dell'utente sviluppatore) di **comporre, evolvere, ispezionare e debuggare** i propri mock services attraverso conversazione con un agente.

Necessario un meccanismo di **API keys per-utente** generabili dalla UI per autenticare le richieste MCP.

## Caso d'uso confermato

**Attore**: developer frontend che sta costruendo un client web e ha bisogno di backend mock mentre il vero server è in sviluppo o parzialmente disponibile. Usa Claude (Desktop / Code) come **authoring assistant** del proprio workspace virtualservice.

**NON è un caso d'uso**: agente che consuma i mock come tool durante un task. Quel flusso continua a passare per `POST /service/<path>/...` come oggi, senza MCP. L'MCP serve solo per **scrivere/modificare** i mock, non per usarli (con l'unica eccezione di `invoke_call` per debug, vedi sotto).

### Pattern di interazione tipici (dichiarati dall'utente)

1. **Bootstrap da specifica esterna**: "creami un servizio da questo file/url OpenAPI/Swagger"
2. **Bootstrap da descrizione naturale**: "creami un servizio che gestisca etag", "creami un master-detail su prodotti/categorie di Northwind"
3. **Evoluzione incrementale**: "aggiungi i clienti al master-detail di prima"
4. **Verifica/debug**: "per category 5 ci sono davvero solo 4 prodotti?" — Claude invoca il mock e analizza la risposta
5. **Discovery sui template**: "hai un mock che gestisce parent-child?", "trovami un esempio etag" — Claude cerca tra i template pubblici, eventualmente installa, restituisce le call utili come "documentazione d'uso"

## Inventario tool MCP

### Read

| Tool | Argomenti | Note |
|---|---|---|
| `list_services` | — | Lista compatta (id, name, path, active, calls count, lastChange) |
| `get_service` | `id` | Definizione completa: tutte le calls, dbo, schedulerFn, interval. **Da chiamare prima di update se la struttura non è già nel contesto** |

### Authoring (monolitico + decomposto)

| Tool | Argomenti | Note |
|---|---|---|
| `create_service` | `name`, `path`, `description?`, `calls?`, `dbo?`, `schedulerFn?`, `interval?`, `active?` | Tutti i sub-elementi opzionali — passabili in un colpo (monolitico) o aggiunti via `add_call`/`update_service` |
| `update_service` | `id`, `patch: { name?, description?, path?, active?, dbo?, schedulerFn?, interval? }` | Solo campi top-level. **NON tocca le calls** — usa i tool dedicati |
| `add_call` | `serviceId`, `call` | |
| `update_call` | `serviceId`, `callPath`, `callVerb`, `patch` | Identifica la call per `path+verb` (più stabile rispetto all'indice) |
| `remove_call` | `serviceId`, `callPath`, `callVerb` | |
| `delete_service` | `id` | |

### Import

| Tool | Argomenti | Note |
|---|---|---|
| `import_from_openapi_url` | `url`, `path?`, `name?` | Backend fa fetch. Se URL non raggiungibile → errore strutturato `URL_NOT_REACHABLE` con suggerimento di passare a content. **SSRF guard attiva solo in prod** (loopback consentito in dev) |
| `import_from_openapi_content` | `content` (JSON o YAML), `path?`, `name?` | Fallback per URL interni/dietro auth |

> Per ora limitato a OpenAPI/Swagger 2/3. curl/HAR/Postman/Insomnia restano in UI (workflow drag-drop, poco utili via agente).

### Verifica / debug

| Tool | Argomenti | Note |
|---|---|---|
| `invoke_call` | `serviceId`, `callPath`, `callVerb`, `pathValues?`, `params?`, `body?`, `headers?` | **HTTP loopback** al proprio mock, segue il flusso reale dell'app dell'utente |
| `get_logs` | `serviceId`, `since?` | |
| `restart_service` | `id` | Reset cache dbo + riavvio scheduler |

### Templates

| Tool | Argomenti | Note |
|---|---|---|
| `search_templates` | `query?` | Filtro su titolo/tag |
| `get_template` | `id` | |
| `install_template` | `id`, `path`, `name?` | Restituisce nuovo serviceId + lista call (per "documentazione d'uso") |

### Tool esclusi dall'MVP

- `create_template` / `delete_template` — atti consapevoli, restano in UI
- Import da curl/HAR/Postman/Insomnia — workflow drag-drop
- `set_starred` — irrilevante per agente
- Gestione utente (password reset, ecc.) — fuori scope
- Tool admin-only — l'admin usa la sua key utente normale

## Decisioni di design chiuse

1. **Identificazione call**: per `path + verb`, non per indice
2. **`invoke_call`**: HTTP loopback (chiamata interna al proprio backend su `http://localhost:${PORT}/service/...`)
3. **Path conflict** in create/import: errore strict `PATH_TAKEN` con campo `suggested` calcolato dal backend (es. `products` → `products-2`)
4. **Import OpenAPI**: entrambi i tool (URL fetch lato backend + content diretto)
5. **SSRF guard** su `import_from_openapi_url`: blocklist IP privati / loopback / link-local + timeout breve (~10s) + size limit. **Attiva solo in produzione** (in dev permissiva per consentire `http://localhost`)
6. **Granularità authoring**: sia monolitica che decomposta. `create_service` accetta tutto, `add_call`/`update_call`/`remove_call` per modifiche incrementali
7. **`update_service` non tocca le calls** — separazione esplicita per evitare che Claude rimpiazzi le calls con `update_service` rovinando il workspace
8. **Streaming**: non necessario, tutte le operazioni sono < ~2s, response sincrone
9. **Sicurezza stringa-js**: stesso modello di trust della UI. L'utente è responsabile del codice nei propri mock, anche se scritto da un agente per suo conto. La validazione `VIRTUALSERVICE_EXPRESSION_SIZE_LIMIT` esistente continua a valere; nessun filtro aggiuntivo

## Design proposto API keys

### Schema `ApiKey`

| Campo | Tipo | Note |
|---|---|---|
| `_id` | ObjectId | |
| `userId` | string (indexed) | Owner della key |
| `name` | string | Label leggibile dall'utente, es. "Claude Desktop laptop" |
| `prefix` | string | Primi 8 char del segreto, sempre visibili in UI per identificare la key |
| `hash` | string | sha256/bcrypt del segreto completo |
| `lastUsedAt` | Date? | Aggiornato fire-and-forget alla request |
| `createdAt` | Date | |
| `revokedAt` | Date? | Soft-delete: la guard rifiuta key con `revokedAt` set; mantenute in DB per audit |

### Generazione

- 32 byte random crypto-secure → base64url
- Format: `vsk_<prefix>_<secret>` (`vsk` = virtualservice key — riconoscibile, aiuta scanner come GitHub secret-detection)
- **Mostrata in chiaro UNA SOLA VOLTA** alla creazione (modal con copy-to-clipboard + warning)
- In DB salvi solo il `prefix` (visibile) e `hash` (verificabile)
- Se l'utente la perde: revoca + nuova generazione, niente recovery

### Auth

- Guard `ApiKeyGuard` intercetta `Authorization: Bearer vsk_*`
- Lookup per prefix → confronto hash → popola `req.user` come `JwtAuthGuard`
- Aggiorna `lastUsedAt` async (fire-and-forget, non blocca la request)

### Modello di scope

**Una key = accesso completo come l'utente** (simile a un PAT GitHub). Niente scope per-tool nell'MVP. Espandibile dopo se necessario.

### Limiti

- Max N key attive per utente (proposto: 10)
- Throttle dedicato `'mcp'` su tutte le request MCP, separato da `'service'` e `'default'`
- Suggerito: 60 req/min per key (da affinare)

### UI

Pagina nuova **"API & MCP"** accessibile da menu utente. Contiene:
1. Lista delle key (prefix + name + lastUsedAt + createdAt + revoke button)
2. Bottone "Generate new key" → dialog con `name` → ritorna la key in chiaro 1 sola volta
3. URL endpoint MCP (`https://<host>/mcp` o equivalente)
4. **Snippet di config Claude Desktop** copia-incolla pronto per `mcpServers`
5. Lista compatta dei tool disponibili (documentazione utente: cosa può chiedere a Claude)

## Punti aperti

### A. Tool extra (utente sta riflettendo sul punto 5 dell'inventario)

Domande utili per chiudere il punto:
- **Pattern d'uso oltre ai 4**: serve un `clone_service`? Filtri/sort più ricchi su `list_services` (es. "servizi inattivi da X giorni")?
- **Aggiornamento incrementale di `dbo`**: oggi richiede `get_service` → leggere `dbo` → modificare → `update_service`. Fragile (Claude deve riscrivere il JS senza errori). Possibile tool dedicato `append_to_dbo(serviceId, jsExpression)` che il backend integra in modo più sicuro?
- **Tool dedicato per rules** (`add_rule`, `remove_rule`)? Oggi le rules sono parte della call e si gestiscono via `add_call`/`update_call`
- **Cookies/headers di response**: stessa cosa delle rules, parte della call. Probabilmente OK così

### B. Discovery dell'endpoint

Già coperto dalla pagina UI. Da decidere se l'endpoint MCP sta sul main backend o su un sotto-path dedicato (`/mcp` semplice e standard).

### C. SDK MCP server-side

Decidere se usare l'SDK ufficiale `@modelcontextprotocol/sdk` (TypeScript) montato come handler dentro NestJS, oppure scrivere a mano un controller che parla JSON-RPC 2.0. **Inclinazione: SDK ufficiale** — gestisce negoziazione protocollo, capability advertisement, type safety dei tool.

### D. Trasporto

**Streamable HTTP** (single endpoint POST /mcp, no stdio, no SSE deprecato). Standard moderno per servizi HTTP esistenti.

### E. Refactor parser di import

I parser OpenAPI vivono oggi in `apps/frontend/src/app/services/import/parsers/`. Per usarli da MCP devono girare lato backend. Tre opzioni:

- **a.** Spostarli in `libs/shared/utils` (verificare prima che non abbiano dipendenze browser-only come `File`, `FileReader`, `DOMParser`)
- **b.** Duplicare lato backend (brutto)
- **c.** Lasciare in frontend e far passare solo JSON `IService` già parsato (Claude parserebbe l'OpenAPI da solo — accettabile ma sposta complessità sull'agente)

**Inclinazione: (a)** se possibile, altrimenti valutare. Da accertare leggendo i parser.

### F. Rate limiting interno

`invoke_call` via HTTP loopback consuma il throttle `'service'` come una request esterna. Se Claude fa molte invocazioni per "verificare", può saturare. Bloccante non lo è, ma da tenere d'occhio. Eventualmente: bypass del throttle service per request loopback identificate da un header interno.

### G. Logging delle invocazioni MCP

Decidere se aggiungere alla riga di log un flag `mcp: true` per distinguere request loopback dell'agente da request del client web. Utile per debug, costo minimo.

---

## Decisioni chiuse — follow-up del 2026-04-28

Sessione di refinement sui punti critici dell'analisi precedente. Le voci qui sotto **prevalgono** su eventuali contraddizioni nelle sezioni precedenti.

### 1. Concorrenza sugli array innestati — optimistic locking soft

- Mongoose `timestamps: true` (già attivo) fornisce `updatedAt`.
- I tool `update_service`, `update_call`, `update_<x>`, `remove_<x>` accettano un campo opzionale `expectedUpdatedAt`.
- Backend in `services.service.ts.save()`: se `expectedUpdatedAt` è presente e non coincide con quello in DB → errore strutturato `STALE_VERSION` con il documento corrente. Se assente → comportamento odierno (last-write-wins).
- `add_*` non ne ha bisogno (additivi, validano unicità per name/path+verb).
- Costo: ~5 righe in services.service.ts, zero schema change.

### 2. Patch semantics su `update_call` — tool atomici granulari

- `update_call(serviceId, callPath, callVerb, patch)` modifica **solo campi scalari** (path, verb, response, description, etc.). NON tocca array.
- Nuovi tool atomici per ogni sotto-array (×4: rules, params, headers, cookies):
  - `add_<x>(serviceId, callPath, callVerb, <x>)`
  - `update_<x>(serviceId, callPath, callVerb, identifier, patch)`
  - `remove_<x>(serviceId, callPath, callVerb, identifier)`
- **Identificazione elementi**:
  - `params`/`headers`/`cookies`: per `name` (univoco per natura).
  - `rules`: per `id` (uuid v4 generato server-side).
- **Backfill rules id**: pre-save hook Mongoose assegna uuid alle rules senza id ad ogni save (UI o MCP). Migrazione naturale, idempotente. Per service mai salvati post-feature, `get_service` lato MCP popola gli id "on read" (read-only, lo storage si aggiorna alla prossima save).
- 12 tool nuovi totali.

### 3. Idempotenza / dry-run

- **`dryRun: true`** opzionale su:
  - `import_from_openapi_url` / `import_from_openapi_content` → ritorna `{ wouldCreateService: {...minimal...}, callsCount, conflicts: [...] }` senza scrivere.
  - `delete_service` → ritorna `{ name, callsCount, logsCount }` per dare all'agente materiale per chiedere conferma.
- **Niente flag `confirm`**: ci si affida al pattern di approvazione dei client MCP (Claude Desktop/Code chiedono per default) + safety net del punto 4. Caveat: l'utente può marcare un tool come "Always allow" e altri client potrebbero non chiedere — il vero recovery resta gli snapshot.

### 4. Recovery / undo — snapshot di sessione

- **1 slot per (utente, service)**: collection `service-snapshots`.
- **Threshold temporale**: 1 ora. Prima di ogni mutation MCP, controlla l'ultimo snapshot per la coppia (utente, service): se più vecchio di 1h → sovrascrive con lo stato pre-modifica corrente; se più recente → non tocca (resta lo "stato di inizio sessione").
- **TTL**: 24h sugli snapshot vecchi.
- **Tool MCP**: `list_history(serviceId)`, `restore_snapshot(snapshotId)`.
- UI dedicata rimandata a iterazione successiva (per ora restore solo via agente).
- Lo snapshot record contiene il **content completo** del service pre-modifica + metadati `{ tool, args, ts }`.

### 5. Dimensione output dei tool

- **`get_service`** è "leggero": ritorna meta + lista call con solo `{ path, verb, description }` (no body/response/rules dettagli). Aggiungo **`get_call(serviceId, callPath, callVerb)`** per il dettaglio della singola call.
- **`get_logs`**: parametri `limit?` (default **100**), `since?` (cursor temporale), `pathFilter?`.
- **Import OpenAPI**: env `VIRTUALSERVICE_OPENAPI_SIZE_LIMIT` (bytes), default `5_000_000`. Errore `OPENAPI_TOO_LARGE` se superato.

### 6. Authorization su `invoke_call` (loopback)

- **Nessun ownership check sui path**: i path sono pubblici per design (chiunque conosca l'URL può invocarli dal browser). MCP non aggiunge esposizione.
- **Tagging MCP nei log**: header interno `X-Vs-Mcp: 1` propagato dal loopback al MockServerController. Il request-logger setta `mcp: true` nella riga di log. Utile per debug e per filtri sulla pagina monitor.
- **Throttle bypass**: se il MockServerController vede `X-Vs-Mcp: 1`, **salta il throttle `'service'`**. Il throttle `'mcp'` (lato MCP) è già l'unico guardrail necessario — niente doppia tassazione.

### 7. Catalogo errori strutturati

- Forma uniforme: `{ code: STRING_CONST, message, details? }`.
- Documentazione: nuovo file **`claude/mcp.md`**.
- Codici inizial:
  - `SERVICE_NOT_FOUND`, `CALL_NOT_FOUND`, `RULE_NOT_FOUND`, `PARAM_NOT_FOUND`, `HEADER_NOT_FOUND`, `COOKIE_NOT_FOUND`
  - `PATH_TAKEN` (con `details.suggested`)
  - `STALE_VERSION` (con `details.currentUpdatedAt`)
  - `EXPRESSION_TOO_LARGE`, `DB_TOO_LARGE`, `OPENAPI_TOO_LARGE`
  - `URL_NOT_REACHABLE`, `INVALID_OPENAPI`
  - `SNAPSHOT_NOT_FOUND`
  - `RATE_LIMITED` (con `details.retryAfterSec`)
  - `UNAUTHORIZED_KEY`, `KEY_REVOKED`, `KEY_LIMIT_EXCEEDED`
  - `VALIDATION_FAILED` (catch-all class-validator)
  - `SYSTEM_TEMPLATE_PROTECTED` (per tentativi di delete/edit su template di sistema)

### 8. Bootstrap context — `get_workspace_info`

Tool di apertura sessione, ritorna in un colpo solo lo stato del workspace + i vincoli operativi:

```json
{
  "user": { "id", "email", "isAdmin" },
  "stats": { "servicesCount", "activeServicesCount", "apiKeysCount" },
  "limits": {
    "expressionSizeBytes",
    "dboSizeBytes",
    "openapiSizeBytes",
    "maxApiKeys",
    "throttleMcpPerMin"
  },
  "server": { "version", "mcpProtocolVersion" },
  "availableResources": ["vs://reference/expressions", "vs://reference/samples", "vs://reference/error-codes", "vs://reference/best-practices"]
}
```

`isAdmin` è informativo — i tool effettivamente protetti verificano il ruolo a runtime sul JWT/key, mai dal payload del client. `mcpProtocolVersion` lo riempie l'SDK MCP. `availableResources` dà all'agente l'elenco esplicito delle MCP resources caricabili on-demand (vedi punto 16).

### 9. OpenAPI security schemes — doc-only

- Quando il parser OpenAPI incontra `securitySchemes`, ne mette una nota nel campo `description` della call importata (es. `"Original requires Authorization: Bearer (oauth2 scheme: ...)"`).
- Niente headers/rules generati automaticamente.
- **TODO futuro** segnato dall'utente: introdurre logica per mockare un giro di autenticazione in maniera minimalista ma corretta.

### 10. Scopes su `ApiKey` — campo presente, non enforced

- Schema include `scopes: string[]` con default `['*']`.
- Backend non legge il campo nell'MVP (tutti i tool passano).
- Quando servirà introdurre limitazioni (key read-only / per-service / per-tool), basta aggiungere il check nel guard senza schema migration.

### 11. Throttle — singolo bucket generoso

- Bucket unico `'mcp'`.
- env `VIRTUALSERVICE_MCP_THROTTLE_PER_MIN`, default **200**.
- `invoke_call` consuma solo questo bucket (non `'service'`, vedi punto 6).
- Eventuale split in `'mcp:write'` / `'mcp:invoke'` rimandato a iterazione successiva se i pattern reali lo giustificheranno.

### 12. Templates — workflow + system templates cablati

- **Payload di ritorno**:
  - `search_templates(query?)` → array di `{ id, name, description, tags, callsCount, source }`.
  - `get_template(id)` → struttura completa del template.
  - `install_template(id, path, name?)` → `{ serviceId, calls: [{ path, verb, description }] }` (l'agente ha già la "documentazione d'uso" pronta da mostrare all'utente).
- **System templates** inclusi nell'MVP:
  - File JSON in `apps/backend/src/assets/system-templates/*.json` (caricati al boot da un `SystemTemplatesRegistry`).
  - Campo nuovo nello schema/DTO Template: `source: 'system' | 'community'` (default `'community'` per i record DB esistenti).
  - Tool `search_templates`/`get_template` fanno **merge in lettura** (DB community + in-memory system).
  - System templates immutabili: `create_template` / `delete_template` rifiutano con `SYSTEM_TEMPLATE_PROTECTED`.
  - 2-3 esempi iniziali (l'utente ha già materiale pronto).

### 13. Audit log delle azioni MCP — mutation only

- Collection `mcp-audit`: `{ userId, keyId, tool, args (truncated 4KB), success, errorCode?, ts, argsTruncated?: bool }`.
- **Solo mutation** (write). Le read non vengono registrate.
- Fire-and-forget, non blocca la response.
- TTL: 30gg.
- **Niente content** del service — quello è solo nello `service-snapshots` del punto 4. Conseguenza: per mutation con payload grande (es. `update_call` con response da 10KB), nell'audit l'`args` è troncato e lo snapshot è l'unica fonte completa.

### 14. Tool extra (residuo del punto A originale)

- ✅ **`clone_service(sourceId, newPath, newName?)`**: duplica server-side, rimette `userId` corrente, genera nuovi uuid per le rules. Ritorna `{ newServiceId, callsCount }`.
- ❌ **Filtri/sort su `list_services`**: non aggiunti per MVP. Solo ordinamento default `lastChange desc`. Filtri rimandati se servirà.
- ❌ **`append_to_dbo`**: non aggiunto. Il problema è di size dei token, non semantico — l'agente per ora si arrangia con `get_service` + `update_service`. Per dbo grandi l'utente edita in UI.

### 16. MCP instructions + resources — istruire l'agente sullo scope JS

Lo scope di valutazione delle espressioni JS di virtualservice (campi `response`, `dbo`, `schedulerFn`, `rules.condition`) è ricco e **specifico dell'app**: non è general knowledge dell'LLM. Senza una documentazione esposta dal server MCP, l'agente ignora helpers utili come `_`, `samples.*`, `guid`, `setExitCode`, `throwError`, e produce espressioni meno efficaci.

**Architettura a tre livelli per token efficiency:**

#### a. Server `instructions` (sempre nel context, ~1-2KB)
Caricato dall'SDK MCP al handshake iniziale della sessione. Contiene **l'essenziale**:
- Variabili scope: `params`, `data`, `db`, `headers` (case-insensitive), `cookies`, `pathValue`, `value` (solo rules).
- Helpers globali: `_` (lodash), `samples` (dataset built-in), `guid()`, `setTimeout`.
- Solo nelle response: `setExitCode(code)`, `throwError(message, code)`.
- Sintassi: prefisso `=` per espressione, `{` o `[` come prefisso per JSON literal con `return` implicito.
- Riferimento esplicito alle resources per dettagli.

#### b. Resources MCP (on-demand, generate da file markdown)
Asset in `apps/backend/src/assets/mcp-resources/*.md`, esposte via `list_resources` / `read_resource`:

| URI | Contenuto |
|---|---|
| `vs://reference/expressions` | Manuale completo dello scope, sintassi, esempi di pattern (CRUD, errori, paginazione, etag, …) |
| `vs://reference/samples` | Catalogo dei dataset built-in `samples.*` con schema (es. `samples.northwind.products[0]` = `{ id, name, categoryId, ... }`) — riferimento per popolare il dbo o usare i dati direttamente nelle response |
| `vs://reference/error-codes` | Catalogo errori MCP del punto 7, formato `{ code, message, details? }` |
| `vs://reference/best-practices` | Pattern consigliati: quando usare rules vs throwError, dbo vs samples, schedulerFn, ecc. |

#### c. `get_workspace_info` (vedi punto 8 esteso)
Espone `availableResources` come hint esplicito.

**Nota sulla relazione con `samples.*`**: poiché `samples` è già caricato nel worker (zero costo runtime), molti service di esempio possono essere generati dall'agente **senza popolare il dbo**, semplicemente invocando `samples.northwind.*` nelle espressioni. Il punto 14 sui dataset (chiuso su "A — niente di nuovo") va riletto alla luce di questo: la "fonte dataset" primaria è `samples`, e l'agente lo scopre via la resource `vs://reference/samples`.

### 17. Rifiniture finali

- **Lingua dei `message` nel catalogo errori MCP**: **inglese** sempre. I `code` sono costanti inglesi, i `message` pure. L'errore lo legge l'agente, non l'utente — la traduzione conversazionale la fa l'agente se serve. Convenzione da formalizzare in `claude/mcp.md`.
- **`clone_service` e validazione path**: il `newPath` viene validato come in `create_service`. Se preso → errore `PATH_TAKEN` con `suggested` calcolato dal backend (es. `products` → `products-2`). Stesso identico flusso di create.
- **Nuove env vars introdotte in questa sessione** (da aggiungere al CLAUDE.md principale al momento dell'implementazione):
  - `VIRTUALSERVICE_OPENAPI_SIZE_LIMIT` — bytes, default `5_000_000`. Limite size content OpenAPI per gli import MCP.
  - `VIRTUALSERVICE_MCP_THROTTLE_PER_MIN` — int, default `200`. Throttle del bucket `'mcp'` per ogni API key.
  - `VIRTUALSERVICE_MCP_ENABLED` — bool, default `true`. Kill-switch del modulo MCP per rollback rapido in caso di problemi in produzione.

### 15. Refactor parser OpenAPI (punto E originale)

- I parser sono **già puri**: zero dipendenze browser-only, firma `parse(content: string)`. Refactor "as-is" fattibile senza adapter.
- **Spostare in `libs/shared/utils/src/parsers/`**:
  - `openapi.parser.ts`
  - `file-parser.ts` (interfacce condivise)
  - Solo questi due — gli altri parser (curl, har, postman, insomnia) restano in frontend.
- **Aggiungere supporto YAML** durante il refactor: dipendenza `js-yaml`, nel `parse()` prova prima JSON, se fallisce prova YAML. ~10 righe. Estensione gratis anche per la UI.
- Frontend: aggiornare l'import a `@virtualservice/shared/utils`.
- Backend `mcp` module usa direttamente la lib.

---

## Note operative — come riprendere

**Stato**: analisi + decisioni chiuse, **nessuna riga di codice scritta**. Niente file modificati al di fuori di questo doc.

**Prossimi passi:**

1. Buttare giù un piano implementativo come fatto per la feature templates, suddiviso per:
   - **Shared lib `libs/shared/model`**: model `IApiKey`, model `ITemplate` (con campo `source`), interfacce `ParsedImport` etc. (se non già lì).
   - **Shared lib `libs/shared/dto`**: DTO per generate/revoke key, DTO per i tool MCP (request/response).
   - **Shared lib `libs/shared/utils`**: parser OpenAPI rifattorizzato + `js-yaml`.
   - **Backend module `api-keys`**: schema + service + controller + `ApiKeyGuard`.
   - **Backend module `mcp`**: controller (Streamable HTTP) + servizio basato su `@modelcontextprotocol/sdk`, riusa `services.service.ts` / `templates.service.ts` / `log.service.ts` per CRUD/import/invoke. Implementa optimistic locking, snapshot di sessione, audit collection, throttle bucket dedicato. Configura `instructions` e registra le resources `vs://reference/*` (vedi punto 16).
   - **Backend `system-templates` registry**: caricamento JSON da `apps/backend/src/assets/system-templates/`.
   - **Backend `mcp-resources`**: file markdown in `apps/backend/src/assets/mcp-resources/*.md` (`expressions.md`, `samples.md`, `error-codes.md`, `best-practices.md`).
   - **Frontend**: pagina "API & MCP", store NgRx `apiKeys`, dialog generate/revoke, snippet Claude Desktop.
2. Aggiungere `/mcp` e `/api-keys` a `apps/frontend/proxy.conf.json` (vincolo già emerso con la feature templates — il proxy elenca i prefissi uno per uno per scelta dell'utente, va aggiornato manualmente).
3. Aggiornare `claude/mcp.md` (nuovo file) con il catalogo errori e la documentazione utente del workflow MCP.

**File correlati esistenti che diventeranno importanti:**

- `apps/backend/src/app/services/services.service.ts` — `save`, `findAll`, `findOne`, `remove`, `restart`, `testCall`, `validateExpressionSizes` — riusabili per i tool authoring
- `apps/backend/src/app/services/log.service.ts` — riusabile per `get_logs`
- `apps/backend/src/app/templates/templates.service.ts` — riusabile per i tool template
- `apps/backend/src/app/mock-server/` — il `MockServerController` non si usa direttamente per l'`invoke_call` (loopback è HTTP), ma il pattern di matching path è la documentazione di riferimento
- `apps/frontend/src/app/services/import/parsers/` — parser OpenAPI da valutare per il refactor in `libs/shared/utils`

**Decisioni dell'utente registrate testualmente** (per non perderle nei riassunti):

- "il caso d'usa di virtual service è quello di creazione al volo di mock anche articolati ma persitenti. Usato da chi crea client web dove la parte server è ancora in sviluppo quindi non disponibile o disponibile solo parzialmente"
- "non ha senso come consumer" (sull'invocazione mock via MCP come pattern primario)
- "se l'url non è accessibile dal backend va proposta una strada alternativa" (motivazione per `import_from_openapi_content`)
- "con HTTP loopback segui il flusso reale che sarebbe usato dall'app sviluppata dall'utente quindi forse più realistico" (decisione su `invoke_call`)
- "credo sia il caso di averli disponibili entrambi" (sui due tool import OpenAPI)
- "potrebbe servire nel caso in cui quello che serve all'utente già esistesse... e l'IA dovrebbe restituire in ultimo i riferimenti al documento quindi le chiamate utili per usare il mock" (caso d'uso 5 sui templates)
