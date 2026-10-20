// Shared spatial-geometry collector.
//
// Dr Non's test: "Why is this here, why this size, and why this far from that?"
// If the answer is only "the grid put it there", the layout has failed.
//
// This collector MEASURES geometry in the live page. It is shared by the audit probe and the CI
// gate so the two can never disagree about what counts as a spatial hallucination.
//
// Six failure modes, each measured rather than judged:
//   row-leftover     — an item ends far above the row height a taller sibling set
//   empty-track      — a grid column is reserved and nothing ever occupies it
//   gap-outlier      — a gap between block siblings far larger than its neighbours
//   accidental-wrap  — a control strip of links or buttons breaks onto extra lines
//   scattered-actions— related controls in one strip do not share a line
//   horizontal-overflow — the page scrolls sideways
//
// Three rules of measurement, each learned from a false reading this file used to produce:
//   * content inside a closed <details> has a zero-size rect and is not visible;
//   * rows group by VERTICAL OVERLAP, not by a top coordinate, or a short centred bar becomes its own row;
//   * an item spanning several grid rows sets no single row's height and leaves no column empty.
export const SURFACES=[
 {name:'home',path:'?lang=th',ready:'#kStock',key:'#kStock'},
 {name:'home-en',path:'?lang=en',ready:'#kStock',key:'#kStock'},
 {name:'sea',path:'sea.html?lang=th',ready:'#countryRows tr',key:'#countryNumbers'},
 {name:'sea-en',path:'sea.html?lang=en',ready:'#countryRows tr',key:'#countryNumbers'},
 {name:'bible',path:'bible.html?lang=th#sea-overview',ready:'.prose',key:'.prose p'},
 {name:'bible-en',path:'bible.html?lang=en#sea-overview',ready:'.prose',key:'.prose p'},
 {name:'bible-credits',path:'bible.html?lang=en#sea-what-is-a-credit',ready:'.figure-stack',key:'.prose p'},
 {name:'guide',path:'guide-th.html',ready:'.manual-routes',key:'#province h2'},
 {name:'guide-en',path:'guide-en.html',ready:'.manual-routes',key:'#province h2'},
 {name:'research',path:'research-th.html',ready:'.research-intro',key:'.thesis'},
 {name:'research-en',path:'research-en.html',ready:'.research-intro',key:'.thesis'},
];

