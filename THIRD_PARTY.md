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

| Source | Licence / terms | Attribution |
|---|---|---|
| ESA CCI Biomass v7.0 (2020), DOI 10.5285/6429d1aafe1e43b9b414e4a5a7f8b903 | ESA CCI data policy: free use with acknowledgement and DOI citation | Santoro, M.; Cartus, O. — ESA Climate Change Initiative (Biomass_cci) |
| JAXA ALOS-2 PALSAR-2 Forest/Non-Forest v2.1.0 (2020) | [JAXA Terms of Use of Research Data](https://earth.jaxa.jp/policy/en.html): use, modification and redistribution with credit; notify JAXA before commercial use | ©JAXA / EORC — "The original data used for this product have been supplied by JAXA's PALSAR-2 FNF" |
| Global Forest Watch forest carbon flux v1.4.3 (data-api v20260327) | CC BY 4.0 | Harris et al. 2021, Nature Climate Change; Gibbs et al. 2025, Earth System Science Data; Global Forest Watch / WRI |
| GFED5.1, DOI 10.5281/zenodo.16794692 | CC BY 4.0 | van der Werf, Chen et al., Global Fire Emissions Database |
| ODIAC2025, DOI 10.17595/20170411.001 | CC BY 4.0 | Oda, T. and Maksyutov, S., NIES |
| Thailand subnational boundaries (COD-AB v01) | CC BY-IGO | Royal Thai Survey Department, via OCHA / HDX |
| Climate TRACE API v7 (2024) | CC BY 4.0 | Climate TRACE coalition |
| Thailand First Biennial Transparency Report (2024) | Government publication, cited not redistributed | Department of Climate Change and Environment |
| NASA GIBS imagery (atmosphere layers, requested live) | NASA open data | NASA EOSDIS Global Imagery Browse Services; VIIRS, AIRS, OCO-2 science teams |

Province names used to match GFW and Climate TRACE records come from GADM identifiers returned by those services; no GADM geometry is redistributed.

## Author portrait

`public/images/dr-non.jpg`: Dr Non Arkaraprasertkul portrait from his [RMIT Vietnam profile](https://www.rmit.edu.vn/research/hubs/rmit-vietnam-smart-and-sustainable-cities-hub/people/dr-non-arkaraprasertkul), used at the subject's request on 25 September 2026. Source asset: https://www.rmit.edu.vn/content/dam/rmit/vn/en/assets-for-production/images/hubs/smart-sustainable-cities/people/non-arkarapra.jpg . No blanket open-image licence is claimed; portrait rights are separate from application code.
