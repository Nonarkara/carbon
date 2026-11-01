# Merged work, and the phone the law never judged

Found: five branches on `origin` carried work that was never merged into `main`. A phone
redesign, a catalogue privacy sanitisation, a CI readiness fix, a report-only security scan,
and a Pillow pin. Each was somebody's finished work, and none of it was in the product.

Found: the phone branch was forty-nine commits behind `main`, and its interface was designed
against a header that no longer exists. `main` has since built the shared workspace bar, the
regional entry, and the measurement controls over the map tiles. A wholesale merge of that
branch would have reverted all three, and it conflicted in nine files.

Found: the branch was right about the phone, and `main` was wrong. Measured on the shipped
product at 390×844, in Thai: the header was 73px, the bottom band 57px, the tap targets
28–30px, and 209px of furniture stood between the reader and the map — a quarter of the first
screen spent on a band of three buttons the reader opens once. The branch's own gate said the
header must be ≤56px and the map must keep the first screen. `main` failed both.

Found: the branch's tap-target assertion was wrong, and would have caused harm. It demanded
44×44 from a fine-pointer browser, while this project's own design system sets 28px for a
mouse and **36px for a coarse pointer** — the standard the regional workspace's proof already
enforces on a touch screen. Porting 44×44 verbatim would have inflated every control in the
bar, which is the law's "inflated control" class wearing a disguise. The workbench's phone
targets were also never measured at all: the regional workspace has a touch proof, the
workbench had none.

Found: the law measured the thing and never judged it. The spatial probe records `keyTop` —
where the reader's work begins — on every surface at every width, and nothing reads it. On the
phone it was 203px. The instrument could see that the map was a quarter of the way down the
screen and had no threshold to say so.

Found: the branch's fix would have hidden the product's answer. It moved the stock figures
into a drawer labelled "ชั้นข้อมูล" — layers — which is a mislabel for a figure, and a number the
reader came for behind a tap.

Changed: the four low-risk branches were merged. The Pillow pin (12.3.0, with a dry run
proving the overlay PNGs byte-identical), the catalogue sanitisation, the CI readiness fix and
the report-only security scan. The CI conflict was resolved in favour of `main`: the branch
still started a dev server by hand on a hardcoded port, which `main` had already replaced with
a runner that starts its own server on a port it chooses. The catalogue branch's own
hardening — actions pinned to commit SHAs, `persist-credentials: false`, `permissions:
contents: read` — was kept. Its new gate now fails if any email address or contact field
survives in the committed catalogue snapshots, and checks the sanitised files against the
public hashes, so the record cannot drift from the data.

Changed: the design-review contrast fix was hand-merged rather than taken whole. The branch's
canvas sampling handles the colour forms headless Chrome actually returns — a system colour, a
modern `color()` value, a `NaN` channel, a control hidden by a closed disclosure — while
`main`'s own server handling was kept, because the branch's file was the older of the two on
that point.

Changed: the phone header is now ONE band. The map's tools were a second row of three buttons
under the bar; they drop from the bar as a panel instead, opened by one control, and Escape or
a tap on the map puts them away. The header falls from 73px to 43px on a touch screen, the map
begins 30px higher, and its share of the first screen rises from 68.5% to 72%.

Changed: the touch targets follow the project's own standard rather than a stricter invented
one — 36px on a coarse pointer, and Leaflet's own zoom buttons, which were 30px, were raised
to join them.

Changed: the ship test now proves the phone the way the regional workspace's proof proves its
own: a touch context, at 390×844, in both languages, asserting the header is one band, the map
keeps the first screen, the centre of the screen is the map, the tools panel starts closed and
opens and closes, and every control a thumb must hit is at least 36px.

Found, by measurement: the tools panel was painted over by the map. Leaflet's SVG panes carry
z-index 400 and above, and the panel sat at 40, so the button that opens the layers was
invisible to a click. The panel was lifted above the map's panes, and the layer panel now
escapes the panel's own clip instead of being cut off inside it.

Verified: 131 unit tests pass, including the new catalogue-privacy gate. The merged branches'
own claims were checked rather than taken: the research notebook holds 23 sections in both
languages with chapters 17–20 present, both domains serve the released commit, and the
falsifier catches 27 defects.

Remaining: the workbench's touch targets are now measured, but only at one width (390×844) and
in one orientation. The landscape phone (844×390) is not yet proved, and the workbench has no
counterpart to the regional workspace's eleven-width proof.
