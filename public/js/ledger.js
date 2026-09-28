// Landscape carbon ledger: pure functions, no DOM. Every row keeps its own dataset, period and unit.
// Invariant: rows from different datasets are never added together; the only net is GFW's own net flux.
import {FACTORS} from './carbon.js';

const {r:R,cf:CF}=FACTORS.general;
export const AGB_TO_CO2E=(1+R)*CF*44/12; // T-VER tree-tool convention, R=0.27, CF=0.47 → 2.18863…
export const C_TO_CO2=44/12;
export const Z95=1.96;
const RAD=Math.PI/180;

// Grid: sparse Thai cells. Layout of grid.bin = Uint32 index[count] then Float32 layer[k][count] (little-endian).
export function readGrid(buffer,meta){
  const {count,layers}=meta;
  if(buffer.byteLength!==4*count*(1+layers.length))throw new Error('invalid:gridSize');
  const index=new Uint32Array(buffer,0,count),out={index,meta,layers:{}};
  layers.forEach((name,i)=>{out.layers[name]=new Float32Array(buffer,4*count*(1+i),count);});
  return out;
}
export function cellBounds(meta,i){
  const row=Math.floor(i/meta.cols),col=i%meta.cols;
  const west=meta.west+col*meta.step,north=meta.north-row*meta.step;
  return {west,east:west+meta.step,north,south:north-meta.step};
}
// Fraction of a cell's spherical area inside a lon/lat rectangle (exact on the sphere; cells are small).
export function rectFraction(cell,box){
  const w=Math.max(cell.west,box.west),e=Math.min(cell.east,box.east),s=Math.max(cell.south,box.south),n=Math.min(cell.north,box.north);
  if(e<=w||n<=s)return 0;
  const band=(a,b)=>Math.sin(b*RAD)-Math.sin(a*RAD);
  return (e-w)/(cell.east-cell.west)*band(s,n)/band(cell.south,cell.north);
}
function ringContains(ring,x,y){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const [xi,yi]=ring[i],[xj,yj]=ring[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;}return inside;}
function polygonsOf(geojson){
  const g=geojson.type==='FeatureCollection'?geojson.features.map(f=>f.geometry):[geojson.type==='Feature'?geojson.geometry:geojson];
  return g.flatMap(x=>x.type==='Polygon'?[x.coordinates]:x.type==='MultiPolygon'?x.coordinates:[]);
}
export function polygonContains(polys,x,y){return polys.some(p=>ringContains(p[0],x,y)&&!p.slice(1).some(h=>ringContains(h,x,y)));}
// Outer-ring vertices, plus their average only when that point sits in filled area.
// A centroid in a hole, or outside a concave ring, is not a province probe.
export function probePoints(geojson){
  const polys=polygonsOf(geojson);
  const pts=polys.flatMap(p=>[...p[0]]);
  if(!pts.length)return pts;
  const n=pts.length,c=pts.reduce((a,[x,y])=>[a[0]+x/n,a[1]+y/n],[0,0]);
  if(polygonContains(polys,c[0],c[1]))pts.push(c);
  return pts;
}
// ponytail: 4×4 sub-samples per cell, equal-weighted; exact rectangle overlap is used for drawn boxes.
export function polygonFraction(cell,polys,n=4){
  let hit=0;const dx=(cell.east-cell.west)/n,dy=(cell.north-cell.south)/n;
  for(let a=0;a<n;a++)for(let b=0;b<n;b++)if(polygonContains(polys,cell.west+(a+.5)*dx,cell.south+(b+.5)*dy))hit++;
  return hit/(n*n);
}
// Sum every layer over the selection. All layers are additive per-cell totals, so each scales linearly with the
// covered fraction (for the variance layer this assumes pixel errors are independent within a cell).
export function sumSelection(grid,selection){
  const {meta,index}=grid,names=Object.keys(grid.layers),totals=Object.fromEntries(names.map(n=>[n,0]));
  const box=selection.box||bboxOf(selection.polygons);
  let cells=0;
  for(let k=0;k<index.length;k++){
    const c=cellBounds(meta,index[k]);
    if(c.east<=box.west||c.west>=box.east||c.north<=box.south||c.south>=box.north)continue;
    const f=selection.box?rectFraction(c,box):polygonFraction(c,selection.polygons);
    if(!f)continue;cells++;
    for(const n of names)totals[n]+=f*grid.layers[n][k];
  }
  return {totals,cells};
}
export function bboxOf(polys){const b={west:180,east:-180,south:90,north:-90};for(const p of polys)for(const [x,y] of p[0]){b.west=Math.min(b.west,x);b.east=Math.max(b.east,x);b.south=Math.min(b.south,y);b.north=Math.max(b.north,y);}return b;}
export {polygonsOf};
// Box stock and totals come from 0.025° cells (~2.8 km); below that they are an even-spread share of one cell.
export const GRID_KM=2.8;
export function boxSideKm(box){const mid=(box.north+box.south)/2*RAD;return Math.min((box.east-box.west)*RAD*6371.0088*Math.cos(mid),(box.north-box.south)*RAD*6371.0088);}
export function boxAreaHa(box){return 6371008.8**2*(box.east-box.west)*RAD*Math.abs(Math.sin(box.north*RAD)-Math.sin(box.south*RAD))/1e4;}

