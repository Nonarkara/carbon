## A precise-looking answer can still be uncertain
Separate uncertainty in measurements and parameters from uncertainty about the model and the question itself. Repeating a calculation proves that the software is deterministic; it does not prove that the input represents the forest. A narrow interval can coexist with systematic error, an unsuitable allometric equation or the wrong boundary.

The examples below are newly authored teaching calculations. They are not uncertainty estimates for Carbona's countries, forests or credit projects. The deployed landscape's own three random-error scenarios and inventory discrepancy remain separate.

## Work an activity-factor example
Let illustrative activity A = 1,000 kWh and factor f = 0.50 kgCO₂e/kWh. The result is E = A × f = 500 kgCO₂e, or 0.50 tCO₂e. Suppose the standard uncertainties are u(A) = 50 kWh and u(f) = 0.05 kgCO₂e/kWh. These factors and uncertainties are hypothetical, not current grid values.

For independent inputs, a first-order propagation is:

`u(E)² ≈ f²u(A)² + A²u(f)² = 0.5² × 50² + 1000² × 0.05² = 3125 (kgCO₂e)²`

`u(E) ≈ 55.90 kgCO₂e`

Under an approximately normal, adequately supported distribution, a teaching interval using 1.96 × standard uncertainty is 390.43–609.57 kgCO₂e. Normality, large-sample approximation and independence are assumptions, not facts supplied by a spreadsheet. Correlation adds the term `2Af Cov(A,f)`. Do not report this interval if those assumptions cannot be defended; describe the unresolved sources instead.

## Why correlation changes a forest-change result
Suppose two hypothetical stock estimates have standard uncertainties of 10 tCO₂e each. Their difference has:

`u(Δ)² = 10² + 10² − 2ρ × 10 × 10`

If ρ = 0, u(Δ) = 14.14 tCO₂e. If ρ = 0.8, u(Δ) = 6.32 tCO₂e. Shared errors can partly cancel in a difference. This does not justify choosing a high correlation because it gives a smaller interval. Estimate or justify the covariance with an appropriate repeated-measurement design and independent evidence. A changing sensor, forest mask, equation or sampling frame can introduce additional error that this simple example omits.

Spatial correlation matters too. Thousands of nearby pixels do not automatically provide thousands of independent observations. The deployed block-correlation scenario is a sensitivity assumption, not proof of interval coverage. Agreement between related producer products is not an independent field test.

## Write a usable uncertainty statement
Record the quantity and unit, coverage period, random components, covariance assumptions, distribution, calculation method and exclusions. State whether the interval is standard uncertainty, a statistical confidence interval, a prediction interval or a scenario range; these terms are not interchangeable. Keep systematic uncertainty and boundary mismatch visible even if no defensible numerical distribution exists.

Use sensitivity analysis to decide what to measure next. Change one assumption at a time, then examine defensible joint scenarios. If the decision changes under plausible inputs, request more evidence or state the conditional decision. A programme's prescribed conservative deduction is a separate rule; it must not be invented from this teaching interval. Neither an interval nor a lower bound creates an entitlement to credits.
<!-- TH -->
## ตัวเลขละเอียดไม่ได้แปลว่าแน่นอน
แยกความไม่แน่นอนของผลวัดและพารามิเตอร์ออกจากความไม่แน่นอนของแบบจำลองกับคำถาม การคำนวณซ้ำได้พิสูจน์ว่าซอฟต์แวร์ทำงานสม่ำเสมอ ไม่ได้พิสูจน์ว่าข้อมูลแทนป่าได้ ช่วงแคบอาจยังมีความคลาดเคลื่อนเชิงระบบ สมการไม่เหมาะ หรือขอบเขตผิด

ตัวอย่างต่อไปนี้เราเขียนเพื่อสอน ไม่ใช่ค่าความไม่แน่นอนของประเทศ ป่า หรือโครงการเครดิตในคาร์บอนนะ สามกรณีความคลาดเคลื่อนสุ่มของแผนที่ที่ใช้อยู่และความต่างจากการสำรวจยังแยกไว้ตามเดิม

## ลองคำนวณกิจกรรมคูณตัวคูณ
ให้กิจกรรมสมมติ A = 1,000 kWh และ f = 0.50 kgCO₂e/kWh ได้ E = A × f = 500 kgCO₂e หรือ 0.50 tCO₂e สมมติความไม่แน่นอนมาตรฐาน u(A) = 50 kWh และ u(f) = 0.05 kgCO₂e/kWh ทั้งตัวคูณและค่าความไม่แน่นอนนี้เป็นค่าสอน ไม่ใช่ค่าไฟฟ้าปัจจุบัน

