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

## Live deployment evidence

Verified against https://forest-carbon-thailand.pages.dev on 25 September 2026:

- Served `version.json` identified application commit `e8f7426`.
- `BASE_URL=https://forest-carbon-thailand.pages.dev npm run test:browser` passed the complete browser flow suite above against the public deployment.
- Both Thai and English guides, source catalogue and application JavaScript returned HTTP 200 with redirects followed. The served application JavaScript SHA-256 matched the local build.
- Unknown paths and non-public research files returned HTTP 404. CSP, frame denial and MIME sniffing protection were present.
- Chromium and curl succeeded. Python urllib requests received HTTP 403; that client-specific behavior remains unexplained and is not represented as a successful check.
- GitHub's initial test job passed build, unit tests, dependency audit and browser flows. Its secret-scanning action failed before scanning because its initial-push range referenced the nonexistent parent of the root commit. Local reachable-history scanning passed; a subsequent push runs the action over an ordinary commit range.

The release build embeds its current Git commit in `/version.json`; documentation-only releases can therefore have a later identifier than the application commit tested above. Deployment is Cloudflare Pages Direct Upload, not automatic deployment on Git push.


## Research page addition — 25 September 2026

Added Thai/English research notebooks with four accessible ordered diagrams each, eight-section contents navigation, linked primary sources, dated RFD observations, and the author portrait attributed to RMIT. No calculator equations or inputs were changed. Research opens separately to preserve browser-memory inputs.

Local verification passed all 14 unit tests and the existing browser regressions. Added browser cases at 1280, 768 and 375 pixels exercise both language links, all research diagram counts, author section navigation, decoded portrait, no document overflow, language switching and preservation of the project name in the original workbench. Desktop English, phone Thai and phone workbench screenshots were visually inspected. npm audit reported zero vulnerabilities. Release verification repeats this suite against the public URL; CI results are available in GitHub Actions.
