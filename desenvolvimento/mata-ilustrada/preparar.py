"""Empacota as artes originais em WebP e mede cada célula, sem distorcer os objetos."""
from PIL import Image
from pathlib import Path
import json
root=Path(__file__).resolve().parents[2]
out=root/'jogo/mata-ilustrada/assets'
out.mkdir(exist_ok=True)
source=Image.open('/workspace/generated_images/exec-f3913f42-06fe-4249-b438-3e3c7f55c368.png').convert('RGB')
texture=Image.new('RGB',(1536,768))
for i in range(8):
 x,y=i%4,i//4
 box=(round(x*source.width/4),round(y*source.height/2),round((x+1)*source.width/4),round((y+1)*source.height/2))
 texture.paste(source.crop(box).resize((384,384),Image.Resampling.LANCZOS),(x*384,y*384))
texture.save(out/'texturas.webp',quality=88,method=6)
props=Image.open('/workspace/generated_images/exec-9fee2c9c-f9d9-4ded-a351-0ae9b4f6ecab.png').convert('RGBA')
frames=[]
for i in range(24):
 x,y=(i%6)*256,(i//6)*256
 a=props.getchannel('A').crop((x,y,x+256,y+256))
 b=a.point(lambda v:255 if v>24 else 0).getbbox()
 if not b:raise ValueError(i)
 frames.append({'bounds':[x+b[0],y+b[1],b[2]-b[0],b[3]-b[1]]})
props.save(out/'aderecos.webp',quality=90,method=6)
(root/'jogo/mata-ilustrada/atlas.js').write_text('window.MataAtlas = '+json.dumps({'file':'assets/aderecos.webp','frames':frames},ensure_ascii=False,separators=(',',':'))+';\n')
print({p.name:p.stat().st_size for p in out.iterdir()})
