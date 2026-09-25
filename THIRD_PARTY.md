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

## Author portrait

`public/images/dr-non.jpg`: Dr Non Arkaraprasertkul portrait from his [RMIT Vietnam profile](https://www.rmit.edu.vn/research/hubs/rmit-vietnam-smart-and-sustainable-cities-hub/people/dr-non-arkaraprasertkul), used at the subject's request on 25 September 2026. Source asset: https://www.rmit.edu.vn/content/dam/rmit/vn/en/assets-for-production/images/hubs/smart-sustainable-cities/people/non-arkarapra.jpg . No blanket open-image licence is claimed; portrait rights are separate from application code.
