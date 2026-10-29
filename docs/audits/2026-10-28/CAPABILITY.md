# The capability matrix, measured

Found: the shared navigation helper had never once done the thing it was written for.
`scripts/lib/browser-nav.mjs` decides whether a navigation failure "looks like a timeout" — and
the pattern that decides it was a regular expression CALLED as a function. The TypeError was
thrown from inside the catch block whose whole job was to classify the failure. So a timeout was
never retried, and every navigation failure was reported as "LOOKS_LIKE_A_TIMEOUT is not a
function" instead of its cause. Twenty browser suites import this helper, and the release's
live verification runs through it. Nothing caught it: the suites mostly navigated to pages that
answered promptly, so the broken branch was never taken — and a branch that is never taken is a
branch nobody has tested.

Found: the retry was broken a second time, and would have stayed broken. A timed-out
`page.goto` does not cancel the navigation — the browser is still loading that document. A retry
to the same URL then collides with it: Chromium aborts the new request and the helper reports
ERR_ABORTED, a network error that never happened, about a page the site serves perfectly well.
Measured against a server that answers the first request slowly and the second quickly, the
retry without a cancellation step never reached the server at all.

Found: the instrument showed one defect at a time. `scripts/spatial-suite.mjs` and
`scripts/browser-suite.mjs` both stopped at the first failure, so a build with three problems
cost three fix cycles and the owner was shown one complaint at a time. The law this project
works under says the opposite: when you find spatial hallucination, massacre it, and a massacre
is the whole census in one pass.

Found: the published capability matrix had drifted. `docs/SHIP_READINESS.md` said the Bible held
65 paired chapters and 80 source entries; the shipped corpus holds 68 and 87. A reader comparing
the document with the product would find two different answers and no way to tell which one is
the tool. Nothing checked them: every published number was written by hand at whatever moment a
feature landed.

Found: the inherited live-surface work hardcoded its numbers — `68 / 68` and `23 chapters` —
so a gate that would fail falsely, with a message that reads like a broken site, the day
somebody added a chapter, and one that had no way to notice the product shrinking.

Found: the inherited live-surface work did not pass. The live-surface falsifier crashed on the
broken navigation helper, three of its cases never ran, and its last two never ran either. It
reported seventeen green cases and then died.

Found: the live proof had stopped proving what the product is for. It checked that the workbench
PAINTS a headline figure, a trace, a unit and a map. It did not check that the workbench
CALCULATES, and it did not check the FILE a reader takes away — the export that is the
product's deliverable, and the one thing that leaves the browser. Nothing proved that the file
and the screen agree, that the file is labelled an illustrative estimate, or that the file never
claims issued credits or a connected model. Those are the claims this project exists to keep
honest, and they were unproved on the deployed bytes.

Found: a defect installed too late does not reach the page. The page's module resolves the Blob
constructor when it is evaluated, so a Blob replaced afterwards is not the Blob the module uses
and the export comes out untouched — and `JSON.stringify` behaves the same way. Measured: the
override was installed, still in place at the moment of the export, and the file was unchanged.
`URL.createObjectURL` is a plain property of the URL constructor, and a property access on a
global object is resolved when the call is made — that is the seam that works, and the falsifier
now uses it.

Found: the live proof read one width per breakpoint, and the audit that describes it still named
the 1024px tablet as unmeasured — while the code beside it had already been widened to three
widths. A document and the code beside it disagreed, and the document was the one a reader would
trust.

Found: `context.md`, which every agent is pointed at, was forty commits and six days behind.

Changed: `gotoRetry` now classifies a failure with `.test()`, and cancels the still-pending
navigation before it retries. The cancellation is a navigation to `about:blank`, which always
answers, so the retry becomes a real request.

Changed: `scripts/browser-nav-falsifier.mjs` proves both halves of the contract against a real
server that misbehaves on purpose: a timeout IS retried and the retry succeeds; a failure that
is not a timeout is NOT retried and reaches the caller with its cause intact; a navigation that
succeeds is not retried; and a navigation that times out on every attempt hands the caller the
timeout rather than a mask. Reverting the helper to its broken form makes this script fail —
measured, not asserted.

Changed: both runners now run every gate and keep every verdict. The suite still exits non-zero
if anything failed; it just no longer hides the second defect behind the first.

Changed: `scripts/capability-claims.mjs` reads each published figure out of the page or document
that prints it, reads the truth out of the data the site ships, and fails when the two disagree.
It is written against the data and never against a literal, so adding a chapter makes the gate
name the page that must be updated. It covers eleven capabilities and twenty published figures:
the Bible's chapters, source entries and original diagram topics; the research notebook's
chapter count and its index; the eleven Southeast Asian countries; the seventy-seven provinces;
the T-VER record count and the projects without issuance; and the eleven historical
province-year observations. It runs in `npm run test:spatial`, so a release cannot ship with a
capability matrix that no longer describes the product.

