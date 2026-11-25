---
updated: 2026-11-25
drafted_by: codex/gpt-6-independent-review
reviewed: false
status: reviewed-working-candidate
---

# Independent review of the approved core scope

This is a separate reviewer from the session, data and release builders. Measurements use an owned ephemeral local server with `/version.json` identity `fb178be`; public module/CSS source is being integrated, so this is not a final-release attestation. Root must repeat the final gates on the pinned candidate. Reviewed source identities are recorded in `INDEPENDENT_CORE_SOURCE_HASHES.json`; a source change after this receipt requires targeted review of that change.

## Confirmed findings and disposition

| ID | Finding / reproduction | Disposition |
|---|---|---|
| IR01 P1 | 1440×900, `html{font-size:200%}`: Thailand top/body width 1743 px, overlapping tool labels and offscreen right rail. | Root changed desktop toolbar to wrap based on available space. Independent recheck: width 1440 px, top 126 px, rail reachable, no page error. Normal-size chrome unchanged at 43 px. |
| IR02 P1 | 390×844,200% text: empty Project KPI statuses consumed>680 px; no project field on first screen. | Session builder reduced pending-status type role and moved large-text summaries into their relevant panes. Field became visible at y407. During relocation, a tied CSS specificity left a340 px blank region; builder repaired it. Final independent phone200 recheck: header49.39 px,map679 px,body844 px; no blank track. Project name field visible y407. |
| IR03 P1 | Same phone/text case: `8,422.9 M` split into `8,422.` then `9 M`; map began y831, below almost the whole first screen. | Final phone200 check: real quantities and their complete metadata move into the existing Carbon pane, stock `8,422.9 M` fits a single337 px readout, and the map occupies679 px initially. Flow suffix now travels inside its numeric token; independent one-line range proof passes for `71.7 M`. |
| IR04 P1 | Delayed `File.arrayBuffer` plot read, then uncheck equation confirmation before completion. Old handler let the stale read re-enable Apply and display123.59tAGB with confirmation false. | Session builder increments revision when confirmation is revoked. Independent browser probe: current handler→confirmation false, Apply disabled, plot result empty. Route-only mutation removing that increment→confirmation false, Apply enabled,123.59tAGB. No repo source was mutated for falsification. |
| IR05 P1 | Pure `validateBoundary` runs synchronously in browser import paths. Valid circular polygon:1001 vertices/39,135 bytes→236 ms;5001/195,764→3825 ms;20000/782,853→63,120 ms on this Mac, Node26. All below the2MiB input cap. | Root/session builder added an owned module worker with cancellation/revision. Independent real app probe during5,001-vertex validation:16 heartbeat ticks in 300 ms, Reset15.5 ms, boundary remains absent after cancellation. Pure validator/math and supported geometry limits retained. |
| IR06 P2 | New durable release receipt retained phase codes/asset hashes but deleting its temp tree removed gate JSON failure reports. | Root added bounded, allowlisted, redacted diagnostic capture before cleanup, with deterministic protection test. Source review confirms capture ordering and private-file exclusion; real release receipt remains root verification. |
| IR07 P2 | Research section01 put three quantity alternatives in a two-column strip, leaving an orphan third box and narrow Thai wrapping. | Root restored the original semantic three-column table in TH/EN, retaining complete qualifications and precise “no live registry or issuance connection.” Independent final renders have no orphan comparison boxes or horizontal document overflow. The phone table earns its height by retaining parallel fields and full wording; this is not a claim of a shorter phone section. |
| IR08 P1 | New Bible initial-paint strategy hides main while corpus/font requests complete; bare fetch lacked a bound, so a stalled request could hold the whole reader blank. | Root uses bounded 15s `loadJSON`, caps the font wait at 1s, and exposes two research alternatives while pending. Independent stalled-request test produced a visible failure after 15,456 ms; reloading with the request restored opened “Start with the question.” |

Additional contract finding: malformed public-province coordinate nesting/string points/empty rings could pass an outer-array check. Data builder tightened finite2D WGS84/ring closure/nesting with a 100,000-point bound; independent rerun of the updated 5-test source-contract file passes, including the actual 77-province source. No topology rebuild or accounting change.

## Exercised and preserved

Normal Thai map at390×844: top 35 px; map y202.19,584.81 px high.1024×768: top 35 px, map 592.41 px high.1440×900: top43 px,map 769.41 px high, 1090 px wide. No page errors in those captures. Source files in the app remain browser-local; the new project import reader whitelists fields and recomputes legacy report results rather than trusting stored totals.

