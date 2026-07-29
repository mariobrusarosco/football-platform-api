# Almanac Public Assets

## Current API Contract Notice

The current Editions index route is `GET /api/almanac/editions`. On 2026-07-28, its top-level
`logoUrl` contract was restored for the edition logos stored in
`world_cup_edition_visual_identities.logo_asset_key`. The temporary host-country `host.flagUrl`
contract was removed, while `host.displayName` remains.

Do not restore the historical `/api/almanac/world-cups` route.

## Status

Implementation in progress. The database and API contract is implemented and verified locally.
Deployment of migration 0002 and the updated API to the demo Worker remains pending.

## Purpose

Define how the new Almanac stores, identifies, delivers, updates, and references public visual
assets without copying the legacy AWS implementation automatically.

The legacy application used:

```text
S3
  -> CloudFront
    -> full CloudFront URL stored in PostgreSQL
      -> API returned that URL
        -> frontend downloaded the asset directly from CloudFront
```

The useful behavior to preserve is direct browser delivery from the asset origin. Production CDN
caching is not a requirement for the demo slice. A provider-specific URL in the database is not a
requirement.

## Existing Product Constraints

The frontend contract notes already establish that:

```text
the backend returns stable asset references;
the frontend renders the assets;
missing assets are temporarily allowed while the visual dataset is populated;
an assets table is not required until asset metadata has a concrete use case.
```

See [Backend Contract Notes](../backend-contract-notes.md).

The implemented edition table stores:

```text
column: logo_asset_key
example: editions/2018-logo.svg
```

The initial proof API returned:

```json
{
  "logoUrl": "https://pub-ad9a25475486494b8665c0b11bd920ca.r2.dev/editions/2018-logo.svg",
  "host": {
    "displayName": "Russia"
  }
}
```

## First-Slice Goal

Prove one complete public-asset path:

```text
one trusted Almanac asset
  -> stored in the demo R2 bucket
  -> delivered through a public Cloudflare URL
  -> referenced in PostgreSQL by an object key
  -> returned by the API as an absolute asset URL
  -> loaded directly by a frontend or browser
```

The Node API must not proxy the asset bytes.

The accepted scope is public-only: every asset covered by this architecture is publicly readable.
Engineers upload trusted files manually through the Cloudflare R2 dashboard.

## Verified Evidence

### 2026-07-11: Dashboard SVG Upload Through `r2.dev`

The demo bucket `football-platform-assets-demo` exists. An engineer uploaded
`editions/2018-logo.svg` through the Cloudflare R2 dashboard and enabled the bucket's temporary
public development URL.

Two real `GET` requests to the public object URL returned the same relevant headers:

```text
HTTP/1.1 200 OK
Content-Type: image/svg+xml
Content-Length: 223586
ETag: "13f8fd8422d645a2c25d62960e0ce735"
Last-Modified: Sat, 11 Jul 2026 19:00:05 GMT
```

Neither response included:

```text
Cache-Control
CF-Cache-Status
Age
```

This proves that the manual dashboard upload produced the correct SVG content type and a publicly
readable object. It does not prove CDN caching. Cloudflare documents `r2.dev` as a non-production
endpoint without Cloudflare caching features. That limitation is accepted for this demo slice.

### 2026-07-11: Local API Contract

Migration `0002_almanac_edition_logo_asset_key` was applied to local PostgreSQL. The database stores
`editions/2018-logo.svg` without a Cloudflare hostname or leading slash.

A real request to `GET http://localhost:3000/api/almanac/world-cups` returned `200` and an absolute
top-level `logoUrl`. The 2018 URL returned `200 image/svg+xml`. The 2022 URL returned `404` because
`editions/2022-logo.svg` has not been uploaded yet. Missing assets remain allowed while the visual
dataset is populated.

## Accepted Demo Architecture

