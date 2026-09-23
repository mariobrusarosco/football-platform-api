# ADR 0002: Product Domain Module Layers

## Status

Accepted on 2026-07-11. Amended by ADR 0004 on 2026-09-20 for same-product, read-only
cross-domain repository joins.

## Context

The new Football Platform API is a modular Node and Express application containing multiple
products. Product code is organized under `src/products/<product>/domains/<domain>/`.

The legacy Best Shot application contains several different layering styles accumulated over time.
Common folders include routes, APIs, controllers, services, queries, operations, and use cases.
Some domains follow a consistent request path while others bypass layers or duplicate behavior.
Those differences make the legacy application useful for historical product understanding but
unsafe as the implicit architecture template for new root code.

The new root application initially allowed an Editions route to call its repository directly. That
was sufficient for a database proof but did not establish where response mapping, configuration-
dependent values, validation, or future domain behavior should live.

Engineers and AI agents need one explicit structure that can be read quickly and applied
consistently.

## Decision

Product domains use the following dependency direction:

```text
product router
  -> routes.ts
    -> service.ts
      -> repository.ts
        -> platform/database
```

The responsibilities are:

```text
routes.ts       HTTP boundary
service.ts      domain behavior, orchestration, validation, and response mapping
repository.ts   persistence access
schema.ts       domain-owned PostgreSQL declarations
types.ts        shared domain contracts when needed
```

An HTTP route always calls a service. Repositories and schemas are optional when a domain has no
persistence. Routes are optional when a domain has no HTTP surface. Empty placeholder files are not
required.

Services may call platform helpers and may call another domain's public service when the dependency
is explicit and one-way. Domains must not import another domain's repository. ADR 0004 permits a
repository to import another domain's schema for a read-only join within the same product
PostgreSQL schema.

The legacy application does not define root architecture. In particular, `api`, `controllers`,
`use-cases`, and `queries` are not standard root layers. A new layer requires a concrete need,
explicit user approval, and an ADR that supersedes this decision.

The complete current rules and implementation procedure live in the canonical
[Domain Module Architecture](../architecture/domain-modules.md). The Almanac Editions domain is the
reference implementation.

## Consequences

Benefits:

- Every product domain has a predictable request path.
- HTTP, domain behavior, and persistence can change independently.
- Response mapping and configuration-dependent values have an explicit owner.
- Legacy knowledge can be reused without inheriting legacy structural inconsistency.
- Agents receive the same architecture through the root `AGENTS.md`.

Costs:

- Very small endpoints contain a service boundary even when it initially delegates directly.
- Some architectural rules still require human review because domain ownership cannot be proven
  entirely through imports.
- Cross-domain workflows may require a later, explicit orchestration decision when real examples
  emerge.

## Alternatives Considered

### Copy The Most Common Legacy Folder Structure

This would create separate route, API, service, and query layers. It was rejected because the new
root route already owns the HTTP handler, a separate API layer would duplicate that responsibility,
and the legacy application does not apply the pattern consistently.

### Keep Routes Calling Repositories Directly

This minimizes files for early endpoints but gives response mapping and domain behavior no stable
owner. It also couples Express handlers to persistence and was rejected.

### Adopt Use Cases As The Universal Layer

The legacy use-case structure belonged to one specialized provider domain. Treating it as the
platform architecture would generalize a local design without evidence and was rejected.

### Adopt A Framework-Neutral Clean Architecture Template

Adding ports, adapters, interactors, and entities immediately could provide stronger abstraction,
but it would add more concepts than the current modular monolith needs. The accepted structure can
evolve through a later ADR when measured complexity justifies it.

## Revisit Triggers

Reconsider this decision only when a concrete requirement demonstrates one of the following:

- several domains require the same multi-domain orchestration pattern;
- a product domain becomes a separately deployed service;
- non-HTTP entry points need a distinct public application boundary;
- repository substitution or transaction coordination cannot be expressed cleanly through the
  current service boundary.

Minor examples and clarifications may update the canonical guide. Changing the layer set or
dependency direction requires a superseding ADR.
