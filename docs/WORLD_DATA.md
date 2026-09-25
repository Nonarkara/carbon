# Global data contract / ข้อมูลโลก

Verified 26 September 2026. `/api/global` is a Cloudflare Pages Function with fixed public upstreams. No project inputs or user URLs are accepted. `_routes.json` keeps static assets outside Functions.

|Source|Meaning|Cadence|Cache|
|---|---|---|---|
|[NOAA GML](https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_trend_gl.txt)|Deseasonalized global CO2 trend, fifth column, ppm; recent year provisional|Daily|6h|
|[NESO](https://api.carbonintensity.org.uk/)|GB electricity gCO2/kWh; estimated actual or forecast; CC BY4|30min|15min|
|[RGGI](https://www.rggi.org/auctions/auction-results)|Auction USD per **short ton allowance**, not voluntary credits|Quarterly auction|6h|
|[European Commission](https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/price-cbam-certificates_en)|CBAM reference EUR/tCO2e, not live EUA spot|Quarterly 2026|6h|

Upstreams time out independently after 8 seconds. Cache retention is 30 days; failure shows dated cache/snapshot fallback. Missing values remain null. Malformed values and dates are rejected. Fetch time is separate from observation date. UI refreshes every five minutes while visible, respecting cache TTL. GB data two hours beyond validity is labelled out of date.

Annual references: [GCB2025](https://globalcarbonbudget.org/fossil-fuel-co2-emissions-hit-record-high-in-2025/) 38.1Gt fossil CO2 projection for 2025; [World Bank2026](https://www.worldbank.org/en/news/press-release/2026/05/19/direct-carbon-pricing-covers-nearly-one-third-of-global-emissions) issuance growth, policies, revenue. These are dated references, not live counters. No global voluntary-credit live price is claimed.

ข้อมูลโลกแยกหน่วยและช่วงเวลา ไม่รวมยอดข้ามชุดข้อมูล ไม่ใช้ราคาโลกตีมูลค่าป่าที่เลือก ไม่ใช้ละอองลอยคำนวณเครดิต ข้อมูลแผนที่คงรุ่นและปีตาม manifest เดิม การอัปเดตข้อมูลโลกไม่เปลี่ยนข้อมูลโครงการของผู้ใช้
