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
// The reader's order, not the computation's: what the forest is doing, what it holds, then the different quantity.
const SHOW=['net','stock','fossil'];
const COPY={
 th:{how:'คำนวณอย่างไร',sink:'ดูดซับสุทธิ (ค่าติดลบ) · ค่าเฉลี่ยของช่วงเวลา',source:'ปล่อยสุทธิ (ค่าบวก) · ค่าเฉลี่ยของช่วงเวลา',nfi:'สูงกว่าค่าเฉลี่ยของการสำรวจทรัพยากรป่าไม้แห่งชาติราว {r} เท่า ยังสรุปสาเหตุไม่ได้',fossil:'เป็นคนละปริมาณกับตัวเลขป่าข้างต้น ไม่นำมาหักลบกันที่นี่',explain:'ที่มาของตัวเลขนี้ + แผนภาพ ↗'},
 en:{how:'How it is calculated',sink:'Net sink (negative) · period average',source:'Net source (positive) · period average',nfi:'About {r}× the national forest inventory average; the cause is not yet settled',fossil:'A different quantity from the forest figures above; the two are not netted here',explain:'Explain this number + diagram ↗'},
};
export function renderCalculations({src,rows,datasets,conv,t,fmt,esc,getLang,nfi=null}){
 if(!src.area_ha)return `<p class="calc-alert">${esc(t('emptySelection'))}</p>`;
 const {R,CF}=stockChain(conv),c=COPY[getLang()]||COPY.en;
 // Millions with two decimals, like the strip: nine significant digits claimed a precision no input has.
 // The net takes the unit of its parts, as the strip does, so one number never shows two ways.
 const big=v=>Math.abs(v)>=1e6?`${fmt(v/1e6,2)} M`:fmt(v,0);
 const calc=selectionCalculations(src,rows,datasets,conv),stockValue=calc.find(x=>x.id==='stock')?.value||0,netRow=calc.find(x=>x.id==='net');
 const mega=Math.max(Math.abs(stockValue),...(netRow?[netRow.inputs[0]/netRow.inputs[2],netRow.inputs[1]/netRow.inputs[2]]:[0]))>=1e6;
 const netM=v=>`${Math.abs(v)>=1e6?fmt(v/1e6,2):new Intl.NumberFormat(getLang()==='th'?'th-TH':'en-GB',{maximumSignificantDigits:2}).format(v/1e6)} M`;
 return calc.sort((a,b)=>SHOW.indexOf(a.id)-SHOW.indexOf(b.id)).map(r=>{
  let substituted='';
  if(r.value!=null){const n=x=>fmt(x,2);substituted=r.id==='stock'?`${n(r.inputs[0])} t AGB × ${clean(1+R)} × ${clean(CF)} × 44 / 12`:r.id==='fossil'?`${n(r.inputs[0])} t C × 44 / 12`:`(${n(r.inputs[0])} − ${n(r.inputs[1])}) / ${r.inputs[2]}`;}
  // One plain line stays in view; the full caveats travel with the working.
  const extra=r.id==='stock'&&r.value!=null&&!r.coarse?t('treeCoverNote'):'';
  const plain=r.coarse?t('coarseFormula'):r.value==null?t('gridNotIngested'):r.id==='net'?(r.value<0?c.sink:c.source):r.id==='fossil'?c.fossil:nfi?c.nfi.replace('{r}',fmt(nfi.comparison.mean_ratio_map_over_nfi,1)):'';
  const detail=r.id==='stock'&&r.value!=null&&!r.coarse?(nfi?t('nfiNote').replace('{r}',fmt(nfi.comparison.mean_ratio_map_over_nfi,1))+' ':'')+t('bandNote'):'';
  return `<section class="calc-block ${r.id==='net'?'primary-calc':''}" data-calculation="${r.id}"><h3>${esc(t(r.title))}</h3><div class="calc-answer">${r.value==null?'—':r.id==='net'&&mega?netM(r.value):big(r.value)} <small>${esc(r.unit)}</small></div><p>${esc(r.source)} · ${esc(t('globalRef'))}</p>${plain?`<p>${esc(plain)}</p>`:''}${extra?`<p>${esc(extra)}</p>`:''}<details class="calc-how"><summary>${esc(c.how)}</summary><code>${esc(r.expression)}</code>${substituted?`<code class="substitution">${esc(substituted)}</code>`:''}${detail?`<p>${esc(detail)}</p>`:''}</details><a class="number-evidence" href="bible.html?lang=${getLang()}#${{stock:'forest-stock',fossil:'fossil',net:'forest-flux'}[r.id]}" target="_blank" rel="noopener">${esc(c.explain)}</a></section>`;
 }).join('')+`<p class="hint">${esc(t('calcCredit'))}</p>`;
}
