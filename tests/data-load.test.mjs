import test from 'node:test';
import assert from 'node:assert/strict';
import {createDataLoader} from '../public/js/data-load.js';

test('a rejected source can be retried and successful immutable data is shared',async()=>{
 let attempts=0;
 const loader=createDataLoader({fetchImpl:async()=>++attempts===1?new Response('offline',{status:503}):new Response('{"value":7}')});
 await assert.rejects(loader.loadJSON('source.json'),/http:503/);
 assert.equal(loader.resourceStatus('source.json').status,'unavailable');
 const [a,b]=await Promise.all([loader.loadJSON('source.json'),loader.loadJSON('source.json')]);
 assert.equal(attempts,2);assert.equal(a,b);assert.equal(a.value,7);assert.ok(Object.isFrozen(a));
 assert.equal(loader.resourceStatus('source.json').status,'ready');
});
test('invalid JSON and invalid contracts do not poison the retry cache',async()=>{
 const replies=['{bad','{"value":null}','{"value":0}'];
 const loader=createDataLoader({fetchImpl:async()=>new Response(replies.shift())});
 const options={validate:v=>Number.isFinite(v.value)};
 await assert.rejects(loader.loadJSON('source',options));await assert.rejects(loader.loadJSON('source',options),/invalid/);
 assert.deepEqual(await loader.loadJSON('source',options),{value:0});
 await assert.rejects(loader.loadJSON('source',{validate:v=>v.value>0}),/invalid/,'stricter cache consumers still validate');
});
test('streamed body size is bounded even when Content-Length is absent',async()=>{
 const loader=createDataLoader({fetchImpl:async()=>new Response('12345678')});
 await assert.rejects(loader.loadBinary('large',{maxBytes:4}),/tooLarge/);
 assert.equal(loader.resourceStatus('large').status,'unavailable');
});
test('timeout aborts a stalled source and frees the attempt for retry',async()=>{
 let attempts=0;
 const loader=createDataLoader({timeoutMs:15,fetchImpl:async(url,{signal})=>++attempts>1?new Response('{}'):new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError'))))});
 await assert.rejects(loader.loadJSON('slow'),{name:'AbortError'});
 assert.equal(loader.resourceStatus('slow').reason,'timeout');assert.deepEqual(await loader.loadJSON('slow'),{});
});
