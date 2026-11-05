# The map share, and what it costs

Found: the law measured a number it never judged. The spatial gate records the map's share of
the first screen at every width it visits — 48 viewports across 11 surfaces — and asserted it
at exactly one: 1440. Everywhere else the number was measured, printed in the chrome-cost
lines, and then ignored. A number that is measured everywhere and judged in one place is a
number nobody has to keep.

Found: at the narrowest desktop the map was below the law's floor and nothing said so. At
1101×900 the map held 56.9% of the first screen; the law asks 60%. At 1280 it held 60.7%, and
at 390 it held 65% and at 1024 74.8%. So 1101 was the one width where the product was under
the floor, and the gate was silent about it.

Found, by trying: the 60% at 1101 can be bought. The assessment rail beside the map is 350px;
narrowing it to 300px gives the map 801px and lifts the share to 60.7%. The law caught the
price in the same run:

```
MEDIUM accidental-wrap   home-en@1101 aside.rail>div.tab-body>section>div.actions
MEDIUM scattered-actions home-en@1101 aside.rail>div.tab-body>section>div.actions
```

The rail's action strip broke onto two lines. The map share was not free — it was paid for in
the assessment panel's own controls, which are earned working surface the law protects. The
change was reverted.

Changed: the gate now judges the map share at **every width it measures**. Where the map has
the screen to itself the floor is the law's 60% — 390 (65%), 1024 (74.8%), 1440 (64.7%). At
the narrow desktops, where the assessment rail shares the screen by construction, the floor is
55% — 1101 (56.9%), 1280 (60.7%) — and the reason is written into the assertion, so nobody
later reads 55% as a silent lowering of the law. It is a composition boundary: at 1101 the map
and the assessment rail cannot both have the screen, and the rail is the one the law protects.

The number is still binding. A regression at any measured width now fails the gate, and the
message names the width and the share.

Changed, because a check that has never failed is a check nobody has to keep: the share, the
floor and the check now live together in `scripts/lib/map-share.mjs`, and
`scripts/map-share-falsifier.mjs` drives them against the real page. It measures the shipped
layout (56.9% at 1101) and confirms it clears the floor; it then widens the assessment rail
until the map holds 30.4% and confirms the check throws; and it pins the floor — 60% at the
widths the law names, 55% only across 1101–1279. It is wired into `npm run test:spatial`.

The falsifier also caught its author: it was written expecting the narrow band to include
1280, and the floor function disagreed. The band ends at 1279, where the measured share is
60.7% and the law's 60% applies.

Verified: the law runs as one command and every gate passes; 136 unit tests pass; eighteen
browser suites pass; the 582-page deep audit holds.

Closing a carry-forward: the regional map on a phone. The 1 November audit left "the 11
countries fill about 36% of the map height" open on sea.html at 390. Measured on the shipped
page: the map is 390×665 and the eleven countries' drawn geometry spans 278×444 of it — 71.3%
of the width and 66.7% of the height. The map is already framed to fit all eleven, and
`scripts/sea-header-proof.mjs` holds it to 60% of the first screen at all thirteen widths with
its own falsifier for the old oversized rail. The remaining third is the ink inside that frame:
the region is wide and archipelagic, so the land is scattered across sea. Zooming further would
cut countries off the screen. It is the subject's geography, not wasted layout, and it is not a
defect to fix.

Remaining: the composition boundary at 1101–1279 is stated, not removed — the map and the
assessment rail want the same pixels at the narrowest desktop, and the rail wins because it is
earned. Still unverified, and not verifiable here: a real iOS device, enlarged text on every
surface, and dark mode. Field validation, credit eligibility and participant usability remain
outside what software can establish.
