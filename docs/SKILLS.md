# Working With This Repo via Claude Code

This project is set up to be navigated with **graphify** first, raw file browsing second. This
doc lists what's installed, what's recommended, and when to reach for each.

## Installed

### graphify — codebase knowledge graph

Already installed at project scope (`.claude/skills/graphify/`, `.agents/rules/graphify.md`,
`.agents/workflows/graphify.md`) and referenced from both `CLAUDE.md` files. It builds
`graphify-out/graph.json`: 558 nodes / 866 edges / 44 communities as of the last update in this
session, covering every source file, its exports, and cross-file `calls`/`references` edges.

**Always orient with graphify before grepping or reading raw files:**

```bash
graphify query "<question>"          # scoped BFS subgraph, cheaper than GRAPH_REPORT.md or grep
graphify path "<A>" "<B>"            # shortest relationship between two named things
graphify explain "<concept>"         # focused neighborhood around one node
graphify god-nodes                   # architectural hubs (most-connected symbols)
graphify affected "<X>"              # reverse-impact: what breaks if X changes
```

Read `graphify-out/GRAPH_REPORT.md` only for a broad architecture pass, or when
query/path/explain don't surface enough. Read raw source only after graphify has oriented you, or
when actually editing specific lines.

**Keep it current**: run `graphify update .` (AST-only, no API cost, seconds to run) after any
coding session, before committing. A stale graph gives confidently wrong answers about a codebase
that has since moved — the project's graph was 4 commits stale when this doc was written, and got
refreshed as the first step of this analysis. Don't let it happen again.

## Recommended (already available globally in Claude Code — use them for this project)

| Skill              | When to use it here                                                                                                                                                                                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/code-review`     | Before merging any PR. This repo's real risk surface is in `access` control blocks and hooks (`src/collections/**`) — those are exactly the "correctness bug" category this catches.                                                                                                                 |
| `/security-review` | Before merging anything that touches `src/collections/*.ts` `access` functions, `src/actions/auth/**`, or `src/utils/s3Upload.ts`. This session found and fixed a real open-write vulnerability in `Media`'s access control this way — run it proactively, not just when something looks suspicious. |
| `/simplify`        | After adding a new collection or server action, to catch copy-pasted boilerplate before it becomes a third copy of the `guildScopedAccess` pattern (see [CODE_STANDARDS.md](./CODE_STANDARDS.md#access-control)).                                                                                    |
| `run`              | Use to boot `npm run dev` and click through a UI change (guild dashboard, stats form, leaderboards) before calling frontend work done — this is a Next.js app with real interactive forms, type-checking alone doesn't catch UI regressions.                                                         |
| `context7` (MCP)   | Pull current Drizzle ORM / Next.js 16 / Tailwind 4 docs when making a change that depends on framework-specific API behavior, instead of relying on training-data knowledge that may predate the version pinned in `package.json`.                                                                   |

## Suggested workflow for a typical change

1. `graphify query "<what you're about to touch>"` to find the relevant files/edges.
2. Read the specific files graphify points at (not the whole tree).
3. Make the change, following [CODE_STANDARDS.md](./CODE_STANDARDS.md).
4. `tsc --noEmit` + `pnpm test:int` (and `pnpm test:e2e` if the change touches a tested flow).
5. `/security-review` if the change touched `access`, auth, or file upload code.
6. `/code-review` before opening the PR.
7. `graphify update .` to refresh the graph.

## Suggested workflow for onboarding / architecture questions

Start here, in order:

1. [`README.md`](../README.md) — what the app is, how to run it locally.
2. [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) — stack, data model, request flow, subsystem notes.
3. `graphify query "<your specific question>"` — for anything the above two don't answer.
4. `graphify-out/GRAPH_REPORT.md` — only if you need the full community/god-node breakdown.

## Keeping this documentation set current

`docs/ARCHITECTURE.md`, `docs/CODE_STANDARDS.md`, and `docs/IMPROVEMENTS.md` are living documents,
not a one-time snapshot:

- When a library or Next.js version changes (`package.json` diff), re-check
  [ARCHITECTURE.md §2](./ARCHITECTURE.md#2-tech-stack) and update the version table.
- When an item in [IMPROVEMENTS.md](./IMPROVEMENTS.md) gets fixed, move it to the "Already fixed"
  table with the commit reference, don't just delete it — it's useful history of _why_ the code
  looks the way it does.
- When a new recurring pattern emerges (a third place that needs guild-scoped access, a second
  hook that aggregates a collection), add it to CODE_STANDARDS.md so it doesn't get reinvented a
  third time.
