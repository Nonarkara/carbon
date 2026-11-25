// Public, immutable source files only. Failed attempts are never cached as data.
// A document shares transport/parsing; each consumer keeps its own view state.
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};

export function createDataLoader({fetchImpl=(...args)=>fetch(...args),timeoutMs=15000}={}){
  const cache=new Map(),states=new Map();
  const keyFor=(url,kind)=>`${kind}:${url}`;
  async function request(url,kind,{validate=()=>true,maxBytes=8*1024*1024,timeoutMs:limit=timeoutMs}={}){
    const key=keyFor(url,kind);
    let promise=cache.get(key);
    if(!promise){
      states.set(url,{status:'loading',checkedAt:new Date().toISOString()});
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),limit);
      promise=(async()=>{
        const response=await fetchImpl(url,{signal:controller.signal});
        if(!response.ok)throw Error(`data:http:${response.status}`);
        if(Number(response.headers.get('content-length'))>maxBytes)throw Error('data:tooLarge');
        const reader=response.body.getReader(),chunks=[];let length=0;
        try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>maxBytes)throw Error('data:tooLarge');chunks.push(value);}}
        catch(error){await reader.cancel().catch(()=>{});throw error;}
        const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
        const value=kind==='json'?freeze(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))):bytes.buffer;
        if(!validate(value))throw Error('data:invalid');
        states.set(url,{status:'ready',checkedAt:new Date().toISOString(),bytes:length});
        return value;
      })().catch(error=>{cache.delete(key);states.set(url,{status:'unavailable',checkedAt:new Date().toISOString(),reason:error.name==='AbortError'?'timeout':String(error.message||'data:failed')});throw error;}).finally(()=>clearTimeout(timer));
      cache.set(key,promise);
    }
    const value=await promise;
    // A stricter second consumer must not bypass its contract through the cache.
    if(!validate(value)){cache.delete(key);states.set(url,{status:'unavailable',checkedAt:new Date().toISOString(),reason:'data:invalid'});throw Error('data:invalid');}
    return value;
  }
  return {loadJSON:(url,options)=>request(url,'json',options),loadBinary:(url,options)=>request(url,'binary',options),resourceStatus:url=>({...states.get(url)||{status:'idle'}})};
}
const shared=createDataLoader();
export const {loadJSON,loadBinary,resourceStatus}=shared;
