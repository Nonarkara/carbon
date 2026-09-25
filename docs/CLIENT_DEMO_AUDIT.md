# Client demonstration audit — 26 September 2026

Scope: bilingual map and research, province and area selection, deterministic arithmetic, exports, global feeds, mobile/laptop layout, identity and standards claims. This is an engineering review, not an independent scientific validation, ISO conformity assessment or penetration test. No LLM is needed or connected to the numeric calculations.

## Confirmed issues fixed

- Small-area stock was withheld in one display but exposed in another. Withholding now applies to ledger rows, headline, formula and exports.
- Fossil selections ignored the served 2.8 km grid floor. They now respect it, even though ODIAC's upstream grid is finer.
- Empty/coarse selections exposed numeric values in exports. Values and associated uncertainty/category fields are null; no empty-cell zero claims.
- Imported-boundary ledger exports lacked geometry. They now include the selected GeoJSON.
- Expert menu could intercept Project controls on compact laptop screens. Selecting a tool closes the menu.

## Checks

- 36 deterministic tests: stock/period distinction, signed losses, allometry, unit transitions, geometry validity, province/grid/national conservation, resolution guards, feed parsing/fallback dates.
- Browser regression: Thai/English, 375–1440 px, project imports, synthetic example, export provenance, selection, preserved inputs across Research, figures and source links.
- Dedicated client checks: all four marks load on white, immediate Dr Non profile, bilingual standards links, 1280 px menu behavior.
- Dependency audit and secret scan; existing CSP restricts browser scripts/connect requests to this site. No API secrets are shipped. User project files stay in browser memory. External tile requests and server-side public feed retrieval are disclosed.

## Claims suitable for a demonstration

An open-data landscape screening tool with transparent equations and an illustrative T-VER workbench. Reference years and resolutions are shown. ISO 14064-2 and 14064-3 are mapped to selected supported practices, not declared full compliance. ISO 14065 concerns external verification bodies. Organisation marks do not prove endorsement.

## Limits that remain

- Not issued credits, a trained forest model, an approved remote-sensing platform or an accredited verifier.
- ESA/JAXA stock is 2020; GFW flux is a 2001–2025 average. They are not today's parcel measurements.
- GFW flux grids for arbitrary areas are not ingested; missing flux stays unavailable.
- The served 2.8 km grid cannot support small-parcel claims. Fire data is approximately 28 km. Fractional allocation and polygon sampling approximate local coverage.
- Generic root:shoot and carbon factors are declared assumptions. Displayed uncertainty excludes model bias and factor uncertainty; it is not complete project uncertainty.
- Independent field validation, eligibility, legal rights, baseline/additionality, monitoring and third-party verification remain project work.
- Global feeds may fail, lag or change schema. Dated cache/snapshot fallbacks are labelled. Quarterly prices are not real-time trading quotes; no global voluntary-credit spot price is claimed.

Reproduce: `npm test`, `npm run test:browser`, `npm run test:client`. Set `BASE_URL=https://carbon.nonarkara.org` for deployed browser checks. Current deployed commit is available at `/version.json`.
