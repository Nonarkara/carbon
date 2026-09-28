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


## Carbon map, About tab and research chapter 06 — 26 September 2026

Scope: landscape ledger (stock, forest flux, fire, fossil CO₂, cross-checks), atmosphere context layers, illustrated TH/EN About tab, research notebook section 06. No credit, eligibility or approved-method claim.

- **Conservation (automated, `tests/ledger.test.mjs`, 14 new tests; 28 total pass):** provinces, grid cells and a box over Thailand reproduce the national total for every quantity; split boxes add to the whole; land area 515,415 km² vs COD-AB attribute 515,416 km² and official 513,120 km² (+0.45%); conversion factor identical in pipeline, ledger and T-VER workbench (2.18863); rows from different datasets never totalled; missing flux stays null; resolution guard uses the shorter box side.
- **Pipeline self-checks (`scripts/ingest/build_ledger.py`):** GFED category partitions equal the GFED total each year; GADM crosswalk 77/77 one-to-one, GFW province areas within 6.7% of COD-AB; ODIAC nothing unallocated in the processing window, pixel allocation within 0.3% of a cell-centre alternative. A rebuild reproduced every data file byte-for-byte; only the manifest's pipeline hash changed when the script changed.
- **Independent reproduction:** Chiang Mai all-vegetation AGB recomputed from the raw CCI tiles with `rasterio.mask` and spherical cell areas: within 0.31% of the pipeline. GFW national removals, emissions and net: sum of 77 province rows equals GFW's own country table (0.000% difference).
- **External cross-checks:** ODIAC 2024 Thailand 290.0 MtCO₂ vs BTR1 2022 CO₂ excluding LULUCF 271.1 Mt (Table 2-3; different scope and year). BTR1 Table 2-184 values transcribed from the report text. RFD 2020 forest area 31.64% read from the RFD workbook.
- **Adversarial review:** a fresh reviewer given only the notebooks, manifest, data and code, instructed to find errors, returned 1 P1 and 11 P2 findings plus P3 wording. All were fixed: Grassi et al. 2023 gap re-attributed to bookkeeping models; GFED savanna classes described as largely deciduous forest in Thailand; overlap wording widened; "runs no model of its own" qualified; FNF used three ways with the real layer name; allocation and border exclusion stated precisely; GFW partial variance acknowledged; XCO₂ inversions acknowledged; fossil cross-check scope stated; box resolution about 2.8 km and side-length guard (code changed and tested); Thai sampling wording; source attribution per table row; units and periods for Gibbs et al.
- **Browser (Playwright, 1440/1280/768/390/375 px, TH and EN):** app opens on the carbon map with national figures matching `provinces.json`; province selection, drawn box, overlays and ledger export; About tab renders nine illustrations with ledger-driven figures and no page overflow; all earlier workbench, guide and research-notebook regressions pass.
- **Not verified:** GFW flux inside drawn boxes (30 m grids need a GFW API key; shown as not ingested); CCI map bias against Thai field plots; native-speaker editorial review of new Thai text.


## Audit, calibrated uncertainty and forest-inventory check — 29 September 2026

- **Adversarial audit of the TGO material** (fresh reviewer, read-only, recomputed from the snapshot): 10 P1 findings, all fixed in both languages — unsourced prices and fees removed, "issuance cliff" replaced by issuance by registration cohort (56% / 40% / 2%), Standard/Premium 246/11, crediting periods measured from the registry, coordinates located in registration PDFs, Climate Change Bill status dated, Thai table errors (Nan, Doi Tung REDD+, ranges), Glocker 2009 attributed to what it measured, name phonology corrected, first-person เรา removed.
- **Block uncertainty model**: `calibrate_blocks()` in `scripts/ingest/build_ledger.py` compares the model with ESA's 2020 aggregated SD on every build (results in `manifest.json` → `uncertainty.calibration`). Tests: a box over Thailand reproduces the national block variance; floor ≤ central ≤ ceiling for the nation and all 77 provinces; the calibration ratio stays between 1 and 2.
- **Second adversarial review** (fresh reviewer on the new estimation claims): conclusions held; fixed the headline range to include the FREL's own allometric underestimate (Table 10), §14's "by forest type" contradiction, plot years 2013–2018 (reference year 2017), the Sylvera quote, the NFI mean CI (delta method, ±5.0 not ±7.5), "biomass carbon stock" labelling, and softened "reproduces" to "consistent with" after finding ESA's aggregates come from processing run v202509 vs v202510 tiles. Added the 50 km calibration (1.32×, 18 cells) and a test running all 77 province polygons through the browser path (stock −11%/+6%, central SD −9%/+3%, medians within 1%).
- **National inventory check**: `scripts/ingest/nfi_check.py` → `public/data/ledger/nfi-check.json`. `tests/nfi.test.mjs` recomputes the inventory totals from the FREL tables, checks the FREL carbon-stock column equals AGB × (1 + RS) × 0.47 × 44/12 per type, and fails if the implied density of extra tree cover ever drops below the inventory's evergreen mean (the condition for the published "reads high" conclusion).
- **Source files**: CCI 2017 tiles, JAXA FNF 2017 tiles, CCI 10/25 km aggregates and the CGLS forest-type layer (MD5 69218596142578cade43efadec6e1e06, matching Zenodo) are in `research/raw/landscape/` with SHA-256 in `fetch-log.json`. RFD forest polygons (data.go.th / data.forest.go.th) sit behind a bot challenge and were not used.
- **Not verified**: the inventory's own allometric bias; CCI bias by province (no provincial inventory means are published); CarbonWatch's accuracy claim (not on its page).
