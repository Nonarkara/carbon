# Forest Carbon Thailand — research and data findings

The full argument is the short thesis in [docs/RESEARCH.en.md](docs/RESEARCH.en.md) and [docs/RESEARCH.th.md](docs/RESEARCH.th.md): *Building a system to calculate a forest carbon footprint from public and open data.* It is an independent study, not a university submission and not a degree. Stock, period flux, fire, fossil CO₂ and issued credits stay separate. No model is trained here, and no credit is issued.

Research opened 25 September 2026. The working system is คาบอนนะ.

## Recommendation

Build a Thai/English forest-carbon assessment workbench for TGO: select a project boundary, inspect dated evidence, calculate a reproducible estimate, and export the evidence for review. Keep **carbon stock**, **estimated period sequestration**, and **issued credits** as separate quantities.

Start with one terrestrial forest project with measured plots and known boundaries. Use an existing approved remote-sensing method where access permits. Developing our own prediction model is a separate validation and approval workstream. The dashboard can support either route.

TGO announced four approved platforms on 13 June 2025: GISTDA Carbon Atlas, THAICOM CarbonWatch, SCGC CERT+, and Varuna Smart Forest. This supports an integration-first pilot. It does not mean our software inherits their approval. [TGO announcement](https://tver.tgo.or.th/th-news-activities/th-news/peid-rab-smakhr-khorngkar-kharbxn-kherdit-t-ver-narxng-sandbox-ni-kar-thwn-sxb-dwy-ai-3).

## Calculation contract

Invariant: every credited tonne must correspond to an eligible, non-duplicated monitoring-period result under a named methodology and version; an image of a forest is not that evidence.

The current Standard catalogue lists Sustainable Forestation **T-VER-S-METH-13-01 v2**, P-REDD+ **13-02 v2**, large-scale Sustainable Forestation **13-03 v2**, and fast-growing plantations **13-04 v2**. Select by activity and eligibility; do not apply one formula to all forest types. Existing registrations can reference earlier versions. [Current catalogue](https://tver.tgo.or.th/database/public/methodologies/1?category_id=13&lang=en).

For **13-01 v2**, effective 26 March 2025, the accounting equation is:

`CSEQ = CTT(t) − CTT(i) − PE − GHG_LEAK` [tCO₂e]

Here `i` is the baseline or latest credited monitoring point; `PE` is prescribed biomass-burning emissions. This methodology does not consider leakage, so its leakage term is zero. Fire-emission conditions include burned area above 5% and canopy fire causing tree death. Eligibility includes legal land-use rights and a small-project limit of **16,000 tCO₂e/year**, not 16,000 rai. Read the full applicability conditions before use. Do not add a generic buffer percentage or transfer this equation to Premium T-VER. [Methodology PDF, pp. 2, 7–8](https://tver.tgo.or.th/database/Uploads/Methodology/482ce748-b43f-4432-aef8-d7745dcc2692.pdf).

For tree stock, use the appropriate allometry and sampling expansion:

`AGB = sum of tree dry biomass, expanded from plots to strata`

`BGB = AGB × root:shoot ratio`

`tree carbon [tC] = (AGB + BGB) × carbon fraction`

`CO₂-equivalent stock = tree carbon × 44/12`

TGO's tree tool **T-VER-S-TOOL-01-01 v2** offers counting, measured trees, approved remote sensing, and other approved methods. Recommended general-tree factors are `R = 0.27`, `CF = 0.47`; mangrove Rhizophora and palms differ. The `9.5 kg CO₂/tree/year` counting option has conditions, including planted subplots ≤30 rai and total project ≤1,000 rai. It is not a universal forest growth rate. Remote-sensing models require TGO approval. [Tree-tool PDF, pp. 3–8](https://tver.tgo.or.th/database/Uploads/Tool/c575f516-1f3c-4dbc-83ec-2ab65e1d76dc.pdf).

An illustrative arithmetic example, not a project assessment: if total project dry AGB rises from 1,000 to 1,100 tonnes, with R=0.27 and CF=0.47 unchanged, the tree-stock increase is `100 × 1.27 × 0.47 × 44/12 = 218.8633 tCO₂`. Period deductions, eligibility, verification and issuance remain separate. If this is five years, 43.7727 tCO₂/year is the average increase, not five additional annual claims.

Implementation decisions: retain signed losses; distinguish missing data from zero; never convert tCO₂e again by 44/12; avoid adding roots when the source already includes them. Use 1 ha = 6.25 rai, 1 rai = 1,600 m², and dated boundary versions. Exclude water and buildings from the assessment area. Never sum overlapping parcels twice.

## JAXA and the satellite workflow

The supplied [JAXA vegetation page](https://earth.jaxa.jp/en/data/products/vegetation/index.html) links NDVI, leaf-area index and forest/non-forest products. These are vegetation observations, not a carbon-credit ledger. NDVI alone cannot supply a defensible universal biomass-to-credit conversion.

Use [ALOS PALSAR/PALSAR-2 mosaics and FNF](https://www.eorc.jaxa.jp/ALOS/en/dataset/fnf_e.htm) for forest screening and radar predictors. Approximately 25 m products include backscatter, dates and processing masks. The FNF definition (>0.5 ha, >10% canopy) must not be substituted for project eligibility. JAXA warns of differences across processing versions; keep version and observation date with every raster. Downloads require registration, and terms/attribution apply. The old vegetation-page FNF link redirects to a relocation notice; use the current URL above.

Use [Sentinel-2](https://dataspace.copernicus.eu/data-collections/copernicus-sentinel-missions/sentinel-2) for optical predictors and cloud-screened change evidence. Sentinel observations are free, including for commercial users. Processing services have separate limits. Pair with radar where clouds prevent comparable observations.

[NASA GEDI L4A v3](https://doi.org/10.3334/ORNLDAAC/2508) supplies modeled footprint biomass density in Mg/ha, prediction errors and quality flags. It can support calibration; it is neither a continuous parcel survey nor error-free ground truth. Keep independent field plots for validation. Reuse the workflows in [NASA EarthRISE's GEDI training repository](https://github.com/NASA-EarthRISE/training_Getting_started_with_GEDI_spaceborne_lidar) and [ORNL's data tutorials](https://ornldaac.github.io/gedi_tutorials/notebooks/gedi_l4a_search_download.html).

Proposed model pipeline: stratify the project → align field dates, plot footprints and imagery → mask unusable observations → compare a simple regression with Random Forest → validate on spatially separated held-out plots → report bias, RMSE, coverage and interval estimates → aggregate with spatial uncertainty preserved. A high random-split score is insufficient when neighboring training and test observations overlap. Differences between two noisy stock maps need change-uncertainty analysis; they cannot automatically be called growth.

GISTDA's 2026 announcement describes Carbon Atlas datasets for **2022 and 2024**, correcting the attachment's “2024 planned” wording. Raster/API access, reuse rights and the approved scope still need confirmation; this research did not download its biomass raster. [GISTDA update](https://www.gistda.or.th/th/news/รอใช้ได้เลย-ระบบพยากรณ/).

Google Earth Engine is an option, not an assumed free production backend. Noncommercial eligibility requires verification and commercial use requires the appropriate access arrangement. [Google access rules](https://developers.google.com/earth-engine/guides/access).

## Data.go.th extraction — actual results

The CKAN API search `q=ป่าไม้`, paginated in stable ID order, returned **570 unique datasets and 2,111 resource records**. This is a keyword catalogue, not 570 usable carbon datasets. Resource formats include 688 CSV, 639 PDF, 324 XLSX and 35 SHP-labelled records. SHP components may each be counted as a resource. Raw responses and all resource URLs are saved locally.

Nine selected resource files downloaded successfully. Content inspection gives the following narrower usability assessment:

| Dataset | Extracted evidence | Use and limitation |
|---|---|---|
| [Saraburi forest area](https://data.go.th/dataset/saraburi-forest-area) | Seven annual rows, 2018–2024; 2024 forest area 532,177.56 rai | Regional context; no parcel biomass |
| [Kanchanaburi forest area](https://data.go.th/dataset/forest-area-2567) | Four years, 2021–2024, three measures each; 2024 area 7,478,170.33 rai | Rai/km² agree within rounding; context only |
| [DNP conservation-area carbon](https://data.go.th/dataset/gdpublish-67-dnp07-31-02) | Regional table labelled tCO₂eq; six meaningful columns extracted | No explicit annual denominator in CSV; do not present as yearly credits |
| [DNP forest-area change](https://data.go.th/dataset/gdpublish-froms-dnp) | 84 data rows of administrative disturbance/land-use categories, 2021 file | Historical context, not project boundaries |
| [Phitsanulok community forests](https://data.go.th/dataset/_frm4-04) | 536 data rows; names, areas, some eastings/northings | Not necessarily unique forests; confirm CRS, missing coordinates, and No-Derivs licence before adapting/publishing |
| [Saraburi community boundaries](https://data.go.th/dataset/community-forest) | CSV containing one Google Drive link | No geometry in the CSV; linked shapefile not downloaded |
| [RFD forest cover 2019](https://data.go.th/dataset/forestarea_2562_wgs84) | ZIP contains only `datapackage.json`; individual SHP/SHX/DBF/PRJ endpoints respond | SHP header is valid and declares 244,918,572 bytes. PRJ identifies WGS84 / UTM 47N, not longitude/latitude. Only headers probed; full geometry not extracted |
| [RFD reserved-forest table](https://data.go.th/dataset/gdpublish-https-www-forest-go-th-land) | 66 data rows | Quarantined: Krabi's 1,415,952 rai implies 2,265.5232 km², while source column says 2.181. Do not repair by guessing |
| [Chiang Mai forest series](https://data.go.th/dataset/foret) | CP874 CSV with 10 data rows | Quarantined: implausible magnitudes; licence unspecified |

Catalogue modification dates are not measurement dates. Catalogue licences are copied as declared, not independently legally verified. The RFD ZIP's embedded licence differs from its current catalogue licence; resolve this before redistribution. Province statistics cannot establish land tenure, additionality, tree stock, leakage or ownership of credits.

Files:

- `research/extracted/resources.csv`: every dataset/resource URL, organisation, declared licence and timestamps.
- `research/extracted/province-forest-area.csv`: 11 normalized province-year observations; rai and hectares, BE/CE years, source and retrieval date.
- `research/extracted/dnp-carbon-reference.csv`: six original columns, with no invented annual interpretation.
- `research/extracted/download-manifest.json`: resource IDs, SHA-256 hashes, download status and quality findings.
- `research/extracted/geometry-probe.json`: independent shapefile-header/CRS checks.
- `research/raw/`: catalogue snapshots, original downloads, and TGO methodology PDFs.

## Landscape carbon ledger — added 26 September 2026

Implemented as the app's default carbon map. Full method, checks and limits: `docs/RESEARCH.en.md` / `.th.md` section 06. Summary:

- Stock: ESA CCI Biomass v7.0 AGB 2020 (100 m, per-pixel SD) × JAXA PALSAR-2 FNF v2.1.0 2020 forest fraction × 2.1886 tCO₂e/t AGB. Thailand: 8,423 MtCO₂e in FNF forest (44.7% of land; RFD reports 31.64% for 2020). 95% range ±0.03% (independent errors) to ±110% (fully correlated); map bias excluded.
- Flux: GFW v1.4.3 province summary (keyless CSV, tree cover >30%). Thailand 2001–2025 average: removals 92.9, emissions 71.7, net −21.2 MtCO₂e/yr; the sum of provinces equals GFW's country table.
- Fire: GFED5.1 mean 2013–2022, 102.3 MtCO₂/yr, 83% in Feb–Apr; mostly savanna/shrub/grass classes; largely regrows.
- Fossil: ODIAC2025 2024, 290.0 MtCO₂ (BTR1 2022 CO₂ excluding LULUCF: 271.1 Mt, Table 2-3).
- BTR1 2022 (Table 2-184): forest land remaining forest −29.3 Mt net; cropland remaining cropland −91.5 Mt; LULUCF −107.9 Mt. JAXA offers no carbon stock product; aerosol and XCO₂ are concentrations, not emissions.
- Rule: every pixel counted once; provinces, grid and nation reconcile exactly (tested). No figure is a credit or a T-VER input.

## Estimation rigour — added 29 September 2026

Full text: `docs/RESEARCH.{en,th}.md` sections 06 and 14.

- **Central uncertainty range, calibrated to the producer.** ESA aggregates pixel SD with a covariance term estimated from airborne LiDAR (CCI Biomass PUG v6 §5). The pipeline models errors as fully correlated within 0.05° blocks and independent between them, and checks that against ESA's published 2020 standard errors for 10, 25 and 50 km maps on every build: the model is 1.47×, 1.23× and 1.32× ESA's, i.e. consistent and on the cautious side. ESA's aggregates come from a slightly different processing run (means 5–16% lower), and scales above 50 km are extrapolated. Thailand ±1.4%, Chiang Mai ±4.7%, Samut Songkhram ±43% (95%, random error only). Floor and ceiling ranges stay visible.
- **National forest inventory check.** FREL/FRL 2021 Tables 6 and 13 give 17.2 ± 0.7 Mha of forest (2016) at 90.5 ± 5.0 t/ha AGB (NFI cycle 3, plots 2013–2018, reference year 2017): 1.56 ± 0.11 Gt AGB, 3.48 ± 0.25 Gt CO₂e biomass carbon with the FREL's root:shoot by type. The FREL's own test of its Thai equations (Table 10, 60 trees) shows underestimation in that small sample: a hypothetical national allometric sensitivity gives, 112.1 ± 6.0 t/ha and 4.28 ± 0.30 Gt CO₂e. ESA CCI 2017 over JAXA FNF 2017 forest: 23.8 Mha at 165.0 t/ha, 3.94 Gt AGB. Bound: for the map to be unbiased on inventory forest, the 6.6 Mha of extra radar tree cover would need 359 t/ha. For 0–200 t/ha on that extra cover, the map reads 1.7–2.5× the inventory as published, or 1.35–2.0× under that allometric sensitivity (bound 303 t/ha vs corrected evergreen 158). Assumes inventory forest nests inside radar forest. The unmatched national totals raise a concern about possible overestimation but do not identify map bias; the app shows this beside every stock figure and does not rescale provinces or boxes. A Copernicus LC100 forest-type stratification was rejected (97% evergreen vs ~35% in the inventory).
- **Competitors reviewed** (GISTDA Carbon Atlas, THAICOM CarbonWatch, SCGC CERT+, Varuna, CTrees, Kanop, Sylvera, Chloris, Planet, GFW): none of the Thai platforms publishes an accuracy figure. Next improvements, in order: a second AGB map (CTrees, CC BY 4.0) for map-to-map spread, CCI yearly series with the change quality flag, GEDI-based small-area estimation.

## TGO T-VER registry integration & institutional findings — added 28–29 September 2026

Full method, checks and limits: `docs/RESEARCH.en.md` / `.th.md` section 11. Summary:

- **Pipeline**: `scripts/ingest/tgo.py` fetches the public T-VER project list, individual detail pages for all Forestry & Agriculture (FOR&AGR) projects, and OTC annual market trade data without login or credentials. Raw responses are cached in `research/raw/tgo/` with SHA-256 digests. Generates `public/data/tgo/tver-forestry.json` (~390 KB).
- **Snapshot (28 Sep 2026)**: 257 registered FOR&AGR projects; 2,194,333 tCO₂e/yr ex-ante expectation (median project 771); 31 projects with credits issued (733,914 tCO₂e); 75 with ป่าชุมชน in the name; 32 mentioning mangrove (DMCR develops 30).
- **Conservation & integrity**: single-province + multi-province + unlocated projects sum exactly to national totals, and every issuance history sums to its project total (asserted by the pipeline and `tests/tgo.test.mjs`). Province attribution is automatic only after `จ.`/`จังหวัด`; 12 cases reviewed by hand in `scripts/ingest/tgo_province_overrides.json`; 6 recorded as unlocated.
- **Issuance by age, not a "cliff"**: 12.1% of projects have credits overall, but 56% of those registered by 2021, 40% of 2022–23 and 2% of 2024–26. Four in five projects were registered in 2024–26 and most have not finished a first monitoring period. The snapshot contains no verification fees, so no cost claim is made.
- **OTC trades (FOR&AGR)**: 379,304 tCO₂e at a volume-weighted ฿416/tCO₂e; yearly averages ฿279 (2023) to ฿2,000 (2022). No stable price band.
- **Standard vs Premium, as registered**: 246 Standard, 11 Premium. Registered crediting periods: Standard mostly 10 yr (180), 7 yr (35) or 20 yr (25); Premium 5–39 yr. Premium credits are CORSIA-eligible for 2024–2026; Article 6 use needs authorization and a corresponding adjustment. Buffer size is set by TGO's tool and not reproduced.
- **Double-counting screen**: TGO listing pages give text addresses; maps or coordinates, where they exist, sit in the linked registration PDFs. The boundary import lists registered projects in the same province(s). Co-location is a screen, not overlap and not additionality.
- **Climate Change Bill**: Cabinet approved a draft in principle on 2 Dec 2025; a parliamentary consultation ran 25 May–24 Jun 2026; still a draft as of Sep 2026. Drafts include mandatory reporting, an ETS and a carbon tax; ICAP reports DCCE would run the ETS registry.
- **Discipline**: Registry data is purely contextual. It sits below the landscape ledger, is never added to satellite biomass/flux figures, and never claims automated credit issuance.

## What to discuss with Khun Aphisit

Suggested framing: “ระบบช่วยประเมินและติดตามคาร์บอนภาคป่าไม้ โดยเชื่อมข้อมูลดาวเทียมกับข้อมูลสำรวจภาคสนาม แสดงที่มาและความไม่แน่นอนของผลประเมิน และจัดเตรียมหลักฐานสำหรับการทวนสอบตาม T-VER”

Confirm the first decision the system must support: screening candidate projects, estimating registered-project stock, or preparing verification evidence. Request one pilot boundary, its registration/methodology version, baseline and repeat plot measurements, and access to an approved model's results if available. These are project inputs, not prerequisites to building the interface.

The useful AI roles are biomass prediction, change screening, measurement quality checks and explanations linked to source documents. A language model should not invent biomass values or decide that credits have been issued.

## Scientific identification audit — 2 October 2026

A targeted primary-source review and fresh adversarial audit distinguish landscape model estimates from parcel observations, causal mitigation and credit entitlement. The NFI ratio is a discrepancy across unmatched forest populations; its conditional sensitivity is not measured map bias. See [English report](docs/ACADEMIC_AUDIT.en.md), [Thai report](docs/ACADEMIC_AUDIT.th.md), [source review log](research/scientific-sources.json) and `scripts/scientific-audit.mjs`. `npm run build` executes conservation, factor, covariance, sampling and polygon diagnostics into public/data/scientific-audit.json. No independent field, temporal-change, causal or interval-coverage validation was performed.

## GFW portal integration · 5 October 2026

The portal's practical contribution is a separate investigation signal alongside the carbon estimate. **Forest Watch** now consumes `gadm__integrated_alerts__adm1_daily_alerts v20261005`, a pinned 30-day Thailand snapshot (5 September–4 October), filtered to `is__tree_cover_2022=true`. It displays alert hectares by confidence, daily records and province drill-down. Legacy UMD/GLAD + WUR integrated deforestation alerts are explicitly distinguished from the newer DIST-ALERT product. No conversion to carbon, parcel allocation or registry transaction is performed. The API country query independently reconciles province sums. Public provenance carries query, mask, licence, retrieval time and raw hashes; TH/EN research section 16 and Bible chapter `forest-watch` explain the limits. [Primary metadata](https://data-api.globalforestwatch.org/dataset/gfw_integrated_alerts), [pinned summary](https://data-api.globalforestwatch.org/dataset/gadm__integrated_alerts__adm1_daily_alerts/v20261005). The public CSV path needs no key; an account subscription does not automatically configure authenticated raster ingestion.
