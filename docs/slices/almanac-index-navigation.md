# Slice: Almanac Index Navigation

## Status

Local implementation complete. Contents, Editions, and Teams are implemented and verified locally,
including their empty-result policy. Demo deployment is pending.

## Purpose

Define the screen-oriented read contracts for the Almanac Table of Contents, Editions index, and
Teams index, which the current UI presents under the heading "Squads." Lock the real Almanac schema
before changing Drizzle, migrations, or API responses.

`docs/backend-contract-notes.md` remains a broad frontend reference. It is not the accepted database
schema and does not constrain the new implementation.

## Goal

Support three independent screen requests:

```text
Table of Contents
  -> GET /api/almanac/contents

Editions index
  -> GET /api/almanac/editions

Teams index
  -> GET /api/almanac/teams
```

Direct navigation to one screen must not fetch data owned only by another screen.

## Accepted Endpoint Boundaries

### Contents

`GET /api/almanac/contents` returns only top-level section navigation:

```text
label
path
page number
```

It does not include edition rows or team rows.

### Editions

`GET /api/almanac/editions` returns the lightweight rows required by the Editions index:

```text
stable edition identity
year
host display name and edition logo URL
path
page number
```

The provisional `/api/almanac/world-cups` route and response are replaced without aliases or
backward compatibility.

### Teams

`GET /api/almanac/teams` returns the lightweight national-team rows required by the Teams index:

```text
stable national-team identity
stable code
display data
path
page number
required public asset URL
all-time World Cup appearance count, if retained by the accepted screen contract
```

The endpoint does not return edition-specific squad or player data.

## Request Behavior

```text
open Table of Contents
  -> fetch Contents only

click Editions or open it directly
  -> fetch Editions only

click the UI's Squads section or open a team directly
  -> fetch Teams only
```

This slice does not add a bootstrap response containing all three payloads. Frontend prefetching and
client caching are separate frontend concerns and are not part of the API contract.

## Schema Document Rule

Before database implementation, create:

```text
docs/almanac-schema.md
```

Document responsibilities:

```text
docs/backend-contract-notes.md
  broad reference and possible product ideas

docs/slices/almanac-index-navigation.md
  current slice decisions, open questions, and execution checklist

docs/almanac-schema.md
  accepted tables, columns, constraints, and relationships only

Drizzle schema and migrations
  executable implementation of the accepted schema
```

Do not place proposed or open schema designs in `docs/almanac-schema.md`. If the accepted document
and Drizzle disagree after implementation, stop and resolve the mismatch.

## Data Ownership To Decide

| API value | Current recommendation | Status |
| --- | --- | --- |
| `pageNumber` | Derive it in the backend from explicit ordering and the current one-page-per-item rule; do not store absolute page numbers on edition or team records. | Accepted |
| `path` | Build it in the service from values already stored for the record, such as edition year or team code. Do not add a PostgreSQL column containing the full frontend path. | Accepted |
| display data | Store it on the domain record that owns the meaning. | Accepted |
| asset URL | Store an asset key and derive the absolute URL in the service. | Accepted by the public-assets slice |
| section order | Define the fixed section order in the Contents service; do not persist it. | Accepted |

The Teams index displays a national-team flag through `flagUrl`, derived from
`national_teams.flag_asset_key`. The Editions index displays its own logo through top-level
`logoUrl`, derived from `world_cup_edition_visual_identities.logo_asset_key`.

## Accepted Page Number Rule

Repository queries provide explicit ordering. Services derive each row's page number from its
zero-based position:

```text
pageNumber = firstItemPageNumber + arrayIndex

Editions order: year DESC
Teams order:    display name ASC
Current span:   one page per edition or team
```

PostgreSQL does not store an absolute page number on every edition or team. Page-span modeling is
a follow-up only and is not designed or implemented by this slice.

## Decision Register

Status meanings:

