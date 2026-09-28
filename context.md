# Forest Carbon Thailand

User approved the pilot plan on 25 September 2026 and explicitly requested GitHub and Cloudflare deployment with detailed TH/EN instructions and diagrams.

Design read: Thailand's assessment boundary dominates a dark map beside a compact evidence rail in the supplied Malaysia dashboard's daylight chrome.
Reference: Nonarkara/Malaysia commit 6c4651bf525000555217cde55e5b7989b176e4cb.
Register: same map-led civic/operator hybrid as Malaysia. Dials variance 4, motion 2, density 7.
Dominance: map in workspace; period result in calculation; sources in evidence view.
Line weights: 5 px verdict rule, 3 px warnings, 1 px record separators.
Explicit exception: preserve reference paper #f6f4ec, navy #1b2140, yellow #ffcc00, Newsreader / Plus Jakarta Sans / IBM Plex Mono instead of generic workspace defaults. Current exact-style user instruction governs. Thai uses non-looped IBM Plex Sans Thai, line height 1.7. All newly authored corners square.

Invariant: stock is not period sequestration, and estimates are not issued credits. Every output retains its inputs, dates, source tier, units and model/methodology status.
Release tier: demonstration/assessment pilot; no trained model, official approval, registry integration or issuance authority. Methodology reference: Standard T-VER-S-METH-13-01 v2; full eligibility/verification remain external.
Privacy: user files processed in memory; no analytics, backend upload, browser persistence or paid API. Export before leaving. External map tiles disclose viewport requests to providers.
Public assets only in public/. Raw research does not ship to Cloudflare.

Research surface: editorial reading page based on Malaysia research.html, with its paper/navy/yellow tokens; the argument leads, a narrow contents rail supports reading. 5px yellow intro rule, 3px section rules and 1px row dividers. Real author portrait sourced from his RMIT public profile at user request; no invented quotations. Research opens separately to retain browser-memory assessment inputs.

Carbon map (added 26 September 2026 at user request; default lens): landscape ledger for a province, drawn box or imported boundary. Invariant: every ESA CCI 100 m pixel centre belongs to ≤1 province and exactly 1 grid cell (0.025°), so sum(provinces) == national == sum(grid) for every layer; tests enforce it. Stock = ESA CCI Biomass v7.0 2020 AGB × JAXA FNF v2.1.0 2020 forest fraction × 2.1886 (T-VER R 0.27, CF 0.47). Flux = GFW v1.4.3 province CSV (keyless), 25-year totals ÷ 25. Fire = GFED5.1 2013–2022. Fossil = ODIAC2025 2024. Cross-checks = Climate TRACE v7 2024 (province), BTR1 Table 2-184 2022 (nation). Rows from different datasets are never added; only GFW's own net is shown. Uncertainty shown as two 95% ranges (independent vs fully correlated pixel errors), bias excluded and stated. Atmosphere layers (NASA GIBS AOD, VIIRS fire, AIRS CO, OCO-2 XCO₂) are pictures, never numbers. Landscape figures never feed the T-VER workbench.
Pending owner action: GFW 30 m flux tiles for drawn boxes need a free GFW API key (account creation is the owner's step); until then box flux shows "not ingested", never zero.
Data refresh: `.venv/bin/python scripts/ingest/fetch.py` then `build_ledger.py`; raw inputs live in git-ignored research/raw/landscape/ with SHA-256 in fetch-log.json; public/data/ledger/manifest.json carries versions, licences and hashes.
JAXA terms: derived products allowed with credit; notify JAXA before any commercial use.
About tab (26 Sep 2026): header button opens an in-app reading view (public/partials/about.{th,en}.html, public/js/about.js); native TH/EN, nine illustrations, all figures filled from public/data/ledger/provinces.json. Research notebook link lives inside it.

Client-demo identity revision: white footer strip carries owner-requested organisation marks without claiming endorsement. Research opens with Dr Non's existing sourced portrait and concise profile. ISO 14064-2:2019 and 14064-3:2019 are scoped design references, not audited conformity claims; ISO 14065:2020 describes external verification bodies, not software accreditation. Institutional fine print sits in Research; the map remains dominant. Logo colours remain intrinsic brand assets, an exception to the UI's one-accent rule.

Manual usability revision: task-first guide with a compact left index, explicit success checkpoints, a labelled screen diagram and troubleshooting. Detailed legacy reference remains intact in expandable chapters. Guide is visible on phones and opens separately to preserve project state. Research reading width is 1080 px with tighter vertical rhythm; map/result content preserved. The workflow invariant includes waiting for example data before enabling calculation.

Workbench tightening (28 Sep 2026): each calculation section leads with its answer (heading → number → formula → substituted expansion → source → note) per the intelligence-product frame and anchoring; the honesty trace stays on every number. Calc-surface rhythm tightened (calc-block 6px, code line-height 1.55, KPI padding 6px 14px, world-item 8px) with the readable-scale floor preserved — tightening space, never type. Province-metric dropdown labels travel from the ledger manifest via a langchange event (setLang reapplies data-i18n, so one-time derivation would be silently reverted); per-language suffix templates live in landscape.js. Answers-first order and both langchange paths are locked in scripts/browser-test.mjs.

Research credits chapter (28 Sep 2026): docs/RESEARCH.{en,th}.md section 07 answers whether open data can calculate carbon credits — short answer no — with a three-lane/three-gate system map (open-data screening, field plus approved method, external registry), two gated pipeline diagrams, and an ingredient matrix citing every manifest dataset version in both languages; teaching numbers only, no new invented data. Old sections 07–09 renumbered 08–10. Diagram figure CSS (.sysmap) lives in public/css/research.css under Malaysia tokens; browser-test locks 7 diagrams, 11 TOC links and the author portrait at section-9.
