"""Mede silhuetas completas; Inkscape compõe e WebP exporta os novos assets."""
from pathlib import Path
from statistics import median
import sys,json,subprocess
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'desenvolvimento/recortes'))
import empacotar as pack
pack.SOURCES=HERE/'fontes';pack.OUT=ROOT/'jogo/vida-em-equilibrio'
for path in [pack.SOURCES,pack.OUT/'assets',pack.CACHE]:path.mkdir(parents=True,exist_ok=True)
data={}
for name,rows in [('fauna-grande',3),('fauna-copa',2),('vida-rio',3),('kai-acoes',3)]:
 source=pack.SOURCES/(name+'.png');frames=pack.grid(source,4,rows)
 data[name]=pack.pack('equilibrio',name,frames,median(f['bounds'][3] for f in frames))
 if name=='kai-acoes':
  pixels=np.array(Image.open(source).convert('RGBA'))
  for original,frame in zip(frames[:8],data[name]['frames'][:8]):
   x,y,w,h=original['bounds'];rgba=pixels[y:y+h,x:x+w].astype(float)
   rr,gg,bb,aa=[rgba[:,:,i] for i in range(4)]
   mask=(aa>170)&(rr>gg*1.24)&(gg>bb*1.24)&(gg>20)&(gg<180)
   yy,xx=np.nonzero(mask)
   hx=float(np.median(xx));hy=float(np.median(yy))
   frame['head']=[round(frame['bounds'][0]+hx,2),round(frame['bounds'][1]+hy,2)]
   frame['headRadius']=[round(float(np.percentile(xx,95)-np.percentile(xx,5))/2+8,2),round(float(np.percentile(yy,95)-np.percentile(yy,5))/2+10,2)]
for name in ['mapa','mapa-celular']:
 source=pack.SOURCES/(name+'.png')
 if source.exists():subprocess.run([str(pack.BIN/'cwebp'),'-q','90','-m','6',str(source),'-o',str(pack.OUT/'assets'/(name+'.webp'))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
(pack.OUT/'assets/atlas.json').write_text(json.dumps(data,indent=2)+'\n')
(pack.OUT/'atlas.js').write_text('window.GuardiaoEquilibrioAtlas='+json.dumps(data,separators=(',',':'))+';\n')
