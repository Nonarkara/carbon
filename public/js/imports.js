export const MAX_FILE=2*1024*1024;
export function parseCSV(text) {
  if(new TextEncoder().encode(text).length>MAX_FILE)throw new Error('invalid:fileSize');
  text=text.replace(/^\uFEFF/,'');
  const rows=[];let row=[],cell='',quoted=false,closed=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;}
    else if(c==='"'){if(cell||closed)throw new Error('invalid:csv');quoted=true;}
    else if(c===','||c==='\n'||c==='\r'){
      row.push(cell.trim());cell='';closed=false;
      if(c!==','){if(c==='\r'&&text[i+1]==='\n')i++;if(row.some(x=>x!==''))rows.push(row);row=[];}
    }else {if(closed&&!/\s/.test(c))throw new Error('invalid:csv');cell+=c;}
  }
  if(quoted)throw new Error('invalid:csv');
  row.push(cell.trim());if(row.some(x=>x!==''))rows.push(row);
  const headers=rows.shift();
  const required=['plot_id','tree_id','plot_area_m2','dbh_cm','height_m'];
  if(!headers||new Set(headers).size!==headers.length||required.some(k=>!headers.includes(k))||!rows.length||rows.length>10000)throw new Error('invalid:csvHeaders');
  return rows.map(r=>{if(r.length!==headers.length)throw new Error('invalid:csvColumns');return Object.fromEntries(headers.map((h,i)=>[h,r[i]]));});
}
export async function readFile(file) {
  if(!file||file.size>MAX_FILE)throw new Error('invalid:fileSize');
  const bytes=await file.arrayBuffer();
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
  return {text:new TextDecoder('utf-8',{fatal:true}).decode(bytes),name:file.name,sha256:hash};
}
