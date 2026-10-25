# The release that proves itself at the door

Found: `scripts/live-verify.mjs` was an orphan. It is the script that opens a deployed release
and proves the served pages behave — both languages, both widths, all four regional views, the
comparison periods, the ozone correction — and nothing ran it. There was no npm script for it,
no CI step, and no step in the release. The release ended at "built, measured and uploaded", and
every claim about the *live* surface was a claim somebody made by hand.

Changed: the release now ends at the live surface. After the upload it waits for the edge to
serve the commit it just published, then runs the live verification against it, and only then
prints PASS. The wait is generous — three minutes — because a slow edge is a condition to wait
out, not a failure; a tight budget would fail releases that did ship. The live surface is
`CLOUDFLARE_LIVE_URL`, not `BASE_URL`: BASE_URL points a gate at whatever server a caller
picks, and a release has to be verified where its users are. The verification script itself was
brought to the same standard as the browser suites before being wired in: every fixed pause
became a wait for the content the next assertion reads, the navigation gained the house's
retrying helper so a cold edge does not fail the check, and the view names are now compared
between the phone selector and the desktop button — the property that was broken and fixed in
the audit beside this one. `npm run test:live` runs it on its own.

Verified: the hardened verification passes against the live release as it stands — commit
09f0a8e, both languages, both widths, all four regional views under one name each, the
comparison periods and the ozone correction. The release's new step is exercised by the release
that ships this note.

Remaining: the live verification covers the regional workspace and the credit chapter. It does
not yet open the Thailand workbench, the research notebooks or the guide — the browser suites
cover those, but they are run against a local build by the release and against the live only by
hand. A release that proved every surface it publishes would close that.
