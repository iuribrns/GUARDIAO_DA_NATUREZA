"""Empacota arte completa com margens; autoria e recortes via SVG/Inkscape."""
from pathlib import Path
from statistics import median
import json, sys, tempfile

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / 'desenvolvimento/recortes'))
import empacotar as pack
pack.SOURCES = HERE / 'fontes'
pack.OUT = ROOT / 'jogo/encanto-natural'
for d in [pack.OUT / 'assets', pack.CACHE]:
    d.mkdir(parents=True, exist_ok=True)

flora = pack.grid(pack.SOURCES / 'flora.png', 4, 4)
# O tamanho de referência é o corpo pousado, não a envergadura das asas.
# Todas as poses são preservadas, com margem transparente e pivô nos pés.
sheet = pack.pack('encanto', 'flora', flora, median(f['bounds'][3] for f in flora[12:14]))
sheet['file'] = '../../encanto-natural/' + sheet['file']
(pack.OUT / 'assets/flora-atlas.json').write_text(json.dumps(sheet, indent=2) + '\n')
(pack.OUT / 'flora-atlas.js').write_text('"use strict";window.GuardiaoFloraEncanto=' + json.dumps(sheet, separators=(',', ':')) + ';if(window.GuardiaoVidaAtlas)window.GuardiaoVidaAtlas.flora=window.GuardiaoFloraEncanto;\n')

parts = pack.grid(pack.SOURCES / 'molduras.png', 2, 2)
for name, f in zip(['placa-verde', 'titulo', 'ramo', 'pergaminho'], parts):
    x, y, w, h = f['bounds']
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="{x} {y} {w} {h}"><defs><clipPath id="shape"><path d="{f["mask"]}"/></clipPath></defs><image href="molduras.png" width="1536" height="1024" clip-path="url(#shape)"/></svg>'
    source = pack.SOURCES / (name + '.svg')
    source.write_text(svg)
    with tempfile.TemporaryDirectory(prefix='guardiao-encanto-') as temp:
        png = Path(temp) / 'arte.png'
        pack.run('inkscape', source, '--export-width=' + str(min(w, 760)), '--export-filename=' + str(png))
        pack.run('cwebp', '-q', '90', '-alpha_q', '100', '-exact', '-m', '6', png, '-o', pack.OUT / 'assets' / (name + '.webp'))

# Miniatura limpa para pausas e ícones; não mantém a prancha inteira no SVG.
f = flora[12]
x,y,w,h = f['bounds']
source = pack.SOURCES / 'retrato.svg'
source.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="{x-w*.16} {y-h*.04} {w*1.32} {h*1.08}"><defs><clipPath id="owl"><path d="{f["mask"]}"/></clipPath></defs><image href="flora.png" width="1310" height="1200" clip-path="url(#owl)"/></svg>')
with tempfile.TemporaryDirectory(prefix='guardiao-flora-') as temp:
    png = Path(temp) / 'retrato.png'
    pack.run('inkscape', source, '--export-filename=' + str(png))
    pack.run('cwebp', '-q','90','-alpha_q','100','-exact',png,'-o',pack.OUT/'assets/flora-retrato.webp')
print('Prontos: 16 poses da Flora, quatro molduras e retrato.')
