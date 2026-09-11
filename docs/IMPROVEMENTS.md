# Improvements & Technical Debt

Findings from a full project analysis (2026-09-11), split into what was already fixed in that
session and what's recommended next. Re-run this analysis periodically (`graphify update .` +
re-read this file) rather than treating it as a one-time snapshot.

## Already fixed (this session)

| #   | Issue                                                                                                                                                                                                                | Fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | File(s)                                                           |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | `next.config.ts` hardcoded a specific Supabase project ref (`tbbatenjyalbmhosxnha`) in the media rewrite destination — breaks for any other environment/project and silently drifts if the S3 endpoint ever changes. | Derive the project ref and bucket from `S3_ENDPOINT`/`S3_BUCKET` env vars at config-build time, matching the logic already used in `s3Upload.ts`.                                                                                                                                                                                                                                                                                                                                  | `next.config.ts`                                                  |
| 2   | `Media` collection allowed **anyone, unauthenticated**, to `create`/`update`/`delete` — i.e. upload or delete arbitrary files in the S3 bucket via the public Payload REST API.                                      | Restricted `create`/`update`/`delete` to `Boolean(user)`; `read` stays public (images must render for anonymous visitors).                                                                                                                                                                                                                                                                                                                                                         | `src/collections/Media.ts`                                        |
| 3   | Identical ~20-line guild-ownership access-control block duplicated verbatim in `Characters.update` and `Characters.delete`.                                                                                          | Extracted to `guildScopedAccess()` in a new `src/utils/guildAccess.ts`, imported by both.                                                                                                                                                                                                                                                                                                                                                                                          | `src/collections/Characters.ts`, `src/utils/guildAccess.ts` (new) |
| 4   | `docker-compose.yml` still provisioned **MongoDB**, but the app has used `@payloadcms/db-postgres` since commit `73baba8` — local Docker setup was broken/misleading.                                                | Replaced the `mongo` service with `postgres:16-alpine`, updated the comment and `DATABASE_URL` hint.                                                                                                                                                                                                                                                                                                                                                                               | `docker-compose.yml`                                              |
| 5   | 9 npm audit vulnerabilities (4 **high**: libvips/sharp CVEs, undici TLS/desync/cache-poisoning issues, image-size DoS pulled in transitively via `payload`).                                                         | Bumped `payload` + all `@payloadcms/*` packages `3.85.1 → 3.89.0` (same major, verified via full `next build` + `vitest` run) and `sharp` `0.34.2 → 0.35.4`. Also picked up in-range updates already allowed by existing `package.json` ranges: Next.js `16.2.10 → 16.3.4`, `@aws-sdk/client-s3`, `eslint`, `postcss`, `prettier`, `vitest`, `autoprefixer`. Remaining 5 moderate findings are an `esbuild`/`drizzle-kit`/`tsx` dev-only chain with **no upstream fix available**. | `package.json`, `package-lock.json`                               |
| 6   | Heavy Payload CMS dependency overhead (284 transitive packages, slow builds requiring `--max-old-space-size=8000`, tight framework coupling).                                                                        | Migrated entire backend to **Drizzle ORM** + PostgreSQL (`postgres.js`), native JWT auth (`jose`), and bcryptjs. Removed all `@payloadcms/*` dependencies, reducing build time to 6.2s and enabling lean standalone Docker deployments.                                                                                                                                                                                                                                            | `src/db/*`, `src/actions/*`, `src/lib/auth.ts`, `package.json`    |
| 7   | ESLint crashed with `TypeError: Converting circular structure to JSON` in `eslint-config-next`'s `FlatCompat` layer.                                                                                                 | Converted `eslint.config.mjs` to a clean native ESLint 9 Flat Config combining Next.js core web vitals and TypeScript parser rules without `FlatCompat`. `npm run lint` now runs cleanly with 0 errors.                                                                                                                                                                                                                                                                            | `eslint.config.mjs`                                               |
| 8   | Stray boilerplate file `src/app/my-route/route.ts` left over from Payload template.                                                                                                                                  | Deleted unused template file.                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `src/app/my-route/route.ts`                                       |

Build (`next build`), typecheck (`tsc --noEmit`), lint (`npm run lint`), and tests (`npm run test:int`) were all verified green.

## Recommended next (not yet done — prioritized)

### High priority

#### Incremental scoring aggregation

When character stats update, `updateGuildTotals` recalculates guild totals by aggregating active characters in that guild. In future iterations, this can be optimized with incremental delta updates (`total_pvp_score += newScore - oldScore`) if guild size grows significantly.

#### Unit tests for the scoring engine

