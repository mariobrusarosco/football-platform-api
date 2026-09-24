# Almanac National Teams Schema Model

## Status

**Accepted** on 2026-09-23: use national-team and participation terminology throughout Almanac,
and store the governing association's display acronym as nullable text on the national team.
This supersedes the terminology in the former `almanac-associations-schema-model.md`.

The original tables were introduced by `0013_almanac_editions_associations` and
`0014_almanac_visual_identities`. Migration `0019_almanac_national_team_terminology` renames the
existing tables and foreign-key columns without replacing rows or UUIDs, and adds
`national_teams.association_acronym`. Historical migration filenames and snapshots retain the
names that were valid when they were written.

Schemas, imports, seeds, and edition-placement reads use the accepted names. The national-team
HTTP repository is still a placeholder: `/api/almanac/teams` returns an empty list and team detail
returns not-found until database reads are implemented. The detail response type and service
mapping include nullable `associationAcronym`; this does not by itself enable those reads.

## Accepted Vocabulary And Ownership

| Term | Meaning | Example | Owner |
| --- | --- | --- | --- |
| National team | Sporting identity across editions; current scope is men's World Cup teams. | Brazil | `national-teams/` |
| Association | Governing organization; currently represented only by its display acronym. | CBF | Field on the national team |
| Participation | One national team's appearance in one World Cup edition, including its outcome. | Brazil in 2002 | `participations/` |
| Edition | One World Cup tournament. | 2002 | `editions/` |
| Host nation | Host displayed for an edition; separate from a participating national team. | Japan | `editions/` |

`fifa_code` (for example `BRA`) and `association_acronym` (for example `CBF`) are separate fields.
Neither is the internal database identity. There is no governing-associations table or domain.
A participation is not a squad: roster data is outside this model.

| Domain | Owned tables |
| --- | --- |
| `national-teams` | `national_teams`, `national_team_statistics`, `national_team_visual_identities` |
| `participations` | `national_team_participations` |

HTTP and frontend paths remain `/api/almanac/teams` and `/teams`; short public paths do not change
the domain vocabulary. The standard router → routes → service → repository flow is unchanged.

## Accepted Source Boundary

- Football facts come from `football-plataform-foundation`, except the approved manual acronym
  entry described below and product-managed visual identities.
- Foundation currently calls its team collection `data/associations/`. That external path and the
  input-contract names `FoundationAssociationSource` / `foundationAssociationSourceSchema` remain
  unchanged. The importer maps those records to national teams; application records, tables,
  relationships, and seed functions use national-team terminology.
- Historical teams remain distinct, including teams sharing a FIFA code. Importing does not
  silently merge identities or invent predecessor/successor relationships.
- Foundation's aggregate statistics remain imported facts until complete match data supports a
  separately approved calculation strategy.
- Fields not supplied by Foundation remain deferred except explicitly approved local metadata.

## Foundation Input

The seed reads detail files listed in `data/associations/index.json` from the sibling Foundation
project. The index is a catalog, not another database source.

| Input field | Meaning or mapping |
| --- | --- |
| `id` | Stable external identity, such as `brazil`; stored as `source_id`. |
| `name` | National-team display name. |
| `code` | Three-letter FIFA code; stored as `fifa_code`. |
| `flag_url` | Optional source flag URL. |
| `association_acronym` | Optional nullable acronym string accepted by the importer; existing source files need not provide it. |
| `stats.appearances` | World Cup appearances. |
| `stats.titles` | World Cup titles. |
| `stats.title_years[]` | Edition years won; represented through participation `won_title`. |
| `stats.runners_up`, `stats.third_place`, `stats.fourth_place` | Finish counts. |
| `stats.matches_played`, `stats.wins`, `stats.draws`, `stats.losses` | Match aggregates. |
| `stats.goals_for`, `stats.goals_against`, `stats.goal_difference`, `stats.points` | Goal and point aggregates. |
| `editions[].year` | Edition resolved through unique `editions.year`. |
| `editions[].phase` | Historical stage or outcome, retained as source text. |
| `editions[].rank` | Final position, including tied values such as `T-7th`. |

The optional acronym input is supported by this API; implementing its scraper in Foundation is
separate work. No Foundation files are renamed or populated by this change.

## Accepted Tables

### `national_teams`

One row per current or historical national-team identity supplied by Foundation.

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | `uuid` | Internal primary key; used by database relationships. |
| `source_id` | `text` | Required unique Foundation identity; import key. |
| `name` | `text` | Required display name. |
| `fifa_code` | `varchar(3)` | Required three-uppercase-letter FIFA code. |
| `association_acronym` | `text` | Nullable display-only governing-body acronym. |
| `flag_url` | `text` | Nullable source flag URL. |
| `created_at`, `updated_at` | `timestamptz` | Technical audit timestamps. |

FIFA codes are not unique: distinct historical teams may share a code, such as Yugoslavia and
FR Yugoslavia sharing `YUG`. `source_id` has no slug-format database constraint; Foundation owns
its format. Imports resolve it to the internal UUID rather than replacing Foundation IDs in JSON.

