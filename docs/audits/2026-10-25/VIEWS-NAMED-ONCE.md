# One view, one name, and every view measured

Found: the comparison view had two names. The phone selector said "ตาราง" / "Table" while the
desktop button said "เทียบ 11 ประเทศ" / "Compare 11", so a reader who changed device met one
thing under two words, and only one of the two words was ever on screen at a time — the defect
was invisible to every screenshot taken on one device. The deep audit walks the four regional
views, but in Thai at three widths; the English views and the narrow widths were never walked by
the law at all. An earlier note in this folder claimed the law never measured the views: that
was wrong, and the correction is recorded there.

Changed: the comparison view is called "เทียบ" / "Compare" at every width, in the selector and on
the button, and the full description — "เทียบ 11 ประเทศ" / "Compare all 11 countries" — stays in
the heading of the section it opens. The regional proof now walks all four views at all eleven
widths in both languages and asks what the deep audit cannot: does a view push the page sideways,
does it hide content it cannot scroll, can its content be scrolled into view, and does it paint
outside the viewport. The deep audit now walks the English regional views too, so the audit
grows from 546 pages to 558.

Verified: 22 width and language combinations × 4 views — no sideways push, no hidden content, no
unreachable content, nothing painted outside the frame — with the selector and the button naming
every view identically. Each new assertion was falsified on its own: naming the phone selector
"ตาราง" again fails with "the compare view is named 'ตาราง' in the selector and 'เทียบ' on the
button"; removing the comparison frame fails with "the compare view pushes the page sideways at
390px"; clipping the evidence panel fails with "the evidence view hides content it cannot scroll
at 390px"; making that panel overflow instead of scroll fails with "the evidence view has content
that cannot be scrolled into view at 390px"; shifting the comparison heading outside the
viewport fails with "the compare view paints outside the viewport at 1440px". One mutation that
did not fire was correct: content shifted outside the viewport inside a scroll frame is
reachable, so the gate stayed silent.

Remaining: the paint-outside-the-viewport assertion has teeth only where the body does not clip
the page to the viewport — on a phone the body clips, so the equivalent failure there is content
hidden without a way to scroll it, which the hidden and unreachable assertions cover. The reset
still duplicates the country selector's first option; what it adds is the return to the map.
