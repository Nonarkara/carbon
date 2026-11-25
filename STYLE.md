# Carbona · product style contract

Updated 25 November 2026. This records the accepted product; it does not authorize a new theme. Owner laws: [MSH](docs/MSH.md), plus the current `_reference/MSH.md`, `GLANCE-PATH-FOR-AI.md` and `KINETIC-GRIDS-FOR-AI.md`.

## Grid and attention

Map workspaces use **column / modular** edge instruments. The map is the entry; selected quantity, evidence and action sit at its exit. One thin shared Thailand/SEA header; compact public geography, metric and view controls. No decorative introduction or second hero. Default map views preserve the existing 60% map-area floor. Enlarged text retains complete labels and reachable actions rather than hiding text to meet a pixel budget.

Readers use an editorial column and a contents rail that folds on phones. Comparative rows remain tables when column relationships matter. Do not duplicate a table with a less qualified number strip. Native disclosure hides auxiliary detail without removing evidence. One horizontal scrolling frame per wide table; the table itself never scrolls.

## Colour and typography

Current product tokens are in `kabonna.css`, `type.css` and `flat-controls.css`; inherited Malaysia declarations are overridden deliberately. Use **Jost** for Latin and **Prompt** for Thai, self-hosted OFL weights 400/600/700. Never reintroduce the inherited font stack as the final computed face. Tabular numerals for quantities and equations. Typical roles: 12px source metadata, 14px task body, 20–24px principal quantities, 28–38px reader headings. Reader prose remains 15–16px with Thai-aware leading; controls inherit and adapt at 200% text.

Paper white, ink near-black; yellow signals the principal action/selected state, blue is an evidence link, red denotes a warning. Forest choropleths and diverging signed-net palettes encode data, not decoration. Yellow is not small text on white. Missing data remains visually and textually distinct from zero. Never recolour source logos or invert transparent white cutouts.

## Geometry and interaction

Square flat controls, hairline grouping, no button shadows, gradients, blur or decorative icon tiles. Boxes fit information. Dense pointer groups use the existing 28px target; coarse-pointer controls use 36px. Isolated controls follow their current larger target rule. Keyboard order matches visual order; visible focus and complete native select names remain available. Motion only responds to a user action and respects reduced motion.

## Ownership in the existing cascade

| File | Responsibility |
|---|---|
| `malaysia.css` | Inherited layout primitives and Leaflet base; preserve protected reference behavior |
| `app.css` | Assessment fields, results, import/evidence UI |
| `dashboard.css` | Carbon instruments, ledger, province and world views |
| `kabonna.css` | Product identity/palette, brand and partner marks |
| `ship.css` | Responsive operational shell, map/rail view composition |
| `type.css` | Final self-hosted typography and numeric roles |
| `reading.css` | Reader measure, disclosure and print relationships |
| `workspace.css` | Shared Thailand/SEA header and compact selectors |
| `flat-controls.css` | Final cross-surface target sizing and flat control geometry |
| `research.css`, `bible.css`, `sea.css` | Surface-specific content relationships |

Fix a conflicting component in its owner. Do not append a new generic override sheet. Remove a duplicate responsibility only after caller/selector and rendered checks; historical assets and provenance are not dead code merely because they are not on the first screen.

## Proof

Run `npm run test:spatial` and the content audit, including phone 390×844, tablet1024×768, desktop1440×900, 1100/1101px shell transitions, short phones and 200% text. Measure chrome cost, map share, row cost and action separation. Screenshots, colour/overflow lint and green tests do not replace an independent visual review. Record findings and unresolved states honestly.
