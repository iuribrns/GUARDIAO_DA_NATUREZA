"""Empacota poses isoladas, sem redesenhar a arte, e preserva os arquivos fonte."""
from pathlib import Path
import json
import subprocess
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'jogo/rio-claro'
CELL = 320

def isolate(im):
    a = np.array(im.convert('RGBA'))
    labels, count = ndimage.label(a[:, :, 3] > 12)
    sizes = np.bincount(labels.ravel())
    keep = sizes > 24
    keep[0] = False
    # Elimina apenas pontos soltos, nunca mãos, pés, rede ou bolsa.
    a[:, :, 3] *= keep[labels]
    im = Image.fromarray(a)
    return im.crop(im.getbbox())

def grid(path, rows, cols):
    im = Image.open(path).convert('RGBA')
    return [isolate(im.crop((round(c*im.width/cols), round(r*im.height/rows),
                             round((c+1)*im.width/cols), round((r+1)*im.height/rows))))
            for r in range(rows) for c in range(cols)]

def pack(name, poses, heads=None):
    sheet = Image.new('RGBA', (CELL*4, CELL*((len(poses)+3)//4)))
    frames = []
    for i, im in enumerate(poses):
        factor = 294/max(im.size)
        im = im.resize(tuple(round(n*factor) for n in im.size), Image.Resampling.LANCZOS)
        x = (i%4)*CELL+(CELL-im.width)//2
        y = (i//4)*CELL+(CELL-im.height)//2
        sheet.alpha_composite(im, (x, y))
        f = {'bounds':[x,y,im.width,im.height], 'pivot':[x+im.width/2,y+im.height]}
        if heads:
            hx,hy = heads[i]
            f['head'] = [round(x+im.width*hx,2),round(y+im.height*hy,2)]
        frames.append(f)
    sheet.save(OUT/f'assets/{name}.webp', 'WEBP', quality=88, method=6)
    return {'file':f'assets/{name}.webp','width':sheet.width,'height':sheet.height,
            'referenceHeight':260,'frames':frames}

swimmer,animals,branch = map(Path,sys.argv[1:4])
poses=grid(swimmer,3,4)
heads=[(.66,.30)]*4+[(.5,.24),(.5,.24),(.43,.27),(.43,.27)]+[(.66,.30)]*4
# As oito poses de peito são as artes originais, com os mesmos cachos e traje.
src="const fs=require('fs'),vm=require('vm'),w={};w.window=w;vm.runInNewContext(fs.readFileSync('jogo/vida-em-equilibrio/atlas.js','utf8'),w);process.stdout.write(JSON.stringify(w.GuardiaoEquilibrioAtlas['kai-acoes']));"
old=json.loads(subprocess.check_output(['node','-e',src],cwd=ROOT))
im=Image.open(ROOT/'jogo/cuidado-acessivel/assets/equilibrio-kai-acoes-5d14f669.webp').convert('RGBA')
for f in old['frames'][:8]:
    x,y,w,h=f['bounds']
    poses.append(isolate(im.crop((x,y,x+w,y+h))))
    heads.append((.5,.58))
data={'kai':pack('kai-nado',poses,heads),'animais':pack('animais-rio',grid(animals,3,4))}
im=isolate(Image.open(branch)); im.thumbnail((1000,320),Image.Resampling.LANCZOS)
im.save(OUT/'assets/galho.webp','WEBP',quality=88,method=6)
(OUT/'atlas.js').write_text('"use strict";\nwindow.RioClaroAtlas = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n')
print('Pranchas WebP:',len(poses),'poses de Kai; 12 animais; galho ilustrado.')
