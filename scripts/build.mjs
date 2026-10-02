import {manual} from './build-manual.mjs';
import {build} from 'esbuild';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {marked} from 'marked';
await build({entryPoints:['src/geometry.js'],outfile:'public/js/geometry.js',bundle:true,format:'esm',minify:true,target:'es2022',legalComments:'eof'});
for(const weight of [400,600])await copyFile(`node_modules/@fontsource/ibm-plex-sans-thai/files/ibm-plex-sans-thai-thai-${weight}-normal.woff2`,`public/vendor/fonts/ibm-plex-sans-thai-thai-${weight}-normal.woff2`);
const commit=execFileSync('git',['rev-parse','--short','HEAD'],{encoding:'utf8'}).trim();
await writeFile('public/version.json',JSON.stringify({version:'0.1.0',commit,builtAt:new Date().toISOString()})+'\n');
for(const lang of ['th','en']){
 const text=await readFile(`docs/GUIDE.${lang}.md`,'utf8');
 const diagrammed=text.replace(/```mermaid\n([\s\S]*?)```/g,(_,body)=>{const nodes=[...body.matchAll(/\w+\["([^"]+)"\]/g)].map(m=>m[1]);return '<div class="doc-diagram" aria-label="Workflow">'+nodes.map((n,i)=>`<div>${n}</div>${i<nodes.length-1?'<span aria-hidden="true">↓</span>':''}`).join('')+'</div>';});
 await writeFile(`public/guide-${lang}.html`,`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${lang==='th'?'คู่มือ':'User guide'} · Forest Carbon Thailand</title><link rel="icon" href="images/brand/icon-32.png"><link rel="apple-touch-icon" href="images/brand/icon-180.png"><link rel="stylesheet" href="css/malaysia.css"><link rel="stylesheet" href="css/app.css"><link rel="stylesheet" href="css/guide.css"><link rel="stylesheet" href="css/kabonna.css"></head><body class="guide manual"><nav><a href="/?lang=${lang}">← ${lang==='th'?'กลับไปเครื่องมือ':'Open workbench'}</a><a href="guide-${lang==='th'?'en':'th'}.html">${lang==='th'?'English':'ภาษาไทย'}</a><a href="research-${lang}.html">${lang==='th'?'งานวิจัย':'Research'}</a><a href="bible.html?lang=${lang}">Carbon Bible / TH-EN</a><a href="https://github.com/Nonarkara/carbon">GitHub</a></nav><main>${await manual(lang,marked.parse(diagrammed))}</main><footer>Forest Carbon Thailand · ${commit}</footer></body></html>`);
}
console.log('Built static site at',commit);

await import('./build-research.mjs');

await import('./build-bible.mjs');
