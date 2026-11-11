"""Mede os quadros e exporta a prancha pelo Inkscape, com alfa preservado."""
from pathlib import Path
import json,subprocess,sys,tempfile
import numpy as np
from PIL import Image
from scipy.ndimage import label,binary_dilation
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'desenvolvimento/recortes'))
from empacotar import rect_path,BIN
HERE=Path(__file__).resolve().parent
OUT=ROOT/'jogo/agua-viva'
im=np.array(Image.open(HERE/'fontes/agua-original.png').convert('RGBA'))
H,W=im.shape[:2];cw=ch=340
clips=[];draws=[];frames=[]
for i in range(16):
 r,c=divmod(i,4);x,y=round(c*W/4),round(r*H/4);x1,y1=round((c+1)*W/4),round((r+1)*H/4)
 a=im[y:y1,x:x1,3];labels,n=label(a>64);counts=np.bincount(labels.ravel());keep=counts>=8;keep[0]=False
 mask=binary_dilation(keep[labels],iterations=3)&(a>0)
 yy,xx=np.nonzero(mask);bx,by,bw,bh=int(xx.min()),int(yy.min()),int(xx.max()-xx.min()+1),int(yy.max()-yy.min()+1)
 tx,ty=c*cw+12,r*ch+12;dx,dy=tx-x,ty-y
 clips.append(f'<clipPath id="f{i}"><path d="{rect_path(mask,x,y)}"/></clipPath>')
 draws.append(f'<g transform="translate({dx} {dy})"><image href="agua-original.png" width="{W}" height="{H}" clip-path="url(#f{i})"/></g>')
 bounds=[tx+bx,ty+by,bw,bh]
 if i<8:
  near=(xx<xx.min()+20)&(a[yy,xx]>100)
  inlet_y=float(np.median(yy[near]))
  body_y=np.nonzero(a>128)[0]
  frames.append({'bodyHeight':int(body_y.max()-body_y.min()+1),'bounds':bounds,'inlet':[tx+bx+3,ty+inlet_y],'end':[tx+bx+bw-4,ty+inlet_y]})
 else:frames.append({'bounds':bounds,'pivot':[tx+bx+bw/2,ty+by+bh*.79]})
svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{cw*4}" height="{ch*4}"><defs>'+''.join(clips)+'</defs>'+''.join(draws)+'</svg>'
(HERE/'fontes/agua-quadros.svg').write_text(svg)
with tempfile.TemporaryDirectory() as tmp:
 png=Path(tmp)/'agua.png'
 subprocess.run([str(BIN/'inkscape'),str(HERE/'fontes/agua-quadros.svg'),f'--export-filename={png}'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 subprocess.run([str(BIN/'cwebp'),'-q','94','-alpha_q','100','-exact','-m','6',str(png),'-o',str(OUT/'assets/agua.webp')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
# Nozzle is measured on the blue metal, not on the character's bounding box.
atlas=json.loads((ROOT/'jogo/sprites-integros/assets/atlas.json').read_text())
anchors={}
for group,name in [('floresta','kai-mangueira'),('vida','kai-mangueira')]:
 sheet=atlas['grupos'][group][name];rgba=np.array(Image.open(ROOT/'jogo/sprites-integros'/sheet['file']).convert('RGBA'));points=[]
 for i,f in enumerate(sheet['frames']):
  x,y,w,h=f['bounds'];v=rgba[y:y+h,x:x+w].astype(float)
  blue=(v[:,:,2]>v[:,:,0]*1.35)&(v[:,:,2]>v[:,:,1]*1.05)&(v[:,:,2]>65)&(v[:,:,3]>100)
  yy,xx=np.nonzero(blue);d=i//(2 if group=='floresta' else 4)
  side=1 if d in [0,1,7] or (group=='floresta' and d in [2,5]) else -1 if d in [3,4,5] else 0
  if side:edge=xx.max() if side>0 else xx.min();sel=abs(xx-edge)<5;px=edge;py=float(np.median(yy[sel]))
  else:px=float((xx.min()+xx.max())/2);py=float((yy.min()+yy.max())/2)
  px=x+px-f['pivot'][0];py=y+py-f['pivot'][1]
  if group=='floresta' and d==5:px=-px
  points.append([round(px*63/sheet['referenceHeight'],3),round(py*63/sheet['referenceHeight'],3)])
 anchors['idle' if group=='floresta' else 'walk']=points
metadata={'width':cw*4,'height':ch*4,'file':'assets/agua.webp','fps':16,'streams':frames[:8],'splashes':frames[8:],'anchors':anchors}
(OUT/'assets/atlas.json').write_text(json.dumps(metadata,indent=2)+'\n')
(OUT/'atlas.js').write_text('window.GuardiaoAguaAtlas='+json.dumps(metadata,separators=(',',':'))+';\n')
print('Água: 8 jatos, 8 impactos e 48 engates de mangueira.',(OUT/'assets/agua.webp').stat().st_size,'bytes')
