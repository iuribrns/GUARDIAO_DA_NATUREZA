"""Metadados dos novos quadros. Não altera os PNGs originais."""
from pathlib import Path
from PIL import Image
from statistics import median
import json
folder=Path(__file__).parent
sheets={}
specs=[('kai-recompensa','kai-recompensa-vermelha.png',[0,434,887]),('carlos','carlos-vermelho.png',None),('itens','itens-vermelhos.png',[0,552,887])]
for name,rows in {'kai-caminhada':[0,313,623,925,1246],'kai-mangueira':[0,313,623,925,1246],'kai-repouso':[0,443,887],'flora':[0,412,749,1086],'natureza':[0,560,1024],'capivara':[0,465,887],'cervo':[0,445,887],'passaro':[0,431,887],'kai-cuidados':[0,345,695,1024],'fogo':[0,443,887]}.items():
    specs.append((name,name+'-suave.png',rows))
for name,file,rows in specs:
    im=Image.open(folder/'assets'/file).convert('RGBA');w,h=im.size
    rows=rows or [0,round(h/2),h]
    alpha=im.getchannel('A').point(lambda v:255 if v>150 else 0);frames=[]
    for row,(top,bottom) in enumerate(zip(rows,rows[1:])):
        for i in range(4):
            columns=[round(w*j/4) for j in range(5)]
            if name=='natureza':columns=[0,420,835,1144,1536]
            if name=='flora':columns=[[0,387,730,1150,1448],[0,375,730,1135,1448],[0,375,700,1090,1448]][row]
            left,right=columns[i],columns[i+1]
            x,y,r,b=alpha.crop((left,top,right,bottom)).getbbox()
            feet=alpha.crop((left,max(top,top+b-12),right,top+b)).getbbox()
            sx,sy=left+x,top+y
            frames.append({'bounds':[sx,sy,r-x,b-y],'pivot':[(sx+left+r)/2 if name=='itens' else left+(feet[0]+feet[2])/2,top+b]})
    reference=median(f['bounds'][3] for f in frames)
    if name in ('capivara','cervo','passaro'):reference=median(frames[i]['bounds'][3] for i in [0,1,3])
    if name=='kai-cuidados':reference=median(frames[i]['bounds'][3] for i in [0,1,2,3,4,5,11])
    sheets[name]={'file':'../revisao/assets/'+file,'width':w,'height':h,'referenceHeight':reference,'frames':frames}
(folder/'atlas.js').write_text('Object.assign(window.GuardiaoFlorestaAtlas.sheets,'+json.dumps(sheets,separators=(',',':'))+');\n')
(folder/'assets'/'atlas-revisado.json').write_text(json.dumps(sheets,indent=2)+'\n')
print(sum(len(s['frames']) for s in sheets.values()),'quadros suaves registrados, PNGs preservados.')
