# school-management-system

Two apps, one repo: `web` (Next.js) and `api` (NestJS), backed by MySQL 8.4, fronted by Nginx.

## Structure

- `web/` — Next.js app. Routes live in `src/app/` (thin, App Router requires this location);
  actual feature code lives in `src/features/<feature>/`. See [docs/CONVENTIONS.md](docs/CONVENTIONS.md).
- `api/` — NestJS app. Feature code lives in `src/modules/<feature>/`, each with its own
  `<feature>.module.ts` imported into the root `AppModule`. See [docs/CONVENTIONS.md](docs/CONVENTIONS.md).
- `.docker/` — Dockerfiles (`web/Dockerfile`, `api/Dockerfile`) and `nginx/default.conf`.
  `docker-compose.yml` itself stays at repo root.
- `docs/` — project docs (conventions, testing rules, commands). Markdown docs belong here, not at repo root.
- `docker.sh` — `./docker.sh up` registers the local fake domain `sms.site` in the hosts file and
  runs `docker compose up --build`; `./docker.sh down` stops it. Nginx routes `sms.site` → web,
  `sms.site/api` → api.
- `check.sh` / `npm run check` — lint + unit test + build for both apps in one command. No CI
  pipeline yet (no Jenkins/GitHub Actions) — this is the manual substitute for now.
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
