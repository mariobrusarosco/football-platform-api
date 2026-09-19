# SofaScore access experiment — 9 September 2026

## Outcome

**Observed:** this local experiment retrieved SofaScore JSON using `curl_cffi` with Chrome
impersonation and captured JSON using a visible, installed Chrome controlled by Playwright.
Plain Python HTTP requests returned `403 Forbidden`.

The direct HTTP follow-up retrieved 12 Champions League fixtures and one corresponding match
detail. This is evidence of successful access in this execution environment, not evidence of a
reliable production collector, correct coverage of every competition, or successful access from
the user's previously failing hosted environment.

**Recommendation:** investigate the lightweight `curl_cffi` path first in the actual intended
runtime. Keep browser response capture as a comparison. The experiment does not justify adopting
Camoufox, purchasing proxies, or changing the application stack.

## Scope and decision status

| Status | Item |
| --- | --- |
| Accepted scope | Document the completed access experiment, retain evidence, and provide reproduction instructions. |
| Observed result | Successful local JSON retrieval with two methods; plain HTTP failed. |
| Proposed | Evaluate `curl_cffi` on the intended execution host using bounded requests. |
| Open | Whether results remain reproducible across fresh processes, time, browser restarts, and hosting networks. |
| Open | Data correctness, fixture coverage, score semantics, and update freshness. |
| Deferred | Production ingestion, deployment, scheduling, database integration, scoring integration, proxies, and automated challenge handling. |

No new application architecture or provider dependency is accepted by this report. Nothing under
`src/`, database schemas, migrations, or the root package configuration was changed for this work.

## Question being tested

Can the public SofaScore website's data be retrieved from this execution environment without a
paid scraping service or an explicitly configured proxy?

The user's existing evidence was that normal Chrome rendered the site, while previous Playwright
attempts on a Node server or hosted environment returned 403. Those earlier deployments were not
available as controlled test targets in this experiment. Their configuration and logs were not
inspected, and their failures were not reproduced here.

This is an exploratory integration experiment, not a unit-test suite or a controlled benchmark.
“Pass” below means that a narrow observable condition was met. It does not mean a production
acceptance criterion was satisfied.

## Environment and provenance

| Property | Recorded information |
| --- | --- |
| Experiment date | 2026-09-09 |
| Local timezone | America/Sao_Paulo |
| Artifact modification times | Approximately 19:03–19:04 local time; not request-level timestamps |
| Host | Local macOS desktop execution environment |
| OS / architecture | macOS 26.6.2 / arm64, inspected during documentation |
| Probe interpreter | Python 3.12.12 in an isolated temporary virtual environment |
| Plain baseline interpreter | System `python3`; exact version was not recorded during the baseline |
| `curl_cffi` | 0.16.3 |
| Playwright | 1.62.0 |
| Installed Chrome | 152.0.7977.76, inspected during documentation; not captured by the original run |
| Browser mode | `channel='chrome'`, `headless=False` |
| Browser context | Fresh context; no imported profile, cookies, login, or storage state |
| HTTP impersonation | `impersonate='chrome'`; resolved browser fingerprint was not recorded |
| Proxy configuration | No proxy explicitly configured or purchased by the experiment |
| Actual network route | Public exit IP, ASN, VPN state, inherited proxy environment, and intermediate network behavior were not recorded |
| Application involvement | None; probes ran outside the API application |

Do not describe the network as a verified residential connection. Do not assume a local result
represents a cloud-hosted result. “No paid proxy” describes the experiment's configuration, not a
complete audit of the network path.

The initial sandboxed baseline failed DNS resolution. That was an execution-environment failure,
not a SofaScore response. The baseline was then rerun with network-capable execution and returned
actual 403 responses. Subsequent HTTP and browser tests also used network-capable execution.

## Completed test matrix

| ID | Test | Requests / runs | Observed result | Assessment |
| --- | --- | --- | --- | --- |
| T00 | Plain HTTP inside restricted execution | 3 attempted requests | DNS resolution errors | Inconclusive for SofaScore access |
| T01 | Plain HTTP with network access | 3 requests | All 403, JSON `Forbidden` errors | Retrieval failed |
| T02 | Chrome-impersonated HTTP without custom header | 1 request | 200, seasons JSON prefix | Access passed; full response not archived |
| T03 | Same client with `X-Requested-With: XMLHttpRequest` | 1 request | 200, seasons JSON prefix | Access passed; header necessity not supported |
| T04 | Visible Chrome / Playwright passive capture | 1 navigation and 12-second observation | Homepage 200; fixture responses captured | Browser capture passed |
| T05 | Direct HTTP Champions League schedule | 1 request | 200, 12 events | Access and saved payload checks passed |
| T06 | Direct HTTP detail for first returned event | 1 request | 200, matching event ID | Access and ID consistency passed |

