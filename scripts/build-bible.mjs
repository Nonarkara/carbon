import {readFile,writeFile} from 'node:fs/promises';
import {auditView} from './audit-view.mjs';
import {marked} from 'marked';
import {chapters} from '../docs/bible/content.mjs';
import {stock,treeAGB,FACTORS} from '../public/js/carbon.js';
import {ledgerRows} from '../public/js/ledger.js';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const manifest=await read('public/data/ledger/manifest.json'),province=await read('public/data/ledger/provinces.json'),registry=await read('public/data/tgo/tver-forestry.json'),version=await read('public/version.json');
const source=(name,url,detail='')=>({name,url,detail});
const audit=await read('public/data/scientific-audit.json');
const reports={en:await readFile('docs/ACADEMIC_AUDIT.en.md','utf8'),th:await readFile('docs/ACADEMIC_AUDIT.th.md','utf8')};
const chapterHtml=(c,lang)=>marked.parse(c.body[lang])+(c.id==='scientific-audit'?marked.parse(reports[lang].replace('<!-- scientific-results -->',auditView(audit,lang))):'');
const sources={
 'gfw-watch':source('GFW integrated deforestation alerts · v20261005','data/gfw/watch.json','2026-09-05–2026-10-04 · hectares · tree-cover mask 2022 · raw SHA-256'),
 'gfw-alert-method':source('GFW / GNW alert metadata · UMD/GLAD + WUR','https://data-api.globalforestwatch.org/dataset/gfw_integrated_alerts','10 m integrated grid; GLAD-L resampled from 30 m · CC BY 4.0 · accessed 2026-10-05'),
 'audit-data':source('Executed scientific diagnostics · 2026-10-02','data/scientific-audit.json','Hypothetical sensitivities + deployed input SHA-256; not field accuracy'),
 'source-review':source('Targeted scientific source review','https://github.com/Nonarkara/carbon/blob/main/research/scientific-sources.json','Accessed 2026-10-02 · source age · contrary evidence · limitations'),
 gfoi:source('GFOI biomass-map guidance 2025 v1.1','https://www.reddcompass.org/mgd/resources/GFOI_BiomassMaps_Guidance-20251022.pdf','Chapter 2; Chapter 3 table · state of practice, not a ban on research'),
 'cci-pug':source('ESA CCI Biomass PUG v7.0','https://climate.esa.int/media/documents/Product_User_Guide_PUG_V7.0.pdf','19 March 2026 · sections 3.3–3.4, 4–6'),
 ceos:source('CEOS biomass validation protocol v1.0','https://lpvs.gsfc.nasa.gov/PDF/CEOS_WGCV_LPV_Biomass_Protocol_2021_V1.0.pdf','2021 · reference data, support and validation design'),
 'gedi-v3':source('GEDI L4A AGB Density v3 guide','https://daac.ornl.gov/GEDI/guides/GEDI_L4A_AGB_Density_V3.html','Model revision 5 June; guide revision 2 September 2026 · candidate, not ingested'),
 roberts:source('Roberts et al. 2017 · cross-validation','https://www.biom.uni-freiburg.de/mitarbeiter/dormann/roberts-et-al-2017-ecography.pdf/at_download/file','Ecography 40:913–929 · doi:10.1111/ecog.02881'),
 west:source('West et al. 2023 · forest counterfactuals','https://research.vu.nl/ws/portalfiles/portal/290140632/Action_needed_to_make_carbon_offsets_from_forest_conservation_work_for_climate_change_mitigation.pdf','Science 381:873–877 · corrected 31 January 2024; not Thai T-VER evidence'),
 'west-rebuttal':source('Rebuttal of West et al. · preprint','https://arxiv.org/abs/2312.06793','2023 · contested analysis, not peer-reviewed confirmation'),
 manifest:source('Deployed ledger manifest','data/ledger/manifest.json','Versions · hashes · conversion · uncertainty · conservation'),
 code:source('Calculation source and tests','https://github.com/Nonarkara/carbon','carbon.js · ledger.js · selection-view.js · tests/'),
 method:source('T-VER-S-METH-13-01 v2 / T-VER-S-TOOL-01-01 v2','https://tver.tgo.or.th/database/Uploads/Methodology/482ce748-b43f-4432-aef8-d7745dcc2692.pdf','Implemented method and tree-tool convention; applicable case requires review'),
 nfi:source('Thailand FREL/FRL · national inventory comparison','data/ledger/nfi-check.json','2017 reference · field plots 2013–2018 · links to UNFCCC submission'),
 'registry-data':source('TGO FOR & AGR · deployed snapshot','data/tgo/tver-forestry.json',registry.snapshot),
 tver:source('TGO T-VER project database','https://tver.tgo.or.th/','Program rules and individual registry records'),
 protocol:source('GHG Protocol · Corporate Standard','https://ghgprotocol.org/corporate-standard'),
 scope2:source('GHG Protocol · Scope 2 Guidance','https://ghgprotocol.org/scope-2-guidance'),
 scope3:source('GHG Protocol · Scope 3 Standard','https://ghgprotocol.org/corporate-value-chain-scope-3-standard'),
 'tgo-cfo':source('TGO · Carbon Label / CFO','https://thaicarbonlabel.tgo.or.th/?lang=en','Official organizational footprint resources'),
 cfolite:source('TGO · CFO Lite web app','https://cfolite.thaicfcalculator.com/','Public UI inspected 2026-10-02; authenticated calculation not reviewed'),
 'cfo-store':source('TGO · CFO Lite official Google Play listing','https://play.google.com/store/apps/details?id=th.or.tgo.cfolite','Published feature description; not a calculation audit'),
 iso1:source('ISO 14064-1:2018','https://www.iso.org/standard/66453.html','Organizational quantification and reporting'),
 iso2:source('ISO 14064-2:2019','https://www.iso.org/standard/66454.html','Project reductions / removal enhancements'),
 iso3:source('ISO 14064-3:2019','https://www.iso.org/standard/66455.html','Validation and verification'),
 iso67:source('ISO 14067:2018','https://www.iso.org/standard/71206.html','Product carbon footprints'),
 gibs:source('NASA · Global Imagery Browse Services','https://www.earthdata.nasa.gov/eosdis/science-system-description/eosdis-standard-products/gibs','Dated imagery; not calculation input'),
 noaa:source('NOAA GML · CO₂ trends','https://gml.noaa.gov/ccgg/trends/','Atmospheric concentration · ppm'),
 neso:source('NESO · Carbon Intensity API','https://carbonintensity.org.uk/','Great Britain · gCO₂/kWh · actual / forecast'),
 rggi:source('RGGI · Auction results','https://www.rggi.org/auctions/auction-results','USD per short ton allowance'),
 cbam:source('European Commission · CBAM','https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en','EUR per tCO₂ reference; not a forest credit price'),
 gcb:source('Global Carbon Budget 2025','https://globalcarbonbudget.org/fossil-fuel-co2-emissions-hit-record-high-in-2025/','2025 projection · published 2025-11-13'),
 worldbank:source('World Bank · State and Trends of Carbon Pricing 2026','https://www.worldbank.org/en/news/press-release/2026/05/19/direct-carbon-pricing-covers-nearly-one-third-of-global-emissions','Published 2026-05-19 · 2025 context'),
 rfd:source('Royal Forest Department dashboard','https://fp.forest.go.th/rfd_app/rfd_dashboard_m/app/main.php','Historical province context; not parcel carbon input'),
 datagoth:source('data.go.th · forest catalogue','https://data.go.th/dataset/?q=ป่าไม้','Discovery catalogue; integration status must be checked')
};
for(const [key,d] of Object.entries(manifest.datasets)){
 const first=Object.values(d.files||{}).find(v=>v?.url);
 const url=d.url||(d.doi?`https://doi.org/${d.doi}`:first?.url)||'data/ledger/manifest.json';
 sources[key]=source(d.name,url,[d.version||'',d.period||d.year||'',d.resolution||'',d.unit||'',d.licence||''].filter(Boolean).join(' · '));
}
const f=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:4}).format(n);
const n=province.national,rows=ledgerRows(n,manifest.datasets),s=rows.find(r=>r.id==='stock_forest');
const examples={
 registry:{label:{en:`Deployed registry snapshot · ${registry.snapshot}`,th:`snapshot ทะเบียนที่ใช้อยู่ · ${registry.snapshot}`},formula:`${registry.national.projects} projects; expected ${f(registry.national.expected_tco2e_yr)} tCO₂e/year; issued ${f(registry.national.issued_tco2e)} tCO₂e across ${registry.national.projects_with_issuance} projects`,note:{en:'Annual forecasts and issuance amounts remain separate. No assignment of multi-province tonnes to each province.',th:'แยกยอดคาดการณ์รายปีจากยอดรับรอง ไม่แจกตันหลายจังหวัดซ้ำให้ทุกจังหวัด'}},
 fire:{label:{en:'Deployed national example · GFED5.1 · 2013–2022 mean',th:'ตัวอย่างประเทศจากข้อมูลที่ใช้อยู่ · GFED5.1 · เฉลี่ย 2013–2022'},formula:`${f(n.fire_co2_t)} tCO₂/year`,note:{en:'Historical landscape average; not the project fire deduction.',th:'ค่าเฉลี่ยภูมิทัศน์ย้อนหลัง ไม่ใช่ค่าหักไฟของโครงการ'}},
 'forest-stock':{label:{en:'Deployed national example · 2020 · biomass only',th:'ตัวอย่างประเทศจากข้อมูลที่ใช้อยู่ · 2020 · เฉพาะมวลชีวภาพ'},formula:`${f(n.forest_agb_mg)} t AGB × (1 + ${FACTORS.general.r}) × ${FACTORS.general.cf} × 44 / 12 = ${f(s.value)} tCO₂e`,note:{en:`Central random-error 95% band: ${f(s.central[0])}–${f(s.central[1])} tCO₂e. Systematic bias excluded; read the NFI warning.`,th:`ช่วง 95% แบบกลางสำหรับความคลาดเคลื่อนสุ่ม: ${f(s.central[0])}–${f(s.central[1])} tCO₂e ไม่รวมอคติเชิงระบบ อ่านคำเตือน NFI ด้วย`}},
 fossil:{label:{en:'Deployed national example · ODIAC2025 · 2024',th:'ตัวอย่างประเทศจากข้อมูลที่ใช้อยู่ · ODIAC2025 · 2024'},formula:`${f(n.fossil_c_t)} t C × 44 / 12 = ${f(n.fossil_c_t*44/12)} tCO₂/year`},
 'forest-flux':{label:{en:'Deployed national example · GFW · 2001–2025 mean',th:'ตัวอย่างประเทศจากข้อมูลที่ใช้อยู่ · GFW · เฉลี่ย 2001–2025'},formula:`(${f(n.gfw_emissions_mg_co2e)} − ${f(n.gfw_removals_mg_co2)}) / ${manifest.datasets.gfw.years} = ${f((n.gfw_emissions_mg_co2e-n.gfw_removals_mg_co2)/manifest.datasets.gfw.years)} tCO₂e/year`},
 'project-change':{label:{en:'Illustrative inputs · not a registered project',th:'ข้อมูลสมมติ · ไม่ใช่โครงการขึ้นทะเบียน'},formula:`(1,100 − 1,000) t AGB × (1 + 0.27) × 0.47 × 44 / 12 − 0 = ${f(stock(100,.27,.47))} tCO₂e`},
 trees:{label:{en:'Illustrative single tree · DBH 20 cm · height 10 m',th:'ต้นไม้สมมติหนึ่งต้น · DBH 20 ซม. · สูง 10 ม.'},formula:`x = 20² × 10 = 4,000; AGB = ${f(treeAGB(20,10))} t`}
};
const data={version:1,reviewed:'2026-10-02',commit:version.commit,sources,chapters:chapters.map(c=>({...c,body:c.id==='scientific-audit'?{en:c.body.en+'\n'+reports.en,th:c.body.th+'\n'+reports.th}:c.body,html:{en:chapterHtml(c,'en'),th:chapterHtml(c,'th')},example:examples[c.id]||null})),coverage:{stock:'forest-stock',flux:'forest-flux',fossil:'fossil',fire:'fire',area:'geometry',uncertainty:'uncertainty',nfi:'nfi',registry:'registry',markets:'markets',world:'world',project:'project-change',plots:'trees',atmosphere:'atmosphere',rfd:'sources',btr1:'sources',climatetrace:'fossil'}};
await writeFile('public/data/bible.json',JSON.stringify(data));
await writeFile('public/bible.html',`<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Carbon Bible · คาบอนนะ</title><meta name="description" content="Searchable Thai and English carbon footprint and forest credit reference: equations, worked examples, sources and limits."><link rel="icon" href="images/brand/icon-32.png"><link rel="stylesheet" href="css/bible.css"><link rel="stylesheet" href="css/flat-controls.css"></head><body><a class="skip" href="#article">Skip to chapter / ไปที่บท</a><header><a id="back" href="/?lang=th"><img src="images/brand/ct-mark.png" alt="คาบอนนะ"><span id="backText">เครื่องมือ ↗</span></a><strong id="brand">คู่มือคาร์บอน</strong><div class="language"><button data-lang="th" aria-pressed="true">TH</button><button data-lang="en" aria-pressed="false">EN</button></div></header><main><aside class="index"><h1 id="readerTitle">สูตรคาร์บอนและแหล่งข้อมูล</h1><p id="intro">ค้นสูตร อ่านสมมติฐาน แล้วเปิดแหล่งอ้างอิง</p><form id="searchForm" role="search"><label for="search" id="searchLabel">ค้นคู่มือ</label><div class="search-row"><input type="search" id="search" placeholder="เช่น Scope 2, มวลชีวภาพ, เครดิต"><button id="clear" type="button">ล้าง</button></div></form><div id="filters" aria-label="Categories"></div><p id="count" role="status"></p><nav id="results" aria-label="Chapters"></nav></aside><section class="reading"><article id="article" tabindex="-1"><p>Loading / กำลังโหลด…</p></article><nav id="chapterNav" aria-label="Previous and next chapter"></nav></section><aside class="evidence"><h2 id="evidenceTitle">หลักฐานที่ใช้ในบทนี้</h2><div id="sources"></div><div class="reader-tools"><button id="share">คัดลอกลิงก์บท</button><button id="print">พิมพ์บทนี้</button><a id="research" href="research-th.html">สมุดวิจัยฉบับเต็ม ↗</a><a id="guide" href="guide-th.html">คู่มือใช้งาน ↗</a></div><p id="receipt"></p><p id="shareStatus" role="status"></p></aside></main><footer id="fineprint"></footer><noscript>Enable JavaScript for search. <a href="research-th.html">งานวิจัยไทย</a> · <a href="research-en.html">English research</a></noscript><script type="module" src="js/bible.js"></script></body></html>`);
console.log(`Built bilingual Bible: ${chapters.length} chapters, ${Object.keys(sources).length} sources`);
