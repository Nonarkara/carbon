"""Create display copies of public-domain impact photographs; never change originals.
Run with scripts/ingest/requirements.txt (Pillow pinned), from repository root.
"""
import hashlib,json
from pathlib import Path
from PIL import Image
root=Path('public');register=json.loads((root/'data/bible-artifacts.json').read_text())
records=[]
for a in register['artifacts']:
    original=root/a['path'];raw=original.read_bytes()
    assert hashlib.sha256(raw).hexdigest()==a['sha256']
    assert a['rights']=='Public domain'
    with Image.open(original) as image:
        image.thumbnail((1200,1200),Image.Resampling.LANCZOS)
        target=original.with_name(original.stem+'-display.webp')
        image.save(target,'WEBP',quality=84,method=6)
        records.append({'id':a['id'],'path':str(target.relative_to(root)),'width':image.width,'height':image.height,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'sourceSha256':a['sha256'],'modifications':'Display derivative: max 1200px, WebP quality84; original downloadable unchanged'})
(root/'data/bible-display-images.json').write_text(json.dumps({'schemaVersion':1,'generator':'scripts/optimize-bible-images.py','images':records},ensure_ascii=False,indent=2)+'\n')
print(json.dumps([{'id':r['id'],'displayBytes':r['bytes']} for r in records]))
