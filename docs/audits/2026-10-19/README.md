# Release audit · 19 October 2026

Baseline source and both public domains reported 9ebc990. The earlier report's clean suites did not cover tablet navigation contrast, both locator dots, or sticky sidebar/header intersections. An independent reviewer reproduced the findings and re-reviewed the implemented changes at 1440/1024/390px.

| Finding | Evidence | Correction |
|---|---|---|
| P1 tablet navigation | At 1024px inactive labels were white on native rgb(239,239,239), approximately 1.15:1. Transparent backgrounds previously applied only through 700px. | Set flat transparent backgrounds in the actual <=1100px operating shell. New contrast checks cover 390/700/701/768/1024/1100, both languages, More and selected states. |
| P2 sticky reader overlap | With header bottom at 66px, index/source rails stuck at 0px and their headings disappeared under the header. | Measure the header border box; use it for sticky top, available height and scroll margins. Test 126px expanded header as well. |
| P2 regional text enlargement | Fixed 16px line heights collided with doubled status/label text. Header's no-wrap composition broke the brand. | Unitless line heights and natural group wrapping. Preserve normal-text map screen budgets. |
| P2 small-country controls | Singapore/Brunei locator circles had click handlers but no keyboard role, name or selected state. | Reuse the polygon's Enter/Space contract; localized country names and pressed states on polygons and locators. |
| P2 manual mismatch | Phone instructions described older top-level Evidence/World navigation and Research buttons. | Explain Read→About and More→Evidence/Sources/World in both guides and task-first introductions. |

The Bible prose measure is constrained to 65ch; diagrams and tables retain their usable columns. Existing bundled type, palette, original diagrams, sharp corners and shared shadow prohibition remain. No cards replace maps; no scientific data, factors, user-file privacy or issuance claims change.

Screenshots are actual rendered Chromium captures. Wider review captures at 1440/1024/390 and full regression receipts are generated into ignored test-results/oct19/. The committed images show the tablet before/after, enlarged regional text and unobstructed reader rails.

The new `scripts/release-audit-browser-test.mjs` is included in CI. It enforces contrast, locator keyboard/translation/state, text enlargement, sticky rails under changing header heights and current manual paths. Existing ship tests preserve F05–F07; existing regional tests preserve header ≤64px, map start ≤170px and ≥300px map visible at normal text sizes.

Independent software review is not field validation, independent novice usability research, a formal accessibility certification or a credit-issuance audit. Dated open-data snapshots retain their original periods; this release does not refresh source observations.

Local release results: 93/93 Node tests; npm audit zero vulnerabilities; browser, client, manual, privacy, design, academic, Bible design, flat UI, Forest Watch, SEA, ship and new release-audit browser suites pass. The independent reviewer reran the new suite successfully. Deployment and live results are verified after the committed build is uploaded.
