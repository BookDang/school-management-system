# Commands

## Root

| Command | What it does |
|---|---|
| `./docker.sh up` | Registers `sms.site` in the hosts file (once, idempotent), then `docker compose up --build` (web + api + db + nginx). Access at `http://sms.site`. |
| `./docker.sh down` | Stops the containers (`docker compose down`). Leaves the `sms.site` hosts entry in place (harmless once containers are stopped). |
| `PURGE_HOSTS=1 ./docker.sh down` | Same as `./docker.sh down`, and also removes the `sms.site` line from the hosts file. |
| `npm run check` | Runs lint + unit test + build for both `api` and `web` (see `check.sh`). |
| `docker compose up --build` | Same as `./docker.sh up` minus the hosts-file step. |
| `docker compose down` | Same as `./docker.sh down` minus the hosts-file check. |

## `web/` (Next.js)

Run from inside `web/` (`cd web`), or `npm --prefix web run <script>` from root.

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (`http://localhost:3000`). |
| `npm run build` | Production build. |
| `npm run start` | Run the production build (after `build`). |
| `npm run lint` | Check formatting/lint rules with Biome. |
| `npm run lint:fix` | Same, but auto-fixes what it can. |
| `npm run format` | Format all files with Biome. |
| `npm run typecheck` | Fast standalone type-check via `tsgo` (`@typescript/native-preview`, Microsoft's Go-ported compiler preview) — runs `next typegen` first so Next's generated route/layout types (`LayoutProps`, etc.) exist, since `tsgo` doesn't run Next's codegen itself. Supplementary to `npm run build`'s own type-check, not a replacement — `tsgo` is a preview build, web-only for now (not added to `api`, which leans on `emitDecoratorMetadata`/decorators that `tsgo` doesn't fully support yet). |
| `npm run test` | Unit tests (Jest + React Testing Library). |
| `npm run test:watch` | Unit tests in watch mode. |
| `npm run test:cov` | Unit tests with coverage report. |
| `npm run test:e2e` | E2E tests (Playwright) against `http://localhost:3000`, auto-starting `next dev`. |
| `npm run test:e2e:ui` | Same, with Playwright's UI runner. |

Point e2e tests at the dockerized stack instead: `PLAYWRIGHT_BASE_URL=http://sms.site npm run test:e2e`.

## `api/` (NestJS)

Run from inside `api/` (`cd api`), or `npm --prefix api run <script>` from root.

| Command | What it does |
|---|---|
| `npm run start:dev` | Start in watch mode (`http://localhost:4000`). |
| `npm run start` | Start once, no watch. |
| `npm run start:prod` | Run the compiled `dist/main.js` (after `build`). |
| `npm run build` | Compile to `dist/`. |
| `npm run lint` | Check formatting/lint rules with Biome. |
| `npm run lint:fix` | Same, but auto-fixes what it can. |
| `npm run format` | Format all files with Biome. |
| `npm run test` | Unit tests (`*.spec.ts` in `src/`). |
| `npm run test:watch` | Unit tests in watch mode. |
| `npm run test:cov` | Unit tests with coverage report. |
| `npm run test:e2e` | E2E tests (`*.e2e-spec.ts` in `test/`, Supertest against an in-process app). |
| `npm run migration:generate -- src/infrastructure/database/migrations/<Name>` | Diff entities against the DB and generate a migration file. Needs a real MySQL running (`docker compose up -d db`) and `api/.env` pointed at it. |
| `npm run migration:run` | Apply pending migrations (also happens automatically on app boot via `migrationsRun: true`). |
| `npm run migration:revert` | Roll back the last applied migration. |
| `npm run migration:create -- src/infrastructure/database/migrations/<Name>` | Create an empty migration file to hand-write (no DB diff). |

### Migrations when running via Docker

Running `api` through `docker compose`/`./docker.sh up` already applies pending migrations
automatically on container start (`migrationsRun: true` in `app.module.ts`) — no manual step
needed just to pick up existing migrations.

To **generate** a new migration (or run `migration:revert`) while the stack is up, run it inside
the running `api` container instead of on the host — the container's `DB_HOST` (`db`, the Docker
service name) only resolves on the Docker network, not from your host machine:

```bash
docker compose exec api npm run migration:generate -- src/infrastructure/database/migrations/<Name>
```

`api`'s `./api:/app` bind mount means the generated file is written straight to your host's
`api/src/infrastructure/database/migrations/` — no need to copy it out of the container.

See [TESTING.md](TESTING.md) for testing conventions and [CONVENTIONS.md](CONVENTIONS.md) for
code/naming rules.
