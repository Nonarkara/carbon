// Tree cover lost each year, cooked by scripts/ingest/build_loss.py from GFW's yearly table.
// Pure rendering: every number on screen is a sum or a share of data/gfw/loss-years.json.

const DRIVERS={
 'Permanent agriculture':['เกษตรกรรมถาวร','Permanent agriculture'],
 'Shifting cultivation':['ไร่หมุนเวียน','Shifting cultivation'],
 'Settlements & Infrastructure':['ชุมชนและโครงสร้างพื้นฐาน','Settlements & infrastructure'],
 'Logging':['การทำไม้','Logging'],
 'Hard commodities':['เหมืองแร่และพลังงาน','Mining & energy'],
 'Wildfire':['ไฟป่า','Wildfire'],
 'Other natural disturbances':['การรบกวนตามธรรมชาติอื่น','Other natural disturbances'],
 'Unknown':['ไม่ทราบ','Unknown'],
};
const COPY={
 th:{title:'เรือนยอดไม้ที่หายไปแต่ละปี',natural:'นอกสวนปลูก',plantation:'ในสวนปลูก (ตัดแล้วปลูกใหม่)',plantationShort:'ในสวนปลูก',total:'2001–2025',recent:'เฉลี่ยปี 2021–2025 นอกสวนปลูก',ofCover:'ของเรือนยอดไม้ต่อปี',prior:'2016–2020',rank:'จัดอันดับจังหวัด',csv:'CSV รายปี',primary:'ในป่าดั้งเดิม',protected:'ในพื้นที่คุ้มครอง',emissions:'CO₂ จากการสูญเสียนอกสวนปลูก',driver:'สาเหตุหลักนอกสวนปลูก',peak:'ปีสูงสุด',
  note:'การสูญเสียเรือนยอดไม้ไม่เท่ากับการทำลายป่า ยางพารา ยูคาลิปตัส และปาล์มน้ำมันถูกตัดแล้วปลูกใหม่ แผนที่สวนปลูกของ GFW แยกส่วนนั้นออก (สีอ่อน) จากการสูญเสียนอกสวนปลูก (สีเข้ม) แผนที่บันทึกการสูญเสีย ไม่บันทึกการงอกใหม่ ตัวเลขจึงเป็นค่ารวมขั้นต้น',
  box:'ข้อมูลรายปีมีระดับจังหวัดและประเทศ เลือกจังหวัดเพื่อดู'},
 en:{title:'Tree cover lost each year',natural:'Outside plantations',plantation:'Inside plantations (cut and replanted)',plantationShort:'Inside plantations',total:'2001–2025',recent:'Average 2021–2025, outside plantations',ofCover:'of tree cover a year',prior:'2016–2020',rank:'Rank provinces',csv:'Yearly CSV',primary:'In primary forest',protected:'In protected areas',emissions:'CO₂ from loss outside plantations',driver:'Main driver outside plantations',peak:'Peak year',
  note:'Tree cover loss is not deforestation. Rubber, eucalyptus and oil palm are cut and replanted; GFW’s plantation map separates that harvest (light) from loss outside plantations (dark). The map records loss, not regrowth, so these are gross figures.',
  box:'Year-by-year loss is by province and nationally. Pick a province to see it.'},
};

const sum=a=>a.reduce((s,x)=>s+x,0);

export const driverName=(k,lang)=>(DRIVERS[k]||[k,k])[lang==='th'?0:1];

export function lossFigures(series,years){
 const n=years.length,last5=series.natural_ha.slice(n-5),prior=sum(series.natural_ha.slice(n-10,n-5))/5,recent=sum(last5)/5;
 const drivers=Object.entries(series.drivers).map(([k,v])=>[k,sum(v)]).sort((a,b)=>b[1]-a[1]);
 const natural=sum(series.natural_ha),peak=series.natural_ha.indexOf(Math.max(...series.natural_ha));
 return {natural,plantation:sum(series.plantation_ha),recent,prior,rate:series.tree_cover_natural_ha?100*recent/series.tree_cover_natural_ha:null,primary:sum(series.primary_ha),protected:sum(series.protected_ha),
  emissionsLatest:series.natural_emissions[n-1],latestYear:years[n-1],peakYear:years[peak],peakHa:series.natural_ha[peak],
  topDriver:drivers[0]?[drivers[0][0],natural?drivers[0][1]/natural:0]:null};
}

