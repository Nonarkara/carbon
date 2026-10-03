# Release audit / ตรวจความพร้อมออกรุ่น

Audit date: 2 October 2026. Scope: shipability, professional presentation and credibility of Kabonna's public assessment pilot. This is an engineering and documentary audit, not ISO certification, a penetration-test assurance opinion, a recruited usability study or carbon verification.

**Verdict: suitable for a client demonstration and a bounded assessment pilot.** The map and calculation are working evidence tools. They do not establish parcel accuracy, legal rights, additionality or credit entitlement. Those boundaries are part of the release, not hidden conditions.

**ข้อสรุป: พร้อมสาธิตและทดลองประเมินในขอบเขตที่ระบุ** ใช้แผนที่ สำรวจที่มาของตัวเลข ทดลองการคำนวณและส่งออกได้ ยังไม่ใช่การยืนยันความแม่นรายแปลง สิทธิที่ดิน additionality หรือสิทธิรับเครดิต เอกสารนี้ไม่ใช่การรับรอง ISO การตรวจเจาะระบบโดยผู้รับรอง หรือการทวนสอบคาร์บอน

## Findings fixed / สิ่งที่แก้แล้ว

| Finding | Evidence and correction |
|---|---|
| CI failed despite a successful manual deployment | GitHub run 37022318759 failed at `npm audit --audit-level=high`: vulnerable Undici through Miniflare/Wrangler. Updated the deployment toolchain to Wrangler 4.147.0 and Undici 7.29.1. Full npm audit now reports zero findings. Runtime dependency audit was already clear. |
| Security description overlooked a server endpoint | `functions/api/global.js` exists. SECURITY.md now distinguishes a static browser interface from its fixed, read-only public-feed Function. It explains timeouts, cache/fallback, and map-viewport disclosure. No project-upload endpoint exists. |
| README understated the actual registry integration | `public/js/registry.js` displays `data/tgo/tver-forestry.json`. README now distinguishes the dated public snapshot from authenticated submissions/transactions. The old “implementation has not started” proposal is marked historical. |
| Scientific summaries overstated the evidence | The preceding scientific audit corrected measured-bias and matched-validation claims. Sections 06, 14 and 15 distinguish unmatched NFI discrepancies, conditional sensitivities and producer consistency checks from independent field validation. |
| Browser tests could wait on third-party page-load completion | Component assertions now follow DOM readiness, while the map/data/results/profile tests remain intact. Slow background tiles are not the application's readiness criterion. Synthetic import/export privacy has its own browser regression. |

