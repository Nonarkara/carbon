# Carbona — intent.md

Current ideal state, captured from IMPLEMENTATION_PLAN.md, NEXT_SCOPE_2026-11-25.md, context.md, STYLE.md, docs/MSH.md, docs/DESIGN.md and README.md. This is the reference for all design, engineering and release decisions. It does not authorize new scope; it records what the system is and should remain.

## What Carbona is

A Thai-first, English-switchable forest carbon assessment workbench. A user selects a boundary (province, drawn box, or imported project boundary), sees dated source coverage and quality, enters or imports field evidence, and receives stock and monitoring-period estimates with an exportable audit trail. Issued credits are displayed only from an authoritative issuance record — never inferred, never minted here.

**Registry:** demonstration/assessment pilot. No trained model, official approval, registry integration or issuance authority. Methodology reference: Standard T-VER-S-METH-13-01 v2; full eligibility and verification remain external.

**Privacy:** user files processed in memory; no analytics, backend upload, browser persistence or paid API. Export before leaving. External map tiles disclose viewport requests to providers.

**Architecture:** static HTML/JavaScript/Leaflet, Cloudflare Pages deployment, bilingual (TH/EN) throughout. Public assets live in `public/` only.

## What Carbona is not

- Not a credit registry, not a verification body, not a model training platform.
- Not a connected model or registry. Stock, monitoring-period estimates and issued credits stay separate.
- Not a parcel-scale flux engine. GFW 30 m tiles need a free API key (owner step) — until then, box flux shows "not ingested", never zero.
- Not a corporate footprint engine, not a cloud collaboration platform, not an offline-first app.

## Design laws (non-negotiable)

**MSH — Massacre Spatial Hallucination (docs/MSH.md):** when an interface invents a reason for things to occupy space instead of arranging them around how people read, choose and act. Fix the first unnecessary expansion. Do not decorate the consequences. The map must hold ≥60% of the first screen on desktop and phone. Chrome earns its pixels. Boxes fit content. No dead voids. Compact first. Something must win.

**Bauhaus brutalism (docs/DESIGN.md):** white ground, black structure, red province action, yellow area tool, blue world instruments/Research, sans typography, square corners, solid rules, no shadows, no gradients, no blur, no decorative icon tiles, motion only on user action, respects `prefers-reduced-motion`.

**Thai:** non-looped type only (IBM Plex Sans Thai / Prompt), line height 1.7. First person is strictly "ผม". No Sarabun, no looped faces.

**Visual reference:** Nonarkara/Malaysia commit 6c4651bf525000555217cde55e5b7989b176e4cb — map-dominant layout, dated forest evidence, calculation beside the map in daylight chrome. Paper #f6f4ec, navy #1b2140, yellow #ffcc00 (inherited Malaysia declarations overridden deliberately by kabonna.css/type.css/flat-controls.css).

## Measurement contract

Run `npm run test:spatial` (builds, starts its own server, measures at 390×844, 1024×768, 1440×900). Add `-- --deep` for the 582-page content audit. `npm run test:browser:all` runs 22 browser suites. `npm run test:release` verifies exact deployed bytes on both domains. `npm run deploy` runs the full law — a release cannot ship without it passing.

## Release discipline

Commit → push → deploy → verify live browser and `/version.json` → `npm run test:release`. Push alone does not deploy. A release is the commit it names, byte for byte. Never build from a shared working tree. `npm run deploy` exports HEAD into a pristine worktree, builds, tests, measures the law there, then uploads with `--branch main`.

## What remains (optional scope, separate approval)

Authenticated GFW parcel flux; new biomass map comparisons / GEDI small-area estimation; trained AI or LLM explanation; organizational footprint calculation; cloud projects/accounts/collaboration/telemetry; participant study with Thai users. None of these are in the current scope.
