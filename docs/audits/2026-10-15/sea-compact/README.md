# SEA map space regression

The regional route used separate rows for brand, references/languages, selectors, map reset, retrieval date and status. At a 370px CSS viewport, the map began at y=297.98px. The new composition begins at y=161px, a 46% reduction, while retaining 44px-high controls and all functions.

- Header: identity with a regional subtitle, native Read/อ่าน disclosure, language buttons.
- Toolbar: country and metric labels/selects in two columns.
- Data notice: dated snapshot caveat and retrieval date remain above the map.
- Whole region: visible reset at the map's top right, away from zoom controls.

The CI regional browser suite tests both languages at 320/370/375/700/701/768/1440px. At each width it requires header height <=64px, map start <=170px, >=300px of map visible without scrolling, no horizontal page overflow and no button shadows. It also exercises reference disclosure, reset, selection, language, keyboard map, downloads, reader routes and snapshot failure. A future larger header must fail this gate rather than silently consuming map space.

Before/after screenshots are captured from the actual local application at 370×740. Normal-text budgets must not be enforced by clipping enlarged text.

Local verification: 93/93 Node tests pass; regional browser suite passes 14 language/width combinations and all existing behavior checks, with zero page errors. Phone map top is 161px; tablet/desktop map top is 145px; header height is 54px throughout. Controls remain at least 44px high and retrieval dates remain visible. The 320px English metric selector retains its complete forest share/year label.
