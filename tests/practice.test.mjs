import test from 'node:test';import assert from 'node:assert/strict';import {practiceChapters} from '../docs/bible/practice.mjs';
test('Practical review chapters retain bilingual procedures and clear evidence boundaries',()=>{
 assert.equal(practiceChapters.length,4);for(const c of practiceChapters){for(const lang of ['en','th']){assert.ok(c.body[lang].length>2500,c.id+lang);assert.ok((c.body[lang].match(/^## /gm)||[]).length>=3);}assert.equal(c.reviewed,'2026-10-15');assert.ok(c.sources.length>=2);}
 const uncertainty=practiceChapters.find(c=>c.id==='uncertainty-worked');const u=Math.sqrt(.5**2*50**2+1000**2*.05**2);assert.equal(u.toFixed(2),'55.90');for(const n of [(500-1.96*u).toFixed(2),(500+1.96*u).toFixed(2),Math.sqrt(200-2*.8*100).toFixed(2)]){assert.ok(uncertainty.body.en.includes(n));assert.ok(uncertainty.body.th.includes(n));}assert.match(uncertainty.body.en,/hypothetical/);assert.match(uncertainty.body.en,/not current grid/);
 const review=practiceChapters.find(c=>c.id==='critical-review').body.en;assert.match(review,/cannot certify field accuracy/);assert.match(review,/counterfactual/);assert.match(review,/not a claim that any one explanation/);
});
