import {area} from '@turf/area';
import {intersect} from '@turf/intersect';
import {kinks} from '@turf/kinks';
import {booleanValid} from '@turf/boolean-valid';
import {featureCollection,polygon} from '@turf/helpers';
export function validateBoundary(input) {
  if(input.crs)throw new Error('invalid:crs');
  const features=input.type==='FeatureCollection'?input.features:input.type==='Feature'?[input]:[{type:'Feature',properties:{},geometry:input}];
  if(!Array.isArray(features)||!features.length||features.length>50)throw new Error('invalid:features');
  let vertices=0;
  const clean=features.map(f=>{
    if(f.crs||f.geometry?.crs)throw new Error('invalid:crs');
    const g=f.geometry;if(!g||!['Polygon','MultiPolygon'].includes(g.type))throw new Error('invalid:polygon');
    const polys=g.type==='Polygon'?[g.coordinates]:g.coordinates;
    if(!Array.isArray(polys)||!polys.length)throw new Error('invalid:polygon');
    for(const rings of polys){
      if(!Array.isArray(rings)||!rings.length)throw new Error('invalid:ring');
      for(const ring of rings){
        if(!Array.isArray(ring)||ring.length<4)throw new Error('invalid:ring');
        for(const p of ring){
          vertices++;if(vertices>20000)throw new Error('invalid:vertices');
          if(!Array.isArray(p)||p.length!==2||p.some(x=>typeof x!=='number'||!Number.isFinite(x))||p[0]<97||p[0]>106||p[1]<5||p[1]>21)throw new Error('invalid:coordinates');
        }
        if(ring[0][0]!==ring.at(-1)[0]||ring[0][1]!==ring.at(-1)[1])throw new Error('invalid:closedRing');
      }
    }
    const p={type:'Feature',properties:{name:String(f.properties?.name||'').slice(0,150)},geometry:structuredClone(g)};
    if(!booleanValid(p)||kinks(p).features.length)throw new Error('invalid:selfIntersection');
    // Validate holes by area: holes must be inside their shell and mutually disjoint.
    for(const rings of polys){
      const shell=polygon([rings[0]]);
      for(let h=1;h<rings.length;h++){
        const hole=polygon([rings[h]]),overlap=intersect(featureCollection([shell,hole]));
        if(!overlap||Math.abs(area(hole)-area(overlap))>0.01)throw new Error('invalid:hole');
        for(let j=1;j<h;j++){const x=intersect(featureCollection([hole,polygon([rings[j]])]));if(x&&area(x)>0.01)throw new Error('invalid:overlap');}
      }
    }
    const parts=polys.map(c=>polygon(c));
    for(let i=0;i<parts.length;i++)for(let j=0;j<i;j++){const x=intersect(featureCollection([parts[i],parts[j]]));if(x&&area(x)>0.01)throw new Error('invalid:overlap');}
    if(area(p)<=0)throw new Error('invalid:area');return p;
  });
  for(let i=0;i<clean.length;i++)for(let j=0;j<i;j++){const x=intersect(featureCollection([clean[i],clean[j]]));if(x&&area(x)>0.01)throw new Error('invalid:overlap');}
  const geojson=featureCollection(clean),m2=area(geojson);
  return {geojson,m2,hectares:m2/10000,rai:m2/1600,vertices,featureCount:clean.length};
}