```text
Accepted operator upload path

trusted local file
  -> engineer authenticated in the Cloudflare dashboard
    -> R2 Object Storage
      -> selected bucket
        -> Upload

Application data path

PostgreSQL
  -> stores editions/2018-logo.svg
    -> Node API combines ASSET_BASE_URL and the object key
      -> API returns the r2.dev base URL plus editions/2018-logo.svg

Public delivery path

browser
  -> public r2.dev URL
    -> R2 object
```

The browser's asset request does not pass through the Node container.

## AWS To Cloudflare Mapping

| Legacy AWS responsibility              | Proposed Cloudflare responsibility          |
| -------------------------------------- | ------------------------------------------- |
| S3 object storage                      | R2                                          |
| CloudFront public delivery             | Public `r2.dev` delivery for the demo slice |
| CloudFront or edge request logic       | Cloudflare Workers, only if later required  |
| Image resizing and format optimization | Cloudflare Images, only if later required   |

The Cloudflare-managed `r2.dev` URL is intended for development, is rate-limited, and does not
provide the caching, WAF, or access-control capabilities available through a custom domain. Those
limitations are explicit and acceptable for the demo slice.

## Decision Register

Status meanings:

```text
Existing   Already established by current code or product requirements
Accepted   Explicitly confirmed for this architecture
Superseded Replaced by a later accepted decision and no longer current
Proposed   Recommended for this slice but still awaiting explicit acceptance
Open       A choice is still required
Deferred   Explicitly outside this slice
Ignored    Not relevant to this slice and requires no follow-up
Follow-up  Valid later work that is intentionally tracked outside this slice
```

| ID  | Status    | Decision                                                                                                                                                 |
| --- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Accepted  | All assets covered by this architecture are public. Browsers load them directly from a public Cloudflare URL rather than through the Node API.           |
| A2  | Accepted  | Use Cloudflare R2 as object storage.                                                                                                                     |
| A3  | Follow-up | Use one assets bucket per environment rather than one bucket shared by demo, staging, and production.                                                    |
| A4  | Accepted  | Store edition logos under `editions/<year>-logo.svg`, without a leading slash.                                                                           |
| A5  | Accepted  | Store the R2 object key in PostgreSQL, not an absolute CDN URL.                                                                                          |
| A6  | Accepted  | Configure the public origin through `ASSET_BASE_URL`. This is public configuration, not a secret.                                                        |
| A7  | Superseded | The initial top-level `logoUrl` proof was replaced by Index Navigation N9. The current Editions index returns `host.flagUrl`.                            |
| A8  | Deferred  | A custom asset domain and Cloudflare cache policy belong to a separate infrastructure decision.                                                          |
| A9  | Accepted  | Use `https://pub-ad9a25475486494b8665c0b11bd920ca.r2.dev` as the demo `ASSET_BASE_URL`.                                                                  |
| A10 | Accepted  | Keep mutable identity assets at stable keys and overwrite the bytes at the same key. The canonical URL and database reference do not change.             |
| A11 | Ignored   | Versioned asset keys are not relevant to this slice and require no design or follow-up.                                                                  |
| A12 | Accepted  | Do not introduce a generic `assets` table in this slice. Store the key on the domain record that owns the visual identity.                               |
| A13 | Accepted  | Do not give the Node API R2 write credentials or an R2 binding for public delivery.                                                                      |
| A14 | Accepted  | Engineers upload trusted files manually through the Cloudflare R2 dashboard. This slice has no frontend upload, API upload endpoint, or CI asset upload. |
| A15 | Follow-up | Defer Cloudflare Images until raster photographs need resizing, cropping, or format conversion.                                                          |
| A16 | Accepted  | Keep asset verification manual until asset rollback and failure handling are explicitly designed.                                                        |
| A17 | Accepted  | Make no Route 53, nameserver, or `mario.productions` DNS changes in this slice. The previously discussed DNS migration is cancelled.                     |

## Storage And Environment Boundaries

