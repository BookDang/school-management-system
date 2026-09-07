# Commands

## Root

Run `npm install` at the repo root after cloning (or after pulling changes to either app's
`package.json`) — its `postinstall` script cascades into `npm install` for both `web/` and `api/`,
so one command keeps all three in sync instead of installing each separately. It also runs
Husky's `prepare` step, wiring up `.husky/pre-push` to run `npm run check`, then `npm run sonar`
for both `api` and `web`, before every `git push` — blocking the push if any of them fail. The
Sonar steps need the local `sonarqube` container reachable and `SONAR_TOKEN` set in the root
`.env` (see the SonarQube section below); `docker compose run` auto-starts that container if it's
not already up, so a cold start adds real latency (30-60s+) to the first push after a restart.

| Command | What it does |
|---|---|
| `./docker.sh up` | Registers `sms.site` in the hosts file (once, idempotent), then `docker compose up --build` (web + api + db + nginx). Access at `http://sms.site`. |
| `./docker.sh down` | Stops the containers (`docker compose down`). Leaves the `sms.site` hosts entry in place (harmless once containers are stopped). |
| `PURGE_HOSTS=1 ./docker.sh down` | Same as `./docker.sh down`, and also removes the `sms.site` line from the hosts file. |
| `npm run check` | Runs lint + `test:cov` (coverage-enforced) + e2e + build for both `api` and `web` — the same checks CI runs, in one command (see `check.sh`). Requires Docker: api's e2e tests provision their own disposable MySQL via `testcontainers` (never touching the `db` service you use for manual dev). |
| `docker compose up --build` | Same as `./docker.sh up` minus the hosts-file step. |
| `docker compose down` | Same as `./docker.sh down` minus the hosts-file check. |
| `docker compose down -v` | Same, and also deletes the `db_data` volume — wipes the MySQL database. |
| `docker compose ps` | List the stack's containers and their status. |
| `docker compose logs -f <service>` | Follow logs for one service (`web`, `api`, `db`, or `nginx`). |
| `docker compose restart <service>` | Restart one service without rebuilding (e.g. after an env var change). |
| `docker compose exec <service> sh` | Shell into a running container. |
| `docker compose up -d --build --renew-anon-volumes <service>` | Rebuild one service and force-refresh its anonymous `node_modules` volume — see "Adding an npm dependency" below for when this is needed. |

## SonarQube (`api/` and `web/`)

### Local (persistent instance, manual)

`./docker.sh up` / `docker compose up` also starts a `sonarqube` service (SonarQube Community
Edition) on the same `sms_network`, at `http://localhost:9000` (override the host port with
`SONARQUBE_PORT`). It's a JVM app with its own bundled database — noticeably heavier than the
other services, and takes ~30-60s to report healthy on first boot. Data persists across restarts
(named volumes), so this is the one to use for tracking quality trends over time.

One-time setup:
1. Bring the stack up, then open `http://localhost:9000` (default login `admin` / `admin`, you'll
   be forced to change it).
2. Generate a token (**My Account → Security → Generate Token**) — the project itself
   (`school-management-system-api` / `school-management-system-web`, matching each app's
   `sonar-project.properties`) is auto-created on first analysis, no need to create it by hand.
3. Put that token in your root `.env` as `SONAR_TOKEN=...` (see `.env.example`).

Then, from `api/` or `web/`:

| Command | What it does |
|---|---|
| `npm run sonar` | Runs `test:cov` to refresh `coverage/lcov.info`, then runs the analysis via the `sonar-scanner`/`sonar-scanner-web` service (`sonarsource/sonar-scanner-cli`) against the running `sonarqube` service. Results show up on the project's dashboard at `http://localhost:9000`. |

`sonar-scanner`/`sonar-scanner-web` are one-off jobs (Compose `profiles: ["tools"]`), not part of
the always-on stack — they only run when explicitly invoked (`npm run sonar`, or
`docker compose run --rm sonar-scanner` / `sonar-scanner-web`), not on every `docker compose up`.
Analysis config lives in each app's `sonar-project.properties` (source/test globs, exclusions
mirroring that app's `collectCoverageFrom`, and the path to the lcov report Jest already produces).

### CI (GitHub Actions, on every push/PR)

`ci.yml`'s `api` and `web` jobs each spin up their own **ephemeral** `sonarqube:community` service
container for that run, wait for it to report healthy, generate a fresh admin token against it,
then run `sonarsource/sonarqube-scan-action` after `test:cov`. This needs no externally-hosted
server or repo secret — but each run's SonarQube instance is thrown away afterward, so **there is
no dashboard or quality-trend history in CI**, only that run's pass/fail and log output. Use the
local persistent instance above if you want to browse results or track trends over time.

## Adding an npm dependency (`web/` or `api/`)

Both apps' Dockerfiles (`.docker/web/Dockerfile`, `.docker/api/Dockerfile`) do `COPY package*.json ./`
then `RUN npm install` at image-build time, and `docker-compose.yml` mounts each app's `node_modules`
as an **anonymous volume** (`/app/node_modules`) so the container's installed packages don't get
clobbered by the `./web:/app` / `./api:/app` bind mount of your source tree.

That anonymous volume is the gotcha: Compose reuses it across `docker compose up --build` by
default, so a plain rebuild after adding a package still runs the **old** container's `node_modules`
— the new dependency 404s with "Module not found" even though the image was rebuilt correctly.

1. Install on the host as usual (updates `package.json`/`package-lock.json`, which the bind mount
   needs anyway for the source tree to be in sync):
   ```bash
   cd web && npm install <package>   # or: cd api && npm install <package>
   ```
2. Rebuild **and force-renew the anonymous volume** for that service:
   ```bash
   docker compose up -d --build --renew-anon-volumes web   # or: api
   ```
   Skipping `--renew-anon-volumes` (or its short form `-V`) is what leaves the stale `node_modules`
   in place.

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

Swagger/OpenAPI docs are served at `/docs` (`http://localhost:4000/docs` standalone, or
`http://sms.site/api/docs` through the dockerized stack — nginx's `/api/` prefix strip turns
`/docs` on the container into `/api/docs` for the browser). Raw spec at `/docs-json`. Configured in
`main.ts` via `@nestjs/swagger`'s `DocumentBuilder`/`SwaggerModule`.

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
| `npm run test:e2e` | E2E tests (`*.e2e-spec.ts` in `test/`, Supertest against an in-process app). Provisions its own disposable MySQL via `testcontainers` (Docker required) instead of using the `db` service — see `test/testcontainers-*.ts`. Runs `--runInBand` since all spec files share that one container. |
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
