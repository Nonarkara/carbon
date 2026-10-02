# Kabonna: colour as navigation

## Superseded: first 2 October 2026 direction

The owner's request for a palette-led overhaul supersedes the earlier exact-Malaysia colour instruction. The map-led layout, bilingual type, data, exports and scientific caveats remain. This is a presentation change, not a new model.

Intent: lively enough to invite exploration; serious enough to inspect evidence.
Relationship: dark botanical structure against warm light, with a small pink counterpoint.
Chord: plate 342, Corinthian Pink #f8b6ba / Cream Yellow #fdbf68 / Orange Citrine #986f2d / Deep Slate Olive #253122.
Source: https://github.com/Nonarkara/palette at 6f389dfe232e5afe12402f1e693a216ac128e712; https://colors.nonarkara.org/#plate-342. Digital reconstructions, not exact historical inks. Repository credits Matt DesLauriers' MIT dictionary-of-colour-combinations data and Dain Blodorn Kim's earlier compilation.
Roles: olive navigation and world rail; cream primary actions and result heading; pink research/guidance; ochre focus and restrained links. Light neutral reading surfaces are production extensions. Colour always accompanies words, position or selected-state borders.
Budget: map owns the main field; neutral results and olive instruments are supporting fields; cream is an action signal; pink is a rare editorial accent. Dataset legends and institution logos retain their own meanings.
Risks: olive text on olive surfaces; small pale metadata; short phone viewports; map legend mistaken for chrome. These require browser checks, not swatch approval alone.
Proof: automated contrast pairs, screenshots at 375 / 768 / 1440, Thai and English, manual, Research and workflow regression tests.

## Release audit

At the start of this change the working tree was clean. Local HEAD, GitHub main and live version all reported c869532. Earlier context entries describe historical work in progress; later entries record its completion. There was no evidence of uncommitted work to recover.

`public/css/kabonna.css` owns the new visual roles. It loads last in the system, generated manuals and research notebooks. Earlier styles remain the functional foundation; no map, calculation or research content is removed.

## Verified before release

- 67 unit tests passed; existing browser, client-demo and manual-led journeys passed.
- `npm run test:design` checks both languages at 375, 768 and 1440 px: no page overflow, at least 280 px of map height, all 77 province choices, phone World access, main text contrast ≥4.5:1, and Research/manual rendering.
- Screenshots reviewed in normal colour, simulated deuteranopia and grayscale. Primary actions remain distinguishable by light/dark value and labels. These checks are not a substitute for a human usability study.
- Production asset check before editing confirmed dashboard.css was byte-identical to the local/GitHub version.

## Current: Bauhaus brutalism — owner correction, 2 October 2026

The owner rejected the olive/cream scheme as too close to Malaysia and explicitly rejected button shadows. This supersedes plate 342 above. White ground and black structure now dominate. Red #bd251b identifies the province action, yellow #ffdf00 the area-selection tool, and blue #1643c5 the world instruments and Research. Main type is sans serif, rules are solid black, corners square. All decorative shadows are removed, including inherited Leaflet controls; keyboard focus uses an outline. Data legends and institutional marks retain their own colours. No calculations or content change.

## Owner-supplied CT identity and mobile web app

Source: the owner's “ChatGPT Image Oct 2, 2026, 04_12_14 PM-4.png” sheet (2 October 2026). It is flattened RGB, so transparent PNG variants were prepared using imagegen and inspected in a browser on white and coloured grounds. White cutouts are alpha, not white paint. Logo colours are intrinsic brand assets, independent of the Bauhaus chrome.

- ct-mark.png: compact header identity; 32 px browser favicon.
- ct-colour.png: full Research lockup on white.
- ct-monochrome.png: manual index on white.
- ct-app.png: green tile with transparent letter cutouts, installation illustration; 180/192/512 px icons derived with aspect-preserving resizing.

No CSS inversion, tint, forced fill, backdrop, border radius or shadow is applied to these PNGs. Green/charcoal variants belong on light grounds; the dark blue proof is a transparency diagnostic, not their intended placement.

The availability link is for a browser web app. Installation instructions cite Apple Support and Google Chrome Help; manifest standalone mode and Apple touch-icon metadata support home-screen launch. Internet and session-only input limits remain explicit. No offline cache is introduced. Chromium tests validate manifest, icon dimensions, transparent pixels and phone layouts; installation on physical iOS/Android devices is not claimed.

## Native carbon Bible · 2 October 2026

Human task: find the explanation behind an app number, understand its calculation and return to the workbench without losing inputs. Conserved: map, province/area selection, world feeds, registry, calculation flows, exports, Research, manual, current CT branding and flat Bauhaus palette.

Compositions considered: a single long reference page, versus a searchable chapter index + central reader + source shelf. Chosen: the reader; the long page makes source tracing and phone navigation harder. On phone the bounded chapter list precedes the article; sources follow it. TH/EN switches preserve chapter, query and category. Separate-tab app entry preserves browser-local workbench state.

Sources → adaptation: CFO Lite's public organization/history/offset workflow informs the teaching path. Authenticated calculation screens were not reviewed. GHG Protocol and ISO scope distinctions inform the reference; standards are cited without pretending certification. Every ledger dataset is generated into the source shelf from the deployed manifest. National examples import the app's pure calculation modules. Workflow diagrams carry actual steps; no decorative geometric filler or button shadows.

Roles: yellow header marks the tool family; blue identifies evidence/navigation; red marks chapter category; black rules separate index, article and source shelf. White remains the reading surface. Native inputs, anchors, print and clipboard keep interactions predictable.

Verification: bilingual search, AND terms, Unicode normalization, category isolation, source/related-link integrity, full manifest dataset coverage and derived stock example are automated. Browser checks include search, language preservation, no-result recovery, deep links, TH/EN and phone/desktop layout. Authored quality was visually reviewed; no independent user usability session has occurred. Remaining human review: have a first-time SME reader follow the CFO teaching path, and a qualified carbon reviewer assess method applicability to an actual project.
