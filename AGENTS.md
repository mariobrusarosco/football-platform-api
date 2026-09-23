# Football Platform API Agent Instructions

## Scope

The repository root is the new application. All new product work belongs in the root application.

```text
root/   new application
legacy/ historical reference only
```

Do not build new features in `legacy/` unless the user explicitly requests a legacy change.

Legacy code may be read to understand historical product behavior, business rules, and data
decisions. Legacy folders, layer names, and dependency patterns are never the source of truth for
the new root architecture.

## Canonical Architecture

Before creating or editing any code under `src/products/`, read the complete canonical guide:

```text
docs/architecture/domain-modules.md
```

That document is authoritative for product-domain layers and dependency direction. The standard
persistent HTTP flow is:

```text
product router -> routes.ts -> service.ts -> repository.ts -> platform/database
```

Non-negotiable rules:

- HTTP routes call services, never repositories or the database.
- Services own domain behavior, orchestration, validation, and response mapping.
- Services do not import Express, Drizzle, the database, or schema modules.
- Repositories own persistence access and do not import routes, services, or Express.
- A domain never imports another domain's repository. A repository may import another domain's
  `schema.ts` for a read-only join within the same product PostgreSQL schema, as documented by ADR
  0004. Cross-domain writes remain prohibited. A `schema.ts` may import another domain's
  `schema.ts` to declare an accepted same-product foreign key documented by ADR 0003.
- Do not introduce `api`, `controllers`, `use-cases`, `queries`, or another architectural layer by
  copying the legacy application.
- A structural layer change requires explicit user approval and a superseding ADR.

If a requirement does not fit the documented architecture, stop and explain the conflict. Do not
invent a new layer or silently bypass an existing one.

## Working Protocol

Before editing a product domain:

1. Read every existing file in that domain.
2. Read the product router and trace the current request path.
3. Identify the responsibility of each file being changed.
4. State any proposed architectural deviation before editing.
5. Preserve unrelated user changes in the working tree.

For slice and decision documents, distinguish `Accepted`, `Proposed`, `Open`, and `Deferred` items.
Do not implement a proposed or open decision as though it were accepted.

The reference domain implementation is:

```text
src/products/almanac/domains/editions/
```

## Response Format

End every non-trivial final response that proposes work with this exact section:

```text
Summarized List of Actions I'll Take
1. ...
2. ...
3. ...
```

Keep the list objective and concise. It must state:

- the requested objective;
- the concrete actions the agent proposes;
- the files or systems that will be affected;
- anything explicitly excluded from the scope;
- any decision that still requires user approval.

The summary must not introduce an action, tool, refactor, dependency, infrastructure change, or
enforcement mechanism that was not explained in the main response. Optional recommendations must
be labeled optional and must not be implemented as though they were approved.

When reporting completed work, use `Summarized List of Actions Taken` and list only actions that
were actually completed.

## Package Manager And Verification

Use pnpm. Do not replace root commands with legacy Yarn commands.

After changing product-domain code, run:

```sh
pnpm typecheck
pnpm build
```

After changing a schema or migration, also run:

```sh
pnpm db:check
```

Report any check that could not be run or did not pass.
