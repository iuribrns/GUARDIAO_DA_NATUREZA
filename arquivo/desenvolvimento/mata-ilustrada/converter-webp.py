"""Cópias WebP dos originais raster; o arquivo de criação continua preservado."""
from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[2]
out=root/'desenvolvimento/mata-ilustrada/arquivo-webp'
files=[p for p in root.rglob('*') if p.is_file() and not any(x in p.parts for x in ['.git','node_modules','dist','test-results','arquivo-webp']) and p.suffix.lower() in ['.png','.jpg','.jpeg','.gif']]
report=[]
for p in files:
 rel=p.relative_to(root); dest=out/rel.with_suffix('.webp');dest.parent.mkdir(parents=True,exist_ok=True)
 im=Image.open(p)
 if getattr(im,'is_animated',False):
  from PIL import ImageSequence
  frames=[f.convert('RGBA') for f in ImageSequence.Iterator(im)]
  frames[0].save(dest,save_all=True,append_images=frames[1:],duration=im.info.get('duration',100),loop=im.info.get('loop',0),quality=88,method=6)
 else:im.convert('RGBA' if 'A' in im.getbands() else 'RGB').save(dest,quality=88,method=6)
 report.append({'original':str(rel),'webp':str(dest.relative_to(root)),'antes':p.stat().st_size,'depois':dest.stat().st_size})
(out/'manifesto.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
print(len(report),'imagens;',sum(x['antes'] for x in report),'->',sum(x['depois'] for x in report),'bytes')
