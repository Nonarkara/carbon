<p class="research-kicker">Research notebook · Thailand · 25 September 2026</p>

# A forest worth caring for. Evidence worth trusting.

<p class="research-deck">A practical case for using AI, satellites and field measurements to make forest carbon understandable—and every estimate open to scrutiny.</p>

A person can spend years protecting a forest and still struggle to prove what that work has achieved. The trees are there. The effort is real. The evidence is scattered across survey sheets, maps, government tables and satellite archives. Turning those pieces into a defensible carbon estimate takes work that a beautiful dashboard cannot wish away.

That is the reason for this project. Make the evidence easier to assemble. Make the calculation easier to question. Give the person in the field and the person reviewing the result a shared view of what is known, what was assumed, and what still needs measuring. Technology earns its place when it makes that conversation more honest.

This independent pilot grew from an enquiry about AI-assisted forest-carbon assessment from Thailand's greenhouse-gas management community. It is a working research instrument, with public code and traceable calculations. No TGO endorsement, approved AI model or credit issuance is claimed.

## 01 · Start with the question that matters

“How much carbon is in this forest?” and “How many credits can this project receive?” require different evidence. A forest can contain a great deal of carbon without that entire stock being available for a new credit claim.

| Quantity | Plain meaning | What this workbench does |
|---|---|---|
| Carbon stock | Carbon held in the included tree pools at a date, expressed here as tCO₂e | Converts supplied biomass or accepts a compatible total tree-stock estimate |
| Monitoring-period change | The difference between comparable dates, after applicable deductions | Calculates a signed estimate from the supplied inputs |
| Issued credits | Units approved and recorded through the relevant programme | No registry connection; never inferred from the estimate |

```mermaid
flowchart TD
 A["Define an eligible project and its boundary"] --> B["Measure comparable tree stocks at two dates"]
 B --> C["Apply the selected methodology and required deductions"]
 C --> D["Independent review and programme approval"]
 D --> E["Registry issuance is a separate external step"]
```

The order matters. Drawing a polygon establishes a calculation area; it does not establish land rights. Finding trees establishes vegetation; it does not establish additionality, meaning the benefit required beyond the applicable baseline. A registration count is administrative evidence, not proof that the same carbon has never been claimed elsewhere.

## 02 · Follow one tonne through the calculation

Trees are measured before they become numbers on a carbon ledger. Diameter and height feed an **allometric equation**: a relationship developed from measured trees to estimate dry biomass. “Dry” matters because water adds weight without adding the carbon being estimated. The equation must fit the forest and tree group.

The current importer supports the TGO appendix equation for mixed deciduous and dry dipterocarp trees, with DBH at least 4.5 cm. It estimates aboveground biomass from measured trees, then expands the plot total by surveyed area under a single representative-stratum assumption. It does not prove that the sampling design is representative. Empty plots cannot be represented by the current CSV format; do not quietly drop them. See the [user guide](guide-en.html) for coefficients, units and exclusions.

```mermaid
flowchart TD
 A["Diameter (cm) + height (m) in measured plots"] --> B["Suitable tree equation → dry aboveground biomass"]
 B --> C["Expand by surveyed area within a representative stratum"]
 C --> D["Include roots using the applicable root:shoot ratio"]
 D --> E["Multiply by carbon fraction, then 44/12 → tCO₂e"]
```

