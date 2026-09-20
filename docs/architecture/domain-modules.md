# Domain Module Architecture

## Status And Authority

Accepted on 2026-07-11.

This document is the canonical source for the architecture of product domains in the new root
application. It applies to all code under:

```text
src/products/
```

The `legacy/` application may be consulted for historical product behavior, business rules, and
data decisions. Its folders and dependency patterns do not define the architecture of the new root
application.

A structural change to the layers or dependency direction in this document requires explicit user
approval and a new ADR that supersedes ADR 0002. Agents and engineers must not introduce a new
architectural layer by inference.

## Product And Domain Location

Business capabilities are organized by product first and domain second:

```text
src/products/<product>/domains/<domain>/
```

Examples:

```text
src/products/almanac/domains/editions/
src/products/almanac/domains/contents/
src/products/almanac/domains/teams/
src/products/best-shot/domains/guesses/
```

Use a specific product name such as `best-shot`. Do not create a generic `game` product.

## Standard Request Flow

An HTTP-backed domain that reads or writes PostgreSQL follows this dependency direction:

```text
application router
  -> product router
    -> domain routes.ts
      -> domain service.ts
        -> domain repository.ts
          -> platform/database
```

A service may also use technical helpers owned by `src/platform/`:

```text
routes.ts
  -> service.ts
    -> repository.ts
    -> platform helper
```

Dependencies only point inward along these arrows. A lower layer must never call back into a
higher layer.

## Standard Domain Files

