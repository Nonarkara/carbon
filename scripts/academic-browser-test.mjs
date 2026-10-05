import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.BASE_URL||'http://localhost:8790';
await mkdir('test-results',{recursive:true});
const b=await chromium.launch(),p=await b.newPage();
const errors=[];p.on('pageerror',e=>errors.push(e.message));
for(const lang of ['th','en'])for(const width of [375,768,1440]){
 await p.setViewportSize({width,height:900});
 await p.goto(`${base}/bible.html?lang=${lang}#scientific-audit`,{waitUntil:'domcontentloaded'});
 await p.locator('.audit-results').waitFor();
 assert.equal(await p.locator('.audit-diagram').count(),2);
 assert.equal(await p.locator('.audit-results table').count(),5);
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Bible overflows');
 await p.locator('.audit-results').screenshot({path:`test-results/academic-results-${lang}-${width}.png`});
 await p.locator('#search').fill(lang==='th'?'covariance':'independent');
 assert.ok(await p.locator('#results a').count()>0);
 await p.goto(`${base}/research-${lang}.html#section-15`,{waitUntil:'domcontentloaded'});
 await p.locator('.audit-results').waitFor();
 assert.equal(await p.locator('.research-toc a').count(),17);
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Research overflows');
}
assert.deepEqual(errors,[]);await b.close();console.log('Academic reader: TH/EN 375/768/1440, diagrams, tables, search, no overflow or page errors.');
