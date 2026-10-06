// Newly authored teaching diagrams only: CC0 1.0. No dedication of upstream assets.
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const definitions={
 'assessment-brief':['Question → evidence → deliverable','คำถาม → หลักฐาน → งานส่งมอบ',['Purpose','Boundary','Evidence','Decision'],['วัตถุประสงค์','ขอบเขต','หลักฐาน','ตัดสินใจ']],
 'boundary-design':['An operation’s boundary determines its accounting','ขอบเขตกิจกรรมกำหนดวิธีลงบัญชี',['Value chain','Organization','Direct','Energy'],['ห่วงโซ่คุณค่า','องค์กร','ปล่อยตรง','พลังงาน']],
 'evidence-register':['A result can be traced back to its record','ผลคำนวณย้อนถึงบันทึกได้',['Document','Activity row','Factor version','Result'],['เอกสาร','แถวกิจกรรม','รุ่นตัวคูณ','ผลคำนวณ']],
 'factor-design':['Activity units cancel against the factor denominator','หน่วยกิจกรรมตัดกับตัวหารของตัวคูณ',['kWh','kgCO₂e / kWh','÷ 1,000','tCO₂e'],['kWh','kgCO₂e / kWh','÷ 1,000','tCO₂e']],
 'energy-design':['Two accounting views of the same purchased electricity','สองมุมบัญชีของไฟฟ้าที่ซื้อก้อนเดียว',['Purchased kWh','Location basis','Market basis','Do not add'],['kWh ที่ซื้อ','ตามพื้นที่','ตามสัญญา','ห้ามบวกกัน']],
 'value-chain-design':['Screen upstream and downstream as well as operations','คัดกรองต้นน้ำและปลายน้ำร่วมกับกิจกรรมองค์กร',['Upstream','Operations','Downstream','Screen all 15'],['ต้นน้ำ','องค์กร','ปลายน้ำ','คัดกรอง 15 หมวด']],
 'product-design':['Define the service, then trace its life cycle','กำหนดบริการแล้วตามวงจรชีวิต',['Materials','Manufacture','Distribution','Use','End of life'],['วัสดุ','ผลิต','กระจายสินค้า','ใช้งาน','สิ้นอายุ']],
 'sme-worked':['Hypothetical partial inventory · 41.42 tCO₂e','บัญชีบางส่วนสมมติ · 41.42 tCO₂e',['Scope 1','Scope 2','Selected Scope 3'],['Scope 1','Scope 2','Scope 3 บางหมวด']],
 'reduction-design':['Intensity can improve while total emissions rise','ความเข้มดีขึ้นได้ทั้งที่ยอดปล่อยเพิ่ม',['100 → 110 tCO₂e','1,000 → 1,200 units','0.100 → 0.0917','Absolute +10%'],['100 → 110 tCO₂e','1,000 → 1,200 หน่วย','0.100 → 0.0917','ยอดรวม +10%']],
 'interface-design':['A number carries its unit, period, source and quality','ตัวเลขต้องพกหน่วย เวลา แหล่ง และคุณภาพ',['Quantity + unit','Boundary + time','Source + version','Quality + limits'],['ปริมาณ + หน่วย','ขอบเขต + เวลา','แหล่ง + รุ่น','คุณภาพ + ข้อจำกัด']],
 'assurance-design':['Independent review challenges the evidence chain','การตรวจอิสระท้าทายเส้นทางหลักฐาน',['Claim','Total','Calculation','Original evidence'],['คำกล่าวอ้าง','ยอดรวม','คำนวณ','หลักฐานต้นฉบับ']],
 'assessment-handoff':['Evidence gates structure the first month','จุดตรวจหลักฐานจัดงานเดือนแรก',['Define','Collect','Reproduce','Handover'],['กำหนด','รวบรวม','ทำซ้ำ','ส่งมอบ']],
 'climate-impacts':['Mitigation and adaptation ask different questions','ลดเหตุและปรับตัวถามคนละคำถาม',['Emissions','Mitigation','Exposure','Adaptation'],['การปล่อย','ลดเหตุ','การเผชิญภัย','ปรับตัว']],
 'open-artifacts':['Reuse travels with rights, dates and provenance','ใช้ซ้ำพร้อมสิทธิ วันที่ และที่มา',['Individual rights','Download','Keep credit','State changes'],['สิทธิรายชิ้น','ดาวน์โหลด','เก็บเครดิต','ระบุการแก้']]
};
export const designDiagramIds=Object.keys(definitions);
export function designSvg(id,lang){
 const d=definitions[id];if(!d)return '';const th=lang==='th',title=d[th?1:0],labels=d[th?3:2];
 const text=(x,y,s,size=16,fill='#161616')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}">${escape(s)}</text>`;
 const box=(x,y,w,h,s,fill='#fff')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="#161616" stroke-width="2"/>${text(x+12,y+36,s,15,fill==='#1643c5'?'white':'#161616')}`;
 const arrow=(x,y,x2,y2)=>`<path d="M${x} ${y}L${x2} ${y2}" stroke="#161616" stroke-width="2" marker-end="url(#head-${id})"/>`;
 let body='';
 if(id==='sme-worked'){
  const values=[8.22,24,9.2];body=text(178,35,'tCO₂e',13);
  values.forEach((v,i)=>{const y=55+i*58;body+=text(10,y+23,labels[i],14)+`<rect x="180" y="${y}" width="${v*13}" height="32" fill="${i===1?'#1643c5':'#ffdf00'}" stroke="#161616"/>`+text(190+v*13,y+23,v.toFixed(2),15);});
  body+=text(10,244,th?'สมมติทั้งหมด · Scope 3 ไม่ครบ · ไม่ใช่ผลรับรอง':'All hypothetical · incomplete Scope 3 · not verified',13);
 }else if(id==='product-design'){
  labels.forEach((label,i)=>{const x=8+i*120;body+=box(x,75,104,90,'',i===0?'#ffdf00':i===4?'#1643c5':'#fff')+text(x+5,123,label,12,i===4?'white':'#161616');if(i<4)body+=arrow(x+106,120,x+118,120);});
  body+=text(12,228,th?'กำหนดหน่วยหน้าที่และขอบเขตก่อนเทียบ':'Define functional unit and boundary before comparing',14);
 }else if(id==='boundary-design'){
  body=box(10,18,580,220,labels[0],'#fff9d7')+box(120,70,360,145,labels[1])+box(140,130,145,64,labels[2],'#1643c5')+box(310,130,145,64,labels[3],'#ffdf00');
 }else if(id==='energy-design'){
  body=box(175,15,250,65,labels[0],'#ffdf00')+arrow(240,80,135,121)+arrow(360,80,465,121)+box(25,125,235,64,labels[1])+box(335,125,235,64,labels[2],'#1643c5')+text(220,235,labels[3],18);
 }else if(id==='climate-impacts'){
  body=box(20,30,230,65,labels[0],'#ffdf00')+arrow(250,63,325,63)+box(330,30,250,65,labels[1],'#1643c5')+box(20,145,230,65,labels[2])+arrow(250,178,325,178)+box(330,145,250,65,labels[3]);
 }else if(id==='reduction-design'){
  body=box(15,35,275,75,labels[0],'#ffdf00')+box(310,35,275,75,labels[1])+text(25,158,th?'tCO₂e / หน่วยผลผลิต':'tCO₂e / output unit',17)+text(25,194,labels[2],24)+box(350,150,230,75,labels[3],'#1643c5');
 }else{
  [0,1,3,2].forEach((step,i)=>{const x=15+(i%2)*310,y=35+Math.floor(i/2)*120;body+=box(x,y,260,70,labels[step],step===0?'#ffdf00':step===3?'#1643c5':'#fff');});
  body+=arrow(277,70,320,70)+arrow(455,107,455,150)+arrow(320,190,280,190);
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 270" role="img" aria-label="${escape(title)}"><title>${escape(title)}</title><desc>${escape(title+'; '+labels.join(' → '))}</desc><metadata>New original diagram: CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/</metadata><defs><marker id="head-${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#161616"/></marker></defs><rect width="600" height="270" fill="white"/>${body}</svg>`;
}
export function designIllustration(id,lang){
 const svg=designSvg(id,lang);if(!svg)return '';const d=definitions[id],th=lang==='th',title=d[th?1:0],labels=d[th?3:2];
 let compact;
 if(id==='sme-worked')compact=`<div class="mobile-bars">${[8.22,24,9.2].map((v,i)=>`<div><b>${escape(labels[i])} · ${v.toFixed(2)} tCO₂e</b><span style="width:${v/24*100}%" class="bar-${i}"></span></div>`).join('')}<small>${th?'สมมติ · Scope 3 ไม่ครบ':'Hypothetical · incomplete Scope 3'}</small></div>`;
 else if(id==='boundary-design')compact=`<div class="mobile-boundary"><b>${escape(labels[0])}</b><div><b>${escape(labels[1])}</b><p>${escape(labels[2])} / ${escape(labels[3])}</p></div></div>`;
 else if(id==='energy-design')compact=`<div class="mobile-branches"><b>${escape(labels[0])}</b><div><span>${escape(labels[1])}</span><span>${escape(labels[2])}</span></div><b>${escape(labels[3])}</b></div>`;
 else if(id==='climate-impacts'||id==='reduction-design')compact=`<div class="mobile-pairs">${labels.map((label,i)=>`<span>${escape(label)}${id==='climate-impacts'&&i%2===0?' →':''}</span>`).join('')}</div>`;
 else compact=`<ol>${labels.map(label=>`<li>${escape(label)}</li>`).join('')}</ol>`;
 return `<figure class="illustration design-illustration">${svg}<div class="mobile-diagram" role="img" aria-label="${escape(title)}">${compact}</div><figcaption>${escape(title)}<a href="images/bible/diagrams/${id}-${lang}.svg" download>${th?'ดาวน์โหลด SVG':'Download SVG'} · CC0</a></figcaption></figure>`;
}
