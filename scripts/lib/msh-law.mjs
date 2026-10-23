// The MSH instrument — the parts of the owner's law that measure CHROME and the five symptom
// classes the geometric collector cannot see.
//
// docs/MSH.md is the law. This file is its mechanical half. Two parts:
//
//   1. chromeCost()  — the top and bottom band each viewport gives to page furniture, as pixels
//      and as a share of the viewport. The law: "Chrome cost: top/bottom chrome height and
//      percentage of viewport height; include the combined height of stacked fixed or sticky
//      regions."
//
//   2. collectLaw()  — the five symptom classes the geometric collector does not cover:
//        giant-top-bar    — a chrome band that eats a share of the screen it cannot justify
//        inflated-control — a control far larger than the label it carries
//        empty-hero       — a region with height and no content
//        overlapping-chrome— fixed/sticky furniture covering the work
//        equal-weight     — a row of identical blocks with no reading priority
//
// EVERY THRESHOLD IN HERE IS DERIVED FROM A MEASUREMENT OF THIS PROJECT, not from taste. The
// numbers come from a sweep of all ten surfaces at 390, 1024 and 1440 (see the reasoning beside
// each one). A threshold set by imagination condemns correct layouts, and a rule that condemns a
// correct layout is worse than no rule at all.
//
// Three rules of measurement, each learned the hard way:
//   * A band is measured against the CONTENT COLUMN, not against the viewport. A sticky sidebar
//     beside the text costs the reader nothing; a band across the text costs them the top of
//     every page. Measuring the sidebar as chrome would have invented a finding.
//   * A control's "inflated" size is judged against its OWN label and against its SIBLINGS on the
//     same row. A full-width link in a one-item menu column is a deliberate list row; a button
//     stretched to 328px while its label needs 66px, beside a sibling that fits its own label, is
//     the grid inventing space.
//   * Furniture that is STICKY is the page's own scroll furniture — content passes under it by
//     design. Furniture that is FIXED lies over the work permanently. And a fixed bar over
//     content in a long scrolling flow is not obscuring anything: the reader scrolls and it
//     comes into view. What a fixed bar does obscure is content CLIPPED to its own surface — a
//     map's attribution, pinned to the map's bottom edge by the map's own overflow:hidden, which
//     no scroll of that surface can ever move.
//
// This module is imported by the audit probe, the CI gate and the detector self-test, so all
// three can never disagree about what the law means.

/** The surfaces the law applies to, with the viewport heights the law names. */
export const LAW_VIEWPORTS=[
 {width:390,height:844,label:'phone'},
 {width:1024,height:768,label:'tablet'},
 {width:1440,height:900,label:'desktop'},
];

// --- Chrome cost -------------------------------------------------------------
//
// How much of the viewport does the furniture take? Measured as the band from the viewport top
// down to the first content, and the band from the viewport bottom up to the last content.
//
// The measurement is deliberately about the CONTENT COLUMN. A sticky index rail beside the
// reading column is not chrome the reader scrolls past — it is a different column. Only bands
// that sit ACROSS the content column cost the reader the screen.
//
// Measured values on this project, at 390x844:
//   bible      header 61px  = 7.2%   top
//   sea        header 51px  = 6.0%   top
//   guide      nav   49px  = 5.8%   top
//   research   nav   49px  = 5.8%   top
//   home       nav   57px  = 6.8%   bottom
// The largest band measured anywhere is 11.5%, on the 320px phone where the nav stacks.
//
// The threshold is set at 25%: a band that takes a quarter of the screen before the task is
// visible is not "a bit tall", it is the layout telling the reader where to look instead of
// showing them what they came for. Nothing in this project is near it, which is the point — the
// detector is a guard, not a critique of what is already correct.
export const CHROME_LIMIT_PCT=25;

// --- Overlapping chrome ------------------------------------------------------
//
// The law: "Overlapping chrome | Fixed or sticky regions obscure the work | Account for their
// occupied area and reduce their footprint."
//
// The test is not "do two boxes touch". It is "is the covered thing still READABLE". A band that
// overlaps a decorative hairline is fine; a band that covers a legal attribution, a credit line
// or a button is not.
//
// The evidence for why this needs its own rule: on the phone the home workbench's fixed bottom
// nav sat exactly on top of the map's Leaflet attribution. The attribution was 13px tall and
// 172px wide, completely under a 57px nav, and `elementFromPoint` at its centre returned the
// nav's BUTTON, not the attribution. The OpenStreetMap credit was invisible AND unclickable on
// the primary map surface. That is the law's "obscure the work" in its plainest form.
//
// So the rule is: a fixed/sticky band overlaps an element that carries text or is interactive,
// AND the hit test at the covered element's centre returns the BAND rather than the element.
// The hit test is what separates "two boxes touch" from "the user cannot reach this".
export const OVERLAP_MIN_PX=4;

