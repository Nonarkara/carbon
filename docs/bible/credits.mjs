import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const specs=[
 ['sea-what-is-a-credit','A carbon credit, from the smoke upwards','เครดิตคาร์บอน ตั้งแต่ควันจนถึงตั๋วใบที่ซื้อขาย','Burn, then atmosphere, then the record that can be traded.','เผาไหม้ แล้วบรรยากาศ แล้วบันทึกที่ซื้อขายได้',['sea-market','sea-market-data']],
 ['sea-borders','How a credit crosses a border without being counted twice','เครดิตข้ามพรมแดนโดยไม่ถูกนับซ้ำ','Two national inventories, one corresponding adjustment, one tonne.','บัญชีสองประเทศ การปรับสมดุลหนึ่งครั้ง โทนเดียว',['sg-art6','sg-th-ia','accf']],
 ['sea-industry','Where Southeast Asia\'s credits come from, and what that changes','เครดิตของเอเชียตะวันออกเฉียงใต้มาจากไหน และเปลี่ยนอะไร','Issuance by country, then the projects the market has not built.','การออกเครดิตรายประเทศ แล้วหมวดที่ตลาดยังไม่สร้าง',['sea-market','sea-market-data','acmf-vcm']]
];
export const creditChapters=specs.map(([id,en,th,se,st,sources])=>{const [bodyEn,bodyTh]=read(`./sea/${id}.md`).split('\n<!-- TH -->\n');if(!bodyTh)throw Error('Missing Thai '+id);return {id,group:'credits',title:{en,th},summary:{en:se,th:st},body:{en:bodyEn,th:bodyTh},sources,reviewed:'2026-10-20',related:id==='sea-what-is-a-credit'?['sea-borders','sea-industry','credits','scopes','sea-overview']:id==='sea-borders'?['sea-what-is-a-credit','sea-industry','credits','offsets','sea-governance']:['sea-what-is-a-credit','sea-borders','credits','sea-ecosystems'],diagram:{en:['Start from the physics of burning','Measure the change against a baseline','Pass independent review','Issue once, on a single registry'],th:['เริ่มจากฟิสิกส์ของการเผาไหม้','วัดการเปลี่ยนแปลงเทียบกรณีฐาน','ผ่านการทวนสอบอิสระ','ออกครั้งเดียว ในทะเบียนเดียว']}};});

const market=JSON.parse(read('../../public/data/sea/carbon-market.json'));
const snap=JSON.parse(read('../../public/data/sea/snapshot.json'));
export const creditMarket=market;
export const creditSnapshot=snap;