For the general-tree factors in [TGO tree tool v2](https://tver.tgo.or.th/database/Uploads/Tool/c575f516-1f3c-4dbc-83ec-2ab65e1d76dc.pdf), roots are estimated at 0.27 times aboveground biomass and the carbon fraction is 0.47. The factor 44/12 converts carbon mass to the corresponding CO₂ mass. Other tree groups use other factors. If an input already includes roots or is already in tCO₂e, applying those conversions again inflates the answer.

### A worked example you can reproduce

Assume the same project's dry aboveground biomass rises from **1,000 to 1,100 tonnes**. Keep factors and included pools unchanged. This is synthetic teaching data, not a measured Thai forest.

| Step | Calculation | Result |
|---|---|---:|
| Aboveground increase | 1,100 − 1,000 | 100 t dry biomass |
| Include estimated roots | 100 × 1.27 | 127 t total biomass |
| Convert to carbon | 127 × 0.47 | 59.69 tC |
| Convert to CO₂ | 59.69 × 44/12 | 218.8633 tCO₂ |

This is the stock increase before applicable deductions. For an exactly five-year duration, its average is 43.7727 tCO₂ per year. The app instead divides by elapsed days / 365.25; its sample dates therefore produce a slightly different annual average. Neither average creates five additional claims on top of the period total.

The selected accounting reference is [Standard T-VER-S-METH-13-01 v2](https://tver.tgo.or.th/database/Uploads/Methodology/482ce748-b43f-4432-aef8-d7745dcc2692.pdf): current tree stock minus baseline or last credited stock, minus prescribed project emissions and leakage. This method does not consider leakage, so that term is zero here. Its fire conditions, eligibility and small-project limit must be checked in the full document. Other activities and programme tiers can require different accounting. A loss stays negative; the software must not hide it behind a zero.

## 03 · What the satellite sees—and what it needs from the field

The [JAXA vegetation page](https://earth.jaxa.jp/en/data/products/vegetation/index.html) is a useful starting point. It provides routes to vegetation indices, leaf-area information and forest/non-forest products. These observations describe vegetation. They do not measure issued credits.

NDVI compares red and near-infrared reflectance. It can help describe greenness, but a greener pixel is not a universal quantity of stored carbon. Forest type, season, canopy structure and observation conditions affect interpretation. A model connecting imagery to biomass needs suitable measurements and validation.

| Source | Contribution to a pilot | Limit that travels with the data |
|---|---|---|
| [JAXA PALSAR / PALSAR-2](https://www.eorc.jaxa.jp/ALOS/en/dataset/fnf_e.htm) | Radar predictors and forest screening; approximately 25 m mosaics | Preserve observation dates, masks and processing versions; check download registration and terms |
| [Sentinel-2](https://dataspace.copernicus.eu/data-collections/copernicus-sentinel-missions/sentinel-2) | Optical predictors and cloud-screened change evidence | Compare usable observations with compatible seasons and processing |
| [NASA GEDI L4A v3](https://doi.org/10.3334/ORNLDAAC/2508) | Footprint estimates of aboveground biomass density, prediction errors and quality information | Samples are not a continuous parcel census or error-free field truth |
| Measured field plots | Local evidence for fitting and independently testing a model | Record sampling design, coordinates, dates, species/group and measurement quality |

The project workbench does not use these products: its numbers come only from the user's own measurements. The carbon map (section 06) does use published satellite products — ESA CCI Biomass and JAXA's forest map among them. It runs no model of its own: it re-grids, masks and converts those products, and its landscape figures never feed a project calculation. The street and imagery basemaps are navigation aids, not evidence.

## 04 · Give AI a job it can be tested on

The useful first AI task is specific: predict biomass for a defined forest type from dated observations, then compare those predictions with independent measurements. A language model can help explain a method or flag a missing field. It should not fill a missing biomass value with a plausible sentence.

```mermaid
flowchart TD
 A["Match plot locations, survey dates and satellite observations"] --> B["Separate training plots from spatially independent test plots"]
 B --> C["Compare a simple baseline with a candidate biomass model"]
 C --> D["Test bias, prediction error and uncertainty on unseen plots"]
 D --> E["Document valid scope and obtain required method approval"]
```

A tempting shortcut is to split neighboring pixels randomly between training and testing. The test can then reward familiarity with the same landscape. For this pilot, reserve spatially separated plots and inspect error by forest type and biomass range. Compare a simple regression with a candidate such as Random Forest before accepting more complexity. This is a proposed validation design, not a completed experiment.

Uncertainty must follow the calculation. A difference between two uncertain stock maps is itself uncertain. Shared model errors, plot sampling and spatial correlation affect how much confidence to place in the change. Reporting more decimal places does not resolve those errors. The current workbench explicitly exports uncertainty as unavailable; a validated interval remains a prerequisite for a defensible project assessment.

## 05 · Open data: open the file before believing the label

The research search for “ป่าไม้” in data.go.th on **25 September 2026** returned **570 unique dataset records and 2,111 resource records**. These are catalogue counts. They include documents, duplicate-looking resources, file components and links; they are not 570 ready-to-use biomass datasets. Nine selected resource files were downloaded and inspected. The app currently ships 11 normalized province-year observations.

| Source inspected | What was actually found | Decision |
|---|---|---|
| [Saraburi forest area](https://data.go.th/dataset/saraburi-forest-area) | Seven annual observations, 2018–2024; 2024: 532,177.56 rai | Historical province context |
| [Kanchanaburi forest area](https://data.go.th/dataset/forest-area-2567) | Four years, 2021–2024; 2024: 7,478,170.33 rai | Historical province context; checked unit agreement |
| [RFD forest cover 2019](https://data.go.th/dataset/forestarea_2562_wgs84) | ZIP contained metadata only; separate geometry headers were probed | Full geometry not ingested; CRS is UTM 47N, requiring reprojection |
| [DNP conservation-area carbon](https://data.go.th/dataset/gdpublish-67-dnp07-31-02) | Table labelled tCO₂eq without an explicit annual denominator | Do not label it yearly credits |
| [Reserved-forest table](https://data.go.th/dataset/gdpublish-https-www-forest-go-th-land) | Inconsistent area units in an inspected row | Quarantined; no guessed correction |

The full [research record](https://github.com/Nonarkara/carbon/blob/main/RESEARCH.md), [download manifest](https://github.com/Nonarkara/carbon/blob/main/research/extracted/download-manifest.json) and [normalized province data](data/province-forest-area.csv) make these decisions inspectable. A catalogue's “modified” date is not automatically a measurement date. Conflicting or restrictive licences require clarification before reuse.

### The RFD dashboard: a useful lead with a visible discrepancy

The [Royal Forest Department dashboard](https://fp.forest.go.th/rfd_app/rfd_dashboard_m/app/main.php), inspected on 25 September 2026, displayed **83,290 plantation registrants, 83,681 plots, 1,447,111 rai and 139,013,341 trees**. Its regional registration breakdown summed to **83,217 registrants**, a difference of 73. No explicit update date explaining this difference was found during inspection. These are separate observed views; neither has been silently corrected.

The northern drill-down returned 9,480 registrants in Nan and 9,538 in Uttaradit. These counts can inform a discussion about where to seek pilot partners. They cannot establish current living biomass. Public endpoints returned HTML and chart configuration without login; no documented API contract was established. These observations are a dated research snapshot, not a live integration or calculator input.

## 06 · Absorption and emission from space

The workbench answers a project question: how much has this parcel's measured carbon changed? The carbon map answers a landscape question. How much carbon do a province's forests hold? How much do they take up and release each year? What else is emitted in the same place? It uses published satellite-derived products and runs no model of its own: it re-grids, masks and converts those products, as described below. Every figure in it is a screening estimate, never a credit, and never an input to the project workbench.

```mermaid
flowchart TD
 A["100 m satellite biomass (ESA CCI 2020) and the JAXA forest map (FNF 2020)"] --> B["Each pixel counted once: one province, one 2.8 km grid cell"]
 B --> C["Forest carbon stock, with a 95% range"]
 C --> D["Beside it, never added: GFW forest flux, GFED fire, ODIAC fossil CO₂"]
 D --> E["Cross-checked against Climate TRACE and Thailand's own inventory (BTR1)"]
```

### Four quantities, four datasets

| Quantity | What the map shows | Dataset | Period | Resolution |
|---|---|---|---|---|
| Carbon **stock** | Carbon held in forest trees, tCO₂e | [ESA CCI Biomass v7.0](https://catalogue.ceda.ac.uk/uuid/6429d1aafe1e43b9b414e4a5a7f8b903) aboveground biomass, masked with [JAXA PALSAR-2 FNF v2.1.0](https://www.eorc.jaxa.jp/ALOS/en/dataset/fnf_e.htm) | 2020 | 100 m |
| Forest **flux** | Gross removals, gross emissions and their net, tCO₂e per year | [GFW forest carbon flux v1.4.3](https://essd.copernicus.org/articles/17/1217/2025/) (Harris et al. 2021; Gibbs et al. 2025) | Average of 2001–2025 | 30 m model, summarised by province |
| **Fire** | CO₂ from all landscape fire, with the share by land type and month | [GFED5.1](https://zenodo.org/records/16794692) | Mean of 2013–2022 | 0.25° (about 28 km) |
| **Fossil** CO₂ | Energy, industry and transport emissions | [ODIAC2025](https://db.cger.nies.go.jp/dataset/ODIAC/) | 2024 | 1 km |

Cross-checks: [Climate TRACE API v7](https://api.climatetrace.org/v7/docs) forest subsectors by province for 2024, and [Thailand's First Biennial Transparency Report](https://www.dcce.go.th/wp-content/uploads/2024/12/Submitted-1st-BTR_compressed-1.pdf) (BTR1) for the nation in 2022. Province boundaries are the Royal Thai Survey Department's, published by [OCHA/HDX (COD-AB v01)](https://data.humdata.org/dataset/cod-ab-tha).

### Where JAXA fits

JAXA's vegetation page offers NDVI, leaf area and a forest/non-forest map. None of these is a carbon stock. The carbon map uses JAXA's 2020 forest/non-forest map in three ways. It is the visible "JAXA forest map (FNF 2020)" layer. It decides which part of each biomass pixel counts as forest. Its land classes also weight how coarse fire and fossil data are spread over land. Both FNF forest classes count: canopy of 90% or more, and canopy between 10% and 90%.

FNF forest is not the Royal Forest Department's forest. FNF maps **44.7%** of Thailand as forest in 2020. The [Royal Forest Department](https://data.forest.go.th/dataset/https-www-forest-go-th-land) reports **31.64%** (102,353,484.76 rai) for the same year. A radar forest mask sees tree canopy. It does not know whether the trees are natural forest, plantation or a tree crop. Read "forest" on this map as "tree canopy seen by radar", not as a legal or administrative forest.

### How a number is computed

**One pixel, counted once.** Every 100 m biomass pixel is assigned by its centre to at most one province and exactly one 2.8 km grid cell. Provinces, grid cells and the national total are therefore sums of the same pixels. Automated tests check this for every quantity. Thailand's land area computed pixel by pixel is 515,415 km². That matches the boundary file's own attribute (515,416 km²) and is within 0.45% of the official 513,120 km².

**From biomass to CO₂e.** Stock (tCO₂e) = aboveground biomass (t) × (1 + 0.27) × 0.47 × 44/12. That is 2.1886 tCO₂e per tonne of aboveground biomass. These are the general-tree values of TGO's tree tool, the same ones the workbench uses. IPCC 2019 root-to-shoot ratios for Asian tropical natural forests range from about 0.21 to 0.44 by forest type and biomass class ([2019 Refinement, Vol. 4, Ch. 4, Table 4.4](https://www.ipcc-nggip.iges.or.jp/public/2019rf/pdf/4_Volume4/19R_V4_Ch04_Forest%20Land.pdf)). Using that range instead would move total biomass by about −5% to +13%.

**Forest share of a pixel.** ESA CCI biomass is a mean over the whole pixel, forest or not. Each pixel's biomass is multiplied by the fraction of the pixel that FNF classes as forest. This assumes biomass is spread evenly within the pixel. It also keeps forest plus non-forest equal to the total, so nothing is created or lost.

**Coarse data.** Fire (0.25°) and fossil CO₂ (1 km) are spread over the 100 m land pixels in each coarse cell in proportion to land area. A coarse cell with no land in the JAXA map, such as a coastal sliver, falls back to plain area, so no emission is lost in the allocation step. Emissions allocated outside Thai province boundaries, such as offshore or across a border, are excluded by design. The Thai fossil total from this allocation differs by 0.3% from a crude alternative that assigns whole 1 km cells by their centre.

**Drawn boxes.** A box is summed from 2.8 km cells, each weighted by the share of its area on the sphere that falls inside the box. Values are assumed to be spread evenly within a cell. The sum counts Thai land only; parts of a box outside Thailand add nothing. A project boundary imported in the workbench is summed with 16 sample points per cell. In practice box figures therefore have about 2.8 km resolution, not 100 m. A figure is greyed out when the box's shorter side is narrower than the dataset's cell: 2.8 km for stock, 28 km for fire, 1 km for fossil CO₂.

### Uncertainty, stated as a range rather than a decimal

ESA CCI publishes a standard deviation for every pixel. How those errors add up over a province depends on something the map does not know: how much neighbouring pixels err together. The carbon map therefore gives two 95% ranges:

- **Independent errors**, where errors cancel as pixels are added. For Thailand this gives ±0.03%.
- **Fully correlated errors**, where every pixel errs in the same direction. For Thailand this gives ±110%, and the lower end stops at zero.

Fully correlated error is the hard ceiling; the truth is expected between the two ranges. A study of biomass estimates for New York State parcels found that spatially correlated residual error dominated ([Johnson et al.](https://arxiv.org/abs/2412.16403)), which suggests the narrow range is too optimistic for large areas. Neither range includes systematic map bias. Global biomass maps tend to overestimate low biomass and underestimate high biomass ([Araza et al. 2022](https://doi.org/10.1016/j.rse.2022.112917)). The CCI Biomass fact sheet (written for v5; the map uses v7.0) advises checking regional totals against a national forest inventory or field plots, and says estimates for individual full-resolution pixels should not be used on their own ([CCI Biomass v5 fact sheet](https://climate.esa.int/documents/2791/CCI_Biomass_product_fact_sheet_V5.0_20240319.pdf)). GFW's province summaries carry only partial variance components, not a complete flux uncertainty, and the map does not use them. Its global estimate of removals for 2001–2023 is −14.5 ± 7.7 GtCO₂ per year (Gibbs et al. 2025). GFED and ODIAC publish no pixel uncertainty. The ODIAC spatial pattern is itself a model: national totals spread by night lights and point sources.

### Why these figures are never added together

- **GFW forest emissions already include forest loss caused by fire.** GFED fire in forest classes, especially its "deforestation" class, may describe some of the same events. They are marked and never added.
- **GFED counts all landscape fire.** Its land types come from its own land-cover map. In Thailand 79% of fire carbon falls in its savanna, shrub and grass classes, and only 9% in cropland; in Chiang Mai, where JAXA maps 80% of the land as forest, the savanna group is 90%. Much of this is deciduous forest by Thai definitions, and Thailand's inventory reports wildfire carbon losses on forest land. IPCC practice treats CO₂ from cropland and grassland burning as balanced by regrowth; that assumption does not cover all of this fire. Fire CO₂ is shown as gross emission from burning, not as a net loss of stock.
- **ODIAC excludes land use and biomass burning.** Its scope complements the others, but its year and method differ. It sits beside the forest figures and is not netted against them.
- **The only net shown is GFW's own**: emissions minus removals within one model. A negative value means the forest is a net sink.
- **Two stock years are never subtracted.** ESA warns that differences between CCI years "may be affected by substantial biases" (fact sheet above). The Global Forest Observations Initiative rates change estimated from two biomass maps as research-level ([GFOI 2025](https://www.reddcompass.org/mgd/resources/GFOI_BiomassMaps_Guidance-20251022.pdf)).

### Aerosol is not carbon

The atmosphere layers answer a different question from the ledger:

- **Aerosol optical depth** measures particles: dust and smoke. It shows the burning season clearly and contains no CO₂.
- **Carbon monoxide** indicates combustion, but it is not CO₂.
- **Column CO₂ (XCO₂)** from OCO-2 is a concentration along a narrow orbit track, not an emission.

Directly, plume by plume, satellites can turn XCO₂ into an emission only for large, isolated sources. A study of power plants seen by OCO-2 and OCO-3 kept 106 usable cases out of about 23,000 candidate tracks ([Atmospheric Chemistry and Physics, 2023](https://acp.copernicus.org/articles/23/6599/2023/)). Atmospheric inversions using OCO-2 estimate coarse national and regional net fluxes ([Byrne et al. 2023](https://essd.copernicus.org/articles/15/963/2023/)), not provincial totals. For this reason the atmosphere layers ([NASA GIBS](https://nasa-gibs.github.io/gibs-api-docs/)) are pictures with labels and never numbers.

### Two national accounts, side by side

| Account | Removals | Emissions | Net | Scope |
|---|---:|---:|---:|---|
| GFW, average 2001–2025 | 92.9 Mt/yr | 71.7 Mt CO₂e/yr | −21.2 Mt CO₂e/yr | Satellite-mapped forest with >30% tree cover in 2000, or later gain; stand-replacing loss |
| BTR1 2022, forest land remaining forest | 49.0 Mt | 19.7 Mt | −29.3 Mt | Managed land by national definitions |
| BTR1 2022, land converted to cropland | — | 12.5 Mt | +12.5 Mt | Conversion to cropland |
| BTR1 2022, whole LULUCF sector | 156.8 Mt | 48.6 Mt | −107.9 Mt | Includes cropland remaining cropland, −91.5 Mt |

Sources: GFW row, sum of the 77 province summaries divided by 25 (equal to GFW's own country table); GFW emissions include methane and nitrous oxide. BTR1 rows, Table 2-184, page 2-241, million tonnes; removals and emissions are CO₂, and the sector net also includes 0.27 Mt of methane and nitrous oxide from biomass burning. Most of Thailand's reported land sink sits in cropland remaining cropland, not forest. A satellite forest model and a national inventory also define "forest" and "anthropogenic" differently. Global bookkeeping models and national inventories differ by about 6.7 GtCO₂ per year for similar definitional reasons ([Grassi et al. 2023](https://essd.copernicus.org/articles/15/1093/2023/)). The carbon map shows both and chooses neither.

### Checks performed

Run on 26 September 2026:

- **Conservation.** Provinces, grid cells and a box covering Thailand all reproduce the national total for every quantity. Split boxes add up to the whole box.
- **Boundary crosswalk.** All 77 COD-AB province names match Climate TRACE's GADM names one to one. GFW rows are joined by the same GADM numbers, and GFW's province areas agree with COD-AB within 6.7%, which confirms the numbering.
- **Fossil CO₂.** ODIAC's 2024 total for Thailand is 290.0 Mt. BTR1 reports 271.1 Mt of CO₂ excluding land use for 2022 (Table 2-3), of which energy is 241.3 Mt and industrial processes 28.6 Mt. The scopes differ (ODIAC covers fossil combustion, cement and flaring), the years differ, and ODIAC projects recent years from energy statistics.
- **Fire season.** 83% of fire carbon falls in February–April, and March alone is 44%. This matches the northern burning season.
- **Chiang Mai.** GFED fire CO₂ is 12.1 Mt per year (2013–2022, all land types). Climate TRACE forest-land fires are 6.3 MtCO₂e (2024, forest only). The scopes differ; the order of magnitude agrees.
- **Provenance.** Every source file's URL, size, SHA-256 and retrieval date is in the [ledger manifest](data/ledger/manifest.json). The processing code is `scripts/ingest/build_ledger.py`.

### What this map cannot tell you

- **Credits, eligibility or additionality.** A satellite removal figure has no baseline, no leakage deduction, no permanence buffer and no independent verification. See the [ICVCM Core Carbon Principles](https://icvcm.org/wp-content/uploads/2024/05/CCP-Book-V3-FINAL-LowRes-10May24.pdf).
- **An approved method.** T-VER remote-sensing models need TGO approval. These products have none for project use.
- **Current conditions.** Stock is for 2020, forest flux is a 2001–2025 average, fire is 2013–2022 and fossil CO₂ is 2024.
- **Flux inside a drawn box.** GFW's 30 m grids require an API key and are not yet ingested. The map says so instead of showing zero.

## 07 · Can open data become a carbon credit?

Short answer: no. Open and public data can screen a candidate, supply dated context, and flag what still needs measuring — but no satellite, catalogue or model output in this system is a credit, and none becomes one by arithmetic. A credit is minted outside this system, by people and a registry, after three gates that open data cannot pass on its own.

The three quantities from section 01 still govern everything below: carbon stock, monitoring-period change, and issued credits stay separate. Open data speaks fluently about the first, approximately about the second at landscape scale, and not at all about the third.

### Three gates no satellite passes

A credit needs three things that are not pixels. First, **rights and eligibility**: who holds the land, whether the activity is additional to the baseline, and whether the same carbon has been claimed elsewhere. A polygon proves none of this. Second, **an approved method with a baseline**: T-VER-S-METH-13-01 v2 (or the method that fits the activity) names the pools, the equation `CSEQ = CTT(t) − CTT(i) − PE − GHG_LEAK`, the fire conditions (burned area above 5% with canopy fire causing tree death), and the small-project screen of 16,000 tCO₂e per year. An unapproved model — however accurate — is not a method. Third, **independent validation and a registry**: a second qualified party reproduces the result, the programme approves, and units are recorded. This pilot connects to no registry and runs no approved model; it says so on every screen.

<figure class="sysmap" aria-label="How the system would work">
<figcaption>How the system would work — three lanes, three gates</figcaption>
<div class="sys-lane" data-lane="open">
<p class="sys-lane-title">Lane 1 · Open data — screening and context</p>
<ul>
<li><b>ESA CCI Biomass v7.0 (2020, 100 m)</b> → stock context for a candidate area</li>
<li><b>JAXA FNF v2.1.0 (2020, 25 m)</b> → forest mask and visible change screening</li>
<li><b>GFW flux v1.4.3 (2001–2025 average, province)</b> → removals and emissions context, net only</li>
<li><b>GFED5.1 (2013–2022, 0.25°)</b> → dated fire evidence by month and land type</li>
<li><b>ODIAC2025 (2024, 1 km)</b> → fossil context, shown beside — never netted</li>
<li><b>COD-AB v01 (valid 2022-01-22)</b> → province boundaries for orientation</li>
<li><b>Climate TRACE API v7 (2024)</b> and <b>BTR1 (2022)</b> → independent cross-checks</li>
</ul>
<p class="sys-lane-note">This lane never mints a credit. Its job is to say where to look and what to verify.</p>
</div>
<div class="sys-gate"><span class="sys-n">A</span> Gate A · Rights, eligibility and baseline — decided by people and documents</div>
<div class="sys-lane" data-lane="field">
<p class="sys-lane-title">Lane 2 · Field and approved method — the only path to a credit number</p>
<ul>
<li><b>Versioned boundary plus land rights</b> → the calculation area becomes a project</li>
<li><b>Measured plots at two comparable dates</b> → dry biomass both sides of the period</li>
<li><b>T-VER-S-METH-13-01 v2 arithmetic</b> → CSEQ minus prescribed fire emissions</li>
<li><b>Stated uncertainty and exclusions</b> → the result travels with its limits</li>
</ul>
<p class="sys-lane-note">The workbench lives here: user-supplied measurements in, reproducible arithmetic out.</p>
</div>
<div class="sys-gate"><span class="sys-n">B</span> Gate B · Independent validation — a second qualified party reproduces the result</div>
<div class="sys-lane" data-lane="registry">
<p class="sys-lane-title">Lane 3 · Registry — external to this system</p>
<ul>
<li><b>Programme approval</b> → eligibility, baseline and monitoring plan accepted</li>
<li><b>Issuance</b> → units recorded; open data never appears in this lane</li>
</ul>
<p class="sys-lane-note">Dashed because it happens elsewhere. No integration is claimed.</p>
</div>
</figure>

### The pipeline, with open data in its place

```mermaid
flowchart TD
  A["Open data screens candidates: FNF mask, CCI v7.0 stock context, GFW v1.4.3 flux context"] --> B["Gate A: rights, eligibility and baseline decided by people and documents"]
  B --> C["Field plots at two comparable dates under T-VER-S-METH-13-01 v2"]
  C --> D["CSEQ minus prescribed fire emissions; uncertainty travels with the result"]
  D --> E["Gate B: independent validation reproduces the calculation"]
  E --> F["Registry issuance is external; open data never appears there"]
```

### What each open dataset can and cannot prove

| Credit ingredient | Open-data support (version, period) | What open data can never supply |
|---|---|---|
| Project boundary and rights | [COD-AB v01](https://data.humdata.org/dataset/cod-ab-tha) boundaries (valid 2022-01-22) for orientation; data.go.th community-forest rows as partner leads | Tenure, consent, additionality, proof against double claiming |
| Stock context | [ESA CCI Biomass v7.0](https://catalogue.ceda.ac.uk/uuid/6429d1aafe1e43b9b414e4a5a7f8b903) (2020, 100 m) masked by [JAXA FNF v2.1.0](https://www.eorc.jaxa.jp/ALOS/en/dataset/fnf_e.htm) (2020, 25 m) | Parcel stock at credit dates; approved-method status |
| Flux context | [GFW flux v1.4.3](https://essd.copernicus.org/articles/17/1217/2025/) (2001–2025 average, province) | Baseline, leakage, permanence buffer, verification |
| Fire deduction evidence | [GFED5.1](https://zenodo.org/records/16794692) (2013–2022, 0.25°) by month and group | Whether canopy fire killed trees on the parcel — that needs the field |
| Fossil context, never netted | [ODIAC2025](https://db.cger.nies.go.jp/dataset/ODIAC/) (2024, 1 km) | Anything about the forest credit |
| Independent cross-checks | [Climate TRACE API v7](https://api.climatetrace.org/v7/docs) (2024, province); BTR1 Table 2-184 (2022, nation) | A second opinion is not validation |

### A walk-through with teaching numbers

Reuse the section 02 teaching case — dry aboveground biomass rising from 1,000 to 1,100 tonnes — and watch each number change hands:

```mermaid
flowchart TD
  A["Screening: FNF v2.1.0 mask plus CCI v7.0 stock context for the candidate area"] --> B["Field evidence: dry aboveground biomass 1,000 to 1,100 tonnes (teaching numbers, not a measured forest)"]
  B --> C["CSEQ arithmetic: 100 × 1.27 × 0.47 × 44/12 = 218.8633 tCO₂ before deductions"]
  C --> D["Deductions and screens: fire over 5% with canopy death, 16,000 tCO₂e per year limit, stated uncertainty"]
  D --> E["Validation and registry decide; the screening estimate is never the claim"]
```

The screening numbers and the credit number meet only at Gate B, where a validator reproduces the field arithmetic — never by copying a satellite total into the claim. GFW's own net (−21.2 MtCO₂e per year for Thailand, 2001–2025) stays a landscape context beside the claim; GFED fire stays gross burning, not net loss; ODIAC fossil CO₂ stays beside the forest figures, never netted. The workbench enforces the same separation: its numbers come only from user-supplied measurements, and landscape figures never feed it.

### What would have to change — and what this pilot already does

For an open-data pipeline to end in a real credit, three external things must exist: a remote-sensing model with TGO approval for the activity (the four approved platforms announced 13 June 2025 hold their own approvals, which do not transfer to this application); parcel-scale flux access without a key barrier (GFW's 30 m grids need an API key this pilot does not hold); and a registry integration with independent verification (this pilot has neither and claims neither). Until then, the honest system is the one drawn above: open data screens and contextualises, fieldwork plus an approved method produces the number, people and the registry decide. This pilot already runs the middle of that drawing — reproducible arithmetic with all inputs, dates, versions and limits attached — so that when the gates open, the evidence is ready to walk through them.

## 08 · The first pilot should earn the next one

Start with one project whose boundary, rights, methodology and field records can be checked. Agree on the decision first: screening a candidate, estimating stock, or preparing monitoring evidence. Each requires a different level of proof.

```mermaid
flowchart TD
 A["One project: boundary, rights, applicable methodology"] --> B["Baseline and repeat field evidence with dates and units"]
 B --> C["Reproduce the calculation and challenge the assumptions"]
 C --> D["Independent validation and uncertainty assessment"]
 D --> E["Review with the relevant programme before expanding"]
```

A useful pilot pack includes a versioned boundary, the project's registration details where applicable, sampling design, plot measurements at comparable dates, disturbance records, and permission to use the data. If an approved remote-sensing provider is involved, obtain its output definitions, approved scope and uncertainty documentation. An approval held by another platform does not transfer to this application.

The pilot succeeds when another qualified person can reproduce the result, explain its limits and identify the measurements that would change the conclusion. That is a harder target than making the map look convincing. It is also a target worth building for.

## 09 · The person behind the work

<div class="author-profile">
<img src="images/dr-non.jpg" width="800" height="800" alt="Dr Non Arkaraprasertkul speaking with a microphone" loading="lazy">
<div><h3>Dr Non Arkaraprasertkul</h3><p>Architect, anthropologist and civic-systems builder. His public profile describes architectural training at MIT, anthropology at Harvard, and work in smart-city promotion at Thailand's Digital Economy Promotion Agency (depa).</p><p>The connection to forest carbon is a design question: how can complicated evidence become usable by people making decisions? This project applies that question to boundaries, measurements and the public record behind each estimate.</p><p><a href="https://www.nonarkara.org/">Personal website</a> · <a href="https://github.com/Nonarkara">Public projects</a> · <a href="https://www.linkedin.com/in/drnon/">LinkedIn</a></p></div>
</div>

Portrait source: [RMIT Vietnam's profile](https://www.rmit.edu.vn/research/hubs/rmit-vietnam-smart-and-sustainable-cities-hub/people/dr-non-arkaraprasertkul). Biography checked against that page and the [personal website](https://www.nonarkara.org/) on 25 September 2026. Institutional affiliations provide background; this independent pilot does not claim institutional endorsement. No personal quotation or fieldwork story has been invented for this page.

## 10 · Keep the evidence within reach

The [Thai guide](guide-th.html) and [English guide](guide-en.html) cover actual use, formulas, file formats and deployment. The [source catalogue](data/source-catalog.json) records the supplied references. [Code and tests](https://github.com/Nonarkara/carbon) are public, together with the original research audit. Official documents linked above govern their own methods; this page is an explanation, not a replacement.

Open the workbench, try the clearly labelled synthetic example, and follow a number back to its inputs. Then ask what evidence would be needed to replace that example with a real forest. That is where this work becomes useful.


[Global data sources, cadence and fallback rules / แหล่งข้อมูลโลกและรอบการอัปเดต](https://github.com/Nonarkara/carbon/blob/main/docs/WORLD_DATA.md).


<section class="standards-note" id="standards"><h2>Standards, scope &amp; accountability</h2><p><strong>Research and assessment pilot · not certified credits.</strong> The features below support selected practices relevant to ISO standards. This is a design mapping, not a clause-by-clause conformity assessment, ISO certification or assurance opinion.</p><dl><dt><a href="https://www.iso.org/standard/66454.html">ISO 14064-2:2019</a> · Project accounting</dt><dd>Project boundaries, baseline and monitoring dates, named factors and reproducible exports support transparent quantification. Complete project eligibility, baseline justification and monitoring plans remain project-specific work.</dd><dt><a href="https://www.iso.org/standard/66455.html">ISO 14064-3:2019</a> · Validation and verification</dt><dd>Sources, versions, assumptions and calculation records support independent review. No independent validation or verification has been performed by this software.</dd><dt><a href="https://www.iso.org/standard/74257.html">ISO 14065:2020</a> · Verification bodies</dt><dd>Relevant when appointing an environmental-information validation or verification body. It applies to those bodies; this application is not an accredited verifier.</dd></dl><p>T-VER programme rules and the applicable approved methodology govern eligibility and issuance. Satellite stock is not a monitoring-period credit. Aerosol imagery is context, not a carbon-credit measurement.</p><p class="fine-print">User project files are processed in browser memory; exports are your record. Map providers receive tile requests. The server retrieves public global feeds. Source licences and dates apply. Organisation marks identify the project context; they do not establish endorsement, ISO certification or TGO approval. Standards references checked 26 September 2026.</p></section>
