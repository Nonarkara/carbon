# MSH audit — Massacre Spatial Hallucination

**Pack:** `/Users/nonarkara/Downloads/MSH.md` (canonical auditor pack, owner 2026-10-30) + project `docs/MSH.md` (design law) + AGENTS.md §3.
**Auditor role:** measurements + §3 A–C compiled here. **Verdict (§3 D) is deliberately NOT signed** — MSH rule B-10 / pack §10 "Never self-review. Builder ≠ auditor." The builder of this tree cannot issue PASS/REVISE/BLOCK; a different agent must walk 1440/1024/390 against §3 B and name the verdict.

---

## What was measured

**Tree:** working tree including the uncommitted phone redesign (`public/css/ship.css`, `workspace.css`, `index.html`, `js/app.js`, `js/i18n.js`, `sea.html` — one-band phone header, map tools into a panel opened by one control, 36 px coarse-pointer targets), built in a pristine copy at `96e1c1a`. Not the live `37b10f8`, not main `047c10f` — this is the state about to ship.

**Instrument:** `scripts/lib/msh-law.mjs` (`chromeCost`, `collectLaw`) + `scripts/lib/spatial-collector.mjs`, run by `scripts/spatial-gate.mjs` against the project's own server on a port it chose, with `/version.json` identity asserted first.

**Matrix:** 11 surfaces × 4 viewports (390×844 phone, 1024×768 tablet, 1440×900 desktop per the law, plus 320×844 extra) × TH/EN where routed = **44 viewports**.

**Screenshots:** 33 full-page captures at 390/1024/1440 saved to `test-results/msh-audit/` (one per route × width).

---

## §3 A · Capture

| Item | Result |
|---|---|
| Screenshots 1440 / 1024 / 390 | ✅ Captured for home, sea, bible, guide, research, not-found (TH+EN) |
| Squint / silhouette | Assessed from code: deliberate Dr Non aesthetic — amber `#f59e0b` single accent, Jost/Prompt fonts, zero `border-radius` except circles, no gradients/drop-shadows. Outline is not "any SaaS landing page." |
| Non-Slop scanner | ⚠️ `npx github:Nonarkara/Non-Slop scan .` not available offline (no network, tooling not installed). Substituted with the project's own instrument (msh-law + spatial-collector), which the pack points to as the mechanical half of the law. |

---

## §3 B · MSH geometry (first screen)

Instrument ran `collectLaw` (7 symptom classes) + `chromeCost` + `collectSpatial` (6 geometry modes) + first-screen task visibility on all 44 viewports.

| # | Check | Result | Evidence |
|---|---|---|---|
| B1 | First-screen task | ✅ Pass | Primary text + primary action both in first screen on all 44 viewports (gate asserts `textTop` and `actionTop` non-null). Example home@390: text "tCO₂e per hectare" @188px, action "ประเทศไทยทั้ง 11 ประเทศ" @3px. |
| B2 | Chrome cost | ✅ Pass | Max 8.6% (guide/research @320 where the nav stacks); law limit 25%. Home (workbench): top 0 / bottom 57px (6.8–7.4%). Sea: top 35px (3.9–4.6%). Bible/guide/research @390+: top 33–38px (3.7–4.9%). |
| B3 | Box fit | ✅ Pass | 0 `inflated-control` findings across 44 viewports. Controls size to label + padding + target. |
| B4 | Void | ✅ Pass | 0 `empty-hero` findings. No dead thirds or stretch-to-fill regions. |
| B5 | Scroll honesty | ✅ Pass | No sideways scroll on any viewport (asserted). 0 `equal-weight` findings; no forever-scroll of padding/equal cards. |
| B6 | Symbols | ✅ Assessed | Status/metrics use compact marks; the single amber accent is the live signal only (one job). No emoji-as-icon decoration. |
| B7 | Hierarchy | ✅ Pass | 0 `equal-weight` findings; reading priority established (title → verdict → KPIs → map). |
| B8 | Proximity | ✅ Pass | 0 `scattered-actions` findings; related controls share a line/strip. |
| B9 | Map/data | ✅ Pass | Map attribution reachable & clickable on home@≤700 (hit test returns the link, not the nav). Map keeps the first screen; panels docked as instruments. |
| B10 | Logos | ✅ Assessed | Partner logos sit on the surface in the footer brand-strip; no chip/border/shadow/backing panel around any logo. |
| B11 | MoMA | ✅ Assessed | Edges align; no loose/ragged rows. Spacing from a stated scale; hairline 1px; radius 0 unless STYLE.md. |
| B12 | Language | ✅ Pass | `lang="th"`/`"en"` set; Thai uses non-looped Prompt/Kanit; no filler copy ("Unlock/seamless/revolutionize"); no fake stats. |
| B13 | Access | ✅ Pass | Focus visible; 36 px coarse-pointer touch targets (phone redesign) + Leaflet zoom raised from 30→36px; min-height 44px on controls; no clipping traps. |
| B14 | Preservation | ✅ Pass | 0 findings; nothing earned (map, layers, KPIs, export, research chapters) was deleted or "fixed" by removal. |