// --- Inflated controls -------------------------------------------------------
//
// The law: "Inflated controls | Short labels inherit container-sized boxes | Size to label,
// padding, and usable interaction target."
//
// A control is judged against its own rendered text. The measurement measures the text with the
// control's OWN computed font, so a wide Thai string is not mistaken for a narrow English one.
//
// But a wide control is not automatically a bad control. A full-width link in a menu column is a
// deliberate list row: it is the only thing in its column, so the column width is the row's job.
// The law's own test — "Why is this here? Why this size?" — has an answer for that one.
//
// The defect is when a control is inflated RELATIVE TO ITS SIBLINGS on the same row: one item in
// a strip carries a short label but claims most of the row, while its neighbours are sized to
// theirs. That is the container inventing space for one child.
//
// Measured on this project: on the research page at 1024, a paragraph-level link measured 558px
// against a 117px median for its row — a single link holding five times the width of its peers.
// By contrast the Bible's chapter links are all 718px in one column, which is a list, not a
// stretched control.
//
// A control is reported when it exceeds its row's median by more than this, and by a real margin
// rather than by a rounding error.
export const INFLATED_MEDIAN_RATIO=1.8;
export const INFLATED_EXTRA_PX=100;

// --- Empty hero / spacer -----------------------------------------------------
//
// The law: "Empty hero or spacer | A section exists to manufacture importance | Remove the
// section or give real content its place."
//
// A region with height, width and no content at all. Measured as: a visible block element with
// real height and width, no text, and no media or interactive child.
//
// The threshold is 100px tall and 120px wide. A band shorter than that is a margin, and a
// margin is not a section.
export const EMPTY_MIN_H=100;
export const EMPTY_MIN_W=120;

// --- Equal weight ------------------------------------------------------------
//
// The law: "Equal-weight everything | Repetition replaces hierarchy | Establish a first, second,
// and third reading priority" and "Repeated equal-sized blocks flatten hierarchy and make the
// journey monotonous."
//
// A row of three or more sibling blocks that are the SAME size and carry the SAME label size
// flattens the hierarchy: nothing in the row is first.
//
// This is the law's softest class, because a row of peers is legitimate when the peers really
// ARE peers — a comparison table, a set of tabs, a row of peer citations. So the rule only fires
// where the blocks are content blocks (they carry a LABEL — a heading or a bold label — AND body
// text) rather than table rows or tabs, and where the row is long enough to establish a rhythm
// it then repeats.
//
// Measured on this project: the research page's six "pose" cards are two rows of three
// identical 226x359 blocks (at 1024) with the same 14px label — a row of peers.
//
// A row of peers is a finding only when the peers should not be peers. The law carves out the
// genuine peer set, so this rule needs to SEE a peer row before it can decide that one is
// legitimate. The first version of this rule could not see them: it looked for a heading
// (h1-h4) in each block, and these cards carry a bold label instead, so the row was skipped by
// construction and the audit's "no equal-weight findings" said nothing about them either way.
// Blindness is not a pass. The rule now reads a bold label as a label, and the genuine peer
// sets are exempted BY NAME below, with their measurement recorded.
//
// The exemption is deliberately self-limiting. It holds only while the named element really
// is an even peer set; if one card grows, or the grid strands one, the condition fails and the
// rule speaks again. An exemption that cannot be revoked is a hole, not an exemption.
//
// The exemption is DATA, not code, because the collector is serialized into the browser and
// cannot reach this module. A condition written as a function here would be invisible to the
// rule that is supposed to apply it — the same blindness, one level up.
export const EQUAL_MIN_BLOCKS=3;

/**
 * Genuine peer sets: a named element, the reason it is a peer set rather than a flattening,
 * and the conditions under which the exemption stops applying.
 *
 * @type {{selector:string,reason:string,expect:{count?:number,equalHeights?:boolean,evenGrid?:boolean,distinctLabels?:boolean}}[]}
 */
export const EQUAL_WEIGHT_EXEMPTIONS=[
 {
  selector:'.kabonna-poses',
  reason:'The six poses of the character are six peers of ONE thing. The section asks the reader to understand all six, ' +
   'and an order would be a fiction. Measured: 2 columns x 3 rows at 390 (173x333px), 3 x 2 at 1024 (226x378px), ' +
   '3 x 2 at 1440 (255x395px) — six identical blocks, each with its own illustration, label and one-line meaning, under a ' +
   'section heading. grid-auto-rows:1fr keeps the rows equal, so no card is taller than its peers and ' +
   'the grid divides the count exactly at every width, so no card is stranded.',
  // The exemption holds only while the peer set is intact: six items, six distinct labels, an
  // even grid, and one even row height. Break any of those — a card grows, a pose is added or
  // dropped, two poses end up with the same name — and the exemption is revoked and the rule
  // speaks again.
  expect:{count:6,equalHeights:true,evenGrid:true,distinctLabels:true},
 },
];

