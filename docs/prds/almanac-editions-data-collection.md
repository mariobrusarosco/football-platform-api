# PRD: Almanac Edition Data Collection

## Purpose

Give a future research and scraping agent a clear specification of the information to collect
for every completed men's World Cup edition. The resulting collection must support an English
Almanac that combines football records, visual identity and historical storytelling.

This is a product and information brief. It does not specify sources, scraping tools, database
tables, APIs or an implementation. Existing application schemas and datasets do not constrain
the collection requirements.

## Decision Status

| Status | Decision |
| --- | --- |
| Accepted | Cover all completed men's World Cups, starting in 1930. |
| Accepted | All reader-facing text is English. Research sources may use other languages. |
| Accepted | Include football facts, statistics, stories and visual identity. |
| Accepted | Include every match's teams and score by stage, group tables and final standings. |
| Accepted | Include edition records and identify records broken against earlier World Cups. |
| Accepted | Include a short introduction and 3–5 sourced stories per edition. |
| Accepted | Preserve historical team, country and venue names; explain modern names where useful. |
| Accepted | Keep information available for some editions even when other editions have gaps. |
| Accepted | Mark missing information explicitly; never represent it as zero. |
| Accepted | Prioritize stadium names and cities; simplify stadium enrichment according to availability. |
| Deferred | Qualifiers, upcoming editions and women's World Cups. |
| Deferred | Detailed team, squad, player and individual match-event coverage. |
| Open | Source selection and actual availability, to be investigated by the future collection agent. |
| Proposed | The collection conventions, delivery organization and verification procedure below. These make the accepted scope executable; they are not claims that the information is available. |

## Product Outcome

A reader opening an edition should be able to:

1. Recognize its time, place and visual identity.
2. Understand which teams participated and how the competition worked.
3. Follow the World Cup through its matches, stages and standings.
4. Discover its champion, leading players, statistics and records.
5. Explore its venues and understand what made it memorable.

The edition is the unit of collection. Teams, people, matches and venues appear here only to
support the edition overview. Their dedicated Almanac sections are separate future work.

## Scope and Collection Date

- Establish the list of completed editions as of the collection run's cutoff date and record
  that date. Do not assume the list from an old dataset is complete.
- Include every played, completed men's World Cup from 1930 through that cutoff.
- Do not create played editions for canceled competitions or invent missing four-year entries.
- Do not treat schedules, simulated results or predictions as completed tournament results.
- Collect English display text while preserving original names and spellings as research
  evidence. Retain diacritics. Use historically appropriate English names rather than silently
  replacing historical teams or venues with their modern counterparts.

## Priority and Missing Information

**Core:** research every item for every edition. Deliver either a supported value or an explicit
gap with its reason. A gap records incomplete coverage; it does not turn the requirement into
an optional item or justify inventing a value.

**Enrichment:** collect when practical. Missing enrichment does not block delivery of an edition.
Stadium photographs, historical capacities and venue-to-match assignments have this priority.

For each requested item, distinguish:

| State | Meaning |
| --- | --- |
| Found | A value is supported by recorded evidence. |
| Derived | A value is calculated from supported inputs; the method and inputs are recorded. |
| Not applicable | The item did not exist or does not apply to that edition, with an explanation. |
| Unavailable | The item applies, but research did not establish a reliable value. Record the research limitation. |
| Conflicting | Evidence gives incompatible values and the discrepancy remains unresolved. Preserve the alternatives. |
| Pending | Research has not yet been completed. This is not an acceptable final coverage state. |

Zero is a factual value, not a missing-data marker. An absent award is not the same as an award
whose winner could not be found. An inaccessible source does not prove that a fact does not exist.

## Required Information per Edition

### 1. Identity and Visual Character — Core

| Information | Collection instruction |
| --- | --- |
| Year and edition name | Record the edition year and an English name suitable for display. |
| Hosts | Record every host country under its historically appropriate name. Support multiple hosts. |
| Dates | Record the opening and closing dates of the World Cup itself. Do not use qualifier dates. |
| Official logo or emblem | Identify the edition's official emblem and its image, if one existed. |
| Official poster | Identify the official poster or posters; distinguish official designs from later artwork. |
| Mascot | Record the name, a short description and image of each official mascot, if applicable. |
| Official ball | Record the name and image of the official match ball or balls. Preserve different versions and their use where relevant. |

Support multiple legitimate items instead of forcing one mascot, ball or poster. Do not label
a commemorative or fan-made asset as the original official identity.

