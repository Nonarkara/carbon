# Deployment / การเผยแพร่

Production project / โครงการ: `forest-carbon-thailand` on Cloudflare Pages.
Primary URL / เว็บไซต์หลัก: https://carbon.nonarkara.org
Cloudflare alias: https://forest-carbon-thailand.pages.dev
Source / ซอร์ส: https://github.com/Nonarkara/carbon

## Release sequence / ขั้นตอนออกรุ่น

1. `npm ci && npm run build && npm test`
2. Start `npm run dev`, then `npm run test:browser`.
3. Scan secrets with `gitleaks git --redact` and `gitleaks dir public --redact`; run `npm audit`.
4. Commit source, tests and docs with an `Agent: codex` or appropriate attribution trailer; push to main.
5. `npm run deploy` rebuilds using the committed Git SHA and uploads only `public/`.
6. Inspect `/version.json`, security headers, TH/EN guides and `BASE_URL=https://carbon.nonarkara.org npm run test:browser`.

การ build หลัง commit ทำให้ version ตรงกับซอร์สที่เผยแพร่ ต้องตรวจรุ่นบน URL หลัก ไม่ใช้เพียงข้อความสำเร็จจาก Wrangler เป็นหลักฐาน ส่วน GitHub Actions ตรวจ build/test แต่ไม่ได้ deploy อัตโนมัติ

## Credentials / ข้อมูลรับรองสิทธิ

Use Wrangler's existing OAuth login or scoped environment variables `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Do not print token values. No token goes into `public/`, source, exports or documentation. The application needs no runtime API key.

ใช้ OAuth ของ Wrangler หรือ environment variables ที่จำกัดสิทธิ ไม่ใส่ token ในไฟล์หน้าเว็บ ซอร์ส เอกสาร หรือผลส่งออก ตัวแอปไม่ต้องใช้ API key ระหว่างทำงาน

## Platform choice and rollback / รูปแบบและย้อนรุ่น

This is a Direct Upload Pages project. It does not use Cloudflare's Git integration. The authenticated maintainer deploys explicitly after tests; repository pushes alone do not change production. To reproduce a prior release, check out its commit in a separate clean directory, run `npm ci`, build/test, and deploy to the same Pages project. Keep the previous commit and evidence until rollback is verified. Do not delete the Pages project to roll back.

ใช้ Direct Upload โดยผู้ดูแลที่มีสิทธิเผยแพร่หลังทดสอบ หากย้อนรุ่น ให้ checkout commit เดิมในโฟลเดอร์แยก ติดตั้ง build/test แล้ว deploy เข้า project เดิม เก็บหลักฐานรุ่นเดิมจนตรวจการย้อนรุ่นผ่าน ไม่ต้องลบ Pages project

## Cache and routes / แคชและเส้นทาง

Version, JS and CSS use revalidation through `_headers`. `404.html` avoids treating arbitrary paths as valid app routes. Guides are generated as `/guide-th.html` and `/guide-en.html`. A map tile outage affects the background, not locally computed boundaries or arithmetic. Do not introduce a service worker without testing stale-version behavior.

Route checks / เส้นทางที่ต้องตรวจ: `/`, `/guide-th.html`, `/guide-en.html`, `/version.json`, `/data/source-catalog.json`, `/bible.html`, `/research-th.html`, `/research-en.html`, `/data/scientific-audit.json`, `/api/global`, and a nonexistent path (must return 404). Run `node scripts/release-smoke.mjs` for version, exact asset bytes, headers, private-path exclusion and public-feed checks. See OPERATIONS.md for recovery procedures.
