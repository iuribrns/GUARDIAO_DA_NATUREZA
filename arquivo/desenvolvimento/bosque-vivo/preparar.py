"""Mede quadros e pontos de apoio e exporta WebP. Não redesenha os personagens."""
from pathlib import Path
import json, sys
import numpy as np
from PIL import Image
from scipy.ndimage import label

root = Path(__file__).resolve().parents[2]
source = Path('/workspace/generated_images')
out = root / 'jogo/bosque-vivo/assets'
files = {
    'explorador': 'exec-c704e2a9-aba8-4174-82b7-015a10c6e558.png',
    'protecao': 'exec-cb6722be-0160-48b9-85cb-12348b904412.png',
    'resgate': 'exec-5775bc1c-aa99-4639-bccf-e7b062c2ebdc.png',
    'voluntario': 'exec-28bdfa57-543e-474f-b89a-e7fdd80ca82e.png',
    'plantio': 'exec-ef7f5ddc-5719-452d-a23a-087e2b2df91d.png',
    'mangueira': 'exec-0c276a20-43df-467b-82a3-c1382e07ddd1.png',
    'tarefas': 'exec-5b5ad8f6-bfe1-4977-8d53-cb6043fdde26.png',
}
atlas = json.loads((out/'atlas.json').read_text())
for name, file in files.items():
    if len(sys.argv)>1 and name not in sys.argv[1:]:continue
    rows=4 if name=='tarefas' else 5
    im = Image.open(source/file)
    im.thumbnail((1374, 1374))
    alpha = np.array(im.getchannel('A'))
    frames = []
    for row in range(rows):
        group = []
        for col in range(6):
            x,x1 = round(col*im.width/6),round((col+1)*im.width/6)
            y,y1 = round(row*im.height/rows),round((row+1)*im.height/rows)
            labels,n = label(alpha[y:y1,x:x1]>150)
            counts=np.bincount(labels.ravel());counts[0]=0
            valid = np.flatnonzero(counts>max(30,counts.max()*.015))
            yy,xx=np.where(np.isin(labels,valid))
            left,top=max(x,x+int(xx.min())-2),max(y,y+int(yy.min())-2)
            right,bottom=min(x1,x+int(xx.max())+3),min(y1,y+int(yy.max())+3)
            torso = alpha[round(y+(y1-y)*.38):round(y+(y1-y)*.65),x:x1]>150
            _,tx=np.where(torso)
            group.append({'bounds':[left,top,right-left,bottom-top],'pivot':[x+float(np.median(tx)),bottom-2]})
        # A stride changes the legs, not the root position or the collision circle.
        px=float(np.median([f['pivot'][0]-round((i)*im.width/6)for i,f in enumerate(group)]))
        py=float(np.median([f['pivot'][1]for f in group]))
        for i,f in enumerate(group):
            f['pivot']=[round(i*im.width/6)+px,py]
            if name=='mangueira':
                x,y,w,h=f['bounds']
                crop=np.array(im)[y:y+h,x:x+w]
                mask=(crop[:,:,1]>130)&(crop[:,:,2]>140)&(crop[:,:,0]<crop[:,:,1]*.8)&(crop[:,:,3]>160)
                ly,lx=np.where(mask)
                f['nozzle']=[x+float(np.median(lx)),y+float(np.median(ly))] if len(lx) else [f['pivot'][0]+(0 if row in [2,4] else w*.3),y+h*.58]
        frames.extend(group)
    reference=[frames[i*6+5]['bounds'][3]for i in range(rows)] if name=='tarefas' else [f['bounds'][3]for f in frames]
    atlas[name]={'file':f'assets/{name}.webp','width':im.width,'height':im.height,'cols':6,'rows':rows,'referenceHeight':float(np.median(reference)),'frames':frames}
    im.save(out/f'{name}.webp','WEBP',quality=82,method=6,exact=True)
    print(name,len(frames),(out/f'{name}.webp').stat().st_size)
(out/'atlas.json').write_text(json.dumps(atlas,indent=2)+'\n')
(out.parent/'atlas.js').write_text('window.BosqueKaiAtlas='+json.dumps(atlas,separators=(',',':'))+';\n')
sheet=Image.new('RGBA',(600,160));previews={}
for i,name in enumerate(['explorador','protecao','resgate','plantio','voluntario']):
    im=Image.open(out/f'{name}.webp');x,y,w,h=atlas[name]['frames'][25]['bounds']
    crop=im.crop((x,y,x+w,y+h));crop.thumbnail((110,146));sheet.alpha_composite(crop,(i*120+(120-crop.width)//2,152-crop.height));previews[name]=[i*120,0,120,160]
sheet.save(out/'trajes-mini.webp','WEBP',quality=82,method=6)
(out.parent/'trajes.js').write_text('window.BosqueTrajes='+json.dumps(previews)+';\n')
