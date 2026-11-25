import test from 'node:test';import assert from 'node:assert/strict';
import {createEvidenceTask} from '../public/js/evidence-task.js';
class FakeWorker {static all=[];constructor(){FakeWorker.all.push(this);}terminate(){this.stopped=true;}postMessage(data){this.input=data;}}
test('new evidence owns its worker; old result cannot settle replacement and cancel terminates it',async()=>{
 const task=createEvidenceTask({WorkerClass:FakeWorker,timeoutMs:500});
 const first=task.run('boundary',{private:'local'});const rejected=assert.rejects(first,/cancelled/);const old=FakeWorker.all.at(-1);
 const second=task.run('project','local draft');await rejected;assert.ok(old.stopped);
 old.onmessage({data:{ok:true,value:'stale'}});const current=FakeWorker.all.at(-1);current.onmessage({data:{ok:true,value:{hectares:1}}});assert.deepEqual(await second,{hectares:1});assert.ok(current.stopped);
 const third=task.run('boundary',{});const cancelled=assert.rejects(third,/cancelled/);task.cancel();await cancelled;
});
test('unavailable worker never falls back to blocking synchronous geometry; timeout releases owned worker',async()=>{
 await assert.rejects(createEvidenceTask({WorkerClass:null}).run('boundary',{}),/workerUnavailable/);
 const task=createEvidenceTask({WorkerClass:FakeWorker,timeoutMs:5});await assert.rejects(task.run('boundary',{}),/validationTimeout/);assert.ok(FakeWorker.all.at(-1).stopped);
});
