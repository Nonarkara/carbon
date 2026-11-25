---
updated: 2026-11-25
drafted_by: codex/gpt-6
reviewed: false
status: approved
execution_approval: approved by user on 2026-11-25
---

# Carbona: next scope for approval

The next scope makes the existing system dependable to operate, easier to resume, faster to open and simpler to maintain. It preserves the map, the bilingual research, the scientific qualifications and browser-local project data. Success is a person completing a real task with an understandable result and a recoverable evidence file.

The user approved this execution contract on 25 November 2026. Core increments A–D are authorized; optional scope remains excluded. The baseline below records the pre-execution inspection, not the current completion state.

## 1. Approval requested

Approve the core scope in sections 4–9, delivered in the four increments in section 11. This includes a validated local-file **Save / Open assessment** workflow, explicit recovery from failed data requests, privacy-safe sharing, measured loading improvements, component-level cleanup, reviewed public-data refreshes and stronger release operations.

The core keeps the existing static HTML/JavaScript/Leaflet/Cloudflare architecture. It introduces no accounts, cloud project storage, paid APIs, production LLM, analytics or automatic publication of upstream data. Project files stay browser-local; permanent browser storage and offline caching of those files are outside this approval.

Additional work requiring separate scope approval is listed in section 12: authenticated parcel flux, new biomass models, corporate-footprint calculation, cloud collaboration, full offline operation and commissioned field/human studies.

## 2. Current baseline: observed, not inferred

Inspection date: 25 November 2026. These observations describe the state inspected; phase 0 rechecks them before execution.

| Area | Observation | Consequence |
| --- | --- | --- |
| Production | Both domains report `3c9ef32`, built 17 November | The browser's older `release=` query is not the deployment identity; use `/version.json` and bytes |
| Local main | `de500e0`, four commits ahead and one behind refreshed `origin/main` | Reconcile before choosing a release candidate |
| GitHub main | `72785ee`, NumPy 2.5.4 → 2.5.5; recent CI successful | Remote dependency work must be included or explicitly accounted for |
| Unpublished local work | Four research-strip commits; staged edits in `docs/RESEARCH.en.md`, `docs/RESEARCH.th.md`, `public/css/research.css` | Preserve both history and index; audit every field/qualification before publishing |
| PRs / stashes | No open PRs and no stashes at inspection | There is no current PR backlog to invent |
| Worktrees | A prunable `139a559` release entry and a retained `3c9ef32` release checkout | Check process ownership and unique content before cleanup |
| Release export | `scripts/lib/release-tree.mjs:116` ignores its `commit` argument and rereads HEAD in both branches | Confirmed code defect: a HEAD change between capture and export can select a different revision |
| Dependencies | Release export symlinks the caller's `node_modules` | Source isolation alone does not prove dependencies match the candidate lockfile |
| Failed grid load | `landscape.js` memoizes the grid request, including rejection | Source-level recovery gap: prove the fail-once/retry journey before repairing it |
| Optional metadata | Source catalogue, province reference and application version share one `Promise.all`; some optional stock/NFI failures are silently caught | Reproduce fault isolation and ensure a missing reference does not hide version or qualification status |
| Private geometry | `app.js:119` serializes selected imported GeoJSON into the URL fragment | Fragments are not sent in ordinary HTTP requests, but may be copied/shared or browser-synced; review this default |
| Session lifecycle | Guides explicitly say refresh loses inputs; export exists, validated assessment reopen is absent | A complete user journey needs a deliberate local recovery path |
| Loading / CSS | Main page references nine CSS files; registry initialization exists in both app and landscape | Measure duplicate transfer, parse and cascade costs before consolidation; file count alone is not a defect |
| Data age | Forest Watch retrieved 5 October, SEA 20 October, T-VER snapshot 28 September | Retrieval age and observation period need separate treatment; these are dated snapshots, not live parcel measurements |

Asset inventory, **raw file sizes rather than measured network transfer**: coral source image 3.83 MiB, ledger grid 2.47 MiB, requested Axiom PNG 1.12 MiB, Bible JSON 1.09 MiB. The Bible JSON gzips to about 0.17 MiB, so splitting it is not automatically an improvement. Protected originals and their provenance hashes remain intact.

The 18 November handoff reports 149 unit tests and 18 browser suites passing on `3c9ef32`. That historical receipt does not certify the current local commits or staged edits. No fresh build/full test/deployment was performed for this plan.

