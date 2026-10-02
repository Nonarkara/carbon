# Maintaining the Carbon Bible

- `content.mjs`: paired Thai/English chapters, stable IDs, categories, sources, calculation paths and related links.
- `scripts/build-bible.mjs`: primary source catalogue; source versions read from the deployed ledger manifest; examples calculated with `carbon.js` and `ledger.js` against deployed data.
- `public/js/bible.js`: native reader, language, deep links, print and copy.
- `public/js/bible-search.js`: shared pure bilingual search with Unicode normalization, AND terms and exact-phrase ranking.
- `public/js/bible-diagrams.js`: accessible SVG illustrations with translated labels; all illustrations have an equivalent text path.
- `public/css/bible.css`: flat Bauhaus reader, responsive layout and print rules.

Run `npm run build` before `npm test`. Generated `public/bible.html` and `public/data/bible.json` are ignored and rebuilt for every deployment; they carry the current Git commit. Do not edit generated files or the ledger data by hand.

When adding a displayed number, add its quantity family to `coverage`, explain its equation and denominator in the appropriate chapter, cite the authoritative source, and link the app display to that stable chapter ID. Keep dates, units, source versions and limitations together. A source in the catalogue does not imply an API integration or endorsement. Keep organizational inventories, landscape context, project estimates, issuance and retirement separate.

Browser verification receipt for 2026-10-02: Thai/English at 375, 768 and 1440 px, no horizontal overflow; all chapter source cards visible; zero button shadows. Search for Scope 2, language preservation, no-result messaging and clear recovery were checked in the native reader. Existing map/calculation regression, design and manual walkthrough scripts passed. This is authored and mechanical review, not an independent usability trial or carbon verification opinion.

Scientific extension: `academic.mjs` adds four paired chapters (29 total). The full bilingual `docs/ACADEMIC_AUDIT.*.md` is injected into the audit chapter and research section 15. `scripts/scientific-audit.mjs` rebuilds numerical diagnostics from read-only ledger inputs with SHA-256 provenance. These diagnostics do not measure field accuracy. `research/scientific-sources.json` records the targeted source review and contrary findings.
