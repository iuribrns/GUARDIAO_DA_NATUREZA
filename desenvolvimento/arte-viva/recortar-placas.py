"""Exporta as três molduras da prancha de arte, sem alterar seus desenhos.

Uso: python3 desenvolvimento/arte-viva/recortar-placas.py FONTE.png
"""
from pathlib import Path
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import label, binary_dilation

root=Path(__file__).resolve().parents[2]
im=Image.open(sys.argv[1]).convert('RGBA')
assert im.size==(1672,941),'Use a prancha original de três molduras.'
for name,bounds,width in [('botao',(0,0,1672,315),1000),('regiao',(0,315,1672,625),640),('titulo',(0,625,1672,941),1200)]:
 a=np.array(im.crop(bounds));labels,n=label(a[:,:,3]>24)
 counts=np.bincount(labels.ravel());counts[0]=0
 mask=binary_dilation(labels==counts.argmax(),iterations=3)
 a[:,:,3]*=mask.astype('uint8')
 patch=Image.fromarray(a);patch=patch.crop(patch.getbbox())
 patch.thumbnail((width,1000),Image.Resampling.LANCZOS)
 patch.save(root/'jogo/arte-viva/assets'/(name+'.webp'),'WEBP',quality=90,method=6)
