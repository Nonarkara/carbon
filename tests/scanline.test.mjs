import test from 'node:test';import assert from 'node:assert/strict';
import {scanlineContains,polygonContains,polygonFraction,sumSelection,cellBounds} from '../public/js/ledger.js';
const polys=[[[[0,0],[7,0],[7,7],[3,4],[0,7],[0,0]],[[1,1],[2,1],[2,2],[1,2],[1,1]]],[[[8,0],[9,0],[9,2],[8,2],[8,0]]]];
test('bounded scanlines preserve strict edge, vertex, hole and multipolygon classification',()=>{
 const cached=scanlineContains(polys);
 for(let j=0;j<80;j++)for(let i=0;i<110;i++){const x=i/10,y=j/10;assert.equal(cached(polys,x,y),polygonContains(polys,x,y),`${x},${y}`);}
 // Exercise cache eviction and a latitude revisited after many newer lines.
 for(const y of [0,7,1,2,4,0,...Array.from({length:40},(_,i)=>i/9),0])for(const x of [0,1,2,3,7,8,9])assert.equal(cached(polys,x,y),polygonContains(polys,x,y));
});
test('indexed grid totals and covariance are byte-identical to original 4x4 point sampler',()=>{
 const grid={meta:{west:0,north:8,step:.25,cols:40,rows:32,block:2},index:Uint32Array.from({length:1280},(_,i)=>1279-i),layers:{area_ha:Float32Array.from({length:1280},(_,i)=>i/3),forest_sd_mg:Float32Array.from({length:1280},(_,i)=>i%13)}};
 const actual=sumSelection(grid,{polygons:polys}),totals={area_ha:0,forest_sd_mg:0},blocks=new Map();let cells=0;
 for(let i=0;i<grid.index.length;i++){const cell=cellBounds(grid.meta,grid.index[i]),f=polygonFraction(cell,polys);if(!f)continue;cells++;for(const key of Object.keys(grid.layers))totals[key]+=f*grid.layers[key][i];const row=Math.floor(grid.index[i]/grid.meta.cols),col=grid.index[i]%grid.meta.cols,key=Math.floor(row/2)*grid.meta.cols+Math.floor(col/2);blocks.set(key,(blocks.get(key)||0)+f*grid.layers.forest_sd_mg[i]);}
 totals.forest_blockvar_mg2=0;for(const value of blocks.values())totals.forest_blockvar_mg2+=value*value;
 assert.deepEqual(actual,{totals,cells});
});
