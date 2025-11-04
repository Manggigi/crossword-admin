## Migration Plan: Rails Monolith to React Router + Hono Fullstack on Cloudflare

### Executive summary

This document captures the current Rails application’s architecture and provides a concrete plan to migrate it to a React Router + Hono fullstack template deployed on Cloudflare (Workers/Pages). It covers routing, persistence, authentication/authorization, file storage, background jobs, external integrations, and deployment.

---

## 1) What we run today (from code inspection)

- **App style**: Rails 7.1 monolith with:
  - Server-rendered admin UI (ERB views) at `admin/*` plus RailsAdmin mounted at `/explorer`.
  - A JSON API under `api/*` (Jbuilder views) for game clients.
- **Routing highlights** (`config/routes.rb`):
  - Root: `admin/daily/puzzles#index`.
  - Admin authentication: `admin/sign_in`, `admin/sign_up`, `admin/sign_out`.
  - Admin domains: `admin/daily/puzzles` (generate/submit/approve/publish/etc.), `admin/generate/*`, `admin/builder/*`, usage dashboards, users, collections, puzzles, grids.
  - API domains: groups → collections → puzzles; `puzzles/*` (daily/training/themed); player auth (`/api/players/sign_in`, `/sign_up`, guest signup), game sessions, session_hints, shares, hints.
- **Database**: PostgreSQL (via `pg`) with ActiveRecord. Schema includes enums (e.g., `solution_type`), relations across `puzzles`, `solutions`, `hints`, `game_sessions`, `player_users`, `admin_users`, `sessions`, ActiveStorage tables, etc. See `db/schema.rb`.
- **Authentication/authorization**:
  - Admin: `Admin::User` uses `has_secure_password`. Sessions are persisted in DB (`Session` model, polymorphic), cookie stores a signed session token referencing a row.
  - Player: `Player::User` uses `has_secure_password`; API uses token auth via signed tokens (`Player::Session.find_signed(token)`) in Authorization headers.
  - Authorization: Pundit-style policies present (`app/policies/*`).
- **Background jobs**: `delayed_job` with ActiveRecord backend (`delayed_job_active_record`). Example: `Puzzles::GenerateJob` for puzzle generation/publishing flows.
- **File storage**:
  - ActiveStorage configured for Disk (`config/storage.yml`).
  - `Puzzle` has an `icon` attachment (`has_one_attached :icon`), often attached from a URL.
- **Frontend assets**:
  - Server-rendered ERB views for admin.
  - Some embedded React for puzzle builder under `app/javascript/react/src` (Stimulus/Importmap/Turbo present).
- **External services**: OpenAI via `ruby-openai` (`app/services/gpt/*`), Sentry/NewRelic in production, Rswag for API docs (`/api-docs`).

Implications: This is a classic Rails HTML + JSON API monolith with DB-backed sessions, background jobs, and local ActiveStorage. Migrating to Cloudflare Hono means moving to stateless edge workers, externalizing state (DB/files), rewriting views as React Router pages, rewriting APIs and jobs, and replacing ActiveStorage.

---

## 2) Why React Router + Hono on Cloudflare

- **Unified app**: SSR + API on the edge using Hono. React Router handles client routing and SSR. Hono provides fast API routes.
- **Edge advantages**: Low-latency reads with serverless Postgres (e.g., Neon) or D1; static assets via Pages; queues/cron for jobs.
- **Trade-offs**: No Rails helpers, no ActiveRecord, no ActionView/ActiveStorage. Re-implement business logic in TypeScript. Externalize all state.

---

## 3) Migration targets (stack choices)

- **Runtime/hosting**: Cloudflare Workers or Pages Functions + static build.
- **Web framework**: Hono (TypeScript) for HTTP handling + middleware.
- **Frontend**: React + React Router; optional SSR using Hono template.
- **Database (recommended)**: Postgres via Neon serverless + Drizzle ORM.
  - Alternatives: Cloudflare D1 (SQLite) if features fit; Postgres features (enum, jsonb) map more naturally to Neon.
- **File storage**: Cloudflare R2 (S3-compatible) for `Puzzle#icon` and future uploads; signed URLs for upload/download.
- **Auth**:
  - Admin: HTTP-only secure cookie containing a short-lived JWT; sessions no longer persisted in DB by default.
  - Player: Bearer JWTs; refresh strategy via rotation or short-lived access + long-lived refresh cookies.
  - Authorization: Port Pundit rules to TS middleware/helpers keyed on role.
