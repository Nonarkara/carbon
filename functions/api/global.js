import {collectWorld} from '../../server/world-data.js';
import snapshot from '../../public/data/world-snapshot.json';
export async function onRequestGet(context){
 const body=await collectWorld({cache:caches.default,origin:new URL(context.request.url).origin,snapshot:snapshot.feeds,waitUntil:p=>context.waitUntil(p)});
 return Response.json(body,{headers:{'Cache-Control':'public, max-age=60','X-Content-Type-Options':'nosniff'}});
}
