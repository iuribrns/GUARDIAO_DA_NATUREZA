"""Conversão opcional das fontes da sessão; o build usa os WebP já prontos."""
import argparse,io,subprocess
from pathlib import Path
from PIL import Image
import numpy as np,json
from scipy.ndimage import label,find_objects
args=argparse.ArgumentParser(description=__doc__);args.add_argument('--fontes',type=Path,default=Path('/workspace/generated_images'));args=args.parse_args()
root=Path(__file__).resolve().parents[2];out=root/'jogo/viva/assets';src=args.fontes
files={'inicio':src/'exec-6e53156e-cdf2-4de3-a4d5-7b6017c7930c.png','botao':src/'exec-4d5f1a3e-0d8a-4cdf-bed2-b943db8960d8.png','encontros':src/'exec-6b7ed7bf-677e-4d2c-88cc-690504857318.png','final-kai':src/'exec-a5982acd-c65c-415f-96f2-c825caef5af9.png','folhas':io.BytesIO(subprocess.check_output(['git','show','7153220:tela-inicial/nova-versao/assets/folhas-sprites.png'],cwd=root)),'professor':root/'desenvolvimento/renascimento/fontes/equipe.png'}
atlas={}
for name,p in files.items():
 im=Image.open(p)
 if name=='botao':im.thumbnail((1100,1100))
 if name=='folhas':im.thumbnail((1000,1000))
 im.save(out/(name+'.webp'),'WEBP',quality=86 if name in ['botao','professor'] else 84,method=6,exact=True)
 if name in ['folhas','final-kai','professor']:
  cols,rows={'folhas':(4,2),'final-kai':(2,2),'professor':(4,3)}[name];frames=[]
  alpha=np.array(im.getchannel('A'))
  for row in range(rows):
   for col in range(cols):
    x0,x1=round(col*im.width/cols),round((col+1)*im.width/cols);y0,y1=round(row*im.height/rows),round((row+1)*im.height/rows)
    components,n=label(alpha[y0:y1,x0:x1]>110);counts=np.bincount(components.ravel());counts[0]=0;sl=find_objects((components==counts.argmax()).astype('uint8'))[0];yy,xx=sl
    x=max(x0,x0+xx.start-2);y=max(y0,y0+yy.start-2);r=min(x1,x0+xx.stop+2);b=min(y1,y0+yy.stop+2)
    frames.append({'bounds':[x,y,r-x,b-y],'pivot':[(x+r)/2,b-2]})
  atlas[name]={'file':'assets/'+name+'.webp','width':im.width,'height':im.height,'referenceHeight':frames[0]['bounds'][3],'frames':frames}
 elif name=='encontros':atlas[name]={'file':'assets/encontros.webp','width':im.width,'height':im.height,'cols':2,'rows':3}
 print(name,im.size,(out/(name+'.webp')).stat().st_size)
(out/'atlas.json').write_text(json.dumps(atlas,indent=2)+'\n');(out.parent/'atlas.js').write_text('window.VivaAtlas='+json.dumps(atlas,separators=(',',':'))+';\n')
