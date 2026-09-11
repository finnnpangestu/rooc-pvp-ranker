# Code Standards

Conventions followed by this codebase, written down so new code (human- or AI-authored) stays
consistent.

## Formatting & linting

- **Prettier** (`.prettierrc.json`): no semicolons, single quotes, 100-column width, trailing
  commas everywhere. Run Prettier before commits.
- **ESLint** (`eslint.config.mjs`): Native ESLint 9 Flat Config with Next.js core web vitals and TypeScript parser.
  - `no-unused-vars`: warn, with `_`-prefix ignore pattern for intentionally unused args/vars.
  - Run `npm run lint` to verify code quality.

## TypeScript

- `strict: true`. Keep it that way — don't add `// @ts-ignore` or loosen `tsconfig.json` to work
  around a type error; fix the type.
- Path aliases: import app code as `@/...` (maps to `src/...`). Don't use relative `../../..` chains
  across top-level folders.
- Prefer named exports (`export const Foo = ...`, `export function bar() {}`) over default exports
  for anything that isn't a Next.js page/layout/route.

## Database & Drizzle ORM (`src/db/**`)

- All database tables, enums, and relations are defined in `src/db/schema.ts`.
- The database connection singleton is initialized in `src/db/index.ts` using `drizzle-orm/postgres-js`.
- Always import the `db` client from `@/db`.
- Use Drizzle relational queries (`db.query.<table_name>.findFirst / findMany`) for reads with joined data (`with: { ... }`).
- Use `db.insert`, `db.update`, and `db.delete` with `where(eq(...))` for mutations.
- Column types:
  - IDs are `varchar` UUIDs (`crypto.randomUUID()`).
  - Dates and timestamps use ISO string timestamps with timezone.
  - Quantities and scores use `numeric` columns (parse with `Number(...)` when performing arithmetic).

## Type Safety & Model Contracts (`src/types/**`)

- **Strictly Avoid `any`**: Do not use `any` for models, form state, props, or errors. Use specific interfaces or `unknown` with type narrowing.
- **Single Source of Truth**: All database models are derived from `src/db/schema.ts`:
  - Inferred select models: `User`, `Guild`, `Character`, `PartySetup`, `ReportGl`, `ReportWoe`, `WoeSetup`, `Resource`, `ResourceDistribution`, `Media`.
  - Inferred insert models: `NewUser`, `NewGuild`, `NewCharacter`, etc.
  - Re-exported from `@/types` for convenience across components and actions.
- **JSONB Contracts**: All JSONB columns in PostgreSQL are strongly typed:
  - `PartySlot`, `Party` (for elite & sub-parties in `partySetups`).
  - `WoeRaid` (for War of Emperium raids in `woeSetups`).
  - `MemberMatchReport` (for match rosters in `reportsGl` and `reportsWoe`).
  - `CharacterGlReport` (for character match logs).
- **Composite Contracts**: Joined or extended shapes are explicitly typed (e.g. `CharacterWithGuild`, `ResourceDistributionWithRelations`, `GuildWithRelations`, `CharacterStatsInput`).

## Standardized Server Action & Error Contracts (`src/types/actions.ts`)

All Server Actions in `src/actions/**` and API routes follow a uniform contract:

- **Return Type Contract**: `Promise<ActionResult<T>>` where:

  ```ts
  type ActionResult<T = void> = ActionSuccess<T> | ActionError

  interface ActionSuccess<T = void> {
    success: true
    data: T
    message?: string
  }

  interface ActionError {
    success: false
    error: string
    message: string // Alias for compatibility with callers
    code?: string
    details?: unknown
  }
  ```

- **Helper Constructors**: Always return results using `actionSuccess(data, message?)` or `actionError(error, code?, details?)`.
- **Catch Blocks**: Never write `catch (err: any)`. Always use:

  ```ts
  try {
    // ...
  } catch (error: unknown) {
    return actionError(formatErrorMessage(error))
  }
  ```

- **Cache Invalidation**: Call `revalidatePath(...)` after mutations.
