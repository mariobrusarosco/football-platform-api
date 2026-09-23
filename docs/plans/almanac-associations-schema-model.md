# Almanac Associations Schema Model

## Status

The conceptual scope and four-table boundary below are **Accepted**. The Foundation-backed tables
were implemented in `0013_almanac_editions_associations`, and the visual-identity table was
implemented in `0014_almanac_visual_identities`. The Foundation-backed seed is implemented in
`scripts/seed-almanac.ts`. Visual-identity seed data, repository persistence and API changes have
not been implemented.

## Accepted Boundary

- Football facts come from `football-plataform-foundation`.
- An association is Almanac's identity for a men's national football team participating in the
  World Cup. This model does not describe the governing organization's corporate details.
- Only fields currently produced by Foundation are included.
- Foundation's aggregated statistics are stored as imported facts for now, even when they may
  become calculable from complete match data later.
- PRD requirements and other fields that Foundation does not produce remain deferred.
- Technical database columns such as internal IDs and timestamps do not introduce football data.
- Association visual identities are an approved product-managed exception. They are authored for
  the Almanac presentation and are not scraped football facts from Foundation.

## Current Foundation Association Input

Each current association file provides:

| Foundation field | Meaning |
| --- | --- |
| `id` | Stable Foundation identifier, such as `argentina`. |
| `name` | English display name. |
| `code` | Three-letter FIFA association code. |
| `flag_url` | Optional source URL for the displayed flag. |
| `stats.appearances` | Number of World Cup appearances. |
| `stats.titles` | Number of titles. |
| `stats.title_years[]` | Edition years in which the association won the title. |
| `stats.runners_up` | Number of runner-up finishes. |
| `stats.third_place` | Number of third-place finishes. |
| `stats.fourth_place` | Number of fourth-place finishes. |
| `stats.matches_played` | Total World Cup matches played. |
| `stats.wins` | Total wins. |
| `stats.draws` | Total draws. |
| `stats.losses` | Total losses. |
| `stats.goals_for` | Total goals scored. |
| `stats.goals_against` | Total goals conceded. |
| `stats.goal_difference` | Supplied aggregate goal difference. |
| `stats.points` | Supplied aggregate points. |
| `editions[].year` | World Cup edition year. |
| `editions[].phase` | Stage or outcome reached in that edition. |
| `editions[].rank` | Final position, such as `5th` or tied `T-7th`. |

The lightweight `associations/index.json` repeats identity fields plus appearances and titles. It
is an index representation, not a separate database source.

## Accepted Tables

### `associations`

One row per Foundation association identity.

| Column | Type | Source or purpose |
| --- | --- | --- |
| `id` | `uuid` | Internal primary key. |
| `source_id` | `text` | Foundation `id`; stable import key. |
| `name` | `text` | Foundation `name`. |
| `fifa_code` | `varchar(3)` | Foundation `code`. |
| `flag_url` | `text` | Foundation `flag_url`; nullable. |
| `created_at` | `timestamptz` | Technical audit timestamp. |
| `updated_at` | `timestamptz` | Technical audit timestamp. |

Constraints:

- `source_id` is required and unique.
- `name` is required.
- `fifa_code` is required. Different historical associations may share a code, such as Yugoslavia
  and FR Yugoslavia sharing `YUG`.
- `fifa_code` contains three uppercase letters.
- No slug-format constraint is imposed on `source_id`; Foundation owns its exact identifier format.

The Foundation identifier is not replaced with a database UUID in exported JSON. Imports resolve
`source_id` to the internal `associations.id` and database foreign keys use the internal UUID.

### `association_visual_identities`

An optional one-to-one presentation identity for an association.

| Column | Type | Purpose |
| --- | --- | --- |
| `association_id` | `uuid` | Primary key and FK to `associations`; cascade on delete. |
| `badge_asset_key` | `text` | Optional provider-neutral object key for the association badge. |
| `accent_color` | `text` | Required presentation color. |
| `accent_text_color` | `text` | Required text color used over the accent color. |
| `spine_color` | `text` | Required presentation color for the association spine. |
| `created_at` | `timestamptz` | Technical audit timestamp. |
| `updated_at` | `timestamptz` | Technical audit timestamp. |

The dependent row's primary key enforces at most one visual identity per association. An
association may exist without one. `badge_asset_key` stores an object key, not a Cloudflare,
CloudFront or other provider URL. The API converts it into a public URL using the configured
`ASSET_BASE_URL`.

This product-managed badge is distinct from `associations.flag_url`. The flag URL is a nullable
source value imported from Foundation; the badge key identifies Almanac-owned presentation media.

### `association_statistics`

One current aggregate-statistics row per association.

| Column | Type | Foundation source |
| --- | --- | --- |
| `association_id` | `uuid` | Required PK and FK to `associations`. |
| `appearances` | `smallint` | `stats.appearances` |
| `titles` | `smallint` | `stats.titles` |
| `runners_up` | `smallint` | `stats.runners_up` |
| `third_place` | `smallint` | `stats.third_place` |
| `fourth_place` | `smallint` | `stats.fourth_place` |
| `matches_played` | `smallint` | `stats.matches_played` |
| `wins` | `smallint` | `stats.wins` |
| `draws` | `smallint` | `stats.draws` |
| `losses` | `smallint` | `stats.losses` |
| `goals_for` | `smallint` | `stats.goals_for` |
| `goals_against` | `smallint` | `stats.goals_against` |
| `goal_difference` | `smallint` | `stats.goal_difference` |
| `points` | `smallint` | `stats.points` |

Constraints:

