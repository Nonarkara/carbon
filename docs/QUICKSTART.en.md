# Use Forest Carbon

Pick the result you need. No account or API key is needed for these steps. Keep this guide open beside the map; your project inputs stay in the original tab.

<div class="manual-routes"><a href="#province"><b>Compare provinces</b><span>Start here · no files needed →</span></a><a href="#area"><b>Check an area</b><span>Select two corners on the map →</span></a><a href="#project"><b>Calculate a project</b><span>Try the example, then use measurements →</span></a></div>

<figure class="screen-guide"><figcaption>Where to look on a computer</figcaption><div class="screen-top">TOP · Province search / ↖ Select an area / T-VER project tools</div><div class="screen-columns"><span>LEFT<br><b>World indicators</b><br>Different sources and dates</span><span>CENTRE<br><b>Your map</b><br>Click a province or select an area</span><span>RIGHT<br><b>Your result</b><br>Inputs → equation → estimate</span></div><p>On a phone: use the bottom tabs to switch between Map, Carbon results and World. Project steps also appear in the bottom tabs.</p></figure>

<section id="province">

## Compare provinces · about 1 minute

1. [Open the map](https://carbon.nonarkara.org/?lang=en). Press **Explore 77 provinces** at the top.
2. Choose the quantity in the list: fossil emissions, forest stock, or annual forest net. These answer different questions.
3. Select a province. You can also type/select its name in the top province selector.
4. Read the result on the right (**Carbon** on a phone). Each equation shows the actual inputs, result, unit and source year.

**You are done when:** the province name appears above the equations. **All Thailand** returns to the national result. To compare another province, press **Explore 77 provinces** again.

|What you see|What it means|
|---|---|
|Forest carbon stock · tCO₂e|Carbon held in the forest, using 2020 data. This is not an annual credit.|
|Annual forest net · tCO₂e/yr|Forest emissions minus removals, averaged over 2001–2025. Negative means net absorption.|
|Fossil CO₂ · tCO₂/yr|Territorial fossil emissions, using 2024 data. This is not the forest's emissions.|

</section>
<section id="area">

## Select your own area · about 1 minute

1. Move and zoom the map to the place you want **before** selecting.
2. Press **↖ Select an area**. Click/tap one corner, then the opposite corner. On a computer you can also drag a rectangle.
3. Release the mouse or complete the second tap. The system calculates automatically; there is no second Calculate button for the map.
4. Read **Selected area** and the substituted equations. On a phone the results panel opens automatically.
5. To save the result, scroll down the result panel to **Export JSON** or **Export CSV**. Keep JSON for source versions and the selection geometry.

**You are done when:** a rectangle remains on the map and the result title says **Selected area**. Press the arrow button again, or Escape, to cancel while drawing.

**A dash is a result, too.** Small selections below the served 2.8 km resolution are withheld; fire needs about 28 km. Enlarge the area for landscape screening. For a small parcel, use field measurements in the project workflow. Forest flux for drawn areas is not ingested, so enlarging the box will not unlock that field. No Thai land cells means no estimate.

</section>
<section id="project">

## Calculate a project · practise first

This is a separate workflow. Province and rectangle estimates do not fill project measurements.

<div class="task-flow"><span>Boundary</span><b>→</b><span>Dated measurements</span><b>→</b><span>Calculate</span><b>→</b><span>Export evidence</span></div>

1. Open **T-VER project tools → Project**. On a phone you can use **Project** in the bottom bar.
2. Press **Try illustrative example**. Wait until the boundary confirmation appears. A sample boundary and sample measurements are loaded; this is not a real registered project.
3. Open **Calculate** and press **Calculate estimate**.
4. Check that the period result is **218.86 tCO₂e**. The example uses AGB growth from 1,000 to 1,100 tonnes: `100 × 1.27 × 0.47 × 44/12`.
5. Save **Export assessment JSON** and **Export table CSV** from the result. JSON keeps inputs, boundary and assumptions; CSV is the summary.
6. Go back to **Project → Start over** before entering real data.

**For your own project, prepare:** a WGS84 GeoJSON boundary; baseline/last-credited and monitoring dates; total dry aboveground biomass in tonnes for the entire net project area at both dates **or** total tree stock already in tCO₂e; measurement source; burned-area percentage and canopy-fire status. Unknown fire status blocks calculation. Do not enter tonnes per hectare into a total-tonnes field.

To use measured trees, open **Evidence**, download the CSV template, confirm the equation applies to the forest type, upload your file, and apply the plot result. The file format and supported forest types are in **Detailed reference** below. Changing the boundary or factors invalidates affected results; calculate again.

**Before closing the tab, export.** Inputs are held in browser memory. Refreshing or closing the original tab loses them. The system produces an estimate for review, not issued credits.

</section>
<section id="layers">

## Use layers and world data

- **Vegetation** shows the JAXA forest map. **Aerosols** shows particles in the atmosphere; it does not measure forest credits. On desktop, **More layers** offers the other overlays. On a phone, the Aerosols button opens the layer panel.
- Read the date and legend before comparing colours. The basemap is for location, not proof of a monitoring date.
- World indicators are on the left (**World & markets** on a phone). **Refresh** checks the feed cache. Read the observation date: daily concentrations, half-hour electricity data and quarterly auctions do not share a clock or unit.
- **Research** explains methods, diagrams, sources and ISO reference scope. It preserves your inputs.

</section>
<section id="help">

## If something stops you

|What happened|What to do next|
|---|---|
|I cannot see the map on my phone|Press **Map** in the bottom bar.|
|The map will not pan|Area selection is active. Press the arrow again or Escape to cancel.|
|A value shows — / unavailable|Read its note. It may be below resolution, outside Thai data coverage, or a dataset not yet ingested. It is not zero.|
|My GeoJSON is rejected|Use WGS84 longitude/latitude, closed non-overlapping polygons, and a file under 2 MB. See the boundary reference below.|
|Calculate does not produce a result|Read the message under the form. Check dates, units, source and fire status. Do not guess missing evidence.|
|My previous result disappeared|An input, boundary or factor changed. Review the fields and calculate again.|
|A world feed says fallback/out of date|The saved observation is still dated. Refresh later; do not present it as current.|
|I need certified credits|Use the applicable T-VER project, validation, monitoring and verification process. This app cannot issue them.|

</section>
