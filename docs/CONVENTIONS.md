# Code conventions

Enforced by `biome.json` (shared config at repo root, run via `npm run lint` / `npm run lint:fix` in each app):

- No unused variables or imports (`correctness.noUnusedVariables`, `correctness.noUnusedImports`).
- Imports are organized/sorted automatically on save or `lint:fix` (`assist.source.organizeImports`).
- Function expressions must be arrow functions (`complexity.useArrowFunction`).

## web (Next.js) — components are always arrow functions

```tsx
// good
const Home = () => {
  return <div>...</div>;
};

export default Home;

// avoid
export default function Home() {
  return <div>...</div>;
}
```

Biome's `useArrowFunction` rule only rewrites function *expressions*, not top-level function
*declarations* like `export default function Home() {}` — there is no Biome/ESLint-equivalent rule
that auto-converts declarations for React components. This part of the convention is enforced by
code review, not the linter.

## Folder structure — organized by feature

Both apps group code by feature/domain rather than by file type. `src/app.module.ts` (api) and
`src/app/` (web) stay thin — they wire up routes/composition only; the actual logic lives in a
feature folder.

### api (NestJS) — `src/modules/<feature>/`

```
src/
  app.module.ts              # root module: imports each feature module / registers the bootstrap feature
  main.ts
  modules/
    app/                     # the default "hello world" feature from the Nest starter
      app.controller.ts
      app.service.ts
      app.controller.spec.ts
    <feature>/               # e.g. students, teachers, classes
      <feature>.module.ts
      <feature>.controller.ts
      <feature>.service.ts
      <feature>.controller.spec.ts
      dto/
      entities/
```

Every new feature gets its own `<feature>.module.ts` that `AppModule` imports in its `imports`
array. The `app/` folder is a special case (registered directly on the root module) because it's
the Nest starter boilerplate, not a real domain feature.

### api (NestJS) — cross-cutting code that isn't a feature

Four root-level folders under `src/`, chosen by what the code depends on — pick the first row that
fits:

| Folder | Contains | Depends on | Example |
|---|---|---|---|
| `constants/` | Static values used in ≥2 places. No functions. | Nothing | `auth-cookies.constant.ts` (cookie names) |
| `utils/` | Pure, generic functions with **zero knowledge of this app** — portable to any TS project unchanged. Never imports `@nestjs/*`, `express`, or this app's DTOs/entities. | Nothing app-specific | (currently empty — nothing needed one yet) |
| `helpers/` | Cross-cutting functions that **do** know this app's types/conventions (Express `Response`, this app's DTOs) but aren't owned by one feature module. | This app's types, but not a specific feature's business logic | `refresh-cookie.helper.ts` (sets/clears the auth refresh cookie) |
| `infrastructure/<name>/` | Stateful external integrations needing connection/lifecycle management. | External services | `database/` (TypeORM), future: `payment/` |

There's no separate `libs/` folder — a wrapped third-party SDK is exactly what `infrastructure/`
is for; adding another folder for the same purpose would just create two places to look.

#### `infrastructure/` — one folder per capability, not per vendor

```
infrastructure/
├── database/        # data-source.ts, migrations/ — currently TypeORM
├── cache/           # redis-client.ts
├── messaging/       # kafka-client.ts
├── storage/         # s3-client.ts
├── mail/            # smtp-client.ts
└── payment/         # stripe-client.ts (or vnpay-client.ts, ...)
```

