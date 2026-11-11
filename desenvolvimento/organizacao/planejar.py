"""Identifica o fluxo publicado e prepara a mudança reversível dos materiais históricos."""
from pathlib import Path
import re,json,subprocess,os,hashlib
root=Path(__file__).resolve().parents[2]
if (root/'arquivo/README.md').exists():raise SystemExit('Reorganização já aplicada. Use npm run audit:files para conferir o resultado.')
old=json.loads((root/'desenvolvimento/viva/publicacao.json').read_text())
files=set(old['files']);active=set();todo=[f for f in files if f.endswith('.html')]
while todo:
 f=todo.pop()
 if f in active:continue
 active.add(f)
 if Path(f).suffix not in ['.html','.css','.js']:continue
 s=(root/f).read_text();refs=[]
 if f.endswith('.html'):refs+=re.findall(r'(?:src|href)=[\"\']([^\"\']+)',s)
 if f.endswith(('.html','.css')):refs+=re.findall(r'url\([\"\']?([^\"\')]+)',s)
 if f.endswith('.js'):refs+=re.findall(r'[\"\']([^\"\'\n]+\.js(?:\?[^\"\']*)?)[\"\']',s)
 for url in refs:
  if re.match(r'^(?:[a-z]+:|#|//)',url):continue
  target=os.path.normpath(str(Path(f).parent/url.split('?')[0].split('#')[0]))
  if target in files and target not in active:todo.append(target)
# Imagens, áudio e metadados dos atlas não são inferidos apenas por tráfego:
# permanecem registrados para cobrir os recursos carregados sob demanda.
assets={f for f in files if Path(f).suffix not in ['.html','.css','.js']}
public=active|assets
tracked=[f for f in subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0') if f]
keep=set(public)
keep.update(f for f in tracked if f.startswith(('desenvolvimento/organizacao/','desenvolvimento/trilhas-vivas/','desenvolvimento/ambiente/')))
keep.update(['desenvolvimento/vite.config.mjs','desenvolvimento/editores.json','desenvolvimento/viva/compilar.mjs','desenvolvimento/viva/publicacao.json','desenvolvimento/viva/verificar-site.mjs','desenvolvimento/viva/testar.mjs','desenvolvimento/scripts/verificar-ferramentas.mjs','desenvolvimento/scripts/instalar-editores.py','desenvolvimento/scripts/executar-editor.py','jogo/vida-natural/validacao/fisica.cjs','jogo/viva/validacao/interface.cjs','jogo/viva/validacao/subpasta.cjs','jogo/README.md','desenvolvimento/README.md','assets/README.md','tela-inicial/README.md'])
# Dependências literais dos testes atuais e dos utilitários também ficam no lugar.
seen=set()
while True:
 pending=[f for f in keep if f not in seen and (f.startswith('desenvolvimento/') or '/validacao/' in f) and Path(f).suffix in ['.js','.mjs','.cjs','.py','.sh'] and (root/f).is_file()]
 if not pending:break
 for f in pending:
  seen.add(f);s=(root/f).read_text()
  for target in re.findall(r'[\"\']((?:jogo|desenvolvimento|assets|tela-inicial)/[^\"\'\n]+)[\"\']',s):
   target=target.split('?')[0]
   if (root/target).is_file():keep.add(target)
move=[]
for f in tracked:
 if f.startswith(('jogo/','tela-inicial/','assets/','desenvolvimento/')) and f not in keep:
  p=root/f
  move.append({'original':f,'arquivo':'arquivo/'+f,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
report={'baseCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'antes':{'arquivos':len(old['files']),'bytes':old['bytes']},'depois':{'arquivos':len(public),'bytes':sum((root/f).stat().st_size for f in public)},'arquivados':move,'publicacaoRemovidos':sorted(files-public),'ativos':[{'file':f,'sha256':hashlib.sha256((root/f).read_bytes()).hexdigest()} for f in sorted(public)]}
(root/'desenvolvimento/organizacao/plano.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
(root/'desenvolvimento/organizacao/recursos.json').write_text(json.dumps({'version':1,'entries':sorted(f for f in public if f.endswith('.html')),'assets':sorted(assets)},ensure_ascii=False,indent=2)+'\n')
print('Arquivar',len(move),'arquivos,',round(sum(p['bytes'] for p in move)/1048576,2),'MiB')
print('Site:',len(old['files']),'->',len(public),'arquivos;',round(old['bytes']/1048576,2),'->',round(report['depois']['bytes']/1048576,2),'MiB')
print('Pastas inteiras históricas:',sorted({str(Path(m['original']).parent) for m in move if str(Path(m['original']).parent) not in {str(Path(f).parent) for f in keep}}))
