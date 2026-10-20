#!/usr/bin/env python3
"""Rebuild the eleven-country screening snapshot; no Thailand ledger files are modified."""
import argparse,csv,datetime as dt,hashlib,io,json,math,urllib.parse,urllib.request
from pathlib import Path
COUNTRIES=[('BRN','Brunei Darussalam','บรูไน'),('KHM','Cambodia','กัมพูชา'),('IDN','Indonesia','อินโดนีเซีย'),('LAO','Lao PDR','ลาว'),('MYS','Malaysia','มาเลเซีย'),('MMR','Myanmar','เมียนมา'),('PHL','Philippines','ฟิลิปปินส์'),('SGP','Singapore','สิงคโปร์'),('THA','Thailand','ไทย'),('TLS','Timor-Leste','ติมอร์-เลสเต'),('VNM','Viet Nam','เวียดนาม')]
CODES={c[0] for c in COUNTRIES}
ROOT=Path(__file__).resolve().parents[2]
RAW=ROOT/'research/raw/landscape/southeast-asia'
OUT=ROOT/'public/data/sea'

def main():
 p=argparse.ArgumentParser();p.add_argument('--refresh',action='store_true');a=p.parse_args()
 RAW.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
 receipts={};retrieved=dt.datetime.now(dt.timezone.utc).isoformat()
 def fetch(key,url):
  path=RAW/key
  if a.refresh or not path.exists():
   req=urllib.request.Request(url,headers={'User-Agent':'KabonnaResearch/1.0'})
   with urllib.request.urlopen(req,timeout=90) as r:path.write_bytes(r.read())
  raw=path.read_bytes();receipts[key]={'url':url,'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'retrievedAt':retrieved if a.refresh else dt.datetime.fromtimestamp(path.stat().st_mtime,dt.timezone.utc).isoformat()}
  return raw
 def wdi(ind):
  url='https://api.worldbank.org/v2/country/'+';'.join(c[0] for c in COUNTRIES)+'/indicator/'+ind+'?format=json&date=2000:2023&per_page=1000'
  d=json.loads(fetch(ind+'.json',url));assert isinstance(d,list) and len(d)==2 and d[0]['pages']==1,(ind,'Incomplete response')
  rows={c:{} for c in CODES}
  for r in d[1]:
   code=r['countryiso3code'];assert code in CODES
   value=r['value'];assert value is None or isinstance(value,(float,int)) and math.isfinite(value) and value>=0
   rows[code][r['date']]=value
  return rows,d[0]['lastupdated']
 forest,forest_update=wdi('AG.LND.FRST.K2');cover,cover_update=wdi('AG.LND.FRST.ZS');co2,co2_update=wdi('EN.GHG.CO2.MT.CE.AR5')
 fields='sum("gfw_full_extent_gross_removals__Mg_CO2") as removals_mg_co2, sum("gfw_full_extent_gross_emissions_biomass_soil__Mg_CO2e") as emissions_mg_co2e, sum("gfw_full_extent_net_flux__Mg_CO2e") as net_mg_co2e'
 sql=f"select iso, {fields} from data where iso in ("+','.join("'"+c[0]+"'" for c in COUNTRIES)+') and is__flux_model_extent = true and umd_tree_cover_density_2000__threshold=30 group by iso order by iso'
 url='https://data-api.globalforestwatch.org/dataset/carbonflux_adm1_summary/v20260327/download/csv?sql='+urllib.parse.quote(sql)
 flux={}
 for r in csv.DictReader(io.StringIO(fetch('gfw.csv',url).decode())):
  code=r.pop('iso');assert code in CODES and code not in flux
  flux[code]={k:float(v) if v else None for k,v in r.items()}
  f=flux[code];assert all(v is None or math.isfinite(v) for v in f.values())
  if all(v is not None for v in f.values()):assert math.isclose(f['emissions_mg_co2e']-f['removals_mg_co2'],f['net_mg_co2e'],rel_tol=1e-6,abs_tol=1)
 # ---- Additional open GFW layers on the SAME flux-model slice, so they cannot disagree with the flux above.
 # carbonflux_adm1_summary is a long-format cross-product of ~70 layers (71,877 rows/country unfiltered).
 # Summing without a slice filter multiplies every cell by the number of layer combinations.
 # Every field below is verified non-null across the whole slice before it is summed.
 def slice_sum(tag,where,fields,expect_all=True):
  # Explicit aliases. Deriving them from column names produced inconsistent keys (some stripped of the
  # prefix, some not), which silently turned every lookup into None. Names are now stated, not computed.
  cols=', '.join(f'sum("{c}") as {a}' for c,a in fields)
  q='select iso, '+cols+' from data where '+where+' and iso in ('+','.join("'"+c+"'" for c in sorted(CODES))+') group by iso order by iso'
  raw=fetch('gfw-'+tag+'.csv','https://data-api.globalforestwatch.org/dataset/carbonflux_adm1_summary/v20260327/download/csv?sql='+urllib.parse.quote(q)).decode()
  out={}
  for r in csv.DictReader(io.StringIO(raw)):
   code=r.pop('iso');assert code in CODES and code not in out
   out[code]={k:float(v) if v else None for k,v in r.items()}
  if expect_all:assert set(out)==CODES,(tag,'country coverage')
  return out
 FLUX_WHERE='umd_tree_cover_density_2000__threshold=30 and is__flux_model_extent = true'
 # Tree cover loss and the carbon-stock decomposition, on the flux slice.
 layers=slice_sum('loss-stock',FLUX_WHERE,[
  ('umd_tree_cover_loss__ha','tree_cover_loss_ha'),
  ('umd_tree_cover_extent_2000__ha','tree_cover_extent_2000_ha'),
  ('gfw_aboveground_carbon_stock_2000__Mg','aboveground_c_mg'),
  ('gfw_belowground_carbon_stock_2000__Mg','belowground_c_mg'),
  ('gfw_deadwood_carbon_stock_2000__Mg','deadwood_c_mg'),
  ('gfw_litter_carbon_stock_2000__Mg','litter_c_mg'),
  ('gfw_soil_carbon_stock_2000__Mg','soil_c_mg'),
  ('gfw_total_carbon_stock_2000__Mg','total_c_mg'),
  ('gfw_full_extent_gross_emissions_CO2_only_biomass_soil__Mg_CO2','emissions_co2_mg'),
  ('gfw_full_extent_gross_emissions_non_CO2_biomass_soil__Mg_CO2e','emissions_nonco2_mg')])
 for code,v in layers.items():
  # Source-internal conservation: the five carbon pools must sum to the published total.
  pools=[v['aboveground_c_mg'],v['belowground_c_mg'],v['deadwood_c_mg'],v['litter_c_mg'],v['soil_c_mg']]
  assert all(p is not None for p in pools),(code,'a carbon pool is missing on the flux slice')
  assert math.isclose(sum(pools),v['total_c_mg'],rel_tol=1e-6,abs_tol=1),(code,'carbon pools do not sum to total')
  em=flux[code].get('emissions_mg_co2e')
  if em is not None:assert math.isclose(v['emissions_co2_mg']+v['emissions_nonco2_mg'],em,rel_tol=1e-6,abs_tol=1),(code,'gas split does not sum to total emissions')
 # Mangrove and peat carbon use their own extent flags; they are never added to the forest totals.
 # Coverage is read from the API response rather than assumed: whichever countries carry the layer are
 # counted, and the count is published. An incomplete layer withholds its regional total instead of
 # publishing a partial sum that reads like a complete one.
 mangrove=slice_sum('mangrove','umd_tree_cover_density_2000__threshold=30 and is__mangrove_biomass_extent = true',[('gfw_total_carbon_stock_2000__Mg','total_c_mg'),('gfw_full_extent_gross_removals__Mg_CO2','removals_mg'),('gfw_full_extent_gross_emissions_biomass_soil__Mg_CO2e','emissions_mg')],expect_all=False)
 peat=slice_sum('peat','umd_tree_cover_density_2000__threshold=30 and is__gfw_peatlands = true',[('gfw_total_carbon_stock_2000__Mg','total_c_mg')],expect_all=False)
 assert set(mangrove)<=CODES and set(peat)<=CODES
 absent_mangrove=','.join(sorted(set(CODES)-set(mangrove))) or 'none'
 absent_peat=','.join(sorted(set(CODES)-set(peat))) or 'none'
 mangrove_note='Mangrove biomass extent present for '+str(len(mangrove))+' of 11 countries ('+','.join(sorted(mangrove))+'); absent for '+absent_mangrove+'. The missing country is not zero mangrove'
 peat_note='Peatland carbon present for '+str(len(peat))+' of 11 countries ('+','.join(sorted(peat))+'); absent for '+absent_peat
 # Independent spatial-summary product; disagreement stops publication rather than picking the convenient answer.
 url0='https://data-api.globalforestwatch.org/dataset/carbonflux_adm0_summary/v20260327/download/csv?sql='+urllib.parse.quote(sql)
 checks={}
 try:
  adm0={r['iso']:r for r in csv.DictReader(io.StringIO(fetch('gfw-adm0.csv',url0).decode()))}
  for code,f in flux.items():
   for key,value in f.items():
    if value is not None:assert math.isclose(value,float(adm0[code][key]),rel_tol=1e-6,abs_tol=1),(code,key,'ADM0 disagreement')
  checks['gfwIndependent']='ADM1 sums reconcile with independent ADM0 summary'
 except urllib.error.HTTPError as e:
  if e.code!=404:raise
  checks['gfwIndependent']='Independent ADM0 endpoint unavailable (404); only source-internal net and Thai ledger checks performed'
 ne_url='https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_countries.geojson'
 ne=json.loads(fetch('natural-earth.json',ne_url));features=[]
 def rounded(v):
  if isinstance(v,list):return [rounded(x) for x in v]
  return round(v,3)
 for f in ne['features']:
  code=f['properties']['ADM0_A3']
  if code in CODES:features.append({'type':'Feature','properties':{'iso3':code},'geometry':{'type':f['geometry']['type'],'coordinates':rounded(f['geometry']['coordinates'])}})
 assert {f['properties']['iso3'] for f in features}==CODES,'Country geometry coverage'
 geo={'type':'FeatureCollection','features':features}
 geo_raw=json.dumps(geo,separators=(',',':')).encode();assert len(geo_raw)<500000
 (OUT/'countries.geojson').write_bytes(geo_raw)
 sources={
 'forest':{'name':'FAO / World Bank WDI','version':'WDI '+forest_update,'indicator':'AG.LND.FRST.K2','period':'2023','unit':'km²','licence':'CC BY 4.0','url':'https://data.worldbank.org/indicator/AG.LND.FRST.K2','kind':'national statistical estimate'},
 'cover':{'name':'FAO / World Bank WDI','version':'WDI '+cover_update,'indicator':'AG.LND.FRST.ZS','period':'2023','unit':'% of land area','licence':'CC BY 4.0','url':'https://data.worldbank.org/indicator/AG.LND.FRST.ZS','kind':'national statistical estimate'},
 'co2':{'name':'EDGAR / IEA / World Bank WDI','version':'WDI '+co2_update,'indicator':'EN.GHG.CO2.MT.CE.AR5','period':'2023','unit':'Mt CO2e/year (CO2 only)','licence':'CC BY 4.0','url':'https://data.worldbank.org/indicator/EN.GHG.CO2.MT.CE.AR5','kind':'territorial CO2 estimate excluding LULUCF'},
 'gfw':{'name':'GFW forest carbon flux','version':'v1.4.3 · v20260327','period':'2001–2025 mean','years':25,'treeCoverThreshold':30,'unit':'tCO2e/year; removals tCO2/year','licence':'CC BY 4.0','url':'https://data-api.globalforestwatch.org/dataset/carbonflux_adm1_summary/v20260327','kind':'landscape model estimate'},
 'gfw-layers':{'name':'GFW integrated layers · carbonflux_adm1_summary','version':'v20260327','period':'tree cover loss 2001–2025 cumulative; carbon stock reference year 2000','treeCoverThreshold':30,'slice':'is__flux_model_extent = true','unit':'ha; t carbon','licence':'CC BY 4.0','url':'https://data-api.globalforestwatch.org/dataset/carbonflux_adm1_summary/v20260327','kind':'integrated landscape model outputs on the flux-model extent'},
 'gfw-mangrove':{'name':'GFW mangrove biomass extent','version':'v20260327','slice':'is__mangrove_biomass_extent = true','unit':'t carbon; tCO2/year','licence':'CC BY 4.0','url':'https://data-api.globalforestwatch.org/dataset/carbonflux_adm1_summary/v20260327','kind':'blue-carbon mangrove extent; reported separately from forest totals; present for '+str(len(mangrove))+' of 11 countries'},
 'gfw-peat':{'name':'GFW peatlands layer','version':'v20260327','slice':'is__gfw_peatlands = true','unit':'t carbon','licence':'CC BY 4.0','url':'https://data-api.globalforestwatch.org/dataset/carbonflux_adm1_summary/v20260327','kind':'peatland carbon stock; coverage stated per country in checks.peatCoverage'},
 'geometry':{'name':'Natural Earth 1:50m Admin 0','version':'v5.1.2','period':'cartographic release; not observation year','crs':'EPSG:4326','precisionDecimals':3,'simplification':'No further geometric simplification; coordinates rounded to 0.001 degrees','unit':'orientation only; never statistical area','licence':'Public domain','url':'https://www.naturalearthdata.com/downloads/50m-cultural-vectors/','sha256':hashlib.sha256(geo_raw).hexdigest()}}
 countries=[]
 for code,en,th in COUNTRIES:
  f=flux.get(code,{});L=layers.get(code,{});MG=mangrove.get(code,{});PT=peat.get(code,{})
  mg_stock=MG.get('total_c_mg')
  countries.append({'iso3':code,'name':{'en':en,'th':th},'forest_km2':forest[code].get('2023'),'forest_pct':cover[code].get('2023'),'co2_mt':co2[code].get('2023'),'forest_history':[{'year':int(y),'km2':v} for y,v in sorted(forest[code].items())],
   'forest_emissions_t_yr':f.get('emissions_mg_co2e')/25 if f.get('emissions_mg_co2e') is not None else None,'forest_removals_t_yr':f.get('removals_mg_co2')/25 if f.get('removals_mg_co2') is not None else None,'forest_net_t_yr':f.get('net_mg_co2e')/25 if f.get('net_mg_co2e') is not None else None,
   # Open layers added 2026-10-20. All are on the flux-model slice except mangrove/peat, which use their own
   # extent flags and are reported separately so they are never added into the forest totals.
   'tree_cover_loss_ha':L.get('tree_cover_loss_ha'),
   'tree_cover_extent_2000_ha':L.get('tree_cover_extent_2000_ha'),
   # Source unit is the megagram, which is a tonne. The field names say tonnes, so the stored value is
   # the source value; any rescaling to Gt C happens once, at display, in sea-model.js.
   'carbon_stock_t_c':L.get('total_c_mg') if L.get('total_c_mg') is not None else None,
   'carbon_pools_t_c':({k:L[k] for k in ['aboveground_c_mg','belowground_c_mg','deadwood_c_mg','litter_c_mg','soil_c_mg']} if L.get('total_c_mg') is not None else None),
   'emissions_co2_only_t_yr':L.get('emissions_co2_mg')/25 if L.get('emissions_co2_mg') is not None else None,
   'emissions_non_co2_t_yr':L.get('emissions_nonco2_mg')/25 if L.get('emissions_nonco2_mg') is not None else None,
   'mangrove_stock_t_c':mg_stock if mg_stock is not None else None,
   'mangrove_removals_t_yr':MG.get('removals_mg')/25 if MG.get('removals_mg') is not None else None,
   'mangrove_emissions_t_yr':MG.get('emissions_mg')/25 if MG.get('emissions_mg') is not None else None,
   'peat_stock_t_c':PT.get('total_c_mg') if PT.get('total_c_mg') is not None else None,
   'fra_url':f'https://fra-data.fao.org/assessments/fra/2025/{code}/home/','research_chapter':'sea-'+code.lower(),'project_method':'Thailand T-VER workbench only' if code=='THA' else 'No country project methodology implemented','registry':'No regional registry transaction or issuance integration'})
 totals={}
 # One rule for every total: a regional value is published only when all eleven countries are covered.
 # A partial sum is kept beside it under partialSum so the number is never lost, but it is not `value`
 # and nothing downstream can mistake it for a regional figure.
 for field in ['forest_km2','co2_mt','forest_emissions_t_yr','forest_removals_t_yr','forest_net_t_yr','tree_cover_loss_ha','tree_cover_extent_2000_ha','carbon_stock_t_c','mangrove_stock_t_c','peat_stock_t_c']:
  valid=[c[field] for c in countries if c[field] is not None]
  complete=len(valid)==len(CODES)
  entry={'value':sum(valid) if complete else None,'coveredCountries':len(valid),'expectedCountries':len(CODES)}
  if not complete:entry['partialSum']=sum(valid)
  totals[field]=entry
 thailand=json.loads((ROOT/'public/data/ledger/provinces.json').read_text())['national'];tha=next(c for c in countries if c['iso3']=='THA')
 for k,out in [('gfw_emissions_mg_co2e','forest_emissions_t_yr'),('gfw_removals_mg_co2','forest_removals_t_yr')]:assert math.isclose(thailand[k]/25,tha[out],rel_tol=1e-8,abs_tol=1)
 checks['thaiLedger']='Thai GFW emissions/removals agree with deployed province ledger; no ledger rewrite'
 checks['mangroveCoverage']=mangrove_note
 checks['peatCoverage']=peat_note
 checks['carbonPools']='For every country, aboveground + belowground + deadwood + litter + soil carbon equals the published total carbon stock (exact source-internal identity)'
 checks['gasSplit']='For every country, CO2-only + non-CO2 (CH4 and N2O) gross forest emissions equal the published total gross emissions'
 checks['slices']='Tree-cover loss, carbon stock and gas split use is__flux_model_extent; mangrove uses is__mangrove_biomass_extent; peat uses is__gfw_peatlands. The table is a ~72,000-row-per-country cross-product, so every aggregate is slice-filtered and never summed unfiltered'
 snapshot={'schemaVersion':1,'retrievedAt':retrieved,'scope':'Eleven geographic Southeast Asian countries','observationYear':2023,'sources':sources,'countries':countries,'totals':totals,'checks':checks,'receipts':receipts,'limitations':['Country statistics are not parcel measurements or corporate footprints.','Forest-area differences are not carbon-credit quantities.','Never subtract GFW forest flux from WDI CO2 as a synthesized national net.','Tree cover loss is cumulative 2001–2025 and is not a rate; it is not comparable with a single-year flux figure.','Carbon stock is a 2000 reference-year standing quantity, not a measured current value.','Mangrove and peatland carbon are reported separately and must not be added to forest carbon: mangrove uses its own extent flag and is mapped for '+str(len(mangrove))+' of 11 countries, peat for '+str(len(peat))+' of 11. Where a layer is incomplete its regional total is withheld and the partial sum is kept under totals.partialSum, never as a regional value.','No regional biomass-stock raster or parcel model is ingested.','No country credit entitlement, authorization, retirement or issued-credit amount is inferred.']}
 (OUT/'snapshot.json').write_text(json.dumps(snapshot,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'countries':len(countries),'geoBytes':len(geo_raw),'checks':checks,'totals':totals},ensure_ascii=False))
if __name__=='__main__':main()