- Every value except `goal_difference` is non-negative.
- `goal_difference = goals_for - goals_against`.
- Deleting an association cascades to its aggregate-statistics row.

These values are intentionally stored rather than calculated at import or request time. Foundation
currently supplies them directly, while Almanac does not yet have complete, validated match data
from which every historical total can be reproduced.

### `association_editions`

One row per association appearance in a World Cup edition.

The table is logically part of this association model but is physically declared by the existing
`participations` domain. That domain owns the relationship between an edition and an association,
and its schema-only imports follow ADR 0003.

| Column | Type | Source or purpose |
| --- | --- | --- |
| `id` | `uuid` | Internal primary key. |
| `association_id` | `uuid` | Required FK to `associations`. |
| `edition_id` | `uuid` | Required FK to `editions`, resolved from `editions[].year`. |
| `phase` | `text` | Foundation `editions[].phase`. |
| `won_title` | `boolean` | True when the edition year appears in `stats.title_years[]`. |
| `placement` | `smallint` | Numeric position parsed from Foundation `editions[].rank`. |
| `placement_is_tied` | `boolean` | True when Foundation `editions[].rank` starts with `T-`. |

Constraints:

- `(association_id, edition_id)` is unique.
- `phase` is required and remains text because World Cup stages changed across editions.
- `won_title` is required and defaults to false.
- `placement` is required and positive.
- Multiple associations may share a placement only when each source rank marks the tie. The
  importer validates this before writing; the database does not require unique placements.
- Deleting an association or edition cascades to its association-edition rows.

`stats.title_years[]` is normalized into `won_title` on the corresponding association-edition row;
it is not stored as a database array or duplicated in a separate titles table. For example,
`rank: "T-7th"` becomes `placement: 7` and `placement_is_tied: true`. The importer validates each
edition's first through fourth ranks and phases.

## Foundation-to-Database Mapping

```text
Foundation association id "argentina"
                 |
                 v
associations.source_id "argentina"
                 |
                 v
associations.id <internal UUID used by database relationships>
```

For edition history, Foundation's numeric year resolves through the unique `editions.year` value:

```text
editions[].year 2022 -> editions.id -> association_editions.edition_id
```

An import must not invent an association or edition when either stable reference cannot be
resolved.

## Implemented Seed Behavior

- The seed reads the association detail files identified by `data/associations/index.json` from
  the sibling `football-plataform-foundation` project.
- All selected JSON is loaded and validated before a database transaction begins.
- Association records upsert by unique `source_id`, including distinct historical associations
  sharing a FIFA code. Statistics upsert by `association_id`; edition history upserts by
  `(association_id, edition_id)`.
- Existing UUIDs are preserved on repeated runs, and missing source records are not deleted.
- `phase` and `rank` are loaded from each association's edition history. The seed validates the
  complete rankings and confirms exactly one first, second, third and fourth place per edition.
- Migration `0017_almanac_association_rankings` clears previously imported participation rows,
  changes the outcome columns, and maps three former placement-only source IDs to their canonical
  Foundation identities while preserving their UUIDs. The seed then repopulates the rows.
- Association-edition records whose years are absent from the authoritative editions catalog are
  excluded and reported. This keeps qualification and unsupported future-edition data outside the
  accepted Almanac scope.
- When a Foundation `title_years` value refers to a known edition but the association's edition
  array omits that year, the seed creates the unambiguous missing `Champions` row and reports the
  normalization.
- Any other unresolved edition reference or contradictory title data aborts the seed before a
  database transaction begins.

## Current and Future Sources of Truth

### Accepted Now

Foundation's `stats` object is the source of truth for persisted aggregate statistics. The API
stores and serves those values without trying to rebuild them from incomplete match records.

### Deferred

After all historical matches are available and validated, Almanac may calculate:

- matches played;
- wins, draws and losses;
- goals for and goals against;
- goal difference;
- points, with the applicable historical scoring rules defined first.

Penalty-shootout kicks do not count toward goals for or goals against.

Before any calculated value replaces an imported aggregate, the calculated and Foundation values
must be compared across every association and edition. Discrepancies must be resolved explicitly.
Only then may a later decision make calculated statistics authoritative and either remove the
stored aggregates or retain them as a derived cache.

This future transition is **Deferred** and does not authorize schema or importer changes now.

## Relationship to Nations

Associations and host nations are separate concepts. The current association JSON does not provide
an explicit nation identifier, so this model does not add or infer `nation_id`.

A future Foundation contract may provide that relationship. It must be discussed before adding the
foreign key; matching an association to a nation by name, slug or FIFA code inside the API importer
is not approved.

## Known Foundation Data-Quality Boundaries

- Foundation's `phase` names are kept as source text because historical stage names vary.
- FIFA codes do not uniquely identify historical associations. `source_id` identifies each
  association and is suitable for distinct team paths; UUIDs identify database rows.
- The database mirrors Foundation association identities. It does not silently split, merge or
  create successor relationships between them.
- Aggregate counts and edition-history rows may be checked for contradictions during a future
  importer design, but no cross-table reconciliation behavior is approved here.

## Explicitly Excluded

- Governing-body corporate names, founding dates, confederations and headquarters
- Association aliases
- Nation relationships inferred by the API
- Historical predecessor or successor relationships
- Additional locally managed association media beyond the approved badge asset key
- Player, squad and staff data
- Qualifying-tournament data
- Calculating aggregate statistics from matches now
- Schema code, migrations, imports, seeds and API behavior

## Open Decisions

- Whether to normalize historical edition phases after the current source text has been reviewed
- Whether validated calculated statistics will replace stored aggregates or be persisted as a cache
- Whether Foundation will later provide an explicit association-to-nation relationship
