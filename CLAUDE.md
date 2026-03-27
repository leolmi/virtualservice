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
│   ├── frontend/                 ← Angular app
│   │   ├── src/
│   │   │   ├── app/              ← components, pages, state, routing
│   │   │   └── environments/     ← env configs (dev/prod)
│   │   ├── project.json          ← NX targets: build, serve, test, lint
│   │   └── proxy.conf.json       ← dev proxy: /api → backend:3000
│   │
│   └── backend/                  ← NestJS app
│       ├── src/
│       │   ├── app/              ← modules, controllers, services
│       │   └── main.ts           ← bootstrap entry point
│       └── project.json
│
├── libs/
│   ├── shared/
│   │   ├── dto/                  ← Data Transfer Objects (shared frontend/backend)
│   │   │   └── src/index.ts      ← barrel export
│   │   ├── model/                ← shared domain models/interfaces
│   │   └── utils/                ← pure helpers: validators, formatters
│   │
│   └── auth/                     ← auth utilities (backend-facing)
│       └── src/
│           ├── jwt.strategy.ts   ← Passport JWT strategy
│           └── auth.guard.ts     ← NestJS route guard
│
├── nx.json                       ← NX config: cache, affected, plugins
├── tsconfig.base.json            ← path aliases for all libs
└── package.json                  ← single package.json (single version policy)
```

---

## Tech Stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Frontend     | Angular (latest), NgRx, Angular Signals |
| Backend      | NestJS                                  |
| Database     | MongoDB via Mongoose                    |
| Auth         | JWT + Google OAuth                      |
| Shared libs  | TypeScript-only (`@nx/js`)              |
| Monorepo     | NX                                      |
| Node client  | Minimal standalone Node.js CLI          |

---

## Application Features

### 1. Mock Service Builder (Frontend)
- Users create **service containers**, each representing a mock service.
- Within each container, users define **M entry-points**, each composed of:
  - A **dynamic path segment** (globally unique across all served paths)
  - An **HTTP method** (GET, POST, PUT, DELETE, etc.)
  - A **response definition**: structure, status code, body
  - **Error handling**: real errors and simulated error scenarios
- Users can define **shared data structures** scoped to a service container to support dynamic querying across entry-points.

### 2. JSON Export
- A fully configured service can be exported as a **JSON file** containing the complete definition (metadata + all entry-points).
- This JSON is consumed by a lightweight **Node.js CLI client** that serves the mock service locally.

### 3. Mock Server (Backend)
- Responds on paths composed of:
  - A **fixed prefix** (native to the deployed app)
  - A **dynamic segment** defined by the user
- Applies the user-defined response logic, method constraints, and error simulations.

### 4. Authentication
- Standard **email/password login** with JWT.
- **Google OAuth** login supported.
- Each user accesses their own **private workspace** (isolated service definitions).

### 5. User Workspace (CRUD)
- Users can **create**, **read**, **update**, and **delete** mock services and their entry-points from the UI.

---

## Path Aliases (tsconfig.base.json)

All shared libs are accessible via aliases. Example:

```ts
import { CreateServiceDto } from '@virtualservice/shared/dto';
import { ServiceModel }     from '@virtualservice/shared/model';
import { formatPath }       from '@virtualservice/shared/utils';
import { AuthGuard }        from '@virtualservice/auth';
```

> Always import from lib barrel exports (`index.ts`), never from deep internal paths.

---

## State Management (Frontend)

- **NgRx Store** for global/feature state (services list, selected service, entry-points).
- **Angular Signals** for local component state and derived reactive values.
- Prefer Signals for UI-local state; use NgRx for state that must be shared across routes or persisted in the store.

### NgRx conventions
- Feature state lives under `apps/frontend/src/app/<feature>/store/`
- Naming: `<feature>.actions.ts`, `<feature>.reducer.ts`, `<feature>.effects.ts`, `<feature>.selectors.ts`
- Effects handle all HTTP calls; components never call services directly.

---

## Backend Conventions (NestJS + Mongoose)

- Each domain feature is a **NestJS module** under `apps/backend/src/app/<feature>/`.
- Mongoose **schemas** live in `<feature>/<feature>.schema.ts`.
- Business logic lives in `<feature>/<feature>.service.ts`; controllers are thin.
- DTOs are imported from `@virtualservice/shared/dto` — never redefined in the backend.
- Auth guards from `@virtualservice/auth` are applied at controller or route level via `@UseGuards(AuthGuard)`.

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

| Variable               | Used by   | Description                        |
|------------------------|-----------|------------------------------------|
| `MONGO_URI`            | backend   | MongoDB connection string          |
| `JWT_SECRET`           | backend   | Secret for signing JWT tokens      |
| `GOOGLE_CLIENT_ID`     | backend   | Google OAuth client ID             |
| `GOOGLE_CLIENT_SECRET` | backend   | Google OAuth client secret         |
| `BASE_URL`             | backend   | Public base URL of the app         |
| `PORT`                 | backend   | Port the NestJS server listens on  |
| `VIRTUALSERVICE_DEBUG` | backend   | `true` abilita il debug logging del path matching nel MockServerService (console, livello DEBUG) |

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
