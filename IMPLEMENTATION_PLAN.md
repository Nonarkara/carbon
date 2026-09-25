# Forest Carbon Thailand — proposed pilot

Status: reviewable proposal, application implementation has not started.

## Outcome and critical decisions

A Thai-first, English-switchable assessment workbench. A user selects a boundary, sees source coverage and dates, enters or imports field evidence, and receives stock and monitoring-period estimates with an exportable audit trail. Issued credits are displayed only from an authoritative issuance record.

Recommend a single terrestrial pilot under a confirmed Standard T-VER methodology. Treat mangrove/peat soil accounting, nationwide model training, Premium T-VER and registry submission as later workstreams. An unapproved model's output remains a screening estimate.

## Exact Malaysia visual reference

Inspected `Nonarkara/Malaysia` at commit `6c4651bf525000555217cde55e5b7989b176e4cb` on 25 September 2026, including `public/index.html`, `public/css/app.css`, `context.md` and the README. Temporary read-only checkout: `/tmp/carbon-malaysia-reference`.

Design read: the Thailand project map dominates the page, with dated forest evidence and the calculation beside it in Malaysia's daylight chrome.

Named reference: the supplied Malaysia dashboard itself, including its documented JPS Public Infobanjir map/briefing arrangement. Reuse its actual CSS tokens and component geometry, not a new “forest green” dashboard theme.

- Paper `#f6f4ec`, wells `#edeadf` / `#fbfaf6`, navy ink `#1b2140`, yellow brand `#ffcc00`, accent `#7a6200`.
- Newsreader English masthead, Plus Jakarta Sans English body, IBM Plex Mono figures. Add non-looped IBM Plex Sans Thai for Thai text with sufficient line height; retain reference sizes and layout.
- Dark Leaflet basemap, 400 px desktop briefing rail, dense header/search/language controls, horizontal lenses, strong verdict rule, compact metrics and source rows.
- Preserve responsive bottom navigation and map/rail switching. Status colours communicate evidence quality; no “live” clock for historical imagery.
- Record the supplied reference palette and fonts as an explicit project exception to generic workspace defaults; the current user's exact-style instruction governs this project.

## Sacred items and boundaries

- Empty target workspace: no application content to replace or shrink.
- Reference repository remains unchanged. Copy selected presentation assets into the new project; do not import Malaysia's feeds or national statistics.
- Keep the map interactive. Never substitute a stock photograph or static card.
- Preserve raw evidence and quality flags; never turn missing values into zero.
- Clearly distinguish observed, modeled, illustrative, unavailable and issued values in both languages and exports.

## Proposed files and stages

### 1. Evidence-first working interface

- `[NEW] context.md`: visual contract, accounting invariant, project scope.
- `[NEW] public/index.html`, `public/css/app.css`, `public/vendor/`: Malaysia shell and fonts/Leaflet; Thai adaptation, favicon and project metadata.
- `[NEW] public/js/i18n.js`: complete TH/EN interface and export labels.
- `[NEW] public/js/map.js`: Thailand view, user-supplied GeoJSON boundary, area and exclusion validation; dated reference layers only when loaded.
- `[NEW] public/js/panels.js`: Project / Calculation / Evidence / Sources views; missing-evidence states; normalized regional context from this research.
- `[NEW] public/data/source-catalog.json`: curated resources, dates, licences, units and quality status. Do not ship all raw downloads to browsers.
- `[NEW] dev-server.mjs`, `package.json`: minimal local server and tests, following Malaysia's small static-module structure.

### 2. Reproducible assessment

- `[NEW] public/js/carbon.js`: pure unit-aware calculation functions, named parameter sets, baseline/previous-verification interval, signed losses and prescribed deductions. Never call a manually entered biomass value an AI result.
- `[NEW] public/js/imports.js`: validated plot CSV and GeoJSON imports, duplicate/overlap checks, explicit CRS requirements, bounded file sizes, safe text rendering.
- `[NEW] public/js/export.js`: bilingual assessment JSON/CSV containing inputs, formula/version, source timestamps, quality flags and result status. Report requires enough inputs to reproduce each number.
- `[NEW] tests/carbon.test.mjs`, `tests/imports.test.mjs`: meaningful accounting and malformed-data tests.

### 3. AI pilot, after data access

- `[NEW] scripts/ingest/`: per-source adapters, hashes, schema validation, quality quarantine; registered satellite access kept server-side.
- `[NEW] analysis/`: versioned feature processing, field-data split, simple baseline and Random Forest comparison, held-out evaluation and uncertainty. Prefer existing approved-model outputs when available.
- `[NEW] model-card.md`: actual training extent/dates, intended forest types, held-out errors, limits and approval status. No prediction layer until a real model or approved imported assessment is available.
- Keep heavy geospatial processing outside the browser; serve precomputed, dated results. Start with files and a small job database only when jobs are necessary.

## Verification plan

1. Numeric fixtures: kg/tonne and rai/hectare conversions; mixed strata; baseline vs previous credited interval; losses; fire branches; absent data; source already in tCO₂e; prohibited double counting.
2. Data checks: row schemas, year bounds, units, coordinates, resource checksums; quarantined examples remain excluded. Download success alone never makes a resource usable.
3. Browser journeys at 390 px and desktop: Thai/English switch, map interactions, import invalid/valid files, edit inputs, inspect formulas/sources, export and reproduce the result.
4. Compare the rendered interface with Malaysia's current reference at matching viewport sizes. Verify Thai glyphs and overflow.
5. Pilot acceptance: reproduce an independently calculated field project; evaluate predictions on held-out plots. Confirm applicable acceptance criteria with TGO/VVB rather than inventing an accuracy threshold.
6. Commit → push → deploy → verify the specific live journeys. Repository and deployment target are not yet configured; this research folder is not a deployed product.

## Decision for review

Approve stages 1–2 as the first deliverable: a working Malaysia-style TH/EN workbench with the extracted reference data and transparent calculations. Stage 3 requires a pilot boundary, field measurements and an approved-model integration or a separate model-validation effort.