## 3. Protected behavior and design

- Preserve all live maps, layers, charts, world feeds, province and SEA flows, diagrams, sources, logos, Nong Non and useful research content.
- Keep stock, annual/period flows, gross tree-cover loss and issued credits distinct. Main Thailand and SEA quantities can use different datasets, extents, pools and years; shared formatting must not imply they are comparable measurements.
- Preserve signed losses, missing-versus-zero, resolution withholding, quality flags, uncertainty/bias qualifications, and stale-result/plot invalidation after accounting changes.
- Regenerate ledger data only through the documented ingest/build pipeline. No hand-edited totals or invented missing-country values.
- Keep the current palette, Jost/Prompt typography, flat controls, source geometry and branding. Create `STYLE.md` to document the accepted product, not to substitute a new theme.
- Grid: column/modular instruments around the map. Attention: map → selected quantity/evidence → action. Research uses a readable editorial column; genuinely tabular comparisons retain accessible relationships.
- Keep complete labels, current dense-control target rules, keyboard order and reduced-motion behavior. No new introductory hero, modal tour or permanent status band consuming the map.
- Any refactor removing more than 30% of a file requires an explicit reviewed diff and separate approval. Do not evade this through a chain of small deletions.

## 4. Phase 0 — reconcile and establish a reproducible baseline

**Priority P0. Outcome:** one identified candidate containing the intended work, with a reliable before/after comparison.

1. Inventory local/remote commits, staged/unstaged content, active processes and temporary worktrees again. Record file/index hashes and authorship before changing anything.
2. Preserve the four local commits and staged research edits. Compare each converted table/strip against the previous source: values, units, periods, uncertainty, standards versions, scope limitations, links and TH/EN equivalence. Retain tables wherever rows and columns carry meaning that strips would lose.
3. Integrate the remote NumPy patch in an isolated `codex/` integration branch after compatibility checks. Resolve the current work explicitly; no reset, force push or blind deployment from the shared tree.
4. Capture representative before screenshots and cold/warm loading measurements. Separate application assets from third-party tiles and public feeds. Record hardware, browser, network profile, commit and visible task state.
5. Trace dependencies of each public surface and each gate. Produce one short ownership/architecture map and a risk-ranked issue list with reproduction steps.

**Proposed touch points:** new `docs/audits/<execution-date>/BASELINE.md`; the existing staged research files only after their preservation review; `context.md` for a concise current-state pointer. Read the dependency and release files before integrating the remote change.

**Exit:** all intended work is accounted for; no unknown staged content is swept into a commit; candidate/local/remote/live identities are recorded; the baseline names what has and has not been tested. Only proven inactive, disposable worktrees are removed.

## 5. Phase 1 — correctness, recovery and privacy

**Priority P0/P1. Outcome:** failures remain local and understandable; results always belong to the current selection and evidence.

### 1A. Reliable data loading

- Reuse one small browser data-loading layer for static JSON/binary resources: per-resource validation, bounded failure, explicit status and an intentional retry action.
- Deduplicate registry/province requests and parsing within a document, without sharing mutable view state. Make critical versus optional dependencies explicit.
- Release a rejected grid promise so a subsequent retry can work. A failed source must not become an empty successful dataset or a zero carbon value.
- Isolate version loading from optional reference catalogues. Show unavailable stock-history/NFI evidence explicitly where absence affects interpretation.
- Preserve existing selection revision protection. Test rapid province/box/import changes, language/metric changes and a response arriving after reset; only the current revision may update the result.

**Files:** `public/js/app.js`, `landscape.js`, `registry.js`, `forest-watch.js`, `stock-view.js`, `loss-view.js`, `sea-model.js`, `sea.js`, `world.js`; new focused `public/js/data-load.js` only if existing helpers cannot serve this role.

**Acceptance:** first grid request fails, Retry succeeds without refresh; optional 404/invalid JSON never prevents valid calculation/export; delayed old responses cannot overwrite a newer task; version and unavailable-source status remain accurate in TH/EN and exports.

### 1B. Narrow, explicit data contracts

