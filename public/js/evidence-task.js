// Expensive topology runs off the UI thread. New work owns and terminates the old worker.
// Never fall back to synchronous validation: that would restore the measured multi-second freeze.
export function createEvidenceTask({WorkerClass=globalThis.Worker,timeoutMs=120000}={}){
 let active;
 const cancel=()=>{active?.cancel();};
 const run=(kind,payload)=>{
  cancel();
  return new Promise((resolve,reject)=>{
   if(!WorkerClass){reject(Error('invalid:workerUnavailable'));return;}
   const worker=new WorkerClass(new URL('./evidence-worker.js',import.meta.url),{type:'module'});
   let finished=false;
   const end=(error,value)=>{if(finished)return;finished=true;clearTimeout(timer);worker.terminate();if(active?.worker===worker)active=null;error?reject(error):resolve(value);};
   const timer=setTimeout(()=>end(Error('invalid:validationTimeout')),timeoutMs);
   active={worker,cancel:()=>end(Error('invalid:cancelled'))};
   worker.onmessage=({data})=>data?.ok===true?end(null,data.value):end(Error(data?.error||'invalid:projectFile'));
   worker.onerror=()=>end(Error('invalid:workerUnavailable'));
   worker.postMessage({kind,payload});
  });
 };
 return {run,cancel};
}