Proposed bucket names:

```text
football-platform-assets-demo
football-platform-assets-staging
football-platform-assets-production
```

Only the demo bucket belongs to this slice. Staging and production names document the intended
boundary; those buckets must not be created yet.

Accepted Editions object-key convention:

```text
editions/<year>-logo.<extension>
```

Examples:

```text
editions/2010-logo.svg
editions/2014-logo.svg
editions/2018-logo.svg
editions/2022-logo.svg
```

R2 object keys do not begin with `/`. Slash characters provide human-readable prefixes but do not
create physical directories.

Environment identity belongs to the bucket and public origin, not to the object key:

```text
demo database:       editions/2018-logo.svg
production database: editions/2018-logo.svg
```

The origins can differ:

```text
demo:       https://pub-ad9a25475486494b8665c0b11bd920ca.r2.dev
future:     not decided
```

## Temporary Public Origin

Accepted configuration:

```text
ASSET_BASE_URL=https://pub-ad9a25475486494b8665c0b11bd920ca.r2.dev
```

This endpoint requires no Route 53, nameserver, or custom-domain work. When a production asset
domain is designed later, only `ASSET_BASE_URL` changes. PostgreSQL object keys and API response
construction remain unchanged.

## Database Representation

Implemented edition-column change:

```text
host_asset_path
  -> logo_asset_key
```

Implemented value change:

```text
/editions/2018-logo.svg
  -> editions/2018-logo.svg
```

Migration 0002 preserves existing rows, renames the column, sets the known 2018 and 2022 edition
keys, and removes a leading slash from any other non-null value. It does not create an assets table.

Longer term, an asset reference should live on the domain entity that owns it. For example, a
country or team should own its current flag key once; editions and squads should reference that
entity rather than duplicate the same flag key across many rows.

Introduce an assets table later only if one or more concrete requirements appear:

```text
shared asset metadata;
asset lifecycle state;
multiple renditions;
licensing or attribution;
audit history;
one centrally managed asset referenced by unrelated domain owners.
```

## Historical API Contract

Response accepted for the initial asset proof and later superseded by Index Navigation N9:

```json
{
  "id": "eb719955-7586-4012-8410-85ff5d0eb0c4",
  "year": 2018,
  "name": "2018 FIFA World Cup",
  "logoUrl": "https://pub-ad9a25475486494b8665c0b11bd920ca.r2.dev/editions/2018-logo.svg",
  "host": {
    "displayName": "Russia"
  }
}
```

Accepted behavior:

```text
database key is null
  -> logoUrl is null

database key is present
  -> logoUrl is ASSET_BASE_URL plus the stored object key

object is missing from R2
  -> API still returns the intended URL
  -> browser receives 404 from the asset origin
```

The API must not perform an R2 `HEAD` request for every response. Asset availability is not part of
the editions endpoint's runtime dependency path.

The current URL builder does not validate or repair object keys. These values are trusted application
data maintained by engineers. If a malformed key is stored, the API returns the correspondingly
malformed URL so the data problem remains visible.

## Configuration Ownership

Accepted configuration name:

```text
ASSET_BASE_URL
```

This value is public configuration, not a credential.

Implemented ownership:

| Runtime                | Value source                               |
| ---------------------- | ------------------------------------------ |
| Local Node API         | `.env`                                     |
| Cloudflare demo Worker | Worker variable forwarded to the container |
| GitHub migration job   | Not required                               |

The same semantic naming rule applies:

```text
Local .env:              ASSET_BASE_URL
Cloudflare demo Worker:  ASSET_BASE_URL
```

No environment suffix is needed because environment identity belongs to the configuration scope.

## Mutable And Immutable Asset Policy

### Mutable Identity Assets

Examples:

```text
current national flag
current team badge
current player profile image
```

Use a stable key:

```text
almanac/flags/brazil.svg
```

Replacement flow:

