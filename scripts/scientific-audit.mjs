// Reproducible diagnostics of deployed products, not field validation or a fitted model.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {stock,FACTORS} from '../public/js/carbon.js';
import {readGrid,sumSelection,stockBand,ledgerRows,polygonsOf,polygonFraction,cellBounds,bboxOf} from '../public/js/ledger.js';
import {changeUncertainty,requiredIndependentUnits,median} from './lib/audit-math.mjs';
const files=['public/data/ledger/manifest.json','public/data/ledger/provinces.json','public/data/ledger/nfi-check.json','public/data/ledger/grid.bin'];
const buffers=await Promise.all(files.map(p=>readFile(p)));
const [manifest,province,nfi]=buffers.slice(0,3).map(b=>JSON.parse(b));
const provenance=Object.fromEntries(files.map((p,i)=>[p,createHash('sha256').update(buffers[i]).digest('hex')]));
const version=JSON.parse(await readFile('public/version.json','utf8'));
const n=province.national,{r,cf}=FACTORS.general;
const band=src=>stockBand(src.forest_agb_mg,src.forest_sd_mg,src.forest_var_mg2,src.forest_blockvar_mg2);
const centralPct=src=>(band(src).central[1]-band(src).value)/band(src).value*100;
const base=stock(n.forest_agb_mg,r,cf);
const factors=[{id:'R-minus',r:r-.05,cf},{id:'R-plus',r:r+.05,cf},{id:'CF-minus',r,cf:cf-.01},{id:'CF-plus',r,cf:cf+.01}].map(x=>({...x,stock_tco2:stock(n.forest_agb_mg,x.r,x.cf),relative_pct:(stock(n.forest_agb_mg,x.r,x.cf)/base-1)*100}));
const conservation=['forest_agb_mg','forest_area_ha','area_ha','fossil_c_t','fire_co2_t'].map(key=>{const total=province.provinces.reduce((s,p)=>s+p[key],0);return {key,province_sum:total,national:n[key],relative_difference:(total-n[key])/n[key]};});
const grid=readGrid(new Uint8Array(buffers[3]).buffer,manifest.grid);
const nationalGrid=sumSelection(grid,{box:{west:97,east:106,south:5.2,north:20.8}});
const area={type:'Polygon',coordinates:[[[100.85,14.01],[101.18,14.06],[101.08,14.31],[100.85,14.01]]]};
const polys=polygonsOf(area),box=bboxOf(polys);
const polygonTests=[1,4,8,16].map(samples=>{let agb=0,hectares=0;for(let i=0;i<grid.index.length;i++){const c=cellBounds(grid.meta,grid.index[i]);if(c.east<=box.west||c.west>=box.east||c.north<=box.south||c.south>=box.north)continue;const fraction=polygonFraction(c,polys,samples);agb+=fraction*grid.layers.forest_agb_mg[i];hectares+=fraction*grid.layers.area_ha[i];}return {samples_per_side:samples,agb_mg:agb,area_ha:hectares};});
const ref=polygonTests.at(-1);for(const x of polygonTests)x.agb_difference_from_16_pct=(x.agb_mg/ref.agb_mg-1)*100;
const tiny=sumSelection(grid,{box:{west:100.9,east:100.91,south:14.1,north:14.11}});
const tinyRows=ledgerRows(tiny.totals,manifest.datasets,{minSideKm:1});
const changes=[-.5,0,.5,.9,1].map(rho=>({rho,...changeUncertainty(10,10,rho),illustrative_change_tco2:20}));
const sampleDesign=[.3,.6,1].map(cv=>({cv,relative_half_width:.1,independent_units:requiredIndependentUnits(cv,.1),units_with_design_effect_2:requiredIndependentUnits(cv,.1,2)}));
const result={schemaVersion:1,date:'2026-10-02',commit:version.commit,classification:'deployed-data diagnostics plus explicitly hypothetical sensitivity experiments; not independent validation',inputSha256:provenance,
 national:{agb_mg:n.forest_agb_mg,stock_tco2:base,central_random_half95_pct:centralPct(n),province_median_central_half95_pct:median(province.provinces.map(centralPct)),province_count:province.provinces.length},
 conservation,national_grid_agb_relative_difference:(nationalGrid.totals.forest_agb_mg-n.forest_agb_mg)/n.forest_agb_mg,
 parameterSensitivity:{status:'deterministic hypothetical perturbations; no probability distribution or recommended replacement factor',scenarios:factors},
 nfiComparison:{status:'unmatched populations; discrepancy and conditional sensitivity, not an identified map bias',reference_year:2017,mean_ratio:nfi.map.agb_mean_t_ha/nfi.nfi.national.agb_mean_t_ha,area_ratio:nfi.map.forest_area_ha/nfi.nfi.national.forest_area_ha,nesting_assumption:nfi.comparison.assumes,conditional_unadjusted:nfi.comparison.map_over_nfi_on_nfi_forest_if_extra_holds,conditional_allometric_sensitivity:nfi.comparison.allometry_corrected.map_over_nfi_on_nfi_forest_if_extra_holds},
 polygonSensitivity:{status:'one illustrative boundary over actual deployed grid; 16×16 is a denser approximation, not ground truth or a universal error bound',geometry:area,results:polygonTests},
 resolutionGuard:{status:'software behavior test, not accuracy validation',min_side_km:1,rows:tinyRows.map(x=>({id:x.id,value:x.value,tooCoarse:x.tooCoarse??false,unavailable:x.unavailable??null}))},
 changeSensitivity:{status:'hypothetical stock SD 10 tCO₂ at each date; shared-error correlation is not estimated by this app',results:changes},
 samplingDesign:{status:'hypothetical normal-approximation planning, not a mandated sample size; independent units may be plots or clusters depending on design',formula:'n ≈ ceil[(1.96 × CV / relative half-width)² × design effect]',results:sampleDesign},
 validation:{field:false,temporal_change:false,causal_additionality:false,interval_coverage:false,new_model_trained:false},datasetVersions:Object.fromEntries(Object.entries(manifest.datasets).map(([k,d])=>[k,{version:d.version??d.name,period:d.period??d.year}]))};
await writeFile('public/data/scientific-audit.json',JSON.stringify(result,null,2)+'\n');
console.log('Scientific audit: '+province.provinces.length+' province records; conservation, parameter, covariance, sampling and polygon diagnostics written. No field-validation claim.');