### `national_team_visual_identities`

Optional one-to-one product-managed presentation metadata.

| Column | Type | Purpose |
| --- | --- | --- |
| `national_team_id` | `uuid` | PK and FK to `national_teams`; cascade on delete. |
| `badge_asset_key` | `text` | Nullable provider-neutral key for Almanac's badge asset. |
| `accent_color`, `accent_text_color`, `spine_color` | `text` | Required presentation colors. |
| `created_at`, `updated_at` | `timestamptz` | Technical audit timestamps. |

A team may exist without a visual identity. A badge key is distinct from the source `flag_url`.
The service constructs public URLs for stored asset keys using `ASSET_BASE_URL`.

### `national_team_statistics`

One current World Cup aggregate-statistics row per national team.

`national_team_id` is its primary key and a foreign key to `national_teams`, with cascade deletion.
All aggregate columns are required `smallint` values:

- `appearances`, `titles`, `runners_up`, `third_place`, `fourth_place`;
- `matches_played`, `wins`, `draws`, `losses`;
- `goals_for`, `goals_against`, `goal_difference`, `points`.

Every value except `goal_difference` must be non-negative.
`goal_difference = goals_for - goals_against`. The importer stores Foundation's totals directly.

### `national_team_participations`

One row per national team in one edition. The `participations` domain owns this table and imports
only schema declarations for its foreign keys, as allowed by ADR 0003.

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | `uuid` | Internal primary key. |
| `national_team_id` | `uuid` | Required FK to `national_teams`. |
| `edition_id` | `uuid` | Required FK to `editions`. |
| `phase` | `text` | Required historical stage or outcome. |
| `won_title` | `boolean` | Required; defaults to false; derived from `stats.title_years[]`. |
| `placement` | `smallint` | Required positive numeric final rank. |
| `placement_is_tied` | `boolean` | Required; defaults to false; true for source ranks prefixed `T-`. |

The pair `(national_team_id, edition_id)` is unique. Deleting either parent cascades to the
participation. Multiple teams may share a placement only when the source explicitly marks a tie;
the importer validates this, rather than applying a unique-placement database constraint.
For example, `T-7th` maps to `placement: 7, placement_is_tied: true`.
Title years are not duplicated in a database array or separate titles table.

## Association Acronym: Manual Entry And Import Behavior

**Accepted:** the acronym is a simple nullable string for display. It has no uniqueness constraint,
foreign key, fixed length, or FIFA-code validation. Null means unknown; do not substitute the team
name or FIFA code. This field does not model historical governing-body changes by edition.

Manual entry is supported through a database editor or SQL. For example, after checking the target
environment, an operator can set Brazil's acronym with:

```sql
UPDATE almanac.national_teams
SET association_acronym = 'CBF', updated_at = now()
WHERE source_id = 'brazil';
```

This example is documentation, not an automatic backfill. Migration 0019 leaves existing rows null.

The seed uses the following rules:

1. A non-null Foundation `association_acronym` is trimmed, must be non-empty, and replaces the
   stored acronym. Foundation becomes authoritative when it supplies a value.
2. An omitted or null source acronym preserves the existing value, including manual entries.
3. A new team without a source acronym starts with null. An operator may explicitly clear a stored
   value to null; the next non-null source value will populate it again.

There is no admin endpoint or manual-override system in this scope.

## Implemented Import Behavior

- Load and validate selected source JSON before starting the database transaction.
- Upsert national teams by `source_id`, preserving UUIDs; upsert statistics and visual identities by
  `national_team_id`; upsert participations by `(national_team_id, edition_id)`.
- Keep missing source records rather than treating incremental data as deletion requests.
- Resolve edition years through `editions.year`; do not invent missing teams or editions.
- Exclude and report participation records outside the authoritative editions catalog, including
  qualification and unsupported future-edition entries.
- Derive and report an omitted `Champions` participation when a title year names a known edition.
- Validate title counts, title years, ranks, tied placements, participant counts, and exactly one
  first-, second-, third-, and fourth-place finish with the corresponding phase per edition.
- Reject other unresolved references and contradictory data before writes begin.

Migration `0017_almanac_association_rankings` previously replaced participation outcomes and
normalized three source identities. Migration 0019 only renames that resulting model and adds the
nullable acronym; it does not repeat that data replacement.

## Deferred And Open Decisions

**Deferred:** calculate statistics from complete, validated matches. Before replacing imported
facts, compare every team and edition with Foundation and resolve differences. Shootout kicks must
not count as goals; historical point rules require an explicit decision.

**Deferred:** governing-body full names, histories, founding dates, confederations, headquarters,
aliases, a separate association entity, player/squad/staff data, qualifying tournaments, and further
product-managed media.

**Open:** normalization of historical phase labels; future calculation versus cached aggregates;
and whether Foundation will provide an explicit national-team-to-nation relationship.

National teams and host nations remain separate. The importer must not infer a nation relationship
from a name, source ID, or FIFA code.
