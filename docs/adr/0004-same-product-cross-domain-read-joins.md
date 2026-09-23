# ADR 0004: Same-Product Cross-Domain Read Joins

## Status

Accepted on 2026-09-20.

## Context

The API serves product views that combine data owned by several domains. An Almanac edition detail
response includes edition metadata and may also include hosts, visual identity, association
placements, matches, groups and awards. Producing these responses only through domain-service
composition would require multiple database queries and can create circular service dependencies.

ADR 0002 prohibited domains from importing another domain's repository or schema. ADR 0003 added a
narrow schema-import exception for foreign keys but retained the runtime read-join prohibition.
Those constraints protected domain ownership while the root application exposed simple domain
responses. Composite same-product responses are now a concrete requirement, so the absolute
runtime read-join prohibition no longer fits the application.

All Almanac domains share the `almanac` PostgreSQL schema and are deployed as one application.
PostgreSQL can enforce and query their relationships directly without crossing a product or
deployment boundary.

## Decision

A repository may import schema declarations owned by another domain and perform a read-only join
when all joined tables belong to the same product and PostgreSQL schema.

The following constraints apply:

- The repository owns the concrete read query and its persistence-result mapping.
- Joined schema imports must be explicit in that repository.
- A cross-domain read does not transfer ownership of the joined tables.
- A repository must not insert, update or delete rows owned by another domain.
- A domain must not import another domain's repository.
- Routes and services must not import schema modules or the database.
- Cross-product and cross-PostgreSQL-schema joins remain prohibited unless another ADR explicitly
  approves them.
- Services continue to own validation, behavior and public response mapping.

For example, the Editions repository may read `editions`, `association_editions` and `associations`
to produce the persistence data required by an edition-detail response. Participations and Teams
continue to own their respective tables and all writes to them.

This decision amends ADR 0002's schema-import restriction for repositories and supersedes ADR
0003's statement that its schema exception does not authorize runtime joins. It does not add a new
architectural layer or change the standard request flow:

```text
product router -> routes.ts -> service.ts -> repository.ts -> platform/database
```

## Consequences

Benefits:

- Composite product responses can use direct, efficient SQL joins.
- Services avoid circular dependencies created only to retrieve related persistence data.
- Domain ownership remains strict for writes.
- Cross-domain read dependencies are visible in repository imports.

Costs:

- A joined domain's schema change can require updates in repositories owned by other domains.
- Repository reviews must distinguish read composition from ownership-changing writes.
- Moving a domain to another database later requires replacing its same-product joins.

## Alternatives Considered

### Compose Every Cross-Domain Read Through Services

This preserves complete repository isolation but requires multiple queries for normal Almanac
responses and can create circular service dependencies. It remains available when orchestration
contains meaningful domain behavior, but it is no longer mandatory for relational reads.

### Add A Product Read-Model Layer

A separate read-model or query layer could centralize composite reads. It was rejected because the
existing repository layer can own concrete read queries without introducing another architectural
concept.

### Copy Related Values Into The Owning Domain

Denormalizing association names and codes into participation or edition tables would avoid joins,
but would duplicate authoritative data and require synchronization. It was rejected for current
relational data.

## Revisit Triggers

Reconsider this decision if domains move to separate PostgreSQL schemas or databases, become
independently deployed services, or same-product joins create measured ownership or release
coordination problems.