เมื่อปัจจัยเป็นอิสระ การประมาณการแพร่ความไม่แน่นอนอันดับหนึ่งให้:

`u(E)² ≈ f²u(A)² + A²u(f)² = 0.5² × 50² + 1000² × 0.05² = 3125 (kgCO₂e)²`

`u(E) ≈ 55.90 kgCO₂e`

หากการแจกแจงใกล้ปกติและมีหลักฐานเพียงพอ ตัวอย่างใช้ 1.96 เท่าของความไม่แน่นอนมาตรฐานได้ช่วง 390.43–609.57 kgCO₂e ความเป็นปกติ การประมาณจากตัวอย่างมาก และความเป็นอิสระเป็นสมมติฐาน ไม่ใช่ข้อเท็จจริงที่ตารางคำนวณรับรอง หากสัมพันธ์กัน ต้องเพิ่ม `2Af Cov(A,f)` ถ้าปกป้องสมมติฐานไม่ได้ อย่ารายงานช่วงนี้ ให้บอกแหล่งความไม่แน่นอนที่ยังไม่คลี่คลาย

## ความสัมพันธ์เปลี่ยนผลการเปลี่ยนสต็อกอย่างไร
สมมติสต็อกสองเวลามีความไม่แน่นอนมาตรฐานเวลาละ 10 tCO₂e ผลต่างมี:

`u(Δ)² = 10² + 10² − 2ρ × 10 × 10`

เมื่อ ρ = 0 ได้ u(Δ) = 14.14 tCO₂e เมื่อ ρ = 0.8 ได้ 6.32 tCO₂e ความคลาดเคลื่อนร่วมอาจหักล้างบางส่วนในผลต่าง แต่ห้ามเลือกความสัมพันธ์สูงเพราะอยากได้ช่วงแคบ ต้องประมาณหรือให้เหตุผลจากการวัดซ้ำและหลักฐานอิสระ การเปลี่ยนเซนเซอร์ หน้ากากป่า สมการ หรือกรอบสุ่มอาจสร้างความคลาดเคลื่อนเพิ่มที่ตัวอย่างนี้ไม่ครอบคลุม

ความสัมพันธ์เชิงพื้นที่สำคัญเช่นกัน พิกเซลใกล้กันหลายพันจุดไม่ได้เป็นผลวัดอิสระหลายพันครั้ง กรณีสัมพันธ์ภายในบล็อกของระบบเป็นสมมติฐานความไว ไม่ใช่หลักฐานว่าช่วงครอบคลุมค่าจริง ผลิตภัณฑ์ที่มีต้นทางเกี่ยวข้องกันตรงกันก็ยังไม่ใช่การทดสอบภาคสนามอิสระ

## เขียนคำอธิบายที่นำไปใช้ได้
บันทึกปริมาณ หน่วย ช่วงเวลา องค์ประกอบสุ่ม สมมติฐานความแปรปรวนร่วม การแจกแจง วิธีคำนวณ และส่วนที่ไม่รวม บอกว่าเป็นความไม่แน่นอนมาตรฐาน ช่วงความเชื่อมั่น ช่วงพยากรณ์ หรือช่วงสถานการณ์ คำเหล่านี้ใช้แทนกันไม่ได้ คงความไม่แน่นอนเชิงระบบและขอบเขตไม่ตรงไว้ แม้ยังไม่มีการแจกแจงเชิงตัวเลขที่ปกป้องได้

ใช้การวิเคราะห์ความไวเลือกสิ่งที่ควรวัดต่อ เปลี่ยนสมมติฐานทีละตัวแล้วตรวจสถานการณ์ร่วมที่เป็นไปได้ หากข้อสรุปเปลี่ยนภายใต้ค่าที่สมเหตุผล ต้องเก็บหลักฐานเพิ่มหรือรายงานการตัดสินใจแบบมีเงื่อนไข การหักแบบอนุรักษนิยมตามโครงการเป็นกฎอีกเรื่อง ห้ามสร้างจากช่วงสอนนี้เอง ช่วงความไม่แน่นอนหรือขอบล่างไม่ได้สร้างสิทธิในเครดิต
