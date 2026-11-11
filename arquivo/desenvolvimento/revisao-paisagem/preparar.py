"""Mede silhuetas completas, compõe por SVG/Inkscape e exporta WebP."""
from pathlib import Path
from statistics import median
import sys,json
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'desenvolvimento/recortes'))
import empacotar as pack
pack.SOURCES=HERE/'fontes';pack.OUT=ROOT/'jogo/revisao-paisagem'
for p in [pack.SOURCES,pack.OUT/'assets',pack.CACHE]:p.mkdir(parents=True,exist_ok=True)
frames=pack.grid(pack.SOURCES/'plantas-nativas.png',4,3)
data=pack.pack('paisagem','plantas',frames,median(f['bounds'][3] for f in frames))
(pack.OUT/'assets/plantas.json').write_text(json.dumps(data,indent=2)+'\n')
(pack.OUT/'plantas-atlas.js').write_text('window.GuardiaoPlantasAtlas='+json.dumps(data,separators=(',',':'))+';\n')
