"""Artes de Renascimento: exportação nativa WebP e silhuetas com margens."""
from pathlib import Path
import sys,json,subprocess
from statistics import median
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'desenvolvimento/recortes'))
import empacotar as packer
FONTES=HERE/'fontes';UI=ROOT/'tela-inicial/renascimento';WORLD=ROOT/'jogo/renascimento'
SOURCES={
 'inicio-cinzas':'exec-2f2dc1a5-3b42-45aa-8752-72a8a1f36e1c.png',
 'inicio-curado':'exec-fd35cc9d-cc6a-454e-8222-febce000adc8.png',
 'ilha-cinzas':'exec-4e519f1e-2844-4415-8060-6c04c3d7a1de.png',
 'ilha-curada':'exec-c72fe00e-3069-4329-b40c-0b8adf881966.png',
 'floresta':'exec-266447a0-225b-419e-9d0c-9eedc6354094.png',
 'rio':'exec-a1d59c6d-c2ff-4a43-9462-bc284367a429.png',
 'fauna':'exec-072bc571-f2b7-4ac5-9bd8-73979418e84a.png',
 'plantio':'exec-02bb1093-3011-40c9-adbd-797ed1ff40ff.png',
 'cidade':'exec-f42bb5a3-1abf-49c6-8213-22e3992732f6.png',
 'equipe':'exec-5d9267b7-ddf6-4357-8eef-2e5c2e4d3317.png',
 'arvores':'exec-fc5eb52a-409a-4b18-9417-12831cfdedd1.png'}
for folder in [FONTES,UI/'assets',WORLD/'assets']:folder.mkdir(exist_ok=True,parents=True)
for name,filename in SOURCES.items():
 target=FONTES/(name+'.png')
 if not target.exists():target.write_bytes((Path('/workspace/generated_images')/filename).read_bytes())
for name in ['inicio-cinzas','inicio-curado','ilha-cinzas','ilha-curada','floresta','rio','fauna','plantio','cidade']:
 target=(UI if name.startswith(('inicio','ilha')) else WORLD)/'assets'/(name+'.webp')
 subprocess.run([str(packer.BIN/'cwebp'),'-q','90','-m','6',str(FONTES/(name+'.png')),'-o',str(target)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 print(name,target.stat().st_size,'bytes',flush=True)
packer.SOURCES=FONTES;packer.OUT=UI
portraits=packer.grid(FONTES/'equipe.png',4,3)
equipe=packer.pack('renascimento','equipe',portraits,median(f['bounds'][3] for f in portraits))
equipe['file']='tela-inicial/renascimento/'+equipe['file']
packer.OUT=WORLD
trees=packer.grid(FONTES/'arvores.png',2,2)
arvores=packer.pack('renascimento','arvores',trees,median(f['bounds'][3] for f in trees))
arvores['file']='jogo/renascimento/'+arvores['file']
data={'equipe':equipe,'arvores':arvores}
(UI/'atlas.js').write_text('window.GuardiaoRenascimentoAtlas='+json.dumps(data,separators=(',',':'))+';\n')
(UI/'assets/atlas.json').write_text(json.dumps(data,indent=2)+'\n')