export function lossChart(series,years){
 const W=300,base=82,gap=1,bw=(W-gap*(years.length-1))/years.length;
 const max=Math.max(...years.map((_,i)=>series.natural_ha[i]+series.plantation_ha[i]),1),h=v=>v/max*(base-6);
 const bars=years.map((y,i)=>{const x=(i*(bw+gap)).toFixed(2),n=h(series.natural_ha[i]),p=h(series.plantation_ha[i]);
  return `<rect class="loss-natural" x="${x}" y="${(base-n).toFixed(2)}" width="${bw.toFixed(2)}" height="${n.toFixed(2)}"/><rect class="loss-plantation" x="${x}" y="${(base-n-p).toFixed(2)}" width="${bw.toFixed(2)}" height="${p.toFixed(2)}"/>`;}).join('');
 // Year ticks live outside the SVG: it stretches to its column, and stretched SVG text distorts.
 return `<svg class="loss-chart" viewBox="0 0 ${W} ${base}" preserveAspectRatio="none" aria-hidden="true">${bars}<line x1="0" x2="${W}" y1="${base}" y2="${base}"/></svg><div class="loss-axis" aria-hidden="true"><span>${years[0]}</span><span>${years[Math.floor(years.length/2)]}</span><span>${years[years.length-1]}</span></div>`;
}

export function lossHTML({data,code,lang,fmt,esc}){
 const c=COPY[lang]||COPY.en;
 if(!data)return '';
 const series=code==='TH'?data.national:data.provinces[code];
 if(!series)return `<section class="calc-block loss-block"><h3>${esc(c.title)}</h3><p>${esc(c.box)}</p></section>`;
 const y=data.meta.years,f=lossFigures(series,y),ha=v=>`${fmt(v,0)} ${lang==='th'?'เฮกตาร์':'ha'}`;
 const drv=f.topDriver?`${driverName(f.topDriver[0],lang)} · ${fmt(100*f.topDriver[1],0)}%`:'—';
 const label=`${c.title}: ${c.natural} ${ha(f.natural)}, ${c.plantation} ${ha(f.plantation)}, ${y[0]}–${y[y.length-1]}`;
 return `<section class="calc-block loss-block" data-calculation="loss"><h3>${esc(c.title)}</h3>
<div class="calc-answer">${fmt(f.recent,0)} <small>${lang==='th'?'เฮกตาร์/ปี':'ha/yr'}</small></div><p>${esc(c.recent)}${f.rate==null?'':` · ${f.rate.toFixed(2)}% ${esc(c.ofCover)}`} · ${esc(c.prior)}: ${esc(ha(f.prior))}</p>
<figure class="loss-figure" role="img" aria-label="${esc(label)}">${lossChart(series,y)}<figcaption><span class="loss-key loss-key-natural"></span>${esc(c.natural)} <span class="loss-key loss-key-plantation"></span>${esc(c.plantation)}</figcaption></figure>
<dl class="loss-facts"><dt>${esc(c.natural)} · ${esc(c.total)}</dt><dd>${esc(ha(f.natural))}</dd><dt>${esc(c.primary)}</dt><dd>${esc(ha(f.primary))}</dd><dt>${esc(c.protected)}</dt><dd>${esc(ha(f.protected))}</dd><dt>${esc(c.plantationShort)} · ${esc(c.total)}</dt><dd>${esc(ha(f.plantation))}</dd><dt>${esc(c.peak)}</dt><dd>${f.peakYear} · ${esc(ha(f.peakHa))}</dd><dt>${esc(c.driver)}</dt><dd>${esc(drv)}</dd><dt>${esc(c.emissions)} · ${f.latestYear}</dt><dd>${fmt(f.emissionsLatest,0)} tCO₂e</dd></dl>
<p>${esc(c.note)}</p><p>${esc(data.meta.dataset)} ${esc(data.meta.version)} · ${esc(data.meta.filters)} · CC BY 4.0</p>
<div class="actions loss-actions"><button type="button" class="btn small" data-loss-rank>${esc(c.rank)}</button><a class="btn small" href="data/gfw/loss-years.csv" download>${esc(c.csv)}</a></div></section>`;
}
