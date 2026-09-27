export const METHOD = {code:'T-VER-S-METH-13-01', version:2, tool:'T-VER-S-TOOL-01-01 v2', url:'https://tver.tgo.or.th/database/Uploads/Methodology/482ce748-b43f-4432-aef8-d7745dcc2692.pdf'};
export const FACTORS = {general:{r:0.27,cf:0.47},rhizophora:{r:0.48,cf:0.4715},palm:{r:0.41,cf:0.413}};
export function number(value, name, min=0, max=1e12) {
  if(value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && !value.trim())) throw new Error(`missing:${name}`);
  const n=Number(value);
  if(!Number.isFinite(n)||n<min||n>max) throw new Error(`invalid:${name}`);
  return n;
}
export function stock(agbTonnes,r,cf) { return number(agbTonnes,'AGB')*(1+number(r,'R',0,2))*number(cf,'CF',0,1)*44/12; }
export function dateValue(value) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value||'')) throw new Error('invalid:date');
  const ms=Date.parse(value+'T00:00:00Z');
  if(!Number.isFinite(ms)||new Date(ms).toISOString().slice(0,10)!==value) throw new Error('invalid:date');
  return ms;
}
export function calculate(input) {
  const start=dateValue(input.start),end=dateValue(input.end);
  if(end<=start)throw new Error('invalid:period');
  const previous=number(input.previous,'previous'),current=number(input.current,'current');
  const r=number(input.r,'R',0,2),cf=number(input.cf,'CF',0,1);
  if(!['agb','co2'].includes(input.unit))throw new Error('invalid:unit');
  const before=input.unit==='agb'?stock(previous,r,cf):previous;
  const after=input.unit==='agb'?stock(current,r,cf):current;
  const burned=number(input.burnedPercent,'burnedPercent',0,100);
  if(!['yes','no','unknown'].includes(input.canopyDeath))throw new Error('invalid:canopyDeath');
  if(input.canopyDeath==='unknown')throw new Error('missing:fireAssessment');
  const fireApplies=burned>5&&input.canopyDeath==='yes';
  const pe=fireApplies?number(input.fireEmissions,'fireEmissions'):0;
  const delta=after-before,net=delta-pe,years=(end-start)/86400000/365.25;
  return {before,after,delta,pe,leakage:0,net,years,annualAverage:net/years,fireApplies,
    sizeScreen:net/years>16000?'review-large-project':'review-eligibility',status:'unverified-estimate',issuedCredits:null};
}
// Ogawa et al. (1965), mixed deciduous / dry dipterocarp, TGO tool v2 appendix.
export function treeAGB(dbh,height) {
  const d=number(dbh,'dbh_cm',4.5,300),h=number(height,'height_m',1.31,100),x=d*d*h;
  const stem=0.0396*x**0.933,branch=0.00349*x**1.030;
  const leaves=1/(28/(stem+branch)+0.025);
  return (stem+branch+leaves)/1000;
}
export function plotEstimate(rows,projectHa) {
  const plots=new Map(),ids=new Set();
  for(const row of rows){
    const id=`${row.plot_id}:${row.tree_id}`;
    if(!row.plot_id||!row.tree_id||ids.has(id))throw new Error('invalid:duplicateTree');ids.add(id);
    const area=number(row.plot_area_m2,'plot_area_m2',1,1000000);
    const existing=plots.get(row.plot_id);
    if(existing&&existing.area!==area)throw new Error('invalid:plotArea');
    const p=existing||{area,agb:0};p.agb+=treeAGB(row.dbh_cm,row.height_m);plots.set(row.plot_id,p);
  }
  if(!plots.size)throw new Error('missing:plots');
  const hectares=number(projectHa,'projectHa',0.0001);
  const surveyedHa=[...plots.values()].reduce((sum,p)=>sum+p.area/10000,0);
  if(surveyedHa>hectares)throw new Error('invalid:sampleArea');
  // Area-weighted expansion assumes one homogeneous stratum and a representative sampling design.
  const density=[...plots.values()].reduce((sum,p)=>sum+p.agb,0)/surveyedHa;
  return {agbTonnes:density*hectares,densityTonnesHa:density,plotCount:plots.size,treeCount:rows.length,surveyedHa,projectHa:hectares,equation:'Ogawa et al. (1965); TGO tree-tool v2 appendix; mixed deciduous / dry dipterocarp',assumption:'one homogeneous stratum; representative plots; trees DBH >=4.5cm; other pools excluded',uncertainty:null};
}
