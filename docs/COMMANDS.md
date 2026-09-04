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

See [TESTING.md](TESTING.md) for testing conventions and [CONVENTIONS.md](CONVENTIONS.md) for
code/naming rules.