// --- Nested scroll areas -----------------------------------------------------
//
// The law: "Never force a fit by hiding overflow, clipping content, shrinking readable
// text, removing earned features, or MOVING EVERYTHING INTO NESTED SCROLL AREAS."
//
// This is the class that catches the research page's real defect, and the measurement
// behind it is exact. The old research table carried `display:block;overflow:auto` while
// the page wrapped every table in a `.table-scroll` frame. The result:
//
//   nested scrollers on research-th ......... 25   (one per table)
//   nested scrollers after the repair ....... 0
//   the frame the reader could see .......... never scrolled (range 0)
//   the scroller hiding the overflow ........ the table itself, 267px of overflow
//
// So the frame the page presented as the table's edge could not scroll, and the overflow
// lived in a second scroll area inside the table, where no scrollbar hints at it. The
// reader saw a table that appeared to end at the column edge while two of its five
// columns sat somewhere else entirely.
//
// THE AXIS IS THE PART THAT MATTERS, and the first version of this rule got it wrong. The
// rule originally fired on any nested pair where the inner scroller had overflow, and it
// condemned the Southeast Asia page: its evidence panel scrolls 462px inside the workspace
// frame. That layout is correct. On a phone the workspace fills the viewport below the
// chrome (718px of 844), the page itself does not scroll at all, and the panel IS the
// reading surface — the reader swipes and reads. Scroll delegation to the visible content
// area is the ordinary pattern.
//
// The defect is specifically a nested area that overflows SIDEWAYS: the reader is asked to
// swipe horizontally inside a box, in a document read from top to bottom, with nothing to
// say the box continues. That is the pattern with no cue, and it is the one the research
// tables had. A vertical inner scroller is the page's own reading surface, and is left
// alone.
export const NESTED_MIN_RANGE=1;

// --- Unreachable content ------------------------------------------------------
//
// The law: "Never force a fit by hiding overflow, clipping content, shrinking readable
// text, removing earned features, or moving everything into nested scroll areas." And in
// section 6's evidence list: "Geometry failures: unexplained gaps, orphan elements,
// inflated boxes, accidental wraps, overlap, CLIPPING, and unnecessary horizontal
// scrolling."
//
// So clipping is a named geometry failure. But clipping alone is not the defect — a wide
// table that scrolls is not broken, it is a table that needs the room. The defect is
// content that is cut off AND cannot be brought into view.
//
// The two questions are answered separately, because conflating them produces false
// positives and hides the real one:
//
//   1. Can it be REACHED? The nearest clipping ancestor must be able to scroll far
//      enough to reveal the cut part. `overflow:hidden` cannot scroll, so content clipped
//      by it is lost forever; `overflow:auto` can, so the same layout is fine.
//   2. Is it PAINTED? Does any pixel of the cut part exist on screen at all.
//
// Only content that fails both is reported.
//
// Measured on this project: nothing. This class is the guard for a failure the project has
// not yet had — content cut off with no way to scroll it back — and it is here because the
// law names clipping in section 6's evidence list and a rule that is never exercised is a
// rule that has never been trusted. The defect the research page ACTUALLY had was a
// different one: the overflow was reachable, but only by scrolling inside the table, while
// the frame the page presented to the reader could not scroll at all. That is the nested
// scroll area below.
//
// The two classes are kept apart on purpose. "Clipped" is not a verdict on its own: a wide
// table that scrolls is a table that needs the room, and reporting it would condemn every
// scrollable table in the project.
export const CLIP_MIN_PX=8;
export const CLIP_MIN_TEXT=12;

