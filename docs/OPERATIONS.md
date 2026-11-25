# Operating the assessment pilot / การดูแลระบบนำร่อง

Release operator: the authenticated maintainer of [Nonarkara/carbon](https://github.com/Nonarkara/carbon), the project under Dr Non's public profile. This document establishes a runbook, not a support SLA or a promise of continuous human monitoring. Current scope: public evidence exploration and reproducible browser-local assessment; no credit issuance service.

ผู้เผยแพร่คือผู้ดูแล repository ที่มีสิทธิ Cloudflare เอกสารนี้เป็นวิธีดูแลระบบ ไม่ใช่ SLA หรือคำรับประกันว่ามีผู้เฝ้าตลอดเวลา ขอบเขตคือสำรวจหลักฐานและคำนวณนำร่องในเบราว์เซอร์ ไม่ใช่บริการออกเครดิต

## Before a client demonstration / ก่อนสาธิต

1. Build the intended clean commit: `npm ci`, `npm run build`, `npm test`. Check `npm audit` and redacted Gitleaks scans. Use the release sequence in DEPLOYMENT.md.
2. `npm run deploy` now includes live-flow proof and exact-byte/security smoke on both domains. Review its durable `.git/carbon-release/receipts/` record (use Git's common directory when running from another worktree). For an independent check from the exact same build, run `BASE_URL=https://carbon.nonarkara.org node scripts/release-smoke.mjs` and repeat for `https://forest-carbon-thailand.pages.dev`. All public artifacts must match, not just a handpicked file list.
3. Run `BASE_URL=https://carbon.nonarkara.org npm run test:manual` and `BASE_URL=https://carbon.nonarkara.org node scripts/academic-browser-test.mjs`. These simulate users; they do not replace a recruited usability study.
4. Open Thai and English. Choose Chiang Mai; inspect the stock year and random-error limitation. Select a small area and see withheld values. Use the illustrative project and confirm 218.86 tCO₂e; export JSON. Show the scientific audit when asked about accuracy.
5. Preserve exported records before refreshing or closing. Example inputs are synthetic. Use an independent field dataset before representing any output as a real project assessment.

ก่อนสาธิตให้ตรวจรุ่นบนโดเมนหลัก เปิดทั้งไทยและอังกฤษ เลือกจังหวัด ดูปีและข้อจำกัด เลือกพื้นที่เล็กแล้วเห็นค่าที่งดแสดง ทดลองข้อมูลสมมติและส่งออก JSON ต้องเก็บผลก่อนปิดหรือรีเฟรช ห้ามใช้ตัวอย่างแทนผลประเมินโครงการจริง

## Recovery / เมื่อเกิดปัญหา

| Symptom / อาการ | Response / วิธีจัดการ |
|---|---|
| World feed fails / ข้อมูลโลกขัดข้อง | Read the observation date and fallback/unavailable label. A fallback preserves its original date. Refresh when the upstream recovers; do not replace missing data with zero. / อ่านวันที่เดิมและป้ายข้อมูลสำรอง ไม่แทนค่าขาดด้วยศูนย์ |
| Map tiles fail / ภาพแผนที่ขัดข้อง | Published ledger and arithmetic remain local, but visual navigation is degraded. Use the province selector; disclose the outage. / ใช้รายการจังหวัดและแจ้งข้อจำกัดภาพ |
| Reader/build version differs / รุ่นไม่ตรง | Stop the demonstration on the stale revision. Check primary-domain `/version.json`, rebuild the clean commit, deploy explicitly, rerun smoke checks. / ตรวจ version แล้ว build/deploy รุ่นที่ถูกต้อง |
| Imported file rejected / ไฟล์ไม่ผ่าน | Follow the manual's CRS, size, topology and CSV rules. Keep zero-tree survey plots in the external analysis; do not discard them to pass the importer. / แก้รูปแบบตามคู่มือ ไม่ลบแปลงว่างเพื่อให้ผ่าน |
| Wrong scientific result suspected / สงสัยตัวเลขผิด | Preserve JSON, source version, original evidence and the commit. Reproduce with synthetic inputs in a public issue; keep private project files private. / เก็บหลักฐานและใช้ข้อมูลสมมติแจ้งปัญหาสาธารณะ |

## Rollback / ย้อนรุ่น

Record the last known good commit and deployment URL before replacing it. Use a separate clean checkout of that commit; install/build/test; deploy to `forest-carbon-thailand`; run the smoke check from that checkout. Reconfirm `/version.json` and the affected workflow. Never delete the Pages project. No project database exists to migrate; user-held exports remain their records. A procedure is not a performed rollback drill; this audit does not claim one.

เก็บ commit และ URL รุ่นเดิม ใช้ checkout แยกที่สะอาด ติดตั้ง build/test แล้ว deploy โครงการเดิม ตรวจรุ่นและขั้นตอนที่มีปัญหาซ้ำ การมีขั้นตอนนี้ไม่เท่ากับการซ้อมย้อนรุ่นสำเร็จ

### Interrupted release / งานเผยแพร่ถูกขัดจังหวะ

Read the receipt's `status`, phase codes and cleanup verdict first. A failed assertion is not retried. A runner's recognised interruption is retried once; explicit operator cancellation is never retried. Missing Cloudflare credentials make upload fail after measurement, with the failed phase retained; no credential value is written to the receipt. A release lock error means another owner or a stale owner record needs inspection, not that the application failed its tests. Confirm the exact PID/start/commit before clearing a stale lock; never send signals to shared runners by name.

อ่าน status, ผลแต่ละขั้น และ cleanup ในหลักฐานก่อน ความผิดจริงของ assertion ไม่ถูกลองซ้ำ การยกเลิกโดยผู้ดูแลไม่ถูกลองซ้ำ ข้อมูลรับรอง Cloudflare ไม่พร้อมทำให้ upload ล้มเหลวและมีหลักฐาน โดยไม่เก็บค่าลับ ข้อผิดพลาดล็อกหมายถึงต้องตรวจเจ้าของงาน ไม่ใช่สรุปว่าแอปทดสอบไม่ผ่าน

For a restore drill, deploy the last known good commit to a **preview branch**, never production solely to manufacture an outage. Verify its `/version.json`, exact assets and affected workflows, then redeploy the candidate to that same preview branch and verify again. Record both deployment URLs, revision identities and results. `npm run deploy` intentionally verifies the production domains; a preview exercise uses explicit `wrangler pages deploy --branch <preview-name>` from an isolated, tested checkout and an explicit preview `BASE_URL` for smoke. Do not point the production release command at preview and mistake an unchanged production domain for a failed candidate.

ซ้อมกู้คืนบน preview branch เท่านั้น ตรวจรุ่น ไฟล์ และขั้นตอนที่เกี่ยวข้องของรุ่นเดิม แล้วนำ candidate กลับเข้า preview เดิมและตรวจซ้ำ บันทึก URL และผลทั้งสองครั้ง คำสั่ง production ตรวจโดเมนจริง จึงไม่ใช่คำสั่งซ้อม preview และห้ามอ้างว่ามีการซ้อมเพียงเพราะมีคู่มือนี้

## Data refresh and limits / ข้อมูลและข้อจำกัด

Ledger regeneration uses only `scripts/ingest/build_ledger.py` after the documented fetch pipeline. Do not hand-edit public ledger files. Preserve licences, hashes, periods and conservation checks; regenerate both research notebooks and Bible. Public TGO data are a dated snapshot, not a registry transaction integration. Field accuracy, temporal covariance, additionality, interval coverage, legal rights and physical iPhone/Android installation remain external validation work. Do not promote the pilot to a verified credit service because the deployment succeeds.

Preview recovery command (never production): `node scripts/preview-restore-drill.mjs 3c9ef32 HEAD`. The dedicated `carbona-restore-drill` alias first serves the previous revision and then the candidate, each from a pinned isolated install/build, with exact-byte/security smoke and the live journey probe. It acquires the same project release lock so it cannot race a production upload. A durable receipt records both outcomes; the script is a tool, not evidence that the drill has run.

Release diagnostics are retained through a bounded allowlist of gate JSON reports under the durable receipt's `diagnostics/`, before owned checkout cleanup. Secret-like fields, bearer values, emails and credential query values are redacted; arbitrary test files and project evidence are excluded. A receipt without a completed phase still does not prove that phase passed.
