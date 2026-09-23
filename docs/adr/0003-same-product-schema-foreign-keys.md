# ADR 0003: Same-Product Schema Foreign Keys

## Status

Accepted on 2026-07-17. Its runtime read-join restriction was superseded by ADR 0004 on
2026-09-20; its schema foreign-key decision remains accepted.

## Context

The Almanac product separates business capabilities into domains while storing their tables in the
same PostgreSQL schema. Some persistent relationships cross those domain ownership boundaries. A
participation, for example, belongs to one edition and one national team.

ADR 0002 prohibits runtime layers from importing another domain's schema or repository. Applied to
schema declarations without an exception, that rule would also prevent PostgreSQL from enforcing
accepted relationships between same-product tables.

## Decision

A domain's `schema.ts` may import another domain's `schema.ts` only to declare an accepted foreign
key between tables in the same product PostgreSQL schema.

The exception established by this ADR is limited to schema declarations. ADR 0004 separately
governs runtime read joins:

- routes and services cannot import another domain's schema;
- repositories may import another same-product domain's schema only for read-only joins under ADR
  0004;
- a domain still cannot import another domain's repository;
- the importing domain owns its foreign-key column and the relationship it represents;
- the dependency must be acyclic and recorded in the canonical schema documentation;
- cross-product or cross-PostgreSQL-schema foreign keys remain prohibited by default under ADR
  0001.

For Participations, the accepted schema dependency is:

```text
participations/schema.ts
  |-> editions/schema.ts
  `-> teams/schema.ts
```

This dependency exists so PostgreSQL can enforce that every participation references an existing
edition and national team. At the time of this decision it did not authorize a cross-domain
repository join; ADR 0004 now separately authorizes same-product, read-only repository joins.

## Consequences

Benefits:

- PostgreSQL enforces accepted same-product relationships.
- Table ownership remains explicit in each domain.
- Runtime dependency rules remain unchanged.

Costs:

- Schema modules can have a small number of documented cross-domain imports.
- Migration order must create referenced tables before dependent tables.
- Cyclic schema ownership must be rejected or redesigned.

## Revisit Triggers

Revisit this decision if schema dependencies become cyclic, product domains move to separate
databases, or a concrete runtime workflow requires a new cross-domain orchestration rule.
