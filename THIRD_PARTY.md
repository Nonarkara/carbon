# Third-party attribution

## Visual source

The layout, palette and reference CSS are adapted from **Nonarkara/Malaysia**, commit `6c4651bf525000555217cde55e5b7989b176e4cb`, at the repository owner's explicit request. `public/css/malaysia.css` preserves that reference; application-specific changes are in `public/css/app.css`. Malaysia's operational feeds and data were not imported.

## Software and fonts

| Component | Licence | Use |
|---|---|---|
| Leaflet 1.9.4 | BSD-2-Clause | Self-hosted map library |
| Turf packages | MIT | Geometry validation and geodesic area; dependency versions in package-lock.json |
| Newsreader | SIL Open Font License | English display typography |
| Plus Jakarta Sans | SIL Open Font License | English body typography |
| IBM Plex Mono | SIL Open Font License | Numbers |
| IBM Plex Sans Thai | SIL Open Font License | Non-looped Thai text |
| esbuild | MIT | Build-time bundling |
| marked | MIT | Build-time guide generation |
| Playwright | Apache-2.0 | Development browser tests |

Font and Leaflet notices are included in `public/vendor/licenses/`. Bundled JavaScript retains applicable legal comments. npm packages retain their own licence files.

## Data and map services

Province CSV records originate from Saraburi and Kanchanaburi government catalogues through data.go.th, retrieved 25 September 2026. The resource inventory and manifests retain source URLs and declared licences. No blanket software licence applies to third-party data, PDFs, maps or fonts. Some raw research has missing/conflicting licence metadata and must not be assumed free for every reuse.

OpenStreetMap tiles: © OpenStreetMap contributors, ODbL data attribution and applicable tile-use policy. Esri World Imagery: Esri, Maxar, Earthstar Geographics and the service's contributing providers. Attribution is visible on the map. Neither provider's basemap is used as a dated carbon measurement.

Public research snapshots are sanitized: upstream token patterns and API-key values embedded in provider resource URLs were removed before publication. Original acquisition hashes are preserved separately from sanitized public-file hashes. Requests needing credentials require your own authorized access.

## Carbon map data

Derived aggregates in `public/data/ledger/` are computed from the sources below by `scripts/ingest/build_ledger.py`. Versions, DOIs, URLs, retrieval dates and SHA-256 of every source file are in `public/data/ledger/manifest.json`. Aggregation does not change any provider's terms.

## TGO T-VER registry snapshot