The controlled direct-request total after the failed DNS attempt was seven requests: three plain,
two season probes, one schedule, and one detail. Browser navigation generated its own additional
requests. Do not interpret one page navigation as one HTTP request.

## T01 — plain HTTP baseline

### Procedure

Use Python's `urllib.request.urlopen`, without custom headers, and a 15-second timeout against:

1. `https://www.sofascore.com/`
2. `https://www.sofascore.com/api/v1/unique-tournament/17/seasons`
3. `https://api.sofascore.com/api/v1/unique-tournament/17/seasons`

Read at most the first 180 bytes of an HTTP error response in the network-capable run.

### Observed

All three returned HTTP 403 with this body prefix:

```json
{"error": {"code": 403, "reason": "Forbidden" }}
```

These results were printed in the original execution output; no standalone baseline output file
was retained. The report records that evidence gap explicitly. A 403 alone does not identify TLS
fingerprinting, IP reputation, missing headers, or any specific anti-bot vendor as the cause.

## T02 and T03 — HTTP browser impersonation

### Procedure

Call the `www.sofascore.com` seasons endpoint using `curl_cffi.requests.get`,
`impersonate='chrome'`, and a 20-second timeout. Run once with an empty custom-header dictionary
and once with `X-Requested-With: XMLHttpRequest`.

No browser was launched until after these requests. No browser cookies were supplied to them.
Each call used the top-level `requests.get` helper rather than an explicitly shared session.

### Observed

Both requests returned 200. The retained 250-character prefixes include:

| Returned season name | Provider season ID |
| --- | --- |
| Premier League 26/27 | 96668 |
| Premier League 25/26 | 76986 |
| Premier League 24/25 | 61627 |

Evidence: the `http` array in [report.json](evidence/report.json).

### Interpretation and limits

- The custom `X-Requested-With` header was not necessary for this successful request in this run.
- Switching clients changed more than one variable: TLS/HTTP behavior and default headers can
  differ. This was not a TLS-only A/B test.
- The baseline used a different Python executable. That is another uncontrolled difference.
- The full seasons response was not saved or parsed by the original probe. The retained prefix
  supports access and these example values, not completeness of the season list.
- The `api.sofascore.com` hostname was not tested with `curl_cffi` in this experiment.
- The generic `chrome` alias is library-version dependent; it should not be equated with the
  installed Chrome version.

## T04 — capture responses generated by the website

### Procedure

1. Launch installed Chrome with Playwright in visible mode.
2. Create a fresh browser context and a new page.
3. Attach `page.on('response', ...)` before navigating.
4. Navigate to the homepage, waiting for `domcontentloaded`, with a 30-second timeout.
5. Observe responses for a further 12 seconds.
6. For matching response URLs, retain URL, status, and JSON top-level keys when parsing succeeds.
7. When a JSON object contains `events`, record its count and save that payload.
8. Capture the page title, a short visible-text excerpt, and a screenshot; close the browser.

The probe did not navigate directly to an API URL or issue `page.evaluate(fetch(...))`. It observed
requests initiated by the website. It did not use Camoufox, Patchright, stealth plugins, cookie
imports, or a logged-in user profile.

### Observed

The saved report contains 270 matching response records: 266 with status 200 and four with status
404. Of these records, 53 include parsed JSON key/type information. Many other records are images;
the original URL filter was broad enough to include `img.sofascore.com/api/v1/...`.

These are counts from the filtered report, not a full browser network log, unique endpoint count,
or success rate for football data. The 404 responses included optional configuration or
player-of-the-season resources and did not prevent fixture capture.

Examples of captured schedule responses:

| Unique tournament ID | Date in request | Events recorded |
| --- | --- | --- |
| 7 | 2026-09-09 | 12 |
| 19 | 2026-09-09 | 28 |
| 36 | 2026-09-09 | 2 |
| 2132 | 2026-09-09 | 15 |

These requests used the pattern:

```text
https://www.sofascore.com/api/v1/unique-tournament/{id}/scheduled-events/2026-09-09
```

### Important artifact limitation

The original handler wrote every events payload to the same `captured-events.json` path. Each
new payload overwrote the previous one. The surviving file contains 15 events from the final
saved payload, not all browser-captured matches. Counts for earlier responses survive in the
report, but their bodies do not.

Consequently, the separately saved Champions League file came from T05's direct HTTP request.
It must not be described as the archived body of the browser's Champions League response.

## T05 — direct fixture retrieval

### Procedure

Use a new Python process and `curl_cffi` with `impersonate='chrome'`, no custom headers, and a
20-second timeout:

```text
GET https://www.sofascore.com/api/v1/unique-tournament/7/scheduled-events/2026-09-09
```

