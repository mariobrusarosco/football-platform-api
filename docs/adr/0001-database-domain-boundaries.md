# ADR 0001: Database Domain Boundaries

## Status

Accepted on 2026-07-10. Its same-product runtime read-join restriction was superseded by ADR 0004
on 2026-09-20; its product database-boundary decision remains accepted.

## Context

The new Football Platform API will support multiple products. Almanac is a new historical football
product. Best Shot is the score-prediction game rebuilt from legacy product knowledge, and other
games may be added later.

These products can use the same everyday entity names without sharing the same domain model. An
Almanac player is not automatically a Best Shot player. A generic `game` database namespace would
also become ambiguous as soon as the platform contains another game.

The root application currently runs as one Node/Express API and has one Drizzle migration history.
Its first product table was created locally as `public.world_cup_editions`. No new database has been
created remotely, and no legacy database or migration will be reused.

## Decision

Each environment will have its own new PostgreSQL project and database:

```text
local
Cloudflare demo
staging, when introduced
production, when introduced
```

Environments will never be represented as schemas inside one shared database.

Within each environment's database, product data will be separated with PostgreSQL schemas:

```text
almanac.*
best_shot.*
```

Examples:

```text
almanac.world_cup_editions
almanac.players
best_shot.matches
best_shot.guesses
best_shot.players
```

Future games will receive their own schemas rather than being placed under a generic `game`
schema. Product tables will use natural names inside their schema rather than repeating the schema
as a table prefix.

The application will keep one ordered Drizzle migration history while it remains one deployable
application. Drizzle's migration ledger will remain in `public.__drizzle_migrations`.

## Domain Rules

- Each product domain owns the tables and repository code in its schema.
- Sharing one database does not imply sharing domain models.
- Cross-schema foreign keys are prohibited by default. An exception requires a concrete use case
  and a new architecture decision.
- Same-product, read-only cross-domain repository joins are permitted by ADR 0004. Cross-domain
  writes and cross-product reads remain explicit application-boundary concerns.
- Provider identifiers remain separate from internal IDs.
- A shared `identity` schema will not be introduced until a concrete feature must map corresponding
  real-world entities across domains.
- Runtime credentials may initially access the whole application database. More restrictive
  schema-specific roles can be introduced if deployable ownership separates later.

## Current Table Migration

Migration `0000_almanac_world_cup_editions` has already been applied locally and will not be
rewritten. A forward migration will:

```text
create the almanac schema
move public.world_cup_editions to almanac.world_cup_editions
preserve its rows, constraints, indexes, and identity
```

The HTTP contract does not change because of this storage-boundary change.

## Consequences

Benefits:

- Almanac and Best Shot can use clear, independent table names.
- Local development, secrets, backups, migrations, and deployment retain one database connection
  per environment.
- Deliberate cross-domain transactions remain possible while the platform is a modular monolith.
- A domain can be exported by schema if it later needs its own database.

Costs:

- Database capacity and outages remain shared by all domains in an environment.
- Schema boundaries do not enforce independent availability.
- Careless cross-schema queries could create coupling, so ownership rules still require review.
- Moving a domain to another database later requires removing or replacing any cross-schema
  dependencies first.

## Alternatives Considered

### Prefix Every Table In `public`

Examples would be `almanac_players` and `best_shot_players`. This solves name collisions but leaves
ownership as a naming convention, clutters the `public` namespace, and provides weaker permission
and extraction boundaries than PostgreSQL schemas.

### Separate Database Per Product Domain

This provides stronger failure and security isolation but immediately requires multiple connection
strings, migration targets, backups, deployment coordination, and application-level alternatives to
cross-database joins and transactions. That operational cost is not justified while one small team
owns one API deployment.

### Shared Identity Database Or Schema Immediately

This would force Almanac and Best Shot to agree on shared entities before a product requirement
exists. It is deferred to avoid premature coupling.

### Generic `game` Schema

This becomes ambiguous when another game is introduced. `best_shot` names the current bounded
context without claiming ownership of every future game.

## Revisit Triggers

Reconsider separate databases when one or more of these become true:

- Almanac imports or queries materially interfere with Best Shot transactions.
- A domain needs independent scaling, availability, security, or compliance controls.
- Separate teams own and deploy domains independently.
- A domain becomes its own deployable service.
- The shared database creates a measured operational bottleneck rather than a theoretical concern.

Reconsider a shared Identity domain only when a feature needs a stable, explicit mapping between
corresponding real-world entities owned by different product domains.
