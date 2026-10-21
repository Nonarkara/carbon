# Shared geography workspace

The user's screenshots showed two independent application headers, a desktop map column stretched by a longer evidence column, and eleven oversized country rows extending the page. The previous gap gate did not protect this composition.

Both maps now share one CSS contract for the identity, geography, Read and language bar: 56px desktop, 50px phone. Switching from Thailand mounts the regional document underneath that same bar, keeping Thai inputs in their original document. Returning restores those inputs; reloading still clears them. A direct regional URL offers the same header and return selector. No input persistence or upload is added.

Map, Compare 11 and Research are distinct views. Desktop map and evidence share the available viewport; evidence scrolls independently. Phones add an Evidence view. This removes both the empty map-column tail and the unbounded stack of evidence, comparison and research. All ten country metrics, equations, sources, JSON/CSV exports, all eleven country rows and nine research routes remain accessible. Country rows use a compact name/ISO line; the table scrolls beneath sticky column headings.

Locale changes are sent to the existing regional frame, rather than reloading it: the active view, search, country, metric and map survive. Same-origin framing is allowed explicitly; cross-origin framing remains blocked. Parent/child messages validate origin and frame identity and carry only UI state.

Verification: independent TH/EN review at1440/1024/390; repeated automated checks at320/390/768/1024/1440. Phone map/evidence/compare/research fit the viewport without page overflow. The new workspace regression measures total document height and row height, switches locale while searching, and returns to an unchanged Thai project field. Existing short-phone, enlarged-text, keyboard map, exports, privacy and dataset-conservation checks remain required. Numerical inputs and upstream snapshots are unchanged.
