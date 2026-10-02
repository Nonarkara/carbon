import {AGB_TO_CO2E,C_TO_CO2} from './ledger.js';
import {FACTORS} from './carbon.js';
// Stock display is the T-VER chain AGB × (1+R) × CF × 44/12. R and CF come from the manifest.
// A lone combined factor must not replace that chain.
function stockChain(conv){
 const R=conv?.root_shoot??FACTORS.general.r,CF=conv?.carbon_fraction??FACTORS.general.cf;
 return {R,CF,factor:(1+R)*CF*C_TO_CO2};
}
const clean=x=>Number(x.toFixed(6)).toString();
export function selectionCalculations(src,rows,datasets,conv){
 const find=id=>rows.find(r=>r.id===id),out=[],{R,CF,factor}=stockChain(conv);
 const stock=find('stock_forest');
 out.push({id:'stock',title:'formulaStock',value:stock?.tooCoarse?null:stock?.value??null,unit:'tCO₂e',coarse:!!stock?.tooCoarse,
  inputs:[src.forest_agb_mg,1+R,CF,44,12],expression:`AGB × (1 + ${clean(R)}) × ${clean(CF)} × 44 / 12`,factor,source:`ESA CCI ${datasets.cci.version} + JAXA ${datasets.fnf.version} · ${datasets.cci.year}`,period:datasets.cci.year});
 const fossil=find('fossil');out.push({id:'fossil',title:'formulaFossil',value:fossil?.tooCoarse?null:fossil?.value??null,coarse:!!fossil?.tooCoarse,unit:'tCO₂ / yr',inputs:[src.fossil_c_t,44,12],expression:'Fossil C × 44 / 12',factor:C_TO_CO2,source:`${datasets.odiac.version} · ${datasets.odiac.year}`});
 const net=find('forest_net');out.push({id:'net',title:'formulaFlux',value:net?.value??null,unit:'tCO₂e / yr',inputs:[src.gfw_emissions_mg_co2e,src.gfw_removals_mg_co2,datasets.gfw.years],expression:'(Emissions − removals) / years',source:`GFW ${datasets.gfw.version} · ${datasets.gfw.period}`});
 return out;
}
export function renderCalculations({src,rows,datasets,conv,t,fmt,esc,getLang,nfi=null}){
 if(!src.area_ha)return `<p class="calc-alert">${esc(t('emptySelection'))}</p>`;
 const {R,CF}=stockChain(conv);
 return selectionCalculations(src,rows,datasets,conv).map(r=>{
  let substituted='';
  if(r.value!=null){const n=x=>fmt(x,2);substituted=r.id==='stock'?`${n(r.inputs[0])} t AGB × ${clean(1+R)} × ${clean(CF)} × 44 / 12`:r.id==='fossil'?`${n(r.inputs[0])} t C × 44 / 12`:`(${n(r.inputs[0])} − ${n(r.inputs[1])}) / ${r.inputs[2]}`;}
  const note=r.coarse?t('coarseFormula'):r.value==null?t('gridNotIngested'):r.id==='stock'?(nfi?t('nfiNote').replace('{r}',fmt(nfi.comparison.mean_ratio_map_over_nfi,1))+' ':'')+t('bandNote'):r.id==='net'?(getLang()==='th'?'ค่าติดลบ = ดูดซับสุทธิ · ค่าเฉลี่ยของช่วงเวลา':'Negative = net sink · period average'):'';
  return `<section class="calc-block ${r.id==='stock'?'primary-calc':''}" data-calculation="${r.id}"><h3>${esc(t(r.title))}</h3><div class="calc-answer">${r.value==null?'—':fmt(r.value,0)} <small>${esc(r.unit)}</small></div><code>${esc(r.expression)}</code>${substituted?`<code class="substitution">${esc(substituted)}</code>`:''}<p>${esc(r.source)} · ${esc(t('globalRef'))}</p>${note?`<p>${esc(note)}</p>`:''}<a class="number-evidence" href="bible.html?lang=${getLang()}#${{stock:'forest-stock',fossil:'fossil',net:'forest-flux'}[r.id]}" target="_blank" rel="noopener">${getLang()==='th'?'ที่มาของตัวเลขนี้ + แผนภาพ ↗':'Explain this number + diagram ↗'}</a></section>`;
 }).join('')+`<p class="hint">${esc(t('calcCredit'))}</p>`;
}
