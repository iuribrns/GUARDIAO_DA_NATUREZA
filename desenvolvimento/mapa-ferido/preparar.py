"""Converte as três artes para o tamanho de uso, preservando os originais.

Uso: python3 desenvolvimento/mapa-ferido/preparar.py MAPA.png PLACA.png KAI.png
"""
from pathlib import Path
import sys
from PIL import Image

out=Path(__file__).resolve().parents[2]/'jogo/mapa-ferido/assets'
out.mkdir(parents=True,exist_ok=True)
for source,name,size,quality in zip(sys.argv[1:4],['mapa-antes','placa-distante','kai-retrato'],[(1672,941),(640,249),(256,256)],[85,90,91]):
 im=Image.open(source).convert('RGBA' if name=='placa-distante' else 'RGB')
 im=im.resize(size,Image.Resampling.LANCZOS)
 im.save(out/(name+'.webp'),'WEBP',quality=quality,method=6)