- **Background jobs**: Cloudflare Queues (and/or Cron Triggers) for puzzle generation, publishing, and other async tasks.
- **OpenAI**: Call OpenAI REST from Workers (`fetch`) using Cloudflare Secrets.
- **Docs**: Replace Rswag with Hono + OpenAPI (e.g., `@hono/zod-openapi`) or keep a static Swagger file generated from TS schemas.
- **Observability**: Sentry (browser + Workers SDK), Cloudflare Analytics/Logs.

---

## 4) Mapping current rails features → new design

### 4.1 Admin UI (ERB → React Router pages)

- Reimplement admin pages (lists, forms, actions) as React pages:
  - `admin/daily/puzzles/*` (index/show/edit/generate/submit/approve/publish/etc.)
  - `admin/generate/*`, `admin/builder/*` (integrate existing React builder logic, port to full React app)
  - `admin/usage/*` dashboards, `admin/users`, `admin/collections`, `admin/puzzles`.
- Use client-side forms + server calls to Hono APIs. For SSR, prefetch initial data in loader functions.

### 4.2 Public/Player API

- Port `api/*` endpoints to Hono routes 1:1 first, maintaining payloads to ease client migration:
  - Groups/Collections/Puzzles indexing and show
  - Player auth (sign_in/sign_up/guest), profiles
  - Game sessions (create/show/update), session_hints
  - Shares, hints

### 4.3 Authentication

- Admin:
  - Replace DB-backed `Session` with signed JWT cookie. Store minimal claims (admin_user_id, role, exp, iat).
  - Login route issues cookie; logout clears it. Middleware enforces auth + loads user from DB by id.
- Player:
  - Replace Rails signed tokens with JWT Bearer. `sign_in/sign_up/guest` issue tokens. Middleware validates and populates `CurrentPlayer`.
  - Optional refresh token cookies for longevity.
- Authorization:
  - Port Pundit policies to TS helpers (e.g., `requireRole('admin'|'editor'|...)`), applied per-route.

### 4.4 Database

- Prefer Neon Postgres + Drizzle:
  - Map AR models and relations to Drizzle schemas.
  - Keep enums (`solution_type`) and jsonb fields.
  - Migrations via Drizzle kit. Data migration via `pg_dump` → Neon import, or ETL scripts.
- D1 option: Only if we simplify schema and accept losing PG features.

### 4.5 File storage

- Replace ActiveStorage with R2:
  - Store `puzzle.icon` as object in R2 with `puzzle_id`-derived key.
  - Upload: generate presigned PUT URL from Hono; client uploads directly.
  - Access: serve via signed GET URL or public bucket with signed access where appropriate.

### 4.6 Background jobs

- Replace `delayed_job` with Cloudflare Queues:
  - Enqueue `Puzzles::GenerateJob` equivalent when generating puzzles; the consumer performs OpenAI calls and DB writes.
  - Publishing/archiving flows as idempotent job handlers.
  - Scheduled availability updates via Cron Triggers if needed.

### 4.7 OpenAI integration

- Port `Gpt::*Service` to TS modules using `fetch` to OpenAI API.
- Keep prompts; store API key in Cloudflare Secrets.

### 4.8 API documentation

- Adopt `@hono/zod-openapi` to define route schemas and auto-generate OpenAPI.
- Publish at `/api-docs` (serve Swagger UI static app + generated JSON).

---

## 5) Concrete answers to key questions

- **Server-rendered vs API?** Both. Admin is server-rendered ERB; a separate JSON API serves players. Hono fullstack is appropriate to cover both SSR and API.
- **State on server?** Yes: DB-backed sessions for admin, file attachments on disk, background jobs. Workers are stateless → move sessions to JWT, files to R2, jobs to Queues.
- **Database?** PostgreSQL with AR, enums, jsonb, many relations. Recommend Neon + Drizzle.
- **File storage?** ActiveStorage Disk. Move to R2 with presigned URLs.
- **Primary features?** Admin CMS for crosswords; puzzle generation/approval/publish flows; player gameplay API; hint generation with OpenAI; dashboards. Mixed compute + data access.
- **Authentication?** `has_secure_password` for Admin and Player. Admin via signed cookie pointing to `Session` row; Player via signed token in header. Map to JWTs.
- **Why SSR/fullstack vs SPA?** Admin pages benefit from SSR + protected server routes, and integrated API reduces latency. A separate SPA + API is possible but the fullstack template simplifies infra and co-locates logic.