The folder name is the **capability** (what it does), never the vendor/tech (how) — callers import
`infrastructure/cache/...`, not `infrastructure/cache/redis/...`. This way swapping Redis for
another cache, or Stripe for another payment provider, never means updating every import site, only
the file(s) inside that one folder. Only `database/` exists today (all the others are the pattern
to follow *when* that capability is actually needed — don't pre-create empty ones).

If a capability genuinely needs two implementations side by side (rare), the vendor name goes in
the **filename**, not a new subfolder: `cache/redis-client.ts` + `cache/cache.interface.ts`.

### web (Next.js) — `src/features/<feature>/`

```
src/
  app/                       # routes only (App Router requires this location)
    globals.css              # shared, imported by every root layout below
    providers.tsx            # shared, imported by every root layout below
    (user)/                  # route group — no URL segment, this IS a root layout (<html>/<body>)
      layout.tsx             # end-user shell: fonts, Providers, header/nav
      page.tsx                # thin: imports and renders a feature component
      dashboard/page.tsx
    admin/                   # real URL segment — also its own root layout (<html>/<body>)
      layout.tsx             # staff shell: fonts, Providers, header/nav
      dashboard/page.tsx
  features/
    home/
      HomePage.tsx
      HomePage.test.tsx
    <feature>/                # e.g. students, teachers, auth
      <Feature>Page.tsx
      <Feature>Page.test.tsx
      components/
      hooks/
```

There is **no single shared `app/layout.tsx`** — `(user)/layout.tsx` and `admin/layout.tsx` are
each a full root layout (own `<html>`/`<body>`, own `<Metadata>`) using Next.js's
["multiple root layouts"](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups#opting-specific-segments-into-a-layout)
pattern. This is deliberate: the two portals are meant to be genuinely separate experiences —
navigating between a `(user)` route and an `admin` route triggers a full page reload rather than a
client-side transition, which is correct here (they don't share app state). Add a third top-level
root layout the same way if a third genuinely separate portal shows up later; don't reintroduce a
shared `app/layout.tsx`, since Next.js only allows either one shared root layout *or* multiple
route-group root layouts, never both at once.

The two root layouts still share the same fonts/`Providers`/shell markup — that part is factored
into `helpers/RootShell.tsx` (a component, not a Next.js file-convention file, so it can be
anywhere). Each `layout.tsx` stays a thin wrapper: it just supplies its own `metadata` and the
props that differ (brand text, nav link, header colors) and renders `<RootShell>`. Add a new
top-level root layout the same way — write its own `layout.tsx` calling `RootShell` with its own
props, don't copy the `<html>/<body>`/font/`Providers` boilerplate again.

A route file under `src/app/**/page.tsx` should just import the feature's top-level component and
export it (or render it) — it should not contain the feature's markup/logic directly. E2E tests
stay under the top-level `e2e/` folder since they test routes/user flows, not individual feature
modules.

### web (Next.js) — cross-cutting code that isn't a feature

Same idea as the api side, mapped to the web stack:

| Folder | Contains | Depends on | Example |
|---|---|---|---|
| `constants/` | Static values used in ≥2 features. No functions. | Nothing | route paths, shared limits |
| `utils/` | Pure, generic functions — no React/Next, no app types. Portable to any TS project. | Nothing app-specific | `formatDate.ts` |
| `helpers/` | Cross-cutting functions/hooks/components that **do** know React/Next or this app's types, but aren't owned by one feature. | React/Next, this app's types | `RootShell.tsx` (shared root-layout skeleton), a `useDebounce` hook |
| `lib/` | Clients/SDK wrappers for external services — the web equivalent of api's `infrastructure/`. | External services | `apiClient.ts` (axios instance) |

All four currently exist only as scaffolding except `lib/` (already holds `apiClient.ts`) — don't
force something into `constants/`/`utils/`/`helpers/` before there's a real need for it.

## Naming conventions

### Identifiers (both apps, TypeScript)

| Kind | Convention | Example |
|---|---|---|
| Variable, function, method | `camelCase` | `getStudentById`, `isEnrolled` |
| Boolean variable/prop | `camelCase`, prefixed `is`/`has`/`should`/`can` | `isActive`, `hasPermission` |
| Class, NestJS provider/module/controller | `PascalCase` | `StudentsService`, `StudentsModule` |
| React component | `PascalCase`, matches file name | `StudentCard` in `StudentCard.tsx` |
| Interface / type alias | `PascalCase`, no `I` prefix | `Student`, not `IStudent` |
| Enum | `PascalCase` name, `PascalCase` members | `enum Role { Admin, Teacher }` |
| Global constant | `UPPER_SNAKE_CASE` | `DEFAULT_PAGE_SIZE` |
| Generic type parameter | single uppercase letter, or `PascalCase` prefixed `T` for a descriptive name | `T`, `TResponse` |
| Env var | `UPPER_SNAKE_CASE` | `DB_HOST`, `NEXT_PUBLIC_API_URL` |

### Files and folders

| Location | Convention | Example |
|---|---|---|
| `api/src/modules/<feature>/` folder | `kebab-case`, singular or plural matching the domain | `modules/students/`, `modules/class-schedule/` |
| `api` artifact files | `kebab-case.<type>.ts` (Nest CLI convention) | `students.controller.ts`, `create-student.dto.ts`, `student.entity.ts` |
| `web/src/features/<feature>/` folder | `kebab-case` | `features/student-profile/` |
| `web` React component file | `PascalCase.tsx`, matches the exported component | `StudentCard.tsx`, `HomePage.tsx` |
| `web` hook file | `camelCase.ts`, prefixed `use` | `useStudents.ts` |
| `web` non-component TS file (util, types, constants) | `camelCase.ts` | `formatDate.ts`, `types.ts` |
| `web/src/app/` route segment folder | `kebab-case` (becomes the URL) | `app/student-profile/page.tsx` → `/student-profile` |
| Test file | mirrors the file under test, see [TESTING.md](TESTING.md) | `students.service.spec.ts`, `StudentCard.test.tsx` |

### Database (MySQL)

Tables and columns use `snake_case`; table names are plural (`students`, `class_schedules`);
primary key is `id`; foreign keys are `<singular_table>_id` (`student_id`).

### Git branches

`<type>/<kebab-case-slug>` — `feature/student-enrollment`, `fix/nginx-timeout`,
`chore/upgrade-nest`. Long-lived branches: `main`, `develop`.

If the work has a ticket/issue number, put it right after the type:
`<type>/<TICKET-ID>-<kebab-case-slug>` — e.g. `feature/SMS-42-student-enrollment`. When a branch
carries a ticket number, commit subjects use the ticket as the conventional-commit scope:
`feat(42): add student enrollment form`. No ticket number → no scope, just
`<type>: <description>` (e.g. `chore: upgrade nest`).

## Calling the API (web)

All HTTP calls go through `src/lib/apiClient.ts` (an axios instance with `baseURL` =
`NEXT_PUBLIC_API_URL`). Never call `axios`/`fetch` directly from a component or hook — always go
through `apiClient` so `baseURL` and error normalization stay centralized.

### Layout per feature

```
src/features/students/
  api.ts        # getStudents, getStudent, createStudent, updateStudent, deleteStudent
  schema.ts     # zod schemas: studentSchema, createStudentSchema
  queries.ts    # useStudents(), useStudent(id)  — read hooks (useQuery)
  mutations.ts  # useCreateStudent(), useUpdateStudent(), useDeleteStudent() — write hooks (useMutation)
  StudentsPage.tsx
```

- **`api.ts`** — one plain async function per endpoint, named after the action
  (`getStudents`, `createStudent`, not `fetchStudents`/`studentsApi`). Each function calls
  `apiClient` and parses the response through a zod schema from `schema.ts`
  (`studentSchema.parse(response.data)`) so an API contract drift throws immediately instead of
  producing a silently-wrong type.
- **`queries.ts` / `mutations.ts`** — wrap `api.ts` functions with `useQuery`/`useMutation`.
  Components call these hooks, never `api.ts` directly.
- **Query keys** — each feature exports a `<feature>Keys` factory so invalidation stays
  consistent:

  ```ts
  export const studentKeys = {
    all: ['students'] as const,
    list: (filters: StudentFilters) => [...studentKeys.all, 'list', filters] as const,
    detail: (id: string) => [...studentKeys.all, 'detail', id] as const,
  };
  ```

- **Errors** — `apiClient`'s response interceptor normalizes every failure (network error, Nest
  validation error, unhandled 500) to `{ status, message }` (the `ApiError` type exported from
  `apiClient.ts`). Hook consumers read `error.message`/`error.status` without checking whether the
  error came from axios or the server.
- **Forms** — validate input with the same zod schema used for the request body
  (`type CreateStudentInput = z.infer<typeof createStudentSchema>`), wired through
  `react-hook-form` via `@hookform/resolvers/zod` (install it when the first form is built — not a
  base dependency).

## Authorization (api, RBAC via CASL)

All authorization rules live in one place: `api/src/modules/authorization/`. Nothing else
hardcodes role checks — controllers only declare *which* permission a route needs, never *who* has
it.

- `actions.enum.ts` — the verbs: `Manage` (wildcard), `Create`, `Read`, `Update`, `Delete`.
- `casl-ability.factory.ts` — the only file that maps a `Role` to what it can do. `CaslAbilityFactory.createForUser()` builds a CASL `Ability` from the JWT-decoded user's `role`.
- `policies.guard.ts` / `check-policies.decorator.ts` — the enforcement mechanism: `PoliciesGuard` reads the handlers a route declared via `@CheckPolicies(...)` and runs them against the built ability.

### Gate an endpoint (assign a permission to one feature/route)

```ts
@Get()
@UseGuards(JwtAuthGuard, PoliciesGuard)          // JwtAuthGuard first — it sets request.user
@CheckPolicies((ability) => ability.can(Action.Manage, 'all'))
findAll() { ... }
```

`@CheckPolicies` takes one or more `(ability: AppAbility) => boolean` callbacks; every route decides
its own requirement independently — there's no central route→permission table to keep in sync.

### Add a new role

1. Add it to `api/src/modules/users/entities/role.enum.ts` (e.g. `Parent = 'parent'`).
2. Generate + apply the migration so the MySQL `enum` column accepts the new value:
   `docker compose exec api npm run migration:generate -- src/infrastructure/database/migrations/Add<Role>Role`,
   then `migration:run` (see [COMMANDS.md](COMMANDS.md)).
3. Add a branch for it in `CaslAbilityFactory.createForUser()` — this is the *only* place that says
   what the new role can do.

### Add a new permission (new subject, e.g. a future `ClassRoom` entity)

1. Add the entity to the `Subjects` union in `casl-ability.factory.ts`:
   `type Subjects = InferSubjects<typeof User | typeof ClassRoom> | 'all';`
2. Add rules per role in `createForUser()`, e.g. `can(Action.Update, ClassRoom, { teacherId: user.id })`
   for instance-scoped access (only the teacher who owns that class).
3. When checking an *instance* (not just the type) so field conditions like `{ teacherId: ... }`
   actually evaluate, wrap it with CASL's `subject()` helper:
   `ability.can(Action.Update, subject('ClassRoom', theClassRoomInstance))`. Checking against the
   bare class/type (`ability.can(Action.Update, ClassRoom)`) skips condition evaluation — it only
   answers "is there any rule for this action+type at all," so use it for list/menu-visibility
   checks, not to gate access to one specific record.

## Gotchas (infra)

- **`web/next.config.ts` needs `allowedDevOrigins: ['sms.site']`.** Next's dev server treats any
  request whose `Host` header isn't `localhost`/a configured origin as untrusted cross-origin
  (anti DNS-rebinding protection) and silently degrades client hydration/HMR — the page loads and
  looks fine, but React event handlers never bind, so a login form submits as a native browser GET
  instead of running its `onSubmit`. Since nginx proxies `sms.site` through with
  `proxy_set_header Host $host;`, every custom local domain added to `.docker/nginx/default.conf`
  must also be added to this array, or the whole app silently stops being interactive when accessed
  through that domain. Restart the `web` container after changing it — Next reads this at boot, not
  via hot-reload.
- **Auth refresh cookies use `Path=/`, not `Path=/auth`.** nginx's `location /api/ { proxy_pass
  http://api:4000/; }` strips the `/api` prefix before forwarding to the api container, but the
  browser evaluates a cookie's `Path` against the URL it actually called (`sms.site/api/auth/...`),
  not the URL nginx forwarded to. Scoping the cookie to `/auth` would only match requests hitting
  `/auth/*` directly and silently drop the cookie on every proxied `/api/auth/*` call. See
  `api/src/helpers/refresh-cookie.helper.ts`.