- Define source/quantity metadata once at the appropriate layer: family, storage/display units, scale, observation period, retrieval date, version, coverage, licence, quality and withholding reason.
- Validate browser-consumed manifests and the evolving stock/loss snapshots as well as ingest outputs. A valid-looking number from the wrong period, pool or schema must fail visibly.
- Reuse existing pure model modules and schema/version patterns. Add JSDoc or focused checks at boundaries; a wholesale TypeScript conversion is outside this scope.
- Extend the existing value/figure/export checks to the quantities most exposed to drift, including annual stock quality flags, loss strips and the pending research conversions.

**Files:** `ledger.js`, `carbon.js`, `sea-model.js`, `assessment-export.js`, existing stock/loss tests and ingest validators; `scripts/capability-claims.mjs` and relevant research builders.

**Acceptance:** dimensional round trips are tested; malformed/mixed-version payloads fail before presentation; null, zero, unavailable and below-resolution remain distinct; official inventory, radar tree cover and plantation harvest do not acquire interchangeable labels.

### 1C. Privacy-safe URLs and messages

- The address bar, browser history and public links carry public geography, view, language and metric. Do not automatically serialize imported project geometry or arbitrary feature properties into any of them. Cancel pending `writeHash` timers on relevant transitions; sanitize the regional `returnURL` when capturing and restoring it.
- Treat legacy boundary fragments as untrusted local input: bounded size/coordinates/topology and a clear local-import choice. Consume and clear a private fragment deliberately rather than restoring it through later navigation. Define backward compatibility before changing existing links.
- Retain origin/frame checks on regional messages; validate message enums and size. Review fragment, query, form and filename handling together.
- Preserve fixed upstream allowlists, CSP, no-upload behavior and existing CSV formula defenses. Add response-size bounds and redirect/timeout checks where a reproduced upstream failure warrants them.

**Files:** `app.js`, `region-entry.js`, `sea.js`, `imports.js`, `src/geometry.js`, `server/world-data.js`, `functions/api/global.js`, privacy/security tests and `SECURITY.md`.

**Acceptance:** a synthetic private marker never enters requests, new address-bar/history entries, copied public links or public receipts. It cannot reappear after the 400ms timer, rapid selection changes, reset, Thailand ↔ SEA or Back/Forward. Legacy-fragment handling is tested separately. Oversized/malformed URL state cannot freeze the app; only valid same-origin/frame messages alter navigation; failed inputs leave the prior valid session intact.

## 6. Phase 2 — complete the user's working journey

**Priority P1. Outcome:** explore → understand → assess → save → reopen → revise → export, without needing the developer beside the user.

1. Add **Save draft / Open project** as explicit local-file actions available before calculation as well as afterward. Preserve incomplete form strings, boundary, provenance, imported-but-unapplied plot evidence and illustrative status. A draft has no calculated result; blank fields never become zero. Keep a completed assessment export distinct from a resumable project draft, with a documented versioned schema.
2. Validate imported structure, allowed fields, boundary, measurement evidence, units and supported method/version before replacing current state. Do not spread untrusted objects into application state or trust imported result/issued-credit fields. Recompute when inputs are complete. Support current valid exports through an explicit adapter; explain unsupported versions/methods. Set a bounded session-file limit from measured worst-case valid boundary-plus-plot exports so the app can reopen its own largest supported sessions.
3. Keep save/reopen browser-local. No silent localStorage/IndexedDB project cache or cloud upload. Add a restrained unsaved-work safeguard where the browser supports it; changing language/view must not prompt unnecessarily. Download feedback describes an export, not a guarantee that the user retained a file on disk.
4. Exercise Thailand ↔ SEA, browser Back/Forward, direct links, reload and TH/EN changes. Define one public navigation-state contract while preserving the iframe's current protection of Thai project inputs.
5. Put errors and recovery next to the relevant action. Keep method eligibility, missing evidence and unavailable data understandable. Never use a success-colored state for an unverified estimate.
6. Link each principal number to its actual equation, source, period and worked explanation. Preserve chapter/search state when moving between the Bible and its language editions.
7. Update TH/EN manuals around complete tasks using the current controls and small diagrams. Keep setup instructions separate from end-user operation.

**Files:** `app.js`, `assessment-export.js`, `imports.js`, `region-entry.js`, `i18n.js`, `bible.js`, `bible-search.js`, `manual.js`, `public/index.html`; proposed small `assessment-session.js` / `navigation-state.js` if needed; bilingual guides and existing walkthrough tests.

