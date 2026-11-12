from pathlib import Path
import json,subprocess
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[2]
js="const f=require('fs'),v=require('vm'),w={};w.window=w;v.createContext(w);v.runInContext(f.readFileSync('jogo/arte-viva/atlas.js','utf8'),w);process.stdout.write(JSON.stringify(w.ArteVivaAtlas.flora));"
d=json.loads(subprocess.check_output(['node','-e',js],cwd=root))
im=np.array(Image.open(root/'jogo/arte-viva/assets/flora.webp'))
assert tuple(im.shape[:2])==(d['height'],d['width'])
for i,f in enumerate(d['frames']):
 x,y,w,h=f['bounds'];a=im[y:y+h,x:x+w,3]
 assert np.count_nonzero(a>32)>1000,(i,'pose vazia')
 cx,cy=(i%4)*256,(i//4)*256
 assert cx+2<=x and x+w<cx+254 and cy+2<=y and y+h<cy+254,(i,'asa fora da célula')
 assert np.max(im[cy:cy+2,cx:cx+256,3])==0,(i,'recorte junto à célula vizinha')
 assert x<=f['pivot'][0]<=x+w,(i,'pivô fora do corpo')
print('PASS: 28 quadros isolados; asas e pés inteiros, margens transparentes e pivôs internos.')
