"""Empacota os oito bonecos de corpo inteiro sem cortar cabelo, mãos e botas.
A análise mede alfa; a composição e conversão são feitas por Inkscape e libwebp.
"""
from pathlib import Path
from statistics import median
import json, sys
ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'desenvolvimento/recortes'))
import empacotar as packer
OUT=ROOT/'tela-inicial/equipe-2d'
packer.SOURCES=HERE/'fontes';packer.OUT=OUT
for folder in [packer.SOURCES,OUT/'assets',packer.CACHE]:folder.mkdir(parents=True,exist_ok=True)
frames=packer.grid(packer.SOURCES/'estudantes.png',4,2)
packer.stable_heads(frames)
sheet=packer.pack('equipe','corpo-inteiro',frames,median(f['bounds'][3] for f in frames))
sheet['people']={'iuri':{'first':0,'count':4},'hicham':{'first':4,'count':4}}
(OUT/'assets/atlas.json').write_text(json.dumps(sheet,indent=2)+'\n')
(OUT/'atlas.js').write_text('window.GuardiaoEquipe2DAtlas='+json.dumps(sheet,separators=(',',':'))+';\n')