// Stock with two 95% bounds: fully correlated pixel errors (conservative) and independent errors (optimistic).
// Neither includes systematic map bias or the choice of root:shoot ratio.
export function stockBand(agbMg,sdSumMg,varSumMg2){
  const t=agbMg*AGB_TO_CO2E,corr=Z95*sdSumMg*AGB_TO_CO2E,ind=Z95*Math.sqrt(Math.max(varSumMg2,0))*AGB_TO_CO2E;
  return {value:t,conservative:[Math.max(0,t-corr),t+corr],optimistic:[Math.max(0,t-ind),t+ind]};
}
function row(id,value,unit,dataset,extra={}){return {id,value,unit,dataset,...extra};}
// Assemble ledger rows from a province record or a grid sum. Missing inputs stay null, never zero.
// minSideKm: shortest side of the selection. A dataset is greyed out when its cell is wider than that side.
export function ledgerRows(src,datasets,{minSideKm}={}){
  const rows=[],d=datasets,coarse=km=>minSideKm!=null&&minSideKm<Math.max(GRID_KM,km);
  if(src.forest_agb_mg!=null)rows.push(row('stock_forest',null,'tCO2e',d.cci,{...stockBand(src.forest_agb_mg,src.forest_sd_mg,src.forest_var_mg2),side:'stock',tooCoarse:coarse(GRID_KM)}));
  if(src.agb_mg!=null)rows.push(row('stock_all',src.agb_mg*AGB_TO_CO2E,'tCO2e',d.cci,{side:'stock',tooCoarse:coarse(GRID_KM)}));
  const years=d.gfw.years;
  if(src.gfw_removals_mg_co2!=null){
    rows.push(row('forest_removals',src.gfw_removals_mg_co2/years,'tCO2e/yr',d.gfw,{side:'absorb'}));
    rows.push(row('forest_emissions',src.gfw_emissions_mg_co2e/years,'tCO2e/yr',d.gfw,{side:'emit'}));
    rows.push(row('forest_net',src.gfw_net_mg_co2e/years,'tCO2e/yr',d.gfw,{side:'net'}));
  }else rows.push(row('forest_flux',null,'tCO2e/yr',d.gfw,{side:'net',unavailable:'gridNotIngested'}));
  if(src.fire_co2_t!=null)rows.push(row('fire',src.fire_co2_t,'tCO2/yr',d.gfed,{side:'emit',byCategory:src.fire_c_t_groups||null,monthly:src.fire_c_t_monthly||null,tooCoarse:coarse(d.gfed.cellKm)}));
  if(src.fossil_c_t!=null)rows.push(row('fossil',src.fossil_c_t*C_TO_CO2,'tCO2/yr',d.odiac,{side:'emit',tooCoarse:coarse(d.odiac.cellKm)}));
  return rows.map(r=>r.tooCoarse||src.area_ha===0?{...r,value:null,conservative:null,optimistic:null,byCategory:null,monthly:null,...(src.area_ha===0?{unavailable:'emptySelection'}:{})}:r);
}
