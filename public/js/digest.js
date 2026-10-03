// Non's Digest — dated, attributed snapshot of voluntary carbon market + Thailand TGO news.
// Renders as a third panel in the left rail (world-rail) and as moving-bar sparklines inside
// the carbon-map ledger. The browser reads the snapshot once and never reaches an upstream.
export function initDigest({t,fmt,getLang}){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const th=()=>getLang()==='th';
  const date=s=>s?new Intl.DateTimeFormat(th()?'th-TH':'en-GB',{dateStyle:'medium'}).format(new Date(s+'T00:00:00')):'—';
  const ready=fetch('data/digest/vcm-news.json').then(r=>{if(!r.ok)throw Error('digest');return r.json();}).catch(()=>null);
  const dirArrow=d=>d==='up'?'▲':d==='down'?'▼':'▬';
  const dirLabel=d=>d==='up'?t('digestUp'):d==='down'?t('digestDown'):t('digestFlat');

  function newsHTML(D){
    if(!D||!D.items?.length)return '';
    const items=D.items.slice(0,8).map(it=>{
      const title=th()?it.title_th:it.title_en;
      const summary=th()?it.summary_th:it.summary_en;
      return `<article class="digest-item"><h4><a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(title)} ↗</a></h4><p>${esc(summary)}</p><small>${esc(it.source)} · ${esc(date(it.date))}</small></article>`;
    }).join('');
    return `<section class="digest-news"><h3>${esc(t('digestNewsTitle'))}</h3>${items}<details class="digest-more"><summary>${esc(t('digestMore').replace('{n}',D.items.length))}</summary>${D.items.slice(8).map(it=>`<article class="digest-item"><h4><a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(th()?it.title_th:it.title_en)} ↗</a></h4><p>${esc(th()?it.summary_th:it.summary_en)}</p><small>${esc(it.source)} · ${esc(date(it.date))}</small></article>`).join('')}</details><p class="digest-source">Non's Digest · ${esc(D.snapshot)} · SHA-256 ${esc((D.raw_sha256||'').slice(0,12))}… · <a href="data/digest/vcm-news.json" target="_blank" rel="noopener">${esc(t('digestRaw'))} ↗</a></p></section>`;
  }

  // SVG sparkline for a trend series — height-scaled, with a soft fill below the line.
  function sparkSVG(series){
    if(!series?.length)return '';
    const values=series.map(p=>Number(p.value)).filter(Number.isFinite);
    if(!values.length)return '';
    const w=240,h=46,pad=2,lo=Math.min(...values),hi=Math.max(...values),span=hi-lo||1;
    const pts=series.map((p,i)=>`${i*w/(series.length-1)},${h-pad-(Number(p.value)-lo)/span*(h-pad*2)}`);
    const area=`${pts[0]} ${pts.join(' ')} ${w},${h}`;
    return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="trend sparkline"><polygon fill="currentColor" opacity=".12" points="${area}"/><polyline fill="none" stroke="currentColor" stroke-width="1.6" points="${pts.join(' ')}"/></svg>`;
  }

  function trendsHTML(D){
    if(!D||!D.trends?.length)return '';
    const items=D.trends.map(tr=>{
      const label=th()?tr.label_th:tr.label_en;
      const note=th()?tr.note_th:tr.note_en;
      const last=tr.series.at(-1),first=tr.series[0];
      return `<article class="digest-trend" data-trend="${esc(tr.id)}"><header><h4>${dirArrow(tr.direction)} ${esc(label)}</h4><span class="trend-tag">${esc(dirLabel(tr.direction))}</span></header>${sparkSVG(tr.series)}<dl class="trend-dl"><dt>${esc(first.label)}</dt><dd>${fmt(first.value,2)} ${esc(first.unit||'')}</dd><dt>${esc(last.label)}</dt><dd>${fmt(last.value,2)} ${esc(last.unit||'')}</dd></dl>${note?`<p class="hint">${esc(note)}</p>`:''}</article>`;
    }).join('');
    return `<section class="digest-trends"><h3>${esc(t('digestTrendsTitle'))}</h3>${items}</section>`;
  }

  // Mini sparkline that travels with the TGO market block inside the carbon map ledger.
  function marketBarsHTML(d){
    if(!d)return '';
    const tr=d.trends.find(t=>t.id==='tgo-portfolio')||d.trends.find(t=>t.id==='price-bifurcation');
    if(!tr)return '';
    const note=th()?tr.note_th:tr.note_en;
    return `<div class="lrow digest-market"><p class="lmeta">${esc(t('digestMarketTitle'))}</p>${sparkSVG(tr.series)}<dl class="cross"><dt>${esc(th()?tr.label_th:tr.label_en)}</dt><dd>${dirArrow(tr.direction)} ${fmt(tr.series.at(-1).value,1)} ${esc(tr.series.at(-1).unit||'')}</dd></dl>${note?`<p class="hint">${esc(note)}</p>`:''}</div>`;
  }

  function panelHTML(D){
    if(!D)return `<section class="digest-empty"><h3>${esc(t('digestTitle'))}</h3><p class="hint">${esc(t('digestUnavailable'))}</p></section>`;
    return `${newsHTML(D)}${trendsHTML(D)}`;
  }

  return {ready,panelHTML,marketBarsHTML,data:()=>ready};
}