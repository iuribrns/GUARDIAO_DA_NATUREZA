"""Compacta as novas artes e mede recortes e pontos de apoio para o jogo."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects
root=Path(__file__).resolve().parents[2];src=Path('/workspace/generated_images');out=root/'jogo/sereno/assets';atlas={}
files={'inicio':('exec-76bbd96d-98ce-41f8-bfa2-00deaee6e2df.png',None),'oceano':('exec-6dcf368d-b274-46a7-899d-9c11b2c22ad3.png',None),'equipamentos':('exec-ac468147-0fce-4f2c-9ddc-96f0fcae2b1e.png',(6,4)),'conquista':('exec-ed04fd98-63ee-452e-a5c6-bc822b937f37.png',(4,2)),'kai':('exec-eb9472c0-3dfc-4763-a96f-7f6338c8557e.png',(4,4)),'mangueira':('exec-2e6e7842-2e2b-44b1-8ff5-c761d511fd94.png',(4,4)),'acoes':('exec-2fa003b3-fde5-4426-8f8b-8c926d8153d8.png',(4,2))}
old=json.loads((root/'jogo/raizes/assets/atlas.json').read_text())
for name,(file,grid)in files.items():
 im=Image.open(src/file); original=im.size
 if name not in ['inicio','oceano']:im.thumbnail((1280,1280))
 else:im.thumbnail((1672,1000))
 im.save(out/(name+'.webp'),'WEBP',quality=84,method=6,exact=True)
 if grid:
  cols,rows=grid;alpha=np.array(im.getchannel('A'));frames=[]
  for row in range(rows):
   row_frames=[]
   for col in range(cols):
    x,x1=round(col*im.width/cols),round((col+1)*im.width/cols);y,y1=round(row*im.height/rows),round((row+1)*im.height/rows)
    labels,n=label(alpha[y:y1,x:x1]>120);counts=np.bincount(labels.ravel());counts[0]=0;valid=np.flatnonzero(counts>max(10,(x1-x)*(y1-y)*.002));yy,xx=np.where(np.isin(labels,valid))
    left=max(x,x+int(xx.min())-2);top=max(y,y+int(yy.min())-2);right=min(x1,x+int(xx.max())+3);bottom=min(y1,y+int(yy.max())+3)
    f={'bounds':[left,top,right-left,bottom-top],'pivot':[(x+x1)/2,bottom-2]};row_frames.append(f)
    if name=='mangueira':
     nozzle=old[name]['frames'][row*cols+col]['nozzle'];f['nozzle']=[nozzle[0]*im.width/old[name]['width'],nozzle[1]*im.height/old[name]['height']]
   baseline=float(np.median([f['pivot'][1]for f in row_frames]))
   for f in row_frames:f['pivot'][1]=baseline
   frames.extend(row_frames)
  atlas[name]={'file':'assets/'+name+'.webp','width':im.width,'height':im.height,'cols':cols,'rows':rows,'referenceHeight':float(np.median([f['bounds'][3]for f in frames[:cols]])),'frames':frames}
 print(name,im.size,(out/(name+'.webp')).stat().st_size)
# As retocadas mantêm exatamente os apoios e a escala dos personagens aprovados.
for name in ['kai','mangueira','acoes']:
 d=atlas[name];sx=d['width']/old[name]['width'];sy=d['height']/old[name]['height'];d['referenceHeight']=old[name]['referenceHeight']*sy
 for f,prior in zip(d['frames'],old[name]['frames']):f['pivot']=[prior['pivot'][0]*sx,prior['pivot'][1]*sy]
# Pontos do amuleto nos quadros de conquista, medidos na cor dourada.
im=Image.open(out/'conquista.webp').convert('RGBA');a=np.array(im);hsv=np.array(im.convert('HSV'));sh=atlas['conquista']
for i,f in enumerate(sh['frames']):
 if i<2:continue
 x0=(i%4)*im.width/4;y0=(i//4)*im.height/2;yy,xx=np.indices(a.shape[:2])
 mask=(hsv[:,:,0]>21)&(hsv[:,:,0]<43)&(hsv[:,:,1]>125)&(hsv[:,:,2]>155)&(a[:,:,3]>200)&(xx>x0+im.width/4*.28)&(xx<x0+im.width/4*.8)&(yy>y0+im.height/2*.3)&(yy<y0+im.height/2*.79)
 lab,n=label(mask);counts=np.bincount(lab.ravel());counts[0]=0
 if n and counts.max()>18:
  r,c=find_objects((lab==counts.argmax()).astype('uint8'))[0];f['pendant']=[(c.start+c.stop)/2,(r.start+r.stop)/2,max(c.stop-c.start,r.stop-r.start)]
(out/'atlas.json').write_text(json.dumps(atlas,indent=2)+'\n');(out.parent/'atlas.js').write_text('window.SerenoAtlas='+json.dumps(atlas,separators=(',',':'))+';\n')
