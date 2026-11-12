"""Converte cenários e empacota as poses da Flora sem redesenhar os originais.

Uso: python3 desenvolvimento/arte-viva/preparar.py INICIO MAPA ANTES FLORA
As quatro fontes são imagens criadas com a ferramenta de arte, fora da publicação.
"""
from pathlib import Path
import json, subprocess, sys
import numpy as np
from PIL import Image
from scipy.ndimage import label, binary_dilation

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'jogo/arte-viva/assets'
OUT.mkdir(parents=True, exist_ok=True)
for source, name in zip(sys.argv[1:4], ['inicio', 'mapa-depois', 'mapa-antes']):
    im = Image.open(source).convert('RGB')
    im.save(OUT / (name + '.webp'), 'WEBP', quality=85, method=6)

js = "const fs=require('fs'),vm=require('vm');let w={};w.window=w;vm.createContext(w);vm.runInContext(fs.readFileSync('jogo/encanto-natural/flora-atlas.js','utf8'),w);process.stdout.write(JSON.stringify(w.GuardiaoFloraEncanto));"
old = json.loads(subprocess.check_output(['node', '-e', js], cwd=ROOT))
canonical = Image.open(ROOT / 'jogo/encanto-natural/assets/encanto-flora.webp').convert('RGBA')
new = Image.open(sys.argv[4]).convert('RGBA')
patches = [canonical.crop((x, y, x+w, y+h)) for x,y,w,h in [f['bounds'] for f in old['frames']]]
# Cada célula nova tem uma pose independente. Componentes alfa desconectados
# minúsculos são ruído da exportação; não viram penas de outra célula.
for row in range(3):
    for col in range(4):
        cell = np.array(new.crop((round(col*new.width/4), round(row*new.height/3), round((col+1)*new.width/4), round((row+1)*new.height/3))))
        labels, n = label(cell[:,:,3] > 24)
        counts = np.bincount(labels.ravel()); counts[0] = 0
        mask = binary_dilation(labels == counts.argmax(), iterations=3)
        cell[:,:,3] *= mask.astype('uint8')
        patch = Image.fromarray(cell)
        patches.append(patch.crop(patch.getbbox()))

sheet = Image.new('RGBA', (1024, 1792))
frames = []
for i, patch in enumerate(patches):
    # A escala é comum a todas as asas de uma direção, sem pulsar entre quadros.
    ref = old['referenceHeight'] if i < 16 else patches[19 + ((i-16)//4)*4].height
    scale = min(200/ref, 242/max(patch.size))
    patch = patch.resize((round(patch.width*scale), round(patch.height*scale)), Image.Resampling.LANCZOS)
    x, y = (i%4)*256 + (256-patch.width)//2, (i//4)*256 + 250-patch.height
    sheet.paste(patch, (x,y))
    # O pivô das poses antigas conserva o centro do corpo da prancha original.
    pivot_x = x + patch.width/2
    if i < 16:
        f = old['frames'][i]
        pivot_x = x + (f['pivot'][0]-f['bounds'][0])*scale
    frames.append({'bounds':[x,y,patch.width,patch.height], 'pivot':[round(pivot_x,2),250+(i//4)*256]})
sheet.save(OUT/'flora.webp', 'WEBP', quality=91, method=6)
data = {'file':'../arte-viva/assets/flora.webp','width':1024,'height':1792,'referenceHeight':200,'frames':frames}
(OUT.parent/'atlas.js').write_text('"use strict";\nwindow.ArteVivaAtlas = '+json.dumps({'flora':data}, ensure_ascii=False, indent=2)+';\n')
print('28 poses: 16 originais preservadas e 12 vistas complementares; cenários WebP.')
