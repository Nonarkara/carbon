## Design the number and its explanation together
A carbon screen should help someone answer: **what is this, where did it come from, can I compare it, and what can I do next?** Put the explanation near the number rather than hiding it in a remote methodology page. The unit, geography, period and status should survive screenshots and exports.

Use a predictable order: quantity and unit; boundary and period; observed/estimated/forecast status; method and source version; uncertainty; next action. A large numeral without that context is easy to reuse incorrectly. Offer a direct chapter link for the relevant calculation, not a generic “learn more” link that forces a second search.

## Give visual choices a specific purpose
| Element | Use it to communicate | Avoid |
|---|---|---|
| Map | Geographic coverage and selection | Implying province data are parcel measurements |
| Proportional bars | Comparable quantities in the same unit and period | Mixing stocks, annual flows and credits |
| Time series | Change with explicit dates | Linking missing periods as if observed |
| Table | Exact values, sources and caveats | Hiding units in a single caption |
| Colour | Categories or status, with text labels | Colour alone as proof of quality |

A negative net flux and a positive stock are not opposite bars on the same chart. The landscape ledger does not add independent datasets together. Only GFW’s own emissions and removals are combined into its own net; mixing fossil, fire and another forest model would require reconciled boundaries and overlap analysis.

## Make uncertainty usable
Show whether an interval describes measurement error, model uncertainty or an illustrative sensitivity. State what it excludes. If no defensible uncertainty model is available, say so rather than drawing a polished band. “High confidence” in a deforestation alert is not the same as a 95% confidence interval in carbon tonnes.

Missing data needs a visible state and an action. A stale feed needs its observation date. Forecast and actual values need separate labels. A fallback is not real-time just because the screen refreshes. Make source links reachable beside each series and keep cached/fetched/fallback status in the data envelope.

## Design for the person holding a phone
Use Thai and English explanations of equal substance, keyboard focus that stays visible, readable labels and controls that fit a small screen. Keep equations as text so they can be selected, searched and read without an image. Diagrams need alternative descriptions; images need captions and reuse information. Flat outlines, intentional colour and spacing establish hierarchy without button shadows.

Test a complete journey: enter, choose a province, select an area, read its limits, open the method and return. Then test a malformed file and unavailable data. A beautiful successful screenshot cannot prove those failure paths work. This chapter describes the design principles used here; it does not claim formal accessibility certification.
<!-- TH -->
## ออกแบบตัวเลขกับคำอธิบายพร้อมกัน
หน้าจอคาร์บอนควรช่วยตอบ **นี่คืออะไร มาจากไหน เทียบกันได้ไหม และทำอะไรต่อได้?** วางคำอธิบายใกล้ตัวเลข ไม่ซ่อนไว้หน้าระเบียบวิธีที่ไกล หน่วย พื้นที่ เวลา และสถานะต้องติดไปกับภาพหน้าจอและไฟล์ส่งออก

จัดลำดับสม่ำเสมอ: ปริมาณและหน่วย ขอบเขตและเวลา สถานะวัด/ประมาณ/คาดการณ์ วิธีและรุ่นแหล่งข้อมูล ความไม่แน่นอน และการทำต่อ ตัวเลขใหญ่ที่ไม่มีบริบทถูกใช้ผิดได้ง่าย ให้ลิงก์ตรงบทคำนวณ ไม่ใช้ “อ่านเพิ่มเติม” กว้าง ๆ ที่ต้องค้นใหม่

## ให้ภาพทำหน้าที่เฉพาะ
| องค์ประกอบ | ใช้สื่ออะไร | หลีกเลี่ยง |
|---|---|---|
| แผนที่ | ความครอบคลุมและการเลือกพื้นที่ | สื่อว่าข้อมูลจังหวัดเป็นผลวัดแปลง |
| แท่งสัดส่วน | ปริมาณเทียบได้ในหน่วยและเวลาเดียวกัน | รวมสต็อก กระแสรายปี และเครดิต |
| อนุกรมเวลา | การเปลี่ยนพร้อมวันที่ | ต่อช่วงข้อมูลขาดเหมือนวัดแล้ว |
| ตาราง | ค่าตรง แหล่ง และข้อจำกัด | ซ่อนหน่วยไว้คำบรรยายเดียว |
| สี | หมวดหรือสถานะพร้อมข้อความ | ใช้สีอย่างเดียวพิสูจน์คุณภาพ |

ฟลักซ์สุทธิติดลบกับสต็อกบวกไม่ใช่แท่งตรงข้ามบนกราฟเดียวกัน บัญชีภูมิทัศน์ไม่บวกชุดข้อมูลอิสระ มีเพียงการปล่อยและดูดกลับของ GFW ที่รวมเป็นสุทธิของ GFW เอง การรวมฟอสซิล ไฟ และแบบจำลองป่าอีกชุดต้องกระทบขอบเขตและวิเคราะห์การซ้อนก่อน

## ทำความไม่แน่นอนให้นำไปใช้ได้
บอกว่าช่วงแสดงความคลาดเคลื่อนวัด ความไม่แน่นอนแบบจำลอง หรือการทดลองความไว ระบุส่วนที่ไม่รวม หากไม่มีแบบจำลองความไม่แน่นอนที่อธิบายได้ ให้บอกแทนวาดแถบสวย “ความเชื่อมั่นสูง” ของแจ้งเตือนสูญเสียป่าไม่ใช่ช่วงความเชื่อมั่น 95% ของตันคาร์บอน

ข้อมูลขาดต้องมีสถานะและทางทำต่อ ฟีดเก่าต้องมีวันสังเกต แยกคาดการณ์กับวัดจริง ค่าแทนไม่กลายเป็นเรียลไทม์เพราะหน้าจอรีเฟรช ให้เปิดแหล่งใกล้แต่ละชุดและเก็บสถานะแคช/ดึงใหม่/ค่าแทนในข้อมูล

## ออกแบบสำหรับคนถือโทรศัพท์
ภาษาไทยและอังกฤษต้องมีสาระเท่ากัน มีโฟกัสแป้นพิมพ์เห็นชัด ป้ายอ่านได้ และปุ่มพอดีจอเล็ก สมการต้องเป็นข้อความให้เลือก ค้น และอ่านโดยไม่ต้องดูภาพ แผนภาพมีคำอธิบายทดแทน ภาพมีคำบรรยายและสิทธิใช้ เส้นขอบเรียบ สีที่มีหน้าที่ และระยะที่เหมาะสร้างลำดับได้โดยไม่ต้องมีเงาปุ่ม

ทดสอบทางเดินครบ: เข้า เลือกจังหวัด เลือกพื้นที่ อ่านข้อจำกัด เปิดวิธี แล้วกลับ ทดสอบไฟล์เสียและข้อมูลไม่พร้อมด้วย ภาพสำเร็จที่สวยไม่ได้พิสูจน์ทางผิดพลาด บทนี้อธิบายหลักการออกแบบที่ใช้ ไม่ได้กล่าวอ้างใบรับรองการเข้าถึงอย่างเป็นทางการ