The official [Undici advisory](https://github.com/advisories/GHSA-w293-vg96-wgc3) identifies affected BalancedPool configurations and the patched version. This audit does not claim every advisory was exploitable in the deployed app; the affected packages were in its development/deployment toolchain.

## Requirements and proof / ข้อกำหนดและหลักฐาน

| Requirement | Authoritative evidence | Result and limits |
|---|---|---|
| System opens on the interactive map | `public/index.html`, `scripts/browser-test.mjs`, `scripts/design-review.mjs` | Province navigation, area selection, live substituted equations, five viewport regressions; no map replaced with cards |
| Compact Bauhaus presentation, flat buttons | `public/css/kabonna.css`, design script screenshots and computed styles | TH/EN at 375/768/1440; contrast checks, map area, no decorative button/control shadows |
| Requested identities and Dr Non profile | `scripts/client-demo-test.mjs` | White logo strip, loaded images, author visible on Research entry, scoped ISO references |
| Usable TH/EN manual | `scripts/manual-walkthrough.mjs` | Province, example/export and small-area failure journeys on phone/desktop under simulated slow Wi-Fi; simulated walkthrough, not recruited-user evidence |
| Searchable TH/EN scientific Bible | `tests/bible.test.mjs`, `scripts/academic-browser-test.mjs` | 29 paired chapters, resolvable sources, search, diagrams, worked shared-math examples and responsive audit tables |
| Every carbon number stays in its accounting family | `tests/carbon.test.mjs`, `tests/ledger.test.mjs`, `tests/tgo.test.mjs`, `tests/selection-view.test.mjs` | Unit changes, signed losses, fire rules, missing values, short-side resolution guard, stock/flux/issuance separation and conservation |
| Scientific claims remain bounded | `docs/ACADEMIC_AUDIT.*.md`, `tests/scientific-audit.test.mjs` | Exact four input hashes, 77-province diagnostics, hypothetical factor/covariance/sampling tests; field and causal validation flags remain false |
| User project inputs remain session-local | `public/js/app.js`, `scripts/privacy-browser-test.mjs` | Synthetic input marker absent from network requests, no POST during import/export, refresh clears input. Map providers still see viewport tile requests. |
| External feeds disclose source, age and tier | `server/world-data.js`, `tests/world-data.test.mjs`, live `/api/global` | Fixed upstreams, finite/schema/date checks, bounded timeouts, dated fallback or missing states; no invented live quote |
| Private workspace files stay private | `dev-server.mjs`, Direct Upload of `public/`, `scripts/release-smoke.mjs` | Live `.env`, `context.md`, raw research, node_modules and nonexistent routes return 404 |
| Secrets and dependency gate | Redacted Gitleaks Git/public scans; `npm audit` | 37 pre-fix commits and public assets scanned without findings; updated dependency tree has zero audit findings. Automated scans cannot prove absence of all vulnerabilities. |
| New source is actually deployed | `npm run deploy`, `/version.json`, release smoke | Commit, push and explicit Pages upload; primary-domain version and exact asset bytes must agree. GitHub pushes alone do not deploy. |
| Repeatable recovery and named release responsibility | `docs/OPERATIONS.md`, `docs/DEPLOYMENT.md` | Maintainer runbook, pre-demo smoke checks, fallback handling and rollback procedure; no 24/7 SLA or performed rollback-drill claim |

## Production-spine gates / เกณฑ์ก่อนอ้างความพร้อม

1. **Behavior and tests:** numerical/import/export boundary tests plus client, manual, privacy and academic browser journeys; CI also executes design and academic checks.
2. **Paid-key boundary:** no paid inference credential or spend-capable LLM endpoint. Public feeds are fixed read-only requests with cache/timeouts. Account-level Cloudflare usage still applies; this is not an unlimited-service commitment.
3. **Honest numbers:** source versions, observation periods, units, quality labels and fallback states remain with displays/exports. A modelled 2020 stock is not a present-day parcel observation or an issued credit.
4. **Secret status:** scans report no detected leak; no credential rotation was triggered by this audit. Sensitive project inputs are not included in public issues or evidence receipts.
5. **External boundaries:** uploaded geometry/CSV validate size, finite numbers, CRS/topology and supported allometry; upstream feeds validate schema/numeric/date constraints. Official eligibility and model accuracy remain separate reviews.

## Succeeded, failed, skipped, unverified

**Succeeded:** source audit, documentation corrections, dependency remediation, redacted secret scans, input-boundary review and reproducible verification commands. Test/build/deploy receipts are authoritative; this document is not itself a substitute for those outputs.

**Failed and remediated:** the previous GitHub security gate and an initial browser run waiting for page-load completion. The corresponding fixes preserve functional assertions rather than deleting them.

**Skipped:** paid LLM/auth/database/credit-transaction testing because those services are absent. No user data were uploaded to a research service. No new predictive model was trained.

**Unverified:** independent Thai field accuracy, paired-date covariance, empirical interval coverage, causal additionality, land rights and project eligibility; external human usability, physical iOS/Android installation, 24/7 availability and a performed rollback drill. The scientific report and operating runbook explain how to evaluate them. These are outside the demonstrated pilot claims; they prevent calling this a verified credit or contract service.

ผู้ใช้ควรอ่านวัน หน่วย รุ่นและข้อจำกัดก่อนใช้ตัวเลขกับลูกค้า ป้าย “นำร่อง” ไม่ได้หมายถึงผ่านการทวนสอบ การตรวจที่ยังไม่ได้ทำต้องบอกตรง ๆ โดยไม่สร้างข้อมูลภาคสนามหรือคำรับรองขึ้นมาเอง
