"""WebP para o jogo publicado, mantendo todas as artes PNG originais.
Execute da raiz: python desenvolvimento/otimizacao/otimizar-imagens.py
"""
from pathlib import Path
from PIL import Image
import hashlib,json,re,os
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets/otimizados';OUT.mkdir(parents=True,exist_ok=True)
folders=['jogo/jornada/assets','jogo/floresta-viva/revisao/assets','tela-inicial/nova-versao/assets','tela-inicial/jornada-viva/assets','tela-inicial/menu-vivo/assets','tela-inicial/mapa-interativo/assets','tela-inicial/colar-remodelado/assets','assets/identidade-flora']
files=sorted(set(p for folder in folders for p in (ROOT/folder).glob('*.png')))
# Retrato preservado do mapa antigo, hoje usado como marcador da ilha.
files.append(ROOT/'jogo/floresta-viva/assets/kai-repouso.png')
manifest={};report=[]
for path in files:
 key=path.relative_to(ROOT).as_posix();digest=hashlib.sha256(path.read_bytes()).hexdigest()[:12];target=OUT/(path.stem+'-'+digest+'.webp')
 if not target.exists():
  im=Image.open(path);im.save(target,'WEBP',quality=84 if any(n in path.stem for n in ['mapa-','floresta-','ilha-','horizonte-']) else 90,method=6,exact=True)
 if target.stat().st_size>=path.stat().st_size:continue
 encoded=target.relative_to(ROOT).as_posix();manifest[key]=encoded
 report.append({'original':key,'webp':encoded,'bytesAntes':path.stat().st_size,'bytesDepois':target.stat().st_size,'dimensoes':Image.open(path).size})
(ROOT/'jogo/sistemas/arte-manifesto.js').write_text('window.GuardiaoArteManifesto='+json.dumps(manifest,separators=(',',':'))+';\n')
# Referências estáticas são trocadas antes do navegador fazer a primeira requisição.
# Os carregadores de atlas dinâmicos usam GuardiaoArte.url e preservam seus metadados.
for folder in ['tela-inicial/nova-versao','tela-inicial/jornada-viva','tela-inicial/menu-vivo','tela-inicial/colar-remodelado','tela-inicial/campanha','jogo/floresta-viva','jogo/jornada']:
 for path in (ROOT/folder).glob('*'):
  if path.suffix not in ['.html','.css']:continue
  s=path.read_text()
  def replace(match):
   value=match.group(0)
   if value.startswith(('http:','https:','data:')):return value
   absolute=(path.parent/value).resolve()
   try:key=absolute.relative_to(ROOT).as_posix()
   except ValueError:return value
   return os.path.relpath(ROOT/manifest[key],path.parent).replace(os.sep,'/') if key in manifest else value
  # Apenas caminhos literais, sem aspas nem parâmetros.
  s=re.sub(r'(?:\.\./|\./)*(?:[A-Za-z0-9_\-]+/)*[A-Za-z0-9_\-]+\.png',replace,s)
  if path.suffix=='.html':
   def restore_icon(match):
    tag=match.group(0)
    if 'icon' not in tag:return tag
    for original,optimized in manifest.items():
     if not original.startswith('assets/identidade-flora/'):continue
     source=os.path.relpath(ROOT/optimized,path.parent).replace(os.sep,'/')
     target=os.path.relpath(ROOT/original,path.parent).replace(os.sep,'/')
     tag=tag.replace(source,target)
    return tag
   s=re.sub(r'<link\b[^>]*>',restore_icon,s)
  path.write_text(s)
# O SVG das folhas resolve href relativo à página nova-versao, não ao JS.
p=ROOT/'tela-inicial/menu-vivo/folhas.js';s=p.read_text();key='tela-inicial/nova-versao/assets/folhas-sprites.png';rel=os.path.relpath(ROOT/manifest[key],ROOT/'tela-inicial/nova-versao').replace(os.sep,'/');s=s.replace('assets/folhas-sprites.png',rel);p.write_text(s)
report_data={'arquivos':report,'bytesAntes':sum(r['bytesAntes'] for r in report),'bytesDepois':sum(r['bytesDepois'] for r in report)}
(ROOT/'desenvolvimento/otimizacao/relatorio.json').write_text(json.dumps(report_data,ensure_ascii=False,indent=2)+'\n')
print(len(report),'imagens; bytes:',report_data['bytesAntes'],'→',report_data['bytesDepois'])
