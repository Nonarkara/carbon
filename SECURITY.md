# Security and privacy / ความปลอดภัยและความเป็นส่วนตัว

The app is static. There is no login, database, upload API, paid inference key or server-side processing endpoint. User files and input values stay in page memory. Refreshing loses them; exports are user-managed. Map providers receive tile requests and Cloudflare receives page requests. Never claim total offline operation.

แอปเป็นไฟล์ static ไม่มี API รับอัปโหลดหรือฐานข้อมูล ข้อมูลผู้ใช้เก็บในหน่วยความจำหน้าเว็บและหายเมื่อรีเฟรช ผู้ให้บริการแผนที่กับ Cloudflare ยังได้รับคำขอเครือข่ายตามปกติ

Input controls: UTF-8 decode, 2 MB cap, 10,000 CSV rows, finite numeric checks, bounded geometry/vertices, topology/overlap validation, escaped output, fixed source-link catalogue. File names and report references are rendered as text. CSV result export contains fixed field names, dates and numbers, not user-controlled spreadsheet formulas. JSON export is not a signed audit record.

Defence: self-hosted scripts/fonts, no inline script/eval, restrictive CSP, frame denial, MIME sniffing disabled and no privileged permissions. The development server exposes only public/. Third-party map requests are allowlisted. No external request is made from an imported URL.

Project maturity: pilot assessment tool. Security checks do not certify scientific accuracy, legal eligibility, data licences or official issuance. Contact the repository maintainer privately for suspected credential exposure; do not publish a token in an issue. General reproducible bugs can use GitHub Issues with synthetic inputs.
