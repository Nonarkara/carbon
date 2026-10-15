## Make the calculation easy to challenge
A screenshot communicates a result. An evidence pack lets another person examine it. Build the pack while collecting records, rather than reconstructing it after a client asks how the number was obtained. IPCC's national-inventory QA/QC chapter provides a useful historical distinction between routine checks and review. The folder structure below is our practical adaptation for this system, not an IPCC submission template or a verification opinion.

## Keep six connected records
| Record | What to keep | A useful rejection test |
|---|---|---|
| Decision brief | Purpose, intended audience, claim, owner and reporting period | Can the reviewer tell screening from an inventory or a credit application? |
| Boundary register | Geometry version, CRS, area basis, exclusions and rights evidence where applicable | Can the same physical extent and accounting boundary be reconstructed? |
| Input register | Original measurement or activity, unit, date, collector, evidence ID and corrections | Does each input point to a real record rather than a model-generated explanation? |
| Method register | Equation, parameter source, applicable edition, assumptions and exclusions | Can another analyst reproduce the unit conversions and know why this method applies? |
| Result and uncertainty | Unrounded calculation, display rounding, missing values, scenarios and warnings | Does a missing value remain missing in the export? |
| Review and change log | Checker, issue, resolution, date, approval scope and superseded version | Can someone recover the previous conclusion and explain the change? |

Use stable evidence IDs rather than personal names in public deliverables. Keep permission to disclose each record separate from permission to calculate with it. Landholder information and precise field locations may need controlled handling. Kabonna's supplied files remain in browser memory; it does not create this archive or back it up for you. Export the result before closing or refreshing the assessment tab.

## Reproduce a result without guessing
Save the original user-input JSON and any source documents in a controlled project folder. Save the landscape or regional JSON separately; those are contextual datasets, never substitutes for plot inputs. Record the application's release commit and source versions. Preserve the original byte hashes when available; a hash proves byte identity, not truth, lawful access or measurement quality.

Ask a colleague to reconstruct a small subset without verbal coaching. They should identify the quantity, boundary and period, obtain the same unrounded arithmetic within the documented tolerance, and reproduce the displayed rounding. Record any missing software version, hidden default or ambiguous unit as a defect. A copied screenshot matching another screenshot does not satisfy this check.

## Review changes and corrections openly
For a corrected tree diameter, retain the original record, correction reason, responsible person and downstream results affected. For a new dataset, distinguish a statistical revision from a real-world change. Rebuild derived outputs and rerun relevant conservation and browser checks; do not hand-edit a published aggregate to make it agree.

Issue an evidence status with the deliverable: prepared, internally checked, independently reviewed, or externally accepted by a named process. These are different statements. Do not call an internal review an accreditation, ISO certification or programme approval. Define who can reopen an issue and what evidence would be needed to close it.

A complete software export still cannot contain rights or measurements that were never collected. The value of the dossier is the visible chain from claim to evidence, including the gaps.
<!-- TH -->
## ทำให้คนอื่นตรวจโต้แย้งผลคำนวณได้ง่าย
ภาพหน้าจอสื่อสารผลได้ แต่ชุดหลักฐานทำให้ผู้อื่นตรวจผลได้ ควรทำตั้งแต่เก็บข้อมูล ไม่ใช่รื้อฟื้นหลังลูกค้าถามว่าตัวเลขมาจากไหน บท QA/QC ของ IPCC สำหรับบัญชีประเทศเป็นฐานวิธีเก่าที่ช่วยแยกการตรวจประจำออกจากการทบทวน ตารางด้านล่างเป็นการปรับใช้ที่เราเสนอ ไม่ใช่แม่แบบยื่น IPCC หรือความเห็นผู้ทวนสอบ