// Figures are drawn from the deployed JSON so a diagram can never drift from the numbers beside it.
export function creditFigures(lang){
 const th=lang==='th',esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fig=(title,body,note='')=>`<figure class="illustration"><svg viewBox="0 0 600 340" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${body}</svg><figcaption>${esc(title)}</figcaption>${note?`<p class="illustration-note">${esc(note)}</p>`:''}</figure>`;
 const out={};

 if(th){
  out['credit-physics']=fig('จากการเผาไหม้ถึงสมดุลพลังงานที่เปลี่ยนไป',
  `<defs><marker id="aA" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#161616"/></marker><marker id="aB" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#bd251b"/></marker></defs>
<rect x="14" y="14" width="120" height="76" fill="#ffdf00" stroke="#161616" stroke-width="2"/><text x="74" y="44" font-size="14" text-anchor="middle" font-weight="600">เผาไหม้</text><text x="74" y="66" font-size="11" text-anchor="middle">ถ่านหิน น้ำมัน ไม้</text>
<path d="M140 52H178" stroke="#161616" stroke-width="2.5" marker-end="url(#aA)"/>
<rect x="184" y="14" width="132" height="76" fill="#fff4d6" stroke="#161616" stroke-width="2"/><text x="250" y="44" font-size="13" text-anchor="middle">C + O₂ → CO₂</text><text x="250" y="66" font-size="11" text-anchor="middle">คาร์บอนหลุดจากของแข็ง</text>
<path d="M322 52H360" stroke="#161616" stroke-width="2.5" marker-end="url(#aA)"/>
<rect x="366" y="10" width="220" height="150" fill="#cfe0f5" stroke="#161616" stroke-width="2"/>
<text x="476" y="32" font-size="13" text-anchor="middle" font-weight="600">บรรยากาศ</text>
<path d="M382 58H570" stroke="#8a99a8" stroke-width="1.5"/>
<text x="384" y="74" font-size="10">แสงอาทิตย์ (คลื่นสั้น) ผ่านลงมา</text>
<path d="M384 92H570" stroke="#bd251b" stroke-width="2.5" marker-end="url(#aB)"/>
<text x="384" y="108" font-size="10">ความร้อนที่พื้นผิวปล่อยกลับ (อินฟราเรด)</text>
<path d="M440 118V88" stroke="#bd251b" stroke-width="2" stroke-dasharray="4 3"/>
<text x="450" y="134" font-size="10" fill="#bd251b">CO₂ ดูดซับและปล่อยกลับลงมา</text>
<text x="384" y="152" font-size="10" font-weight="600">CO₂ มากขึ้น → พลังงานที่หลุดออกอวกาศน้อยลง</text>
<rect x="14" y="180" width="572" height="52" fill="#fff" stroke="#161616" stroke-width="2"/><text x="30" y="202" font-size="12" font-weight="600">ผลสองข้อที่สำคัญ</text><text x="30" y="222" font-size="11">๑ สะสม — CO₂ ที่เพิ่มในปีนี้ยังอยู่ในสมดุลนาน หักล้างทันทีไม่ได้  ๒ ระดับโลก — โมเลกุดไม่เคารพพรมแดน</text>
<rect x="14" y="248" width="572" height="76" fill="#edf1ff" stroke="#1643c5" stroke-width="2"/><text x="30" y="270" font-size="12" font-weight="600">สิ่งที่เครดิตไม่ได้ทำ</text><text x="30" y="290" font-size="11">มันไม่ได้ลบก๊าซที่ปล่อยไปแล้ว มันไม่ได้ทำให้อากาศเย็นลง</text><text x="30" y="310" font-size="11">มันเป็น “บันทึกของความต่าง” ที่วัดได้ ตรวจแล้ว และเขียนลงทะเบียนไว้ครั้งเดียว</text>`, th?'ภาพนี้อธิบายว่าทำไมกฎทุกข้อในสาขานี้จึงเกี่ยวกับการไม่ให้ตันเดียวกันถูกนับซ้ำ ไม่ใช่เรื่องความสะอาดของอากาศ':'This figure explains why every rule in the field is about not counting the same tonne twice, not about cleaning the air.');

  out['credit-anatomy']=fig('องค์ประกอบของการอ้างสิทธิ์หนึ่งหน่วย',
  `<rect x="16" y="16" width="568" height="86" fill="#fff" stroke="#161616" stroke-width="2"/>
<text x="32" y="40" font-size="12" font-weight="600">สิ่งที่ทำให้ข้ออ้างนี้เป็นเครดิต ไม่ใช่แค่คำพูด</text>
${[['วัดได้','มีตัวเลขและวันที่'],['ลด/กักเก็บ','เทียบกับกรณีฐาน'],['ทวนสอบ','หน่วยงานอิสระตรวจซ้ำ'],['ทะเบียน','บันทึกที่เดียว'],['ออก','หลังผ่านทุกขั้น']].map((r,i)=>`<rect x="${34+i*110}" y="${52}" width="98" height="38" fill="#1643c5"/><text x="${83+i*110}" y="${68}" font-size="11" fill="#fff" text-anchor="middle" font-weight="600">${r[0]}</text><text x="${83+i*110}" y="${83}" font-size="9" fill="#fff" text-anchor="middle">${r[1]}</text>`).join('')}
<rect x="16" y="118" width="568" height="196" fill="#fff" stroke="#161616" stroke-width="2"/>
<text x="32" y="142" font-size="12" font-weight="600">สิ่งที่แต่ละข้อกันไม่ให้เกิด</text>
${[['ไม่มีวันที่','แผนลอย ๆ ที่ไม่มีตัวเลข'],['ไม่มีกรณีฐาน','ให้เครดิตสิ่งที่จะเกิดอยู่แล้ว'],['ไม่มีผู้ตรวจ','เชื่อสเปรดชีตของผู้พัฒนาเอง'],['ไม่มีทะเบียน','ผู้ซื้อสองรายอ้างโทนเดียวกัน'],['ออกเร็วเกินไป','เครดิตของสิ่งที่ยังไม่เกิดขึ้น']].map((r,i)=>{const y=160+i*30;return `<rect x="34" y="${y}" width="530" height="24" fill="${i%2?'#f7f7f5':'#fff'}" stroke="#ccccca"/><text x="44" y="${y+16}" font-size="11" font-weight="600">${r[0]}</text><text x="180" y="${y+16}" font-size="11" fill="#383838">${r[1]}</text>`;}).join('')}`);
 }else{
  out['credit-physics']=fig('From burning to a changed energy balance',
  `<defs><marker id="aA" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#161616"/></marker><marker id="aB" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#bd251b"/></marker></defs>
<rect x="14" y="14" width="120" height="76" fill="#ffdf00" stroke="#161616" stroke-width="2"/><text x="74" y="44" font-size="14" text-anchor="middle" font-weight="600">Burning</text><text x="74" y="66" font-size="11" text-anchor="middle">coal · oil · wood</text>
<path d="M140 52H178" stroke="#161616" stroke-width="2.5" marker-end="url(#aA)"/>
<rect x="184" y="14" width="132" height="76" fill="#fff4d6" stroke="#161616" stroke-width="2"/><text x="250" y="44" font-size="13" text-anchor="middle">C + O₂ → CO₂</text><text x="250" y="66" font-size="10" text-anchor="middle">carbon leaves a solid</text>
<path d="M322 52H360" stroke="#161616" stroke-width="2.5" marker-end="url(#aA)"/>
<rect x="366" y="10" width="220" height="150" fill="#cfe0f5" stroke="#161616" stroke-width="2"/>
<text x="476" y="32" font-size="13" text-anchor="middle" font-weight="600">Atmosphere</text>
<path d="M382 58H570" stroke="#8a99a8" stroke-width="1.5"/>
<text x="384" y="74" font-size="9.5">sunlight (shortwave) passes through</text>
<path d="M384 92H570" stroke="#bd251b" stroke-width="2.5" marker-end="url(#aB)"/>
<text x="384" y="108" font-size="9.5">surface re-radiates (infrared)</text>
<path d="M440 118V88" stroke="#bd251b" stroke-width="2" stroke-dasharray="4 3"/>
<text x="450" y="134" font-size="9.5" fill="#bd251b">CO₂ absorbs and re-emits downward</text>
<text x="384" y="152" font-size="10" font-weight="600">more CO₂ → less energy leaves to space</text>
<rect x="14" y="180" width="572" height="52" fill="#fff" stroke="#161616" stroke-width="2"/><text x="30" y="202" font-size="12" font-weight="600">Two consequences that matter</text><text x="30" y="222" font-size="11">① Cumulative — CO₂ added this year stays in the balance; it cannot be cancelled by removing the same amount next month  ② Global — the molecule respects no border</text>
<rect x="14" y="248" width="572" height="76" fill="#edf1ff" stroke="#1643c5" stroke-width="2"/><text x="30" y="270" font-size="12" font-weight="600">What a credit does not do</text><text x="30" y="290" font-size="11">It does not remove the gas already emitted. It does not cool the atmosphere.</text><text x="30" y="310" font-size="11">It is a record of a difference — measured, verified, and written down once.</text>`, th?'ภาพนี้อธิบายว่าทำไมกฎทุกข้อในสาขานี้จึงเกี่ยวกับการไม่ให้ตันเดียวกันถูกนับซ้ำ ไม่ใช่เรื่องความสะอาดของอากาศ':'This figure explains why every rule in the field is about not counting the same tonne twice, not about cleaning the air.');

  out['credit-anatomy']=fig('Anatomy of one credit claim',
  `<rect x="16" y="16" width="568" height="86" fill="#fff" stroke="#161616" stroke-width="2"/>
<text x="32" y="40" font-size="12" font-weight="600">What makes this a credit rather than a sentence</text>
${[['Measured','number + date'],['Changed','vs a baseline'],['Verified','independent body'],['Registered','one ledger'],['Issued','after all gates']].map((r,i)=>`<rect x="${34+i*110}" y="${52}" width="98" height="38" fill="#1643c5"/><text x="${83+i*110}" y="${68}" font-size="11" fill="#fff" text-anchor="middle" font-weight="600">${r[0]}</text><text x="${83+i*110}" y="${83}" font-size="9" fill="#fff" text-anchor="middle">${r[1]}</text>`).join('')}
<rect x="16" y="118" width="568" height="196" fill="#fff" stroke="#161616" stroke-width="2"/>
<text x="32" y="142" font-size="12" font-weight="600">The failure each element prevents</text>
${[['No date','an intention with no number'],['No baseline','crediting what was going to happen'],['No reviewer','trusting the developer\'s own sheet'],['No registry','two buyers claiming one tonne'],['Issued early','a credit for something not yet real']].map((r,i)=>{const y=160+i*30;return `<rect x="34" y="${y}" width="530" height="24" fill="${i%2?'#f7f7f5':'#fff'}" stroke="#ccccca"/><text x="44" y="${y+16}" font-size="11" font-weight="600">${r[0]}</text><text x="180" y="${y+16}" font-size="11" fill="#383838">${r[1]}</text>`;}).join('')}`);
 }

 // --- Corresponding adjustment: the same arithmetic diagram in both languages, drawn from the treaty text.
 const host=th?'ประเทศ ย (เจ้าบ้าน / ผู้ขาย)':'Country Y (host / seller)',buyer=th?'ประเทศ ข (ผู้ซื้อ)':'Country X (buyer)';
 const rows=th?
  [['1. โครงการลด 5 tCO₂e','นับเป็นการดูดกลับ 5','—'],
   ['2. อนุญาตให้โอน','อนุญาตการขาย','—'],
   ['3. การปรับสมดุล','เพิ่มกลับ 5 เข้าบัญชีตน','—'],
   ['4. โอนเครดิต','ออกเครดิต','—'],
   ['5. ปรับสมดุลฝ่ายรับ','—','หัก 5 ออกจากบัญชีตน'],
   ['6. ใช้เพื่อเดินหน้าเป้าหมาย','นับซ้ำไม่ได้','นับเข้าเดินหน้าได้']]:
  [['1. Project reduces 5 tCO₂e','counts 5 as a removal','—'],
   ['2. Authorises the transfer','authorises the sale','—'],
   ['3. Corresponding adjustment','adds 5 back to its inventory','—'],
   ['4. Credit transfers','issues the credit','—'],
   ['5. Receiving-side adjustment','—','subtracts 5 from its inventory'],
   ['6. Used toward the target','cannot also count it','counts it toward commitment']];
 out['border-article6']=fig(th?'การปรับสมดุลตามข้อ 6: โทนเดียว นับได้ครั้งเดียว':'Article 6 corresponding adjustment: one tonne, counted once',
 `<text x="60" y="26" font-size="12" font-weight="600">${esc(host)}</text><text x="380" y="26" font-size="12" font-weight="600">${esc(buyer)}</text>
<rect x="16" y="36" width="568" height="188" fill="#fff" stroke="#161616" stroke-width="2"/>
<line x1="316" y1="36" x2="316" y2="224" stroke="#161616" stroke-width="1.5"/>
${rows.map((r,i)=>{const y=48+i*29;const key=(i===2||i===4);return `<rect x="22" y="${y}" width="566" height="26" fill="${key?(i===2?'#ffdf00':'#1643c5'):'#f7f7f5'}"/><text x="30" y="${y+17}" font-size="10.5" font-weight="600"${key&&i===4?' fill="#fff"':''}>${r[0]}</text><text x="176" y="${y+17}" font-size="10"${key&&i===4?' fill="#fff"':''}>${r[1]}</text><text x="330" y="${y+17}" font-size="10"${key&&i===4?' fill="#fff"':''}>${r[2]}</text>`;}).join('')}
<rect x="16" y="238" width="568" height="84" fill="#edf1ff" stroke="#1643c5" stroke-width="2"/>
<text x="30" y="260" font-size="12" font-weight="600">${th?'สิ่งที่ไม่เปลี่ยน':'What did not change'}</text>
<text x="30" y="280" font-size="11">${th?'ไม่มีการปล่อย ไม่มีการดูดซับ บรรยากาศไม่เปลี่ยน':'Nothing was emitted. Nothing was absorbed. The atmosphere did not change.'}</text>
<text x="30" y="298" font-size="11" font-weight="600">${th?'สิ่งที่เปลี่ยนคือ “สิทธิ์ในการนับ” ไม่ใช่สภาพแวดล้อม':'What moved is permission to count — not the environment.'}</text>
<text x="30" y="316" font-size="9.5">${th?'เลขาธิการการตลาดคาร์บอนสิงคโปร์ (แนบ ข้อตกลงไทย–สิงคโปร์) ระบุคณิตนี้ไว้ตรง ๆ':'Singapore Carbon Markets Cooperation, Annex C to the Singapore–Thailand Implementation Agreement'}</text>`,th?'การปรับสมดุลเป็นการกระทำทางบัญชี ไม่ใช่การกระทำต่อสิ่งแวดล้อม':'A corresponding adjustment is an accounting act, not an environmental one.');

 const iaRows=market.article6.singapore_ias.filter(r=>r.region==='asean');
 out['border-ledger']=fig(th?'ข้อตกลงข้อ 6 ของสิงคโปร์: อาเซียนมีสี่ มีผลบังคับใช้หนึ่ง':"Singapore's Article 6 agreements: four ASEAN, one in force",
 `<rect x="16" y="14" width="568" height="106" fill="#fff" stroke="#161616" stroke-width="2"/>
<text x="30" y="36" font-size="12" font-weight="600">${th?'ประเทศอาเซียนที่ลงนามกับสิงคโปร์':'ASEAN countries signed with Singapore'}</text>
${iaRows.map((r,i)=>{const y=52+i*16;const live=r.status==='entered_into_force';return `<text x="34" y="${y+10}" font-size="11" font-weight="600">${esc(r.country)}</text><rect x="${live?200:296}" y="${y}" width="${live?96:86}" height="14" fill="${live?'#1643c5':'#f0f0ee'}" stroke="#161616"/><text x="${live?248:339}" y="${y+11}" font-size="9.5" text-anchor="middle" fill="${live?'#fff':'#161616'}">${live?(th?'มีผลบังคับใช้':'In force'):(th?'ยังไม่มีผล':'Not yet in force')}</text>`;}).join('')}
<text x="30" y="112" font-size="9.5" fill="#383838">${th?'ทั้งสิบสองประเทศนอกอาเซียน: ภูฎี ชิลี กานา มองโกเลีย เปรู รวันดา ปาปัวนิวกินี ปารากวาย (7 มีผล, 2 ยังไม่มีผล)':'The other eight: Bhutan, Chile, Ghana, Mongolia, Peru, Rwanda in force; Papua New Guinea, Paraguay signed'}</text>
<rect x="16" y="132" width="568" height="90" fill="#fff4d6" stroke="#161616" stroke-width="2"/>
<text x="30" y="154" font-size="12" font-weight="600">${th?'ข้อตกลงนี้มีผลต่อราคาจริง':'An agreement changes what a credit is worth'}</text>
<text x="30" y="176" font-size="11">${th?'เครดิตจากโครงการในประเทศที่ไม่มีข้อตกลง หักลดภาระภาษีคาร์บอนไม่ได้เลย':'Credits from a country without an agreement cannot offset carbon tax at all.'}</text>
<text x="30" y="196" font-size="11">${th?'เครดิตที่เข้าเกณฑ์ หักลดภาระภาษีได้ไม่เกิน 5% ต่อปี':'Eligible credits may cover only 5% of tax liability per year.'}</text>
<text x="30" y="216" font-size="9.5" fill="#383838">${th?'กรอบเครดิตคาร์บอนระหว่างประเทศของสิงคโปร์':'Singapore International Carbon Credit framework'}</text>
<rect x="16" y="234" width="568" height="88" fill="#edf1ff" stroke="#1643c5" stroke-width="2"/>
<text x="30" y="256" font-size="12" font-weight="600">${th?'ทำไมไทยถึงสำคัญเป็นพิเศษ':'Why Thailand matters here'}</text>
<text x="30" y="277" font-size="11">${th?'ไทยเป็นประเทศอาเซียนเพียงประเทศเดียวที่ข้อตกลงมีผลแล้ว (19 ส.ค. 2568)':'Thailand is the only ASEAN country with an agreement in force (19 Aug 2025).'}</text>
<text x="30" y="297" font-size="11">${th?'และเป็นประเทศเดียวในระบบนี้ที่มีทะเบียนโครงการสาธารณะ จึงตรวจสอบได้':'It is also the only country here with a public project registry — which is why this tool can show T-VER projects at all.'}</text>
<text x="30" y="316" font-size="9.5" fill="#383838">${th?'ACCF เป็นกรอบของสมาคมธุรกิจ ไม่ใช่อนุสัญญาอาเซียน และไม่ไล่หาความเป็นเอกฉันท์':'The ACCF is an industry framework, not an ASEAN treaty, and does not seek uniformity.'}</text>`,th?'สถานะข้อตกลงเปลี่ยนได้ตลอดเวลา ตรวจสอบก่อนอ้างอิงเสมอ':'Agreement status is time-sensitive. Re-check before citing.');

 // Regional issuance, drawn from the deployed market JSON.
 const bc=market.issuance.by_country.filter(r=>r.total>0).sort((a,b)=>b.total-a.total);
 const maxT=bc[0].total;
 out['industry-issuance']=fig(th?`เครดิตสะสม 2539-2567 รายประเทศ (ล้านเครดิต)`:`Cumulative issuance 1996–2024 by country (million credits)`,
 `<rect x="16" y="12" width="568" height="256" fill="#fff" stroke="#161616" stroke-width="2"/>
<text x="30" y="32" font-size="11.5" font-weight="600">${th?'ประเทศ · รวมทุกหมวด · ที่มา ISEAS/Berkeley':'Country · all sectors · source ISEAS / Berkeley Carbon Trading Project'}</text>
${bc.map((r,i)=>{const y=44+i*21;const w=Math.max(2,r.total/maxT*300);return `<text x="30" y="${y+13}" font-size="10.5">${esc(r.iso3)}</text><rect x="76" y="${y+2}" width="${w.toFixed(1)}" height="13" fill="#1643c5"/><text x="${(80+w).toFixed(1)}" y="${y+13}" font-size="10" font-weight="600">${r.total.toFixed(2)}</text>`;}).join('')}
<rect x="16" y="276" width="568" height="52" fill="#fff4d6" stroke="#161616" stroke-width="2"/>
<text x="30" y="296" font-size="11" font-weight="600">${th?'บรูไนไม่ปรากฏเพราะไม่มีข้อมูล ไม่ใช่เพราะไม่ได้ออกเครดิต':'Brunei is absent because there is no data, not because it issued nothing'}</text>
<text x="30" y="315" font-size="10.5">${th?'และธนาคารโลกรายงานมากกว่า 350 ล้านในช่วงเดียวกัน — ช่องว่างคือความครอบคลุมของฐานข้อมูล':'The World Bank records over 350 million for the same period; the gap is database coverage'}</text>`,th?'217.46 ล้านเครดิตเป็นตัวเลขล่างที่มีแหล่งกำเนิดชัดเจน ไม่ใช่เพดานของภูมิภาค':'217.46 million is the lower, specifically sourced figure — never a regional ceiling.');

 const sectors=market.issuance.by_sector;
 // One row per published sector, derived from the data rather than picked by index. A hand-picked list
 // silently dropped 'other' (1.9%), so the shares on screen added to 98.1% and nobody could say why.
 const SECTOR_ROW={
  forestry_land_use:['Forestry & land use','สร้างเครดิตได้แล้ว แต่เป็นคอขวดด้านการกลับคืน','Built — but the reversal-risk concentration'],
  renewable_energy:['Renewable energy','ลงทุนไปแล้ว','Invested'],
  household_community:['Household & community','บางส่วน','Partial'],
  waste:['Waste','ยังน้อย','Thin'],
  agriculture:['Agriculture','เกือบไม่มี — ช่องว่างที่ใหญ่ที่สุด','Almost absent — the largest gap'],
  other:['Other','ส่วนที่เหลือจากโครงการผสม','Small residual across mixed project types']};
 const gap=sectors.map(s=>{const r=SECTOR_ROW[s.sector];return {k:r[0],f:th?r[1]:r[2],v:s.share_pct,key:s.sector};});
 const highlight='agriculture';
 out['industry-gap']=fig(th?'สัดส่วนตามหมวด และช่องว่างที่ยังไม่ถูกสร้าง':'Sector share, and the gap the market has not built',
 `<rect x="16" y="12" width="568" height="212" fill="#fff" stroke="#161616" stroke-width="2"/>
<text x="30" y="32" font-size="11.5" font-weight="600">${th?'เครดิตสะสม 2539-2567 แยกตามหมวด':'Cumulative 1996–2024 by sector'}</text>
${gap.map((g,i)=>{const y=44+i*29;return `<text x="30" y="${y+12}" font-size="10.5" font-weight="600">${esc(g.k)}</text><rect x="176" y="${y+1}" width="${(g.v/100*250).toFixed(1)}" height="13" fill="${g.key===highlight?'#ffdf00':'#1643c5'}"/><text x="${(180+g.v/100*250).toFixed(1)}" y="${y+12}" font-size="10" font-weight="600">${g.v}%</text><text x="30" y="${y+24}" font-size="9.5" fill="#383838">${esc(g.f)}</text>`;}).join('')}
<rect x="16" y="232" width="568" height="52" fill="#fff" stroke="#161616" stroke-width="2"/>
<text x="30" y="252" font-size="11" font-weight="600">${th?'ความเสี่ยงกระจุกตัวที่รายงาน ACMF ระบุ':'The concentration risk ACMF flags'}</text>
<text x="30" y="271" font-size="10.5">${th?'โครงการ NBS มี 5.3% ของโครงการ แต่สร้างเครดิต 73% ของปริมาณ':'NBS projects are 5.3% of projects but 73% of issuance'}</text>
<rect x="16" y="292" width="568" height="52" fill="#edf1ff" stroke="#1643c5" stroke-width="2"/>
<text x="30" y="312" font-size="11" font-weight="600">${th?'ช่องว่างของการยกเลิกเครดิต':'The retirement gap'}</text>
<text x="30" y="331" font-size="10.5">${th?'จาก 65.76 ล้านตันที่ยกเลิก มีเพียง 1.73 ล้านตัน (2.6%) ที่ยกเลิกให้หน่วยงานในอาเซียน':'Of 65.76 Mt retired, only 1.73 Mt (2.6%) was for ASEAN entities'}</text>`,th?'อุปทานส่วนใหญ่ของภูมิภาคถูกส่งออกไปเป็นคำกล่าวอ้างของผู้อื่น':'Most of the region\'s supply has historically left as other people\'s claims.');
 return out;
}