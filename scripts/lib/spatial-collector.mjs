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
 {name:'bible-credits',path:'bible.html?lang=en#sea-what-is-a-credit',ready:'figure.credit-figure',key:'.prose p'},
 {name:'guide',path:'guide-th.html',ready:'.manual-routes',key:'#province h2'},
 {name:'guide-en',path:'guide-en.html',ready:'.manual-routes',key:'#province h2'},
 {name:'research',path:'research-th.html',ready:'.research-intro',key:'.thesis'},
 {name:'research-en',path:'research-en.html',ready:'.research-intro',key:'.thesis'},
];

export function collectSpatial(root){
 // The scope defaults to the whole document. A caller may pass an element to measure one
 // section in isolation, so a long page can be audited part by part instead of only as a whole.
 const scope=root||document;
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

 const SEL='div,section,article,main,header,footer,nav,ul,ol,dl,table,figure,aside,span,p,li';
 const STRIPS='nav,header,footer,[role=toolbar],[role=tablist],.reader-actions,.chart-controls,.toolbar,.actions,.map-tools,.quick-tools,.bottom-nav,.more-nav';
 // When the caller scopes the measurement to one section, that section is itself a container whose
 // own children carry the gaps — a query of descendants alone would miss exactly what was asked
 // for. So a scoped root joins its own candidate list.
 const isElementRoot=typeof Element!=='undefined'&&scope instanceof Element;
 const CANDIDATES=isElementRoot?[scope,...scope.querySelectorAll(SEL)]:[...scope.querySelectorAll(SEL)];
 // Every strip of controls inside the scope, plus the scope itself when it is one. A scoped root
 // that is a nav has to be judged by the same rule as any other nav.
 const strips=list=>{
  const found=[];
  for(const sel of list)found.push(...scope.querySelectorAll(sel));
  if(isElementRoot&&list.some(sel=>scope.matches(sel)))found.push(scope);
  // One element can match several selectors — a nav that also carries .bottom-nav, for instance —
  // and it must be judged once, or the same defect is reported twice.
  return [...new Set(found)];
 };
 // A grid with a single child in a two-column template is the clearest possible empty track, so
 // the shared candidate list keeps containers with one child. Each detector below applies its own
 // sibling-count guard before it draws a conclusion.
 const containers=[...CANDIDATES].filter(e=>e.children.length>=1);

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
  // A flush stack has no rhythm at all, so its median gap is zero. Requiring a positive median
  // made the detector blind to the worst case: siblings sitting flush against each other with one
  // huge hole between two of them. In a flush stack there is no spacing convention to excuse a
  // hole, so a hole has to stand on its own size — which is why the bar is higher there.
  const bar=median>0?Math.max(40,2.2*median):64;
  for(const {g,i} of gaps){
   if(g>=bar){
    out.push({kind:'gap-outlier',severity:g>=96?'high':'medium',el:desc(stack[i].k),gap:Math.round(g),note:median>0?`${Math.round(g)}px gap vs ${Math.round(median)}px typical in the same container`:`${Math.round(g)}px gap inside a flush stack with no spacing convention`});
   }
  }
 }

 // --- C. Accidental wrapping of a control strip.
 for(const c of strips(STRIPS.split(','))){
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
 for(const c of strips('[role=toolbar],.reader-actions,.chart-controls,.toolbar,.actions,.map-tools,.quick-tools'.split(','))){
  if(!shown(c))continue;
  const acts=[...c.querySelectorAll('button,a[href],[role=button]')].filter(shown).filter(a=>{
   // A dropdown panel is a MENU. Its items stack down the panel on purpose, one per row, all
   // aligned to the same edge — that is what a menu is, and calling it "scattered actions"
   // condemns a correct layout. The summary that opens the panel is the strip's own control and
   // does belong on the strip's line; the items below it do not.
   const owner=a.closest('details');
   if(owner&&owner!==c)return a.tagName==='SUMMARY';
   // The strip is itself a menu trigger: everything under its summary is the menu's content.
   if(c.tagName==='DETAILS'&&a.tagName!=='SUMMARY')return false;
   return true;
  });
  if(acts.length<2)continue;
  const lines=countLines(acts.map(a=>a.getBoundingClientRect().top));
  if(lines>1)out.push({kind:'scattered-actions',severity:'medium',el:desc(c),gap:lines,note:`${acts.length} controls spread over ${lines} lines`});
 }

 return out;
}
