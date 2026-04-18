# CLAUDE.md — virtualservice Workspace Guide

This file describes the architecture, conventions, and commands for this NX monorepo.
It is intended to help AI assistants (and new developers) understand the project quickly and contribute effectively.

---

## Project Overview

**virtualservice** is a full-stack NX monorepo that provides a web interface for creating and managing **mock web services**.

Users can define "containers" (mock services), each with multiple entry-points (routes). Each entry-point exposes a dynamic URL path, an HTTP method, a response structure, error handling logic, and optional shared data models. Once configured, the user can export the entire service definition as a JSON file, which can be served locally via a minimal Node.js CLI client.

The platform also handles user authentication, including Google OAuth login, giving each user a private workspace to create, edit, and delete their mock services.

---

## Monorepo Structure

```
virtualservice/
├── apps/
│   ├── frontend/                     ← Angular app (standalone components, NgRx, Signals)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── auth/             ← login page + NgRx auth store
│   │   │   │   ├── services/         ← services list page + NgRx services store + import parsers
│   │   │   │   ├── editor/           ← editor page + NgRx editor store + child pages
│   │   │   │   │   ├── call/         ← child: call definition
│   │   │   │   │   ├── test/         ← child: call test
│   │   │   │   │   ├── database/     ← child: service db definition
│   │   │   │   │   ├── function/     ← child: timed scheduler function
│   │   │   │   │   └── components/   ← empty-call, base-path-dialog, rule-dialog
│   │   │   │   ├── monitor/          ← monitor page (polling log viewer)
│   │   │   │   ├── management/       ← admin management page
│   │   │   │   ├── help/             ← help page
│   │   │   │   ├── legal/            ← legal page
│   │   │   │   └── core/             ← toolbar, guards, interceptors, pipes, services
│   │   │   └── environments/         ← env configs (dev/prod)
│   │   ├── project.json
│   │   └── proxy.conf.json           ← dev proxy: /api → backend:3000
│   │
│   └── backend/                      ← NestJS app
│       ├── src/
│       │   ├── app/
│       │   │   ├── auth/             ← strategies (local/jwt/google), guards, AuthService
│       │   │   ├── users/            ← UsersService, admin bootstrap
│       │   │   ├── services/         ← ServicesService, LogService
│       │   │   ├── mock-server/      ← MockServerService, ServiceCacheService, workers/calc
│       │   │   ├── mail/             ← MailService (Nodemailer)
│       │   │   └── common/           ← request-logger middleware
│       │   └── main.ts               ← bootstrap entry point
│       └── project.json
│
├── libs/
│   ├── shared/
│   │   ├── dto/                      ← Data Transfer Objects (shared frontend/backend)
│   │   ├── model/                    ← IService, IServiceCall, ILog, HttpVerb, etc.
│   │   └── utils/                    ← pure helpers: validators, formatters
│   │
│   └── auth/                         ← JwtAuthGuard, RolesGuard, Roles decorator
│
├── claude/                           ← documentazione AI (model, server, client, pagine)
├── nx.json                           ← NX config
├── tsconfig.base.json                ← path aliases per le libs
└── package.json                      ← single package.json (single version policy)
```

---

## Tech Stack

| Layer        | Technology                                                      |
|--------------|-----------------------------------------------------------------|
| Frontend     | Angular 21, Angular Material 21 (M3), NgRx 19, Angular Signals |
| Backend      | NestJS 11                                                       |
| Database     | MongoDB via Mongoose                                            |
| Auth         | JWT + Passport (local, JWT, Google OAuth)                       |
| Shared libs  | TypeScript-only (`@nx/js`)                                      |
| Monorepo     | NX 22.5.3                                                       |
| Node client  | Minimal standalone Node.js CLI (definito in `claude/client.md`) |

---

## Application Features

### 1. Mock Service Builder (Frontend)
- Users create **service containers** (`Service`), each with a globally unique `path` prefix.
- Within each container, users define **entry-points** (`ServiceCall`), each composed of:
  - A **call path** (can include dynamic segments `{name}`)
  - An **HTTP method** (GET, POST, PUT, PATCH, DELETE)
  - A **response** (stringa-js): JS expression evaluated at runtime
  - **Rules** (`ServiceCallRule`): JS conditions that short-circuit the response with an HTTP error
  - **Parameters**, **headers**, **cookies** for the call
