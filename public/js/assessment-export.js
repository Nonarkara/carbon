// The compact table retains the six numeric rows and carries their evidence into every row.
export function assessmentCSVRows(a){
 const {result:r,inputs:i}=a;
 const rows=[['previous_stock',r.before,'tCO2e'],['current_stock',r.after,'tCO2e'],['project_emissions',r.pe,'tCO2e'],['leakage',r.leakage,'tCO2e'],['net_period_change',r.net,'tCO2e'],['annual_average',r.annualAverage,'tCO2e/year']];
 const metadata=[a.status,i.start,i.end,i.source,i.fireSource,a.methodology.code,a.methodology.version,a.methodology.tool,i.unit,i.r,i.cf,a.uncertainty===null?'not assessed':JSON.stringify(a.uncertainty),'not issued',a.appVersion,a.exportedAt,a.tverRegistryContext?.status||'not requested'];
 return [['quantity','value','unit','status','start','end','inputSource','fireSource','methodology','methodologyVersion','treeTool','inputUnit','rootShootRatio','carbonFraction','uncertainty','issuedCreditsStatus','appVersion','exportedAt','registryContextStatus'],...rows.map(row=>[...row,...metadata])];
}

export function csvText(rows){
 const cell=value=>{
  let text=String(value??'');
  // User-entered evidence can begin with a spreadsheet formula. Preserve it as text;
  // signed numeric results remain numbers, including a genuine negative stock change.
  if(typeof value==='string'&&/^[\s\uFEFF]*[=+@-]/.test(text))text="'"+text;
  return '"'+text.replaceAll('"','""')+'"';
 };
 return '\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n');
}
