# Almanac Editions Schema Model

## Status

The conceptual scope below is **Accepted**. The Foundation-backed tables were implemented in
`0013_almanac_editions_associations`, and the visual-identity table was implemented in
`0014_almanac_visual_identities`. Migration `0016_almanac_remove_nations` removes the unused nation
catalog table. Migration `0018_almanac_remove_host_nation_source_id` removes the persisted host
nation identifier and its unique index; nation identifiers remain part of import validation. The
Foundation-backed seed is implemented in `scripts/seed-almanac.ts`. The Editions repository and
HTTP endpoints read the replacement schema. Visual-identity seed data and national-team rankings are
implemented; the Editions API projects first through fourth place from those rankings.

Migration `0019_almanac_national_team_terminology` adopts `national_teams` and
`national_team_participations`. The
[National Teams Schema Model](almanac-national-teams-schema-model.md) defines the accepted
distinction between a national team, its governing association, and its participation in an edition.

## Accepted Boundary

- Football facts come from `football-plataform-foundation`.
- PRD requirements that Foundation does not yet produce remain deferred.
- New football fields may be added later through forward migrations after discussion and approval.
- Technical database columns such as internal IDs and timestamps do not introduce football data.
- Foundation identifies scraped host names against its curated nation registry. The API validates
  those identifiers during import but does not persist them or a separate nation catalog.
- Edition visual identities are an approved product-managed exception. They are authored for the
  Almanac presentation and are not scraped football facts from Foundation.
- Historical nations remain distinct. For example, West Germany is not silently merged into
  Germany.

## Current Foundation Edition Input

Every current edition file provides:

| Foundation field | Meaning |
| --- | --- |
| `id` | Edition year encoded as text. |
| `year` | Edition year as a number. |
| `host_countries[].nation_id` | Stable nation identifier resolved by Foundation. |
| `host_countries[].display_name` | Historical host name displayed for that edition. |
| `dates.start` | Complete ISO date in `YYYY-MM-DD` format. |
| `dates.end` | Complete ISO date in `YYYY-MM-DD` format. |
| `num_teams` | Participant count. |

The former `host_country` and `dates.raw` fields have been removed from Foundation and are not part
of this model.

Foundation also provides `data/nations/index.json`. Each entry contains `id`, `name` and a
`fifa_code`. The importer uses this catalog to validate `host_countries[].nation_id`; the catalog
is not copied into a database table.

Foundation also produces group standings, knockout matches, finals, third-place matches, awards,
venues, cities, attendance and shootouts. Those are scraped data, but they are not owned by the
edition tables in this document. Foundation files from `data/associations/` supply the complete
rankings; these are stored in the Participations domain's `national_team_participations` table.

## Accepted Tables

### `editions`

One row per World Cup edition.

| Column | Type | Source or purpose |
| --- | --- | --- |
| `id` | `uuid` | Internal primary key. |
| `year` | `smallint` | Foundation `year`; required and unique. |
| `start_date` | `date` | Foundation `dates.start`; nullable during incomplete ingestion. |
| `end_date` | `date` | Foundation `dates.end`; nullable during incomplete ingestion. |
| `participant_count` | `smallint` | Foundation `num_teams`; nullable during incomplete ingestion. |
| `created_at` | `timestamptz` | Technical audit timestamp. |
| `updated_at` | `timestamptz` | Technical audit timestamp. |

Constraints:

- `year >= 1930`
- `end_date >= start_date` when both dates exist
- `participant_count > 0` when present

Foundation's text `id` is not stored because it duplicates `year`. The unique year is the
idempotent import key.

### `edition_hosts`

Stores the ordered host nations displayed for an edition.

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | `uuid` | Internal primary key. |
| `edition_id` | `uuid` | Required FK to `editions`; cascade on delete. |
| `display_name` | `text` | Historical host name used for that edition. |
| `position` | `smallint` | Preserves multi-host display order. |

Constraints:

- `(edition_id, position)` is unique.
- `position > 0`.

The previous `editions.host_display_name` proposal is removed. Display text is built from ordered
`edition_hosts` rows. A separate `nations` table is intentionally omitted because the current API
does not expose nation behavior or metadata. Foundation nation identifiers are used only for
import validation; host rows persist the display name and ordered position.

