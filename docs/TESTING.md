# Testing rules

## api (NestJS)

| Type | Location | Naming | Command |
|---|---|---|---|
| Unit | co-located in `src/` | `*.spec.ts` | `npm run test` |
| E2E | `test/` | `*.e2e-spec.ts` | `npm run test:e2e` |

- Unit tests mock all dependencies via `@nestjs/testing`'s `Test.createTestingModule` — no real DB/network calls.
- E2E tests boot the full `AppModule` with Supertest and hit real HTTP routes; they may talk to the `db` service from `docker-compose.yml`.
- Coverage threshold (`npm run test:cov`): 70% branches/functions/lines/statements, enforced via `coverageThreshold` in `package.json`.
- Path alias `@/*` is available in both configs (`package.json` jest block and `test/jest-e2e.json`).

## web (Next.js)

| Type | Location | Naming | Command |
|---|---|---|---|
| Unit | co-located in `src/` | `*.test.tsx` / `*.test.ts` | `npm run test` |
| E2E | `e2e/` | `*.spec.ts` | `npm run test:e2e` |

- Unit tests use Jest + React Testing Library (`jest.config.ts`, `jest.setup.ts`); test behavior/output, not implementation details — query by role/text, not by class name.
- E2E tests use Playwright (`playwright.config.ts`) and drive a real browser against `npm run dev` (`http://localhost:3000` by default). Point them at the dockerized stack instead with `PLAYWRIGHT_BASE_URL=http://sms.site npm run test:e2e`.
- Coverage threshold (`npm run test:cov`): 70% branches/functions/lines/statements.

## General rule

A change to `src/` needs a matching unit test in the same PR. A new user-facing flow (a page, an API route) needs at least one E2E test. Both apps must pass `lint`, `test`, and `test:e2e` before merging into `develop`.
