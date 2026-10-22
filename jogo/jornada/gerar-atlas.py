"""Mede os recortes alfa das pranchas originais; não modifica as imagens."""
from pathlib import Path
from PIL import Image
import json, statistics
ROOT=Path(__file__).resolve().parents[2]
DIR=Path(__file__).resolve().parent
specs={'icones':(4,4),'kai-livre':(4,4),'kai-nadando':(4,4),'kai-rio':(4,3),'kai-floresta':(4,3),'kai-plantio':(4,3),'animais-rio':(4,4),'animais-fauna':(4,4),'animais-fauna-andando':(4,4),'objetos':(4,4),**{'recompensa-'+c:(4,2) for c in ['azul','amarelo','verde','violeta']}}
atlas={}
for name,(cols,rows) in specs.items():
 path=DIR/'assets'/f'{name}.png'
 if not path.exists():continue
 im=Image.open(path).convert('RGBA');w,h=im.size;frames=[]
 for row in range(rows):
  for col in range(cols):
   x0,y0=round(col*w/cols),round(row*h/rows);x1,y1=round((col+1)*w/cols),round((row+1)*h/rows)
   a=im.getchannel('A').crop((x0,y0,x1,y1));box=a.point(lambda n:255 if n>80 else 0).getbbox()
   if not box:raise ValueError(f'Quadro vazio {name} {row} {col}')
   left,top,right,bottom=box;left=max(0,left-2);top=max(0,top-2);right=min(x1-x0,right+2);bottom=min(y1-y0,bottom+2)
   bounds=[x0+left,y0+top,right-left,bottom-top]
   frames.append({'bounds':bounds,'pivot':[(x0+x1)/2,y0+bottom]})
 # The generated swim sheet places front at row2 and back at row4.
 if name=='kai-nadando':
  frames=[dict(frames[n]) for n in [0,1,10,11,12,13,10,11,8,9,2,3,4,5,2,3]]
  for i in [6,7,10,11]:frames[i]['flip']=True
 atlas[name]={'file':f'assets/{name}.png','width':w,'height':h,'referenceHeight':statistics.median(f['bounds'][3] for f in frames),'frames':frames}
path=ROOT/'tela-inicial/mapa-interativo/assets/01_npcs_dialogo.png';im=Image.open(path).convert('RGBA');w,h=im.size;frames=[]
for y,hh in [(0,312),(312,293),(605,299),(904,296),(1200,294),(1494,280)]:
 for col in range(3):
  x=round(col*w/3);xx=round((col+1)*w/3);a=im.getchannel('A').crop((x,y,xx,y+hh));b=a.point(lambda n:255 if n>80 else 0).getbbox() or (0,0,xx-x,hh)
  bounds=[x+b[0],y+b[1],b[2]-b[0],b[3]-b[1]];frames.append({'bounds':bounds,'pivot':[(x+xx)/2,y+b[3]]})
atlas['npcs']={'file':'../../tela-inicial/mapa-interativo/assets/01_npcs_dialogo.png','width':w,'height':h,'referenceHeight':statistics.median(f['bounds'][3] for f in frames),'frames':frames}
(DIR/'assets/atlas.json').write_text(json.dumps(atlas,ensure_ascii=False,indent=2)+'\n')
(DIR/'atlas.js').write_text('window.GuardiaoCampanhaAtlas='+json.dumps(atlas,ensure_ascii=False,separators=(',',':'))+';\n')
k=dict(atlas['kai-livre']);k['file']='../../jornada/assets/kai-livre.png'
(DIR/'atlas-floresta.js').write_text('window.GuardiaoFlorestaAtlas.sheets["kai-livre"]='+json.dumps(k,separators=(',',':'))+';\n')
print(len(atlas),'pranchas',sum(len(d['frames']) for d in atlas.values()),'quadros')
