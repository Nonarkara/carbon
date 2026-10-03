# Operating the assessment pilot / การดูแลระบบนำร่อง

Release operator: the authenticated maintainer of [Nonarkara/carbon](https://github.com/Nonarkara/carbon), the project under Dr Non's public profile. This document establishes a runbook, not a support SLA or a promise of continuous human monitoring. Current scope: public evidence exploration and reproducible browser-local assessment; no credit issuance service.

ผู้เผยแพร่คือผู้ดูแล repository ที่มีสิทธิ Cloudflare เอกสารนี้เป็นวิธีดูแลระบบ ไม่ใช่ SLA หรือคำรับประกันว่ามีผู้เฝ้าตลอดเวลา ขอบเขตคือสำรวจหลักฐานและคำนวณนำร่องในเบราว์เซอร์ ไม่ใช่บริการออกเครดิต

## Before a client demonstration / ก่อนสาธิต

1. Build the intended clean commit: `npm ci`, `npm run build`, `npm test`. Check `npm audit` and redacted Gitleaks scans. Use the release sequence in DEPLOYMENT.md.
2. Run `node scripts/release-smoke.mjs` after deployment. A PASS requires the primary domain's version and bytes to match the local build, security headers, internal-path 404s, and valid labelled feed envelopes.
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

## Data refresh and limits / ข้อมูลและข้อจำกัด

Ledger regeneration uses only `scripts/ingest/build_ledger.py` after the documented fetch pipeline. Do not hand-edit public ledger files. Preserve licences, hashes, periods and conservation checks; regenerate both research notebooks and Bible. Public TGO data are a dated snapshot, not a registry transaction integration. Field accuracy, temporal covariance, additionality, interval coverage, legal rights and physical iPhone/Android installation remain external validation work. Do not promote the pilot to a verified credit service because the deployment succeeds.