---

## 6) Phased migration plan

### Phase 0: Foundations

- Create a new repo from the React Router + Hono Fullstack template.
- Set up CI, Prettier/ESLint, TS strict mode, environment typing.

### Phase 1: Data layer

- Provision Neon Postgres. Define Drizzle schemas matching Rails models (prioritize puzzles, solutions, hints, players, admin_users, sessions→removed, game_sessions, shares, groups, collections).
- Write migration scripts and seed minimal data.
- Optional: Initial one-time import from current Postgres.

### Phase 2: Auth

- Implement admin login/logout with secure HTTP-only cookie JWT.
- Implement player sign_in/sign_up/guest with Bearer JWT and (optional) refresh cookies.
- Add role-based guards. Add CSRF protection for cookie routes if needed.

### Phase 3: API parity

- Recreate `api/*` endpoints with identical request/response shapes first to ease client adoption.
- Add OpenAPI schemas. Add integration tests.

### Phase 4: Admin UI

- Build React pages for admin dashboards, users, collections, puzzles, daily flows, builder/generator.
- Port existing React builder code; adapt data layer and state management.

### Phase 5: Files

- Create R2 bucket. Implement presigned PUT/GET routes. Replace ActiveStorage URLs with R2 URLs in UI and API responses.

### Phase 6: Jobs

- Create Cloudflare Queue(s) and consumers for puzzle generation and publishing. Replace `delayed_job` triggers with Hono endpoints that enqueue work.
- Consider Cron for scheduled availability/publishing.

### Phase 7: OpenAI + Observability

- Port GPT services to TS. Configure Sentry (Workers + web), set CF logs/analytics dashboards.

### Phase 8: Docs, perf, rollout

- Publish `/api-docs`. Add caching (ETag/Cache-Control) for public GETs where safe. Load test hot endpoints.
- Plan cutover: read-only window, final data sync, DNS switch. Rollback plan documented.

---

## 7) Migration risks and mitigations

- **DB connections from Workers**: Use Neon serverless driver; avoid traditional pooled drivers.
- **Long-running jobs**: Workers have CPU/time limits → move to Queues/cron; chunk work; ensure idempotency.
- **ActiveStorage parity**: R2 lacks out-of-the-box transformations; use client-side image processing or a function worker if transforms are needed.
- **Auth security**: Carefully configure cookie flags (Secure, HttpOnly, SameSite), short JWT expiries, rotation.
- **Feature drift**: Lock response contracts with OpenAPI + tests.

---

## 8) Implementation checklist (abridged)

- Bootstrap Hono + React Router app; set CF project.
- Add Drizzle + Neon; define schemas; run migrations.
- Implement admin and player auth flows; middleware guards.
- Port core API endpoints; verify payloads.
- Build admin pages; integrate builder React.
- Add R2 storage and presigned routes; update icon handling.
- Add Queues for generation/publishing; wire OpenAI services.
- Replace Rswag with OpenAPI; add Sentry.
- Prepare cutover, run final import, switch traffic.

---

## 9) Appendix – route inventory (high-level)

- Admin
  - `/admin/sign_in|sign_up|sign_out`
  - `/admin/daily/puzzles` + actions: `generate`, `submit`, `approve`, `publish`, `unpublish`, `archive`, `clone_puzzle`, `update_availability`…
  - `/admin/generate/*`, `/admin/builder/*`, `/admin/usage/*`, `/admin/users`, `/admin/collections`, `/admin/puzzles`, `/admin/grids/:id`
- API (JSON)
  - `/api/groups/:id/collections/:id/puzzles`
  - `/api/puzzles/daily|training|themed`
  - `/api/players/sign_in|sign_up|guest/sign_up`, `/api/players/profile`
  - `/api/puzzles/:id/game_sessions`, `/api/game_sessions/:id/session_hints`
  - `/api/puzzles/:id/shares`, `/api/puzzles/:id/hints`

This inventory should be used to drive a route-by-route parity matrix during implementation.
