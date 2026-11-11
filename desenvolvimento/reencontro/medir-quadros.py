"""Mede poses inteiras por componente alfa, sem redesenhar ou alterar as artes.

As linhas da prancha não são células uniformes: as duas últimas invadem a
divisão matemática. O manifesto guarda os retângulos reais e um pivô no corpo.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects, binary_dilation
from scipy.optimize import linear_sum_assignment

ROOT = Path(__file__).resolve().parents[2]
atlas = json.loads((ROOT / 'jogo/bosque-vivo/assets/atlas.json').read_text())
report = {}
for name, data in atlas.items():
    rgba = np.asarray(Image.open(ROOT / 'jogo/bosque-vivo' / data['file']))
    labels, count = label(rgba[:, :, 3] > 24)
    boxes = []
    for ident, slices in enumerate(find_objects(labels), 1):
        if np.count_nonzero(labels[slices] == ident) < 1200:
            continue
        ys, xs = slices
        boxes.append((xs.start, ys.start, xs.stop - xs.start, ys.stop - ys.start, ident))
    old = data['frames']
    cost = [[(f['bounds'][0]+f['bounds'][2]/2-x-w/2)**2 +
             (f['bounds'][1]+f['bounds'][3]/2-y-h/2)**2
             for x,y,w,h,_ in boxes] for f in old]
    rows, assigned = linear_sum_assignment(cost)
    assert len(rows) == len(old)
    frames = []
    sheet = Image.new('RGBA', (data['cols']*256, data['rows']*256))
    for i, chosen in zip(rows, assigned):
        x,y,w,h,ident = boxes[chosen]
        # Centro dos ombros: não acompanha o balanço dos pés nem a ponta do item.
        band = labels[y+int(h*.28):y+int(h*.48), x:x+w] == ident
        body_x = x + float(np.median(np.where(band)[1]))
        # Isole a pose antes de empacotar. Um retângulo na prancha original ainda
        # incluiria o pé da linha de cima em alguns quadros de frente.
        selection = labels == ident
        primary = set(int(v) for v in assigned)
        for extra, (xx,yy,ww,hh,other) in enumerate(boxes):
            if extra in primary:
                continue
            gap = max(x-xx-ww,xx-x-w,y-yy-hh,yy-y-h,0)
            if gap < 20:
                selection |= labels == other
        mask = binary_dilation(selection, iterations=2)
        yy,xx = np.where(mask)
        left,top,right,bottom = xx.min(),yy.min(),xx.max()+1,yy.max()+1
        patch = rgba[top:bottom,left:right].copy()
        patch[:,:,3] *= mask[top:bottom,left:right].astype(np.uint8)
        assert patch.shape[0] < 244 and patch.shape[1] < 244, (name,i,patch.shape)
        px,py = (i % data['cols'])*256+4,(i // data['cols'])*256+4
        sheet.paste(Image.fromarray(patch),(px+2,py+2))
        frame = {**old[i], 'bounds': [px,py,patch.shape[1]+4,patch.shape[0]+4],
                 'pivot': [round(px+2+body_x-left, 1), py+2+y+h-1-top]}
        if 'nozzle' in frame:
            frame['nozzle'] = [round(px+2+old[i]['nozzle'][0]-left,1),
                               round(py+2+old[i]['nozzle'][1]-top,1)]
        frames.append(frame)
    asset = ROOT / f'jogo/reencontro/assets/{name}.webp'
    asset.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(asset,format='WEBP',quality=90,method=6)
    report[name] = {'file':f'../reencontro/assets/{name}.webp',
                    'width':sheet.width,'height':sheet.height,'frames':frames}

target = ROOT / 'jogo/reencontro/quadros.js'
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text('"use strict";\n// Gerado por desenvolvimento/reencontro/medir-quadros.py.\n'
                  '(() => {\n  const frames = ' + json.dumps(report, ensure_ascii=False, separators=(',', ':'), default=lambda n:n.item()) +
                  ';\n  for (const [name, bank] of Object.entries(frames))\n'
                  '    Object.assign(BosqueKaiAtlas[name], bank);\n})();\n')
print(f'{sum(len(v["frames"]) for v in report.values())} poses isoladas em {len(report)} pranchas.')
