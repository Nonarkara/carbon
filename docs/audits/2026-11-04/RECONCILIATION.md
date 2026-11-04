# Agent work reconciliation · 4 November 2026

Baseline: c2bf2cc on main and both live domains. The main tree is clean; no stashes.

## Work plan

1. Inventory open/closed PRs, local branches, worktrees and unpublished commits. Preserve unique work; merge only reviewed changes that remain useful.
2. Independently review Nong Non §13 and the map-led phone/tablet/desktop reading path, including enlarged text. The grid remains column instruments around the map; attention is map → selected evidence → next action. Research remains an editorial column with illustrations beside their explanations.
3. Reproduce the Linux CI geography clipping failure, recover the relevant PR repair and preserve complete labels and dense-group target sizes.
4. Close the release gap: the pristine release must run the full browser suite before upload, alongside unit and spatial gates. A failing interaction must block publication even if geometry passes.
5. Repair confirmed functional/security/content gaps, then test, independently review, commit, push, deploy exact committed bytes and verify both domains.

## Confirmed findings

- Latest main CI 41795606644 fails map-tools at the geography-selector text-width assertion. Other 16 browser suites pass. The preceding four main runs also failed; local green claims do not establish CI health.
- scripts/release.mjs runs unit, spatial and deep gates before upload but omits scripts/browser-suite.mjs. This allowed a known browser failure to coexist with a successful release.

## Disposition and evidence

In progress. No claim of a complete audit until review findings, PR dispositions and final verification are recorded below.

## PRs and local work

| Item | Disposition |
| --- | --- |
| #10 npm tooling | Merged; clean npm install and matching Chromium installed; npm audit reports zero vulnerabilities. |
| #14 Python ingest | Merged after fresh Python 3.13 environment installed all six exact pins and passed synthetic HDF5, raster/mask/mosaic/reprojection, geometry, geodesic-area, NumPy aggregation and indexed-PNG probes. No raw-data recomputation or ledger publication. Durable probe now runs in CI. |
| #15 GitHub Actions | Merged; pinned SHAs retained, credential restrictions preserved. |
| #13 older phone redesign | Closed as superseded by the newer one-band shell; its drawer/10px legend treatment was not overlaid onto current work. |
| #16 geography/contrast | Recovered both narrow-phone CSS fixes and atomic live-node contrast sampling into current main. Older HTML hashes were not copied; current build regenerates them. Close after the recovery commit. |

The two local codex branches have zero unique commits ahead of main. Their work is retained. No stash or dirty working tree was found. Removed only the clean, abandoned pristine release checkout at 97cea7d, after confirming no active release used it; retained the Southeast Asia working checkout.

## User-visible fixes

- At 320px the actual 20px mark now occupies a 20px grid track, and the layers glyph uses the existing dense-control target instead of an unrelated 40px floor. The selected geography regains room without reducing its type or clipping its text.
- SEA map share: 1024×768 50.44% → 80.11%; 1440×900 52.29% → 63.13%. Compact map/evidence views extend through 1100px; above that the evidence rail is at most 350px/24vw. Controls, quantities, sources, exports and comparison remain reachable. The gate measures 1100/1101 as well and rejects the old stretched rail.
- Research text-only 200% enlargement at 390px: TH overflow 102px → 0; EN 111px → 0. Long identifiers and source links wrap; tables keep their own frame. The test restores the old wrapping to prove it fails.
- Nong Non's six teaching poses load at every required width. Greet now identifies the notebook welcome, not the product mark. The English baby-schema heading is distinct, and both languages stop implying that the teaching face is the browser icon. CT remains the brand.
- A failed or still-loading optional registry snapshot no longer crashes project JSON export or rejects map readiness. Context explicitly carries unavailable/null rather than a completed empty-match check. T-VER map choices remain disabled until their data exists; other map/calculation controls operate.
- Workbench CSV retains its six numeric rows and carries source, method/version, factors, dates, release, unassessed uncertainty and unissued status alongside each row. User evidence beginning like a spreadsheet formula is inert text; signed numeric losses remain numeric.
- Regional CSV correctly distinguishes percentage, megatonnes CO₂, tonnes and scaled display units. Forest removals now have display metadata; peat/mangrove carry their 2000 reference period. Missing data remains blank with a missing status. Source displays use known reference periods or explicitly say when a period was not supplied.

## Release correctness

Independent review found a second publication escape: inherited BASE_URL could point every pre-upload gate at an older live site instead of the pristine build. All release child environments now remove that variable without changing the caller or other environment values. A real spawned-child regression proves the isolation. Post-upload verification still receives its explicit production URL. Browser-suite failure is now a blocking pre-upload verdict.

Independent reviewers verified final geometry, captions, enlarged text, export/registry source paths, release wiring and CI syntax. Their captures and measurements are in this directory. Targeted tests passed, including the original geography assertion, restored-rail falsifier, restored-text-wrap falsifier and registry-abort calculation/export journey.

## Remaining scope limits

No independent field validation, credit eligibility/issuance authority, physical-device installation or participant usability study is established by these software checks. Python compatibility was tested with synthetic fixtures and production-helper imports, not a full re-ingestion of raw datasets. Observed device sizes and flows are named evidence, not a claim about every possible browser or user state.

Final full-suite and live verification results are recorded in the session handoff; this note intentionally does not predict a release commit before it exists.

## First release blocked: a hidden disclosure was measured as painted text

The pristine edb6926 attempt passed 136 unit tests, all 18 browser suites and every shell law gate, but stopped before upload on one deep-audit finding at SEA evidence TH1024×768. GitHub CI passed the same commit. Independent reproduction (3/3) showed the finding was a detector error: Sources was closed, yet Chromium retained descendant layout rectangles. The first source title extended 18px beyond the evidence frame; checkVisibility() was false. The detector's ancestor hit-test treated that unpainted descendant as visible. Opening Sources provided a 612px scroll range and made every heading reachable.

The collectors now consult native checkVisibility before trusting geometry. A regression exercises the actual SEA page: closed disclosure is clean; removing only the new guard reproduces the original finding; opening Sources makes each title reachable; forcing a 120px overflow-hidden evidence panel still raises unreachable-content. All previous detector falsifiers remain passing. The deep evidence job now explicitly opens and asserts the source disclosure, so its full content is measured rather than merely excluded while closed. This changes the audit's visibility accuracy and coverage, not the page geometry or its reading content. The failed release uploaded nothing.
