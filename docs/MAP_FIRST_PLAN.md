# Map-first carbon dashboard — 26 September 2026

User authorization: make the system immediately usable, show provinces and selected-area calculations, expose vegetation/aerosol layers, add simultaneous global carbon/market context, push GitHub and publish carbon.nonarkara.org.

## Preserve
Existing Leaflet map, 77-province ledger, measured-project calculator, imports/exports, layer toggles, About illustrations and research notebooks. Landscape stock, flux, emissions and issued credits remain separate; no aerosol-to-carbon conversion. No ledger regeneration or hand edits.

## Scope
- Compact header and map-led three-column desktop: global context / map / selected-area calculation. Explanatory paragraphs remain in Research. Responsive mobile views preserve every control.
- Visible province, arrow area-selection and layer controls. Province ranking selects a province. Default forest layer; draw supports drag or two taps, cancel, and a clear calculated result.
- Show substituted arithmetic for current selection, sources/periods and unavailable/coarse data. Existing ledger still accessible.
- Public same-origin API fetches allowlisted NOAA daily CO2, GB half-hour carbon intensity, RGGI auction and EU CBAM reference prices, independently cached with dated fallback snapshots. GCB annual emissions and World Bank market indicators are reference figures. No invented live global credit price or inferred revenue from forest stock.
- Research/guide additions explain sources, refresh behavior and new user path.
- Bind the requested Cloudflare custom hostname using existing account access.

## Verification
Unit parser/cache/failure tests plus ledger conservation. Browser tests preserve all earned flows; add first-entry controls, province arithmetic, drawing, global-data failure labels and mobile views. Secret scan, dependency audit, independent review, CI, live custom-domain version and browser checks.
