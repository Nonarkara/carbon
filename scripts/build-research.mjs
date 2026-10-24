import {readFile,writeFile} from 'node:fs/promises';
import {auditView} from './audit-view.mjs';
import {wrapTables} from './lib/table-wrap.mjs';
import {marked} from 'marked';
import {execFileSync} from 'node:child_process';
const commit=execFileSync('git',['rev-parse','--short','HEAD'],{encoding:'utf8'}).trim();
for(const lang of ['th','en']){
 const th=lang==='th';
 const audit=JSON.parse(await readFile('public/data/scientific-audit.json','utf8'));
 const report=await readFile(`docs/ACADEMIC_AUDIT.${lang}.md`,'utf8');
 const source=(await readFile(`docs/RESEARCH.${lang}.md`,'utf8')).replace('<!-- academic-audit -->',report).replace('<!-- scientific-results -->',auditView(audit,lang));
 const diagrammed=source.replace(/```mermaid\n([\s\S]*?)```/g,(_,body)=>{
  const nodes=[...body.matchAll(/\w+\["([^"]+)"\]/g)].map(m=>m[1]);
  return `<figure class="research-diagram"><figcaption>${th?'เส้นทางของหลักฐาน':'Follow the evidence'}</figcaption><ol>`+nodes.map(n=>`<li>${n}</li>`).join('')+'</ol></figure>';
 });
 const sections=[];
 const article=marked.parse(diagrammed).replace(/<h2>(.*?)<\/h2>/g,(_,title)=>{const id=`section-${sections.length+1}`;sections.push({id,title});return `<h2 id="${id}">${title}</h2>`;});
 // The contents is a rail beside the text on a wide screen and a stack of 23 links on a
 // phone. On a phone it is folded into one line that opens on demand — the reader asks for
 // the contents when they want it, instead of scrolling past it to reach a sentence.
 const toc=`<details class="research-toc" data-collapsible open><summary>${th?`สารบัญ · ${sections.length} บท`:`Contents · ${sections.length} chapters`}</summary><p>${th?'อ่านตามคำถาม':'Explore the questions'}</p><ol>${sections.map(s=>`<li><a href="#${s.id}">${s.title}</a></li>`).join('')}</ol></details>`;
 const cut=article.indexOf('<h2');
 let intro=wrapTables(article.slice(0,cut));
 // The thesis-parts table is a second index: it maps each part of the thesis to the section
 // that argues it. Beside the text it is orientation; stacked above the text on a phone it
 // is 800px of navigation before the first word. Folded into one line, it keeps the job and
 // gives the space back.
 intro=intro.replace(/(<div class="table-scroll">[\s\S]*?<\/div>)/,`<details class="research-parts" data-collapsible open><summary>${th?'ส่วนของวิทยานิพนธ์ และจุดที่โต้แย้ง':'Thesis parts and where they are argued'}</summary>$1</details>`);
 const body=wrapTables(article.slice(cut));
 await writeFile(`public/research-${lang}.html`,`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${th?'คาร์บอนป่าไม้จากภาคสนามสู่หลักฐาน: สูตร ดาวเทียม AI และข้อมูลไทย โดย Dr Non Arkaraprasertkul':'Forest carbon from fieldwork to evidence: calculations, satellites, AI and Thai data. A research notebook by the Dr Non project.'}"><title>${th?'งานวิจัย':'Research'} · คาร์บอนนะ</title><link rel="icon" href="images/brand/icon-32.png"><link rel="apple-touch-icon" href="images/brand/icon-180.png"><link rel="stylesheet" href="css/malaysia.css"><link rel="stylesheet" href="css/app.css"><link rel="stylesheet" href="css/guide.css"><link rel="stylesheet" href="css/research.css"><link rel="stylesheet" href="css/kabonna.css"><link rel="stylesheet" href="css/type.css"><link rel="stylesheet" href="css/reading.css"><link rel="stylesheet" href="css/flat-controls.css"></head><body class="guide research"><a class="skip-link" href="#section-1">${th?'ข้ามไปเนื้อหา':'Skip to article'}</a><nav aria-label="${th?'เมนูหลัก':'Main navigation'}"><a href="/?lang=${lang}">← ${th?'เครื่องมือ':'Workbench'}</a><a href="research-${th?'en':'th'}.html" lang="${th?'en':'th'}">${th?'English':'ภาษาไทย'}</a><a href="guide-${lang}.html">${th?'คู่มือ':'User guide'}</a><span class="nav-break" aria-hidden="true"></span><a href="bible.html?lang=${lang}">Carbon Bible</a><a href="https://github.com/Nonarkara/carbon">GitHub</a></nav><main id="article"><header class="research-intro"><aside class="research-byline"><div class="product-identity"><img class="research-brand" src="images/brand/ct-mark.png" alt=""><b>${th?'คาร์บอนนะ':'Carbona'}</b></div><img class="author-photo" src="images/dr-non.jpg" alt="Dr Non Arkaraprasertkul"><p><b>${th?'ดร.นนท์':'Dr Non'}</b><a href="#section-9">${th?'ผู้ริเริ่มโครงการ · ประวัติ':'Project initiator · profile'}</a></p></aside>${intro}</header><div class="research-layout">${toc}<article>${body}</article></div></main><footer>Carbona · ${th?'งานวิจัยนำร่องอิสระ':'Independent research pilot'} · ${commit}</footer><script src="js/research.js" defer></script></body></html>`);
}