Parse the JSON and save the full parsed object to
[champions-league-fixtures.json](evidence/champions-league-fixtures.json).

### Observed

The request returned 200 with 12 events. Offline inspection of the saved payload found all 12
events associated with unique tournament ID 7 and season ID 96518.

Examples from the provider response:

| Event ID | Home team | Away team | Reported score | Reported status |
| --- | --- | --- | --- | --- |
| 16939050 | AEK Athens | LASK | 1–0 | finished / Ended |
| 16938841 | Club Brugge KV | Aston Villa | 2–3 | finished / Ended |
| 16938848 | Borussia Dortmund | Villarreal | 3–2 | finished / Ended |
| 16938854 | FC Porto | Manchester City | 0–2 | finished / Ended |
| 16938991 | Lille | Real Betis | 2–3 | finished / Ended |

These are **provider-returned values**, not independently verified football facts. The experiment
did not reconcile the calendar or scores with another source, an official competition schedule,
or a complete manual comparison against the website.

The JSON includes event IDs, team objects, start timestamps, status objects, score objects,
tournament information, and season information. Presence alone does not establish production
semantics. In particular, `current`, `display`, `normaltime`, extra time, and penalties require
explicit interpretation before implementing prediction scoring.

## T06 — corresponding match detail

Take the first event ID from T05's response and request:

```text
GET https://www.sofascore.com/api/v1/event/16939050
```

Use the same `curl_cffi` options and save parsed JSON to
[match-detail.json](evidence/match-detail.json).

Observed: HTTP 200, with `event.id == 16939050`. The object includes teams, scores, status,
tournament, season, round information, venue, referee, and timing fields.

Only the ID equality was explicitly checked during the live run. No assertion was made that all
detail fields matched the schedule or that every fixture's detail could be retrieved.

## Reproducing the experiment

The historical results above remain immutable evidence. New runs should use a separate output
directory and record their own date, versions, host, mode, and results.

This is standalone research tooling, not an addition to the application's pnpm dependencies.
The following commands assume `python3` and `uv` are available. They create an isolated environment
under a new temporary directory. Do not install these packages into the application runtime.

```sh
SOFA_PROBE_DIR=$(mktemp -d /tmp/sofascore-repro.XXXXXX)
uv --cache-dir "$SOFA_PROBE_DIR/cache" venv "$SOFA_PROBE_DIR/venv" --python 3.12
uv --cache-dir "$SOFA_PROBE_DIR/cache" pip install \
  --python "$SOFA_PROBE_DIR/venv/bin/python" \
  'curl_cffi==0.16.3' 'playwright==1.62.0'
```

The dependencies are pinned to the observed versions, but that is not complete reproducibility:
Chrome can update independently, network conditions can change, and SofaScore can change its
responses or access checks.

### Historical browser/season probe

[original-probe.py](evidence/original-probe.py) is the exact original script. It is retained for
audit, not silently corrected. It contains an absolute temporary output path, a broad URL filter,
and the overwrite behavior described above.

To rerun it without overwriting the historical temporary files, copy it to the new temporary
directory and change only its `root = Path(...)` assignment to:

```python
root = Path(__file__).resolve().parent
```

Then run the copied script with the virtual environment's Python. Installed Google Chrome is
required because the script uses `channel='chrome'`. It opens a separate visible window and
closes it when finished. It does not use the user's existing Chrome profile.

This exact probe has no assertions and does not provide a dependable pass/fail exit code. Inspect
the generated report. It can also fail before saving a report if browser launch itself fails.
For a future maintained harness, improve these behaviors before using it in automation.

### Direct fixture/detail follow-up

Save this as `fixtures.py` in the new temporary directory and run it with that environment's
Python. It reproduces the request sequence from T05–T06 while adding explicit response/schema/ID
assertions. **This documented assertion variant was not the script executed in the historical
run.** The original run printed the status and ID check and saved the same two payload types.

```python
import json
from pathlib import Path
from curl_cffi import requests

output = Path(__file__).resolve().parent
base = 'https://www.sofascore.com/api/v1'
schedule_url = f'{base}/unique-tournament/7/scheduled-events/2026-09-09'

response = requests.get(schedule_url, impersonate='chrome', timeout=20)
print('schedule status:', response.status_code)
response.raise_for_status()
schedule = response.json()
(output / 'champions-league-fixtures.json').write_text(
    json.dumps(schedule, indent=2), encoding='utf-8'
)
events = schedule.get('events')
assert isinstance(events, list) and events, 'No usable events list'
assert all(
    event['tournament']['uniqueTournament']['id'] == 7
    for event in events
), 'Unexpected tournament in response'

event_id = events[0]['id']
response = requests.get(
    f'{base}/event/{event_id}', impersonate='chrome', timeout=20
)
print('detail status:', response.status_code)
response.raise_for_status()
detail = response.json()
(output / 'match-detail.json').write_text(
    json.dumps(detail, indent=2), encoding='utf-8'
)
assert detail['event']['id'] == event_id, 'Mismatched event detail'
print('events:', len(events), 'matching detail ID:', event_id)
```