```text
upload replacement bytes to the same R2 key
  -> R2 replaces the object at that key
    -> canonical URL remains unchanged
      -> database remains unchanged
```

R2 writes are strongly consistent: once the replacement write completes, subsequent R2 reads see
the new object globally. Do not delete first when an overwrite is available; deleting creates a
temporary interval in which the stable URL returns `404`.

The observed `r2.dev` response has no explicit `Cache-Control` header. A browser may still reuse a
locally cached response heuristically, so a hard refresh or private window may be needed while
manually verifying a replacement. This does not change the canonical URL or require a renamed key.

## Cache Policy

The accepted demo endpoint does not provide configurable Cloudflare edge caching. No cache rule,
purge workflow, browser TTL, or edge TTL is part of this slice.

When a custom domain is designed later, its cache policy must account for the stable-key replacement
decision. That separate work will define browser TTLs and exact-URL purging without changing the
database representation established here.

## Upload And Update Workflow

Accepted first-slice ownership:

```text
trusted engineer
  -> authenticated Cloudflare dashboard
    -> R2 Object Storage
      -> select the environment's bucket
        -> Upload
          -> drag and drop or select a local file
```

Cloudflare officially supports this upload path in the R2 dashboard. The first slice requires no
upload API, R2 CLI command, or CI upload credentials.

The first slice does not add:

```text
frontend uploads;
an API upload endpoint;
automatic provider downloads;
CI synchronization of an asset directory;
an admin asset-management UI.
```

The dashboard upload and inferred SVG `Content-Type` are proven. The response contains no explicit
`Cache-Control`, which is accepted for the temporary demo endpoint. Cache automation is deferred
with the custom-domain work.

## Security Boundary

Accepted access and upload boundary:

```text
public read through the asset domain;
authenticated engineer writes through the Cloudflare R2 dashboard;
no frontend, API, or CI upload path;
trusted operator-provided files only.
```

Accepted credential boundary:

```text
no write credentials in the browser;
no write credentials in PostgreSQL;
no write credentials in the Node API container.
```

SVG files can contain active content in some embedding contexts. This slice accepts only trusted
repository-owner assets and does not accept arbitrary user-uploaded SVG files.

Private assets, signed downloads, and direct browser uploads are outside the accepted architecture.
Introducing any of them later would require a new decision and security design. R2 presigned URLs
are bearer credentials and must never be stored as permanent database values.

## Failure And Recovery Behavior

```text
upload fails
  -> database remains unchanged
  -> previous object remains available

database migration fails
  -> API deployment does not run

API deployment fails
  -> R2 object may exist but is not referenced by the new API contract yet

stable-key overwrite succeeds
  -> R2 serves the replacement at the same canonical URL
  -> a browser may require a hard refresh to bypass its local cache

old object is deleted before replacement upload completes
  -> stable URL temporarily returns 404
  -> avoid delete-first replacement when overwrite is available

new database key points to a missing object
  -> API remains available
  -> asset request returns 404
  -> correct the key or upload the missing object
```

For stable-key rollback, upload the previous bytes to the same key again.

## Manual Verification

The first slice should verify manually:

```text
R2 contains the expected edition logo object key;
the public URL returns HTTP 200;
Content-Type matches the file;
the API database stores no Cloudflare hostname;
the API returns an absolute logoUrl;
the browser requests the asset domain directly;
the Node API does not proxy the asset bytes;
replacing a stable-key asset exposes new bytes without a URL or database update.
```

This manual verification is diagnostic evidence, not an automated release gate.

## Non-Goals

Do not build in this slice:

```text
private assets;
user uploads;
presigned upload or download URLs;
Cloudflare Images transformations;
video delivery;
a generic assets table;
an asset microservice;
an R2 proxy through the API container;
automatic asset ingestion;
staging or production buckets;
custom asset domains;
Route 53 or nameserver changes;
Cloudflare cache rules and purge automation;
automated post-deploy smoke tests;
automated rollback.
```