**Acceptance:** save/reopen works before calculation, after editing a calculated assessment, with unapplied plot evidence and at the largest supported session size. Drafts remain uncalculated; complete sessions recalculate the same unrounded result. Edited/untrusted results cannot assert issued credits; units/boundary changes invalidate stale results and plot expansion; cancel/rejected import preserves current work; language and geography transitions preserve inputs; sources and recovery actions remain reachable by keyboard.

## 7. Phase 3 — make it lighter and easier to maintain

**Priority P1/P2. Outcome:** lower measured task cost and less duplicated responsibility, with the accepted appearance intact.

### 3A. Loading and computation

- Measure initial national map, SEA, Bible and Research loads before optimizing. Existing lazy grid loading is preserved; do not eagerly fetch raster data merely to populate a status panel.
- Defer optional world/registry/digest/history work until it is needed when measurements show a benefit; keep enough information to identify pending/unavailable evidence.
- Optimize the large images actually fetched on the critical path. Keep original imagery/logos and their provenance hashes unchanged. Generate separately named display derivatives only where rights permit; preserve transparency, visual fidelity, dimensions and original downloads.
- Confirm compression/caching at the served URLs. Cache only public immutable/versioned assets where safe; prevent mixed-version data. Introduce no project-data service worker in the core scope.
- Keep the full bilingual Bible corpus unless profiling demonstrates a bottleneck. If splitting becomes justified, retain complete cross-language full-text search, chapter links, figures and sources; a smaller first file alone is insufficient.
- Profile polygon summation/validation before introducing workers or spatial indexing. A worker is conditional on demonstrated blocking, with cancellation/revision semantics and identical arithmetic.

### 3B. Component ownership and CSS

- Document the current design tokens and accepted exceptions in new `STYLE.md`.
- Map which existing stylesheet owns shared chrome, map instruments, readers and print behavior. Consolidate the most conflict-prone component first, inside the existing files; avoid another general override layer.
- Extract only duplicated, tested formatting/loading/navigation responsibilities. Retain pure carbon/geometry models and current conservation tests. Do not pursue a file-count reduction target or reformat the whole repository.
- Remove dead paths only after an import/caller/selector audit and rendered verification. Preserve historical assets where provenance/tests still use them; archive reference-only material with documented links rather than deleting it casually.

**Files:** affected existing CSS under `public/css/`, `type.css`, `workspace.css`, `ship.css`, `flat-controls.css`; current JS modules/builders, image derivatives/provenance manifest, `_headers`, new focused performance check and `STYLE.md`.

**Proposed budgets, to calibrate from phase 0:** no route regresses same-origin critical transfer by more than 5% without a documented task benefit; target at least 25% reduction where the measured waste justifies it; 36px/28px dense targets and existing geometry budgets remain protected. Default-font chrome budgets must not force clipping at 200% text size: complete labels and reachable actions take precedence. Track LCP ≤2.5s, CLS ≤0.1 and interaction response around 200ms as UX targets under named conditions. Laboratory checks are not field INP or a claim about the 75th percentile of real users. No production analytics is implied.

**Exit:** publish cold/warm before/after request bytes, timings and memory/long-task observations for changed flows; preserve results and geometry. If an optimization has no measured benefit or worsens the journey, omit it.

## 8. Phase 4 — current evidence, accessible use and research quality

**Priority P1/P2. Outcome:** users can tell what is known, how old it is and what to do next.

- Add a compact source-health/age view using existing provenance: observation period, retrieved date, expected refresh cadence, last successful check and explicit failures. Do not label a historical observation stale solely because its observation year is old; check the release cadence separately.
- Refresh accessible public GFW Watch, TGO/SEA/market snapshots through their existing ingest paths where newer valid releases exist. Review terms, masks, schema and source periods first. Show a diff and conservation checks; reject incomplete or inconsistent new inputs and retain the last known good snapshot.
- Review changed legal/methodology/ISO statements against named primary sources, with dated receipts in TH/EN. Do not automatically rewrite academic prose or claim new methodological approval.
- Reconcile research strips, Bible examples, source references and metadata. Improve findability and explanation at the decision point before adding more chapters. Keep complete uncertainties, counterexamples and source limitations.
- Run keyboard, focus, screen-reader spot checks, 200% text, reduced motion, contrast, print and native disclosure tests. Test native selects, tables, color-independent map legends and equation announcements.
- Verify Android Chrome and iPhone Safari installation instructions on actual devices when available. Distinguish installed web-app mode from offline operation. Report unavailable devices as unverified.

