// Boundary checks for the shipped source families, not a license to mix them.
const finite=v=>Number.isFinite(v),nonnegative=v=>finite(v)&&v>=0;
const text=v=>typeof v==='string'&&v.length>0;
const years=a=>Array.isArray(a)&&a.length>=2&&a.length<=100&&a.every((v,i)=>Number.isInteger(v)&&v>=1900&&v<=2200&&(!i||v===a[i-1]+1));
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v));
const provinces=d=>d&&Object.keys(d).length===77&&Object.keys(d).every(k=>/^TH\d{2}$/.test(k));
const https=v=>{try{return new URL(v).protocol==='https:';}catch{return false;}};
const values=(d,keys,fn=nonnegative)=>d&&keys.every(k=>fn(d[k]));
const SERIES_FLAGS=['none','loss','potential_loss','no_reliable_change','potential_gain','gain'];

export function validStockYears(d){
 const m=d?.meta;if(!m||m.dataset!=='ESA CCI Biomass AGB'||m.version!=='v7.0'||m.resolution!=='100 m'||!years(m.years)||!m.years.includes(m.change?.from)||!m.years.includes(m.change?.to)||m.change.from>=m.change.to||JSON.stringify(m.change.classes)!==JSON.stringify(SERIES_FLAGS)||m.units?.agb_mg!=='Mg aboveground biomass, all land'||m.units?.flag_ha!=='ha of land'||!text(m.licence)||!provinces(d.provinces))return false;
 const record=r=>Array.isArray(r?.agb_mg)&&r.agb_mg.length===m.years.length&&r.agb_mg.every(nonnegative)&&values(r.flag_ha,SERIES_FLAGS)&&values(r.flag_agb_mg,SERIES_FLAGS,finite);
 return record(d.national)&&Object.values(d.provinces).every(record);
}
export function validLossYears(d){
 const m=d?.meta;if(!m||m.dataset!=='GFW carbonflux_adm1_change'||m.version!=='v20260327 (flux model v1.4.3)'||!years(m.years)||(m.years[0]!==2001||m.years.at(-1)!==2025)||m.units?.['*_ha']!=='hectares per year'||m.units?.emissions!=='Mg (t) CO2e per year, biomass + soil, all gases'||!text(m.licence)||!text(m.filters)||!provinces(d.provinces))return false;
 const series=a=>Array.isArray(a)&&a.length===m.years.length&&a.every(nonnegative);
 const record=r=>r&&values(r,['tree_cover_natural_ha','tree_cover_plantation_ha'])&&['loss_ha','natural_ha','plantation_ha','primary_ha','protected_ha','emissions','natural_emissions'].every(k=>series(r[k]))&&r.drivers&&Object.keys(r.drivers).length>0&&Object.values(r.drivers).every(series)&&r.loss_ha.every((v,i)=>Math.abs(v-r.natural_ha[i]-r.plantation_ha[i])<=.2+v*1e-6);
 return record(d.national)&&Object.values(d.provinces).every(record);
}
export function validProvinceGeometry(d){
 let points=0;
 const point=p=>Array.isArray(p)&&p.length===2&&p.every(finite)&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90&&++points<=100000;
 const ring=r=>Array.isArray(r)&&r.length>=4&&r.every(point)&&r[0][0]===r.at(-1)[0]&&r[0][1]===r.at(-1)[1];
 const polygon=p=>Array.isArray(p)&&p.length>0&&p.every(ring);
 const geometry=g=>g?.type==='Polygon'?polygon(g.coordinates):g?.type==='MultiPolygon'&&Array.isArray(g.coordinates)&&g.coordinates.length>0&&g.coordinates.every(polygon);
 return d?.type==='FeatureCollection'&&Array.isArray(d.features)&&d.features.length===77&&new Set(d.features.map(f=>f.properties?.pcode)).size===77&&d.features.every(f=>/^TH\d{2}$/.test(f.properties?.pcode)&&text(f.properties.name_th)&&text(f.properties.name_en)&&geometry(f.geometry));
}
export function validProvinceLedger(d){
 const record=r=>r&&text(r.name_th)&&text(r.name_en)&&values(r,['area_ha','forest_area_ha','agb_mg','forest_agb_mg','forest_sd_mg','forest_var_mg2','forest_blockvar_mg2','fossil_c_t','fire_co2_t','gfw_removals_mg_co2','gfw_emissions_mg_co2e'])&&finite(r.gfw_net_mg_co2e);
 return d?.national?.pcode==='TH'&&record(d.national)&&Array.isArray(d.provinces)&&d.provinces.length===77&&new Set(d.provinces.map(p=>p.pcode)).size===77&&d.provinces.every(p=>/^TH\d{2}$/.test(p.pcode)&&record(p));
}
export function validLedgerManifest(d){
 const g=d?.grid,ds=d?.datasets,c=d?.conversion,period=ds?.gfw?.period?.match(/^(\d{4})–(\d{4})$/);
 const gridLayers=['forest_agb_mg','forest_sd_mg','forest_var_mg2','agb_mg','area_ha','forest_area_ha','fossil_c_t','fire_co2_t'];
 return d?.schemaVersion===1&&g&&Number.isInteger(g.count)&&g.count>0&&g.count<=1e6&&Number.isInteger(g.cols)&&g.cols>0&&Number.isInteger(g.rows)&&g.rows>0&&nonnegative(g.step)&&g.step>0&&finite(g.west)&&finite(g.north)&&Array.isArray(g.layers)&&g.layers.length>0&&g.layers.length<=32&&new Set(g.layers).size===g.layers.length&&JSON.stringify(g.layers)===JSON.stringify(gridLayers)&&g.count<=g.cols*g.rows&&Array.isArray(d.overlayBounds)&&d.overlayBounds.length===2&&d.overlayBounds.every(p=>Array.isArray(p)&&p.length===2&&p.every(finite))&&ds&&['cci','fnf','gfw','gfed','odiac'].every(k=>text(ds[k]?.name)&&text(ds[k]?.licence))&&['cci','fnf','gfw','odiac'].every(k=>text(ds[k].version))&&period&&Number(period[2])-Number(period[1])+1===ds.gfw.years&&nonnegative(ds.gfed.cellKm)&&nonnegative(ds.odiac.cellKm)&&ds.cci.version==='v7.0'&&ds.gfw.version==='v1.4.3 (data-api v20260327)'&&ds.gfw.period==='2001–2025'&&ds.cci.unit==='Mg/ha (AGB, SD)'&&ds.gfw.unit==='Mg CO2e over the period'&&Number.isInteger(ds.gfw.years)&&ds.gfw.years>0&&text(ds.gfw.period)&&Number.isInteger(ds.cci.year)&&Number.isInteger(ds.odiac.year)&&c&&Math.abs(c.c_to_co2-44/12)<1e-10&&Math.abs(c.agb_to_co2e-(1+c.root_shoot)*c.carbon_fraction*44/12)<1e-10;
}
export function validNFI(d){return d&&values(d.nfi?.national,['carbon_stock_tco2e','carbon_stock_ci95_tco2e','forest_area_ha','agb_mean_t_ha'])&&values(d.nfi?.national_allometry_corrected,['carbon_stock_tco2e'])&&values(d.map,['forest_area_ha','agb_mean_t_ha'])&&values(d.comparison,['mean_ratio_map_over_nfi','implied_agb_t_ha_of_extra_tree_cover_if_map_unbiased_on_nfi_forest'])&&values(d.comparison.allometry_corrected,['implied_agb_t_ha_of_extra_tree_cover'])&&Number.isInteger(d.nfi.reference_year);}
export function validRegistry(d){
 const agg=a=>values(a,['projects','expected_tco2e_yr','issued_tco2e']);
 return d?.schemaVersion===1&&date(d.snapshot)&&https(d.source?.registry)&&https(d.source?.market)&&text(d.source.terms)&&agg(d.national)&&agg(d.multi)&&agg(d.unlocated)&&provinces(d.provinces)&&Object.values(d.provinces).every(agg)&&Array.isArray(d.market?.for_agr)&&d.market.for_agr.every(r=>values(r,['year','volume_tco2e','avg_thb','min_thb','max_thb']))&&Array.isArray(d.projects)&&d.projects.length===d.national.projects&&d.projects.every(p=>text(p.key)&&text(p.name_th)&&https(p.url)&&Array.isArray(p.provinces)&&p.provinces.every(k=>Object.hasOwn(d.provinces,k))&&Array.isArray(p.families)&&p.families.every(text)&&Array.isArray(p.issuances)&&p.issuances.every(i=>nonnegative(i.tco2e)&&date(i.certified))&&nonnegative(p.issued_tco2e)&&(p.expected_tco2e_yr===null||nonnegative(p.expected_tco2e_yr)));
}
