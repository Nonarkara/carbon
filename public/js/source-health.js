// Observation age is not retrieval age, and loading a local snapshot is not an upstream check.
export function sourceHealthHTML({manifest,status,paths,resourceStatus,watch,registry,lang,esc}){
 const th=lang==='th',say=(en,thai)=>th?thai:en;
 const unknown=say('not recorded','ไม่ได้บันทึก');
 const retrieval=ds=>{const dates=Object.values(ds?.files||{}).map(f=>f?.retrieved?.slice(0,10)).filter(Boolean).sort();return dates.length?dates[0]===dates.at(-1)?dates[0]:`${dates[0]}–${dates.at(-1)}`:unknown;};
 const rows=Object.entries(manifest.datasets).map(([key,ds])=>`<li><b>${esc(ds.name)}</b> · ${esc(ds.year||ds.period||ds.version||unknown)} · ${say('retrieved','ดึงข้อมูล')} ${esc(retrieval(ds))}</li>`);
 const labels={watch:'GFW Forest Watch',loss:say('Annual tree-cover loss','เรือนยอดไม้ที่หายรายปี'),stockYears:say('Annual biomass / quality flags','ชีวมวลรายปี / ธงคุณภาพ'),nfi:say('National inventory cross-check','ตรวจเทียบกับบัญชีป่าไม้แห่งชาติ')};
 for(const [key,url] of Object.entries(paths)){
  const s=resourceStatus(url),state=status[key],label=state==='ready'?say('available','พร้อมใช้'):state==='loading'?say('loading','กำลังโหลด'):say('unavailable; not zero','ข้อมูลไม่พร้อม ไม่ใช่ศูนย์');
  const period=key==='watch'&&watch?`${watch.window.start}–${watch.dates.at(-1)} · ${say('retrieved','ดึงข้อมูล')} ${watch.retrievedAt||unknown}`:'';
  rows.push(`<li><b>${esc(labels[key])}</b> · ${esc(label)}${period?' · '+esc(period):''}${s.checkedAt?` · ${say('file checked','ตรวจไฟล์')} ${esc(s.checkedAt)}`:''}${state==='unavailable'?` <button type="button" class="btn small" data-retry-source="${key}">${say('Retry','ลองอีกครั้ง')}</button>`:''}</li>`);
 }
 rows.push(`<li><b>TGO T-VER</b> · ${registry?esc(registry.snapshot):`${say('snapshot unavailable','ชุดข้อมูลไม่พร้อม')} <button type="button" class="btn small" data-retry-registry>${say('Retry','ลองอีกครั้ง')}</button>`}</li>`);
 return `<details class="source-health"><summary>${say('Source dates and availability','วันที่และความพร้อมของแหล่งข้อมูล')}</summary><p class="hint">${say('Observation periods describe the evidence. Retrieval dates describe the downloaded source files. “File checked” is this browser’s load check, not proof of a newer upstream release. Updates are reviewed per publisher release; no automatic refresh or promised publisher cadence.','ช่วงสังเกตคือช่วงหลักฐาน วันที่ดึงข้อมูลคือวันที่ดาวน์โหลดต้นฉบับ “ตรวจไฟล์” คือการโหลดในเบราว์เซอร์นี้ ไม่ใช่การยืนยันว่าต้นทางไม่มีรุ่นใหม่ อัปเดตเมื่อทบทวนรุ่นของผู้เผยแพร่ ไม่มีการรีเฟรชอัตโนมัติหรือรับประกันรอบเผยแพร่')}</p><ul>${rows.join('')}</ul></details>`;
}
