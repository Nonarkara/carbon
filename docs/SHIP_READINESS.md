# Operational readiness · 28 October 2026

## Scope of this release

Kabonna is an independent screening, teaching and supplied-measurement assessment tool. “Shippable” describes the released software inside that boundary; it is not a validation opinion, credit approval, ISO certification, uptime guarantee or assertion of novice usability.

| Capability | Available evidence | Boundary |
|---|---|---|
| Southeast Asia | Eleven-country map, comparison, dated source versions, export receipts | National context; no parcel biomass raster or regional project methodology |
| Thailand landscape | Province/grid conservation, stock/flux/fire/fossil source separation, three random-error scenarios and NFI discrepancy | Source-internal numerical checks; no independent field-accuracy claim |
| Thai project workbench | Supplied dated measurements, explicit method/parameters and browser-local exports | Applicability, rights, additionality, external review and issuance are not established by software |
| Organizational footprint | Bilingual study-design methods, worked teaching inventory and evidence planning | No complete CFO submission or country-specific factor engine |
| Public registry context | Dated project registration and issuance snapshot with source limits | No transfer, retirement or entitlement transaction |
| Bible / research | 68 paired chapters, 87 source entries, 24 original diagram topics in TH/EN | Authored interpretation with stated assumptions; not externally accredited training |
| User files | In-memory processing; explicit downloads | No upload, persistence, account or backup; refresh loses work |

## The capability matrix is measured, not asserted

Every number this product publishes is a claim about itself, and a claim that has drifted is a
lie told by a document. `scripts/capability-claims.mjs` reads each published figure out of the
page or document that prints it, reads the truth out of the data the site ships, and refuses to
pass when the two disagree. It runs in `npm run test:spatial`, so a release cannot ship with a
capability matrix that no longer describes the product.

It is written against the data rather than against literals. A gate that hardcoded “68
chapters” would keep passing while the product grew underneath it, and would begin failing —
falsely, with a message that reads like a broken site — the day somebody added a chapter. The
gate compares the published figure with the shipped corpus, so adding a chapter makes the gate
name the page that must be updated, which is the correct outcome.

The figures it covers: the Bible's chapter and source counts and its original diagram topics;
the research notebook's chapter count; the eleven Southeast Asian countries; the seventy-seven
provinces; the T-VER registry record count and the projects without issuance; and the eleven
historical province-year observations. `docs/SHIP_READINESS.md` and `README.md` are checked
against the same data, so the prose cannot drift away from the product either.

## Frontend audit findings, and where they stand

F01: reference links grouped in Read; map context grouped in Layers & Watch. F02/F04: native vertical flow and a minimum 340px map on constrained screens; actual navigation height reserved when text wraps. F03: one-pane tablet navigation through 1100px; no 700/701px three-rail collapse. F08: display/body/metadata roles, readable source text and scalable controls. F09: full white partner strip, installation and ISO context retained inside Research rather than permanently consuming map height. F10: one assessment navigation on phones/tablets, with secondary destinations under More. F11: Leaflet wrapper and children are square. F12: valid chapter links focus and scroll to the article, with a sticky Search / contents return.

These are no longer only a list in a document: each is enforced by `scripts/ship-browser-test.mjs`, which runs in CI and in the browser suite at 320×568, 375×667, 700×900, 701×900, 768×1024 and 1440×900 in both languages, with text enlargement, navigation state, source reachability and square controls.

F05–F07 are regression requirements: exactly one pressed view/assessment destination (zero in About), draw instructions separated from the legend, and stock observation year beside the stock quantity. Inspection of the handoff found `setNav()` still pressed a matching rail tab outside rail view; the condition now checks both view and tab.

No earned map, layer, world feed, chapter, partner identity or source qualification was removed. Menus open through native disclosure controls and preserve all existing destinations. The ledger is not rewritten.

## Acceptance evidence

Run `npm run build` before tests. `npm test` includes source/related-link integrity, diagram provenance and independently computed worked uncertainty arithmetic. Browser CI includes existing workflow, privacy, manual, scientific reader, regional map, flat UI and design tests, plus `scripts/ship-browser-test.mjs`. The new script checks 320×568, 375×667, 700×900, 701×900, 768×1024 and 1440×900 in both languages; source year; navigation state; toast/legend geometry; source/partner reachability; square controls; CSS text enlargement; chapter deep links and search/language persistence. Test helpers follow the real disclosures instead of forcing clicks through hidden controls.

The law runs as one command: `npm run test:spatial` builds, starts this project's own server on a port it chooses, measures that server and stops it. Its gates are the table wrappers, the spatial gate, the regional two-line header, the detector self-test, the table proof, the navigation falsifier, the live-surface falsifier and the capability claims; `--deep` adds the 582-page content audit. `npm run deploy` runs it, so a release cannot ship without the law passing.

Three of those gates exist because a gate that cannot fail is worse than no gate, because it is trusted:

- `scripts/spatial-detector-self-test.mjs` proves every detector can fail.
- `scripts/live-surface-falsifier.mjs` breaks every published surface on purpose — twenty DOM defects and three corpus defects, where the site is served a corpus the page is not holding — and requires the live verification's own assertions to catch each one.
- `scripts/browser-nav-falsifier.mjs` proves the shared navigation helper retries a timeout and does not retry anything else, and that a real failure reaches the caller with its cause intact.

Both runners report the whole census: every gate runs and every verdict is listed, so a broken build does not cost one fix cycle per defect.

Visual review opens real screenshots, revises the highest-severity finding and repeats up to three rounds. First-round finding: seven equal-width labels wrapped into a tall phone bar. Revised to four main destinations plus More, with scalable wrapping and measured bottom clearance for enlarged text. The next rendered pass identified crowded enlarged-text labels and a clipped native popup: wrapping controls, scaling measurement width, correcting disclosure overflow and reserving measured navigation height resolved those defects. The final screenshots and executable layout checks pass; no further visual iteration is claimed. Evidence: docs/audits/2026-10-15/ contains phone, reader and enlarged-text screenshots plus the numerical measurements.

Independent first-time-user testing, field validation, real project eligibility, physical-device installation and a formal accessibility audit remain unverified. These require suitable participants, evidence and authority; software tests cannot substitute for them.

Release gate: test → commit with Agent trailer → push → npm run deploy (production main) → inspect /version.json and exact public bytes on the custom domain and Pages URL → exercise the live regional/reader/workbench routes. Record actual results in the final handoff; never infer a deployment from a successful push.

## Verified before release

129/129 Node tests pass. Existing browser, bilingual scientific reader, Bible design, manual-led journeys, identity/standards, Forest Watch, regional map, privacy, flat-control and contrast/design checks pass. The ship-readiness suite passes both languages at six widths, including CSS text enlargement and view/pressed-state agreement. The law's own gates pass as one command, and the capability matrix agrees with the shipped data. npm audit reports zero vulnerabilities. Deployment/version and exact public-byte checks are performed after the committed release is uploaded.
