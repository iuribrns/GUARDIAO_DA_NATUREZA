"""Compacta as peças ilustradas e mede cada silhueta para o renderizador."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy.ndimage import label
root=Path(__file__).resolve().parents[2]
out=root/'jogo/bosque-vivo/assets'
files={'vegetacao':('exec-284632a5-8124-4482-b12a-97ecbfb8d8ce.png',4,3),'objetos':('exec-1048a7a5-fcf8-439e-a0d8-4586d8370a44.png',4,2)}
atlas={}
for name,(file,cols,rows)in files.items():
 im=Image.open(Path('/workspace/generated_images')/file);im.thumbnail((1376,1152));alpha=np.array(im.getchannel('A'));frames=[]
 for row in range(rows):
  for col in range(cols):
   x,x1=round(col*im.width/cols),round((col+1)*im.width/cols);y,y1=round(row*im.height/rows),round((row+1)*im.height/rows)
   lab,n=label(alpha[y:y1,x:x1]>150);counts=np.bincount(lab.ravel());counts[0]=0;valid=np.flatnonzero(counts>max(10,counts.max()*.001));yy,xx=np.where(np.isin(lab,valid))
   left,top=max(x,x+int(xx.min())-2),max(y,y+int(yy.min())-2);right,bottom=min(x1,x+int(xx.max())+3),min(y1,y+int(yy.max())+3)
   frames.append({'bounds':[left,top,right-left,bottom-top]})
 im.save(out/f'{name}.webp','WEBP',quality=83,method=6,exact=True)
 atlas[name]={'file':f'assets/{name}.webp','width':im.width,'height':im.height,'frames':frames}
 print(name,im.size,(out/f'{name}.webp').stat().st_size,flush=True)
(out/'cenario-atlas.json').write_text(json.dumps(atlas,indent=2)+'\n')
(out.parent/'cenario-atlas.js').write_text('window.BosqueVegetacaoAtlas='+json.dumps(atlas,separators=(',',':'))+';\n')
