# school-management-system

Two apps, one repo: `web` (Next.js) and `api` (NestJS), backed by MySQL 8.4, fronted by Nginx.

## Structure

- `web/` — Next.js app. Routes live in `src/app/` (thin, App Router requires this location);
  actual feature code lives in `src/features/<feature>/`. There is **no shared `app/layout.tsx`**
  — `app/(user)/layout.tsx` and `app/admin/layout.tsx` are each an independent root layout (own
  `<html>`/`<body>`/metadata), Next.js's "multiple root layouts" pattern, because the end-user and
  staff portals are meant to be fully separate experiences (navigating between them is a full page
  reload, by design). Cross-cutting non-feature code mirrors the api side: `constants/`, `utils/`
  (pure, framework-agnostic), `helpers/` (cross-cutting but React/Next-aware), `lib/` (external
  service clients, e.g. `apiClient.ts` — the web equivalent of api's `infrastructure/`).
  See [docs/CONVENTIONS.md](docs/CONVENTIONS.md).
- `api/` — NestJS app. Feature code lives in `src/modules/<feature>/`, each with its own
  `<feature>.module.ts` imported into the root `AppModule`. See [docs/CONVENTIONS.md](docs/CONVENTIONS.md).
  Cross-cutting integrations (DB, and future ones like payment) live in `src/infrastructure/<name>/`
  — e.g. `src/infrastructure/database/data-source.ts` is the single source of TypeORM connection
  config, shared by the app (`app.module.ts`) and the TypeORM CLI (`npm run migration:*`).
  `synchronize` is always `false`; schema changes go through migrations in
  `src/infrastructure/database/migrations/`, auto-run on boot (`migrationsRun: true`).
  Authorization (RBAC) is centralized in `src/modules/authorization/` (CASL) — every role's
  permissions live in one factory, routes just declare what they need via `@CheckPolicies(...)`.
  See [docs/CONVENTIONS.md](docs/CONVENTIONS.md) for how to add a role or a permission.
  Auth is split into two portals sharing one `AuthModule`/`AuthService`: `AuthController`
  (`/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`) for end users (students), and
  `StaffAuthController` (`/auth/staff/*`, same four routes plus admin-only `/auth/staff/register`)
  for admins/teachers. Access tokens are short-lived (`JWT_EXPIRES_IN`, default 15m) and returned
  in the JSON body; refresh tokens (`JWT_REFRESH_SECRET`/`JWT_REFRESH_EXPIRES_IN`, default 7d)
  are **never** in the response body — they're set as an httpOnly cookie (`refresh_token` /
  `staff_refresh_token`, path `/auth`) so client-side JS can't read them, and are rotated + hashed
  with SHA-256 on every use (`hashRefreshToken` in `auth.service.ts`) — never bcrypt a raw JWT, it
  truncates at 72 bytes and same-user tokens share a long common prefix.
  Cross-cutting non-feature code lives in `constants/` (static values), `utils/` (pure, app-agnostic
  functions), and `helpers/` (cross-cutting but app-aware functions, e.g. `refresh-cookie.helper.ts`)
  — see [docs/CONVENTIONS.md](docs/CONVENTIONS.md) for the exact distinction.
- `.docker/` — Dockerfiles (`web/Dockerfile`, `api/Dockerfile`) and `nginx/default.conf`.
  `docker-compose.yml` itself stays at repo root.
- `docs/` — project docs (conventions, testing rules, commands). Markdown docs belong here, not at repo root.
- `docker.sh` — `./docker.sh up` registers the local fake domain `sms.site` in the hosts file and
  runs `docker compose up --build`; `./docker.sh down` stops it. Nginx routes `sms.site` → web,
  `sms.site/api` → api.
- `check.sh` / `npm run check` — lint + coverage-checked unit tests (`test:cov`) + e2e + build for
  both apps, mirroring what `.github/workflows/ci.yml` runs on push/PR to `main`/`develop` in one
  local command. `npm run test` (plain, no coverage threshold) still exists per-app for a faster
  inner-loop run.
- `api`'s e2e tests never touch the `db` service you use for manual dev/`sms.site` — each run
  spins up its own disposable MySQL via `testcontainers` (`api/test/testcontainers-*.ts`, wired in
  as Jest's `globalSetup`/`globalTeardown`/`setupFiles`) and tears it down afterward, so `npm run
  test:e2e`/`npm run check` can never write leftover rows into your real dev database. Docker must
  be installed and runnable for this — same requirement as `docker compose`.
- Full command reference: [docs/COMMANDS.md](docs/COMMANDS.md).

## Conventions

- Both apps share one Biome config at repo root (`biome.json`) for lint + format — no ESLint/Prettier.
  Run `npm run lint` / `npm run lint:fix` / `npm run format` inside `web/` or `api/`.
- Path alias `@/*` → `src/*` in both apps.
- Next.js components are always arrow functions (`const Foo = () => {}`, not `function Foo() {}`).
- Naming: `camelCase` vars/functions, `PascalCase` classes/components/types, `kebab-case` folders
  and NestJS artifact files, `PascalCase.tsx` for React component files, `snake_case` DB
  tables/columns. Full table: [docs/CONVENTIONS.md](docs/CONVENTIONS.md).
- Comments and descriptions inside code (docstrings, inline comments) are always in English,
  regardless of what language the conversation driving the change is in. This is about code only —
  conversation with the user stays in whatever language they're using.
- Full conventions (folder-by-feature structure, lint rules): [docs/CONVENTIONS.md](docs/CONVENTIONS.md).
- Testing rules (unit/e2e locations, naming, coverage thresholds): [docs/TESTING.md](docs/TESTING.md).

## Branching

`main` (default) ← `develop` ← feature branches (e.g. `feature/docker-setup`).

## Git workflow

Never `git commit` or `git push` without the user explicitly asking for it in that turn. Doing
the work (editing files, installing packages) is not consent to also commit it — ask, or wait to
be asked, even mid-task. This holds even if a previous turn in the same conversation asked for a
commit; that authorization does not carry forward automatically.

When a `git merge`/`rebase`/`cherry-pick` produces a conflict, don't resolve it unilaterally — even
when the "correct" resolution looks obvious. Stop, show the conflicting hunks and what each side
was trying to do, propose a resolution, and get the user's go-ahead before staging/committing it.

## Change workflow

Before making a code change (not just a doc tweak or a one-line fix the user already fully
specified), write out the proposed solution in plain text first — what will change, why, and any
trade-offs — and let the user review/confirm it before touching files. This matters most when
there's more than one reasonable approach, or the change touches something shared/hard to reverse
(CI, docker, auth, build scripts).

## Testing workflow

Don't run `npm run check` on your own initiative — it's slow and spins up a disposable Docker
container (api's e2e tests via `testcontainers`). Run the narrower, fast command that actually
verifies the change (`npm run lint`, `npm run test`, `npm run build`, one `test:e2e` file) and let
the user ask for `npm run check` when they want the full CI-equivalent pass.
