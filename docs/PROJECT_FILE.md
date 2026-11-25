# Browser-local Carbona project file v1

`format: "carbona-project"`, `schemaVersion: 1` is a resumable draft, distinct from schemaVersion 1 assessment reports. No stored result is used. Files remain in memory and are downloaded/opened explicitly; no upload, localStorage or IndexedDB.

Allowed form keys: start, end, unit, previous, current, group, burnedPercent, canopyDeath, fireEmissions, inputSource, fireSource. Values are strings so incomplete blank fields survive. Unit/group/canopy enums must be supported. Project name ≤150 characters; other form strings ≤300.

Boundary is a GeoJSON geometry/feature/collection revalidated with the existing WGS84, Thailand screening rectangle, 50 features/20,000 vertices, topology and area constraints. Provenance is restricted to name, sha256, tier and importedAt. Plot rows are restricted to plot_id, tree_id, plot_area_m2, dbh_cm, height_m, at most 10,000 rows. Imported plot totals are recomputed. Applying plots requires confirmed equation, boundary, AGB/general factors and an exact current total matching the recalculation.

The method code/version/tool must match the current supported method. Unknown object properties (including results, issuance claims, URLs or script-like keys) are not adopted into application state. The legacy assessment adapter accepts current schema-1 completed reports, whitelists inputs and recomputes results with current supported factors; edited results have no authority.

Maximum file: 16 MiB UTF-8 JSON. Original boundary and CSV uploads each allow 2 MiB; JSON escaping can expand their text, so the project envelope allows both and metadata. The 10,000-row round-trip regression verifies supported evidence count. Save enforces the same byte ceiling as Open, ensuring the app does not issue a draft it then rejects by file size. File-system durability remains the user's/browser's responsibility.

Opening is transactional: parse/validate/recompute into a temporary value, confirm replacement if dirty, then adopt only named fields. A cancelled file picker, failed validation or declined replacement leaves the current valid task intact. Each asynchronous file operation carries a session revision so a delayed operation cannot replace a newer reset/import.

Drafts reopen without a calculation. Completed legacy reports recalculate. Neither workflow issues or verifies credits. Manual save only clears the leaving-page reminder once a download is requested; it cannot prove that the browser retained the file.
