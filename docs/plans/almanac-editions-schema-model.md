# Almanac Editions Schema Model

## Status

**Proposed.** This document models the Editions domain only. It does not authorize schema code,
migrations, imports, seeds or API changes.

## Accepted Inputs

- The collection requirements are defined in `docs/prds/almanac-editions-data-collection.md`.
- The product covers completed men's World Cups, in English, without qualifiers.
- `football-platform-foundation/data/editions/*.json` is an input source, not the database design.
- Partial editions are allowed, but missing information must not be represented as zero.
- Historical names must be preserved and multiple hosts and visual items must be supported.

## Recommendation

Use normalized PostgreSQL tables under the `almanac` namespace. Keep stable edition facts in the
Editions domain; do not embed the complete Foundation JSON in one column. Importers must normalize
the source data before writing it.

### `editions`

One row per completed World Cup.

| Column | Type | Rule |
| --- | --- | --- |
| `id` | `uuid` | Primary key, generated internally. |
| `year` | `smallint` | Required and unique. |
| `display_name` | `text` | Required English edition name. |
| `start_date` | `date` | Nullable while unavailable or unresolved. |
| `end_date` | `date` | Nullable while unavailable or unresolved. |
| `participant_count` | `smallint` | Nullable; positive when present. Reconciled by the importer with participations later. |
| `introduction` | `text` | Nullable publication-ready English introduction. |
| `created_at` | `timestamptz` | Required. |
| `updated_at` | `timestamptz` | Required. |

Constraints: `year >= 1930`, `end_date >= start_date` when both exist, and
`participant_count > 0` when present. Do not persist Foundation's year-string `id`; `year` is the
stable natural identifier and `id` is the internal relational identifier.

### `edition_hosts`

One row per host country, preserving the edition-era display name.

| Column | Type | Rule |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `edition_id` | `uuid` | Required FK to `editions`, cascade on delete. |
| `display_name` | `text` | Required historical English name. |
| `position` | `smallint` | Required ordering for multi-host editions. |

Unique constraints: `(edition_id, position)` and `(edition_id, display_name)`. A comma-separated
Foundation value such as `Canada, Mexico, United States` becomes three rows.

### `edition_formats`

Optional one-to-one explanation of how the competition worked.

| Column | Type |
| --- | --- |
| `edition_id` | `uuid` primary key and FK |
| `structure_summary` | `text` |
| `win_points` | `smallint`, nullable |
| `draw_points` | `smallint`, nullable |
| `ranking_rules` | `text`, nullable |
| `advancement_rules` | `text`, nullable |
| `tied_match_rules` | `text`, nullable |
| `notable_rule_differences` | `text`, nullable |

### `edition_stages`

Ordered competition stages that future match and table models can reference.

| Column | Type | Rule |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `edition_id` | `uuid` | Required FK to `editions`. |
| `name` | `text` | Historical display name, such as `Final round`. |
| `kind` | `text` | Checked value: `group`, `knockout`, `league`, `placement`, or `final`. |
| `position` | `smallint` | Required chronological ordering. |
| `description` | `text` | Nullable. |

Unique constraint: `(edition_id, position)`. Stage names are not unique because historical source
data may repeat a label for distinct phases.

### `edition_statistics`

Optional one-to-one edition totals.

| Column | Type | Rule |
| --- | --- | --- |
| `edition_id` | `uuid` | Primary key and FK. |
| `matches_played` | `smallint` | Nullable; non-negative when present. |
| `total_goals` | `smallint` | Nullable; non-negative when present. |
| `total_attendance` | `integer` | Nullable; non-negative when present. |

Goals per match and average attendance are calculated from these stored inputs. They are not stored
as independent values that can drift from their totals.

### `edition_visual_items`

One row per official emblem, poster, mascot or ball. Multiple rows of each kind are allowed.

| Column | Type |
| --- | --- |
| `id` | `uuid` primary key |
| `edition_id` | `uuid` FK |
| `kind` | checked `text`: `emblem`, `poster`, `mascot`, `ball` |
| `name` | `text`, nullable |
| `description` | `text`, nullable |
| `asset_key` | `text`, nullable |
| `caption` | `text`, nullable |
| `attribution` | `text`, nullable |
| `rights_status` | checked `text`: `known`, `unknown`, `restricted` |
| `position` | `smallint` |

### `edition_stories`

The introduction remains on `editions`; the required three-to-five longer stories use this table.

| Column | Type |
| --- | --- |
| `id` | `uuid` primary key |
| `edition_id` | `uuid` FK |
| `title` | `text` |
| `body` | `text` |
| `position` | `smallint` |

Unique constraint: `(edition_id, position)`. Story evidence remains in Foundation until a product
requirement says citations must be served by the API.

### `edition_records`

Edition highlights such as biggest win, highest-scoring match and records broken or equaled.

| Column | Type |
| --- | --- |
| `id` | `uuid` primary key |
| `edition_id` | `uuid` FK |
| `category` | checked `text`: `biggest_win`, `highest_scoring_match`, `youngest_player`, `oldest_player`, `other` |
| `scope` | checked `text`: `edition` or `world_cup_as_of_edition` |
| `achievement` | checked `text`: `edition_best`, `set`, `equaled`, `historical_note` |
| `title` | `text` |
| `description` | `text` |
| `position` | `smallint` |

This first model stores the publishable claim. Stable player, team and match links should be added
after those domains are modeled; names from scraper output must not become fake foreign keys.

### `edition_information_states`

Explicitly represents required information that is absent or disputed.

| Column | Type |
| --- | --- |
| `id` | `uuid` primary key |
| `edition_id` | `uuid` FK |
| `field_key` | `text` |
| `state` | checked `text`: `derived`, `not_applicable`, `unavailable`, `conflicting`, `pending` |
| `note` | `text` |

Unique constraint: `(edition_id, field_key)`. Found values live in their normal columns or child
tables; this table exists only when additional state or explanation is required. `pending` may be
used during incremental ingestion but cannot be present when an edition is declared complete.

## Domain Boundary

These requirements belong to later schemas and should reference `editions.id`:

| Information | Future owner |
| --- | --- |
| Participants and final standings | Participations |
| Group tables | Participations or a dedicated competition-table design |
| Matches, finals, replays and shootouts | Matches |
| Scoring leaders and player recipients | Players/Awards decision |
| Stadiums, cities and match assignments | Venues |

Foundation retains raw source values, evidence, access dates, conflicts and scraper diagnostics.
The API database stores normalized, product-ready values plus explicit user-visible gaps.

## Open Decisions

- Whether citations must be returned by the API. If yes, model sources and explicit join tables;
  do not use polymorphic foreign keys.
- Whether visual items need multiple asset files. If yes, split `edition_visual_items` from an
  `edition_visual_assets` child table.
- Which domain owns group tables. Decide this before creating the Matches or Participations schema.

## Implementation Sequence

1. Approve or revise this model.
2. Implement only `editions`, `edition_hosts`, `edition_formats`, `edition_stages`,
   `edition_statistics`, `edition_visual_items`, `edition_stories`, `edition_records`, and
   `edition_information_states` in `src/products/almanac/domains/editions/schema.ts`.
3. Generate and review a new forward migration after `0012_remove_almanac_tables`.
4. Add import validation separately; do not import the current JSON unchanged.

