# One-line regional controls

Country, map metric and view now share a single 53px toolbar. Visible auxiliary labels are replaced by their existing accessible native labels. Desktop keeps direct view buttons; phones use a native View selector with all four options. No bottom navigation or wrapped button block is needed. Data, evidence, exports, research and retained Thai inputs are unchanged.

The reported screenshot contained new HTML controls but neither their new layout nor translated labels, consistent with a mixed asset generation. Build output now pins page CSS and entry scripts to SHA-256 content versions. The initial Evidence fallback is Thai. Tests validate hashes against actual bytes and simulate obsolete bare CSS/JS URLs; the page must use the pinned URLs and retain a single row. Live release smoke tests check the versioned URLs as well as bare assets. This addresses the observed failure pattern without asserting which cache layer produced the original screenshot.

Map height derives from measured chrome instead of a fixed toolbar allowance. Country fitting skips zoom animation so navigation does not briefly stretch locator dots across the map. Checks cover Thai/English at320/390/768/1024/1440, aligned control centres, <=54px toolbar, all four views, language/search retention, exports, keyboard and enlarged text.
