"""Isola poses completas em atlas com margem transparente; não redesenha a arte."""
from pathlib import Path
import json
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects, binary_dilation

ROOT=Path(__file__).resolve().parents[2]
sources=dict(zip(['flora','protecao','rio','parado'],sys.argv[1:]))
assert len(sources)>=3,'Informe Flora, traje, ações do rio e, opcionalmente, poses paradas.'
outdir=ROOT/'jogo/brisa-suave/assets';outdir.mkdir(parents=True,exist_ok=True)
result={}
for name,file in sources.items():
    a=np.array(Image.open(file).convert('RGBA'))
    rows,cols={'flora':(5,8),'protecao':(5,6),'rio':(8,4),'parado':(5,5)}[name]
    labels,n=label(a[:,:,3]>24)
    boxes=[]
    for ident,sl in enumerate(find_objects(labels),1):
        if np.count_nonzero(labels[sl]==ident)<700:continue
        y,x=sl;boxes.append((x.start,y.start,x.stop,y.stop,ident))
    assert len(boxes)==rows*cols,(name,len(boxes))
    # Ordene pela linha geométrica e depois pela coluna, não pelo topo da asa.
    boxes.sort(key=lambda b:(min(rows-1,int((b[1]+b[3])/2/(a.shape[0]/rows))),b[0]))
    sheet=Image.new('RGBA',(cols*256,rows*256));frames=[]
    for i,(x,y,xx,yy,ident) in enumerate(boxes):
        mask=binary_dilation(labels==ident,iterations=2)
        ys,xs=np.where(mask);left,top,right,bottom=xs.min(),ys.min(),xs.max()+1,ys.max()+1
        patch=a[top:bottom,left:right].copy();patch[:,:,3]*=mask[top:bottom,left:right].astype(np.uint8)
        # Normalização dos pixels totalmente transparentes evita resíduos RGB no atlas.
        patch[patch[:,:,3]==0]=0
        assert patch.shape[0]<244 and patch.shape[1]<244,(name,i,patch.shape)
        px,py=i%cols*256+4,i//cols*256+4
        sheet.paste(Image.fromarray(patch),(px+2,py+2))
        h=yy-y
        band=labels[y+int(h*(.86 if name=='flora' else .28)):y+int(h*(.98 if name=='flora' else .48)),x:xx]==ident
        axis=x+float(np.median(np.where(band)[1]))
        frame={'bounds':[px,py,int(right-left+4),int(bottom-top+4)],
               'pivot':[round(px+2+axis-left,1),int(py+2+yy-top-1)],'view':i//cols,'step':i%cols}
        if name=='parado':frame.update(view=i%cols,role=i//cols,step=0)
        if name=='rio' and i//cols<5:
            # Ponto da cabeça para manter Kai na mesma altura ao mudar de direção na água.
            rgb=a[y:yy,x:xx,:3].astype(float);valid=labels[y:yy,x:xx]==ident
            hair=(rgb[:,:,0]>rgb[:,:,1]*1.2)&(rgb[:,:,1]>rgb[:,:,2]*1.12)&(rgb[:,:,0]>65)&valid
            hair[int(h*.62):]=False
            hy,hx=np.where(hair)
            if not len(hx):hx=np.array([(xx-x)/2]);hy=np.array([h*.25])
            frame['head']=[round(px+2+x+float(np.median(hx))-left,1),round(py+2+y+float(np.median(hy))+h*.045-top,1)]
        frames.append(frame)
    sheet.save(outdir/(name+'.webp'),format='WEBP',quality=88,method=4)
    heights=[b[3]-b[1] for b in boxes]
    result[name]={'file':'assets/'+name+'.webp','width':sheet.width,'height':sheet.height,'rows':rows,'cols':cols,
                  'referenceHeight':float(np.median(heights[-4:] if name=='rio' else heights)), 'frames':frames}
(ROOT/'jogo/brisa-suave/atlas.js').write_text('"use strict";\nwindow.BrisaSuaveAtlas = '+json.dumps(result,separators=(',',':'))+';\n')
print('PASS: '+str(sum(len(v['frames']) for v in result.values()))+' poses completas em atlas isolados.')