- Users define a **shared database** (`dbo`, stringa-js) scoped to the service, shared across all entry-points.
- Users can configure a **timed scheduler** (`schedulerFn` + `interval`) that mutates the db periodically.
- The editor supports **file drop** to import calls from: curl, HAR, Swagger/OpenAPI, Postman, Insomnia.

### 2. JSON Export / Import
- Each service can be downloaded as a **JSON file** from the service tile.
- The JSON can be imported via file drop on the services or editor pages.
- See `claude/client.md` for the CLI client that serves the exported JSON locally.

### 3. Mock Server (Backend)
- All requests to `/service/<service-path>/<call-path>` are intercepted by `MockServerController`.
- Path matching is **positional** with priority: explicit segments before dynamic `{name}` segments.
- First invocation initializes the service cache (evaluates `dbo`, starts `schedulerFn` timer).
- Rules are evaluated in order; first truthy rule returns the configured HTTP error.
- Response is computed by evaluating the `response` stringa-js in a dedicated **Worker thread**.
- Every request is logged to MongoDB (`Log` collection).
- `OPTIONS` requests return 200 if any call with that path exists (CORS preflight support).
- A service with `active=false` returns 503.

### 4. Authentication
- Standard **email/password login** with email verification flow.
- **Password reset** via email.
- **Google OAuth** login.
- Each user has a private workspace (isolated service definitions).
- Admin role with bootstrap via `VIRTUALSERVICE_ADMIN_EMAIL`.

### 5. User Workspace (CRUD)
- Users can **create**, **read**, **update**, and **delete** mock services and entry-points from the UI.
- Services can be marked as **starred** (shown in a separate section on the services page).
- Services can be **activated/deactivated** without deletion.

### 6. Monitor
- Real-time log viewer at `/monitor/:id` with 2-second polling.
- Filterable by path; expandable detail panel shows request/response JSON.
- Log can be cleared; service can be restarted (cache reset) directly from the monitor.

### 7. Admin Management
- `/management` (admin only): lists all users with their services.
- Admin can delete users permanently, restore deletion requests, download per-service JSON.
- Admin can send bulk emails to all users or a selected subset.
- Full database backup downloadable as JSON.

---

## Path Aliases (tsconfig.base.json)

All shared libs are accessible via aliases. Example:

```ts
import { LoginDto }         from '@virtualservice/shared/dto';    // libs/shared/dto/src/index.ts
import { IService }         from '@virtualservice/shared/model';  // libs/shared/model/src/index.ts
import { formatPath }       from '@virtualservice/shared/utils';  // libs/shared/utils/src/index.ts
import { JwtAuthGuard }     from '@virtualservice/auth';          // libs/auth/src/index.ts
```

> Always import from lib barrel exports (`index.ts`), never from deep internal paths.

---

## State Management (Frontend)

- **NgRx Store** for global/feature state (services list, selected service, entry-points).
- **Angular Signals** for local component state and derived reactive values.
- Prefer Signals for UI-local state; use NgRx for state that must be shared across routes or persisted in the store.

### NgRx store keys
| Store key  | State type       | Feature                                   |
|------------|-----------------|-------------------------------------------|
| `auth`     | `AuthState`      | `{ user, token, loading, error }`         |
| `services` | `ServicesState`  | `{ items, loading, saving, error }`       |
| `editor`   | `EditorState`    | `{ service, activeCall, loading, dirty }` |

### NgRx conventions
- Feature state lives under `apps/frontend/src/app/<feature>/store/`
- Naming: `<feature>.actions.ts`, `<feature>.reducer.ts`, `<feature>.effects.ts`, `<feature>.selectors.ts`
- Effects handle all HTTP calls; components never call services directly.
- `IServiceItem = IService & { _id: string }` (defined in `services.state.ts`)

---

## Backend Conventions (NestJS + Mongoose)

