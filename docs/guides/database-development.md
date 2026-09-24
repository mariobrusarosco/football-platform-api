# Database Development Guide

## Purpose

Explain the verified database workflow for the new root Football Platform API.

This guide describes the root application only. The database code and migrations under `legacy/`
are reference material and are not part of this workflow.

## Current Status

Locally verified on 2026-07-10:

```text
Local PostgreSQL in Docker
Drizzle schema declarations
Generated SQL migration history
Drizzle migration application
Non-destructive Almanac seed data
Drizzle-backed application queries
Repeat migration and seed commands
Drizzle Studio inspection
Local API startup
Local database health and Almanac endpoint requests
```

Remote configuration completed on 2026-07-11:

```text
Brand-new Supabase demo project created
GitHub demo environment DATABASE_URL secret configured
Cloudflare demo Worker DATABASE_URL secret configured
Remote Almanac seed available as an opt-in workflow input that defaults to false
```

Remote deployment verified on 2026-07-11:

```text
GitHub Actions applied the Drizzle migrations to Supabase
GitHub Actions deployed the Cloudflare Worker and Container
/api/health/db returned HTTP 200 with database.ok true
/api/almanac/world-cups returned HTTP 200 with an empty editions array
```

The empty editions array was expected because the verified workflow run left the optional seed
input disabled. Demo data was entered manually afterward.

That dated deployment proof used the provisional `/api/almanac/world-cups` route. The current
Editions index route is `/api/almanac/editions`; there is no compatibility alias.

## Architecture

Normal local development uses three separate processes:

```text
Node/Express API on the engineer's machine
  -> Drizzle ORM
  -> PostgreSQL 16 in Docker
    -> almanac schema

Drizzle Studio on the engineer's machine
  -> PostgreSQL 16 in Docker
```

Docker runs PostgreSQL only. The API and Drizzle Studio run directly on the host machine.

Each environment receives a separate PostgreSQL project and database. Product domains share the
database within one environment but own separate PostgreSQL schemas:

```text
public.__drizzle_migrations
almanac.*
best_shot.* when the first Best Shot table is introduced
```

Use natural table names inside each schema, such as `almanac.players` and `best_shot.players`. Do
not replace schema ownership with names such as `almanac_players` in `public`.

The rationale and extraction triggers are recorded in
[ADR 0001: Database Domain Boundaries](../adr/0001-database-domain-boundaries.md).

## Important Files

```text
docker-compose.yml
  Defines local PostgreSQL.

docs/adr/0001-database-domain-boundaries.md
  Defines physical environment isolation and logical product-domain ownership.

.env
  Contains the local DATABASE_URL. It is never committed.

.env.example
  Documents the expected local environment variables.

drizzle.config.ts
  Tells Drizzle Kit where schema declarations and migrations live.

drizzle/
  Contains generated SQL migrations and Drizzle migration metadata.

src/products/*/domains/*/schema.ts
  Contains product-owned TypeScript declarations for database tables.

src/platform/database/index.ts
  Creates the postgres.js connection and Drizzle application client.

scripts/seed-almanac.ts
  Inserts or updates the small, known Almanac seed dataset without deleting rows.
```

Schema declarations describe the desired database shape. Migration files are the ordered history
that moves a real database from one shape to the next. Both belong in version control.

## First-Time Local Setup

From the repository root, install dependencies:

```sh
pnpm install
```

If `.env` does not exist, create it from the example:

```sh
cp .env.example .env
```

Start PostgreSQL:

```sh
pnpm db:up
```

Apply every pending migration:

```sh
pnpm db:migrate
```

Load the small Almanac seed dataset:

```sh
pnpm db:seed:almanac
```

Start the API:

```sh
pnpm dev
```

The API should be available at:

```text
http://localhost:3000
```

## Verify The Local Data Path

With the API running, use another terminal:

```sh
curl -i http://localhost:3000/api/health/db
curl -i http://localhost:3000/api/almanac/editions
```

Expected behavior:

```text
/api/health/db
  -> HTTP 200
  -> database.ok is true

/api/almanac/editions
  -> HTTP 200
  -> editions contains the seeded Editions index rows
```

An empty `almanac.editions` table is valid. The endpoint returns HTTP 200 with an empty
`editions` array.

## Daily Development

Start PostgreSQL if it is not already running:

```sh
pnpm db:up
```

Apply migrations after pulling changes from another engineer:

```sh
pnpm db:migrate
```

Start the API:

```sh
pnpm dev
```

`pnpm db:up` and `pnpm db:migrate` are safe to run when PostgreSQL is already running and all
migrations are already applied.

## Inspect Data With Drizzle Studio

Start PostgreSQL first, then run:

