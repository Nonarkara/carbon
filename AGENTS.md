# Forest Carbon Thailand — project instructions

Read `context.md`, the bilingual guides, and `RESEARCH.md` before changes. User approved the implementation plan and GitHub/Cloudflare release.

- Preserve the exact Malaysia visual reference; do not replace the map or existing flows with cards.
- Keep stock, monitoring-period estimates and issued credits separate. No connected model or registry may be implied without a real integration.
- User files remain browser-local unless a future request explicitly changes privacy scope.
- A unit or parameter transition must never silently reinterpret a baseline or retain a stale plot expansion. Run browser regressions after related changes.
- Source periods and quality labels travel into display and exports. Historical province records are context, never parcel carbon inputs.
- Do not republish upstream credentials from catalogues. Raw-file hashes may predate public sanitization; see evidence-checks.json.
- Validate new geometry/CSV behaviors in `tests/`; test phone navigation in a browser.
- Release: test → commit with agent trailer → push → `npm run deploy` → verify live browser and `/version.json`. Push alone does not deploy.
- Public assets live in `public/` only. Never expose `.env`, raw research, npm modules or internal metadata through the server.
