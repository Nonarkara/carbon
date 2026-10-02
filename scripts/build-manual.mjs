import {readFile} from 'node:fs/promises';
import {marked} from 'marked';
export async function manual(lang,reference){
 const th=lang==='th',quick=marked.parse(await readFile(`docs/QUICKSTART.${lang}.md`,'utf8'));
 const linkedQuick=quick.replaceAll('href="https://carbon.nonarkara.org/', 'target="_blank" rel="noopener" href="https://carbon.nonarkara.org/');
 const chunks=reference.split(/(?=<h2>)/),intro=chunks.shift();
 const details=chunks.map((chunk,i)=>chunk.replace(/^<h2>(.*?)<\/h2>([\s\S]*)$/,(_,title,body)=>`<details class="reference-chapter" id="reference-${i}"><summary>${title}</summary><div>${body}</div></details>`)).join('');
 const links=[['province',th?'เปรียบเทียบจังหวัด':'Compare provinces'],['area',th?'เลือกพื้นที่':'Select an area'],['project',th?'คำนวณโครงการ':'Calculate a project'],['layers',th?'ชั้นข้อมูลและข้อมูลโลก':'Layers & world data'],['install',th?'Android และ iPhone':'Android & iPhone'],['help',th?'แก้ปัญหา':'Troubleshooting'],['reference',th?'รายละเอียดอ้างอิง':'Detailed reference']];
 return `<div class="manual-layout"><aside class="manual-index"><img class="manual-brand" src="images/brand/ct-monochrome.png" alt="คาบอนนะ Thailand · forest carbon"><b>${th?'คุณต้องการทำอะไร':'What do you need to do?'}</b>${links.map(([id,label])=>`<a href="#${id}">${label}</a>`).join('')}<a class="manual-open" href="/?lang=${lang}" target="_blank" rel="noopener">${th?'เปิดระบบอีกแท็บ ↗':'Open system in another tab ↗'}</a></aside><article class="manual-content">${linkedQuick}<section id="reference"><h2>${th?'รายละเอียดอ้างอิง · เปิดเฉพาะเรื่องที่ต้องใช้':'Detailed reference · open only what you need'}</h2><details class="reference-chapter"><summary>${th?'ขอบเขตของระบบ':'System scope'}</summary>${intro}</details>${details}</section></article></div>`;
}
