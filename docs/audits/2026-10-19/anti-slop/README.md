# Visual simplification · 19 October 2026

The owner requested a stronger removal of AI-design conventions after the functional release audit. Baseline84874c7: mixed primary faces across page families; saturated world rail competing with the map; repeated nested borders and coloured task panels; full-width short-label actions; phone guides spent their opening screen on duplicated navigation; research introduction/abstract exceeded a comfortable reading measure.

## Decisions

- Use two self-hosted OFL families: Jost for Latin and Prompt for Thai. Fontsource5.3.0 packages, unmodified400/600/700 WOFF2 subsets and both font licences are served locally. The original Malaysia reference and historical font assets remain; new type.css owns current rendered typography. Numbers use tabular figures from the same family.
- The map remains the coloured instrument. Supporting world feeds use neutral grey, black figures and underlined source links. Yellow marks the area action; field/legend/brand colours retain their own meaning.
- SEA metric records group label/source beside value/unit instead of spending another whole row on provenance. No quantity, source period or limitation is removed. The calculation loses its decorative grey panel/blue stripe.
- Bible diagrams keep their labels, relationships and downloads, lose the redundant outer frame, and take less height. Native chapter outlines expose section links when requested. Filter choices become flat text controls rather than a wall of boxes. Copy/print actions fit their text.
- Phone guides use native disclosures for contents and the screen diagram; both remain directly accessible, with visible open/closed carets. Route descriptions remain available. Desktop guides keep the full index and diagram. The instructional sequence, examples and export steps remain.
- Research uses a bounded text measure, an unboxed question/answer summary and the existing Dr Non portrait/profile beside the opening argument. No quotation, biography or scientific result is invented.

No map, chart, export, chapter, source licence, scientific warning, stock/flux/issuance distinction or browser-local file behaviour is removed. Shared flat-controls.css remains the last stylesheet and keeps shadows, transforms and rounded controls prohibited. This is a visual/editorial release, not a data refresh or external assurance.

The new CI browser gate checks all five page families in both languages at1440/1024/390px: current fonts and licences, map hierarchy, unboxed diagrams, phone access to tasks/explanations, native disclosure operation, author identity, research measure and horizontal overflow. It waits for parsed stylesheets before inspecting fonts; DOM presence and fonts.ready alone can precede stylesheet completion. Existing tests retain the regional map budgets, contrast and active-navigation checks, privacy, numerical examples and data conservation.
