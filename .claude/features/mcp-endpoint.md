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

## Note operative — come riprendere

**Stato**: solo analisi, **nessuna riga di codice scritta**. Niente file modificati.

**Prossimi passi nell'ordine consigliato:**

1. Chiudere punto A (tool extra) con l'utente
2. Verificare punto E leggendo `apps/frontend/src/app/services/import/parsers/` per decidere il refactor
3. Buttare giù un piano implementativo come fatto per la feature templates, suddiviso per:
   - Shared lib: model `IApiKey`, DTO per generate/revoke key
   - Backend module `api-keys` (schema + service + controller + guard)
   - Backend module `mcp` (controller + servizio MCP basato su `@modelcontextprotocol/sdk`, riusa servizi esistenti per CRUD/import/invoke)
   - Frontend: pagina "API & MCP", store NgRx `apiKeys`, dialog generate/revoke, snippet Claude Desktop
4. Aggiungere `/mcp` e `/api-keys` (o equivalenti) a `apps/frontend/proxy.conf.json` (vincolo già emerso con la feature templates — il proxy elenca i prefissi uno per uno per scelta dell'utente, va aggiornato manualmente)

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
