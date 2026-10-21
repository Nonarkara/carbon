import{readFile,writeFile}from'node:fs/promises';
import{createHash}from'node:crypto';
export async function versionAssets(paths){
 for(const path of paths){
  const html=await readFile(path,'utf8'),refs=[...html.matchAll(/(?:href|src)="((?:css|js|vendor)\/[^"?]+\.(?:css|js))(?:\?v=[a-f0-9]+)?"/g)];
  let result=html;
  for(const ref of refs){
   const bytes=await readFile('public/'+ref[1]),digest=createHash('sha256').update(bytes).digest('hex').slice(0,12);
   result=result.replaceAll(ref[0],ref[0].replace(/(?:\?v=[a-f0-9]+)?"$/,`?v=${digest}"`));
  }
  await writeFile(path,result);
 }
}
