"""Mede os cinco encaixes da ilustração e exporta o colar para a cutscene."""
from pathlib import Path
import json, subprocess
import numpy as np
from PIL import Image
from scipy.ndimage import label, binary_fill_holes, binary_erosion
from empacotar import rect_path, BIN

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
OUT=ROOT/'jogo/colar-vivo'
source=HERE/'fontes/colar-vazio.png'
OUT.mkdir(parents=True,exist_ok=True)
(OUT/'assets').mkdir(exist_ok=True)
im=np.array(Image.open(source).convert('RGBA'))
specs=[
 ('vermelho',185,890,180,205,275,1000,'#ff6d55','#b51528'),
 ('azul',205,1110,200,195,290,1200,'#65daff','#1758bd'),
 ('amarelo',385,1255,245,145,510,1335,'#ffed77','#c58a13'),
 ('verde',625,1115,195,190,720,1200,'#a7f57a','#238351'),
 ('violeta',675,895,160,190,745,1000,'#d6b3ff','#7541bb'),
]
gems=[]
for name,x,y,w,h,px,py,light,dark in specs:
 roi=im[y:y+h,x:x+w]
 mask=(roi[:,:,:3].max(2)<125)&(roi[:,:,3]>180)
 labels,_=label(mask);cid=labels[py-y,px-x]
 assert cid>0
 mask=binary_erosion(binary_fill_holes(labels==cid),iterations=2)
 yy,xx=np.nonzero(mask)
 bounds=[x+int(xx.min()),y+int(yy.min()),int(xx.max()-xx.min()+1),int(yy.max()-yy.min()+1)]
 gems.append({'name':name,'path':rect_path(mask,x,y),'bounds':bounds,'center':[bounds[0]+bounds[2]/2,bounds[1]+bounds[3]/2],'light':light,'dark':dark})
metadata={'width':im.shape[1],'height':im.shape[0],'pendant':[176,775,671,735],'gems':gems}
(OUT/'geometria.js').write_text('window.GuardiaoColarGeometria='+json.dumps(metadata,separators=(',',':'))+';\n')
(OUT/'assets/geometria.json').write_text(json.dumps(metadata,indent=2)+'\n')
subprocess.run([str(BIN/'cwebp'),'-q','92','-alpha_q','100','-m','6',str(source),'-o',str(OUT/'assets/colar-vazio.webp')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
print('Colar: cinco encaixes medidos, pedras vermelha/azul/amarela/verde/violeta e arte vazia exportada.')
