## When two credible sources disagree
Keep both results visible. First ask whether they estimate the same quantity on the same land, in the same period, using compatible definitions and pools. Different answers can follow from different questions. A national inventory total and a satellite raster total do not identify map bias merely because their ratio is large.

Gibbs and colleagues' 2025 forest-flux paper describes revisions to a geospatial modelling framework and its uncertainty. It supports reading model versions and assumptions carefully. It does not independently validate this site's ingestion, every Southeast Asian country or any project parcel. The implemented GFW version is pinned separately in the source manifest; the paper's reporting period must not silently replace the deployed period.

## Work through four possible explanations
| Possible explanation | Evidence to request | What would weaken it? |
|---|---|---|
| Different forest boundaries | Matched masks, area totals and exclusions | The discrepancy persists on identical spatial support |
| Different pools or equations | Pool definitions, root treatment and local allometry | Recomputing with compatible assumptions leaves the gap |
| Different dates or disturbance | Observation dates, losses, harvest and recovery records | Matched dates and documented changes do not explain it |
| Measurement/model error | Independent representative field evidence and error analysis | A held-out test supports the estimate within its stated scope |

This is a diagnostic agenda authored for Kabonna. It is not a claim that any one explanation has been established. Avoid selecting the explanation that makes a preferred source look correct. Keep a competing hypothesis and its strongest contrary evidence in the review notes.

## Design a test that can fail
Define the target population, unit of analysis, field protocol and acceptable errors before looking at held-out outcomes. Explain the tolerance in terms of the intended decision; do not invent a universal “accurate enough” percentage. Use spatial separation or appropriately blocked validation when nearby samples share information. Keep model tuning and final testing distinct. If an area is inaccessible, state what population remains untested.

Report signed bias, absolute error and the distribution of residuals at the actual decision scale, alongside sample size and sampling design. If reporting interval coverage, compare each test observation with its applicable interval and explain sampling uncertainty around the observed coverage. A good overall average can conceal poor results in mangroves, plantations or small holdings; inspect prespecified strata. Do not claim those strata were validated unless the samples support that statement.

For causal credit claims, predictive accuracy is insufficient. The baseline must address what would have happened without the activity, together with the programme's other requirements. A high-resolution picture does not observe that counterfactual.

## Separate a software release from scientific acceptance
For this release, automated tests check arithmetic, provenance, dataset conservation, navigation, bilingual rendering, exports and failure handling. These checks can reject software defects. They cannot certify field accuracy, lawful rights, additionality, human usability or credit issuance. A browser screenshot is evidence of a rendered state, not a scientific validation report.

The current operational boundary is national screening across eleven countries and a supplied-measurement workbench under its stated Thai method. There is no trained regional parcel model or automatic country approval. Research should become more specific when new independent observations arrive, rather than becoming more certain merely because the interface looks finished.

Write the remaining uncertainties, the next evidence to collect, the reviewer and the date to revisit. An honest release can be operationally usable while leaving a scientific claim unproven. The failure is not having a limit; it is making that limit disappear.
<!-- TH -->
## เมื่อแหล่งข้อมูลน่าเชื่อถือสองแหล่งให้ค่าต่างกัน
คงผลทั้งสองไว้ ก่อนอื่นถามว่าวัดปริมาณเดียวกัน บนที่ดินเดียวกัน ในช่วงเดียวกัน และใช้นิยามกับแหล่งสะสมที่เข้ากันหรือไม่ คำตอบต่างกันอาจเพราะถามต่างกัน ยอดสำรวจประเทศกับยอดรวมราสเตอร์ไม่ได้ระบุอคติของแผนที่ได้เพียงเพราะอัตราส่วนสูง

บทความฟลักซ์ป่าของ Gibbs และคณะปี 2025 อธิบายการปรับกรอบแบบจำลองเชิงพื้นที่และความไม่แน่นอน จึงสนับสนุนให้ตรวจรุ่นและสมมติฐาน แต่ไม่ได้ทวนสอบการนำเข้าของเว็บนี้ ทุกประเทศในเอเชียตะวันออกเฉียงใต้ หรือทุกแปลงโครงการ รุ่น GFW ที่ติดตั้งถูกตรึงแยกไว้ในรายการที่มา ห้ามเอาช่วงรายงานของบทความแทนช่วงข้อมูลที่ระบบใช้เงียบ ๆ

