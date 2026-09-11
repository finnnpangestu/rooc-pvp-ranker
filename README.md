# ROOC PvP Ranker & Guild Manager

Guild management and PvP-ranking tool for a Ragnarok Online private server ("ROOC"). Guild
masters register characters and combat stats; the app computes a weighted PvP score per
character, rolls it up per guild, and tracks War of Emperium (WoE) and Guild League (GL)
attendance/results, loot distribution, and party formation.

Built on **Next.js 16** (App Router) + **Drizzle ORM** + **PostgreSQL** + **Docker / VPS**.

> For architecture, data model, and coding conventions, see [`docs/`](./docs/) — start with
> [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md). That folder is the reference for both humans
> and AI assistants working on this codebase; keep it current when you change things.

## Tech stack

- **Framework**: Next.js 16 (Turbopack, Standalone Output)
- **Backend & ORM**: Drizzle ORM (`drizzle-orm`, `postgres.js`)
- **Database**: PostgreSQL (self-hosted Docker container or managed PostgreSQL)
- **Authentication**: Native JWT (`jose`) + `bcryptjs` via secure `payload-token` httpOnly cookie
- **File storage**: S3-compatible storage (Supabase Storage / MinIO) via `@aws-sdk/client-s3`
- **UI**: React 19, Tailwind CSS 4
- **Testing**: Vitest (integration), Playwright (e2e)
- **Deployment**: Multi-stage Dockerfile optimized for VPS / Cloud VM (Oracle Cloud Always Free ARM/x86)

## Local setup

1. Clone the repo, then copy the environment template:

   ```bash
   cp .env.example .env
   ```

2. Fill in `.env`:
   - `DATABASE_URL` — PostgreSQL connection string:
     - Local Docker: `postgresql://postgres:postgres@localhost:5432/guild-management`
     - Or remote PostgreSQL instance.
   - `PAYLOAD_SECRET` (or `AUTH_SECRET`) — Any random secret string for signing JWT tokens.
   - `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` — S3 credentials for screenshot uploads.

3. Push schema to the database:

   ```bash
   npm run db:push
   ```

4. Install dependencies and start the dev server:

   ```bash
   npm install
   npm run dev
   ```

5. Open `http://localhost:3000`. Register a new guild master account at `/register` or log in at `/login`.

### Running with Docker

Start both PostgreSQL and the Next.js application container with:

```bash
docker compose up -d
```

To view logs:
```bash
docker compose logs -f app
```

## Scripts

| Command              | Purpose                                                      |
| -------------------- | ------------------------------------------------------------ |
| `npm run dev`        | Start Next.js development server with Turbopack              |
| `npm run build`      | Production build (generates `.next/standalone`)              |
| `npm run start`      | Run the built standalone production server                   |
| `npm run lint`       | Lint codebase with ESLint 9 Flat Config                      |
| `npm run db:push`    | Push Drizzle schema directly to PostgreSQL                   |
| `npm run db:generate`| Generate Drizzle SQL migration files                         |
| `npm run test:int`   | Run Vitest integration tests against the database            |
| `npm run test:e2e`   | Run Playwright browser tests                                 |
| `npm run test`       | Run all tests                                                |

## Project structure

```text
src/
├─ actions/       Server Actions — the app's API layer (auth, dashboard, guild, woe, etc.)
├─ app/           Next.js App Router
│  └─ (frontend)/ Public site + authenticated guild-master dashboard
├─ const/         Shared enums/labels (job classes, stat labels)
├─ db/            Drizzle ORM schema & postgres.js client singleton
├─ lib/           Authentication helpers (JWT session, bcrypt)
└─ utils/         Pure helpers (PvP score calculation, S3 upload, guild statistics)
```

Full breakdown, data model diagram, and request-flow explanation:
[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Working on this repo

- Coding conventions, naming, and server action rules:
  [`docs/CODE_STANDARDS.md`](./docs/CODE_STANDARDS.md).
- Known improvements and technical debt:
  [`docs/IMPROVEMENTS.md`](./docs/IMPROVEMENTS.md).
- Knowledge graph guidelines:
  [`docs/SKILLS.md`](./docs/SKILLS.md).

