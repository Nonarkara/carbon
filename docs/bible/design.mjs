import {readFileSync} from 'node:fs';
const specs=[
 ['assessment-brief','design','Design the assessment before the screen','ออกแบบการประเมินก่อนออกแบบหน้าจอ','Turn a client question into a boundary, an evidence plan and a deliverable.','เปลี่ยนคำถามลูกค้าเป็นขอบเขต แผนหลักฐาน และงานที่ส่งมอบ',['protocol','iso1','iso67'],'start'],
 ['boundary-design','design','Draw the boundary you can defend','วางขอบเขตที่อธิบายและตรวจสอบได้','Branches, leased sites and shared operations need a written accounting decision.','สาขา พื้นที่เช่า และกิจการร่วมต้องมีข้อสรุปทางบัญชีที่บันทึกไว้',['protocol','iso1'],'scopes'],
 ['evidence-register','design','Build the evidence register','สร้างทะเบียนหลักฐาน','A practical row structure for bills, meters, assumptions and corrections.','โครงสร้างข้อมูลที่ใช้ได้จริงกับบิล มิเตอร์ สมมติฐาน และการแก้ไข',['protocol','iso3','code'],'exports'],
 ['factor-design','design','Choose factors without changing the question','เลือกตัวคูณโดยไม่เปลี่ยนความหมายของคำถาม','Match units, geography, technology, gases and version before multiplying.','ตรวจหน่วย พื้นที่ เทคโนโลยี ก๊าซ และรุ่นก่อนคูณ',['factor-guide','gwp-guide','tgo-cfo'],'units'],
 ['energy-design','design','Design electricity accounting','ออกแบบบัญชีไฟฟ้า','Meters, solar generation and contracts belong in distinct evidence trails.','มิเตอร์ ไฟฟ้าโซลาร์ และสัญญาซื้อไฟต้องมีเส้นทางหลักฐานแยกกัน',['scope2'],'footprint'],
 ['value-chain-design','design','Find the missing value chain','ตามหาห่วงโซ่คุณค่าที่ตกหล่น','Screen all 15 categories, then improve the material estimates.','คัดกรองครบ 15 หมวด แล้วพัฒนาข้อมูลส่วนสำคัญ',['scope3','scope3-calculation'],'scopes'],
 ['product-design','design','Design a product footprint','ออกแบบฟุตพริ้นท์ผลิตภัณฑ์','Specify a useful service, a life cycle and an allocation rule.','ระบุบริการที่ได้รับ วงจรชีวิต และกติกาปันส่วน',['product-standard','iso67'],'standards'],
 ['sme-worked','design','Work through a small-business inventory','ทำบัญชีธุรกิจขนาดเล็กทีละขั้น','Five hypothetical records, visible arithmetic and a deliberately partial Scope 3.','ห้ารายการสมมติ เห็นเลขทุกขั้น และเปิดเผยว่า Scope 3 ยังไม่ครบ',['protocol','scope2','scope3'],'factor-design'],
 ['reduction-design','design','Turn a footprint into a reduction plan','เปลี่ยนฟุตพริ้นท์เป็นแผนลดการปล่อย','Set owners, comparable baselines and measurable follow-up.','กำหนดผู้รับผิดชอบ ฐานเปรียบเทียบ และวิธีติดตามที่วัดได้',['protocol','scope3'],'offsets'],
 ['interface-design','design','Design a carbon screen people can trust','ออกแบบหน้าจอคาร์บอนที่คนเชื่อถือได้','Make every number readable, traceable and difficult to misinterpret.','ทำให้ทุกตัวเลขอ่านง่าย ย้อนตรวจได้ และตีความผิดได้ยาก',['code','manifest'],'number-passport'],
 ['assurance-design','design','Prepare an assessment for independent review','เตรียมการประเมินให้พร้อมทวนสอบอิสระ','Trace records, challenge assumptions and publish the remaining limitations.','ตามรอยรายการ ท้าทายสมมติฐาน และเปิดเผยข้อจำกัดที่ยังเหลือ',['iso3','iso1','protocol'],'scientific-audit'],
 ['assessment-handoff','design','Run the first month and hand over the work','ทำงานเดือนแรกและส่งต่อให้ทีมใช้งานได้','A practical schedule, review gates and templates you can copy.','ตารางงาน จุดตรวจ และแม่แบบที่นำไปใช้ต่อได้',['code','iso1','tgo-cfo'],'assessment-brief'],
 ['climate-impacts','impacts','See the impacts, read the evidence','เห็นผลกระทบและอ่านหลักฐานให้เป็น','Historical photographs explain why the work matters, with careful causal limits.','ภาพอดีตช่วยให้เห็นความสำคัญของงาน พร้อมขอบเขตการอธิบายสาเหตุ',['ipcc-syr','impact-glacier','impact-drought','impact-coral'],'forest-watch'],
 ['open-artifacts','impacts','Reuse pictures and diagrams responsibly','ใช้ภาพและแผนภาพซ้ำอย่างรับผิดชอบ','Download public-domain pictures and original diagrams with their provenance.','ดาวน์โหลดภาพสาธารณสมบัติและแผนภาพต้นฉบับพร้อมที่มา',['artifact-register','usgs-rights'],'climate-impacts']
];
export const designChapters=specs.map(([id,group,en,th,se,st,sources,related])=>{
 const raw=readFileSync(new URL(`./design/${id}.md`,import.meta.url),'utf8');
 const [bodyEn,bodyTh]=raw.split('\n<!-- TH -->\n');
 if(!bodyTh)throw Error(`Missing Thai edition: ${id}`);
 return {id,group,title:{en,th},summary:{en:se,th:st},body:{en:bodyEn,th:bodyTh},sources,related:[related],reviewed:'2026-10-07',diagram:{en:['Define the question and boundary','Record evidence and assumptions','Calculate and review before making a claim'],th:['ระบุคำถามและขอบเขต','บันทึกหลักฐานและสมมติฐาน','คำนวณและตรวจสอบก่อนนำไปกล่าวอ้าง']}};
});
