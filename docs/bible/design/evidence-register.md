## Give every record a home
The most useful carbon database often starts as a disciplined table. Store the original document separately from the normalized activity row. A file hash identifies the bytes you received; it does not prove that the bill is true. Evidence still needs a responsible owner, a date and a check against the operation it describes.

Use a stable row ID, not the spreadsheet row number. Corrections should create a new revision with a reason, keeping the earlier value available. In client work, restrict access to invoices, personal travel details and supplier information. This system keeps user files browser-local; do not interpret a local import as cloud storage or a backup.

## Copy this activity schema
| Field | Example | Why it matters |
|---|---|---|
| record_id / revision | ELEC-BKK-01 / 2 | Links corrections to one activity |
| site / source / scope | Warehouse / grid electricity / 2 | Establishes coverage |
| period_start / end | 2025-01-01 / 2025-01-31 | Stops overlapping periods |
| amount / unit | 4,200 / kWh | Makes conversion auditable |
| evidence / owner | bill-01.pdf / operations | Allows a reviewer to retrieve it |
| factor_id / version | selected-factor / published edition | Makes recalculation possible |
| quality / assumption | meter / no allocation | Separates observation from inference |
| reviewed_by / date | finance / review date | Records the check |

These are recommended fields for your workbook, not an upload schema accepted by the forest workbench. Keep a second factor table rather than pasting unexplained numbers into each activity row.

## Missing is not zero
Use explicit states: **measured, supplier-reported, estimated, missing, not applicable**. A missing bill must not contribute a hidden zero to a “complete” total. Estimate only with a stated method: comparable metered days, occupancy or production may be relevant, but a seasonal business may make a simple average misleading. Record the missing period, estimate, reason, uncertainty and replacement plan.

Completeness needs a meaningful denominator. “Ten of twelve monthly bills received” measures document coverage, not 83% of emissions. It does not reveal whether the two missing months contain the busiest season. Report both document coverage and the known sources that remain unquantified.

## Reconcile before you calculate
Check meter resets, negative adjustments, inconsistent date formats and repeated invoice IDs. Compare annual activity against finance totals; reconcile differences rather than forcing equality. Keep original units alongside converted units. Litres, kilograms and energy units cannot be interchanged without an evidenced density or heating-value convention.

**Review exercise:** hand a colleague one result row and ask them to locate the original evidence, reproduce the unit conversion and identify the factor version. If they cannot, improve the register before designing a dashboard.
<!-- TH -->
## ให้ทุกรายการมีที่อยู่
ฐานข้อมูลคาร์บอนที่มีประโยชน์มักเริ่มจากตารางที่มีวินัย เก็บเอกสารต้นฉบับแยกจากแถวข้อมูลกิจกรรมที่จัดรูปแล้ว ค่าแฮชช่วยระบุไฟล์ที่ได้รับ แต่ไม่ได้พิสูจน์ว่าบิลถูกต้อง หลักฐานยังต้องมีเจ้าของ วันที่ และการตรวจเทียบกับกิจกรรมที่กล่าวถึง

ใช้รหัสรายการคงที่ ไม่ใช้เลขแถวตารางเป็นรหัส การแก้ไขควรมีรุ่นใหม่และเหตุผล พร้อมย้อนดูค่าเดิมได้ งานลูกค้าต้องจำกัดผู้เข้าถึงบิล รายละเอียดเดินทางส่วนตัว และข้อมูลผู้ขาย ระบบนี้เก็บไฟล์ผู้ใช้ในเบราว์เซอร์ การนำเข้าในเครื่องไม่ได้แปลว่าเก็บบนคลาวด์หรือสำรองไว้แล้ว

## แม่แบบข้อมูลกิจกรรมที่คัดลอกได้
| ช่อง | ตัวอย่าง | ประโยชน์ |
|---|---|---|
| record_id / revision | ELEC-BKK-01 / 2 | เชื่อมการแก้กับกิจกรรมเดิม |
| site / source / scope | คลัง / ไฟฟ้าระบบ / 2 | ระบุความครอบคลุม |
| period_start / end | 2025-01-01 / 2025-01-31 | ป้องกันช่วงซ้อน |
| amount / unit | 4,200 / kWh | ตรวจการแปลงหน่วยได้ |
| evidence / owner | bill-01.pdf / ปฏิบัติการ | ผู้ตรวจเรียกเอกสารได้ |
| factor_id / version | รหัสตัวคูณ / ฉบับเผยแพร่ | คำนวณใหม่ได้ |
| quality / assumption | มิเตอร์ / ไม่แบ่งส่วน | แยกผลวัดจากข้ออนุมาน |
| reviewed_by / date | การเงิน / วันตรวจ | บันทึกผู้ตรวจ |

นี่คือช่องที่แนะนำสำหรับสมุดงาน ไม่ใช่โครงสร้างไฟล์ที่เครื่องมือป่ารับนำเข้า เก็บทะเบียนตัวคูณอีกตารางหนึ่ง แทนการวางตัวเลขที่ไม่มีคำอธิบายในทุกแถว

## ข้อมูลขาดไม่ใช่ศูนย์
กำหนดสถานะชัดเจน: **วัดจริง ผู้ขายรายงาน ประมาณการ ขาดข้อมูล ไม่เกี่ยวข้อง** บิลที่ขาดต้องไม่กลายเป็นศูนย์ซ่อนในยอดที่เรียกว่า “ครบ” ประมาณการด้วยวิธีที่ระบุ เช่น วันใช้งานที่มีมิเตอร์ จำนวนผู้ใช้ หรือผลผลิต แต่ธุรกิจตามฤดูกาลอาจใช้ค่าเฉลี่ยธรรมดาไม่ได้ บันทึกช่วงที่ขาด ค่าแทน เหตุผล ความไม่แน่นอน และแผนหาข้อมูลจริง

ความครบถ้วนต้องมีตัวหารที่สื่อความหมาย “ได้บิลสิบจากสิบสองเดือน” บอกความครบเอกสาร ไม่ได้บอกว่าครอบคลุมการปล่อย 83% และไม่รู้ว่าสองเดือนที่ขาดเป็นช่วงงานสูงสุดหรือไม่ รายงานทั้งเอกสารที่มีและแหล่งการปล่อยที่รู้แต่ยังไม่ได้คำนวณ

## กระทบยอดก่อนคำนวณ
ตรวจมิเตอร์เริ่มใหม่ รายการปรับติดลบ รูปแบบวันที่ต่างกัน และรหัสบิลซ้ำ เทียบกิจกรรมทั้งปีกับข้อมูลการเงิน อธิบายส่วนต่างแทนการบังคับให้เท่ากัน เก็บหน่วยเดิมคู่กับหน่วยแปลง ลิตร กิโลกรัม และหน่วยพลังงานเปลี่ยนแทนกันไม่ได้หากไม่มีหลักฐานความหนาแน่นหรือค่าความร้อนตามวิธีที่ใช้

**แบบฝึกตรวจงาน:** ส่งแถวผลลัพธ์หนึ่งแถวให้เพื่อนร่วมงาน ให้หาเอกสารต้นฉบับ ทำการแปลงหน่วยซ้ำ และระบุรุ่นตัวคูณ หากทำไม่ได้ ให้ปรับทะเบียนก่อนออกแบบหน้าจอ
