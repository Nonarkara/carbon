# Every published surface, proved at the door

Found: the release's live verification opened the regional workspace and the credit chapter, and
nothing else. The Thailand workbench, the Bible, both research notebooks and both guides — five of
the seven surfaces the site publishes — were reached only by the browser suites, which the release
runs against a local build and never against the deployed bytes. A release could therefore pass
with a workbench that loaded a placeholder and a Bible that rendered nothing, as long as the
regional workspace answered.

Found: the one workbench assertion that did exist was a wait in disguise. It waited for `#kStock` —
an element the page ships in its static markup with a placeholder in it — and then read that element
and asked for a magnitude. The element is always there; the figure is not. The wait resolved in
milliseconds and the assertion then read "—". It failed once, loudly, for the wrong reason: the
check reported a figure problem when the real problem was that nothing had been waited for.

Found: a headline figure with nothing to check it against. "8,422.9 M" is a number the site could
print while the calculation behind it said something else. Nothing compared the two, so a drifted
KPI and a correct trace would both have passed.

Changed: the surface checks now live in one place — `scripts/lib/live-surfaces.mjs` — and both the
live verification and the falsifier run that same copy. A falsifier that tested a paraphrase of the
check would have proved the paraphrase.

Changed: every wait is for the content the next assertion reads. The workbench waits for the figure
and for the trace, not for the box that holds them; the Bible waits for the rendered chapter; the
regional workspace waits for the dataset flag it names.

Changed: the workbench's figure is now checked against its own calculation. The trace's tCO₂e
figure is parsed and formatted the way the page formats it, and the headline must equal it. The
area must carry its hectare unit. The map must be present and larger than a strip. The Bible must
have a chapter with a title, a body and at least one source. The research notebook's index must
count 23 chapters and its skip link must land on the first chapter. The guide's routes must each
carry a title and a description.

Changed: `scripts/live-surface-falsifier.mjs` breaks all of it on purpose and requires the gate to
catch each one. It is wired into `npm run test:spatial`, so the release runs it: a gate that cannot
fail is not a gate, and a gate that cannot fail is worse than no gate, because it is trusted.

Verified: nineteen defects, each caught by the shipped assertion, not by a paraphrase —
the headline left as a placeholder; the headline drifting from the trace; the trace losing its
figure; the area losing its unit; the map collapsed to 100px; the Bible's count drifting; the
chapter losing its title; the chapter body emptying; the chapter naming no source; the research
index miscounting; the skip link landing on the front matter; a guide route losing its title; a
guide route losing its description; the guide losing a route; a country number losing its dated
source; the comparison table losing a period; the desktop button and the phone selector naming
the same view differently; a page scrolling sideways; and the wait resolving while the figure was
still a placeholder. The last one is the important one: it is the difference between a wait and a
pause.

Verified: the live verification passes against the deployed site — commit 90d618b, five surfaces,
two languages, two widths, twenty surface openings, the 404 page, the comparison periods and the
ozone correction — and leaves its evidence behind in `test-results/live/` as a receipt and twenty
screenshots.

Remaining: the live proof reads one width per breakpoint (390 and 1440). The regional workspace's
own gate measures eleven widths, but the other surfaces are proved at two. A reader on a 1024px
tablet is between the two measurements and therefore unmeasured.

---

**Closed on 28 October 2026.** The code beside this note already reads three widths — 390, 1024
and 1440 — so the tablet reader is no longer unmeasured; the paragraph above was written before
that change and was left here as the record of what was outstanding at the time. The surface
list has since grown to six (the About view joined it, because it is a published surface with
published figures), the assertions have moved from literals to the data they describe, and the
falsifier now breaks twenty-five defects rather than nineteen. See
[`CAPABILITY.md`](CAPABILITY.md) for the full record, including the navigation helper that had
never worked and the capability matrix that had drifted.