This issues two requests if the schedule succeeds, with no retry loop. An error should remain an
error; do not interpret an unsuccessful response as an empty schedule. The fixed date reproduces
the historical endpoint. Testing another date is a different coverage test, and an empty date
may be legitimate. Do not use “exactly 12 events” as a permanent live assertion.

## Follow-up test plan — proposed, not run

| ID | Question and procedure | Evidence to retain / acceptance condition |
| --- | --- | --- |
| F01 | Repeat the same HTTP sequence in fresh processes at separated times. | Timestamp, client version, statuses, payloads; distinguish repeatable access from one successful window. |
| F02 | Run the same pinned HTTP probe on the intended host. | Host and network configuration, statuses, response types; do not attribute failure to language. |
| F03 | Compare the same browser/version/context settings locally and on the target host. | Run configuration and response capture; vary one factor where feasible. |
| F04 | Compare visible and headless browser modes on the same host. | Whether required fixture JSON loads in each mode; browser launch alone is insufficient. |
| F05 | Capture a tournament across multiple rounds/date ranges. | Requested coverage, deduplicated IDs, provider pagination; demonstrate that the initial page is not mistaken for the full tournament. |
| F06 | Check a known completed match and an upcoming match against an independent reference. | Provenance, teams, kickoff/timezone, finality, and score agreement. |
| F07 | Inspect postponed, cancelled, abandoned, extra-time, and penalty-decided fixtures. | Explicit field interpretation; distinguish missing scores from zero and regulation time from shootout totals. |
| F08 | Observe schedule/result freshness around a real match using a modest planned cadence. | Observation timestamps, provider state changes, and delay; no claim of a freshness guarantee from one sample. |
| F09 | Exercise failure handling offline with saved 403/429/invalid-JSON/empty-list examples. | Failures remain distinguishable from valid empty data; honor server retry instructions if present. Do not deliberately generate rate limits. |
| F10 | Test corrected provider results and duplicate retrievals in a future ingestion slice. | No duplicate matches; auditable correction behavior. Scoring and database implementation remain outside this report. |

Before accepting an unattended collector, the required competitions, tolerated result delay,
hosting location, and operating window must be defined. A successful HTTP status is only the first
acceptance criterion.

## Evidence inventory and audit limitations

| File | Meaning |
| --- | --- |
| [report.json](evidence/report.json) | Original season status/prefix records, filtered browser response metadata, and visible-text excerpt. |
| [champions-league-fixtures.json](evidence/champions-league-fixtures.json) | Full parsed JSON saved by the direct HTTP fixture follow-up. |
| [match-detail.json](evidence/match-detail.json) | Full parsed JSON saved by the direct HTTP match follow-up. |
| [captured-events.json](evidence/captured-events.json) | Last events payload retained by the original browser probe; earlier payloads were overwritten. |
| [original-probe.py](evidence/original-probe.py) | Unmodified original browser/season experiment script. |
| [manifest.json](evidence/manifest.json) | SHA-256 hashes and byte sizes recorded when archiving those five files. |

The JSON files were parsed and pretty-printed at capture time; they are not byte-for-byte HTTP wire
responses. Response headers, request headers, TLS traces, cookie state, timings, and a HAR were
not retained. Hashes detect later file changes, not provider authenticity or factual accuracy.
The original screenshot remains in the temporary experiment directory and is not needed for the
archived JSON evidence. No authentication secrets or cookie values were intentionally captured.

## Research references versus local evidence

These references explain tool capabilities and previous reports. They do not substitute for the
completed local tests above:

- [curl_cffi project](https://github.com/lexiforest/curl_cffi): browser TLS/HTTP impersonation.
- [Playwright Python network documentation](https://playwright.dev/python/docs/network): observing browser requests and responses.
- [Camoufox SofaScore capture implementation, June 2026](https://github.com/sergeykuznetsov1995/data-platform-football/pull/759): reported passive-capture success using Camoufox and a residential proxy. Browser and network changed together; this did not prove either was independently necessary.
- [ScraperFC SofaScore 403 report](https://github.com/oseymour/ScraperFC/issues/93): an example of an endpoint wrapper failing when access conditions changed.

Earlier discussion favored Camoufox before a local experiment existed. The local successes with
plain Playwright/Chrome and `curl_cffi` supersede that recommendation for this environment only.
They do not invalidate the user's prior hosted failures or establish that SofaScore access is
universally solved.
