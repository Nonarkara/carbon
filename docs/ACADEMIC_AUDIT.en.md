### The research question and the verdict

**For each target quantity in Kabonna, do the available observations identify it at the requested spatial and temporal support, and what independent evidence would make the inference defensible?** “PhD-level” here means a falsifiable question, explicit assumptions, reproducible experiments and attention to contrary evidence. It does not mean a degree, peer review, official verification or a completed field campaign.

Our conclusion is useful precisely because it is bounded: the deployed products support a **model-conditioned landscape account** and reproducible calculations from user-supplied measurements. They do not independently identify current parcel biomass, project-attributable mitigation, organizational emissions or credit entitlement. More layers can improve an estimate; they cannot remove a missing counterfactual or establish rights.

### 1. What the system tries to know

An **estimand** is the quantity we intend to estimate, with its population, boundary, pools and date. Let θ be that quantity, y the sensor observation, and h the process linking them: y = h(θ, environment, sensor) + error. If two plausible states of the world produce the same y but different θ, the available observations alone do not identify θ. A fitted model supplies assumptions and calibration; it is not a direct carbon measurement.

GFOI states: “no space-based technology directly measures forest AGB stocks or stock-changes” ([2025 guidance, Chapter 2, p. 2](https://www.reddcompass.org/mgd/resources/GFOI_BiomassMaps_Guidance-20251022.pdf)). This supports the distinction between sensor response and estimated biomass. Our inference is that every product must carry an observation-to-model-to-decision chain.

| Target | Available evidence | Identification and missing evidence |
|---|---|---|
| 2020 forest biomass stock within a province | ESA CCI v7.0 AGB, JAXA FNF v2.1.0 mask, administrative area, R/CF | Conditional estimate for the product-defined population; local bias, mask error and factor uncertainty remain |
| Current stock of a particular parcel | One deployed 2020 map; coarse web aggregation | Not identified for today; needs suitable dated local observations, support matching and validation |
| Historical forest flux | GFW v1.4.3 province summaries, 2001–2025 totals | Model-defined period average; not a current annual observation or a drawn-box flux |
| Monitoring-period tree-stock change | User measurements and dates; implemented TGO arithmetic | Conditional calculation; sampling uncertainty and cross-date covariance are not supplied |
| Project-attributable mitigation | Stock or loss observations alone | Not identified; applicable baseline/additionality requirements, monitoring and external review remain |
| Organizational footprint | Province inventories and satellite context | Not identified; needs organization boundary, activity records, scopes and applicable emission factors |
| Issued or retired credits | Public registry snapshot | Issuance can be read as a dated record; retirement, entitlement and transactions need their own records |

<figure class="audit-diagram"><figcaption>What is observed, inferred and decided</figcaption><ol><li><strong>Observe</strong><br>Radar, light, field dimensions, meter readings</li><li><strong>Infer</strong><br>Biomass, stock, flux or inventory under a named model</li><li><strong>Validate</strong><br>Independent reference, error, support and transferability</li><li><strong>Decide</strong><br>Eligibility, verification, issuance or retirement</li></ol></figure>

### 2. Evidence hierarchy, lineage and contrary findings

The literature review is targeted, not exhaustive or a PRISMA systematic review. Searches on 2 October 2026 covered ESA CCI v7 uncertainty/change, GEDI quality/transferability, biomass-validation protocols, spatial cross-validation and forest-credit counterfactuals. Primary product guides, original papers and official methodology documents were preferred. The [source review log](https://github.com/Nonarkara/carbon/blob/main/research/scientific-sources.json) records source age, section, role and limitations. A source's recent date does not prove suitability to Thailand.

- **ESA CCI v7.0:** the [Product User Guide](https://climate.esa.int/media/documents/Product_User_Guide_PUG_V7.0.pdf), 19 March 2026, §§3.3–3.4, 4–6, describes validation, local limitations, change products and aggregation. The deployed source remains 2020; newer documentation does not refresh its observation year. Dedicated change products are candidates for research, not an integration now present in Kabonna.
- **CEOS validation:** the [2021 good-practices protocol](https://lpvs.gsfc.nasa.gov/PDF/CEOS_WGCV_LPV_Biomass_Protocol_2021_V1.0.pdf), chapters on reference data and validation, is the basis for the proposed support-matching and independent-reference work. A small plot and a hectare pixel are different sampling supports.
- **GEDI:** [L4A v3, Quality Assessment and Dataset Revisions](https://daac.ornl.gov/GEDI/guides/GEDI_L4A_AGB_Density_V3.html), model revision 5 June 2026; guide revision 2 September 2026, is a candidate source. A footprint biomass prediction and its standard error are not error-free ground truth. Quality fields must be read from that version; a v2.1 filtering recipe must not be assumed unchanged. No GEDI shots are ingested by this release.
- **Validation dependence:** [Roberts et al. 2017, pp. 913–916](https://www.biom.uni-freiburg.de/mitarbeiter/dormann/roberts-et-al-2017-ecography.pdf/at_download/file) explain why dependent train/test samples can understate predictive error. Blocking must match the intended deployment task; a very distant holdout tests transfer, not merely interpolation.
- **Contrary evidence:** our NFI comparison exposes a national discrepancy. It does not isolate a measured map bias. Forest definitions and areas do not match; the 1.35–2.0× result is conditional on nesting, hypothetical extra-cover density and an allometric sensitivity. The fresh review found that the previous introduction overstated this as “measured bias”; that wording has been corrected in both languages and on the map.

Do not count agreement among products as multiple independent confirmations without checking lineage. ESA's retrieval incorporates lidar information; comparing it with GEDI can be an intercomparison with shared inputs. Independent validation needs held-out references whose measurement and training relationships are documented. The complete dependency graph remains an open audit task, so no independence is assumed.

### 3. Experiments executed now

The following experiments run against the deployed ledger, with exact input hashes. They are numerical diagnostics and explicitly labelled hypothetical sensitivities. **None is an independent field-accuracy experiment.** Re-run with `npm run build`; inspect `scripts/scientific-audit.mjs` and the machine-readable result.

<!-- scientific-results -->

The factor perturbations are deliberately declared before interpretation: R ±0.05 and CF ±0.01. They are not empirical standard errors or proposed replacement factors. Since S = AGB(1+R)CF(44/12), the exact relative responses are ΔR/(1+R) and ΔCF/CF. Shared factor error does not disappear when thousands of pixels are added. This is why a narrow random-map range cannot be read as total uncertainty.

For change, Var(S₁−S₀) = Var(S₁)+Var(S₀)−2Cov(S₁,S₀). Assuming independence without evidence may overstate or understate uncertainty, depending on the covariance. The synthetic experiment shows how the same apparent change can include or exclude zero under different assumed correlations. Even a statistically detectable change does not establish additionality.

The 4×4 versus 16×16 polygon difference applies to one deliberately chosen triangle. It measures sensitivity of the web-grid approximation, not error against the original 100 m raster or the true forest boundary. Conservation checks show arithmetic consistency; they cannot detect a source-wide bias.

### 4. The counterfactual that imagery cannot supply

Consider identical observations: stock is 100 at the start and 110 at the end. If the no-project outcome would have been 110, additional change is zero; if it would have been 105, additional change is five. The imagery alone cannot distinguish those worlds. This is a conceptual example, **not a substitute equation for T-VER-S-METH-13-01 v2**. Apply the approved method's actual baseline and additionality rules.

[Holland 1986, pp. 945–950](https://ics.uci.edu/~sternh/courses/265/holland_jasa1986.pdf) provides the causal-inference distinction. In forest conservation, [West et al. 2023, corrected 31 January 2024](https://research.vu.nl/ws/portalfiles/portal/290140632/Action_needed_to_make_carbon_offsets_from_forest_conservation_work_for_climate_change_mitigation.pdf) found problems with attribution under studied baselines. A [2023 rebuttal preprint](https://arxiv.org/abs/2312.06793) disputes aspects of that analysis. This contested literature motivates scrutiny of comparator selection and pre-trends; it does not demonstrate failure of Thai T-VER projects or supply a universal discount.

### 5. A validation protocol that can actually reject the model

This is a prospective protocol, documented before acquiring new validation outcomes. It is not an externally registered preregistration. The following tasks require field/reference access that is absent from this repository.

1. **Freeze the target.** Choose a forest type, biomass pools, reporting dates, intended parcel/stratum scale and acceptable decision error with the scientific reviewer. Map the field and product forest definitions. Identify legal/credit questions separately.
2. **Design the sample.** Use probability-based plots or a justified cluster design across the target domain, retaining zero-tree plots. Record strata, inclusion probabilities, GPS uncertainty, plot extent, date, DBH, height, species/wood-density source and disturbance history. The current CSV importer does not represent zero-tree plots; retain them in the external survey dataset. Estimate CV and design effect in a pilot; set the sample size from precision and representation, not an invented universal plot count.
3. **Match support and time.** Resolve plot–footprint–pixel differences, terrain and geolocation. Define exclusion rules before examining prediction residuals. Document temporal mismatches and retention after each quality filter.
4. **Freeze splits.** Reserve spatial blocks and a genuinely later-time test; keep repeated plots, flight lines and shared-reference clusters together. Estimate separation from dependence and the actual deployment range. Never tune preprocessing, features or hyperparameters on the final holdout.
5. **Compare candidates.** Include an area/stratum mean baseline, the unchanged open product, and a simple local regression before considering a more complex model. Fit on training data only. If validation labels come from another model, call the result agreement with that model, not accuracy against nature.
6. **Report uncertainty and failure.** Weighted bias, MAE, RMSE, calibration slope/intercept and interval coverage must be reported by stratum, biomass range and support. R² alone is insufficient. Use held-out block/cluster resampling appropriate to the design; carry reference measurement error, allometric error, mask error and temporal covariance. Small evaluation samples cannot certify nominal 95% coverage.
7. **Set the release gate.** Before testing, record decision-specific tolerances with their owner. Reject a candidate that does not improve the intended held-out task, misses the agreed bias/coverage target, or extrapolates beyond represented conditions. Numerical tolerances have not been agreed, so this audit does not invent a “passed scientific accuracy” threshold.
8. **Separate publication from issuance.** Publish code, factor versions, data-access conditions and failed cases. Assess approved-method requirements separately. A paper or predictive score cannot authorize credit issuance.

<figure class="audit-diagram"><figcaption>A research sequence with a real stopping rule</figcaption><ol><li>Define estimand + decision tolerance</li><li>Acquire independent, support-matched references</li><li>Train / tune without the held-out test</li><li>Evaluate bias, error and coverage</li><li>Reject, restrict domain, or document a bounded release</li></ol></figure>

### 6. What would change the conclusion?

A matched-support, independently designed Thai reference sample could quantify local map bias and show whether a locally calibrated model transfers. Paired measurements with documented covariance could validate a monitoring-change interval. An eligible project dossier and assurance opinion could support a credit submission; an issuance/retirement record could establish the registry event. None has been fabricated here.

Our own bias is the wish to make open data useful and the fact that we are auditing a system we built. A fresh reviewer was therefore given the scientific spec and source files, without the author's defence. One material overclaim was confirmed and corrected; the rest remains bounded by the unverified field, temporal and causal tests above. This is a research-strengthened pilot, not an airtight scientific guarantee.
