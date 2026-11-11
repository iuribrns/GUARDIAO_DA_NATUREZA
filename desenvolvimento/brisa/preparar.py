"""Compacta as duas folhas de arte e mede cada sprite sem alterar os desenhos."""
from pathlib import Path
import json
from PIL import Image
import numpy as np
from scipy.ndimage import label
root=Path(__file__).resolve().parents[2]
src=Path('/workspace/generated_images'); out=root/'jogo/brisa/assets'
names=['gear','bag','hose','hand','pause','full','watering','net','seeds','shovel','vest','lifevest','kit','rope','key','plant']
atlas={}
for name,file,cols,rows,limit in [('interface','exec-4b793829-8de0-4f91-aee2-0b1a32b7addd.png',4,4,1100),('botanica','exec-987b14fb-5359-44ff-9b8a-e1f8a626500f.png',4,2,1100)]:
 im=Image.open(src/file).convert('RGBA'); im.thumbnail((limit,limit)); im.save(out/(name+'.webp'),'WEBP',quality=86,method=6,exact=True)
 frames=[];alpha=np.array(im.getchannel('A'))
 for row in range(rows):
  for col in range(cols):
   x,x1=round(col*im.width/cols),round((col+1)*im.width/cols);y,y1=round(row*im.height/rows),round((row+1)*im.height/rows)
   labels,n=label(alpha[y:y1,x:x1]>110);counts=np.bincount(labels.ravel());counts[0]=0;valid=np.flatnonzero(counts>max(15,(x1-x)*(y1-y)*.003));yy,xx=np.where(np.isin(labels,valid));bounds=[max(x,x+int(xx.min())-2),max(y,y+int(yy.min())-2),min(x1,x+int(xx.max())+3),min(y1,y+int(yy.max())+3)];bounds[2]-=bounds[0];bounds[3]-=bounds[1]
   frames.append({'name':names[row*cols+col] if name=='interface' else ['folha-lima','folha-verde','folha-curva','folha-dourada','flor-rosa','flor-branca','petala-rosa','petala-pessego'][row*cols+col],'bounds':bounds})
 atlas[name]={'file':'assets/'+name+'.webp','width':im.width,'height':im.height,'frames':frames}
 print(name,im.size,(out/(name+'.webp')).stat().st_size)
(out/'atlas.json').write_text(json.dumps(atlas,indent=2)+'\n');(out.parent/'atlas.js').write_text('window.BrisaAtlas='+json.dumps(atlas,separators=(',',':'))+';\n')
# Os seis comandos frequentes têm um atlas menor; a coleção completa é carregada ao abrir a mochila.
source=Image.open(out/'interface.webp').convert('RGBA');small=Image.new('RGBA',(576,384));frames=[]
for i,f in enumerate(atlas['interface']['frames'][:6]):
 x,y,w,h=f['bounds'];tile=source.crop((x,y,x+w,y+h));tile.thumbnail((164,164));xx=(i%3)*192+(192-tile.width)//2;yy=(i//3)*192+(192-tile.height)//2;small.alpha_composite(tile,(xx,yy));frames.append({'name':f['name'],'bounds':[xx,yy,tile.width,tile.height]})
small.save(out/'comandos.webp','WEBP',quality=84,method=6,exact=True);atlas['comandos']={'file':'assets/comandos.webp','width':576,'height':384,'frames':frames}
(out/'atlas.json').write_text(json.dumps(atlas,indent=2)+'\n');(out.parent/'atlas.js').write_text('window.BrisaAtlas='+json.dumps(atlas,separators=(',',':'))+';\n')
print('comandos',(out/'comandos.webp').stat().st_size)
