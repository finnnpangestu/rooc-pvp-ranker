# Project reference docs

Read these before making structural changes — they are the standing reference for architecture,
conventions, and known tech debt, kept current as the project evolves:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — stack, data model, request flow, subsystem notes.
- [`docs/CODE_STANDARDS.md`](docs/CODE_STANDARDS.md) — naming, access-control pattern, server
  action / collection / hook conventions.
- [`docs/IMPROVEMENTS.md`](docs/IMPROVEMENTS.md) — known technical debt, prioritized, with fixes
  already applied logged at the top so you don't rediscover them.
- [`docs/SKILLS.md`](docs/SKILLS.md) — when to use graphify vs. `/code-review` vs. `/security-review`
  vs. `run` for this specific project.

When a library or Next.js version is bumped, or a tech-debt item gets fixed, update the relevant
doc above in the same change — don't let them drift from the code they describe.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