```text
Accepted   Explicitly confirmed for this slice
Proposed   Recommended but still awaiting explicit acceptance
Open       A choice is required before implementation
Deferred   Explicitly outside this slice
Ignored    Not relevant and requires no follow-up
Follow-up  Valid later work tracked outside this slice
```

| ID | Status | Decision |
| --- | --- | --- |
| N1 | Accepted | Keep all three endpoints under `/api/almanac`. |
| N2 | Accepted | Keep Contents lightweight and section-only. |
| N3 | Accepted | Fetch Editions independently for the Editions index. |
| N4 | Accepted | Fetch Teams independently for the Teams index through `GET /api/almanac/teams`. |
| N5 | Accepted | Do not nest edition or team rows inside Contents. |
| N6 | Accepted | Preserve no compatibility with the provisional `/api/almanac/world-cups` contract. |
| N7 | Accepted | Derive page numbers from explicit ordering and the current one-page-per-item rule. Do not store absolute page numbers on edition or team records. |
| N8 | Accepted | Build each response path from existing record values, such as `/editions/2022` from year `2022` or `/teams/bra` from code `bra`, instead of storing the full path in PostgreSQL. |
| N9 | Superseded | The former host-country `host.flagUrl` contract was replaced on 2026-07-28 by top-level edition `logoUrl`, derived from `world_cup_edition_visual_identities.logo_asset_key`. |
| N10 | Accepted | Treat reusable national teams and edition-specific squads as separate domains. This slice implements Teams only and does not model rosters or players. |
| N11 | Accepted | Define Contents labels, paths, and order as backend configuration in the Contents service. Derive the Teams index page from the edition count. Do not create a Contents table, repository, or migration. |
| N12 | Follow-up | Revisit page-span-aware calculation only when an accepted screen requires an edition or team to occupy multiple pages. |
| N13 | Accepted | Return `flagUrl` for each Teams index row by combining `ASSET_BASE_URL` with nullable `national_teams.flag_asset_key`. |
| N14 | Accepted | Return `200` with an empty array when Editions or Teams has no rows. Contents still returns its three configured sections and places Teams on page `4` when there are no editions. Return `500` for a database failure instead of disguising it as an empty result. |

## Accepted Contents Contract

```json
{
  "contents": [
    {
      "label": "About the tournament",
      "path": "/about",
      "pageNumber": 3
    },
    {
      "label": "Editions",
      "path": "/editions",
      "pageNumber": 3
    },
    {
      "label": "Teams",
      "path": "/teams",
      "pageNumber": 6
    }
  ]
}
```

The first two sections share page `3` in the accepted current layout. The Teams index starts after
the edition detail pages, so its page number is `4 + editionCount`. Contents always returns these
three configured sections and does not include edition or team rows.

## Accepted Empty-Result Behavior

```text
no editions
  -> 200 { "editions": [] }
  -> Contents still returns three sections
  -> Teams index page is 4

no teams
  -> 200 { "teams": [] }

database failure
  -> 500 error response
  -> never return a fake empty array
```

## Accepted Editions Index Contract

```json
{
  "editions": [
    {
      "id": "uuid",
      "year": 2022,
      "host": {
        "displayName": "Qatar",
        "flagUrl": null
      },
      "path": "/editions/2022",
      "pageNumber": 4
    }
  ]
}
```

Editions are ordered by `year DESC`. `pageNumber` is derived from that order and the accepted first
edition page. `host.flagUrl` remains nullable while the host flag asset key is absent.

## Accepted Teams Index Contract

```json
{
  "teams": [
    {
      "id": "uuid",
      "code": "BRA",
      "displayName": "Brazil",
      "path": "/teams/bra",
      "pageNumber": 8,
      "flagUrl": null
    }
  ]
}
```

`pageNumber` depends on the accepted ordering and the number of edition pages that precede the
Teams index. `flagUrl` remains nullable while the asset set is incomplete.

### Local Proof: 2026-07-12

