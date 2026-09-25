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

### Database Connection via SSH Tunnel (Remote VPS)

If your PostgreSQL database is hosted on a remote VPS (e.g., Oracle Cloud) and you want to forward it securely to your local development environment (`localhost:5432`):

```bash
ssh -i <your-oracle-key> -L 5432:localhost:5432 ubuntu@<your-vps-ip>
```

Helpful options:

- **Background / Tunnel Only**: Add the `-N` flag so the command establishes port forwarding without opening an interactive remote shell:

  ```bash
  ssh -i <your-oracle-key> -N -L 5432:localhost:5432 ubuntu@<your-vps-ip>
  ```

- **Oracle Linux Distributions**: Replace the username `ubuntu` with `opc`:

  ```bash
  ssh -i <your-oracle-key> -L 5432:localhost:5432 opc@<your-vps-ip>
  ```

### Running Drizzle Studio via SSH

There are two recommended ways to use Drizzle Studio with a remote VPS:

#### Option 1: Run Drizzle Studio Locally (Recommended)

Keep the compute and web interface on your local machine while tunneling the database traffic securely:

1. **Open the SSH tunnel** to PostgreSQL on your VPS:

   ```bash
   ssh -i <your-oracle-key> -N -L 5432:localhost:5432 ubuntu@<your-vps-ip>
   ```

2. **Ensure your local `.env`** has `DATABASE_URL` pointing to localhost:

   ```env
   DATABASE_URL="postgresql://postgres:<password>@localhost:5432/guild-management"
   ```

3. **Start Drizzle Studio** locally:

   ```bash
   npm run db:studio
   ```

4. Open `https://local.drizzle.studio` (or `http://localhost:4983`) in your local browser.

#### Option 2: Run Drizzle Studio on Remote VPS (Port Forwarding Port 4983)

If Drizzle Studio is running directly inside your remote VPS session:

1. **Connect to the VPS** with port forwarding for Drizzle Studio (default port `4983`):

   ```bash
   ssh -i <your-oracle-key> -L 4983:localhost:4983 ubuntu@<your-vps-ip>
   ```

2. **Inside the VPS terminal**, start Drizzle Studio:

   ```bash
   npm run db:studio
   ```

3. **Open the interface** in your local browser at `https://local.drizzle.studio` or `http://localhost:4983`.

## Scripts

| Command               | Purpose                                           |
| --------------------- | ------------------------------------------------- |
| `npm run dev`         | Start Next.js development server with Turbopack   |
| `npm run build`       | Production build (generates `.next/standalone`)   |
| `npm run start`       | Run the built standalone production server        |
| `npm run lint`        | Lint codebase with ESLint 9 Flat Config           |
| `npm run db:push`     | Push Drizzle schema directly to PostgreSQL        |
| `npm run db:generate` | Generate Drizzle SQL migration files              |
| `npm run db:studio`   | Start Drizzle Studio database GUI web interface   |
| `npm run test:int`    | Run Vitest integration tests against the database |
| `npm run test:e2e`    | Run Playwright browser tests                      |
| `npm run test`        | Run all tests                                     |

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
