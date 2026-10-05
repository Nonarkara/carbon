// Dated GFW evidence, deliberately separate from the carbon ledger and project inputs.
export function validWatch(data){
 const record=r=>r&&['nominal','high','highest'].every(k=>Number.isFinite(r.area_ha?.[k])&&r.area_ha[k]>=0)&&Array.isArray(r.daily_ha)&&r.daily_ha.length===30&&r.daily_ha.every(v=>Number.isFinite(v)&&v>=0);
 return data?.schemaVersion===1&&/^v\d{8}$/.test(data.version)&&data.mask==='is__tree_cover_2022=true'&&data.unit==='ha'&&Array.isArray(data.dates)&&data.dates.length===30&&data.dates.every(d=>/^\d{4}-\d{2}-\d{2}$/.test(d))&&data.window?.start===data.dates[0]&&data.window?.endExclusive>data.dates.at(-1)&&record(data.national)&&data.provinces&&Object.keys(data.provinces).length===77&&Object.entries(data.provinces).every(([k,r])=>/^TH\d{2}$/.test(k)&&record(r));
}
export function watchRecord(data,pcode){return pcode==='TH'?data.national:data.provinces[pcode]||null;}
export function priorityArea(record){return record.area_ha.high+record.area_ha.highest;}
export function renderForestWatch(data,pcode,{lang,fmt,esc,provinces}){
 const th=lang==='th',r=watchRecord(data,pcode);
 if(!r)return '';
 const say=(en,thText)=>th?thText:en,levels=['nominal','high','highest'];
 const names={nominal:say('Nominal','เบื้องต้น'),high:say('High','สูง'),highest:say('Highest','สูงสุด')};
 const max=Math.max(...r.daily_ha,1);
 const bars=r.daily_ha.map((v,i)=>`<i style="height:${Math.max(v?2:0,100*v/max)}%" title="${data.dates[i]}: ${fmt(v,2)} ha"></i>`).join('');
 const table=data.dates.map((d,i)=>`<tr><td>${d}</td><td>${fmt(r.daily_ha[i],2)}</td></tr>`).join('');
 const ranked=pcode==='TH'?provinces.map(p=>({...p,area:priorityArea(watchRecord(data,p.pcode))})).sort((a,b)=>b.area-a.area).slice(0,5):[];
 return `<section class="forest-watch" aria-labelledby="forestWatchTitle"><h3 id="forestWatchTitle">${say('Forest Watch · where to check next','เฝ้าดูป่า · ควรตรวจที่ไหนต่อ')}</h3>
 <p class="lmeta">GFW · ${data.version} · ${say('Dated snapshot','ข้อมูล ณ วันที่')} ${data.version.slice(1,5)}-${data.version.slice(5,7)}-${data.version.slice(7)}<br>${data.window.start} → ${data.dates.at(-1)} · ${say('30 days · tree-cover mask 2022','30 วัน · กรองพื้นที่มีเรือนยอดปี 2022')}</p>
 <div class="watch-answer"><b>${fmt(priorityArea(r),2)}</b><span>ha · ${say('high + highest confidence alerts','พื้นที่แจ้งเตือนความเชื่อมั่นสูง + สูงสุด')}</span></div>
 <dl class="watch-confidence">${levels.map(k=>`<div><dt>${names[k]}</dt><dd>${fmt(r.area_ha[k],2)} ha</dd></div>`).join('')}</dl>
 <figure><figcaption>${say('Recorded alert area each day · all confidence levels','พื้นที่แจ้งเตือนแต่ละวัน · รวมทุกระดับความเชื่อมั่น')} (ha)</figcaption><div class="watch-bars" role="img" aria-label="${say('Daily alert area; exact values in the data table below','พื้นที่แจ้งเตือนรายวัน เปิดตารางด้านล่างเพื่ออ่านค่าจริง')}">${bars}</div><details><summary>${say('Read the 30-day data table','อ่านตารางข้อมูล 30 วัน')}</summary><table><thead><tr><th>${say('Alert date','วันที่แจ้งเตือน')}</th><th>ha</th></tr></thead><tbody>${table}</tbody></table></details></figure>
 ${ranked.length?`<p><strong>${say('Five provinces to investigate first · high + highest area','5 จังหวัดที่ควรเริ่มตรวจ · พื้นที่ความเชื่อมั่นสูง + สูงสุด')}</strong></p><div class="watch-ranking">${ranked.map(p=>`<button type="button" data-watch-province="${p.pcode}"><span>${esc(th?p.name_th:p.name_en)}</span><b>${fmt(p.area,2)} ha</b></button>`).join('')}</div>`:''}
 <p class="hint">${say('Alerts guide field checks. They are not confirmed deforestation, carbon emissions or lost credits. A zero means no alert recorded in this query; it does not prove an undisturbed forest. Dates reflect detections and can lag the event.','ใช้แจ้งเตือนเพื่อวางแผนตรวจภาคสนาม ไม่ใช่หลักฐานยืนยันการตัดป่า ปริมาณคาร์บอนที่ปล่อย หรือเครดิตที่สูญเสีย ศูนย์หมายถึงไม่พบรายการในคำค้นนี้ ไม่ได้ยืนยันว่าป่าไม่มีการเปลี่ยนแปลง วันที่ตรวจพบอาจช้ากว่าเหตุการณ์')}</p>
 <p class="lmeta">${say('Latest recorded alert in this snapshot','รายการล่าสุดในชุดข้อมูลนี้')}: ${data.lastAlertDate} · UMD/GLAD + WUR · CC BY 4.0</p>
 <p class="watch-links"><a href="bible.html?lang=${lang}#forest-watch" target="_blank" rel="noopener">${say('How to read alerts + diagram','วิธีอ่านการแจ้งเตือน + แผนภาพ')}</a> · <a href="https://data.globalforestwatch.org/" target="_blank" rel="noopener">GFW Open Data</a> · <a href="data/gfw/watch.json" target="_blank" rel="noopener">${say('Data + provenance','ข้อมูล + ที่มา')}</a></p></section>`;
}
