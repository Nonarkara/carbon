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
 'geometry':{'name':'Natural Earth 1:50m Admin 0','version':'v5.1.2','period':'cartographic release; not observation year','crs':'EPSG:4326','precisionDecimals':3,'simplification':'No further geometric simplification; coordinates rounded to 0.001 degrees','unit':'orientation only; never statistical area','licence':'Public domain','url':'https://www.naturalearthdata.com/downloads/50m-cultural-vectors/','sha256':hashlib.sha256(geo_raw).hexdigest()}}
 countries=[]
 for code,en,th in COUNTRIES:
  f=flux.get(code,{})
  countries.append({'iso3':code,'name':{'en':en,'th':th},'forest_km2':forest[code].get('2023'),'forest_pct':cover[code].get('2023'),'co2_mt':co2[code].get('2023'),'forest_history':[{'year':int(y),'km2':v} for y,v in sorted(forest[code].items())],
   'forest_emissions_t_yr':f.get('emissions_mg_co2e')/25 if f.get('emissions_mg_co2e') is not None else None,'forest_removals_t_yr':f.get('removals_mg_co2')/25 if f.get('removals_mg_co2') is not None else None,'forest_net_t_yr':f.get('net_mg_co2e')/25 if f.get('net_mg_co2e') is not None else None,
   'fra_url':f'https://fra-data.fao.org/assessments/fra/2025/{code}/home/','research_chapter':'sea-'+code.lower(),'project_method':'Thailand T-VER workbench only' if code=='THA' else 'No country project methodology implemented','registry':'No regional registry transaction or issuance integration'})
 totals={}
 for field in ['forest_km2','co2_mt','forest_emissions_t_yr','forest_removals_t_yr','forest_net_t_yr']:
  valid=[c[field] for c in countries if c[field] is not None];totals[field]={'value':sum(valid) if len(valid)==11 else None,'coveredCountries':len(valid),'expectedCountries':11}
 thailand=json.loads((ROOT/'public/data/ledger/provinces.json').read_text())['national'];tha=next(c for c in countries if c['iso3']=='THA')
 for k,out in [('gfw_emissions_mg_co2e','forest_emissions_t_yr'),('gfw_removals_mg_co2','forest_removals_t_yr')]:assert math.isclose(thailand[k]/25,tha[out],rel_tol=1e-8,abs_tol=1)
 checks['thaiLedger']='Thai GFW emissions/removals agree with deployed province ledger; no ledger rewrite'
 snapshot={'schemaVersion':1,'retrievedAt':retrieved,'scope':'Eleven geographic Southeast Asian countries','observationYear':2023,'sources':sources,'countries':countries,'totals':totals,'checks':checks,'receipts':receipts,'limitations':['Country statistics are not parcel measurements or corporate footprints.','Forest-area differences are not carbon-credit quantities.','Never subtract GFW forest flux from WDI CO2 as a synthesized national net.','No regional biomass-stock raster or parcel model is ingested.','No country credit entitlement, authorization, retirement or issued-credit amount is inferred.']}
 (OUT/'snapshot.json').write_text(json.dumps(snapshot,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'countries':len(countries),'geoBytes':len(geo_raw),'checks':checks,'totals':totals},ensure_ascii=False))
if __name__=='__main__':main()
