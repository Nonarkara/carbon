# Operational readiness · 15 October 2026

## Scope of this release

Kabonna is an independent screening, teaching and supplied-measurement assessment tool. “Shippable” describes the released software inside that boundary; it is not a validation opinion, credit approval, ISO certification, uptime guarantee or assertion of novice usability.

| Capability | Available evidence | Boundary |
|---|---|---|
| Southeast Asia | Eleven-country map, comparison, dated source versions, export receipts | National context; no parcel biomass raster or regional project methodology |
| Thailand landscape | Province/grid conservation, stock/flux/fire/fossil source separation, three random-error scenarios and NFI discrepancy | Source-internal numerical checks; no independent field-accuracy claim |
| Thai project workbench | Supplied dated measurements, explicit method/parameters and browser-local exports | Applicability, rights, additionality, external review and issuance are not established by software |
| Organizational footprint | Bilingual study-design methods, worked teaching inventory and evidence planning | No complete CFO submission or country-specific factor engine |
| Public registry context | Dated project registration and issuance snapshot with source limits | No transfer, retirement or entitlement transaction |
| Bible / research | 65 paired chapters, 80 source entries, 24 original diagram topics in TH/EN | Authored interpretation with stated assumptions; not externally accredited training |
| User files | In-memory processing; explicit downloads | No upload, persistence, account or backup; refresh loses work |

## Remaining frontend audit findings

F01: reference links grouped in Read; map context grouped in Layers & Watch. F02/F04: native vertical flow and a minimum 340px map on constrained screens; actual navigation height reserved when text wraps. F03: one-pane tablet navigation through 1100px; no 700/701px three-rail collapse. F08: display/body/metadata roles, readable source text and scalable controls. F09: full white partner strip, installation and ISO context retained inside Research rather than permanently consuming map height. F10: one assessment navigation on phones/tablets, with secondary destinations under More. F11: Leaflet wrapper and children are square. F12: valid chapter links focus and scroll to the article, with a sticky Search / contents return.

F05–F07 are regression requirements: exactly one pressed view/assessment destination (zero in About), draw instructions separated from the legend, and stock observation year beside the stock quantity. Inspection of the handoff found `setNav()` still pressed a matching rail tab outside rail view; the condition now checks both view and tab.

No earned map, layer, world feed, chapter, partner identity or source qualification was removed. Menus open through native disclosure controls and preserve all existing destinations. The ledger is not rewritten.

## Acceptance evidence

Run `npm run build` before tests. `npm test` includes source/related-link integrity, diagram provenance and independently computed worked uncertainty arithmetic. Browser CI includes existing workflow, privacy, manual, scientific reader, regional map, flat UI and design tests, plus `scripts/ship-browser-test.mjs`. The new script checks 320×568, 375×667, 700×900, 701×900, 768×1024 and 1440×900 in both languages; source year; navigation state; toast/legend geometry; source/partner reachability; square controls; CSS text enlargement; chapter deep links and search/language persistence. Test helpers follow the real disclosures instead of forcing clicks through hidden controls.

Visual review opens real screenshots, revises the highest-severity finding and repeats up to three rounds. First-round finding: seven equal-width labels wrapped into a tall phone bar. Revised to four main destinations plus More, with scalable wrapping and measured bottom clearance for enlarged text. The next rendered pass identified crowded enlarged-text labels and a clipped native popup: wrapping controls, scaling measurement width, correcting disclosure overflow and reserving measured navigation height resolved those defects. The final screenshots and executable layout checks pass; no further visual iteration is claimed. Evidence: docs/audits/2026-10-15/ contains phone, reader and enlarged-text screenshots plus the numerical measurements.

Independent first-time-user testing, field validation, real project eligibility, physical-device installation and a formal accessibility audit remain unverified. These require suitable participants, evidence and authority; software tests cannot substitute for them.

Release gate: test → commit with Agent trailer → push → npm run deploy (production main) → inspect /version.json and exact public bytes on the custom domain and Pages URL → exercise the live regional/reader/workbench routes. Record actual results in the final handoff; never infer a deployment from a successful push.

## Verified before release

93/93 Node tests pass. Existing browser, bilingual scientific reader, Bible design, manual-led journeys, identity/standards, Forest Watch, regional map, privacy, flat-control and contrast/design checks pass. The new ship-readiness suite passes both languages at six widths, including CSS text enlargement and view/pressed-state agreement. npm audit reports zero vulnerabilities. Deployment/version and exact public-byte checks are performed after the committed release is uploaded.