A real request to `GET http://localhost:3000/api/almanac/contents` returned `200` with the accepted
fixed order and derived page numbers: About page `3`, Editions page `3`, and Teams page `6`. The
response contained no edition or team rows.

The historical local proof returned nullable `host.flagUrl` values. That response was superseded
on 2026-07-28: migration `0011_almanac_edition_index_logo` removes `host_flag_asset_key`, and the
Editions index now returns top-level `logoUrl`. The removed `/api/almanac/world-cups` route remains
unsupported.

Migration `0003_almanac_national_teams` created the accepted six-column table. Running the
idempotent seed twice left exactly two rows: Argentina and Brazil. A real request to
`GET http://localhost:3000/api/almanac/teams` returned `200` with alphabetical rows, derived paths,
and derived page numbers `7` and `8` while the two seeded editions precede the Teams index.

## Scope

This slice may change:

```text
the Almanac schema document;
the Editions index contract and route;
the future Contents domain;
the Teams domain;
Drizzle schema and migrations after schema acceptance;
small explicit seed data required to verify the three index screens.
```

## Non-Goals

Do not add during this slice:

```text
edition detail responses;
edition-specific squad and player responses;
players, appearances, goals, or matches;
a combined Almanac bootstrap endpoint;
frontend prefetching or caching;
backward-compatible route or response aliases;
legacy schema reuse;
staging or production infrastructure;
unrelated asset delivery changes;
page-span schema or calculation.
```

## Checklist

### 1. Lock Contracts

- [x] Accept the three independent endpoint boundaries.
- [x] Reject nested Editions and Teams data in Contents.
- [x] Accept the exact Contents response fields.
- [x] Accept the exact Editions index response fields.
- [x] Accept the exact Teams index response fields.
- [x] Define ordering and empty-result behavior for all three endpoints.

### 2. Lock The Real Schema

- [x] Decide page-number ownership and representation.
- [x] Decide Contents persistence.
- [x] Confirm which Editions values are stored and which are derived.
- [x] Separate reusable Teams identity from future edition-specific Squads.
- [x] Create `docs/almanac-schema.md` containing only accepted schema decisions.
- [x] Review the accepted `national_teams` schema before changing Drizzle.

### 3. Implement After Acceptance

- [x] Add the accepted `national_teams` Teams-domain schema.
- [x] Generate and review migration `0003_almanac_national_teams`.
- [x] Extend the explicit idempotent Almanac seed with minimal national teams.
- [x] Implement `/api/almanac/teams` through routes, service, and repository boundaries.
- [x] Derive Teams paths, page numbers, and public flag URLs in the service.
- [x] Implement the accepted Contents contract without persistence.
- [x] Implement the accepted Editions index contract.
- [x] Remove the provisional route and response fields replaced by the accepted Editions contract.

### 4. Verify

- [x] Run `pnpm typecheck`.
- [x] Run `pnpm build`.
- [x] Run `pnpm db:check` for migration `0003`.
- [x] Apply migration `0003` locally.
- [x] Verify the Teams endpoint independently against local PostgreSQL.
- [x] Confirm Editions does not query Teams rows and Teams reads only a lightweight edition count for its page offset.
- [x] Verify the final Editions endpoint independently against local PostgreSQL.
- [x] Verify Contents independently against local PostgreSQL.
- [ ] Deploy through the accepted manual demo workflow.
- [ ] Record the deployed result.

## Done Criteria

The slice is complete when:

- [x] all N-series decisions are resolved;
- [x] `docs/almanac-schema.md` contains the accepted schema;
- [x] the Drizzle implementation matches that document;
- [x] all three independent endpoints return their accepted lightweight contracts;
- [x] no endpoint fetches unrelated screen data;
- [ ] local and demo verification are recorded.

## Next Step

Run the existing **Deploy Cloudflare Demo** workflow manually:

```text
branch: main
seed: false

workflow order:
  validate -> migrate -> deploy

manual verification:
  GET /api/almanac/contents
  GET /api/almanac/editions
  GET /api/almanac/teams
```
