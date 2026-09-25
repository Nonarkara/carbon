import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('public');
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.geojson':'application/geo+json','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.csv':'text/csv; charset=utf-8','.bin':'application/octet-stream','.jpg':'image/jpeg'};
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1');const path=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!path.startsWith(root+sep))throw Error();const body=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end('Not found');}}).listen(Number(process.env.PORT||8788),'127.0.0.1',()=>console.log('Forest Carbon: http://127.0.0.1:'+(process.env.PORT||8788)));
