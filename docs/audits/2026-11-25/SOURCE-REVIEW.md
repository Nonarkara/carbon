---
updated: 2026-11-25
drafted_by: codex/gpt-6
reviewed: false
---

# Reviewed source refresh and recovery

All source requests were made against public primary endpoints. No subscriber token, personal contact field, user boundary or project evidence was sent. Raw downloads remain under ignored `research/raw/`; public receipts contain hashes and aggregate differences. The completed receipts supersede intermediate probe decisions.

| Family | Outcome | Evidence |
| --- | --- | --- |
| GFW Forest Watch | Existing ingest generated v20261125; 26 October–24 November, tree-cover 2022 mask. Independent country query agrees with all 77 province sums and daily/confidence totals. Same licence and limitations. | `GFW-REFRESH.json` |
| TGO project registry and OTC | Fresh isolated full ingest: bilingual lists, 257 project details, 22 market queries. Project identities, issuance, expected quantities and province membership unchanged; upstream reordered some location fragments. 2026 trading changed. No fresh date assigned to cached details. | `TGO-REFRESH.json` |
| SEA WDI | Fresh release metadata 11 November; all country values, histories and totals unchanged. | `SEA-REFRESH.json` |
| SEA GFW | Fresh aggregate query returned HTTP 504. Reused only SHA-verified files from unchanged v20260327, preserving their original retrieval dates. Independent ADM0 endpoint remains 404. No new GFW-current claim. | `SEA-REUSE.json` |
| Singapore Article 6 | Official page updated 20 November groups negotiations concluded and IAs signed. Kept that qualification; marked-in-force annotations now include Lao PDR and Vietnam. No claim that 14 listed partners means 14 signatures. | `ARTICLE6-REVIEW.md` |

## Loading behavior

`data-load.js` bounds public response size and duration, shares successful immutable transport/parsing, and drops failed attempts so an explicit retry can work. Registry and landscape keep independent view state. Failed critical files leave readiness pending behind a visible retry; optional failures are exposed in an existing ledger disclosure. Grid failure cannot leave old national numbers beside a new area. A delayed grid response cannot overwrite a later province selection.

The source disclosure distinguishes observation period, original retrieval and this browser's file check. A successful local fetch is not evidence that the upstream publisher has no newer release. Missing stock history/NFI evidence remains unavailable, not a zero. Exported JSON carries those statuses and optional provenance separately from calculated rows.

Focused browser proof: critical 503/retry on a 390px phone; grid 503/retry in TH/EN; malformed stock JSON and NFI404; one registry/province transfer for multiple consumers; stale selection response. Unit mutations reject wrong units, years, missing evidence, invalid registry URLs, malformed coordinates, NaN grid values and duplicate/out-of-range cell indices.

The new disclosure does not add header chrome. A phone spot measurement with the disclosure opened found no document or row overflow at 390px. Full viewport, enlarged-text and independent visual review belong to the integration gate; these focused checks do not certify the entire interface.
