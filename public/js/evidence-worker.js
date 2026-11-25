// All project evidence stays in this browser worker. No storage or network API calls.
import {validateBoundary} from './geometry.js';
import {sumSelection} from './ledger.js';
import {readProject} from './assessment-session.js';
self.onmessage=({data})=>{
 try{
  const value=data.kind==='boundary'?validateBoundary(data.payload):data.kind==='project'?readProject(data.payload,validateBoundary):data.kind==='landscape'?sumSelection(data.payload.grid,data.payload.selection):null;
  if(!value)throw Error('invalid:workerTask');
  self.postMessage({ok:true,value});
 }catch(error){self.postMessage({ok:false,error:error.message||'invalid:projectFile'});}
};
