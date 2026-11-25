# Deployment / การเผยแพร่

Production project / โครงการ: `forest-carbon-thailand` on Cloudflare Pages.
Primary URL / เว็บไซต์หลัก: https://carbon.nonarkara.org
Cloudflare alias: https://forest-carbon-thailand.pages.dev
Source / ซอร์ส: https://github.com/Nonarkara/carbon

## Release sequence / ขั้นตอนออกรุ่น

1. `npm ci && npm run build && npm test`
2. `npm run test:spatial` — the law's instrument, as one command. It builds, starts this project's own server on a port it chooses, and measures that server. Never measure a layout against a server whose `/version.json` does not carry a commit: another project on port 8788 will otherwise be measured and reported as this one.
3. `npm run test:browser:all` — every browser suite against the same kind of self-started server. For a single flow, `npm run test:browser` is enough.
4. Scan secrets with `gitleaks git --redact` and `gitleaks dir public --redact`; run `npm audit`.
5. Commit source, tests and docs with an `Agent: codex` or appropriate attribution trailer; push to main.
6. `npm run deploy` runs `scripts/release.mjs`: it checks the tree is clean, captures the exact commit, obtains the project release lock, exports that revision into a pristine worktree, and runs an isolated `npm ci --include=dev` there. It builds, runs unit tests, the full browser suites, spatial gates and deep audit, then uploads those measured bytes with `--branch main`. A caller's changed HEAD or mutable `node_modules` cannot replace the captured source/dependencies.
7. Release completion waits for the captured commit, walks the live primary domain, and verifies every public artifact, security headers, private-path exclusion and public-feed envelopes on **both** domains. Only then, after owned-resource cleanup, does it print PASS. Inspect the durable receipt printed by the command; `npm run test:release` remains available for an independent exact-byte check from the same build.

การ build หลัง commit ทำให้ version ตรงกับซอร์สที่เผยแพร่ ต้องตรวจรุ่นบน URL หลัก ไม่ใช้เพียงข้อความสำเร็จจาก Wrangler เป็นหลักฐาน ส่วน GitHub Actions ตรวจ build/test แต่ไม่ได้ deploy อัตโนมัติ การ deploy สร้าง build จากสำเนา commit ที่สะอาด (pristine worktree) ไม่ใช่จากโฟลเดอร์ที่ทำงานอยู่ เพื่อให้ไฟล์ที่แก้ไขค้างอยู่ของใครไม่หลุดเข้าไปในรุ่นที่เผยแพร่

รุ่นใหม่ยึด commit ที่จับไว้ตั้งแต่เริ่ม แม้ HEAD ในโฟลเดอร์ทำงานจะเปลี่ยนภายหลัง ติดตั้ง dependency จาก lockfile ของรุ่นนั้นในโฟลเดอร์แยก ไม่ยืม `node_modules` จากผู้เรียก มีล็อกไม่ให้เผยแพร่โครงการเดียวกันพร้อมกัน และตรวจไฟล์จริงกับขอบเขตความปลอดภัยบนทั้งสองโดเมนก่อนรายงาน PASS

## Release ownership and receipts / เจ้าของงานและหลักฐานออกรุ่น

The lock and receipts live under the repository's **common Git directory**, in `carbon-release/` (normally `.git/carbon-release/`), outside `public/` and outside the disposable build. `production.lock/owner.json` records PID, acquisition time, commit and an ownership token. A second release fails clearly; it never kills or replaces the first. If the owner crashed, inspect that exact PID/process and worktree before removing a stale lock. Do not delete a lock merely because another release is slow. SIGINT/SIGTERM abort only process groups created by this release, stop retries, save a cancelled receipt and attempt cleanup.

Each receipt records source revision, candidate lock SHA-256, Node/npm versions, dependency mode, gate exit codes/attempts/timings, both-domain outcomes and cleanup status. `assets.json` records every public file's size and SHA-256. Receipts do not capture environment variables, credential values, child stdout or user project files. A verified upload with failed cleanup still exits unsuccessfully; inspect `cleanupErrors` rather than assuming PASS. Git metadata must be retained to retain these local receipts; copy a reviewed receipt into the audit record when permanent archival is needed.

ล็อกและหลักฐานอยู่ใน Git metadata ไม่อยู่ในเว็บสาธารณะหรือโฟลเดอร์ชั่วคราว หลักฐานเก็บ commit, hash ของ lockfile, รุ่นเครื่องมือ, ผลและเวลาของแต่ละ gate, ผลทั้งสองโดเมน และสถานะเก็บกวาด ไม่เก็บ environment, token, stdout หรือไฟล์โครงการของผู้ใช้ หากเจ้าของงานหยุดกะทันหัน ให้ตรวจ PID และ worktree ที่ตรงกันก่อนปลดล็อก ห้ามหยุด runner อื่นด้วยชื่อโปรเซส การยกเลิกจะหยุดเฉพาะลูกของงานนี้และเก็บสถานะ cancelled ไว้

## Credentials / ข้อมูลรับรองสิทธิ

Use Wrangler's existing OAuth login or scoped environment variables `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Do not print token values. No token goes into `public/`, source, exports or documentation. The application needs no runtime API key.

ใช้ OAuth ของ Wrangler หรือ environment variables ที่จำกัดสิทธิ ไม่ใส่ token ในไฟล์หน้าเว็บ ซอร์ส เอกสาร หรือผลส่งออก ตัวแอปไม่ต้องใช้ API key ระหว่างทำงาน

## Platform choice and rollback / รูปแบบและย้อนรุ่น

This is a Direct Upload Pages project. It does not use Cloudflare's Git integration. The authenticated maintainer deploys explicitly after tests; repository pushes alone do not change production. To reproduce a prior release, check out its commit in a separate clean directory, run `npm ci`, build/test, and deploy to the same Pages project. Keep the previous commit and evidence until rollback is verified. Do not delete the Pages project to roll back.

ใช้ Direct Upload โดยผู้ดูแลที่มีสิทธิเผยแพร่หลังทดสอบ หากย้อนรุ่น ให้ checkout commit เดิมในโฟลเดอร์แยก ติดตั้ง build/test แล้ว deploy เข้า project เดิม เก็บหลักฐานรุ่นเดิมจนตรวจการย้อนรุ่นผ่าน ไม่ต้องลบ Pages project

## Cache and routes / แคชและเส้นทาง

Version, JS and CSS use revalidation through `_headers`. `404.html` avoids treating arbitrary paths as valid app routes. Guides are generated as `/guide-th.html` and `/guide-en.html`. A map tile outage affects the background, not locally computed boundaries or arithmetic. Do not introduce a service worker without testing stale-version behavior.

Route checks / เส้นทางที่ต้องตรวจ: `/`, `/guide-th.html`, `/guide-en.html`, `/version.json`, `/data/source-catalog.json`, `/bible.html`, `/research-th.html`, `/research-en.html`, `/data/scientific-audit.json`, `/api/global`, and a nonexistent path (must return 404). Run `node scripts/release-smoke.mjs` for version, exact asset bytes, headers, private-path exclusion and public-feed checks. See OPERATIONS.md for recovery procedures.