For visual items, preserve a viewable image or retrievable asset reference, caption, attribution
and any available reuse information. Record unknown reuse terms as unknown. Discovering an image
does not itself establish permission to publish it. Do not fabricate replacements to fill gaps.

### 2. Participants, Format and Rules — Core

| Information | Collection instruction |
| --- | --- |
| Participating teams | List the teams that actually participated, using names from that edition. |
| Participant count | Record the count and reconcile it with the participant list. Distinguish any withdrawals or other exceptional participation cases in a note. |
| Competition structure | Describe the stages in order, group sizes, progression and the route to becoming champion. |
| Points system | Record the points awarded for wins and draws where a points system applied. |
| Ranking and advancement rules | Record tie-breakers, advancement conditions and relevant exceptions for that edition. |
| Tied knockout matches | Explain the applicable use of extra time, replays, shootouts or other deciding procedures. |
| Notable rule differences | Give a concise explanation of rules that materially affect how a reader interprets that edition's results. |

Do not apply a modern competition format, points system or tie-breaker to every edition.
Collect enough explanation to interpret the results; a complete reproduction of the laws of
football is outside scope.

### 3. Match Results and Progression — Core

For every match in the World Cup itself, collect:

- Date, both teams and the stage in which it took place.
- Group or equivalent stage subdivision, where applicable.
- The match score, including extra time when played.
- Whether extra time occurred and, when obtainable, the score before extra time.
- Whether a penalty shootout occurred and its separate score.
- Match outcome and progression when a score alone does not explain who advanced.
- Any replay relationship or exceptional status needed to interpret the result, such as an
  abandoned match, awarded result or unplayed fixture included in historical records.

Keep shootout tallies separate from match goals. Do not invent an on-field score for an awarded
result. Preserve the distinction between scheduled fixtures and matches actually played.

Organize results by the edition's real stage order. Include third-place matches and replays
when applicable. Distinguish matches on the same date through their teams and stage context.

This requirement is for edition-level results. It does **not** request a scorer event log,
lineups, substitutions, cards or individual penalty attempts for every match.

### 4. Tables, Final Standings and Outcome — Core

| Information | Collection instruction |
| --- | --- |
| Group tables | For each applicable group stage, collect team, position, played, won, drawn, lost, goals for, goals against, points and advancement outcome. Preserve other ranking measures if that edition used them. |
| Later group stages | Include subsequent group phases or a deciding group when present; do not assume there is only one group stage. |
| Final standings | Collect the published final placement of every participant where available, including shared positions. |
| Champion and runner-up | Identify both and reconcile them with the results and format. |
| Final or deciding outcome | Record the teams, date and score of the final when one existed. Otherwise explain how the champion was decided and identify the relevant deciding match or stage. |

Label a published official ranking, a retrospective ranking and a calculated ordering distinctly.
Do not fabricate a unique position for every team when the evidence only establishes a shared
placement or stage reached. Preserve that limitation in the delivered standings.

Calculated tables must use the edition's rules and account for documented adjustments. Do not
silently recalculate a published historical table with today's rules.

### 5. Edition Statistics — Core

| Statistic | Definition and required context |
| --- | --- |
| Matches played | Count actual matches in the World Cup, including applicable replays and placement matches. Explain exceptional cases. |
| Total goals | Goals scored in those matches, including extra time and own goals, excluding shootout tallies. Explain any treatment of awarded scores. |
| Goals per match | Total goals divided by matches played under the same counting convention. Retain inputs and rounding convention. |
| Total attendance | Published total admissions across matches, not a claim about unique spectators. Record whether the figure is reported, estimated or calculated. |
| Average attendance | Collect if available or derive from compatible complete inputs. Never divide a partial attendance total by the full match count. |

Aggregate totals must be compatible with the collected match list. If historical published
totals differ, retain the discrepancy and its explanation instead of silently choosing one.
Detailed attendance for every match is not a separate requirement unless used to derive a total.

### 6. Leading Scorers and Awards — Core

- Collect the edition's scoring leaderboard where available: player name, team, goal total
  and position. At minimum, identify every player tied for the highest goal total.
- Record whether a delivered leaderboard is complete or limited to its leading entries.
- Exclude own goals credited to opponents and shootout conversions from player scoring totals.
- Collect the official awards given for that edition: award name, recipient or recipients,
  associated team where relevant, and placement such as gold, silver or bronze when awarded.
- Explain the award's meaning in English where the historical name is unclear.
- Distinguish an official award winner from a statistical leader and from a retrospective
  selection. Do not assume that tied goal totals always produce shared official awards.
