// Place each credit-teaching figure beside the paragraph it explains.
//
// The three credit chapters put every figure in one block at the top of the article, so the
// reader met 2,000–3,500px of diagram before the first sentence of the chapter, and each figure
// sat far from the paragraph that explains it. The owner's law says it plainly: "Explanations
// stay with the decision they support." This inserts a marker into the chapter body and the
// browser fills it with the generated figure.
//
// Usage: node scripts/place-credit-figures.mjs [--check]
import {readFileSync,writeFileSync} from 'node:fs';

const MARK='<div data-figure="KEY"></div>';
// key -> [English anchor, Thai anchor]. Each anchor must match exactly one paragraph per language.
const PLACEMENT={
 'sea-what-is-a-credit':[
  ['credit-physics','simply making the air "dirty"','ไม่ใช่แค่ทำให้อากาศ'],
  ['credit-layers','the layer the weather is made of','ชั้นที่สภาพอากาศเกิดขึ้น'],
  ['credit-anatomy','A credit is not a product','เครดิตไม่ใช่สินค้าที่ใครผลิต']],
 'sea-borders':[
  ['border-article6','nothing was emitted','ไม่มีการปล่อย'],
  ['border-ledger','The asymmetry is the story','ความไม่สมมาตรคือประเด็นหลัก']],
 'sea-industry':[
  ['industry-issuance','Two cautions before reading anything into this table','ข้อควรระวังสองข้อก่อนอ่านตารางนี้'],
  ['industry-gap','65.76 Mt CO₂ was retired','มีการยกเลิกเครดิต 65.76 ล้านตัน']],
};

const check=process.argv.includes('--check');
let changed=0;
for(const [id,placements] of Object.entries(PLACEMENT)){
 const path=`docs/bible/sea/${id}.md`;
 const src=readFileSync(path,'utf8');
 const split=src.indexOf('<!-- TH -->');
 if(split<0)throw Error(`${id}: no Thai half`);
 const halves=[src.slice(0,split),src.slice(split)];
 const out=[];
 for(let h=0;h<2;h++){
  const anchor=placements.map(p=>p[1+h]);
  let text=halves[h];
  for(const [i,[key]] of placements.entries()){
   if(text.includes(`data-figure="${key}"`))continue;
   const a=anchor[i];
   // Split into blocks separated by blank lines; find the one paragraph that holds the anchor.
   const blocks=text.split(/\n\s*\n/);
   const hits=blocks.map((b,idx)=>[b,idx]).filter(([b])=>b.includes(a));
   if(hits.length!==1)throw Error(`${id} [${h===0?'en':'th'}] ${key}: anchor "${a}" matched ${hits.length} blocks`);
   const [block,idx]=hits[0];
   const marker=block.includes('data-figure=')?'':MARK.replace('KEY',key);
   blocks[idx]=block+'\n\n'+marker;
   text=blocks.join('\n\n');
  }
  out.push(text);
 }
 const next=out[0]+out[1];
 if(next!==src){changed++;if(!check)writeFileSync(path,next);}
}
console.log(`${check?'checked':'placed'} ${Object.keys(PLACEMENT).length} chapters, ${changed} file(s) ${check?'changed':'written'}`);