## Decision Checklist

Resolved items are implemented. Remaining proposals do not block the current local proof.

- [x] Use R2 as the demo object store.
- [x] Make no Route 53, nameserver, or custom-domain changes in this slice.
- [x] Use `football-platform-assets-demo` as the demo bucket name.
- [x] Use `ASSET_BASE_URL` as the public-origin configuration name.
- [x] Use the existing `r2.dev` public development URL as the demo `ASSET_BASE_URL`.
- [x] Store object keys rather than full CDN URLs.
- [x] Rename `host_asset_path` to `logo_asset_key` because the values identify edition logos.
- [x] Replace nested `host.assetPath` with top-level `logoUrl`, with no compatibility alias.
- [x] Use stable-key overwrite for mutable identity assets without changing their canonical URL.
- [x] Verify dashboard-uploaded SVG `Content-Type` through the temporary `r2.dev` endpoint.
- [x] Use `editions/2018-logo.svg` for the vertical proof.
- [x] Use the same public demo `ASSET_BASE_URL` for local development during this slice.

## Implementation Checklist

Only implement checklist items whose required decisions are accepted.

### 1. Cloudflare Infrastructure

- [x] Create the `football-platform-assets-demo` R2 bucket.
- [x] Enable public `r2.dev` access for the demo slice.
- [x] Record the exact demo public-origin URL.
- [ ] Document the Cloudflare dashboard role required for engineers to upload objects.

### 2. Application Configuration

- [x] Add `ASSET_BASE_URL` validation.
- [x] Forward `ASSET_BASE_URL` into the Cloudflare Container.
- [x] Add a small platform URL builder that combines the configured origin and stored object key.

### 3. Almanac Data Contract

- [x] Rename the database field to `logo_asset_key`.
- [x] Generate and review migration 0002.
- [x] Update existing local values to the accepted object keys.
- [ ] Apply migration 0002 to the demo database.
- [x] Update the seed data.
- [x] Return top-level `logoUrl` from the Editions endpoint.

### 4. Asset Proof

- [x] Upload an SVG header-probe asset manually through the R2 dashboard.
- [x] Verify its public `r2.dev` URL and response `Content-Type`.
- [x] Verify the endpoint locally.
- [ ] Deploy through the manual demo workflow.
- [ ] Verify the deployed endpoint and direct browser asset request.
- [ ] Overwrite the object at the stable key and verify the new bytes without changing its URL or PostgreSQL.

### 5. Documentation

- [x] Record the final decisions in this document.
- [x] Update the database guide with asset-key ownership.
- [ ] Add the proven upload and replacement procedure.
- [x] Record deferred transformation, private-asset, and automation work separately.

## Done Criteria

This slice is done when:

- [x] One Almanac asset is stored in the demo R2 bucket and publicly delivered through the accepted Cloudflare endpoint.
- [ ] Every asset path introduced by this slice is publicly readable; no private-asset flow exists.
- [x] PostgreSQL stores an object key and contains no Cloudflare delivery hostname.
- [x] The API returns an absolute URL that the frontend can load directly.
- [ ] Local and deployed API behavior are verified.
- [ ] Replacing a mutable asset does not require a database update.
- [x] No API request proxies asset bytes through the Node container.
- [x] The asset ownership, replacement, security, failure procedures, and temporary-origin limitations are documented from proven behavior.

## References

- [Cloudflare R2 dashboard uploads](https://developers.cloudflare.com/r2/objects/upload-objects/)
- [Cloudflare R2 public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [Cloudflare R2 consistency and caching](https://developers.cloudflare.com/r2/reference/consistency/)
- [Cloudflare R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- [Cloudflare Images overview](https://developers.cloudflare.com/images/)
- [Cloudflare Images storage choices](https://developers.cloudflare.com/images/get-started/introduction/)