`calculatePvPScore` (`src/utils/calculatePvPScore.ts`) is the single most business-critical pure
function in the app (drives rankings, guild totals, everything player-facing) and has zero test
coverage. It's a pure function — trivial to unit test in isolation.

- **Fix direction**: add `tests/int` (or a new `tests/unit`) cases per job archetype covering at
  least: zero-stat baseline, magic-DPS vs physical-DPS branch (`isMagicDps`), and the elemental
  bonus `Math.max` branch.

#### CI/CD Setup

There is no `.github/workflows` (or equivalent) despite the project having `lint` and `test:int`
scripts already defined. Nothing currently stops a broken build/test from reaching `master`.

- **Fix direction**: minimal GitHub Actions workflow running `npm install`, `npm run lint`,
  `npm run build`, and `npm run test:int` on pull requests.

### Medium priority

#### Package manager mismatch

`package.json.engines` requires pnpm, `docker-compose.yml` and `README.md` instructions use pnpm,
but the repo ships `package-lock.json` (npm) with no `pnpm-lock.yaml` — and also carries a stray
`.yarnrc` (`--install.ignore-engines true`) alongside an `.npmrc` (`legacy-peer-deps=true`). Three
different package managers have left artifacts in this repo simultaneously.

- **Fix direction**: pick one (pnpm, matching `engines` and Docker) and delete the other
  lockfile/rc files (`package-lock.json`, `.yarnrc`) to stop contributors from silently using the
  wrong one and producing a divergent lockfile.

#### Custom S3 integration instead of the official plugin

`src/utils/s3Upload.ts` reimplements upload/delete/public-URL logic with raw
`@aws-sdk/client-s3` calls, after a prior commit deliberately removed the official
`@payloadcms/storage-s3` plugin. This works, but means Payload's built-in multi-size image
generation, `disableLocalStorage` interplay, and future S3 plugin fixes/features are bypassed —
all of that is now this project's responsibility to maintain by hand (e.g. `getPublicUrl`'s
Supabase-specific regex parsing).

- **Fix direction**: if the removal was to avoid a specific bug/version conflict, document that
  reason here (or in a code comment) so a future contributor doesn't "fix" it by re-adding the
  plugin and reintroducing the original problem. If the reason no longer applies (worth checking
  against the now-updated `payload@3.89.0`), consider migrating back to the official plugin to
  drop this maintenance burden.

#### No rate limiting on public write endpoints

`registerUser` (account creation) and `Media` uploads (now auth-gated, but any authenticated guild
master can still upload unlimited files) have no rate limiting or abuse protection. `Characters`
`create: () => true` also allows unauthenticated character creation.

- **Fix direction**: add basic rate limiting (e.g. Vercel's `@vercel/firewall` / a small
  in-memory or Redis token bucket) in front of `registerUser` and the Media upload path before this
  is exposed to a wider audience.

#### `error`/`message` key inconsistency in server action results

Some actions return `{ success: false, error: ... }`, others `{ success: false, message: ... }`
(compare `registerUser.ts` vs `loginUser.ts`). Harmless today since each is consumed by its own
matching client component, but makes a shared "toast the error" helper harder to write later.

- **Fix direction**: standardize on one key (`error` matches more call sites) next time either
  file is touched — not worth a dedicated PR on its own.

### Low priority / cleanup

- **`src/app/my-route/route.ts`** is the unmodified Payload-template example route
  ("This is an example of a custom route.") with an unused `request` param. Remove it, or rename
  it to something real if it was being used as a scratch endpoint.
- **`docker-compose.yml`**'s app container still uses local disk/Postgres for the app DB but the
  project's actual `.env.example` points at Supabase-hosted Postgres + Storage — local Docker dev
  and the documented Supabase-based setup are two different paths. Worth picking one primary
  documented flow (this project's `README.md` now documents the Supabase path as primary, Docker
  as an alternative — keep it that way rather than letting both drift independently).
- **`tsconfig.json`**'s `typescript` version (`5.7.3`, exact-pinned) is far behind the `latest`
  tag (`7.x`) reported by npm at analysis time — that's `typescript@7`'s early rollout, likely not
  yet what `next`/`eslint-config-next` in this repo's range are tested against. Don't chase it
  automatically; revisit once the wider Next/ESLint ecosystem has caught up.

## How to re-run this analysis

1. `graphify update .` to refresh the graph, then `graphify query "<topic>"` for anything specific.
2. `npm outdated` / `npm audit` for dependency drift and vulnerabilities.
3. Re-read this file and move fixed items into the "Already fixed" table with the commit/date.
