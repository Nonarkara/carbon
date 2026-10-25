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

Remaining: the suite stops at its first failure, so only the first such race in each run is
visible. The other fifteen suites have not been shown to be free of the same shape — a wait on
one element and an assertion on another that is filled later. The fix here is the pattern to
apply when the next one appears: wait for the content the assertion names, not for the paint of
its neighbour.
