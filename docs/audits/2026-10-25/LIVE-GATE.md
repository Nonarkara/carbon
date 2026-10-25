# The gate that only fails when the site is live

Found: the browser suite failed against the live release and passed against the identical local
build, at the same commit. The failing assertion expected the workbench's ledger panel to carry
"National forest inventory (FREL 2021" and "359 t/ha". The live page was correct — the ledger
text on the live release and on the local build was byte-identical, 104,355 characters, with both
strings in it. The panel was simply read too early: the suite waited for the calculation trace to
be painted and then read the ledger, but the cross-check paragraph that carries "359 t/ha" is
appended when the inventory data lands, a beat after the trace is on screen. A local server
fetches that file instantly, so the race never shows; a live release fetches it across the
network, so it does.

Changed: the suite now waits for the content the assertion is about — for "359 t/ha" to be in the
ledger — instead of waiting for a neighbouring element to be painted and reading the panel
afterwards. No site code changed, no assertion was weakened, and the same wait is right on the
local server, where it is satisfied immediately.

Verified: the suite that failed at the first of sixteen against https://carbon.nonarkara.org
now passes all sixteen against the live release, and the local run of all sixteen still passes.
The live release was not defective at any point: its version manifest, its bytes and its content
were verified separately and did not change.

The same shape was then found and closed everywhere it could hide. Six assertions across five
suites waited on one element and read another that a script fills later: the workbench's registry
rows, the Bible's chapter counter in two suites, the forest-watch version line in the panel and
in the Bible body, and the workbench's national figure beside a failed feed. Each now waits for
the content it asserts on. One assertion was also worthless rather than racy — it checked a view
label that the static markup already carried, so it would have passed before the script had run
and could not have noticed the phone and the desktop naming a view differently; it now checks the
comparison label on both surfaces, which is the thing that actually broke.

Remaining: the suite stops at its first failure, so a race is only ever visible one at a time.
The six above were found by reading every content assertion in every suite and asking, of each,
whether the content it reads can be filled after the thing it waits for. That reading is now done
for the sixteen suites, but the next suite written may repeat the mistake, and
scripts/live-verify.mjs — the script that checks a live release after a deploy — has not been
audited the same way.