- Do not invent an award for an edition in which it was not given.

Player names and team associations here support edition highlights. Full player biographies,
complete squads and a cross-edition player identity system are outside this task.

### 7. Records and Notable Statistical Achievements — Core

Research these categories for each edition:

| Category | Required information and interpretation |
| --- | --- |
| Biggest win | Both teams, date, stage, score and winning margin. Include all matches tied for the largest margin. |
| Highest-scoring match | Both teams, date, stage, score and total match goals. Include ties. Exclude shootout tallies. |
| Youngest player | Name, team, birth date when obtainable, appearance date and age. Use the youngest player who actually played, not merely a squad member. |
| Oldest player | Name, team, birth date when obtainable, appearance date and age. Use the oldest player who actually played. |
| Records broken | Research notable World Cup records broken or equaled in that edition. For each claim, record the metric, holder, value, event date and prior benchmark where obtainable. |

The youngest/oldest convention above is a proposed collection definition. Keep any differently
defined published claim explicitly labeled; do not mix age at tournament opening with age at
appearance. Research only the supporting player and appearance facts needed for these records;
a full appearance dataset is not required.

Distinguish **best within this edition** from **best in men's World Cup history as of that
edition**. A record achieved in an older edition can remain historically meaningful after it
is surpassed. Do not evaluate a historical record claim solely against today's record holder.
Label broken and equaled records separately.

The named categories are required research. Additional notable records may be included when
supported; an exhaustive catalog of every conceivable football record is not required.

### 8. Stadiums and Host Cities

| Priority | Information | Collection instruction |
| --- | --- | --- |
| Core | Stadium names | List the venues used by the World Cup under their names at the time. |
| Core | Cities and host countries | Associate each stadium with its location; retain useful municipality or metropolitan-area distinctions. |
| Enrichment | Photograph | Prefer an image relevant to the edition's period. State its date or period if known; do not present a current photograph as historical. |
| Enrichment | Historical capacity | Record capacity during that World Cup where supported. Do not substitute current capacity or a match's attendance. |
| Enrichment | Matches hosted | Associate collected edition matches with their venue where practical. Mark incomplete assignments as partial coverage. |
| Enrichment | Modern-name explanation | Add a short clarification for a renamed venue when it helps readers. |

The collection agent may deliver the stadium section with names and cities alone when the
enrichment is difficult to establish. Report the omitted items; do not let them delay the rest
of the edition or quietly substitute less accurate values.

### 9. Introduction and Stories — Core

For each edition, deliver:

- A short original English introduction explaining where and when the World Cup happened,
  who won and what distinguished it.
- Three to five concise original English stories, each with a title and supporting references.
- A selection covering the most meaningful memorable moments, surprises, controversies or
  historical and cultural context. These are selection themes, not a quota for each theme.

Proposed editorial length: roughly 80–150 words for the introduction and 80–180 words per
story. These are readability targets, not reasons to pad weak material.

Keep stories connected to the World Cup itself. Qualifier stories remain excluded. Attribute
disputed claims and distinguish established events from interpretation. Do not copy source
articles or invent a controversy to meet the story count. If three supported stories cannot be
completed, report the section as incomplete with the reason.

## Evidence and Consistency Requirements

The future agent chooses where to research. This PRD intentionally provides no source directory
or preferred provider.

The delivered collection must nevertheless retain evidence for its facts:

- Record the document or page title, publisher, retrievable reference, access date and relevant
  locator when available. One reference can support multiple facts; make those associations clear.
- Preserve the reported value alongside any translation, normalization or calculation that
  changes its presentation or interpretation.
- For calculated values, retain the inputs and calculation rule so another agent can reproduce
  them. Label editorial writing separately from reported facts.
- Reconcile disagreements affecting scores, winners, rankings, awards or records. If they
  cannot be resolved, deliver the alternatives as conflicting rather than presenting certainty.
- Use consistent references within the collection so that a team in a group table can be
  connected to that team's matches and final placement. Similar names alone are not proof of
  identity. Provider IDs are optional evidence, not a prerequisite for collecting facts.
- Assess coverage independently for each edition and information area. A complete recent
  edition does not prove equivalent historical coverage.
- Do not inherit factual claims, counts or provider-coverage promises from earlier chat
  responses without checking their evidence during the collection task.

## Deliverables for the Future Collection Task

The organization below is proposed; the task may choose a practical file format without
introducing a database design.

