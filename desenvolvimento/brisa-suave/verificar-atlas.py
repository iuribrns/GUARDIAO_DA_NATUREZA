from pathlib import Path
import subprocess,json
from PIL import Image
import numpy as np
from scipy.ndimage import label
ROOT=Path(__file__).resolve().parents[2]
script="const fs=require('fs'),vm=require('vm');const w={};w.window=w;vm.createContext(w);vm.runInContext(fs.readFileSync('jogo/brisa-suave/atlas.js','utf8'),w);process.stdout.write(JSON.stringify(w.BrisaSuaveAtlas));"
atlas=json.loads(subprocess.check_output(['node','-e',script],cwd=ROOT))
count=0
for name,d in atlas.items():
    im=Image.open(ROOT/'jogo/brisa-suave'/d['file'])
    assert im.size==(d['width'],d['height'])
    for i,f in enumerate(d['frames']):
        x,y,w,h=f['bounds'];assert x+w<=im.width and y+h<=im.height
        a=np.array(im.crop((x,y,x+w,y+h)))[:,:,3]
        assert max(a[0].max(),a[-1].max(),a[:,0].max(),a[:,-1].max())==0,(name,i,'margem cortada')
        ids,n=label(a>24);sizes=np.bincount(ids.ravel())[1:]
        assert sizes.max()/np.count_nonzero(a>24)>.99,(name,i,'fragmento de outra pose')
        assert f['view']==(i%d['cols'] if name=='parado' else i//d['cols'])
        if name=='rio' and i<20:assert all(np.isfinite(f['head']))
        count+=1
print(f'PASS: {count} novas poses completas e isoladas; margens, articulação por vista e pontos da cabeça válidos.')
