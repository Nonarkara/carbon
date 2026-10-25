# A toolbar that fits the labels it carries

Found: the regional reset carried a two-line label inside a 62px button at every phone width —
"ดูทั้งภู" over "มิภาค" in Thai, "Whole" over "region" in English. It was the only control on the
row whose label did not fit, and the release-gated proof checked the three selectors and never
the button. On the desktop widths the release declared verified, the metric selector truncated
the longest label it can show: "การสูญเสียเรื้อนยอด · ล้านเฮกตาร์ · สะสม 2001–2…" at 1024 and 1440
(300.1px of text in a 290px box) and "Peatland carbon stock · Gt C · 2000 reference year" at 851.
The unit and the reference year of the chosen metric were unreadable exactly where the map is
largest. At 320px the country selector clipped "ติมอร์-เลสเต" (83.6px of text in a 75.4px box) and
the view selector clipped "Evidence" (68.2px in 64.1px): 320px was in the law's matrix, but the
label check ran only at 375 and 390. The regional comparison table was checked by nothing — the
static wrapper check listed the research and guide pages but not sea.html, and no runtime
assertion looked at the frame that lets it scroll.

Changed: the reset is sized to its own word, and the phone toolbar's four tracks are measured
minimums (country 86px, metric 88px, view 71px) with the reset on the width of its content; the
label no longer wraps. The phone shows "ภูมิภาค" / "Region" and keeps the full phrase "ดูทั้งภูมิภาค" /
"Whole region" in the title and the accessible name; the desktop keeps the full phrase. The
desktop metric selector is now 344px — the width its longest label needs, 324px including the
native arrow — and the country selector drops from 240px to 120px, which its longest name never
needed. The row still fits at 851px with room to spare. public/sea.html joins the table-wrapper
check, and the regional proof now asserts that the comparison table does not scroll inside itself
and that the frame which does scroll can be reached by keyboard. No data, source, period, unit or
method changed.

Verified: 22 measurements, 11 widths × 2 languages from 320px to 1440px plus a 390×568 short
phone — no selector label clipped, no reset label wrapped, no sideways overflow, no nested map
scroll; the map holds 337px or more on every phone width and 575px or more on every desktop width.
Each of the four new assertions was falsified on its own: reinstating the 300px metric selector
fails at 851px, reinstating the 62px reset column fails at 320px, forcing the reset to wrap fails
with "reset label wraps at 320px", and dropping the title fails with "reset label loses its full
phrase". All four regional views — map, evidence, compare, research — measured at 320/390/768/1024/
1440 in both languages: no sideways overflow, nothing bleeding past the viewport, nothing hidden
without a way to scroll it into view. The law: 11 surfaces / 44 viewports PASS, deep content
audit 546 pages PASS, unit tests 123/123, 16/16 browser suites, CI green.

Remaining: the phone view selector said "ตาราง" / "Table" where the desktop button said
"เทียบ 11 ประเทศ" / "Compare 11" — a reader who changes device met two names for one view; that
is fixed in the audit beside this one. The reset still duplicates the country selector's first
option ("ทั้ง 11 ประเทศ" / "All 11"); what it adds is the return to the map, so it is a shortcut
rather than a distinct state. The regional proof writes its screenshots and report under
test-results/. An earlier version of this note claimed the law never measured the regional
views at all: the deep audit does walk all four, in Thai at three widths. What it did not walk
was the English views or the narrow widths, and that is now closed in the audit beside this one.