`public/data/tgo/tver-forestry.json` is a dated, attributed extract of the public T-VER database at [tver.tgo.or.th](https://tver.tgo.or.th/database/public/projects/1/1) (Thailand Greenhouse Gas Management Organization, TGO) and the OTC trading report at [carbonmarket.tgo.or.th](https://carbonmarket.tgo.or.th/). TGO publishes the listing without login and links every record back to its own page; this snapshot does not republish TGO credentials. Reuse terms are not stated on the T-VER database; the snapshot carries attribution, a snapshot date and SHA-256 of every raw page. The carbon map's T-VER block and the project boundary check use this file as context only — they are not an integration with TGO, not a verification, and not an issuance.

| Source | Terms | Use |
|---|---|---|
| TGO T-VER project list and detail pages (`tver.tgo.or.th/database/public/...`) | Public registry listing; no reuse licence stated. Dated, attributed extract with raw-page SHA-256 in `data/tgo/tver-forestry.json` | 257 FOR&AGR projects, expected reductions, issuances, provinces, methodology |
| TGO OTC credit trading JSON (`carbonmarket.tgo.or.th/modules/home/ajax_pbi_data_event.php`) | Public report endpoint, no reuse licence stated | Forestry credit price and volume by calendar year |

Province assignment uses only the `จ.` / `จังหวัด` markers in TGO's own address text. Twelve cases that lacked a marker were reviewed by hand with reasons recorded in `scripts/ingest/tgo_province_overrides.json`; six projects name no site in TGO's text and are honestly labelled "no province named" rather than guessed.

| Source | Licence / terms | Attribution |
|---|---|---|
| ESA CCI Biomass v7.0 (2020), DOI 10.5285/6429d1aafe1e43b9b414e4a5a7f8b903 | ESA CCI data policy: free use with acknowledgement and DOI citation | Santoro, M.; Cartus, O. — ESA Climate Change Initiative (Biomass_cci) |
| JAXA ALOS-2 PALSAR-2 Forest/Non-Forest v2.1.0 (2020) | [JAXA Terms of Use of Research Data](https://earth.jaxa.jp/policy/en.html): use, modification and redistribution with credit; notify JAXA before commercial use | ©JAXA / EORC — "The original data used for this product have been supplied by JAXA's PALSAR-2 FNF" |
| Global Forest Watch forest carbon flux v1.4.3 (data-api v20260327) | CC BY 4.0 | Harris et al. 2021, Nature Climate Change; Gibbs et al. 2025, Earth System Science Data; Global Forest Watch / WRI |
| GFED5.1, DOI 10.5281/zenodo.16794692 | CC BY 4.0 | van der Werf, Chen et al., Global Fire Emissions Database |
| ODIAC2025, DOI 10.17595/20170411.001 | CC BY 4.0 | Oda, T. and Maksyutov, S., NIES |
| Thailand subnational boundaries (COD-AB v01) | CC BY-IGO | Royal Thai Survey Department, via OCHA / HDX |
| Thailand FREL/FRL submission to the UNFCCC (modified July 2021) | Government publication, cited not redistributed | Royal Thai Government / RFD — national forest inventory figures used for the national check |
| Copernicus Global Land Service LC100 v3.0.1, 2017 forest-type layer | CC BY 4.0 | Buchhorn et al., Copernicus Global Land Service — downloaded for a stratification test that was rejected; no published figure depends on it |
| ESA CCI Biomass v7.0 aggregated 10 km and 25 km AGB and SD | ESA CCI data policy | Used only to calibrate the uncertainty model |
| Climate TRACE API v7 (2024) | CC BY 4.0 | Climate TRACE coalition |
| Thailand First Biennial Transparency Report (2024) | Government publication, cited not redistributed | Department of Climate Change and Environment |
| NASA GIBS imagery (atmosphere layers, requested live) | NASA open data | NASA EOSDIS Global Imagery Browse Services; VIIRS, AIRS, OCO-2 science teams |

Province names used to match GFW and Climate TRACE records come from GADM identifiers returned by those services; no GADM geometry is redistributed.

## Author portrait

`public/images/dr-non.jpg`: Dr Non Arkaraprasertkul portrait from his [RMIT Vietnam profile](https://www.rmit.edu.vn/research/hubs/rmit-vietnam-smart-and-sustainable-cities-hub/people/dr-non-arkaraprasertkul), used at the subject's request on 25 September 2026. Source asset: https://www.rmit.edu.vn/content/dam/rmit/vn/en/assets-for-production/images/hubs/smart-sustainable-cities/people/non-arkarapra.jpg . No blanket open-image licence is claimed; portrait rights are separate from application code.

### GFW Forest Watch / UMD/GLAD + WUR

Integrated Deforestation Alerts, accessed through GFW / Global Nature Watch: [primary metadata](https://data-api.globalforestwatch.org/dataset/gfw_integrated_alerts), CC BY 4.0. Province summary `gadm__integrated_alerts__adm1_daily_alerts v20261005`, 5 September–4 October 2026, tree-cover 2022 mask; derived confidence totals and daily chart in `public/data/gfw/watch.json`. These are dated investigation signals, not verified deforestation, tonnes or credits. Legacy summary excludes the newer global DIST-ALERT layer. Exact queries, attribution and raw-file hashes are included in the public snapshot; private raw files stay outside public/.