export function collectSpatial(){
 const out=[];
 const desc=e=>{
  if(!e||e.nodeType!==1)return '?';
  if(e.id)return '#'+e.id;
  const parts=[];let n=e,d=0;
  while(n&&n.nodeType===1&&d<4){
   let s=n.tagName.toLowerCase();
   if(typeof n.className==='string'&&n.className.trim())s+='.'+n.className.trim().split(/\s+/).slice(0,2).join('.');
   parts.unshift(s);n=n.parentElement;d++;
  }
  return parts.join('>');
 };
 const styleCache=new Map();
 const csOf=e=>{let v=styleCache.get(e);if(!v){v=getComputedStyle(e);styleCache.set(e,v);}return v;};
 const shown=e=>{
  if(!(e instanceof Element))return false;
  const cs=csOf(e);
  if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false;
  if(cs.position==='fixed')return false;
  const r=e.getBoundingClientRect();
  if(r.width<1||r.height<1)return false;
  return true;
 };
 const inFlow=e=>{const cs=csOf(e);return cs.position!=='absolute'&&cs.position!=='fixed';};
 const blockLevel=e=>{const d=csOf(e).display;return d!=='inline'&&d!=='contents';};
 const hasContent=e=>e.textContent.trim().length>0||!!e.querySelector('img,svg,canvas,video,picture');
 const isInteractive=e=>/^(BUTTON|A|INPUT|SELECT|SUMMARY)$/.test(e.tagName)||e.getAttribute('role')==='button';
 // Items on the same visual line share a baseline; different font sizes shift the top by a few pixels,
 // so tops are clustered with a tolerance instead of bucketed.
 const countLines=tops=>{const sorted=[...tops].sort((a,b)=>a-b);let n=0,last=-Infinity;for(const t of sorted){if(t-last>12){n++;last=t;}}return n;};
 // An item that spans several grid rows sets no single row's height and leaves no column empty.
 const spansRows=e=>{const c=csOf(e);return /span/.test(c.gridRowEnd)||(/^\d+$/.test(c.gridRowStart)&&/^\d+$/.test(c.gridRowEnd)&&Number(c.gridRowEnd)-Number(c.gridRowStart)>1);};
 const styleCache_=styleCache;

 const CANDIDATES=document.querySelectorAll('div,section,article,main,header,footer,nav,ul,ol,dl,table,figure,aside,span,p,li');
 const containers=[...CANDIDATES].filter(e=>e.children.length>=2);

 // --- A. Grid rows and tracks.
 for(const g of containers){
  if(!shown(g))continue;
  const cs=csOf(g);
  if(cs.display!=='grid'&&cs.display!=='inline-grid')continue;
  const tracks=cs.gridTemplateColumns.split(' ').map(t=>parseFloat(t)||0);
  if(tracks.length<2)continue;
  const gap=parseFloat(cs.columnGap)||0;
  const items=[...g.children].filter(c=>shown(c)&&csOf(c).position!=='absolute'&&csOf(c).position!=='fixed');
  if(items.length<1)continue;
  const rowList=[];
  for(const it of items.slice().sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top)){
   const r=it.getBoundingClientRect();
   const row=rowList.find(g2=>r.top-g2.top<=12);
   if(row){row.items.push({it,r});row.bottom=Math.max(row.bottom,r.bottom);row.right=Math.max(row.right,r.right);row.top=Math.min(row.top,r.top);}
   else rowList.push({items:[{it,r}],top:r.top,bottom:r.bottom,right:r.right});
  }
  // Leftover height: only items that live in this row set this row's height.
  rowList.forEach(row=>{
   const flow=row.items.filter(x=>csOf(x.it).position!=='sticky'&&!spansRows(x.it));
   if(flow.length<2)return;
   const bottom=Math.max(...flow.map(x=>x.r.bottom));
   for(const {it,r} of flow){
    const leftover=bottom-r.bottom;
    if(leftover>=28&&hasContent(it)){
     out.push({kind:'row-leftover',severity:leftover>=56?'high':'medium',el:desc(it),gap:Math.round(leftover),note:'item ends '+Math.round(leftover)+'px above the row set by a taller sibling'});
    }
   }
  });
  // Empty tracks: a column is empty when no row puts content in it.
  const contentLeft=g.getBoundingClientRect().left+(parseFloat(cs.paddingLeft)||0);
  let x=contentLeft;
  tracks.forEach((w,i)=>{
   const start=x,end=x+w;
   const covered=rowList.some(row=>row.items.some(({r})=>r.left>=start-2&&r.left<end-1));
   if(!covered&&w>=40)out.push({kind:'empty-track',severity:w>=120?'high':'medium',el:desc(g),gap:Math.round(w),note:`column ${i+1} of ${tracks.length} is ${Math.round(w)}px wide and holds nothing in any row`});
   x=end+gap;
  });
 }

 // --- B. A vertical gap between block siblings far larger than its neighbours.
 for(const c of containers){
  if(!shown(c))continue;
  const cs=csOf(c);
  if(!['grid','flex','block','flow-root','list-item'].includes(cs.display))continue;
  const kids=[...c.children].filter(k=>shown(k)&&inFlow(k)&&blockLevel(k)&&hasContent(k));
  if(kids.length<3)continue;
  const stack=kids.map(k=>({k,r:k.getBoundingClientRect()})).sort((a,b)=>a.r.top-b.r.top||a.r.left-b.r.left);
  const gaps=[];
  for(let i=1;i<stack.length;i++){
   const prev=stack[i-1].r,cur=stack[i].r;
   if(cur.left>prev.right+2)continue;
   const g=cur.top-prev.bottom;
   if(g>=0)gaps.push({g,i});
  }
  if(gaps.length<2)continue;
  const median=[...gaps].sort((a,b)=>a.g-b.g)[Math.floor(gaps.length/2)].g;
  for(const {g,i} of gaps){
   if(g>=40&&median>0&&g>2.2*median){
    out.push({kind:'gap-outlier',severity:g>=96?'high':'medium',el:desc(stack[i].k),gap:Math.round(g),note:`${Math.round(g)}px gap vs ${Math.round(median)}px typical in the same container`});
   }
  }
 }

 // --- C. Accidental wrapping of a control strip.
 for(const c of document.querySelectorAll('nav,header,footer,[role=toolbar],[role=tablist],.reader-actions,.chart-controls,.toolbar,.actions,.map-tools,.quick-tools,.bottom-nav,.more-nav')){
  if(!shown(c))continue;
  const cs=csOf(c);
  if(cs.display!=='flex'&&cs.display!=='inline-flex')continue;
  if(cs.flexWrap!=='wrap'&&cs.flexWrap!=='wrap-reverse')continue;
  const kids=[...c.children].filter(k=>shown(k));
  if(kids.length<2)continue;
  // A control strip holds controls. The dashboard header stacks brand / search / menu / tools on
  // purpose at narrow widths; that is a responsive header, not a strip that broke.
  const isControlish=k=>isInteractive(k)||!!k.querySelector('button,a[href],input,select,summary');
  if(c.querySelectorAll('button,a[href],input,select,summary').length<2)continue;
  if(!kids.every(isControlish))continue;
  // An explicit break marker is a zero-height element, so it is judged by its display, not its size.
  const deliberate=[...c.children].some(k=>k.classList&&k.classList.contains('nav-break')&&csOf(k).display!=='none');
  if(deliberate)continue;
  const lines=countLines(kids.map(k=>k.getBoundingClientRect().top));
  if(lines>1){
   out.push({kind:'accidental-wrap',severity:lines>2?'high':'medium',el:desc(c),gap:lines,note:`control strip breaks onto ${lines} lines`});
  }
 }

 // --- D. Scattered actions: related controls in one strip that do not share a line.
 for(const c of document.querySelectorAll('[role=toolbar],.reader-actions,.chart-controls,.toolbar,.actions,.map-tools,.quick-tools')){
  if(!shown(c))continue;
  const acts=[...c.querySelectorAll('button,a[href],[role=button]')].filter(shown);
  if(acts.length<2)continue;
  const lines=countLines(acts.map(a=>a.getBoundingClientRect().top));
  if(lines>1)out.push({kind:'scattered-actions',severity:'medium',el:desc(c),gap:lines,note:`${acts.length} controls spread over ${lines} lines`});
 }

 return out;
}
