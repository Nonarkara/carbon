# Two-line regional header

Found: the current served build had three bands above the map (identity, controls, snapshot metadata). The owner's displayed screenshot still showed a much older four-button layout; the live HTML inspected on24October had the native selector and localized fallback. These are different observations, not evidence of a specific cache fault.

Changed: metadata travels with the map legend. The full boundary note is in a native disclosure. Header and country/metric/view controls occupy two rows. Chrome measurement excludes metadata now belonging to the map; the mobile forced scroll/minimum-height rule is removed. No data, method, source or view is deleted.

Verified: TH/EN at390x844,1024x768,1440x900 and390x568 on a manifest-checked server. Map starts104px from the top on phones (12.3% of844px),109px desktop. Thai phone map grows602.9→629.5px; short-phone map326.9→353.5px. No document width overflow or nested map scrolling in these cases. Boundary disclosure opens to the retained legal/use caveat. scripts/sea-header-proof.mjs is part of the release's spatial gate.

Independent re-review: standalone and embedded TH/EN at390/1024/1440 pass. At200% per-element text size, chrome is110–123px and map height438px or greater; no horizontal bleed. All16 browser suites and the spatial gates pass. Remaining: the pristine release, deep audit and live exact-byte checks must pass before a live claim. Dependency audit0 and source/feed tests9/9 passed in the independent review; this is scoped evidence, not a guarantee of absence of vulnerabilities.
