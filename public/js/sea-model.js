export const SEA_CODES=['BRN','KHM','IDN','LAO','MYS','MMR','PHL','SGP','THA','TLS','VNM'];
// Quantity that may be negative (a net flux is positive for a source, negative for a sink).
const SIGNED=['forest_net_t_yr','emissions_co2_only_t_yr','emissions_non_co2_t_yr'];
// Quantities that are physically non-negative. forest_pct is bounded separately by validSea.
const COUNTED=['forest_km2','co2_mt','forest_emissions_t_yr','forest_removals_t_yr','tree_cover_loss_ha','tree_cover_extent_2000_ha','carbon_stock_t_c','mangrove_stock_t_c','mangrove_removals_t_yr','mangrove_emissions_t_yr','peat_stock_t_c'];
// Fields a regional total may be formed over. A total is published only when all eleven are present,
// so a layer that covers fewer countries (mangrove) withholds its total instead of publishing a partial sum.
const SUMMED=[...COUNTED,'forest_net_t_yr'];
const FINITE=[...SIGNED,...COUNTED,'forest_pct'];
export function validSea(d){return d?.schemaVersion===1&&d.observationYear===2023&&d.countries?.length===11&&new Set(d.countries.map(c=>c.iso3)).size===11&&SEA_CODES.every(code=>d.countries.some(c=>c.iso3===code))&&d.sources?.gfw?.years===25&&d.countries.every(c=>(c.forest_pct===null||(c.forest_pct>=0&&c.forest_pct<=100))&&COUNTED.every(k=>c[k]===null||c[k]>=0)&&FINITE.every(k=>c[k]===null||Number.isFinite(c[k]))&&(c.carbon_pools_t_c===null)===(c.carbon_stock_t_c===null));}
export function regionalRecord(data){const sum=k=>{const v=data.countries.map(c=>c[k]);return v.every(Number.isFinite)?v.reduce((a,b)=>a+b,0):null;};return {iso3:'SEA',name:{en:'Southeast Asia · 11 countries',th:'เอเชียตะวันออกเฉียงใต้ · 11 ประเทศ'},...Object.fromEntries(SUMMED.map(k=>[k,sum(k)])),forest_pct:null,forest_history:[],research_chapter:'sea-overview'};}
export function countrySearch(countries,q){const terms=q.normalize('NFKC').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);return countries.filter(c=>terms.every(t=>`${c.iso3} ${c.name.en} ${c.name.th}`.normalize('NFKC').toLocaleLowerCase().includes(t)));}
export function seaExport(data,country,language){return {schemaVersion:1,kind:'regional-country-screening',notCredits:true,notCorporateFootprint:true,notParcelEstimate:true,language,exportedAt:new Date().toISOString(),selection:country,observationYear:data.observationYear,sources:data.sources,receipts:data.receipts,checks:data.checks,limitations:data.limitations};}
export const SEA_METRICS={
// `steps` is always expressed in the STORED unit of the data field, because metricClass compares a raw
// country value against it. `scale` converts that stored unit into the unit a reader is shown, and is
// applied in exactly one place so a bin edge and a printed number can never drift apart.
forest_pct:{en:'Forest share · % · 2023',th:'สัดส่วนป่า · % · 2023',unit:'%',steps:[0,20,40,60,80],scale:1,dec:1},
forest_emissions_t_yr:{en:'Forest emissions · MtCO₂e/yr · 2001–2025 mean',th:'ป่าปล่อย · ล้านตันCO₂e/ปี · เฉลี่ย 2001–2025',unit:'MtCO₂e/yr',steps:[0,1e6,10e6,100e6,500e6],scale:1e6,dec:2},
forest_net_t_yr:{en:'Forest net flux · MtCO₂e/yr · 2001–2025 mean',th:'ฟลักซ์สุทธิป่า · ล้านตันCO₂e/ปี · เฉลี่ย 2001–2025',unit:'MtCO₂e/yr',steps:[-Infinity,-10e6,0,10e6,100e6],scale:1e6,dec:2},
co2_mt:{en:'CO₂ excluding LULUCF · Mt/yr · 2023',th:'CO₂ ไม่รวม LULUCF · ล้านตัน/ปี · 2023',unit:'MtCO₂e/yr (CO₂)',steps:[0,10,50,100,500],scale:1,dec:2},
// Standing stock and cumulative loss are different kinds of quantity from the annual fluxes above.
// They are offered separately so a reservoir is never read as a rate and a running total is never
// compared with a single-year figure. Stored in tonnes of carbon and hectares, as the field names say.
carbon_stock_t_c:{en:'Forest carbon stock · Gt C · 2000 reference year',th:'คาร์บอนสะสมในป่า · Gt C · ปีฐานอ้างอิง 2000',unit:'Gt C',steps:[0,1e9,5e9,15e9,30e9],scale:1e9,dec:2},
tree_cover_loss_ha:{en:'Tree cover loss · Mha · cumulative 2001–2025',th:'การสูญเสียเรือนยอด · ล้านเฮกตาร์ · สะสม 2001–2025',unit:'Mha',steps:[0,1e6,5e6,10e6,30e6],scale:1e6,dec:2},
peat_stock_t_c:{en:'Peatland carbon stock · Gt C · 2000 reference year',th:'คาร์บอนในพรุ · Gt C · ปีฐานอ้างอิง 2000',unit:'Gt C',steps:[0,0.05e9,0.2e9,1e9,5e9],scale:1e9,dec:2}};
// Metrics that are shown in the evidence panel and the comparison table but are NOT map metrics.
// Mangrove uses its own extent flag, so a choropleth of it would invite adding it to a forest number.
// It still needs a display unit, so it lives here rather than in the map metric table.
export const SEA_DISPLAY={mangrove_stock_t_c:{en:'Mangrove carbon · Gt C · 2000 reference year',th:'คาร์บอนชายเลน · Gt C · ปีฐานอ้างอิง 2000',unit:'Gt C',scale:1e9,dec:2},forest_km2:{en:'Forest area · km² · 2023',th:'พื้นที่ป่า · km² · 2023',unit:'km²',scale:1,dec:1}};
// The display metadata of any metric a reader can be shown, whether or not it can be mapped.
export function metricDisplay(m){return SEA_METRICS[m]||SEA_DISPLAY[m]||null;}
// Convert a stored value into the displayed unit. Returns null unchanged so a missing value is never
// rendered as 0, and -Infinity (the net-flux lower bin edge) survives for the legend.
export function scaleValue(v,m){const M=metricDisplay(m);return v===null||!Number.isFinite(v)||!M?v:v/M.scale;}
export function metricClass(value,metric){if(value===null||!Number.isFinite(value))return -1;const steps=SEA_METRICS[metric]?.steps;if(!steps)return -1;let bin=0;steps.forEach((step,i)=>{if(value>=step)bin=i;});return bin;}
