import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {SEA_CODES,validSea,regionalRecord,countrySearch,seaExport,metricClass,SEA_METRICS,scaleValue} from '../public/js/sea-model.js';
import {seaChapters} from '../docs/bible/sea.mjs';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const d=await read('public/data/sea/snapshot.json');
test('Eleven country geography and dataset contracts preserve periods and provenance',async()=>{
 assert.ok(validSea(d));assert.deepEqual(d.countries.map(c=>c.iso3),SEA_CODES);assert.equal(d.sources.gfw.years,25);assert.equal(d.sources.forest.period,'2023');assert.match(d.sources.co2.name,/EDGAR/);assert.match(d.checks.gfwIndependent,/unavailable/);
 for(const r of Object.values(d.receipts)){assert.match(r.sha256,/^[a-f0-9]{64}$/);assert.ok(r.bytes>0);assert.ok(r.url.startsWith('https://'));}
 const bytes=await readFile('public/data/sea/countries.geojson');const geo=JSON.parse(bytes);assert.deepEqual(geo.features.map(f=>f.properties.iso3).sort(),[...SEA_CODES].sort());assert.ok(bytes.length<160000);assert.equal(createHash('sha256').update(bytes).digest('hex'),d.sources.geometry.sha256);
 const totals=regionalRecord(d);for(const [k,v] of Object.entries(d.totals))assert.equal(totals[k],v.value);
 for(const c of d.countries){const delta=Math.abs(c.forest_net_t_yr-(c.forest_emissions_t_yr-c.forest_removals_t_yr));assert.ok(delta<Math.max(1,Math.abs(c.forest_net_t_yr)*1e-6),c.iso3);}
 const thai=(await read('public/data/ledger/provinces.json')).national;const t=d.countries.find(c=>c.iso3==='THA');assert.ok(Math.abs(t.forest_emissions_t_yr-thai.gfw_emissions_mg_co2e/25)<1);
});
test('Missing countries never become zero or partial regional totals',()=>{
 const x=structuredClone(d);x.countries[0].forest_km2=null;assert.ok(validSea(x));assert.equal(regionalRecord(x).forest_km2,null);assert.equal(regionalRecord(x).co2_mt,regionalRecord(d).co2_mt);assert.equal(regionalRecord(d).forest_pct,null);
 x.countries[0].forest_pct=101;assert.equal(validSea(x),false);x.countries[0].forest_pct=50;x.countries[0].forest_km2=-1;assert.equal(validSea(x),false);
 const dup=structuredClone(d);dup.countries[0]=dup.countries[1];assert.equal(validSea(dup),false);assert.equal(metricClass(null,'co2_mt'),-1);assert.equal(metricClass(-1,'forest_net_t_yr'),1);
});
test('Bilingual country lookup and exports preserve the claim boundary',()=>{
 assert.equal(countrySearch(d.countries,'ติมอร์')[0].iso3,'TLS');assert.equal(countrySearch(d.countries,'Viet Nam')[0].iso3,'VNM');assert.equal(countrySearch(d.countries,'notpresent').length,0);
 const e=seaExport(d,d.countries[0],'th');assert.ok(e.notCredits&&e.notCorporateFootprint&&e.notParcelEstimate);assert.equal(e.selection.iso3,'BRN');assert.equal(e.sources,d.sources);assert.equal(e.receipts,d.receipts);assert.ok(!('credits' in e.selection));
});
test('Seventeen detailed bilingual research chapters connect all eleven countries',()=>{
 assert.equal(seaChapters.length,17);for(const c of seaChapters){assert.equal(c.group,'region');for(const lang of ['th','en']){assert.ok(c.body[lang].length>1800,c.id);assert.ok(c.diagram[lang].length>=3);}assert.equal(c.reviewed,'2026-10-15');}
 for(const code of SEA_CODES){const c=seaChapters.find(c=>c.id==='sea-'+code.toLowerCase());assert.ok(c.sources.includes('fra-'+code.toLowerCase()));assert.ok(c.body.en.includes('not a credit calculator'));}
});