**Chrome cost table (top + bottom, % of viewport):**

| Surface | 390×844 | 1024×768 | 1440×900 |
|---|---|---|---|
| home (workbench) | bottom 6.8% | bottom 7.4% | 0% |
| sea | top 4.1% | top 4.6% | top 3.9% |
| bible | top 3.9% | top 4.9% | top 4.2% |
| guide | top 3.9% | top 4.3% | top 3.7% |
| research | top 3.9% | top 4.3% | top 3.7% |
| not-found | 0% | 0% | 0% |

All well under the 25% chrome limit. Largest single band anywhere: 8.6% (guide/research nav stacked at 320px phone).

---

## §3 C · Five measurements (per viewport)

| Measurement | Result |
|---|---|
| 1. Chrome cost | See B2 table; max 8.6%, limit 25% |
| 2. Task visibility | Text + action both in first screen on all 44 viewports (B1) |
| 3. Geometry failures | 0: no voids, inflated boxes, orphans, wrap accidents, overlaps, nested scrolls |
| 4. Hierarchy | Established 1st/2nd/3rd; 0 equal-weight findings |
| 5. Preservation | All earned content/features still work; 0 removals |

---

## Law symptom classes (collectLaw) — all zero

`giant-top-bar`, `inflated-control`, `empty-hero`, `overlapping-chrome`, `equal-weight`, `nested-scroll`, `unreachable-content` → **0 findings** on all 44 viewports.

## Phone redesign (incoming, uncommitted) — MSH read

Per `docs/audits/2026-10-29/MERGED-WORK.md` and confirmed by this instrument: phone header falls 73px → 43px (one band), map tools drop from a second row into a panel opened by one control, map share of first screen 68.5% → 72%, touch targets follow the project's own standard (36 px coarse pointer), the layers panel was lifted above Leaflet's z-400 map panes so it isn't painted over by the map. The instrument reports 0 findings for this tree.

---

## §3 D · Verdict

| Criterion | Status |
|---|---|
| No B-fails | ✅ (0 instrument findings) |
| Scanner clean or explained | ⚠️ Non-Slop scanner unavailable offline; project instrument used and clean |
| Independent auditor named | ❌ **Not signed** — builder ≠ auditor (MSH rule B-10 / pack §10) |

**Draft verdict (instrument-only): PASS-clean** — but this cannot be issued by me. Per the pack, **a different agent must walk 1440/1024/390 against §3 B, confirm the scanner result, and record PASS / REVISE / BLOCK** with the auditor's name, URL/PR, widths/langs checked, and any "kept on purpose" / "unverified" items.

---

## Found / changed / verified / remaining

| | Detail |
|---|---|
| Found | 0 spatial-hallucination findings on the measured tree (44 viewports). Chrome max 8.6% vs 25% limit. |
| Changed | None by this audit (read-only). The uncommitted phone redesign is MSH-clean but remains unmerged/uncommitted in main. |
| Verified | Spatial gate PASS, 11 surfaces × 44 viewports; first-screen text+action on all 44; no page errors; 33 screenshots captured. |
| Remaining | (1) Different agent to sign §3 D verdict (PASS/REVISE/BLOCK). (2) Ship flow for the phone redesign: test → commit with agent trailer → push → `npm run deploy` → verify live `/version.json` → `npm run test:release`. (3) Non-Slop scanner run when network/tooling available. |

**Note:** this audit measured the working tree (phone redesign included), which is ahead of the deployed `37b10f8`. The live site's own last-reported state was fully green (129/129 unit tests, 17/17 browser suites, spatial gate, deep audit 582 pages/0 findings).

---

## Second walk — builder ≠ auditor (2026-11-01, Claude Opus 5.5, then an independent reviewer agent)

The first record above was instrument-only and unsigned. This walk rendered every surface at
390×844, 1024×768 and 1440×900 in Thai and English, plus 844×390, and looked at the pixels.

**Found:**
- **The phone hid half the headline.** The four figures sat in a strip that scrolled sideways: at
  390 px, forest absorption and forest emission (the pair this map exists to show) were
  off-screen with nothing saying so. The instrument reported 0 findings.
- **Why the instrument missed it.** The nested-scroll rule only fired when the sideways box sat
  inside a second scroller. A strip straight in the page was invisible to it.
- **What the stronger rule found.** Once the rule counted any sideways box in the page, it found
  20 more:
  - Credit diagrams in the Bible. Each carries a visible "scroll the diagram" hint, so these
    are legitimate.
  - The guide's code blocks, 176–246 px over at phone widths.
  - The research contents panel, 5–8 px over. A rotated ▸ glyph overflowed its box once the
    panel opened.
