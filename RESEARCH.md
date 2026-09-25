# Forest Carbon Thailand — research and data findings

Research date: 25 September 2026. Status: research complete for pilot scoping; no model trained, credits calculated for a real project, or application deployed.

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

## What to discuss with Khun Aphisit

Suggested framing: “ระบบช่วยประเมินและติดตามคาร์บอนภาคป่าไม้ โดยเชื่อมข้อมูลดาวเทียมกับข้อมูลสำรวจภาคสนาม แสดงที่มาและความไม่แน่นอนของผลประเมิน และจัดเตรียมหลักฐานสำหรับการทวนสอบตาม T-VER”

Confirm the first decision the system must support: screening candidate projects, estimating registered-project stock, or preparing verification evidence. Request one pilot boundary, its registration/methodology version, baseline and repeat plot measurements, and access to an approved model's results if available. These are project inputs, not prerequisites to building the interface.

The useful AI roles are biomass prediction, change screening, measurement quality checks and explanations linked to source documents. A language model should not invent biomass values or decide that credits have been issued.
