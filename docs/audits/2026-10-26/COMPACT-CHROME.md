# Compact chrome, working map tools

The user reported that two rows of controls still consumed too much of the map. The task is to choose geography and evidence while keeping the map dominant.

## Found and changed

| Region | Before | After, pointer input | Repair |
| --- | --- | --- | --- |
| SEA chrome, 390×844 | 104px | 68px | Same controls and type sizes; smaller block padding and 28px control targets |
| SEA chrome, 1024×768 / 1440×900 | 109px | 68px | Same shared bar, no extra status band |
| Bible header, phone | 61px | 33px | Remove idle padding; preserve navigation and language |
| Bible header, desktop | 65px | 38px | Fit identity and controls to their contents |
| Thailand geography | 44px-wide selector beside permanent search field | 188px-wide selector at 390px | Place search opens on demand from a labelled magnifying-glass disclosure |
| Desktop evidence rail | 710px in a 739px row | Follows its row | Remove legacy `viewport − 190px` maximum |

Touch inputs receive 36px targets instead of the pointer's 28px. Text enlargement may grow controls. This is a scoped density policy, not a claim of accessibility certification. Reading paragraphs, source qualifications, maps, diagrams and data remain present.

## Functional defects exposed by the audit

- Photon search was blocked by production CSP, used unsupported `lang=th`, and read coordinates from properties instead of GeoJSON geometry. The policy now permits only the specific Photon origin; Thai uses the service's `default` language. An actual upstream probe returned 400 for `th` and 200 for `default`.
- Search could replace a newer query with a slow older response. A request revision prevents that. Failure and empty results have visible statuses. The disclosure states that place queries go to Photon; project files stay local.
- Moving keyboard focus to a search result hid that result. Focus now remains inside the disclosure until the user leaves it; Tab, arrows, Enter and Escape work.
- Measurement covered the carbon legend. It now shares Leaflet's bottom-right control stack, above zoom.
- Measurement captured clicks while inactive, crashed when enabled or panned before its first point, and could trigger province navigation while measuring. Guards and propagation handling keep these modes separate.
- Area conversion incorrectly used 4,000m² per rai. It now uses 1,600m², with numerical regression assertions. These approximate map measurements remain orientation tools.

## Evidence and release gates

- `scripts/sea-header-proof.mjs`: TH/EN, eleven viewport shapes, four views, complete native selector labels, aligned reset, pointer chrome ≤72px; coarse-pointer chrome ≤88px and controls ≥36px. Restoring the old heights must fail the actual chrome budget.
- `scripts/map-tools-browser-test.mjs`: TH/EN pointer/touch; readable geography, no measure/legend overlap, controlled GeoJSON search, stale response, keyboard result activation, pan-before-first-vertex, measurement clear/done/inactive, language switching. Included in the browser suite runner.
- `scripts/live-verify.mjs`: extends deployment's existing live gate to the Thailand example calculation and matching JSON export, guide diagrams/anchors, research portrait/diagrams/anchors, both languages and phone/desktop. Checks production search policy and successful search or explicit service-unavailable feedback.
- Existing spatial, deep-content, privacy, scientific conservation and exact-byte release gates remain required.
- Independent review reproduced the defects, then verified the country width, keyboard selection, pan, measurement and CSP repairs. Two real map clicks after a Bangkok search produced a 6.84km distance without a page error.

### Captures

[390×844](compact-sea-390.png) · [1024×768](compact-sea-1024.png) · [1440×900](compact-sea-1440.png)

These checks establish the named layouts and interactions. They do not certify upstream uptime, cadastral accuracy or issued credits.