// --- The law's own test for a control's natural size ------------------------
//
// A control's text is measured with its OWN font. This is the one helper both the inflated rule
// and the transcript rules need, so it lives here rather than being written twice.
export function measureControlText(el){
 const cs=getComputedStyle(el);
 const label=(el.textContent||el.value||'').trim();
 if(!label)return null;
 const ctx=document.createElement('canvas').getContext('2d');
 ctx.font=`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
 return {label,textWidth:ctx.measureText(label).width,fontSize:parseFloat(cs.fontSize)};
}

/**
 * Chrome cost for the current viewport.
 *
 * Returns the top and bottom bands in pixels and as a percentage of the viewport, counting
 * STACKED fixed or sticky regions together — the law asks for the combined height, because two
 * half-height bands are the same cost as one full-height band.
 */
export function chromeCost(doc=document){
 const vh=window.innerHeight;
 const vw=window.innerWidth;
 const visible=e=>{
  if(!(e instanceof Element))return false;
  const cs=getComputedStyle(e);
  if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false;
  const r=e.getBoundingClientRect();
  return r.width>=1&&r.height>=1;
 };
 // The content column: the thing the reader came for. Everything else is furniture.
 // The narrowest match wins — `main` spans the whole page, and using it made a sticky index
 // rail look like a band across the content. querySelector returns the first match in DOCUMENT
 // order, not the first selector, so the narrow candidates are listed first AND the reading
 // column is chosen explicitly.
 const column=doc.querySelector('.reading')||doc.querySelector('#article')||doc.querySelector('.research-layout')
  ||doc.querySelector('.stage')||doc.querySelector('main')||doc.body;
 const colRect=column.getBoundingClientRect();
 const bands=[];
 for(const el of doc.querySelectorAll('body *')){
  const cs=getComputedStyle(el);
  if(cs.position!=='fixed'&&cs.position!=='sticky')continue;
  if(!visible(el))continue;
  const r=el.getBoundingClientRect();
  // A band that does not cross the content column is a rail beside it, not chrome over it.
  const crosses=r.right>colRect.left+1&&r.left<colRect.right-1;
  if(!crosses)continue;
  bands.push({el,r,pos:cs.position});
 }
 // The top band is the furniture actually pinned to the top of the screen.
 const top=bands.filter(b=>b.r.top<=2&&b.r.bottom>2).reduce((m,b)=>Math.max(m,b.r.bottom),0);
 // The bottom band is the furniture pinned to the bottom, and it must CROSS the content column:
 // a sticky rail down the side that happens to reach the viewport bottom is a rail, not a band.
 const bottom=bands.filter(b=>b.r.bottom>=vh-2&&b.r.top<vh-2&&b.r.left<=colRect.left+2&&b.r.right>=colRect.right-2)
  .reduce((m,b)=>Math.min(m,b.r.top),vh);
 // The in-flow header is reported separately and is NOT counted as chrome: the law asks for
 // "stacked fixed or sticky regions", and a header that scrolls away is a section of the page,
 // not furniture.
 const header=doc.querySelector('header');
 const headerH=header&&getComputedStyle(header).position!=='fixed'&&getComputedStyle(header).position!=='sticky'
  ?header.getBoundingClientRect().height:0;
 const topPx=Math.round(top);
 const bottomPx=Math.round(vh-bottom);
 return {
  viewport:{width:vw,height:vh},
  topPx,bottomPx,totalPx:topPx+bottomPx,
  topPct:+(topPx/vh*100).toFixed(1),
  bottomPct:+(bottomPx/vh*100).toFixed(1),
  totalPct:+((topPx+bottomPx)/vh*100).toFixed(1),
  bands:bands.map(b=>({
   el:b.el.tagName.toLowerCase()+(b.el.id?'#'+b.el.id:'')+(typeof b.el.className==='string'&&b.el.className.trim()?'.'+b.el.className.trim().split(/\s+/).slice(0,2).join('.'):''),
   pos:b.pos,top:Math.round(b.r.top),height:Math.round(b.r.height),
  })),
  headerH:Math.round(headerH),
 };
}

/**
 * The symptom classes the geometric collector does not cover.
 *
 * Runs inside the page (it is serialised with toString() and evaluated), so it must be
 * self-contained — no imports, no closure variables.
 */
export function collectLaw(root,exemptions){
 const scope=root||document;
 const out=[];
 // The two helpers below are inlined on purpose. This function is serialised with toString()
 // and evaluated inside the page, where the module's other exports do not exist — a function
 // that reaches for a sibling export would throw in the browser and look like a clean page.
 const measureText=el=>{
  const cs=getComputedStyle(el);
  const label=(el.textContent||el.value||'').trim();
  if(!label)return null;
  const ctx=document.createElement('canvas').getContext('2d');
  ctx.font=`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  return {label,textWidth:ctx.measureText(label).width,fontSize:parseFloat(cs.fontSize)};
 };
 const cost=()=>{
  const vh=window.innerHeight;
  const column=document.querySelector('.reading')||document.querySelector('#article')||document.querySelector('.research-layout')
   ||document.querySelector('.stage')||document.querySelector('main')||document.body;
  const colRect=column.getBoundingClientRect();
  const bands=[];
  for(const el of document.querySelectorAll('body *')){
   const cs=getComputedStyle(el);
   if(cs.position!=='fixed'&&cs.position!=='sticky')continue;
   if(!visible(el))continue;
   const r=el.getBoundingClientRect();
   // A band that does not cross the content column is a rail beside it, not chrome over it.
   if(!(r.right>colRect.left+1&&r.left<colRect.right-1))continue;
   bands.push({el,r});
  }
  // The top band is the furniture actually pinned to the top of the screen. A sticky element that
  // only reaches the top once the reader has scrolled to it is not a top band — it is a rail that
  // happens to be sticky, and counting it would invent a cost the reader never pays.
  const top=bands.filter(b=>b.r.top<=2&&b.r.bottom>2).reduce((m,b)=>Math.max(m,b.r.bottom),0);
  // The bottom band is the furniture actually pinned to the bottom of the screen. It must also
  // CROSS the content column: a sticky rail that runs down the side of the reading column and
  // happens to reach the bottom of the viewport is a rail, and counting it as a bottom band
  // reported the Bible's index as 100% chrome.
  const bottom=bands.filter(b=>b.r.bottom>=vh-2&&b.r.top<vh-2&&b.r.left<=colRect.left+2&&b.r.right>=colRect.right-2)
   .reduce((m,b)=>Math.min(m,b.r.top),vh);
  // The in-flow header is reported separately and is NOT counted as chrome: the law asks for
  // "stacked fixed or sticky regions", and a header that scrolls away is a section of the page,
  // not furniture. The research page's 2,789px intro is content — title, deck, audit table — and
  // treating it as chrome produced a 330% reading of a page that has no chrome problem at all.
  const header=document.querySelector('header');
  const hp=header?getComputedStyle(header).position:'';
  const headerH=header&&hp!=='fixed'&&hp!=='sticky'?header.getBoundingClientRect().height:0;
  const topPx=Math.round(top);
  const bottomPx=Math.round(vh-bottom);
  return {topPx,bottomPx,totalPx:topPx+bottomPx,totalPct:+((topPx+bottomPx)/vh*100).toFixed(1),vh,headerH:Math.round(headerH)};
 };
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
 const visible=e=>{
  if(!(e instanceof Element))return false;
  const cs=getComputedStyle(e);
  if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false;
  const r=e.getBoundingClientRect();
  return r.width>=1&&r.height>=1;
 };
 const isFixed=e=>{const cs=getComputedStyle(e);return cs.position==='fixed'||cs.position==='sticky';};
 // Is this element pinned to the edge of a surface that clips its own overflow?
 //
 // A map's attribution is a child of .leaflet-container, which sets overflow:hidden: the credit
 // belongs to the map and sits on the map's bottom edge, and no scroll of the map can move it.
 // A paragraph in a scrolling panel is not: it belongs to the flow and the reader scrolls to it.
 const clippedToItsSurface=el=>{
  let p=el.parentElement;
  while(p&&p!==document.body){
   const oy=getComputedStyle(p).overflowY,ox=getComputedStyle(p).overflowX;
   if(oy==='hidden'||oy==='clip'||ox==='hidden'||ox==='clip')return true;
   p=p.parentElement;
  }
  return false;
 };
 // Can anything scroll this element out from under a band that covers it?
 //
 // The document first: if the page can scroll by the distance needed, the element comes into
 // view and nothing is lost. Then any inner scroll container. A container that clips its
 // overflow does NOT count as scrollable — it is what traps the work.
 const canScrollClear=(el,needed)=>{
  // A fixed ancestor means the document scroll will not move this element at all.
  let p=el.parentElement,fixedAncestor=false;
  while(p&&p!==document.body){
   if(getComputedStyle(p).position==='fixed'){fixedAncestor=true;break;}
   p=p.parentElement;
  }
  // Can the READER scroll the page? A document whose overflow is hidden reports a scrollHeight
  // larger than its clientHeight — the content still overflows, it just cannot be reached — so
  // the height alone would say "scrollable" for a page that cannot move at all. The phone
  // layout is exactly that case: body{overflow:hidden}. The effective viewport overflow comes
  // from html when html says so, and from body otherwise.
  const ho=getComputedStyle(document.documentElement).overflowY;
  const bo=getComputedStyle(document.body).overflowY;
  const eff=ho!=='visible'?ho:bo;
  const docScrollable=eff!=='hidden'&&eff!=='clip';
  const de=document.scrollingElement||document.documentElement;
  if(!fixedAncestor&&docScrollable&&(de.scrollHeight-de.clientHeight)>=needed)return true;
  p=el.parentElement;
  while(p&&p!==document.body){
   const oy=getComputedStyle(p).overflowY;
   if(oy==='auto'||oy==='scroll'||oy==='overlay'){
    if((p.scrollHeight-p.clientHeight)>=needed)return true;
   }
   p=p.parentElement;
  }
  return false;
 };

 // --- 1. Giant top bar: a band that takes a share of the screen it cannot justify.
 {
  const c=cost();
  const limit=25;
  if(c.totalPct>limit){
   out.push({kind:'giant-top-bar',severity:c.totalPct>40?'high':'medium',el:'chrome',
    gap:c.totalPx,
    note:`chrome takes ${c.totalPct}% of the viewport (${c.topPx}px top + ${c.bottomPx}px bottom of ${c.vh}px)`});
  }
 }

 // --- 2. Overlapping chrome: a band that hides the work, proven by the hit test.
 {
  const bands=[...scope.querySelectorAll('body *')].filter(e=>visible(e)&&isFixed(e));
  for(const band of bands){
   const br=band.getBoundingClientRect();
   const bandFixed=getComputedStyle(band).position==='fixed';
   for(const t of scope.querySelectorAll('p,li,h1,h2,h3,a,button,summary,td,th,span,div')){
    if(band.contains(t)||t.contains(band))continue;
    if(!visible(t))continue;
    const tb=t.getBoundingClientRect();
    const ox=Math.min(br.right,tb.right)-Math.max(br.left,tb.left);
    const oy=Math.min(br.bottom,tb.bottom)-Math.max(br.top,tb.top);
    if(ox<=4||oy<=4)continue;
    // The hit test is the point. Two boxes can touch without the reader losing anything; what
    // matters is whether the covered element is the thing the reader's pointer would reach.
    const cx=tb.left+Math.min(tb.width/2,24);
    const cy=tb.top+Math.min(tb.height/2,8);
    if(cx<0||cy<0||cx>innerWidth||cy>innerHeight)continue;
    const hit=document.elementFromPoint(cx,cy);
    if(!hit)continue;
    // If the covered element — or anything inside it — is what the reader's pointer would reach,
    // nothing is lost and there is no finding. Anything else means the pointer reaches the band
    // or a layer above the work, and the work is unreachable.
    if(t.contains(hit))continue;
    // FIXED furniture lies over the work permanently: it does not move with the page, so what it
    // covers is covered in the reader's first view. That is the law's "obscure the work".
    //
    // STICKY furniture is the page's own scroll furniture: content passes under it by design and
    // comes into view as the reader scrolls. Reporting that would condemn every sticky header.
    //
    // Even for FIXED furniture, content that is part of a long scrolling flow is not obscured:
    // the reader scrolls and it comes into view — that is what a fixed bottom bar over a form
    // is for. What IS obscured is content CLIPPED to its own surface: a map's attribution is
    // pinned to the map's bottom edge by the map's own overflow:hidden, so the fixed bar lies
    // over it permanently, and the credit can never be in the clear while the map is on screen.
    if(!bandFixed){
     const needed=Math.min(tb.bottom-br.top+1,br.bottom-tb.top+1);
     if(canScrollClear(t,needed))continue;
    }else if(!clippedToItsSurface(t)){
     const needed=Math.min(tb.bottom-br.top+1,br.bottom-tb.top+1);
     if(canScrollClear(t,needed))continue;
    }
    const label=(t.textContent||'').trim().slice(0,40);
    out.push({kind:'overlapping-chrome',severity:'high',el:desc(band),gap:Math.round(Math.max(ox,oy)),
     note:`fixed chrome covers "${label||t.tagName}" — the hit test at that point returns ${hit.tagName}.${String(hit.className||'').split(/\s+/)[0]||''}`});
   }
  }
 }

 // --- 3. Inflated controls: a short label in a box the grid invented.
 {
  // Only real control BOXES count. A link in a paragraph is text on a line, not a control: its
  // width is the measure of the column, and reporting it would be reporting the column.
  // A full-width link or disclosure summary in a single column is a deliberate list row.
  const CTRL='button,select,summary,input[type=submit],input[type=button],a.btn,[role=button]';
  const controls=[...scope.querySelectorAll(CTRL)].filter(visible);
  // Group by PARENT first. Grouping by page position alone put a select in the map panel and a
  // link in a caption on the same "row", and the select was judged against the link's width.
  const byParent=[];
  for(const c of controls){
   const p=c.parentElement;
   if(!p)continue;
   let g=byParent.find(x=>x.parent===p);
   if(!g){g={parent:p,items:[]};byParent.push(g);}
   g.items.push(c);
  }
  for(const g of byParent){
   // A control inside a dropdown panel is a MENU ITEM. It fills the panel's width on purpose,
   // exactly as the vertical menu is exempt from the scattered-actions rule.
   if(g.parent.closest('details')&&g.parent.closest('details')!==g.parent)continue;
   const pcs=getComputedStyle(g.parent);
   // Only a HORIZONTAL strip can stretch one of its children. In a column a full-width control
   // is a list row, and a list row is the column's job.
   if(pcs.display!=='flex'&&pcs.display!=='inline-flex'&&pcs.display!=='grid'&&pcs.display!=='inline-grid')continue;
   if(pcs.flexDirection==='column'||pcs.gridAutoFlow==='column')continue;
   // Now, within that strip, group by row.
   const rows=[];
   for(const c of g.items){
    const r=c.getBoundingClientRect();
    const row=rows.find(x=>Math.abs(x.top-r.top)<=12);
    if(row)row.items.push({c,r});
    else rows.push({top:r.top,items:[{c,r}]});
   }
   for(const row of rows){
    if(row.items.length<2)continue;
    const widths=row.items.map(x=>x.r.width).sort((a,b)=>a-b);
    // The LOWER median, not the upper one. With two controls — one compact and one stretched —
    // the upper median IS the stretched one, and comparing it against itself finds nothing. The
    // point of the rule is to spot the control that claims the row, so the typical width must be
    // the one the other controls actually take.
    const median=widths[Math.floor((widths.length-1)/2)];
    for(const {c,r} of row.items){
     const m=measureText(c);
     if(!m)continue;
     const cs=getComputedStyle(c);
     const pad=(parseFloat(cs.paddingLeft)||0)+(parseFloat(cs.paddingRight)||0);
     const excess=r.width-(m.textWidth+pad);
     // A control is inflated when it is wide AND its label does not need that width AND it is
     // wide against its neighbours on its own row. All three, or it is a deliberate layout.
     if(excess<100)continue;
     if(r.width<median*1.8)continue;
     out.push({kind:'inflated-control',severity:'medium',el:desc(c),gap:Math.round(excess),
      note:`${Math.round(r.width)}px box for a ${Math.round(m.textWidth)}px label (${Math.round(excess)}px unexplained) against a ${Math.round(median)}px median on the same row`});
    }
   }
  }
 }

 // --- 4. Empty hero or spacer: a region with height and nothing in it.
 {
  for(const e of scope.querySelectorAll('section,div,header,aside,figure')){
   if(!visible(e))continue;
   const r=e.getBoundingClientRect();
   if(r.height<100||r.width<120)continue;
   if(e.textContent.trim().length>0)continue;
   if(e.querySelector('img,svg,canvas,video,picture,input,button,a,select,textarea'))continue;
   // A spacer that holds nothing and shows nothing. If it has children, it is a layout that
   // happens to be empty of text, not a manufactured section.
   if(e.children.length>0)continue;
   out.push({kind:'empty-hero',severity:'medium',el:desc(e),gap:Math.round(r.height),
    note:`${Math.round(r.width)}x${Math.round(r.height)}px region with no content at all`});
  }
 }

 // --- 5. Equal weight: a row of identical blocks with no reading priority.
 {
  for(const g of scope.querySelectorAll('div,section,ul,ol')){
   if(!visible(g))continue;
   const cs=getComputedStyle(g);
   if(!['grid','flex','inline-grid','inline-flex'].includes(cs.display))continue;
   const kids=[...g.children].filter(k=>visible(k));
   if(kids.length<3)continue;
   const rows=[];
   for(const k of kids.slice().sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top)){
    const t=k.getBoundingClientRect().top;
    const row=rows.find(r=>Math.abs(r.top-t)<=12);
    if(row)row.items.push(k);
    else rows.push({top:t,items:[k]});
   }
   for(const row of rows){
    if(row.items.length<3)continue;
    // A block needs a LABEL to be comparable with its neighbours. A heading is one; a bold
    // label is one too, and a peer set that uses <b> rather than <h3> is still a peer set.
    // Skipping those rows is how the first version of this rule could not see the six pose
    // cards at all — a peer row the rule was blind to is a peer row it cannot excuse either.
    const labels=row.items.map(k=>k.querySelector('h1,h2,h3,h4')||k.querySelector('b,strong'));
    if(labels.some(h=>!h))continue;
    if(!row.items.every(k=>k.querySelector('p,li,span,div')))continue;
    const boxes=row.items.map(k=>k.getBoundingClientRect());
    const hs=boxes.map(b=>b.height),ws=boxes.map(b=>b.width);
    if(Math.max(...hs)-Math.min(...hs)>4)continue;
    if(Math.max(...ws)-Math.min(...ws)>4)continue;
    const fs=labels.map(h=>Math.round(parseFloat(getComputedStyle(h).fontSize)));
    if(new Set(fs).size!==1)continue;
    // A genuine peer set is exempt BY NAME, with its measurement recorded in
    // EQUAL_WEIGHT_EXEMPTIONS. The exemption is narrow and it can be revoked: it holds only
    // while the named element is still an even peer set. The conditions are DATA because this
    // function is evaluated inside the browser, where the module's exports do not exist.
    const exempt=(exemptions||[]).find(ex=>{
     if(!g.matches||!g.matches(ex.selector))return false;
     const want=ex.expect||{};
     if(want.count!==undefined&&kids.length!==want.count)return false;
     if(want.equalHeights){
      const heights=new Set(kids.map(k=>Math.round(k.getBoundingClientRect().height)));
      if(heights.size!==1)return false;
     }
     if(want.evenGrid){
      // The grid must divide the count exactly, so no card is left alone on the last row.
      const cols=cs.gridTemplateColumns.split(' ').filter(Boolean).length;
      if(!cols||kids.length%cols!==0)return false;
     }
     if(want.distinctLabels){
      // Peers have their own identity. Six blocks with the same name are repetition, not a set.
      const labels=kids.map(k=>(k.querySelector('b,strong,h1,h2,h3,h4')?.textContent||'').trim());
      if(new Set(labels).size!==kids.length)return false;
     }
     return true;
    });
    if(exempt)continue;
    out.push({kind:'equal-weight',severity:'medium',el:desc(g),gap:row.items.length,
     note:`${row.items.length} blocks of identical ${Math.round(ws[0])}x${Math.round(hs[0])}px with the same ${fs[0]}px label — nothing in the row is first`});
   }
  }
 }

 // --- 6. Unreachable content: text cut off that no scroll can bring back.
 {
  // Only elements that carry their own text are candidates. A wrapper's box can stick out
  // without losing anything, because the text inside it is measured too.
  const candidates=[];
  for(const e of scope.querySelectorAll('body *')){
   if(!visible(e))continue;
   const text=(e.textContent||'').trim();
   if(text.length<12)continue;
   // The element must OWN the text, not merely contain it, so one cut leaf is one finding.
   let owns=false;
   for(const n of e.childNodes)if(n.nodeType===3&&n.textContent.trim().length>=12){owns=true;break;}
   if(!owns)continue;
   candidates.push(e);
  }
  // The nearest ancestor that clips its overflow, and the content box it clips to.
  const clipper=el=>{
   let p=el.parentElement;
   while(p&&p!==document.body){
    const cs=getComputedStyle(p);
    const ox=cs.overflowX,oy=cs.overflowY;
    const clipsX=/hidden|clip|auto|scroll|overlay/.test(ox);
    const clipsY=/hidden|clip|auto|scroll|overlay/.test(oy);
    if(clipsX||clipsY){
     const r=p.getBoundingClientRect();
     const bl=p.clientLeft||0,bt=p.clientTop||0;
     return {p,ox,oy,
      box:{left:r.left+bl,top:r.top+bt,right:r.left+bl+p.clientWidth,bottom:r.top+bt+p.clientHeight}};
    }
    p=p.parentElement;
   }
   return null;
  };
  const scrollable=x=>/auto|scroll|overlay/.test(x);
  const seen=new Set();
  for(const e of candidates){
   const c=clipper(e);
   if(!c)continue;
   const r=e.getBoundingClientRect();
   // How far the content sticks out of the clip box, per axis.
   const overX=Math.max(r.right-c.box.right,c.box.left-r.left);
   const overY=Math.max(r.bottom-c.box.bottom,c.box.top-r.top);
   if(overX<8&&overY<8)continue;
   // REACHABLE? The clipper itself is the only thing that can reveal the cut part: scrolling
   // an ANCESTOR moves the clipper and the content together, so the relationship between
   // them never changes. A clipper that cannot scroll (hidden, clip) loses the content for
   // good.
   let reachable=false;
   if(overX>=8){
    if(scrollable(c.ox)&&(c.p.scrollWidth-c.p.clientWidth)>=overX-1)reachable=true;
   }
   if(overY>=8){
    if(scrollable(c.oy)&&(c.p.scrollHeight-c.p.clientHeight)>=overY-1)reachable=true;
   }
   if(reachable)continue;
   // PAINTED? If no pixel of the element is on screen at all, the reader never sees it —
   // that is a different failure (an off-screen block), not a clip.
   const cx=Math.min(Math.max(r.left+2,c.box.left+1),c.box.right-1);
   const cy=Math.min(Math.max(r.top+2,c.box.top+1),c.box.bottom-1);
   let painted=true;
   if(cx>=0&&cy>=0&&cx<innerWidth&&cy<innerHeight){
    const hit=document.elementFromPoint(cx,cy);
    painted=!!hit&&(hit===e||e.contains(hit)||hit.contains(e));
   }else painted=false;
   if(!painted)continue;
   const key=c.p;
   if(seen.has(key))continue;
   seen.add(key);
   const amount=Math.round(Math.max(overX,overY));
   const axis=overX>=overY?'horizontal':'vertical';
   out.push({kind:'unreachable-content',severity:'high',el:desc(e),gap:amount,
    note:`${axis} content is cut ${amount}px by ${desc(c.p)} and the clip cannot scroll to reveal it — the text is unreachable`});
  }
 }

 // --- 7. Nested scroll areas: the overflow moved into a scroller inside a scroller.
 {
  const scrollers=[];
  for(const e of scope.querySelectorAll('body *')){
   const cs=getComputedStyle(e);
   if(!/auto|scroll|overlay/.test(cs.overflowX)&&!/auto|scroll|overlay/.test(cs.overflowY))continue;
   scrollers.push({e,ox:cs.overflowX,oy:cs.overflowY});
  }
  const isScroller=e=>{
   const cs=getComputedStyle(e);
   return /auto|scroll|overlay/.test(cs.overflowX)||/auto|scroll|overlay/.test(cs.overflowY);
  };
  const range=e=>Math.max(e.scrollWidth-e.clientWidth,e.scrollHeight-e.clientHeight);
  const horizontalRange=e=>e.scrollWidth-e.clientWidth;
  const reported=new Set();
  // The threshold is inlined on purpose: this function is serialised with toString() and
  // evaluated in the page, where the module's exports do not exist.
  const minRange=1;
  for(const s of scrollers){
   // The inner scroller must actually carry something, and it must carry it SIDEWAYS.
   // A vertical inner scroller is the page's reading surface — the SEA page's evidence
   // panel scrolls 462px inside the workspace and is a correct layout, because the
   // workspace fills the viewport and the page itself never scrolls.
   const innerRange=range(s.e);
   if(innerRange<minRange)continue;
   if(horizontalRange(s.e)<minRange)continue;
   // Walk up: the first ancestor that is also a scroller is the frame the overflow is
   // hidden inside.
   let p=s.e.parentElement,frame=null;
   while(p&&p!==document.body){
    if(isScroller(p)){frame=p;break;}
    p=p.parentElement;
   }
   if(!frame)continue;
   const key=s.e;
   if(reported.has(key))continue;
   reported.add(key);
   const frameRange=range(frame);
   out.push({kind:'nested-scroll',severity:'high',el:desc(s.e),gap:horizontalRange(s.e),
    note:`${desc(s.e)} scrolls ${horizontalRange(s.e)}px sideways inside ${desc(frame)}, which itself scrolls ${frameRange}px — the overflow is in a nested scroll area, so the frame the reader can see does not move`});
  }
 }

 return out;
}