1. **Edition inventory:** every in-scope edition and the collection cutoff date.
2. **Edition collection:** clearly labeled, machine-readable facts covering the nine areas
   above. Collections such as matches, groups, scorers and awards must remain individually
   inspectable rather than being embedded only in prose. Document field meanings and units.
3. **Editorial content:** English introduction and 3–5 stories per edition, with evidence links.
4. **Visual inventory:** identified assets, captions, attribution, available reuse information
   and a file or retrievable reference where obtainable.
5. **Coverage report:** a matrix by edition and requested information item, showing its state,
   scope of coverage and unresolved limitations. Separate core gaps from enrichment omissions.
6. **Evidence register:** the references supporting the collection, linked to the relevant facts
   and stories, plus explanations for derived values and unresolved conflicts.
7. **Validation report:** checks performed, discrepancies found and any unresolved blockers.

The result should be usable by another agent without rereading this conversation. Keep the
collection independent of existing seed formats, schemas, source IDs and application code.

## Proposed Collection Sequence

1. Establish the completed-edition inventory and record the cutoff date.
2. Find identity, participants, format, results and outcome for every edition.
3. Gather tables, totals, scorers and awards; reconcile them with the match results.
4. Gather the specified records and their definitions, dates and comparison periods.
5. Gather stadium names/cities and edition visual identity; pursue stadium enrichment where
   practical without blocking core research.
6. Research and write the introductions and stories in English.
7. Check relationships, definitions and evidence; deliver the collection and coverage reports.

When a field is difficult to find, document the obstacle and continue independent collection
work. Do not silently reduce the accepted scope to match whichever dataset is easiest to access.

## Acceptance Criteria

### Coverage and honesty

- Every in-scope edition is present in the inventory.
- Every core item has a supported value, reproducible derivation, justified not-applicable
  state, or an explicitly reported unresolved gap/conflict. Nothing is silently omitted.
- No final coverage item remains pending. Unresearched items must not be relabeled unavailable.
- An edition is labeled **core complete** only when all core items are found, derived or
  legitimately not applicable. Otherwise label it **partial** and list the remaining gaps.
- Missing enrichment does not prevent core-complete status. Missing applicable core data does.
- Partial results are still delivered; documented gaps are useful output but are not a claim
  of complete information coverage.

### Football consistency

- Participants, matches, group tables and standings refer to the same teams within an edition.
- The match inventory reconciles with the reported match count, with exceptions explained.
- Goals and goals-per-match reconcile with the chosen documented counting convention.
- Shootouts are separate from match scores, total goals and scorer totals.
- Group tables and progression respect the edition's actual rules and any documented adjustments.
- Champion, runner-up and deciding outcome agree with the competition format and results.
- Ties in rankings, scoring totals, awards and records are preserved where applicable.
- Biggest-win and highest-scoring claims agree with the complete match results.
- Age records identify their reference date; all-time records identify their comparison cutoff.
- Historical names and venue capacities are not silently replaced by present-day values.

### Editorial and handoff quality

- Reader-facing text is English, including translated explanations of historical terms.
- Each edition has the agreed introduction and 3–5 supported stories, or an explicit core gap.
- Official, retrospective, derived and editorial claims can be distinguished.
- Facts and visual items are traceable to their evidence; uncertainty remains visible.
- A receiving agent can understand the collection, reproduce calculations and identify missing
  information without consulting the current application or this chat.

## Explicit Exclusions

- Qualification campaigns, qualifier results and qualifier summaries.
- Women's competitions and editions that have not finished by the collection cutoff.
- Full squads, starting lineups, substitutions, card events, detailed scorer events,
  individual penalty attempts, goalkeeper saves or advanced player/team statistics.
- Full player profiles and cross-edition player career reconciliation, beyond the limited
  identifying information needed for edition awards, scoring leaders and records.
- Detailed team pages, all-time team statistics and their visual presentation.
- Live score updates, recurring monitoring and automated publication.
- Implementing a scraper, modifying application code, designing tables, changing schemas,
  deleting existing records, seeding a database or building UI as part of this PRD-writing task.

## Open Questions for Execution, Not Prerequisites for This PRD

- Which sources actually cover each required item and edition?
- Which conflicts or historical gaps cannot be resolved from available evidence?
- Which visual assets have suitable available files and publication terms?
- Which stadium enrichment is practical to collect?
- What collection file format and extraction method best preserve the information above?

The future agent should answer these through research and document the result. No claim of
source completeness or scraping feasibility is made by this requirements document.
