"""Empacota a arte gerada, sem pintar ou remover pixels; mede os quadros pelo alfa."""
from pathlib import Path
from PIL import Image
import numpy as np,json
from scipy.ndimage import label,find_objects
root=Path(__file__).resolve().parents[2];out=root/'jogo/raizes/assets';out.mkdir(exist_ok=True,parents=True)
sources={
'titulo':'exec-4b69a7f8-44ff-4189-9665-59f6c81cd7da.png',
'capa':'exec-9eaa3817-29a9-439d-a4d7-96df898d1f2f.png',
'mapa-cinzas':'exec-7443a8b2-54d6-4422-8fb5-07d352303ccf.png',
'mapa-vivo':'exec-88a426c8-594d-4567-8949-679843a7bbb7.png',
'kai':'exec-88682d75-60a9-4b89-8696-8221b6fe4db1.png',
'mangueira':'exec-9133a772-21aa-4052-bc65-a656d0149461.png',
'flora':'exec-17e44cb9-f1b7-40ee-9ebf-79d78f1d906e.png',
'npcs':'exec-a964a6d5-a8d8-4080-a2f5-fce777f476b3.png',
'acoes':'exec-5e35aba2-4242-4a7e-8507-a58213cecf86.png'}
atlas={}
for name,source in sources.items():
 im=Image.open(Path('/workspace/generated_images')/source)
 if name=='titulo':im.thumbnail((1000,1000))
 im.save(out/(name+'.webp'),format='WEBP',quality=82,method=5,exact=True)
 print(name,im.size,(out/(name+'.webp')).stat().st_size)
 if name in ['titulo','capa','mapa-cinzas','mapa-vivo']:continue
 cols,rows={'mangueira':(4,4),'kai':(4,4),'flora':(4,3),'npcs':(5,2),'acoes':(4,2)}[name]
 alpha=np.array(im.getchannel('A'));frames=[];heights=[]
 for row in range(rows):
  for col in range(cols):
   x0,x1=round(col*im.width/cols),round((col+1)*im.width/cols);y0,y1=round(row*im.height/rows),round((row+1)*im.height/rows)
   a=alpha[y0:y1,x0:x1]>140;components,n=label(a);counts=np.bincount(components.ravel());counts[0]=0;idx=counts.argmax();sl=find_objects((components==idx).astype(np.uint8))[0]
   yy,xx=sl;bounds=[max(x0,x0+xx.start-3),max(y0,y0+yy.start-3),min(x1,x0+xx.stop+3),min(y1,y0+yy.stop+3)]
   x,y,r,b=bounds;foot=(x+r)/2
   if name!='flora':
    ys,xs=np.where((components==idx)&(np.indices(a.shape)[0]>yy.stop-12));foot=x0+float(np.median(xs)) if len(xs) else foot
   frames.append({'bounds':[x,y,r-x,b-y],'pivot':[foot,b-3]})
   if name!='acoes' or row==0 and col in [0,1,3]:heights.append(yy.stop-yy.start)
 if name=='mangueira':
  rgba=np.array(im)
  for i,f in enumerate(frames):
   x,y,w,h=f['bounds'];c=rgba[y:y+h,x:x+w].astype(float)
   mask=(c[:,:,2]>c[:,:,0]*1.15)&(c[:,:,2]>c[:,:,1]*1.03)&(c[:,:,3]>160)
   yy,xx=np.where(mask);direction=i//2;a=-direction*np.pi/4;dx,dy=np.cos(a),np.sin(a)
   if len(xx):
    score=xx*dx+yy*dy;top=score>np.max(score)-4;f['nozzle']=[x+float(np.mean(xx[top]))+dx*3,y+float(np.mean(yy[top]))+dy*3]
   else:f['nozzle']=[f['pivot'][0]+dx*35,f['pivot'][1]-h*.55+dy*12]
 atlas[name]={'file':'assets/'+name+'.webp','width':im.width,'height':im.height,'referenceHeight':float(np.median(heights)),'frames':frames}
(out/'atlas.json').write_text(json.dumps(atlas,indent=2)+'\n');(out.parent/'atlas.js').write_text('window.GuardiaoRaizesAtlas='+json.dumps(atlas,separators=(',',':'))+';\n')
