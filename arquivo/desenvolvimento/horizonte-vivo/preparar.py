"""Exporta a vista anterior, novos mapas e a dupla com Flora no ombro.
Pillow/NumPy apenas medem alfa; Inkscape/libwebp fazem a exportação.
"""
from pathlib import Path
from statistics import median
import json,sys,subprocess
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'desenvolvimento/recortes'))
import empacotar as packer
FONTES=HERE/'fontes';OUT=ROOT/'tela-inicial/horizonte-vivo'
for p in [FONTES,OUT/'assets',packer.CACHE]:p.mkdir(parents=True,exist_ok=True)
for name in ['vista','campo','mapa','mapa-verde','mapa-celular','mapa-celular-verde']:
 source=FONTES/(name+'.png')
 if source.exists():subprocess.run([str(packer.BIN/'cwebp'),'-q','90','-m','6',str(source),'-o',str(OUT/'assets'/(name+'.webp'))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
source=FONTES/'dupla.png'
if source.exists():
 packer.SOURCES=FONTES;packer.OUT=OUT
 frames=packer.grid(source,2,2)
 # Keep the same feet baseline and union framing across the breathing/blinking poses.
 sheet=packer.pack('horizonte','dupla',frames,median(f['bounds'][3] for f in frames))
 (OUT/'atlas.js').write_text('window.GuardiaoHorizonteAtlas='+json.dumps(sheet,separators=(',',':'))+';\n')
 (OUT/'assets/atlas.json').write_text(json.dumps(sheet,indent=2)+'\n')