**Files:** existing ingest scripts, generated snapshots only through their pipelines, source manifests, research/Bible/guide authorship files and builders, `research.js`, reader CSS and relevant browser suites. A small source-status module may be added; credentials never enter public output.

**Acceptance:** data changes reconcile within their own accounting families; periods/versions/status travel into all exports and explanations; no lost qualifications in the research conversions; no serious/critical automated accessibility findings on changed flows, plus documented human checks. Automated accessibility results are not a formal conformance certification.

## 9. Phase 5 — releases that are reproducible, observable and recoverable

**Priority P0 for pinned revision; P1 for operations. These safeguards begin in the first delivery increment.**

1. Honor and resolve the captured commit in `createPristineTree`. If HEAD moves before export, export the captured revision or stop before publication. Test the A-captured/B-current race explicitly.
2. Bind build dependencies to the candidate lockfile. Prefer an isolated lockfile-controlled install using the normal package cache; benchmark alternatives before sharing installed modules. Record lock hash, Node/toolchain versions and build identity.
3. Serialize production uploads for this project. Allow independent work/testing in isolated branches, but reject or queue a second deployment clearly. Identify locks by owned process/start/commit; never kill shared machine runners by name.
4. Handle cancellation/failure with bounded cleanup of owned children and worktrees. Test interruption before and after build, unavailable credentials and cleanup failure. Preserve evidence before cleanup.
5. Write a durable, redacted release receipt outside the temporary checkout: revision/lock identity, gate verdicts, timing, failed/skipped checks, asset manifest and live-domain results. Do not print evidence paths that are deleted moments later.
6. Make exact-byte and security-boundary verification on both domains part of successful release completion, rather than a handoff reminder. Keep the existing live flow checks and target-identity protection.
7. Keep targeted developer checks fast and discoverable. Consolidate genuinely repeated setup/assertions, time each gate and retain failure artifacts. Full release verification remains mandatory; selective development checks do not silently replace it. Add deterministic fixtures before repeated expensive release attempts.
8. Rehearse restore of a previous release on a preview deployment, verify its bytes and workflows, then restore the candidate preview. Record the drill. Production rollback is a recovery action when needed, not a manufactured outage.

**Files:** `scripts/lib/release-tree.mjs`, `release-run.mjs`, `scripts/release.mjs`, suite runners, `live-verify.mjs`, `release-smoke.mjs`, release tests, `.github/workflows/ci.yml`, `docs/DEPLOYMENT.md`, `docs/OPERATIONS.md`; a small receipt helper if justified.

**Acceptance:** explicit-revision race and dependency mismatch cannot publish wrong bytes; cancellation leaves no owned orphan; receipts survive cleanup; simultaneous uploads cannot race; live PASS includes both domains; preview restore is demonstrated. A failed/unmeasurable gate stays failed, and real assertions are not retried into a green result.

## 10. Verification matrix and definition of done

| Area | Required proof |
| --- | --- |
| Calculation | Existing accounting/geometry/ledger tests; signed losses, method factors, periods, invalidation and unchanged conservation |
| Recovery | Fail-once network retry, optional-source outage, bad schema, partial/corrupt binary, rapid selection change and stale response |
| Session | Save/Open/recompute round trip; rejected/cancelled import; edited-result distrust; private-marker network and URL checks |
| Navigation | TH/EN, Thailand/SEA, language change mid-task, Back/Forward, direct chapter links and preserved inputs |
| Geometry | 390×844, 1024×768, 1440×900; actual operating viewport; relevant 1100/1101 and short-phone cases; 200% text and expanded/error states |
| MSH | Record combined chrome, map share, decision separation, section/row cost and source reachability; restoring each original defect must fail its own gate |
| Performance | Same named device/network/profile before/after; app versus tile/feed cost separated; response to first useful action measured |
| Accessibility | Automated test plus real keyboard/focus/disclosure and screen-reader checks; actual-device installation where available |
| Security | Input/schema/URL/message boundaries, CSV injection, private paths, CSP/headers, dependencies and redacted secret scans |
| Publication | Full release from the captured clean candidate, persistent receipt, matching commit/assets on both domains and live user-flow proof |

