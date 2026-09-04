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

### web (Next.js) — `src/features/<feature>/`

```
src/
  app/                       # routes only (App Router requires this location)
    layout.tsx
    page.tsx                 # thin: imports and renders a feature component
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

A route file under `src/app/` should just import the feature's top-level component and export it
(or render it) — it should not contain the feature's markup/logic directly. E2E tests stay under
the top-level `e2e/` folder since they test routes/user flows, not individual feature modules.

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
carries a ticket number, its commit subject lines reference the same ticket:
`[SMS-42] Add student enrollment form`. No ticket number → no prefix, just the plain
`<type>/<slug>` form and a plain commit subject.

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
