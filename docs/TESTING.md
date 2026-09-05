# Testing rules

## api (NestJS)

| Type | Location | Naming | Command |
|---|---|---|---|
| Unit | co-located in `src/` | `*.spec.ts` | `npm run test` |
| E2E | `test/` | `*.e2e-spec.ts` | `npm run test:e2e` |

- Unit tests mock all dependencies via `@nestjs/testing`'s `Test.createTestingModule` — no real DB/network calls.
- E2E tests boot the full `AppModule` with Supertest and hit real HTTP routes; they may talk to the `db` service from `docker-compose.yml`.
- Coverage threshold (`npm run test:cov`): 90% functions/lines/statements, 79% branches — enforced via `coverageThreshold` in `package.json`. Branches is capped lower on purpose: TypeScript's decorator compilation (`@Injectable()`, `@Controller()`, constructor parameter properties, `@Column()` etc.) emits `__decorate`/`__metadata` helper branches that are structurally always taken the same way given our `reflect-metadata` setup — no test can reach the other side, so 100% branches on decorator-heavy Nest files is not achievable. Don't chase phantom branch gaps on a file that's already 100% statements/functions/lines with no real conditional logic of its own.
- Path alias `@/*` is available in both configs (`package.json` jest block and `test/jest-e2e.json`).

## web (Next.js)

| Type | Location | Naming | Command |
|---|---|---|---|
| Unit | co-located in `src/` | `*.test.tsx` / `*.test.ts` | `npm run test` |
| E2E | `e2e/` | `*.spec.ts` | `npm run test:e2e` |

- Unit tests use Jest + React Testing Library (`jest.config.ts`, `jest.setup.ts`); test behavior/output, not implementation details — query by role/text, not by class name.
- E2E tests use Playwright (`playwright.config.ts`) and drive a real browser against `npm run dev` (`http://localhost:3000` by default). Point them at the dockerized stack instead with `PLAYWRIGHT_BASE_URL=http://sms.site npm run test:e2e`.
- Coverage threshold (`npm run test:cov`): 90% functions/lines/statements, 79% branches (see the
  api section above for why branches is lower).

## General rule

A change to `src/` needs a matching unit test in the same PR. A new user-facing flow (a page, an API route) needs at least one E2E test. Both apps must pass `lint`, `test`, and `test:e2e` before merging into `develop`.