Reuse `npm test`, `npm run test:browser:all`, `npm run test:spatial`, the deep audit, existing falsifiers and `npm run test:release`. Add focused regressions for actual user failures rather than a parallel audit framework. Current corpus/gate counts are calculated, not copied permanently into assertions.

Done means code committed with agent trailer, pushed, deployed where applicable and verified live; user documentation is updated; the reviewed tree and artifact identities agree; no unexplained dirty files remain. Independent reviewers close every confirmed finding in writing, with any untested state named explicitly.

## 11. Delivery, ownership and approval gates

```mermaid
flowchart LR
 A["A · Baseline and safe releases"] --> B["B · Recovery and complete journeys"]
 B --> C["C · Measured loading and cleanup"]
 C --> D["D · Evidence, access and pilot readiness"]
```

| Increment | Included scope | Release decision |
| --- | --- | --- |
| A | Phase 0; pinned commit/dependencies, cleanup/receipt protection from phase 5; critical privacy/data-load fixes | First stable reconciled baseline |
| B | Remaining phase 1; local Save/Open, navigation and recovery from phase 2 | Complete resumable user journey |
| C | Measured phase 3 performance and component cleanup | Publish only changes with demonstrated benefit |
| D | Reviewed source refresh, research/manual/accessibility checks and preview restore evidence | Demonstration/pilot package with explicit capability boundaries |

One integration/release operator owns publication. Work can be divided into isolated lanes for data/contracts, workflow/UI, and release/performance tooling; a separate reviewer tests the finished changes. One lane owns a shared file at a time, and every handoff names its commit, files, checks and unresolved findings. No subagent independently deploys production.

Relative effort: A medium; B large; C medium and measurement-dependent; D medium plus participant/device/source-access dependencies. Phase 0 produces a tighter estimate. These are not calendar or cost guarantees; an evidence-dependent task is not silently replaced with a software assertion.

At each increment, provide a short changed/verified/remaining report, screenshots where relevant, the exact release and a rollback reference. Broader schema/privacy changes, paid services, more-than-30% file reductions, unsupported data rights or a new architectural dependency require an updated plan and explicit approval.

## 12. Optional follow-on scope: separate approval

- Authenticated high-resolution GFW parcel flux: confirm supported access, licence, quotas, geometry aggregation and uncertainty before promising a number. Membership alone is not integration. No credentials in browser code or reports.
- New biomass map comparisons, GEDI small-area estimation, trained AI or LLM explanation: separate scientific/access/cost evaluation. No generative model supplies carbon values or credit entitlement.
- Organizational/product footprint calculation: separate factor/version, scope, allocation and assurance contract; existing Bible teaching is not an implemented CFO engine.
- Cloud projects, accounts/collaboration, telemetry or full offline project caching: explicit new privacy, security, cost and operational scope.
- Participant study with intended Thai users and independent field validation: recruit/consent, tasks, success criteria and appropriate evidence. A formal accessibility or carbon-verification opinion needs qualified external work.

## 13. Prior art and reference methods

Existing implementation is the first reuse target: pure carbon/ledger/stock/loss models, the shared control helpers, browser/privacy suites, map-share and live-surface falsifiers, ingest conservation and exact-byte release smoke.

- [GoogleChrome Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci): borrow repeatable measurements and budget assertions. Begin with the existing Playwright harness; add development tooling only when it supplies otherwise missing evidence.
- [Deque axe-core](https://github.com/dequelabs/axe-core): use a pinned development/test-only accessibility engine when adding automated coverage; do not ship it to users or call its result certification.
- [Google Web Vitals guidance](https://web.dev/articles/vitals): loading, responsiveness and visual-stability targets; keep laboratory and actual-user evidence separate.
- Project references: `docs/MSH.md`, the owner's `_reference/` visual laws, `docs/OPERATIONS.md`, `docs/SHIP_READINESS.md`, bilingual guides/research, existing release tests and the November handoffs.

## 14. What exists at the approval gate

This plan and the read-only baseline observations are complete. Application code, data, the existing staged research work and production remain unchanged by this planning task. The application was not rebuilt against a dirty tree, and historical test receipts were not presented as fresh verification.

Independent planning review confirmed the named source-level risks and requested the draft-saving and address-bar/history privacy criteria now included above. This is review of the proposal, not implementation or a fresh full-system audit.

**Recommended approval:** execute the core in increments A → D, with the invariants and acceptance criteria above. Optional scope remains excluded until separately approved.
