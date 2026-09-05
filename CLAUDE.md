# school-management-system

Two apps, one repo: `web` (Next.js) and `api` (NestJS), backed by MySQL 8.4, fronted by Nginx.

## Structure

- `web/` — Next.js app. Routes live in `src/app/` (thin, App Router requires this location);
  actual feature code lives in `src/features/<feature>/`. See [docs/CONVENTIONS.md](docs/CONVENTIONS.md).
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
- `.docker/` — Dockerfiles (`web/Dockerfile`, `api/Dockerfile`) and `nginx/default.conf`.
  `docker-compose.yml` itself stays at repo root.
- `docs/` — project docs (conventions, testing rules, commands). Markdown docs belong here, not at repo root.
- `docker.sh` — `./docker.sh up` registers the local fake domain `sms.site` in the hosts file and
  runs `docker compose up --build`; `./docker.sh down` stops it. Nginx routes `sms.site` → web,
  `sms.site/api` → api.
- `check.sh` / `npm run check` — lint + unit test + build for both apps in one command; also what
  `.github/workflows/ci.yml` runs on push/PR to `main`/`develop` (api's e2e job needs a MySQL
  service container — see the workflow file if editing it).
- Full command reference: [docs/COMMANDS.md](docs/COMMANDS.md).

## Conventions

- Both apps share one Biome config at repo root (`biome.json`) for lint + format — no ESLint/Prettier.
  Run `npm run lint` / `npm run lint:fix` / `npm run format` inside `web/` or `api/`.
- Path alias `@/*` → `src/*` in both apps.
- Next.js components are always arrow functions (`const Foo = () => {}`, not `function Foo() {}`).
- Naming: `camelCase` vars/functions, `PascalCase` classes/components/types, `kebab-case` folders
  and NestJS artifact files, `PascalCase.tsx` for React component files, `snake_case` DB
  tables/columns. Full table: [docs/CONVENTIONS.md](docs/CONVENTIONS.md).
- Full conventions (folder-by-feature structure, lint rules): [docs/CONVENTIONS.md](docs/CONVENTIONS.md).
- Testing rules (unit/e2e locations, naming, coverage thresholds): [docs/TESTING.md](docs/TESTING.md).

## Branching

`main` (default) ← `develop` ← feature branches (e.g. `feature/docker-setup`).

## Git workflow

Never `git commit` or `git push` without the user explicitly asking for it in that turn. Doing
the work (editing files, installing packages) is not consent to also commit it — ask, or wait to
be asked, even mid-task. This holds even if a previous turn in the same conversation asked for a
commit; that authorization does not carry forward automatically.