## เชื่อมบันทึกหกชุดเข้าหากัน
| บันทึก | สิ่งที่ต้องเก็บ | คำถามที่ใช้ปฏิเสธงานได้ |
|---|---|---|
| โจทย์ตัดสินใจ | วัตถุประสงค์ ผู้อ่าน คำกล่าวอ้าง ผู้รับผิดชอบ ช่วงรายงาน | แยกได้ไหมว่าคัดกรอง ทำบัญชี หรือยื่นเครดิต? |
| ทะเบียนขอบเขต | รุ่นรูปแปลง CRS ฐานพื้นที่ ส่วนที่ไม่รวม และสิทธิเมื่อจำเป็น | สร้างพื้นที่จริงกับขอบเขตบัญชีเดิมกลับมาได้ไหม? |
| ทะเบียนข้อมูลเข้า | ผลวัดหรือกิจกรรม หน่วย วันที่ ผู้เก็บ รหัสหลักฐาน การแก้ไข | ทุกค่ามีบันทึกจริง ไม่ใช่คำอธิบายที่โมเดลแต่งไหม? |
| ทะเบียนวิธี | สมการ ที่มาพารามิเตอร์ ฉบับที่ใช้ได้ สมมติฐาน ข้อยกเว้น | คำนวณหน่วยซ้ำและรู้เหตุผลที่วิธีนี้ใช้ได้ไหม? |
| ผลและความไม่แน่นอน | ค่าก่อนปัดเศษ ค่าที่แสดง ข้อมูลขาด สถานการณ์ คำเตือน | ค่าที่ขาดยังขาดในไฟล์ส่งออกไหม? |
| การตรวจและเปลี่ยน | ผู้ตรวจ ประเด็น วิธีแก้ วันที่ ขอบเขตการยอมรับ รุ่นเก่า | เรียกข้อสรุปเก่ากลับมาและอธิบายเหตุผลที่เปลี่ยนได้ไหม? |

ใช้รหัสหลักฐานคงที่แทนชื่อคนในเอกสารสาธารณะ แยกสิทธิเปิดเผยจากสิทธินำไปคำนวณ ข้อมูลผู้ถือครองและตำแหน่งสำรวจละเอียดอาจต้องจำกัดการเข้าถึง ไฟล์ที่ป้อนในคาบอนนะอยู่ในหน่วยความจำเบราว์เซอร์ ระบบไม่ได้ทำคลังหรือสำรองชุดหลักฐานนี้ให้ ส่งออกก่อนปิดหรือโหลดแท็บประเมินใหม่

## คำนวณซ้ำโดยไม่ต้องเดา
เก็บ JSON ข้อมูลเข้าต้นฉบับและเอกสารในโฟลเดอร์โครงการที่ควบคุมได้ เก็บ JSON ภูมิทัศน์หรือภูมิภาคแยก เพราะเป็นบริบท ไม่ใช่ข้อมูลแปลง บันทึกรุ่นระบบและรุ่นแหล่งข้อมูล เก็บแฮชไบต์ต้นฉบับถ้ามี แฮชพิสูจน์ว่าไบต์เหมือนเดิม ไม่ได้พิสูจน์ความจริง สิทธิใช้ หรือคุณภาพการวัด

ให้เพื่อนร่วมงานสร้างผลบางส่วนกลับมาโดยไม่บอกปากเปล่า เขาต้องระบุปริมาณ ขอบเขต ช่วงเวลา คำนวณก่อนปัดเศษตรงภายในเกณฑ์ที่ประกาศ และได้ค่าที่แสดงตรงกัน หากขาดรุ่นซอฟต์แวร์ มีค่าตั้งต้นซ่อน หรือหน่วยกำกวม ให้บันทึกเป็นข้อบกพร่อง ภาพหน้าจอสองภาพตรงกันยังไม่ผ่านเกณฑ์นี้

## เปิดเผยการแก้ไขและรุ่นข้อมูล
เมื่อแก้เส้นผ่านศูนย์กลางต้นไม้ เก็บค่าเก่า เหตุผล ผู้รับผิดชอบ และผลลัพธ์ที่ได้รับผล เมื่อเปลี่ยนชุดข้อมูล แยกการแก้สถิติออกจากการเปลี่ยนของโลกจริง สร้างผลอนุพันธ์ใหม่และตรวจยอดรวมกับพฤติกรรมเบราว์เซอร์ที่เกี่ยวข้อง อย่าแก้ยอดเผยแพร่ด้วยมือเพื่อบังคับให้ตรง

ส่งมอบพร้อมสถานะหลักฐาน: จัดเตรียมแล้ว ตรวจภายในแล้ว ตรวจอิสระแล้ว หรือผ่านกระบวนการภายนอกที่ระบุชื่อ แต่ละคำต่างกัน ห้ามเรียกการตรวจภายในว่าการรับรองความสามารถ ISO หรืออนุมัติโครงการ กำหนดว่าใครเปิดประเด็นซ้ำได้ และต้องมีหลักฐานใดจึงปิดได้

ไฟล์ส่งออกที่สมบูรณ์ด้านซอฟต์แวร์ยังสร้างสิทธิหรือผลวัดที่ไม่เคยเก็บไม่ได้ คุณค่าของชุดหลักฐานคือเส้นทางจากคำกล่าวอ้างถึงต้นทางที่มองเห็นได้ รวมทั้งช่องว่างด้วย
