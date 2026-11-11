from pathlib import Path
import subprocess,shutil,zipfile
root=Path(__file__).resolve().parents[2]
out=Path('/workspace/entregas/guardiao-todos-javascript');out.mkdir(parents=True,exist_ok=True)
files=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=root).decode().split('\0')
selected=sorted({f for f in files if f and Path(f).suffix.lower() in {'.js','.mjs','.cjs'} and not any(p in {'node_modules','dist','.git','test-results'} for p in Path(f).parts) and (root/f).is_file()})
for name in selected:
 p=out/name;p.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(root/name,p)
with zipfile.ZipFile(out.with_suffix('.zip'),'w',zipfile.ZIP_DEFLATED) as z:
 for name in selected:z.write(out/name,'guardiao-todos-javascript/'+name)
with zipfile.ZipFile(out.with_suffix('.zip')) as z:
 assert len(z.namelist())==len(selected)
 for name in selected:assert z.read('guardiao-todos-javascript/'+name)==(root/name).read_bytes()
print(len(selected),'arquivos JavaScript verificados no ZIP')
