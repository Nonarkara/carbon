import {readFile,writeFile} from 'node:fs/promises';
import {marked} from 'marked';
import {execFileSync} from 'node:child_process';
const commit=execFileSync('git',['rev-parse','--short','HEAD'],{encoding:'utf8'}).trim();
for(const lang of ['th','en']){
 const th=lang==='th';
 const source=await readFile(`docs/RESEARCH.${lang}.md`,'utf8');
 const diagrammed=source.replace(/```mermaid\n([\s\S]*?)```/g,(_,body)=>{
  const nodes=[...body.matchAll(/\w+\["([^"]+)"\]/g)].map(m=>m[1]);
  return `<figure class="research-diagram"><figcaption>${th?'เส้นทางของหลักฐาน':'Follow the evidence'}</figcaption><ol>`+nodes.map(n=>`<li>${n}</li>`).join('')+'</ol></figure>';
 });
 const sections=[];
 const article=marked.parse(diagrammed).replace(/<h2>(.*?)<\/h2>/g,(_,title)=>{const id=`section-${sections.length+1}`;sections.push({id,title});return `<h2 id="${id}">${title}</h2>`;});
 const toc=`<aside class="research-toc" aria-label="${th?'สารบัญ':'Contents'}"><p>${th?'อ่านตามคำถาม':'Explore the questions'}</p><ol>${sections.map(s=>`<li><a href="#${s.id}">${s.title}</a></li>`).join('')}</ol></aside>`;
 const cut=article.indexOf('<h2');
 await writeFile(`public/research-${lang}.html`,`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${th?'คาร์บอนป่าไม้จากภาคสนามสู่หลักฐาน: สูตร ดาวเทียม AI และข้อมูลไทย โดย Dr Non Arkaraprasertkul':'Forest carbon from fieldwork to evidence: calculations, satellites, AI and Thai data. A research notebook by the Dr Non project.'}"><title>${th?'งานวิจัย':'Research'} · คาบอนนะ</title><link rel="icon" href="favicon.svg"><link rel="stylesheet" href="css/malaysia.css"><link rel="stylesheet" href="css/app.css"><link rel="stylesheet" href="css/guide.css"><link rel="stylesheet" href="css/research.css"><link rel="stylesheet" href="css/kabonna.css"></head><body class="guide research"><a class="skip-link" href="#article">${th?'ข้ามไปเนื้อหา':'Skip to article'}</a><nav aria-label="${th?'เมนูหลัก':'Main navigation'}"><a href="/?lang=${lang}">← ${th?'เครื่องมือ':'Workbench'}</a><a href="research-${th?'en':'th'}.html" lang="${th?'en':'th'}">${th?'English':'ภาษาไทย'}</a><a href="guide-${lang}.html">${th?'คู่มือ':'User guide'}</a><a href="https://github.com/Nonarkara/carbon">GitHub</a></nav><main id="article"><header class="research-intro">${article.slice(0,cut)}</header><div class="research-layout">${toc}<article>${article.slice(cut)}</article></div></main><footer>Forest Carbon Thailand · ${th?'งานวิจัยนำร่องอิสระ':'Independent research pilot'} · ${commit}</footer></body></html>`);
}