- Each domain feature is a **NestJS module** under `apps/backend/src/app/<feature>/`.
- Mongoose **schemas** live in `<feature>/<feature>.schema.ts`.
- Business logic lives in `<feature>/<feature>.service.ts`; controllers are thin.
- DTOs are imported from `@virtualservice/shared/dto` — never redefined in the backend.
- Auth guards from `@virtualservice/auth` are applied at controller or route level via `@UseGuards(JwtAuthGuard)`.

### Backend route map (nessun global prefix)
| Method | Path                          | Auth     | Description                                 |
|--------|-------------------------------|----------|---------------------------------------------|
| POST   | `/auth/register`              | —        | Registrazione locale + email verifica       |
| POST   | `/auth/login`                 | —        | Login locale (LocalGuard → JWT)             |
| POST   | `/auth/reset-password`        | —        | Reset password via email                    |
| GET    | `/auth/verify-email`          | —        | Verifica email con token                    |
| POST   | `/auth/resend-verification`   | —        | Reinvia email di verifica                   |
| GET    | `/auth/google`                | —        | Redirect OAuth Google                       |
| GET    | `/auth/google/callback`       | —        | Callback OAuth, redirect frontend con token |
| GET    | `/auth/me`                    | JWT      | Profilo utente corrente                     |
| PATCH  | `/users/password`             | JWT      | Aggiorna password                           |
| DELETE | `/users/me`                   | JWT      | Richiesta eliminazione account              |
| GET    | `/users`                      | JWT+Admin| Lista tutti gli utenti con servizi          |
| GET    | `/users/backup`               | JWT+Admin| Download backup JSON del database           |
| DELETE | `/users/:id`                  | JWT+Admin| Elimina utente e servizi                    |
| PATCH  | `/users/:id/restore`          | JWT+Admin| Annulla richiesta cancellazione             |
| POST   | `/users/send-mail`            | JWT+Admin| Invia email agli utenti                     |
| GET    | `/services`                   | JWT      | Lista servizi dell'utente                   |
| GET    | `/services/:id`               | JWT      | Servizio per id                             |
| GET    | `/services/check-path`        | JWT      | Verifica unicità globale del path           |
| GET    | `/services/monitor/:id/:last?`| JWT      | Log chiamate (opzionale: solo dopo `last`)  |
| POST   | `/services`                   | JWT      | Upsert servizio                             |
| POST   | `/services/restart`           | JWT      | Reset cache dbo del servizio                |
| DELETE | `/services/:id`               | JWT      | Elimina servizio                            |
| DELETE | `/services`                   | JWT      | Elimina tutto il log dell'utente            |
| ALL    | `/service/*path`              | —        | Entry-point chiamate mock (MockServer)      |

---

## Coding Conventions

### General
- **TypeScript strict mode** is enabled — no `any`, no implicit returns.
- Shared types, interfaces, and DTOs always live in `libs/`, never duplicated in apps.
- One feature per NestJS module; one feature per Angular `feature/` folder.

### Angular
- Use **standalone components** (no NgModules unless required).
- Use `inject()` instead of constructor injection.
- Signal-based inputs (`input()`, `output()`) preferred over `@Input()`/`@Output()` decorators.
- File naming: `kebab-case.component.ts`, `kebab-case.service.ts`, etc.

### NestJS
- Validate all incoming payloads with `class-validator` decorators on DTOs.
- Use `@nestjs/config` for environment variables — never `process.env` directly.
- Return consistent response shapes; use interceptors for envelope wrapping if needed.

### Git
- Branch naming: `feature/<short-description>`, `fix/<short-description>`.
- Commits follow Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, etc.

---

## NX Commands

### Development

```bash
# Serve frontend (Angular dev server + proxy to backend)
nx serve frontend

# Serve backend (NestJS)
nx serve backend

# Serve both simultaneously (requires @nx/run-many or a terminal multiplexer)
nx run-many -t serve -p frontend backend
```

### Build

```bash
nx build frontend           # Production build of Angular app
nx build backend            # Production build of NestJS app
nx run-many -t build        # Build all projects
```

### Test