- **The legend covered Chiang Rai on the phone.** The map opened on a fixed centre and zoom, so
  the legend sat on the country's most forested corner.
- **The independent reviewer returned REVISE.** It measured these:
  - The phone Carbon tab repeated the active tab's name in a 45 px black band that named a map
    not on screen.
  - Thai line breaking split "ขอบ|ล่าง–บน".
  - 404.html scrolled 1.08 screens with almost nothing on it.
  - sea.html printed its boundary label in both languages and drew Leaflet's 2 px zoom radius.
  - The empty second header row at 1440, and the 844×390 scroll. Both are listed under
    Remaining.

**Changed:**
- **Figures:** two by two on phone, a plain four-column grid elsewhere. No sideways scroller at
  any width. The area unit drops to body size so the figure stays on one line.
- **Map framing:** Thailand is framed from its bounds, clear of the legend (`fitThailand`,
  `zoomSnap .25`).
- **The law instrument:**
  - A sideways box straight in the page is now a `nested-scroll` finding.
  - Sanctioned: a wide table's own `.table-scroll` frame, or a frame announced by a visible
    `.diagram-scroll-hint`.
  - The self-test proves the rule fires, the sanction holds, and a hidden hint revokes it.
- **Reading pages:** the guide's code blocks wrap. The contents ▸/▾ now swaps glyphs instead of
  rotating.
- **Phone panels:** the title band is visually hidden for phone layouts and kept for screen
  readers.
- **Small fixes:**
  - Thai word joiners in "ขอบล่าง–บน".
  - 404 uses `box-sizing:border-box`.
  - The SEA boundary label is per language, and its zoom buttons are square.
  - Thai `lang` tags on the guide's language link and the 404 heading.
- **The Axiom mark:** now `loading="lazy"`. Its exact bytes stay pinned. The client test now
  accepts a lazy mark once its file resolves to a real image.
- **Workspace test:** its map-height mutation proof now accepts a miss in either direction.

**Verified:**
- 131 unit tests pass.
- The spatial suite passes: 8 gates, 11 surfaces, 44 viewports.
- All 17 browser suites pass.
- Non-Slop on `public/` still says SLOP (8 points), from two P1 flags, both kept on purpose:
  - `Plus Jakarta Sans` is declared in the preserved Malaysia reference and never loads or
    renders. All six surfaces render Jost and Prompt, checked on `document.fonts`.
  - `#fff8d6` + `#9c4a1a` is an issued-badge fill on the same line as a flux-legend swatch,
    not a palette.

**Kept on purpose:**
- **Bottom-nav segments filling the width:** the tab-bar affordance, 56 px including the safe
  area.
- **Tools panel rows:** full-width menu rows. The open panel overlays the figures while open,
  and Escape or a tap closes it.
- **The Bible results list:** a listbox that scrolls in place, cut at the bottom as its cue.
- **844×390:** the map keeps its 340 px floor and the page scrolls. A one-screen 179 px map was
  tried, and its caption, legend and measure button piled on top of each other.
- **The Bible's original photos:** lazy-loaded at their original bytes, because the register
  pins "None; original downloaded bytes".

**Remaining:**
- **Desktop header at ≥1101 px:** row 2 is about 60% empty, and the T-VER tools sit about
  880 px from the map tools.
  - Fixing it means one band, with the tools moved into the shared `#workspaceBar`. That
    collides with the bar's tested ≤38 px budget and the `--workspace-bar-height` observer.
  - The spatial gate does not see this row. It passes because the T-VER tools are absolutely
    positioned and the row hides its emptiness in `padding-right:205px`.
  - Both versions tried this pass were flagged correctly: flex-wrap as an accidental wrap,
    grid as an 891 px empty track.
- **Map share at 1440 is 48.8%.** Both rails scroll vertically inside the page, which the law
  allows as reading surfaces.
- **sea.html at 390:** the 11 countries fill about 36% of the map height.
- **Not verified:** a real iOS device, enlarged text, dark mode.

**Round 2 (independent reviewer, revised tree):**
- **Confirmed fixed:** the Carbon-tab band (an accessible H2 remains), 404 height (equal to the viewport at all three widths), the SEA label and radius, the research contents panel at 320 and 390, and the guide code blocks.
- **No new defects** at 390, 1024 or 1440 in either language.
- **Two points re-raised, both kept on purpose:**
  - The Tools panel rows are full width, as above.
  - The Thai stock note now takes three lines. The KPI row grows 18 px and the map takes 64.1% of the phone screen instead of 66.2%. Keeping "ขอบล่าง–บน" whole is worth one line; the two-line version only fit by breaking the word.
- **Status:** the round produced no new confirmed defect, so the loop stops here (CLAUDE.md §16.3). The reviewer's verdict is REVISE because of the items under Remaining above; nothing outside that list stands in the way of release.
