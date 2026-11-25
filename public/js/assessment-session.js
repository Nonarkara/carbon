import {calculate,FACTORS,METHOD,plotEstimate,dateValue} from './carbon.js';
// A resumable file is private evidence, not a submitted or certified assessment.
// Two 2 MiB source files can expand when JSON-escaped; allow that expansion plus metadata.
export const MAX_SESSION=16*1024*1024;
export const FORM_FIELDS=['start','end','unit','previous','current','group','burnedPercent','canopyDeath','fireEmissions','inputSource','fireSource'];
const enums={unit:['agb','co2'],group:Object.keys(FACTORS),canopyDeath:['unknown','no','yes']};
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
const fail=()=>{throw Error('invalid:projectFile');};
function string(x,max=300){if(typeof x!=='string'||x.length>max)fail();return x;}
function provenance(x){if(x==null)return null;if(!plain(x))fail();const p={};for(const key of ['name','sha256','tier','importedAt'])if(x[key]!=null)p[key]=string(x[key],key==='name'?255:150);if(p.sha256&&!/^[a-f0-9]{64}$/.test(p.sha256))fail();return p;}
function form(raw){if(!plain(raw))fail();const f={};for(const k of FORM_FIELDS){f[k]=string(raw[k]??'',300);if(enums[k]&&!enums[k].includes(f[k]))fail();if(['start','end'].includes(k)&&f[k])dateValue(f[k]);if(['previous','current','burnedPercent','fireEmissions'].includes(k)&&f[k]&&(!Number.isFinite(Number(f[k]))||!f[k].trim()))fail();}return f;}
function rows(raw){if(raw==null)return null;if(!Array.isArray(raw)||!raw.length||raw.length>10000)fail();return raw.map(r=>{if(!plain(r))fail();return Object.fromEntries(['plot_id','tree_id','plot_area_m2','dbh_cm','height_m'].map(k=>[k,string(r[k],2*1024*1024)]));});}
export function createDraft({projectName,form:fields,boundary,boundaryFile,rows:treeRows,plotFile,plotUsed,equationConfirmed,sample,appVersion}){
 return {format:'carbona-project',schemaVersion:1,methodology:METHOD,appVersion,exportedAt:new Date().toISOString(),projectName,form:fields,boundary:boundary?.geojson??null,boundaryProvenance:boundaryFile,plotRows:treeRows,plotProvenance:plotFile,plotUsed:Boolean(plotUsed),equationConfirmed:Boolean(equationConfirmed),sample:Boolean(sample)};
}
export function readProject(text,validateBoundary){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_SESSION)throw Error('invalid:projectSize');
 let d;try{d=JSON.parse(text);}catch{fail();}if(!plain(d)||d.schemaVersion!==1)fail();
 if(d.methodology?.code!==METHOD.code||d.methodology?.version!==METHOD.version||d.methodology?.tool!==METHOD.tool)throw Error('invalid:projectMethod');
 let raw,legacy=false;
 if(d.format==='carbona-project')raw=d;
 else if(d.format===undefined&&plain(d.inputs)&&plain(d.result)){
  legacy=true;raw={...d,form:{...d.inputs,inputSource:d.inputs.source},boundary:d.boundary?.geojson??null,plotRows:d.plotEvidence?.rows??null,plotProvenance:d.plotEvidence?.file??null,plotUsed:!!d.plotEvidence,equationConfirmed:!!d.plotEvidence,sample:d.status==='illustrative-unverified-estimate'};
 }else fail();
 const fields=form(raw.form),boundary=raw.boundary==null?null:validateBoundary(raw.boundary),treeRows=rows(raw.plotRows);
 const confirmed=raw.equationConfirmed===true,plotUsed=raw.plotUsed===true;
 if(treeRows&&(!boundary||!confirmed))fail();const plots=treeRows?plotEstimate(treeRows,boundary.hectares):null;
 if(plotUsed&&(!plots||fields.unit!=='agb'||fields.group!=='general'||Number(fields.current)!==plots.agbTonnes))fail();
 const project={projectName:string(raw.projectName??'',150),form:fields,boundary,boundaryFile:provenance(raw.boundaryProvenance),rows:treeRows,plots,plotFile:provenance(raw.plotProvenance),plotUsed,equationConfirmed:confirmed,sample:raw.sample===true,result:null,input:null};
 // Drafts intentionally reopen uncalculated. Legacy completed exports recompute using this version's factors.
 if(legacy){const input={...fields,...FACTORS[fields.group],source:fields.inputSource.trim(),fireSource:fields.fireSource.trim()};if(!input.source)fail();const result=calculate(input);if(result.fireApplies&&!input.fireSource)fail();project.input=input;project.result=result;}
 return project;
}
export function publicURL(value){const u=new URL(value);u.hash='';return u;}