Changed: `docs/SHIP_READINESS.md` now states what the site actually holds (68 chapters, 87
source entries, 24 original diagram topics), its test count is the measured one, its frontend
findings are described as gated rather than outstanding, and it carries a section explaining how
the matrix is measured and against what.

Changed: `scripts/lib/live-surfaces.mjs` is the ONE copy of the live assertions, shared by the
verification and by the falsifier that proves they can fail, and it is now also the one copy of
the NAVIGATION — because how a surface is opened decides what it is measured against. Every
published number is compared with the corpus fetched from the site being verified: the Bible's
counter against `data/bible.json`, the guide's stated corpus against the same file, the About
view's registry count against `data/tgo/tver-forestry.json`. The About view joined the surface
list, because it is a published surface with published figures. The navigation waits for
`domcontentloaded` rather than `load`, because the pages fetch map tiles from third parties the
site does not control, and a navigation that waits for all of them reports a slow edge as a
defect in the site.

Changed: the workbench surface now proves the product's actual deliverable. The example is run,
the export is taken, and the file is read: the figure the file carries must be the figure the
screen shows; the file must say `illustrative-unverified-estimate`; and it must carry no issued
credits and no connected model. Those are the project's own invariants — stock, monitoring-period
estimates and issued credits kept separate, no model or registry implied without a real
integration — and they are now checked on the deployed bytes rather than asserted in a document.
The honesty assertions come first, because they are the claims the file makes about itself.

Changed: `scripts/live-surface-falsifier.mjs` breaks all of it on purpose — twenty DOM defects
and three corpus defects, where the site is served a corpus the page is not holding, which is
the state a stale cached corpus produces. Twenty-five defects in all, each caught by the
shipped assertion and for the right reason.

Changed: `context.md` carries the twenty-second to twenty-seventh October, which it did not, and
today's.

Verified: the navigation falsifier passes against the repaired helper and fails against the
broken one. The capability gate failed on exactly the two drifted figures and passes after the
document was corrected — it was written before the correction, so the drift was found by the
gate rather than by reading. The live-surface falsifier catches twenty-seven defects with the
shipped assertions: twenty-one DOM defects, one defect in the file the reader takes away, three
corpus defects that no DOM defect can produce, and the sideways-scroll and wait checks.

Verified: 129 unit tests pass (109 plus the twenty ledger conservation checks, which take seven
minutes of wall-clock on a busy machine and under a minute of CPU). All seventeen browser suites
pass against this build.

Verified: the law runs as one command. Every gate is green and the census is reported.

Verified: the release. Commit 36eabc4 was exported into a pristine tree, built there, measured
there — 129 unit tests, all eight law gates, and the 582-page content audit with no finding and
no unmeasured page — uploaded, and then verified live: six published surfaces in both languages
at 390, 1024 and 1440, thirty-six surface openings, the 404 page, the comparison periods and the
ozone correction. The receipt is `test-results/live/live-report.json` beside thirty-six
screenshots. `npm run test:release` then confirmed the deployed bytes, the headers, the private
paths and the feed envelopes against the same build.

Remaining: nothing in this audit. The boundaries that were never in scope are unchanged and
still stated where they were stated: independent first-time-user testing, field validation, real
project eligibility, physical-device installation and a formal accessibility audit remain
unverified, because they require suitable participants, evidence and authority rather than
software.

---

## 29 October 2026 — the cold load, and where the retry belongs

Found: the falsifier's baseline could die before it proved anything. `surface.prove()` waits for
content that can render late, and a transient `TimeoutError` on a cold first load aborted the
whole baseline before a single defect case ran — so the falsifier could not report whether the
twenty-seven defects are actually caught. A retry on timeout fixes it, and after the fix the
falsifier is stable: five consecutive runs, twenty-seven defects caught in each.

Found: the retry was in the wrong layer. The live verification faces the same cold-start
exposure and had no protection at all: it runs against a cold edge immediately after a deploy,
which is precisely the condition `gotoRetry` was written for, and a spurious timeout there fails
a release for a condition the site did not cause. The falsifier was also proving a *variant* of
what ships, because it retried where the verification did not.

Found, and a correction to the record: the change described `prove()` as "a read-only DOM check".
It is not. It selects a province, runs the illustrative example and takes an export. Re-running it
is safe because it is **idempotent** — it checks the same thing twice — not because it changes
nothing.

Changed: `proveSurface()` now lives in `scripts/lib/live-surfaces.mjs`, and both the live
verification and the falsifier come through it, so the falsifier proves the code that actually
ships. The retry stays narrow: it fires only on a timeout, once. An assertion failure is the
signal that a surface is wrong and is never retried, so a broken page cannot be retried into a
passing one; a page that is genuinely hung still fails, twice as slowly. The one defect that
legitimately times out — the research notebook's skip link — already expects a timeout.

Verified: every gate of the law passes with the shared retry, and the falsifier still catches
twenty-seven defects with the shipped assertions.

Remaining: none.
