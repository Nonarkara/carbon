import {clickControl} from './browser-controls.mjs';
import {chromium} from 'playwright';import assert from 'node:assert/strict';
import {measurementTarget} from './lib/local-server.mjs';
const target=await measurementTarget(),browser=await chromium.launch();
try{
 const page=await browser.newPage();await page.goto(target.base+'/?lang=en');
 const result=await page.evaluate(async()=>{
  const {createEvidenceTask}=await import('/js/evidence-task.js');const {validateBoundary}=await import('/js/geometry.js');
  const circle=n=>{const ring=Array.from({length:n},(_,i)=>[100+.01*Math.cos(i*2*Math.PI/n),14+.01*Math.sin(i*2*Math.PI/n)]);ring.push([...ring[0]]);return {type:'Polygon',coordinates:[ring]};};
  const task=createEvidenceTask(),small=circle(1000),expected=validateBoundary(small),actual=await task.run('boundary',small);
  let last=performance.now(),maxGap=0,beats=0;const interval=setInterval(()=>{const now=performance.now();maxGap=Math.max(maxGap,now-last);last=now;beats++;},50);
  const started=performance.now();await task.run('boundary',circle(5000));const durationMs=performance.now()-started;clearInterval(interval);
  const pending=task.run('boundary',circle(5000));setTimeout(()=>task.cancel(),30);let cancelled=false;try{await pending;}catch(e){cancelled=e.message==='invalid:cancelled';}
  const {readGrid,sumSelection}=await import('/js/ledger.js');const manifest=await fetch('/data/ledger/manifest.json').then(r=>r.json());const grid=readGrid(await fetch('/data/ledger/grid.bin').then(r=>r.arrayBuffer()),manifest.grid);
  const selection={polygons:[[[[100,14],[100.2,14],[100.1,14.2],[100,14]]]]};const sumExpected=sumSelection(grid,selection),sumActual=await task.run('landscape',{grid,selection});
  return {expected,actual,durationMs,maxGap,beats,cancelled,sumExpected,sumActual};
 });
 assert.deepEqual(result.sumActual,result.sumExpected,'worker aggregation preserves every layer and covariance');
 assert.deepEqual(result.actual,result.expected,'worker topology and geodesic area identical to pure validator');
 assert.ok(result.beats>=2,'large validation did not yield UI heartbeat');assert.ok(result.maxGap<1000,`main thread blocked ${result.maxGap}ms`);assert.ok(result.cancelled);
 for(const mode of ['province','reset']){
  const p=await browser.newPage({viewport:{width:1440,height:900}});
  await p.addInitScript(()=>{const NativeWorker=window.Worker;window.landscapeJobs=0;window.Worker=class extends NativeWorker{postMessage(data,...rest){if(data.kind==='landscape'){window.landscapeJobs++;setTimeout(()=>super.postMessage(data,...rest),500);}else super.postMessage(data,...rest);}};});
  await p.goto(target.base+'/?lang=en');await p.locator('#kStock').filter({hasText:'M'}).waitFor();
  await clickControl(p,'.advanced-tools>summary');await clickControl(p,'.lenses [data-tab=project]');
  const boundary={type:'Feature',properties:{name:'cancel-test'},geometry:{type:'Polygon',coordinates:[[[100,14],[100.2,14],[100.1,14.2],[100,14]]]}};
  await p.locator('#boundaryFile').setInputFiles({name:'cancel-test.geojson',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(boundary))});await p.locator('#boundaryInfo').filter({hasText:'cancel-test.geojson'}).waitFor();
  await clickControl(p,'.advanced-tools>summary');await clickControl(p,'.lenses [data-tab=carbon]');await p.locator('#useBoundary').click();await p.waitForFunction(()=>window.landscapeJobs>0);
  if(mode==='province'){await p.locator('#place').selectOption('TH50');await p.waitForFunction(()=>document.querySelector('#carbonVerdict').textContent.startsWith('Chiang Mai'));}
  else {await clickControl(p,'.advanced-tools>summary');await clickControl(p,'.lenses [data-tab=project]');await p.locator('#reset').click();await p.waitForFunction(()=>document.querySelector('#place').value==='TH');}
  await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  assert.ok(!/Cannot read|reading .getBounds/.test(await p.locator('#message').textContent()),'cancelled caller must not write an error over newer task');
  assert.equal(await p.locator('#place').inputValue(),mode==='province'?'TH50':'TH');await p.close();
 }
 console.log(JSON.stringify({check:'worker identity, heartbeat and scoped cancellation',durationMs:result.durationMs,maxGap:result.maxGap,beats:result.beats,result:'PASS'}));
}finally{await browser.close();await target.stop();}