```bash
nx test frontend            # Unit tests (Jest)
nx test backend
nx run-many -t test         # All tests
nx affected -t test         # Only affected projects (CI recommended)
```

### Lint

```bash
nx lint frontend
nx lint backend
nx run-many -t lint
nx affected -t lint
```

### Generate code

```bash
# New Angular standalone component
nx g @nx/angular:component <name> --project=frontend --standalone

# New NestJS module
nx g @nx/nest:module <name> --project=backend

# New shared lib
nx g @nx/js:lib shared/<name>
```

### NX Graph

```bash
nx graph                    # Visual dependency graph in browser
nx affected:graph           # Only affected projects
```

---

## Environment Variables

| Variable                              | Used by        | Description                                                                 |
|---------------------------------------|----------------|-----------------------------------------------------------------------------|
| `VIRTUALSERVICE_MONGO_URI`            | backend        | MongoDB connection string (default: `mongodb://localhost:27017/virtualservice`) |
| `PORT`                                | backend        | Port the NestJS server listens on                                           |
| `JWT_SECRET`                          | backend        | Secret for signing JWT tokens                                               |
| `JWT_EXPIRES_IN`                      | backend        | JWT expiration (e.g. `7d`)                                                  |
| `GOOGLE_CLIENT_ID`                    | backend        | Google OAuth client ID                                                      |
| `GOOGLE_CLIENT_SECRET`                | backend        | Google OAuth client secret                                                  |
| `GOOGLE_CALLBACK_URL`                 | backend        | Google OAuth callback URL                                                   |
| `BASE_URL`                            | backend        | Public base URL of the app (used in email links)                            |
| `FRONTEND_URL`                        | backend        | Frontend URL for post-OAuth redirect                                        |
| `SMTP_HOST`                           | backend        | SMTP server hostname                                                        |
| `SMTP_PORT`                           | backend        | SMTP port (default: 587; 465 → SSL)                                         |
| `SMTP_USER`                           | backend        | SMTP authentication username                                                |
| `SMTP_PASS`                           | backend        | SMTP authentication password                                                |
| `SMTP_FROM`                           | backend        | From address for outgoing emails                                            |
| `VIRTUALSERVICE_DEBUG`                | backend        | `true` abilita il debug logging del path matching nel MockServerService     |
| `VIRTUALSERVICE_EXPRESSION_SIZE_LIMIT`| backend        | Max byte size for stringa-js expressions (enforced on save)                 |
| `VIRTUALSERVICE_DB_SIZE_LIMIT`        | backend        | Max byte size del db in cache per servizio (`ServiceCacheService`)          |
| `VIRTUALSERVICE_ADMIN_EMAIL`          | backend        | Email dell'utente admin bootstrappato all'avvio se non esiste               |
| `VIRTUALSERVICE_ADMIN_PASSWORD`       | backend        | Password dell'utente admin bootstrappato all'avvio se non esiste            |
| `CALC_CODE_EXECUTING_TIMEOUT`         | backend worker | Timeout in ms per l'esecuzione delle espressioni JS (default: 10000)        |
| `CALC_MAX_YOUNG_GENERATION_SIZE_MB`   | backend worker | Heap young generation limit per il worker calc (default: 64)                |
| `CALC_MAX_OLD_GENERATION_SIZE_MB`     | backend worker | Heap old generation limit per il worker calc (default: 64)                  |
| `CALC_CODE_RANGE_SIZE_MB`             | backend worker | Code range size per il worker calc (default: 64)                            |

> Local values go in `apps/backend/.env` (gitignored). Never commit secrets.

---

## Key Design Decisions

- **Single `package.json`** at root — all dependencies are hoisted; no per-app package files.
- **Shared DTOs** ensure the frontend and backend always agree on data shapes without duplication.
- **Dynamic path uniqueness** is enforced globally — the backend must validate that no two entry-points share the same composed path.
- **JSON export** is a pure serialization of the in-memory/DB service definition — the Node CLI client is intentionally decoupled from the web app.

---

## model

The model that defines the data structure used is in the **claude/model.md** file (in italian)

---

## Server

The server logic is definited in file **claude/server.md**

---

## Client

The client is definited in file **claude/client.md**
