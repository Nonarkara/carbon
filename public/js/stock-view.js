// Aboveground biomass each year and ESA's own reading of the change, cooked by scripts/ingest/build_stock_years.py.
// Pure rendering: every number on screen is a value or a share of data/cci/stock-years.json.
const COPY={
 th:{title:'คาร์บอนสะสมแต่ละปี',latest:'พื้นดินทั้งหมด รวมราก ปี',change:'ESA อ่านการเปลี่ยนแปลงอย่างไร',loss:'ลดลงอย่างเชื่อถือได้',potential_loss:'อาจลดลง',no_reliable_change:'ไม่มีการเปลี่ยนแปลงที่เชื่อถือได้',potential_gain:'อาจเพิ่มขึ้น',gain:'เพิ่มขึ้นอย่างเชื่อถือได้',ofLand:'% ของพื้นที่ที่มีชีวมวล',range:'ช่วง',table:'ค่ารายปี',
  note:'ESA ระบุว่าค่าแต่ละปีแกว่งได้เพราะข้อมูลเรดาร์ต่างชุดกัน ความต่างระหว่างปีจึงไม่ใช่แนวโน้ม การอ่านการเปลี่ยนแปลงต้องใช้ธงคุณภาพ ซึ่งเป็นผลิตภัณฑ์เพื่อการวิจัย'},
 en:{title:'Carbon stock each year',latest:'All land, roots included,',change:'How ESA reads the change',loss:'Reliably fell',potential_loss:'Possibly fell',no_reliable_change:'No reliable change',potential_gain:'Possibly rose',gain:'Reliably rose',ofLand:'% of land holding biomass',range:'range',table:'Each year',
  note:'ESA says yearly values fluctuate because the radar data differ, so a difference between years is not a trend. Change is read through its quality flags, which are research products.'},
};
const ORDER=['loss','potential_loss','no_reliable_change','potential_gain','gain'];
const FLAG_COLOUR={loss:'#9c4a1a',potential_loss:'#d39a6a',no_reliable_change:'#d9d6cc',potential_gain:'#5e9480',gain:'#1f5f4a'};

export function stockFigures(series){
 const land=ORDER.reduce((s,k)=>s+series.flag_ha[k],0);
 return {land,shares:Object.fromEntries(ORDER.map(k=>[k,land?100*series.flag_ha[k]/land:0]))};
}

export function stockHTML({data,code,lang,fmt,esc,toCo2e}){
 const series=data&&(code==='TH'?data.national:data.provinces[code]);
 if(!series)return '';
 const c=COPY[lang]||COPY.en,y=data.meta.years,{from,to}=data.meta.change,{shares}=stockFigures(series);
 const co2=series.agb_mg.map(v=>v*toCo2e),latest=co2.at(-1);
 const oneDecimal=new Intl.NumberFormat('en-GB',{minimumFractionDigits:1,maximumFractionDigits:1});
 const big=v=>Math.abs(v)>=1e6?`${oneDecimal.format(v/1e6)} M`:fmt(v,0);
 const flagLabel=ORDER.map(k=>`${c[k]} ${shares[k].toFixed(1)}%`).join(', ');
 return `<section class="calc-block stock-block" data-calculation="stock-years"><h3>${esc(c.title)}</h3>
<div class="calc-answer">${big(latest)} <small>tCO₂e</small></div><p>${esc(c.latest)} ${y.at(-1)} · ${y[0]}–${y.at(-1)} ${esc(c.range)} ${big(Math.min(...co2))}–${big(Math.max(...co2))}</p>
<details><summary>${esc(c.table)}</summary><dl class="loss-facts">${y.map((yr,i)=>`<dt>${yr}</dt><dd>${big(co2[i])}</dd>`).join('')}</dl></details>
<p>${esc(c.note)}</p>
<h4>${esc(c.change)} · ${from}→${to}</h4>
<div class="stock-strip" role="img" aria-label="${esc(flagLabel)}">${ORDER.map(k=>`<i style="flex:${shares[k].toFixed(2)} 0 0;background:${FLAG_COLOUR[k]}"></i>`).join('')}</div>
<dl class="loss-facts">${ORDER.map(k=>`<dt><i class="loss-key" style="background:${FLAG_COLOUR[k]}"></i>${esc(c[k])}</dt><dd>${shares[k].toFixed(1)}%</dd>`).join('')}</dl>
<p>${esc(c.ofLand)} · ${esc(data.meta.dataset)} ${esc(data.meta.version)} · ${esc(data.meta.resolution)} · CC BY 4.0</p></section>`;
}
