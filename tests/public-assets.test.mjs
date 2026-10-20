import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {join,dirname,resolve,relative,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=resolve(fileURLToPath(import.meta.url),'..','..');
const PUBLIC=join(ROOT,'public');

async function walk(dir,out=[]){
 for(const name of await readdir(dir)){
  const p=join(dir,name);
  const s=await stat(p);
  if(s.isDirectory())await walk(p,out);else out.push(p);
 }
 return out;
}

const files=await walk(PUBLIC);
const jsFiles=files.filter(f=>extname(f)==='.js');
const htmlFiles=files.filter(f=>extname(f)==='.html');

test('No browser module imports from outside public/',async()=>{
 // The site serves public/ and nothing else. A browser import that reaches into docs/, scripts/ or
 // src/ resolves to a 404, and because ES module imports are static, that one bad path takes the
 // whole page down. The credit figures once did exactly this.
 const problems=[];
 for(const f of jsFiles){
  const src=await readFile(f,'utf8');
  const specs=[...src.matchAll(/(?:^|[\s;])(?:import|export)[^'"`]*?from\s*['"]([^'"]+)['"]/g)].map(m=>m[1])
   .concat([...src.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g)].map(m=>m[1]))
   .concat([...src.matchAll(/\bimport\s+['"]([^'"]+)['"]/g)].map(m=>m[1]));
  for(const spec of specs){
   if(!spec.startsWith('.')&&!spec.startsWith('/'))continue;      // bare specifiers are packages
   const target=spec.startsWith('/')?join(PUBLIC,spec):resolve(dirname(f),spec);
   const rel=relative(PUBLIC,target);
   if(rel.startsWith('..')||rel.startsWith('/')){
    problems.push(`${relative(ROOT,f)} imports ${spec} — outside public/`);
    continue;
   }
   let ok=false;
   try{ok=(await stat(target)).isFile();}catch{ok=false;}
   if(!ok){
    // A directory import resolves to its index file.
    try{ok=(await stat(join(target,'index.js'))).isFile();}catch{ok=false;}
   }
   if(!ok)problems.push(`${relative(ROOT,f)} imports ${spec} — ${rel} does not exist`);
  }
 }
 assert.deepEqual(problems,[],problems.join('\n'));
});

test('No page reaches for a build-time or research directory',async()=>{
 // docs/ holds research and build-time modules; scripts/ holds the toolchain. Neither is served.
 const problems=[];
 for(const f of htmlFiles){
  const src=await readFile(f,'utf8');
  for(const m of src.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
   const ref=m[1];
   if(!ref.startsWith('/'))continue;
   if(/^\/(docs|scripts|src|tests|research|node_modules)\//.test(ref))problems.push(`${relative(ROOT,f)} references ${ref}`);
  }
 }
 assert.deepEqual(problems,[],problems.join('\n'));
});

test('Every published page loads its own stylesheets and scripts from public/',async()=>{
 // A stylesheet or module that 404s leaves the page unstyled or dead. Check the local references
 // each HTML file declares, which is the part a build can get wrong.
 const problems=[];
 for(const f of htmlFiles){
  const src=await readFile(f,'utf8');
  for(const m of src.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
   const ref=m[1];
   if(!ref||/^(https?:|data:|mailto:|#|\/\/)/.test(ref))continue;
   if(ref.startsWith('/'))continue;                        // site-root absolute paths are checked elsewhere
   // A partial is injected into a page served from the site root, so its relative paths resolve
   // from the root rather than from the partials directory.
   const base=dirname(f).endsWith(`${sep}partials`)?PUBLIC:dirname(f);
   const target=resolve(base,ref.split('?')[0].split('#')[0]);
   if(relative(PUBLIC,target).startsWith('..')){problems.push(`${relative(ROOT,f)} references ${ref} outside public/`);continue;}
   try{await stat(target);}catch{problems.push(`${relative(ROOT,f)} references ${ref} — missing`);}
  }
 }
 assert.deepEqual(problems,[],problems.join('\n'));
});