```sh
pnpm db:studio
```

Keep that terminal running. Drizzle prints the local Studio URL; open that URL in a browser.

Use Studio to inspect tables and rows. Do not use Studio to make schema changes that exist only in
your local database. Schema changes must begin in a committed Drizzle schema declaration and
migration.

For the current Almanac tables, use the
[National Teams Schema Model](../plans/almanac-national-teams-schema-model.md),
[Editions Schema Model](../plans/almanac-editions-schema-model.md), and
[schema diagram](../diagrams/almanac-schema.html). `national_teams` contains team identities;
`national_team_participations` contains team appearances in editions. Association means the
governing organization and is currently stored only as nullable `association_acronym` text.

You can enter an acronym manually in Studio or SQL. The
[manual-entry instructions](../plans/almanac-national-teams-schema-model.md#association-acronym-manual-entry-and-import-behavior)
include an example. Missing or null Foundation acronyms preserve a manual value; a non-null source
acronym replaces it. There is no automatic acronym backfill or admin endpoint.

## Store Public Asset References

Product-managed assets use provider-neutral object keys, not complete Cloudflare URLs. Imported
`national_teams.flag_url` values remain source URLs. Name an object-key column for
the asset's domain meaning, such as `logo_asset_key`.

```text
Correct:   editions/2018-logo.svg
Incorrect: /editions/2018-logo.svg
Incorrect: https://pub-example.r2.dev/editions/2018-logo.svg
```

Object keys do not begin with `/`. The owning product service passes the key to the shared platform
URL builder and returns the resulting absolute URL in its API response. Repositories remain unaware
of `ASSET_BASE_URL`.

Local development and the Cloudflare demo deployment currently use the same public demo R2 origin.
They retain separate PostgreSQL databases; sharing the public asset origin does not share database
state.

See the visual-identity sections of the
[Editions](../plans/almanac-editions-schema-model.md) and
[National Teams](../plans/almanac-national-teams-schema-model.md) schema models for asset ownership.

## Create Or Change A Table

### 1. Change The Domain Schema

Add or edit the appropriate file under:

```text
src/products/<product>/domains/<domain>/schema.ts
```

Keep table ownership with the product domain that owns the data.

Declare product tables through that domain's PostgreSQL schema object. The current example is
`almanacSchema.table(...)` in `src/products/almanac/domains/editions/schema.ts`.

### 2. Generate A Migration

Use a concise, descriptive migration name:

```sh
pnpm db:generate --name=describe_the_change
```

Generation compares the current schema declarations with Drizzle's committed schema snapshots. It
creates a new SQL migration and updated metadata under `drizzle/`.

### 3. Review The Generated SQL

Open the new `.sql` file under `drizzle/` and verify:

```text
Only the intended tables, columns, constraints, and indexes change.
No unrelated table is dropped or rewritten.
Potentially destructive operations are understood before application.
The migration name describes the change.
```

Do not apply generated SQL that you have not reviewed.

### 4. Validate Migration History

```sh
pnpm db:check
```

This checks the generated migration history for consistency. It is a static file check and does not
read `DATABASE_URL` or connect to PostgreSQL.

### 5. Apply Locally

```sh
pnpm db:migrate
```

Drizzle records applied migrations in PostgreSQL. Running the command again applies only migrations
that have not already been recorded.

### 6. Verify The Application

```sh
pnpm run typecheck
pnpm run build
pnpm dev
```

Exercise the affected endpoint and inspect the resulting rows through Drizzle Studio.

### 7. Commit The Complete Change

A table change normally includes:

```text
domain schema declaration
generated SQL migration
generated Drizzle metadata
application query changes
seed changes when required
tests or documented validation
```

Never commit `.env` or a database connection string.

## Migrations Versus Seed Data

Migrations change database structure:

```text
create table
add column
add constraint
create index
```

The Almanac seed command creates a very small known dataset used to prove the product data
path:

```sh
pnpm db:seed:almanac
```

The seed command is designed to be repeatable. It updates rows by a stable source key and does
not truncate or delete existing rows.

Do not hide destructive test resets inside a command named `seed`.

## Command Reference

```text
pnpm db:up
  Start local PostgreSQL in the background.

pnpm db:down
  Stop local PostgreSQL containers. The named data volume is preserved.

pnpm db:logs
  Follow local PostgreSQL logs.

pnpm db:psql
  Open a PostgreSQL command-line session inside the container.

pnpm db:generate --name=<description>
  Generate SQL from schema declaration changes.

pnpm db:check
  Validate migration history consistency without connecting to PostgreSQL.

pnpm db:migrate
  Apply pending migrations to DATABASE_URL.

pnpm db:seed:almanac
  Insert or update the known Almanac seed rows.

pnpm db:studio
  Start the local Drizzle Studio database interface.
```

## Local Reset Safety

There is deliberately no `db:reset` command yet.

`pnpm db:down` stops PostgreSQL but preserves its Docker volume and data. Removing the volume is a
destructive operation and is not part of the normal workflow.

Before adding or running a local reset command, confirm that:

```text
the target is the local Docker database;
no useful local data needs to be retained;
the command cannot receive a hosted DATABASE_URL;
the engineer explicitly intends to delete all local data.
```

## Rules And Prohibited Shortcuts

- Do not reuse or apply migrations from `legacy/`.
- Do not edit a migration after it has been applied or shared. Create a new corrective migration.
- Do not use direct database schema edits as the source of truth.
- Do not add `db:push` as the normal workflow; it bypasses reviewed migration history.
- Do not commit secrets or connection strings.
- Do not run migrations automatically when an API container starts.
- Do not make a destructive migration and dependent application change as one unplanned release.
- Do not put product tables in `public`; use the owning product's PostgreSQL schema.
- Do not repeat a schema name as a table prefix.
- Do not assume Best Shot and Almanac entities with the same name share one data model.
- Do not add cross-schema foreign keys without a concrete use case and an architecture decision.

## Troubleshooting

### Docker Is Not Running

If `pnpm db:up` cannot connect to the Docker daemon, start Docker Desktop and wait until it is ready.

### `DATABASE_URL` Is Missing

Database commands and the API require `DATABASE_URL`. Confirm `.env` exists and contains:

```text
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/football_platform
```

### PostgreSQL Is Unreachable

Check container state and logs:

```sh
pnpm db:up
pnpm db:logs
```

The expected local host port is `5433`.

### A Migration Fails

Stop and read the actual database error. Do not edit the generated migration or reset the database
until the cause is understood.

Check:

```text
PostgreSQL is running.
DATABASE_URL points to the intended database.
The generated SQL contains only the intended change.
The migration was not previously modified or partially applied.
```

If a migration has already been applied, fix it with a new forward migration.

## Hosted Database And Cloudflare

The Cloudflare demo uses a brand-new Supabase PostgreSQL project. It does not reuse the legacy
database. The project region is South America (Sao Paulo), `sa-east-1`, so the database is close to
the demo's initial users.

The application does not use Supabase's Data API or JavaScript client. The Node container connects
to PostgreSQL through Drizzle and postgres.js exactly as it does locally.

### Connection Mode Decision

Use the Supabase Shared Pooler in **Session mode on port 5432** for both paths in this first demo:

| Path | Secret name | Reason |
| --- | --- | --- |
| Cloudflare Worker to Node container | `DATABASE_URL` | The container is a persistent backend while it is running. Session mode preserves connection semantics without depending on IPv6 availability. |
| GitHub Actions to migrations | `DATABASE_URL` | GitHub-hosted runners are IPv4-only, and Supabase documents Session mode for migration clients on IPv4. |

Do not use these alternatives for this slice:

```text
Direct connection, db.<project-ref>.supabase.co:5432
  -> IPv6 by default; GitHub-hosted runners cannot reach it without an IPv4 add-on.

Transaction pooler, *.pooler.supabase.com:6543
  -> Intended for transient serverless clients, not our persistent container or migration job.
```

References:

- [Supabase connection modes](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase IPv4 and IPv6 compatibility](https://supabase.com/docs/guides/troubleshooting/supabase--your-network-ipv4-and-ipv6-compatibility-cHe3BP)
- [Supabase regions](https://supabase.com/docs/guides/platform/regions)

### Secret Naming And Ownership

The same Session-pooler URI is stored in two independent systems under the same semantic name:

```text
Supabase
  -> owns the database and its connection URI

GitHub environment: demo
  -> environment secret: DATABASE_URL
  -> available only to jobs that target the demo environment
  -> used by the Drizzle migration command

Cloudflare Worker: football-platform-api-demo
  -> Worker-specific secret: DATABASE_URL
  -> forwarded by the Worker to the Node container as DATABASE_URL
```

GitHub and Cloudflare cannot read each other's secret stores, so each stores its own copy. The name
remains `DATABASE_URL` because the value has the same meaning in both places. Environment identity
belongs to the GitHub Environment or Cloudflare Worker scope, not to the secret name.

Using the default Supabase `postgres` credential for both paths is a deliberate demo-stage
simplification. Separate least-privilege runtime and migration roles are required before a
production environment is created. If those become genuinely different credentials, their names
must describe that difference explicitly.

Never place either URI in source files, `wrangler.toml`, the Docker image, `.env`, workflow output,
or this guide. The existing local `.env` must continue pointing to Docker PostgreSQL.

### 1. Obtain The Session-Pooler URI

In the new Supabase project:

1. Select **Connect**.
2. Select the connection-string **URI** format.
3. Select the **Shared Pooler** in **Session** mode.
4. Confirm the URI uses port `5432`, a `*.pooler.supabase.com` host, and a username shaped like
   `postgres.<project-ref>`.
5. Replace the password placeholder with the project database password.
6. Store the completed URI in a password manager. Do not paste it into chat.

If the password contains reserved URI characters, percent-encode the password portion. Supabase's
[Postgres roles documentation](https://supabase.com/docs/guides/database/postgres/roles) shows this
requirement.

Stop if the selected URI uses `db.<project-ref>.supabase.co` or port `6543`; that is not the chosen
connection mode.

### 2. Add The GitHub Demo Environment Secret

In the GitHub repository:

1. Open **Settings**.
2. Open **Environments**.
3. Create or open the environment named exactly `demo`.
4. Under **Environment secrets**, add a secret named exactly `DATABASE_URL`.
5. Set its value to the complete Session-pooler URI.
6. Save it.

The `Deploy Cloudflare Demo` job declares `environment: demo`, which is what grants that job access
to the environment-scoped secret. GitHub does not automatically export an environment secret as a
shell variable. The migration step explicitly maps `secrets.DATABASE_URL` to the process variable
`DATABASE_URL`; the static migration-history check does not receive the secret. GitHub stores the
value encrypted, and the workflow does not print it. See
[GitHub deployment environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
and [using secrets in workflows](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).

After this environment secret exists, delete the obsolete repository secret
`DB_STRING_CONNECTION_DEMO`. No current workflow references it.

### 3. Add The Cloudflare Runtime Secret

In the Cloudflare dashboard:

1. Open **Workers & Pages**.
2. Select `football-platform-api-demo`.
3. Open **Settings** > **Variables and Secrets**.
4. Add a variable with type **Secret**.
5. Name it exactly `DATABASE_URL`.
6. Set its value to the complete Session-pooler URI.
7. Deploy the secret change.

Do not create this value in Cloudflare's account-level **Secrets Store**. This application uses a
Worker-specific secret bound directly to `football-platform-api-demo`.

`wrangler.toml` declares `DATABASE_URL` as required. A code deployment will fail clearly if the
secret is absent. The Worker passes the encrypted value into the container through `envVars`; it is
not baked into the image. See [Cloudflare Container secrets](https://developers.cloudflare.com/containers/examples/env-vars-and-secrets/)
and [required Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/).

### 4. Run The Manual Demo Workflow

In GitHub Actions, run **Deploy Cloudflare Demo** manually. The workflow order is:

```text
checkout and install from the pnpm lockfile
typecheck and build
validate Drizzle migration history
apply pending migrations with the demo environment's DATABASE_URL
deploy the Worker and Container with Wrangler
```

The API container never performs migrations during startup.

The manual workflow presents a boolean **Seed Almanac demo data** input. It defaults to `false`, so
ordinary deployments skip seeding. When selected, the workflow runs `pnpm db:seed:almanac` after
migrations and before deployment, using the GitHub `demo` environment's `DATABASE_URL`.

The seed script upserts its known rows by `source_key`. Selecting the input may update a manually
entered row that uses the same source key. A row with the same year but a different source key will
conflict with the table's unique year constraint and make the seed step fail; the deployment will
then stop before Wrangler runs.

### 5. Verify Manually

After the workflow succeeds, verify these routes manually:

```text
https://football-platform-api-demo.mariobrusarosco.workers.dev/api/health/db
https://football-platform-api-demo.mariobrusarosco.workers.dev/api/almanac/editions
```

Expected results:

```text
/api/health/db
  -> HTTP 200
  -> database.ok is true

/api/almanac/editions
  -> HTTP 200
  -> editions is an array
  -> an empty array is valid until demo rows are entered manually
```

This remains a human verification step. There is no automated retrying smoke test or rollback gate.

### Failure Behavior

```text
Static validation fails
  -> no database or deployment change occurs

Migration fails
  -> deployment does not run
  -> read the database error before retrying

Cloudflare deployment fails
  -> the additive migration remains in Supabase
  -> no database rollback is attempted
```

The migration is additive and Drizzle records it once. After a failure is understood and corrected,
rerunning the manual workflow is the recovery path. When the seed input is selected, it updates
rows by stable source key and remains safe to rerun when those source keys own the seeded records.

## Guide Verification

This guide is tested by having an engineer follow it without undocumented assistance.

Record any unclear instruction, unexpected output, missing prerequisite, or required guess. Treat
that friction as a documentation defect and update the guide.
