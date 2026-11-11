"""Empacota silhuetas completas por SVG/Inkscape e exporta WebP para a interface."""
from pathlib import Path
from statistics import median
import sys, json, tempfile

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / 'desenvolvimento/recortes'))
import empacotar as pack

pack.SOURCES = HERE / 'fontes'
pack.OUT = ROOT / 'jogo/interface-viva'
for folder in [pack.SOURCES, pack.OUT / 'assets', pack.CACHE]:
    folder.mkdir(parents=True, exist_ok=True)

groups = {
    'ferramentas': (3, ['luvas', 'mangueira', 'kit', 'rede', 'protecao', 'corda', 'chave', 'pa', 'sementes', 'regador', 'solar', 'mochila']),
    'simbolos': (4, ['water', 'fire', 'paw', 'leaf', 'trash', 'fish', 'turtle', 'recycle', 'sun', 'gear', 'lock', 'shield', 'heart', 'bike', 'bus', 'compass']),
}
atlas = {}
for name, (rows, names) in groups.items():
    frames = pack.grid(pack.SOURCES / (name + '.png'), 4, rows)
    sheet = pack.pack('viva', name, frames, median(f['bounds'][3] for f in frames))
    # Ícones de 130–180 px mantêm detalhe para telas com densidade 2x.
    # A composição vetorial preserva a silhueta; só a resolução pública muda.
    with tempfile.TemporaryDirectory(prefix='guardiao-interface-') as temp:
        png = Path(temp) / 'interface.png'
        pack.run('inkscape', pack.SOURCES / ('viva-' + name + '.svg'),
                 '--export-width=' + str(sheet['width'] // 2), '--export-filename=' + str(png))
        pack.run('cwebp', '-q', '90', '-alpha_q', '100', '-exact', '-m', '6', png,
                 '-o', pack.OUT / sheet['file'])
    sheet['width'] //= 2
    sheet['height'] //= 2
    sheet['referenceHeight'] /= 2
    for frame in sheet['frames']:
        frame['bounds'] = [value / 2 for value in frame['bounds']]
        frame['pivot'] = [value / 2 for value in frame['pivot']]
    sheet['keys'] = {key: i for i, key in enumerate(names)}
    atlas[name] = sheet
(pack.OUT / 'assets/atlas.json').write_text(json.dumps(atlas, indent=2) + '\n')
(pack.OUT / 'atlas.js').write_text('window.GuardiaoInterfaceAtlas=' + json.dumps(atlas, separators=(',', ':')) + ';\n')
print(json.dumps({name: {'quadros': len(s['frames']), 'arquivo': s['file']} for name, s in atlas.items()}))
