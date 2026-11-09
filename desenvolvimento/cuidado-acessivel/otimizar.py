"""Reencoda WebP sem mudar dimensões, quadros ou alfa; preserva todos os originais."""
from pathlib import Path
from PIL import Image
import json, hashlib
root=Path(__file__).resolve().parents[2]
out=root/'jogo/cuidado-acessivel/assets'
folders=['jogo/sprites-integros/assets','jogo/vida-natural/assets','jogo/renascimento/assets','jogo/novo-amanha/assets','jogo/vida-em-equilibrio/assets','jogo/encontros-da-floresta/assets']
manifest={};before=after=0
for folder in folders:
 for src in sorted((root/folder).glob('*.webp')):
  if src.stat().st_size<90000:continue
  name=src.stem+'-'+hashlib.sha256(str(src.relative_to(root)).encode()).hexdigest()[:8]+'.webp'
  target=out/name
  with Image.open(src) as im:
   im.save(target,format='WEBP',quality=81,method=6,exact=True,alpha_quality=100)
   with Image.open(target) as optimized:
    assert optimized.size==im.size
    assert optimized.getchannel('A').tobytes()==im.getchannel('A').tobytes() if im.mode=='RGBA' else True
  if target.stat().st_size>=src.stat().st_size:target.unlink();continue
  key=str(src.relative_to(root));value=str(target.relative_to(root));manifest[key]=value
  before+=src.stat().st_size;after+=target.stat().st_size
(out/'otimizados.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
(out.parent/'otimizados.js').write_text('window.GuardiaoArquivosLeves='+json.dumps(manifest,separators=(',',':'))+';\n')
(root/'desenvolvimento/cuidado-acessivel/peso-dos-assets.json').write_text(json.dumps(dict(files=len(manifest),originalBytes=before,optimizedBytes=after,savedPercent=round((1-after/before)*100,1)),indent=2)+'\n')
print(len(manifest),before,after)