test('Carbon pools and the CO2 / non-CO2 split are conserved in the deployed snapshot',()=>{
 for(const c of d.countries){
  assert.ok(c.carbon_pools_t_c,c.iso3);
  const sum=Object.values(c.carbon_pools_t_c).reduce((a,b)=>a+b,0);
  assert.ok(Math.abs(sum-c.carbon_stock_t_c)<=Math.max(1,Math.abs(c.carbon_stock_t_c)*1e-9),c.iso3+' pools do not sum to stock');
  assert.ok(Math.abs(c.emissions_co2_only_t_yr+c.emissions_non_co2_t_yr-c.forest_emissions_t_yr)<1,c.iso3+' gas split does not sum to emissions');
 }
 assert.match(d.checks.carbonPools,/equals the published total/);
 assert.match(d.checks.gasSplit,/non-CO2/);
});
test('Stock, loss and peat bin edges are in stored units, so the map does not flatten to one colour',()=>{
 // Regression guard. A previous version declared bin edges in Gt C while storing tonnes, which put
 // every country in the top bin and made the map look like real data. Assert the property that broke.
 for(const m of ['carbon_stock_t_c','tree_cover_loss_ha','peat_stock_t_c']){
  const bins=new Set(d.countries.map(c=>metricClass(c[m],m)));
  assert.ok(bins.size>=3,`${m}: only ${bins.size} distinct bins — steps are probably not in stored units`);
  assert.equal(metricClass(null,m),-1,`${m}: a missing value must stay missing, not become the lowest bin`);
  // Whatever the scale, the top edge must be a finite, positive number in the displayed unit.
  const top=scaleValue(SEA_METRICS[m].steps[4],m);
  assert.ok(Number.isFinite(top)&&top>0,`${m}: top edge ${top}`);
 }
 // The displayed figure must be the stored figure divided once, not a second implicit conversion.
 const idn=d.countries.find(c=>c.iso3==='IDN');
 assert.ok(Math.abs(scaleValue(idn.carbon_stock_t_c,'carbon_stock_t_c')-38.099)<0.001);
 assert.ok(Math.abs(scaleValue(idn.tree_cover_loss_ha,'tree_cover_loss_ha')-33.12)<0.001);
 assert.equal(scaleValue(null,'carbon_stock_t_c'),null);
});
test('An incompletely covered layer withholds its regional total rather than publishing a partial sum',()=>{
 const mg=d.totals.mangrove_stock_t_c;
 assert.equal(mg.value,null);
 assert.equal(mg.coveredCountries,10);
 assert.equal(mg.expectedCountries,11);
 assert.ok(mg.partialSum>0,'the covered sum must be kept, just not published as a regional total');
 assert.equal(regionalRecord(d).mangrove_stock_t_c,null,'the shipped model must agree with the snapshot');
 const full=d.totals.carbon_stock_t_c;
 assert.equal(full.coveredCountries,11);assert.ok(full.value>0);assert.equal(full.partialSum,undefined);
 // Coverage is published as fact rather than asserted as universal.
 assert.match(d.checks.mangroveCoverage,/10 of 11/);
 assert.match(d.checks.peatCoverage,/11 of 11/);
 assert.match(d.sources['gfw-mangrove'].kind,/10 of 11/);
});
test('Each aggregate declares its own extent slice and mangrove is never folded into forest carbon',()=>{
 assert.equal(d.sources['gfw-layers'].slice,'is__flux_model_extent = true');
 assert.equal(d.sources['gfw-mangrove'].slice,'is__mangrove_biomass_extent = true');
 assert.equal(d.sources['gfw-peat'].slice,'is__gfw_peatlands = true');
 assert.match(d.checks.slices,/slice-filtered and never summed unfiltered/);
 // Mangrove and peat use different extents, so their sum must stay well inside the forest stock.
 assert.ok(d.totals.mangrove_stock_t_c.partialSum+d.totals.peat_stock_t_c.value<d.totals.carbon_stock_t_c.value);
 // Mangrove is deliberately not a map metric: a choropleth would invite adding it to a forest number.
 assert.ok(!('mangrove_stock_t_c' in SEA_METRICS));
 // Laos carries no mangrove extent upstream; that must remain a null, never a zero.
 assert.equal(d.countries.find(c=>c.iso3==='LAO').mangrove_stock_t_c,null);
});