```text
src/products/<product>/domains/<domain>/
|-- routes.ts
|-- service.ts
|-- repository.ts
|-- schema.ts
`-- types.ts
```

Not every domain needs every file:

| File | Required when | Responsibility |
| --- | --- | --- |
| `routes.ts` | The domain exposes HTTP endpoints | Express routing, HTTP input, status codes, and response delivery |
| `service.ts` | The domain exposes behavior to a caller | Domain decisions, orchestration, validation, and response-model mapping |
| `repository.ts` | The domain reads or writes persistent data | Drizzle queries and persistence-result mapping |
| `schema.ts` | The domain owns PostgreSQL tables | Drizzle table, constraint, and index declarations |
| `types.ts` | Types are shared by multiple files in the domain | Domain inputs, records, results, and response types |

An HTTP route always calls a service, even when the service initially delegates directly to a
repository. This stable boundary keeps HTTP and persistence concerns from becoming coupled as the
slice grows.

Do not create empty placeholder files. Add an optional file when its responsibility exists.

## Layer Rules

### Product Router

The product router mounts domain routers under product-specific paths.

It may:

- import domain `routes.ts` modules;
- define a tiny product-level operational route when no domain owns it yet.

It must not:

- query the database;
- shape domain responses;
- contain domain business rules.

### Routes

`routes.ts` owns the HTTP boundary.

It may:

- declare Express paths and methods;
- read path, query, header, and body values;
- perform HTTP-specific validation;
- call its domain service;
- translate known outcomes into HTTP status codes and responses.

It must not:

- import a repository or schema;
- import the database or Drizzle;
- perform SQL queries;
- construct public asset URLs or other domain response values;
- contain reusable domain behavior.

### Service

`service.ts` is the public behavior boundary of a domain.

It may:

- call its repository;
- enforce domain rules;
- coordinate multiple repository operations;
- call platform helpers;
- map repository results into API response models;
- call another domain's public service when the dependency is explicit and one-way.

It must not:

- import Express request or response types;
- import the database, Drizzle, or a schema module;
- know HTTP status codes;
- import another domain's repository or schema.

Configuration-dependent response values belong here at the domain level. For example, an Editions
service may turn a repository-provided asset key into an absolute `assetUrl` by calling a platform
URL helper. The repository must remain unaware of the public asset origin.

### Repository

`repository.ts` owns persistence access for one domain.

It may:

- import the shared database client;
- import its own domain schema;
- use Drizzle query helpers;
- map database rows into persistence records that are convenient for its service.

It must not:

- import Express;
- import routes or services;
- produce HTTP responses or status codes;
- construct environment-specific public URLs;
- import another domain's repository or schema;
- hide cross-domain joins.

Repository records and public API responses are separate contracts. A repository can flatten or
normalize database rows, while the service owns the final response shape.

### Schema

`schema.ts` declares the PostgreSQL objects owned by the domain. Database ownership follows
[ADR 0001](../adr/0001-database-domain-boundaries.md).

It must not import routes, services, repositories, or Express.

A schema module may import another domain's schema module only to declare an accepted foreign key
between tables in the same product schema. This narrow exception is defined by
[ADR 0003](../adr/0003-same-product-schema-foreign-keys.md); it does not permit cross-domain runtime
queries or behavior.

### Types

Use `types.ts` only when a type is shared by more than one domain file or when naming the contract
improves clarity. A type used by one implementation can remain beside that implementation.

Product-domain types used by supporting scripts, including validated source and seed record types,
remain owned by the domain and live in its `types.ts`. Seed files consume those types; they do not
define product-domain record shapes inside `scripts/`.

Do not use database schema types as public API response types. Persistence and HTTP contracts may
change independently.

## Cross-Domain Rules

- A domain must never import another domain's `repository.ts`.
- Routes, services, and repositories must never import another domain's `schema.ts`.
- A `schema.ts` may import another same-product domain's `schema.ts` only for an accepted foreign
  key dependency documented by ADR 0003.
- A service may call another domain's public service for a small, explicit, one-way dependency.
- A workflow coordinating several peer domains should move to a clearly named product-level
  orchestration module after a concrete use case demonstrates that need.
- Cross-product behavior requires an explicit architecture discussion before implementation.
- Cross-domain reads and writes must remain visible. Do not hide them in a repository join.

## Platform Boundary

`src/platform/` owns shared technical capabilities such as configuration, database access, health,
logging, and public URL mechanics. Platform code must not contain Almanac or Best Shot business
rules.

Product services decide when and why a platform capability is used. Repositories use the platform
database client only for persistence.

## Layers We Do Not Use By Default

The new root domain template does not include:

```text
api/
controllers/
use-cases/
queries/
```

Their responsibilities are already covered by `routes.ts`, `service.ts`, and `repository.ts`.
These names may exist in the legacy application or in a future specialized design, but they are not
the root architecture and must not be copied automatically.

Adding a new architectural layer requires a concrete problem, explicit user approval, and a
superseding ADR.

## Reference Domain

The reference implementation is:

```text
src/products/almanac/domains/editions/
```

Its request flow is:

```text
GET /api/almanac/editions
  -> editions/routes.ts
    -> editions/service.ts
      -> editions/repository.ts
        -> almanac.editions
```

New domains should follow this implementation unless an accepted architecture decision says
otherwise.

A domain without persistence omits files whose responsibilities do not exist. For example, the
Almanac Contents request follows:

```text
GET /api/almanac/contents
  -> contents/routes.ts
    -> contents/service.ts
      -> editions/service.ts for the public edition-count behavior
```

It has no repository or schema because its section metadata is backend configuration rather than
database data. This is an application of the standard optional-file rules, not a different
architecture.

## Creating A Domain

1. Confirm the product and domain ownership.
2. Create `src/products/<product>/domains/<domain>/`.
3. Add `schema.ts` and a migration only when the domain owns persistent data.
4. Add `repository.ts` only when persistence access exists.
5. Add `service.ts` as the public behavior boundary.
6. Add `routes.ts` when exposing HTTP behavior.
7. Mount the domain router from the product router.
8. Run the architecture and TypeScript checks.
9. Update API or slice documentation when the public contract changes.

Before editing an existing domain, read all of its files and trace the current call path from the
product router to persistence.

## Verification

Run these checks after changing product-domain code:

```sh
pnpm typecheck
pnpm build
```

When schema or migration files change, also run:

```sh
pnpm db:check
```
