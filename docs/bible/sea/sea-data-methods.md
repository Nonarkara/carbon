## Comparability is a contract
A regional comparison needs the same construct, unit, period and boundary within each column. The regional table deliberately keeps **FAO forest area**, **GFW forest flux** and **EDGAR/IEA non-LULUCF CO₂** in different columns. National forest definitions, a satellite model's extent and a territorial emissions boundary are different objects. A common country code does not make them one inventory.

The ingestion script requests the exact eleven ISO3 codes and checks identity, uniqueness, finite values and period. Forest area and share use 2023, matching the displayed CO₂ year. WDI reports its own source update date separately from the observation year. The GFW source remains pinned to v20260327 for a comparable 25-year window. A refresh does not relabel those observations as 2026.

## Show the arithmetic and the missingness
**Forest hectares = published km² × 100.** This is a unit conversion, not a biomass estimate.

**Mean annual GFW quantity = reported 2001–2025 period quantity ÷ 25.** Mg equals a metric tonne. Gross removals are positive quantities in their own column. Net is positive for a source and negative for a sink. The displayed net uses GFW's own reported net, with a check against emissions minus removals allowing small source rounding differences.

**Regional total for metric j = Σ country j**, only when all eleven country records contain that metric. If one value is absent, the regional total is withheld rather than presenting a partial sum as the whole region. Do not average country percentages. A weighted regional share would require matching land-area denominators; that headline is not implemented here.

## Why no regional carbon balance?
Subtracting GFW forest removals from EDGAR CO₂ would mix a long-run forest-model mean with one year's territorial CO₂ outside LULUCF. It would omit gases and other land-use processes, and could misrepresent the model boundary. The system therefore provides context side by side and no synthesized national or regional net across sources. The only forest net is GFW's own.

## What was checked, and what was not
The pipeline checks complete country geometry coverage, valid numerical values, source-internal GFW net consistency, regional sums and reconciliation of Thailand's GFW emissions/removals against the existing ledger. An independent ADM0 summary endpoint returned 404. That unavailable cross-check is recorded, not counted as a passed test. No independent field accuracy or model interval coverage has been established for the regional extension.

Each original response is hashed and cached outside the public site. The public snapshot contains its source URLs, units, dates, versions, licence and digest. The 137 kB country geometry is a rounded cartographic derivative; its areas are never substituted for FAO statistics. If a source changes definition or revises history, retain the prior snapshot and describe the revision before comparing releases.
<!-- TH -->
## การเปรียบเทียบต้องมีข้อตกลงข้อมูล
การเทียบภูมิภาคต้องมีสิ่งที่วัด หน่วย ช่วงเวลา และขอบเขตเดียวกันภายในแต่ละคอลัมน์ ตารางจงใจแยก **พื้นที่ป่า FAO**, **ฟลักซ์ป่า GFW** และ **CO₂ ไม่รวม LULUCF ของ EDGAR/IEA** นิยามป่าประเทศ พื้นที่แบบจำลองดาวเทียม และขอบเขตการปล่อยตามอาณาเขตเป็นคนละวัตถุ รหัสประเทศตรงกันไม่ได้ทำให้เป็นบัญชีเดียว

สคริปต์ขอรหัส ISO3 สิบเอ็ดประเทศที่ระบุ ตรวจตัวตน ความซ้ำ ค่าจำกัด และช่วงเวลา พื้นที่ป่ากับร้อยละใช้ปี 2023 ตรงปี CO₂ ที่แสดง เก็บวันปรับปรุงแหล่ง WDI แยกจากปีสังเกต GFW ตรึง v20260327 สำหรับช่วง 25 ปีที่เทียบกันได้ การดึงใหม่ไม่เปลี่ยนผลสังเกตเหล่านั้นเป็นปี 2026

## แสดงเลขและข้อมูลที่ขาด
**เฮกตาร์ป่า = km² ที่เผยแพร่ × 100** เป็นการแปลงหน่วย ไม่ใช่ประมาณมวลชีวภาพ

**GFW เฉลี่ยรายปี = ยอดตลอด 2001–2025 ÷ 25** Mg เท่าตันเมตริก ดูดกลับรวมเป็นค่าบวกในคอลัมน์ของตน สุทธิบวกคือแหล่งปล่อย ลบคือแหล่งดูดกลับ ระบบใช้ยอดสุทธิที่ GFW รายงาน และตรวจเทียบการปล่อยลบดูดกลับโดยยอมส่วนต่างการปัดเศษต้นทางเล็กน้อย

**ยอดภูมิภาคของตัวแปร j = Σ ค่าประเทศของ j** ต่อเมื่อมีครบสิบเอ็ดประเทศ หากขาดหนึ่งประเทศจะไม่แสดงยอด แทนการเรียกผลรวมบางส่วนว่าครบภูมิภาค ห้ามเฉลี่ยเปอร์เซ็นต์ประเทศ สัดส่วนภูมิภาคแบบถ่วงน้ำหนักต้องใช้ตัวหารพื้นที่ดินที่ตรงกัน ซึ่งระบบยังไม่ทำพาดหัวนี้

## ทำไมไม่มีสมดุลคาร์บอนภูมิภาค?
หักดูดกลับ GFW จาก CO₂ ของ EDGAR จะปนค่าเฉลี่ยแบบจำลองป่าหลายปีกับ CO₂ ตามอาณาเขตนอก LULUCF หนึ่งปี ยังขาดก๊าซและกระบวนการใช้ที่ดินอื่น และอาจตีความขอบเขตแบบจำลองผิด จึงแสดงบริบทข้างกันและไม่สร้างสุทธิประเทศหรือภูมิภาคข้ามแหล่ง สุทธิป่ามีเฉพาะของ GFW เอง

## ตรวจอะไรแล้ว และยังไม่ตรวจอะไร
สคริปต์ตรวจขอบเขตประเทศครบ ตัวเลขถูกชนิด สุทธิภายใน GFW ผลรวมภูมิภาค และกระทบยอดปล่อย/ดูดกลับไทยกับบัญชีเดิม จุดบริการ ADM0 สำหรับตรวจอิสระตอบ 404 บันทึกว่าเข้าถึงไม่ได้ ไม่ถือว่าทดสอบผ่าน ยังไม่ได้ยืนยันความแม่นยำภาคสนามอิสระหรือความครอบคลุมช่วงความไม่แน่นอนของระบบภูมิภาค

แต่ละผลตอบกลับต้นทางมีแฮชและแคชนอกเว็บไซต์สาธารณะ snapshot สาธารณะมี URL หน่วย วัน รุ่น สิทธิ และแฮช ขอบเขตประเทศราว 137 kB เป็นข้อมูลทำแผนที่ที่ปัดพิกัด ไม่ใช้พื้นที่แทนสถิติ FAO หากต้นทางเปลี่ยนนิยามหรือแก้อนุกรมย้อนหลัง เก็บ snapshot เดิมและอธิบายการแก้ก่อนเทียบรุ่น
