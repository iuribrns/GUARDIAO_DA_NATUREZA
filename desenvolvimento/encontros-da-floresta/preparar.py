"""Silhuetas completas, poses alinhadas e recortes vetoriais no Inkscape."""
from pathlib import Path
from statistics import median
import json, sys, tempfile
import numpy as np
from PIL import Image
from scipy.ndimage import label,find_objects,binary_closing,binary_fill_holes,binary_dilation

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0,str(ROOT/'desenvolvimento/recortes'))
import empacotar as pack
pack.SOURCES=HERE/'fontes'
pack.OUT=ROOT/'jogo/encontros-da-floresta'
for folder in [pack.OUT/'assets',pack.CACHE]:folder.mkdir(parents=True,exist_ok=True)

def export(svg, name, width):
    source=pack.SOURCES/(name+'.svg');source.write_text(svg)
    with tempfile.TemporaryDirectory(prefix='guardiao-encontros-') as tmp:
        png=Path(tmp)/'arte.png'
        pack.run('inkscape',source,'--export-width='+str(width),'--export-filename='+str(png))
        pack.run('cwebp','-q','91','-alpha_q','100','-exact','-m','6',png,'-o',pack.OUT/'assets'/(name+'.webp'))

normal=pack.grid(pack.SOURCES/'encontros.png',2,3)
blink=pack.grid(pack.SOURCES/'encontros-piscada.png',2,3)
scenes=[]
for i,(a,b) in enumerate(zip(normal,blink),1):
    x=min(a['bounds'][0],b['bounds'][0])-8;y=min(a['bounds'][1],b['bounds'][1])-8
    w=max(a['bounds'][0]+a['bounds'][2],b['bounds'][0]+b['bounds'][2])+8-x
    h=max(a['bounds'][1]+a['bounds'][3],b['bounds'][1]+b['bounds'][3])+8-y
    # A câmera é a mesma nas duas poses: não reenquadra nem estica ao piscar.
    for pose,frame in [('olhar',a),('piscada',b)]:
        name=f'encontro-{i}-{pose}'
        svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="{x} {y} {w} {h}"><defs><clipPath id="figura"><path d="{frame["mask"]}"/></clipPath></defs><image href="{frame["source"].name}" width="1024" height="1536" clip-path="url(#figura)"/></svg>'
        export(svg,name,w)
    scenes.append({'id':i,'width':w,'height':h,'normal':f'assets/encontro-{i}-olhar.webp','blink':f'assets/encontro-{i}-piscada.webp'})

materials=pack.grid(pack.SOURCES/'cristais.png',5,1)
rgba=np.array(Image.open(pack.SOURCES/'montura.png'));r,g,b=rgba[:,:,:3].astype(float).transpose(2,0,1)
dark=(rgba[:,:,3]>200)&(g>r*1.12)&(b>r*1.05)&(r<70)&(np.maximum.reduce([r,g,b])<115)
dark[:650]=False
dark=binary_fill_holes(binary_closing(dark,iterations=2))
labels,count=label(dark);parts=[]
for i,slices in enumerate(find_objects(labels),1):
    if slices is not None and np.count_nonzero(labels[slices]==i)>500:
        parts.append({'mask':binary_dilation(labels==i,iterations=2),'x':slices[1].start,'y':slices[0].start})
assert len(parts)==5,'A montura precisa de cinco encaixes isolados.'
parts.sort(key=lambda p:p['y'])
top=sorted(parts[:2],key=lambda p:p['x']);middle=sorted(parts[2:4],key=lambda p:p['x'])
parts=[top[0],middle[0],parts[4],middle[1],top[1]]
colors=['#b92842','#339ac8','#d69b21','#2d9c61','#9857cf']
gems=[];slots=[]
for i,(part,material) in enumerate(zip(parts,materials)):
    yy,xx=np.nonzero(part['mask']);x,y=int(xx.min()),int(yy.min());w,h=int(xx.max()+1-x),int(yy.max()+1-y)
    shape=pack.rect_path(part['mask'][y:y+h,x:x+w],x,y)
    sx,sy,sw,sh=material['bounds'];texture=[sx+sw*.24,sy+sh*.18,sw*.52,sh*.70]
    # A textura mantém escala uniforme; a silhueta é o encaixe real da montura.
    # A seleção usa cor/alpha apenas para medir. O recorte e o acabamento são SVG.
    texture_box=" ".join(map(str,texture))
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{w+16}" height="{h+16}" viewBox="{x-8} {y-8} {w+16} {h+16}"><defs><clipPath id="slot"><path d="{shape}"/></clipPath><filter id="rim" x="-.08" y="-.08" width="1.16" height="1.16"><feMorphology in="SourceAlpha" operator="dilate" radius="1.5" result="expanded"/><feFlood flood-color="#e6bd69" result="gold"/><feComposite in="gold" in2="expanded" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(#rim)"><g clip-path="url(#slot)"><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{colors[i]}"/><svg x="{x}" y="{y}" width="{w}" height="{h}" viewBox="{texture_box}" preserveAspectRatio="xMidYMid slice" overflow="hidden"><image href="cristais.png" width="2172" height="724"/></svg></g></g></svg>'
    source=pack.SOURCES/f'fragmento-{i+1}.svg';source.write_text(svg)
    png=pack.SOURCES/f'fragmento-{i+1}.png'
    pack.run('inkscape',source,'--export-filename='+str(png))
    frame=pack.grid(png,1,1)[0];gems.append(frame)
    bx,by,bw,bh=frame['bounds'];slots.append([x-8+bx,y-8+by,bw,bh,0])
sheet=pack.pack('relicario','cristais',gems,median(f['bounds'][3] for f in gems))
whole=pack.grid(pack.SOURCES/'montura.png',1,1)[0]
svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><defs><clipPath id="all"><path d="{whole["mask"]}"/></clipPath></defs><image href="montura.png" width="1024" height="1536" clip-path="url(#all)"/></svg>'
export(svg,'montura',1024)
atlas={'scenes':scenes,'crystals':sheet,'mount':{'file':'assets/montura.webp','width':1024,'height':1536,'pendant':[142,565,740,960],'slots':slots}}
(pack.OUT/'assets/atlas.json').write_text(json.dumps(atlas,indent=2)+'\n')
(pack.OUT/'atlas.js').write_text('"use strict";window.GuardiaoEncontrosAtlas='+json.dumps(atlas,separators=(',',':'))+';\n')
print('Seis encontros em duas poses e cinco cristais completos, sem deformação.')