### `edition_visual_identities`

An optional one-to-one presentation identity for an edition.

| Column | Type | Purpose |
| --- | --- | --- |
| `edition_id` | `uuid` | Primary key and FK to `editions`; cascade on delete. |
| `logo_asset_key` | `text` | Optional provider-neutral object key for the edition logo. |
| `trophy_asset_key` | `text` | Optional provider-neutral object key for the trophy image. |
| `accent_color` | `text` | Required presentation color. |
| `accent_text_color` | `text` | Required text color used over the accent color. |
| `spine_color` | `text` | Required presentation color for the edition spine. |
| `created_at` | `timestamptz` | Technical audit timestamp. |
| `updated_at` | `timestamptz` | Technical audit timestamp. |

The dependent row's primary key enforces at most one visual identity per edition. An edition may
exist without one. Asset columns store object keys, not Cloudflare, CloudFront or other provider
URLs. The API converts a stored key into a public URL using the configured `ASSET_BASE_URL`.

## Foundation Normalization Boundary

Foundation, not the API importer, resolves a scraped host name to a stable nation identity. Name
aliases used during that resolution remain Foundation configuration; there is no
`nation_aliases` table in the API database.

The accepted Foundation contract is:

```json
{
  "host_countries": [
    {
      "nation_id": "south-korea",
      "display_name": "South Korea"
    },
    {
      "nation_id": "japan",
      "display_name": "Japan"
    }
  ]
}
```

`host_countries[].nation_id` must resolve to an entry in `data/nations/index.json` before an
edition is written, and an edition cannot contain duplicate nation identifiers. These identifiers
are validated during import but are not persisted on `edition_hosts`.

## Implemented Seed Behavior

- The seed reads `data/nations/index.json` and the edition detail files identified by
  `data/editions/index.json` from the sibling `football-plataform-foundation` project.
- All selected JSON is loaded and validated before a database transaction begins.
- Editions upsert by `year`; edition hosts upsert by edition and ordered position. Hosts store
  display names after nation catalog and duplicate-identifier validation.
- National-team edition ranks become numeric `national_team_participations.placement` values and explicit
  tie flags. The Editions API reads ranks 1 through 4 from those records.
- Existing UUIDs are preserved on repeated runs.
- Missing source records are retained rather than treated as deletions because Foundation data is
  incremental.
- An invalid or unresolved host reference aborts the seed before any database mutation.

## Current API Contract

`GET /api/almanac/editions` returns the editions index in descending year order. Each item contains
the internal ID, year, route path, Almanac page number, public logo URL when configured, and a
display name built from the edition's ordered host rows.

`GET /api/almanac/editions/:year` returns the internal ID, year, start and end dates, participant
count, Almanac page number, host display name, optional visual identity, and previous/next edition
navigation. It also returns `placements.first`, `second`, `third` and `fourth`; each placement
contains the national team's internal ID, name and code. It does not synthesize the deferred edition
`name` field.

Public visual-identity URLs are constructed by the service from stored provider-neutral asset
keys. Repositories return persistence values and do not know the public asset origin.

## Scraped Data Owned by Later Domains

| Foundation data | Future schema owner |
| --- | --- |
| Complete final rankings | Participations — implemented in `national_team_participations`. |
| Group names and standings | Ownership to be discussed |
| Knockout rounds and match results | Matches |
| Final and third-place match | Matches |
| Teams, scores, dates, venues, cities and attendance | Matches, with a later Venues decision |
| Shootout totals and individual kicks | Matches |
| Awards | Ownership to be discussed |

No foreign keys to those future tables are approved yet.

## Deferred PRD-Only Data

Foundation does not currently produce these requirements, so they remain outside the model:

- Edition display name and introduction
- Competition-format and rules explanations
- Additional official media beyond the approved logo and trophy asset keys, including posters,
  mascots and balls
- Dedicated verified edition statistics
- Scoring leaderboards
- Edition and historical records
- Stadium inventory and historical venue enrichment
- Edition stories
- Evidence, citations and explicit missing/conflicting-data states

Each area will be discussed before it changes the model.
