# Football Platform API

Football Platform API is the backend for football products built from this repository.

## Product Domains

This API is intentionally broader than a single product. The main domains are:

| Domain    | Purpose                                                                                                                                                                                |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Best Shot | Score-prediction game. Handles playable tournaments, matches, guesses, scoring, and leaderboards.                                                                                      |
| Almanac   | Read-only historical football data. Handles tournament history, national squads, players, teams, and historical context.                                                               |
| Identity  | Shared real-world entities used by multiple domains, such as people, teams, competitions, and provider identifiers.                                                                    |
| Provider  | External data ingestion from sources such as SofaScore. Provider data is imported into our database; user-facing requests should read our database, not depend on live provider calls. |
| Admin     | Internal workflows for previewing, importing, syncing, and maintaining platform data.                                                                                                  |

Keep the domain boundaries clear:

```text
Identity answers: "Who is this real-world person/team/competition?"
Best Shot answers: "How does the score-prediction product use it?"
Almanac answers: "What was historically true?"
Provider answers: "Where did this data come from and how do we refresh it?"
Admin answers: "How do operators manage it?"
```

Source code has three top-level ownership categories:

```text
src/apps/      Executable entry points and application composition
src/products/  Product-owned business capabilities
src/platform/  Shared technical and operational capabilities
```

Business source code is organized by product first and domain second:

```text
src/products/<product>/domains/<domain>/
```

For example, Almanac edition routes, services, repositories, and schema declarations live together under
`src/products/almanac/domains/editions/`. The product router at
`src/products/almanac/router.ts` composes its domains. Use the specific product name, such as
`best-shot`, rather than a generic `game` directory. Technical capabilities that are not owned by a
product remain outside `src/products/`. Configuration, database access, and operational health
routes live under `src/platform/`. The Node API and Cloudflare Worker entry points live under
`src/apps/`.

The exact domain-layer responsibilities and dependency direction are defined in the canonical
[Domain Module Architecture](docs/architecture/domain-modules.md) and recorded by
[ADR 0002](docs/adr/0002-product-domain-module-layers.md).

Almanac uses **national team** for a sporting identity such as Brazil, **association** for its
governing organization (currently only a nullable acronym such as CBF), and **participation** for
one team's appearance in an edition. `national-teams/` owns `national_teams`, statistics, and visual
identities; `participations/` owns `national_team_participations`. Foundation's external collection
is still named `associations`; the importer maps it to this vocabulary. See the accepted
[National Teams Schema Model](docs/plans/almanac-national-teams-schema-model.md) and
[schema diagram](docs/diagrams/almanac-schema.html).

Almanac and Best Shot share one PostgreSQL database per environment while owning separate
PostgreSQL schemas. Future games receive their own schemas. See
[ADR 0001: Database Domain Boundaries](docs/adr/0001-database-domain-boundaries.md).

Configuration follows one semantic naming rule: the same value has the same name in every runtime,
and the environment is expressed by scope rather than by renaming the variable. For example:

```text
Local .env:                  DATABASE_URL
GitHub environment demo:    DATABASE_URL
Cloudflare demo Worker:     DATABASE_URL
```

See [Environment Configuration](docs/guides/environment-configuration.md) for the exact local,
Cloudflare, and GitHub setup.

Public assets use the same semantic rule. Local development and the demo Worker currently use the
same public `ASSET_BASE_URL`; product-managed asset columns store object keys. Imported flag URLs
remain source URLs. See the visual-identity sections in the
[Editions](docs/plans/almanac-editions-schema-model.md) and
[National Teams](docs/plans/almanac-national-teams-schema-model.md) schema models.

## Requirements

Install these before working on the API:

```text
Node.js >= 22
pnpm 11.7.0
Docker Desktop / Docker daemon running
```

This project uses pnpm through `packageManager` in `package.json`.

If pnpm is not available, enable it through Corepack:

```sh
corepack enable
corepack prepare pnpm@11.7.0 --activate
```

## First-Time Setup

From the repository root:

```sh
pnpm install
cp .env.example .env
pnpm db:up
pnpm db:migrate
pnpm db:seed:almanac
pnpm dev
```

`pnpm db:up` requires Docker to be running. If Docker Desktop is closed, start it before running the database command.

The API should start on:

```text
http://localhost:3000
```

The local database runs in Docker:

```text
Docker Compose service: postgres
Container name: managed by Docker Compose
Host port: 5433
Database: football_platform
User: postgres
Password: postgres
```

The default local database URL is:

```text
postgresql://postgres:postgres@localhost:5433/football_platform
```

## Verify Local Setup

With the dev server running, check the API:

```sh
curl http://localhost:3000/
curl http://localhost:3000/api/health
curl http://localhost:3000/api/health/db
curl http://localhost:3000/api/almanac/contents
curl http://localhost:3000/api/almanac/editions
curl http://localhost:3000/api/almanac/teams
```

Expected result:

```text
/                         API responds
/api/health               API health responds
/api/health/db            API can reach local Postgres
/api/almanac/contents     API returns the Almanac section navigation
/api/almanac/editions     API returns the seeded Almanac Editions index
/api/almanac/teams        API currently returns an empty list; database reads are pending
```

`CORS_ORIGIN` is the frontend origin allowed to call the API. Local development uses
`http://localhost:5173`; demo uses its deployed frontend origin in Cloudflare.

If `/api/health/db` fails, check that Postgres is running:

```sh
pnpm db:up
pnpm db:logs
```

If `pnpm db:up` fails with a Docker daemon error, Docker is not running. Start Docker Desktop, wait until it finishes booting, then run:

```sh
pnpm db:up
```

## Daily Development

Most days, engineers only need one long-running terminal: the API dev server.

Start local Postgres first:

```sh
pnpm db:up
pnpm db:migrate
```

This requires Docker to be running. `db:up` starts Docker Postgres in the background and exits;
`db:migrate` applies only migrations that have not already been recorded.

Then start the API in watch mode:

```sh
pnpm dev
```

This command stays running and reloads the API when source files change.

Recommended terminal layout:

```text
Terminal 1: pnpm dev

Optional:
Terminal 2: pnpm db:logs
Terminal 3: pnpm db:psql
```

Run type checking:

```sh
pnpm run typecheck
```

Build the API:

```sh
pnpm run build
```

Run the compiled API:

```sh
pnpm run start
```

For table definitions, migrations, seed data, Drizzle Studio, and database troubleshooting,
see [Database Development Guide](docs/guides/database-development.md).

Stop local Postgres:

```sh
pnpm db:down
```

Open a Postgres shell:

```sh
pnpm db:psql
```

## Current v1 Baseline

The current root app contains:

```text
Express API
environment validation
local Postgres connection
Drizzle schema and migration tooling
Almanac seed data
health routes
Almanac hello and World Cup editions routes
Cloudflare Worker and Container deployment
TypeScript build
pnpm scripts
```

Not included yet:

```text
provider ingestion
scheduler
admin routes
Best Shot routes
broader Almanac routes
scoring
leaderboards
hosted PostgreSQL integration for the Cloudflare deployment
automated browser tests
Redis
```

Those pieces should come back only when a product slice needs them.
