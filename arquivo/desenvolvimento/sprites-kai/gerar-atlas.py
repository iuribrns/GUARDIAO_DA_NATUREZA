"""Analisa as pranchas sem alterar pixels; exporta metadados e recortes SVG."""
from pathlib import Path
from statistics import median
import json
from PIL import Image

root = Path(__file__).resolve().parents[2]
folder = root / 'assets/personagens/kai/animacoes'
images = {
    'caminhada': {'file': 'kai-caminhada.png', 'columns': 4, 'rows': [0,343,666,1024]},
    'acoes': {'file': 'kai-acoes.png', 'columns': 6, 'rows': [0,260,514,754,1024]}
}
frames = {}

def inspect(sheet, index):
    spec = images[sheet]
    image = Image.open(folder/spec['file'])
    width,height = image.size
    column,row = index % spec['columns'],index // spec['columns']
    left,right = round(column*width/spec['columns']),round((column+1)*width/spec['columns'])
    top,bottom = spec['rows'][row:row+2]
    alpha = image.getchannel('A').point(lambda value:255 if value>80 else 0)
    bounds = alpha.crop((left,top,right,bottom)).getbbox()
    if not bounds: raise ValueError(f'Quadro vazio: {sheet}/{index}')
    x0,y0,x1,y1 = bounds
    actual = [left+x0,top+y0,left+x1,top+y1]
    padded = [max(left,actual[0]-3),max(top,actual[1]-3),min(right,actual[2]+3),min(bottom,actual[3]+3)]
    return {'sheet':sheet,'sourceIndex':index,'bounds':[padded[0],padded[1],padded[2]-padded[0],padded[3]-padded[1]],'pivot':[(left+right)/2+12,actual[3]],'bodyHeight':actual[3]-actual[1]}

for index in range(12): frames[f'andando_{index+1:02}'] = inspect('caminhada',index)
for index in range(8): frames[f'pulo_{index+1:02}'] = inspect('acoes',12+index)
for index in range(4): frames[f'parado_{index+1:02}'] = inspect('acoes',20+index)
for key,spec in images.items():
    spec['width'],spec['height'] = Image.open(folder/spec['file']).size
    selected = [frame['bodyHeight'] for name,frame in frames.items() if frame['sheet']==key and (key=='caminhada' or name.startswith('parado'))]
    spec['referenceHeight'] = median(selected)
    spec['scale'] = 80/spec['referenceHeight']

data = {'version':1,'render':{'width':104,'height':100,'anchor':[52,94]},'images':images,'frames':frames,'animations':{
    'andando':{'frames':[f'andando_{index+1:02}' for index in range(12)],'distancePerCycle':96},
    'pulo':{'frames':[f'pulo_{index+1:02}' for index in range(8)],'loop':False},
    'parado':{'frames':[f'parado_{index+1:02}' for index in range(4)],'durations':[1100,220,120,220]}
}}
text = json.dumps(data,ensure_ascii=False,indent=2)+'\n'
(folder/'atlas.json').write_text(text)
(folder/'atlas.js').write_text('/* Gerado por desenvolvimento/sprites-kai/gerar-atlas.py. */\nwindow.GuardiaoKaiAtlas = '+text.rstrip()+';\n')
(folder/'quadros').mkdir(exist_ok=True)
for name,frame in frames.items():
    spec = images[frame['sheet']]
    x,y,w,h = frame['bounds'];px,py = frame['pivot']
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 104 100" width="104" height="100"><title>Kai — {name}</title><defs><clipPath id="quadro"><rect x="{x}" y="{y}" width="{w}" height="{h}"/></clipPath></defs><g transform="translate(52 94) scale({spec['scale']}) translate({-px} {-py})"><image href="../{spec['file']}" width="{spec['width']}" height="{spec['height']}" clip-path="url(#quadro)"/></g></svg>'''
    (folder/'quadros'/f'{name}.svg').write_text(svg+'\n')
print(f'{len(frames)} quadros finais: 12 de caminhada, 8 de pulo e 4 de repouso. PNGs originais preservados.')