Focused independent run:20tests pass across assessment-session,source-contracts,data-load and release-operations test files. This is not a full browser/spatial/security clearance. Root runs the complete suites and live identity/bytes checks.

Screenshots and measured geometry: `test-results/independent-core/` (ignored local evidence; changing source may replace intermediate images). Use the final candidate receipt for publication, not these intermediate captures.

## Final review boundary

Generated Research/Bible spot checks passed in TH/EN at 390/1024/1440: 23 research sections and the then-current 27 tables, no document overflow/unwrapped wide table, no page errors. Bible q/group/chapter survive locale; print keeps article and hides header. Final post-build render checks now pass for the compact section01 table, all six Nong Non poses (nonempty localized alts, transparent source assets loading at three widths), stock/flow token checks, enlarged phone task geometry, and bounded Bible failure/reload recovery. Evidence is in `test-results/independent-core/final-review.json`, `flow-token.json` and final screenshots. No confirmed review finding remains open in the reviewed source; publication gates and live receipt remain root responsibilities. Physical iPhone/Android and human screen-reader/first-time-user studies are not substituted by browser emulation.

## Targeted post-review changes

The integration operator requested this additional review after moving polygon ledger sums off the main thread and preserving one normal quantity-line track for status values. This section supersedes the earlier source-hash snapshot. No additional broad redesign was performed.

| Finding | Repair and independent evidence |
|---|---|
| IR10 P1 · stale boundary caller | The old `useBoundary` continuation dereferenced `S.shape` even when a worker selection was superseded. Actual reproduction: correct Chiang Mai stock 745.57 M, but “Cannot read properties of null (reading 'getBounds')” appeared. Fit now occurs inside the successful revision-guarded branch. Recheck: province selection 45.0 ms,13 heartbeat ticks/250 ms, correct 745.57 M and no error message. |
| IR11 P1 · project Reset did not cancel map selection | Reset now invalidates/cancels an imported-boundary map selection and returns that context to Thailand, while preserving unrelated province/box context. Deterministic browser test withheld landscape completion for 5 seconds: before Reset, worker stop count 0 and stock “Loading data…”; Reset terminates it once. After the late callback, Thailand stock 8,422.9 M, place TH, boundary hidden and “Session cleared” remain. Reset dispatch took 282 ms in this concurrently busy-suite sample; this is no field interaction-performance certification. |
| IR12 P1 · critical-source recovery could be removed | With manifest 503, importing a valid boundary then selecting it removed the sole core-retry button and offered an area retry that could never acquire its missing manifest. Central pre-readiness selection guard now preserves source state/retry DOM, explains the next action, and does not queue an automatic later selection. Independent test: core retry remains 1; no area retry created; restoring the endpoint and clicking Retry loads national TH without reload; a deliberate second boundary selection succeeds. No page errors. |
| IR13 P2 · deferred reader jump could override wheel input | Initial chapter focus now waits until the reader is painted, and cancels on pointer/key/wheel/touch input. Real wheel input while the corpus response was withheld leaves body focus and scroll 0; without manual input the same #forest-stock link focuses the article and lands at scroll 704. |

The normal status reservation is one existing quantity-line height (33.6 px versus the body status line19.6 px), not a larger status font. It stabilizes map position across panes. Enlarged-phone summaries are excluded and retain their previously reviewed placement.

### Exact arithmetic and bounded indexing

The operator measured another blocking path: repeated point/edge work in `sumSelection`. The worker now uses a bounded 16-latitude intersection cache. Source review confirms the original crossing expression and order, strict `x < crossing`, hole subtraction, multipolygon union, 4×4 cell sampler, cell iteration/accumulation and covariance arithmetic remain intact. Coordinates are neither simplified nor approximated by the cache.

Independent deterministic probe: 100 seeded star/hole/multipolygon fixtures, 33,400 point comparisons including vertices perturbed by ±1e-12, all exactly match the original `polygonContains`. The two new scanline tests also pass: edge/hole/vertex/cache-eviction classification and complete totals/block covariance compared with the original point sampler, including an unsorted synthetic grid. Worker transport and the actual UI cancellation paths remain local; no geometry upload was introduced.

All confirmed findings in this targeted review are closed in the reviewed source. Root owns the clean pinned commit, complete pristine gates, preview restore drill, both-domain deployment and live-byte verification. No deployment or commit was performed by this reviewer.
