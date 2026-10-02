export function searchChapters(chapters,query,category='all'){
 const terms=query.normalize('NFKC').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
 const phrase=terms.join(' '),rank=c=>[c.title.en,c.title.th].some(t=>t.toLowerCase().includes(phrase))?3:[c.summary.en,c.summary.th].some(t=>t.toLowerCase().includes(phrase))?2:[c.body.en,c.body.th].some(t=>t.toLowerCase().includes(phrase))?1:0;
 return chapters.filter(c=>(category==='all'||c.group===category)&&terms.every(term=>`${c.title.en} ${c.title.th} ${c.summary.en} ${c.summary.th} ${c.body.en} ${c.body.th} ${c.id}`.normalize('NFKC').toLocaleLowerCase().includes(term))).sort((a,b)=>rank(b)-rank(a));
}
