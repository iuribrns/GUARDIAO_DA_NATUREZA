"""Descreve recortes sem alterar os PNGs originais gerados para a floresta."""
import json
from pathlib import Path
from statistics import median
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
FOLDER = ROOT / 'jogo/floresta-viva/assets'
SPECS = {
    'kai-mangueira': [0,313,623,925,1246],
    'kai-caminhada': [0,313,623,925,1246],
    'kai-repouso': [0,443,887],
    'kai-recompensa': [0,434,887],
    'flora': [0,412,749,1086],
    'capivara': [0,465,887],
    'cervo': [0,445,887],
    'passaro': [0,431,887],
    'carlos': [0,438,887],
    'natureza': [0,560,1024],
    'itens': [0,552,887],
}
atlas = {'version': 1, 'sheets': {}}
frames_folder = FOLDER / 'quadros'
frames_folder.mkdir(exist_ok=True)
for name, rows in SPECS.items():
    im = Image.open(FOLDER / (name + '.png')).convert('RGBA')
    width, height = im.size
    assert rows[-1] == height, name
    alpha = im.getchannel('A').point(lambda p: 255 if p > 150 else 0)
    frames = []
    for row, (top, bottom) in enumerate(zip(rows, rows[1:])):
        columns = [round(i * width / 4) for i in range(5)]
        if name == 'natureza':
            columns = [0,420,835,1144,1536]
        if name == 'flora':
            columns = [[0,387,730,1150,1448],[0,375,730,1135,1448],[0,375,700,1090,1448]][row]
        for col, (left, right) in enumerate(zip(columns, columns[1:])):
            box = alpha.crop((left, top, right, bottom)).getbbox()
            assert box, (name, row, col)
            x, y, r, b = box
            # Limites ampliados só dentro da célula; os arquivos de arte permanecem intactos.
            sx, sy = max(left, left+x-2), max(top, top+y-2)
            ex, ey = min(right, left+r+2), min(bottom, top+b+2)
            feet = alpha.crop((left, max(top,top+b-12), right, top+b)).getbbox()
            px = left + (feet[0]+feet[2])/2
            if name in ('natureza','itens'):
                px = (sx+ex)/2
            frame = {'bounds':[sx,sy,ex-sx,ey-sy], 'pivot':[px,top+b]}
            frames.append(frame)
    reference = median(f['bounds'][3] for f in frames)
    if name in ('capivara','cervo','passaro'):
        reference = median(frames[i]['bounds'][3] for i in [0,1,3])
    atlas['sheets'][name] = {'file':name+'.png','width':width,'height':height,'referenceHeight':reference,'frames':frames}
    for i, frame in enumerate(frames):
        x,y,w,h = frame['bounds']
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="{x} {y} {w} {h}"><image xlink:href="../{name}.png" width="{width}" height="{height}"/></svg>\n'
        (frames_folder / f'{name}-{i+1:02}.svg').write_text(svg)
(FOLDER/'atlas.json').write_text(json.dumps(atlas,ensure_ascii=False,indent=2)+'\n')
(FOLDER/'atlas.js').write_text('window.GuardiaoFlorestaAtlas='+json.dumps(atlas,ensure_ascii=False,separators=(',',':'))+';\n')
print(sum(len(s['frames']) for s in atlas['sheets'].values()), 'quadros descritos, PNGs preservados.')
