import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {SEA_CODES,validSea,regionalRecord,countrySearch,seaExport,metricClass} from '../public/js/sea-model.js';
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
