from pathlib import Path
from statistics import median
import sys,json,subprocess
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'desenvolvimento/recortes'))
import empacotar as pack
SOURCES=HERE/'fontes';OUT=ROOT/'jogo/novo-amanha';pack.SOURCES=SOURCES;pack.OUT=OUT
for p in [SOURCES,OUT/'assets',pack.CACHE]:p.mkdir(parents=True,exist_ok=True)
data={}
for name in ['traje-andar','traje-nadar','traje-acoes','fauna-brasileira','moradores','uniforme-resgate','uniforme-plantio','uniforme-voluntario','reencontros']:
 source=SOURCES/(name+'.png')
 if not source.exists():continue
 frames=pack.grid(source,4,2 if name=='reencontros' else 4)
 # All frame crops contain the complete connected silhouettes, including props.
 reference=median(f['bounds'][3] for f in frames[:8])
 data[name]=pack.pack('amanha',name,frames,reference)
 if name in ['traje-nadar','traje-acoes']:
  # Measure the head in each original pose; no raster pixels are altered.
  pixels=np.array(Image.open(source).convert('RGBA'))
  for original,frame in zip(frames,data[name]['frames']):
   x,y,w,h=original['bounds'];rgba=pixels[y:y+h,x:x+w].astype(float)
   rr,gg,bb,aa=[rgba[:,:,i] for i in range(4)]
   mask=(aa>170)&(rr>gg*1.24)&(gg>bb*1.24)&(gg>20)&(gg<180)
   yy,xx=np.nonzero(mask)
   hx=float(np.median(xx)) if len(xx)>30 else w*.5
   hy=float(np.median(yy)) if len(yy)>30 else h*.22
   frame['head']=[round(frame['bounds'][0]+hx,2),round(frame['bounds'][1]+hy,2)]
   frame['headRadius']=[round((float(np.percentile(xx,95)-np.percentile(xx,5))/2+8) if len(xx)>30 else w*.2,2),round((float(np.percentile(yy,95)-np.percentile(yy,5))/2+10) if len(yy)>30 else h*.2,2)]

for name in ['ilha-degradada','ilha-degradada-celular']:
 source=SOURCES/(name+'.png')
 if source.exists():subprocess.run([str(pack.BIN/'cwebp'),'-q','90','-m','6',str(source),'-o',str(OUT/'assets'/(name+'.webp'))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
(OUT/'assets/atlas.json').write_text(json.dumps(data,indent=2)+'\n')
(OUT/'atlas.js').write_text('window.GuardiaoAmanhaAtlas='+json.dumps(data,separators=(',',':'))+';\n')

# Os retratos do professor e as versões anteriores dos criadores são preservados.
source=SOURCES/'equipe-2d.png'
if source.exists():
 frames=pack.grid(source,4,2)
 pack.stable_heads(frames)
 team=pack.pack('amanha','equipe-2d',frames,median(f['bounds'][3] for f in frames))
 team['file']='../../jogo/novo-amanha/'+team['file']
 team['people']={'iuri':{'first':0,'count':4},'hicham':{'first':4,'count':4}}
 (OUT/'equipe-atlas.js').write_text('window.GuardiaoEquipe2DAtlas='+json.dumps(team,separators=(',',':'))+';\n')
 (OUT/'assets/equipe-atlas.json').write_text(json.dumps(team,indent=2)+'\n')
