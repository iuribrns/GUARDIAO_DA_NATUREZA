"""Verifica isolamento real das poses, inclusive cabeças e pés entre linhas."""
import json
from pathlib import Path
import subprocess
import numpy as np
from PIL import Image
from scipy.ndimage import label

ROOT=Path(__file__).resolve().parents[2]
script='''const fs=require('fs'),vm=require('vm');
const names=['explorador','protecao','resgate','plantio','voluntario','mangueira','equipamentos','tarefas'];
const w={BosqueKaiAtlas:Object.fromEntries(names.map(n=>[n,{}]))};w.window=w;vm.createContext(w);
vm.runInContext(fs.readFileSync('jogo/reencontro/quadros.js','utf8'),w);
process.stdout.write(JSON.stringify(w.BosqueKaiAtlas));'''
atlas=json.loads(subprocess.check_output(['node','-e',script],cwd=ROOT))
total=0
for name,d in atlas.items():
    im=Image.open(ROOT/'jogo/bosque-vivo'/d['file'])
    assert im.size == (d['width'],d['height'])
    for i,f in enumerate(d['frames']):
        x,y,w,h=f['bounds']
        a=np.array(im.crop((x,y,x+w,y+h)))[:,:,3]
        assert a.max()>220, (name,i,'pose vazia')
        assert a[0].max()==0 and a[-1].max()==0 and a[:,0].max()==0 and a[:,-1].max()==0, (name,i,'margem cortada')
        components,n=label(a>24)
        sizes=sorted(np.bincount(components.ravel())[1:],reverse=True)
        if name not in ['equipamentos','tarefas']:
            assert sizes[0] / np.count_nonzero(a>24) > .99,(name,i,'parte de outro personagem')
        assert x%256==4 and y%256==4 and w<248 and h<248,(name,i,'célula invadida')
        total+=1
print(f'PASS: {total} poses, oito pranchas; corpos inteiros, margens transparentes e nenhuma parte do quadro vizinho.')
