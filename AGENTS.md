# Forest Carbon Thailand — project instructions

Read `context.md`, the bilingual guides, and `RESEARCH.md` before changes. User approved the implementation plan and GitHub/Cloudflare release.

**`docs/MSH.md` is the owner's design law — Massacre Spatial Hallucination. Read it before designing, building, or reviewing any interface, at any viewport.** When you find SH, massacre it: an interface that invents a reason for things to occupy space, instead of arranging them around how people read, choose and act. The test for every region is "Why is this here? Why this size? Why this far from that?" — "the grid put it there" is a failed answer. Measure the geometry; do not judge it from a screenshot. `scripts/spatial-gate.mjs` guards the shells, `scripts/spatial-deep-probe.mjs` audits the content, `scripts/lib/msh-law.mjs` is the instrument for chrome cost and the law's symptom classes (giant top bar, overlapping chrome, inflated control, empty hero, equal weight, unreachable content, nested scroll area), `scripts/spatial-detector-self-test.mjs` proves every detector can fail, and `scripts/msh-table-proof.mjs` proves the table repair cannot come back. A table wider than its column scrolls in ONE place: the `.table-scroll` frame the builders emit (`scripts/lib/table-wrap.mjs`), never inside the table itself. Capture 390×844, 1024×768 and 1440×900. Report found / changed / verified / remaining, and never claim a clean pass while anything remains.

- Preserve the exact Malaysia visual reference; do not replace the map or existing flows with cards.
- Keep stock, monitoring-period estimates and issued credits separate. No connected model or registry may be implied without a real integration.
- User files remain browser-local unless a future request explicitly changes privacy scope.
- A unit or parameter transition must never silently reinterpret a baseline or retain a stale plot expansion. Run browser regressions after related changes.
- Source periods and quality labels travel into display and exports. Historical province records are context, never parcel carbon inputs.
- Do not republish upstream credentials from catalogues. Raw-file hashes may predate public sanitization; see evidence-checks.json.
- Validate new geometry/CSV behaviors in `tests/`; test phone navigation in a browser.
- Carbon map: landscape figures never feed the workbench. Never add rows from different datasets; the only net is GFW's own. Regenerate `public/data/ledger/` only through `scripts/ingest/build_ledger.py`; never hand-edit it. Keep `tests/ledger.test.mjs` conservation checks green and cite every manifest dataset version in both research notebooks.
- Release: test → commit with agent trailer → push → `npm run deploy` → verify live browser and `/version.json`. Push alone does not deploy.
- Public assets live in `public/` only. Never expose `.env`, raw research, npm modules or internal metadata through the server.
