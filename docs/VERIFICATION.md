# Verification record — 25 September 2026

Release scope: browser-local assessment pilot; source data, calculations and exports. No trained AI model, uncertainty validation, registry or issuance integration was tested or claimed.

## Automated checks

- 14 Node tests passed: conversions, signed losses, missing values, fire thresholds, invalid dates, exact TGO appendix coefficients, plot area expansion, duplicate tree IDs, CSV quoting, geometry holes, overlaps and self-intersections.
- Playwright passed example arithmetic, JSON provenance, language switching, losses, unknown-fire rejection, CSV import, unit-switch invalidation, factor edits, boundary replacement, malformed geometry rejection, reset and mobile navigation.
- Layout exercised at 1440, 1280, 768, 390 and 375 pixels. Both published-guide routes render three workflow diagrams each without horizontal document overflow.
- npm audit: zero reported vulnerabilities at check time.
- Gitleaks: sanitized research and public assets passed; reachable Git history passed after upstream catalogue credentials were removed before its first public push.

## Independent adversarial review

A fresh reviewer reproduced two P1 problems in Chromium: baseline reinterpretation when applying plot AGB to an existing tCO₂e input, and stale expanded biomass after a factor edit followed by boundary replacement. Both were fixed. The reviewer independently repeated the original sequences and confirmed that required inputs are now cleared and no misleading result is produced. Browser regression cases are part of `scripts/browser-test.mjs`.

## Visual and operational limits

- Reference: actual Malaysia CSS/fonts/layout, supplemented with Thai fonts and bounded responsive grid. Desktop Thai and phone screenshots were inspected.
- `npx axiom-audit public --strict` could not run: the npm registry returned 404 for `axiom-audit`. This is an unavailable check, not a passed check. Visual inspection and executable overflow/navigation checks were used; the documented user-requested Malaysia palette exception remains intentional.
- No independent native-speaker editorial review has been performed. Thai instructions and UI were authored and visually checked; no external language-review claim is made.
- Basemap tile availability depends on third-party providers. Raster biomass, formal inventory sampling validity, official approval and field accuracy remain outside this release.
- See live deployment evidence added after release, including the served Git version and public-browser test results.