## ตรวจคำอธิบายที่เป็นไปได้สี่ทาง
| คำอธิบายที่เป็นไปได้ | หลักฐานที่ต้องขอ | อะไรทำให้คำอธิบายอ่อนลง? |
|---|---|---|
| ขอบเขตป่าต่างกัน | หน้ากากที่จับคู่ ยอดพื้นที่ ข้อยกเว้น | ใช้ขอบเขตเดียวแล้วยังต่าง |
| แหล่งสะสมหรือสมการต่าง | นิยามแหล่งสะสม วิธีราก สมการท้องถิ่น | คำนวณด้วยสมมติฐานเดียวแล้วยังต่าง |
| วันหรือการรบกวนต่าง | วันสังเกต การสูญเสีย ตัดไม้ ฟื้นตัว | จับวันและเหตุการณ์แล้วยังอธิบายไม่ได้ |
| ผลวัดหรือโมเดลคลาดเคลื่อน | ตัวอย่างภาคสนามอิสระที่เป็นตัวแทนและวิเคราะห์ข้อผิดพลาด | ข้อมูลทดสอบแยกสนับสนุนค่าภายในขอบเขตที่อ้าง |

นี่คือวาระวินิจฉัยที่เราเสนอ ไม่ใช่ข้อสรุปว่าพิสูจน์คำอธิบายใดแล้ว อย่าเลือกเหตุผลเพราะช่วยให้แหล่งที่ชอบดูถูกต้อง เก็บสมมติฐานคู่แข่งและหลักฐานคัดค้านที่หนักแน่นที่สุดไว้ในบันทึกตรวจ

## ออกแบบการทดสอบที่มีสิทธิล้มเหลว
กำหนดประชากรเป้าหมาย หน่วยวิเคราะห์ วิธีภาคสนาม และความคลาดเคลื่อนที่ยอมรับก่อนดูผลทดสอบ ให้เหตุผลเกณฑ์ตามการตัดสินใจ ไม่แต่งร้อยละ “แม่นพอ” ที่ใช้กับทุกกรณี ใช้การแยกเชิงพื้นที่หรือบล็อกที่เหมาะเมื่อแปลงใกล้กันใช้สารสนเทศร่วมกัน แยกการปรับแบบจำลองออกจากการทดสอบสุดท้าย หากเข้าบางพื้นที่ไม่ได้ ต้องระบุประชากรที่ยังไม่ถูกทดสอบ

รายงานอคติที่มีเครื่องหมาย ความคลาดเคลื่อนสัมบูรณ์ และการกระจายเศษเหลือที่มาตราส่วนของการตัดสินใจ พร้อมจำนวนตัวอย่างและแผนสุ่ม หากรายงานสัดส่วนที่ช่วงครอบคลุม ให้เทียบผลวัดทดสอบแต่ละจุดกับช่วงของมัน และบอกความไม่แน่นอนจากการสุ่มของสัดส่วนนั้น ค่าเฉลี่ยรวมดีอาจซ่อนผลไม่ดีในชายเลน ป่าปลูก หรือรายย่อย ควรตรวจชั้นที่กำหนดล่วงหน้า ห้ามอ้างว่าทวนสอบชั้นนั้นแล้วหากตัวอย่างไม่รองรับ

การอ้างเครดิตเชิงสาเหตุต้องมากกว่าทำนายแม่น กรณีฐานต้องตอบว่าจะเกิดอะไรโดยไม่มีกิจกรรม พร้อมเงื่อนไขอื่นของโครงการ ภาพละเอียดสูงไม่ได้สังเกตโลกสมมตินั้น

## แยกการเผยแพร่ซอฟต์แวร์จากการยอมรับทางวิทยาศาสตร์
รุ่นนี้ใช้การทดสอบอัตโนมัติตรวจเลขคำนวณ ที่มา การกระทบยอด การนำทาง สองภาษา การส่งออก และการรับมือข้อผิดพลาด การตรวจเหล่านี้ปฏิเสธข้อบกพร่องซอฟต์แวร์ได้ แต่รับรองความแม่นภาคสนาม สิทธิที่ชอบด้วยกฎหมาย ประโยชน์ส่วนเพิ่ม ความง่ายสำหรับคนจริง หรือการออกเครดิตไม่ได้ ภาพเบราว์เซอร์พิสูจน์สถานะที่แสดง ไม่ใช่รายงานทวนสอบวิทยาศาสตร์

ขอบเขตใช้งานปัจจุบันคือคัดกรองประเทศสิบเอ็ดประเทศ และเครื่องมือผลวัดที่ผู้ใช้ป้อนตามวิธีไทยที่ระบุ ยังไม่มีโมเดลแปลงภูมิภาคที่ฝึกแล้วหรืออนุมัติประเทศอัตโนมัติ งานวิจัยควรเจาะจงขึ้นเมื่อมีผลวัดอิสระใหม่ ไม่ใช่มั่นใจขึ้นเพราะหน้าจอดูเสร็จ

เขียนความไม่แน่นอนที่เหลือ หลักฐานที่จะเก็บ ผู้ตรวจ และวันทบทวน ซอฟต์แวร์ที่ใช้งานได้ยังมีข้อกล่าวอ้างทางวิทยาศาสตร์ที่ไม่พิสูจน์ได้ ความผิดไม่ใช่การมีขอบเขต แต่คือการทำให้ขอบเขตนั้นหายไป
