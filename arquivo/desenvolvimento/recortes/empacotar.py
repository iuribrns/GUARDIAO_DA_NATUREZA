"""Separa silhuetas completas e as exporta com margens por Inkscape/WebP.

NumPy/SciPy/Pillow medem os pixels; a composição dos novos PNGs é feita no Inkscape.
Nenhuma prancha anterior é apagada ou sobrescrita.
"""
from pathlib import Path
from statistics import median, mean
from math import ceil
import hashlib, html, json, os, subprocess, tempfile
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects, distance_transform_edt

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SOURCES = HERE / 'fontes'
OUT = ROOT / 'jogo/sprites-integros'
BIN = Path(os.environ.get('GUARDIAO_TOOLS_DIR','/workspace/.tools/guardiao'))/'bin'
CACHE = ROOT/'.cache/recortes'
REPORT=[]


def run(tool,*args):
    subprocess.run([str(BIN/tool),*map(str,args)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)


def rect_path(mask,x=0,y=0):
    """A vector selection, in original source coordinates; no raster painting."""
    commands=[]
    for row,values in enumerate(mask):
        changes=np.diff(np.pad(values.astype(np.int8),(1,1)))
        for start,end in zip(np.flatnonzero(changes==1),np.flatnonzero(changes==-1)):
            commands.append(f'M{x+int(start)} {y+row}h{int(end-start)}v1h-{int(end-start)}Z')
    return ''.join(commands)


def analyse(source, frames):
    rgba=np.array(Image.open(source).convert('RGBA')); alpha=rgba[:,:,3]
    labels,count=label(alpha>32)
    counts=np.bincount(labels.ravel()); owners=np.zeros(count+1,np.int32)
    unique=[]; lookup={}; logical=[]
    for frame in frames:
        key=tuple(frame['bounds'])
        if key not in lookup:lookup[key]=len(unique);unique.append(frame)
        logical.append(lookup[key])
    votes=np.zeros((count+1,len(unique)),np.int32)
    for i,frame in enumerate(unique):
        x,y,w,h=frame['bounds'];ids,amount=np.unique(labels[y:y+h,x:x+w],return_counts=True)
        votes[ids,i]=amount
    merged=[]
    for cid in range(1,count+1):
        if counts[cid]<100:continue
        ranking=np.argsort(votes[cid])[::-1]
        # Ignore unused source poses touching a crop only through a few water pixels.
        if votes[cid,ranking[0]] < counts[cid]*.25:continue
        owners[cid]=ranking[0]+1
        if counts[cid]>2000 and len(ranking)>1 and votes[cid,ranking[1]]>votes[cid,ranking[0]]*.28:
            merged.append([int(ranking[0]),int(ranking[1])])
    if merged:raise ValueError(f'Figuras sobrepostas na fonte {source.name}: {merged}')
    core=owners[labels]
    distance,nearest=distance_transform_edt(core==0,return_indices=True)
    selection=np.where(core>0,core,np.where((alpha>0)&(distance<=6),core[tuple(nearest)],0))
    physical=[]
    for i,frame in enumerate(unique):
        yy,xx=np.nonzero(selection==i+1)
        if not len(xx):raise ValueError(f'Figura ausente: {source.name} / {i}')
        x,y,xx1,yy1=int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)
        mask=selection[y:yy1,x:xx1]==i+1
        physical.append({'source':source,'bounds':[x,y,xx1-x,yy1-y],
            'mask':rect_path(mask,x,y),'pivot':[x+(xx1-x)/2,yy1],
            'sourceFrame':i,'sourceSize':[rgba.shape[1],rgba.shape[0]],'alpha':alpha,
            'corePixels':int(np.count_nonzero((labels>0)&(core==i+1)))})
    return [{**physical[index],**{k:v for k,v in frame.items() if k in ['flip','mirror']}} for index,frame in zip(logical,frames)]


def grid(source,cols,rows):
    w,h=Image.open(source).size
    return analyse(source,[{'bounds':[round(c*w/cols),round(r*h/rows),round((c+1)*w/cols)-round(c*w/cols),round((r+1)*h/rows)-round(r*h/rows)]} for r in range(rows) for c in range(cols)])


def stable_heads(frames):
    for first in range(0,len(frames),4):
        heads=[];offsets=[]
        group=frames[first:first+4]
        for frame in group:
            x,y,w,h=frame['bounds'];a=frame['alpha']
            yy,xx=np.nonzero(a[y:y+max(8,round(h*.25)),x:x+w]>100)
            head=x+(xx.min()+xx.max()+1)/2
            yy,xx=np.nonzero(a[y+h-12:y+h,x:x+w]>100)
            foot=x+(xx.min()+xx.max()+1)/2
            heads.append(head);offsets.append(foot-head)
        for frame,head in zip(group,heads):frame['pivot'][0]=head+mean(offsets)


def pack(group,name,frames,reference):
    margin=12;cols=8 if len(frames)>16 else 4
    cw=ceil((max(f['bounds'][2] for f in frames)+margin*2)/4)*4
    ch=ceil((max(f['bounds'][3] for f in frames)+margin*2)/4)*4
    width,height=cw*cols,ch*ceil(len(frames)/cols)
    definitions=[];images=[];result=[]
    for i,f in enumerate(frames):
        x,y,w,h=f['bounds'];tx=(i%cols)*cw+round((cw-w)/2);ty=(i//cols)*ch+ch-margin-h
        dx,dy=tx-x,ty-y;image_w,image_h=f['sourceSize']
        definitions.append(f'<clipPath id="f{i}" clipPathUnits="userSpaceOnUse"><path d="{f["mask"]}"/></clipPath>')
        href=html.escape(os.path.relpath(f['source'],SOURCES))
        mirror=f.get('mirror',False)
        transform=f'translate({2*x+w} 0) scale(-1 1)' if mirror else ''
        images.append(f'<g transform="translate({dx} {dy})"><g transform="{transform}"><image href="{href}" width="{image_w}" height="{image_h}" clip-path="url(#f{i})"/></g></g>')
        px=(2*x+w-f['pivot'][0]) if mirror else f['pivot'][0]
        result.append({'bounds':[round(tx,3),round(ty,3),w,h],'pivot':[round(px+dx,3),round(f['pivot'][1]+dy,3)],**({'flip':True} if f.get('flip') else {})})
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}"><defs>'+''.join(definitions)+'</defs>'+''.join(images)+'</svg>'
    source=SOURCES/f'{group}-{name}.svg';source.write_text(svg)
    target=OUT/'assets'/f'{group}-{name}.webp'
    source_hashes=''.join(hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted({f['source'] for f in frames}))
    digest=hashlib.sha256((svg+source_hashes+'|cor96-alpha100-v3').encode()).hexdigest()
    stamp=CACHE/(target.stem+'.sha256')
    if not target.exists() or not stamp.exists() or stamp.read_text()!=digest:
        with tempfile.TemporaryDirectory(prefix='guardiao-recorte-') as tmp:
            png=Path(tmp)/'prancha.png'
            run('inkscape',source,f'--export-filename={png}')
            # Keep alpha exact; high-quality color avoids a large mobile download.
            run('cwebp','-q','96','-alpha_q','100','-exact','-m','6',png,'-o',target)
        stamp.write_text(digest)
    REPORT.append({'grupo':group,'nome':name,'quadros':len(result),'margem':margin,'bytes':target.stat().st_size,'dimensoes':[width,height]})
    print(group,name,len(frames),'quadros completos',flush=True)
    return {'file':f'assets/{target.name}','width':width,'height':height,'referenceHeight':reference,'frames':result}


def main():
    for p in [SOURCES,OUT/'assets',CACHE]:p.mkdir(parents=True,exist_ok=True)
    campaign=json.loads((ROOT/'jogo/jornada/assets/atlas.json').read_text())
    forest=json.loads((ROOT/'jogo/floresta-viva/revisao/assets/atlas-revisado.json').read_text())
    vita=json.loads((ROOT/'jogo/vida-natural/assets/atlas.json').read_text())
    output={'vida':{},'campanha':{},'floresta':{}}
    walk=grid(SOURCES/'kai-andar-a.png',4,4)+grid(SOURCES/'kai-andar-b.png',4,4)
    for f in walk[16:20]:f['mirror']=True # The generated west row faces east.
    stable_heads(walk)
    output['vida']['kai-andando']=pack('vida','kai-andando',walk,median(f['bounds'][3] for f in walk))
    for name in ['kai-mangueira','fogo']:
        source=ROOT/'desenvolvimento/arte-natural/fontes'/f'{name}.png'
        frames=analyse(source,vita[name]['frames'])
        if name.startswith('kai-'):stable_heads(frames)
        output['vida'][name]=pack('vida',name,frames,vita[name]['referenceHeight'])
    flora=analyse(ROOT/'jogo/floresta-viva/revisao/assets/flora-suave.png',forest['flora']['frames'])
    # Anchor the face, rather than the end of a moving wing.
    eyes=[(291,227),(651,206),(987,225),(1352,217),(280,562),(640,573),(992,580),(1360,607),(249,867),(582,867),(932,876),(1295,876)]
    for i,f in enumerate(flora):f['pivot']=[eyes[i][0],eyes[i][1]+(150 if i<8 else 190)]
    mapped=[flora[i] for i in [0,1,2,3,4,3,2,1,6,7,8,8,8,9,10,11]]
    output['vida']['flora']=pack('vida','flora',mapped,300)
    for name,sheet in campaign.items():
        if name.startswith('recompensa-') or name=='kai-livre':continue
        if name=='kai-floresta':frames=grid(SOURCES/'kai-cuidados.png',4,3)
        else:frames=analyse((ROOT/'jogo/jornada'/sheet['file']).resolve(),sheet['frames'])
        reference=median(f['bounds'][3] for f in frames[:8]) if name=='kai-floresta' else sheet['referenceHeight']
        output['campanha'][name]=pack('campanha',name,frames,reference)
    for name,sheet in forest.items():
        if name in ['kai-recompensa','kai-caminhada','flora','fogo']:continue
        frames=analyse((ROOT/'jogo/floresta-viva/assets'/sheet['file']).resolve(),sheet['frames'])
        output['floresta'][name]=pack('floresta',name,frames,sheet['referenceHeight'])
    wear=grid(SOURCES/'kai-vestindo-colar.png',4,2)
    colar=pack('colar','kai-vestindo',wear,median(f['bounds'][3] for f in wear[:4]))
    # Actual gold leaf locations in the packed poses, not a generic chest position.
    colar['pendants']=[None,[605,255],[963,199],[1363,265],[197,489],[572,641],[939,643],[1293,620]]
    data={'grupos':output,'colar':colar}
    (OUT/'assets/atlas.json').write_text(json.dumps(data,indent=2)+'\n')
    js='"use strict";(()=>{const d='+json.dumps(data,separators=(',',':'))+';'
    js+='if(window.GuardiaoVidaAtlas)for(const [n,s] of Object.entries(d.grupos.vida)){s.file="../../sprites-integros/"+s.file;window.GuardiaoVidaAtlas[n]=s;}'
    js+='if(window.GuardiaoCampanhaAtlas)for(const [n,s] of Object.entries(d.grupos.campanha)){s.file="../sprites-integros/"+s.file;window.GuardiaoCampanhaAtlas[n]=s;}'
    js+='if(window.GuardiaoFlorestaAtlas)for(const [n,s] of Object.entries(d.grupos.floresta)){s.file="../../sprites-integros/"+s.file;window.GuardiaoFlorestaAtlas.sheets[n]=s;}'
    js+='if(window.GuardiaoArteManifesto)window.GuardiaoArteManifesto["jogo/jornada/assets/icones.png"]="jogo/sprites-integros/assets/campanha-icones.webp";'
    js+='window.GuardiaoColarArte=d.colar;})();\n'
    (OUT/'atlas.js').write_text(js)
    (HERE/'relatorio.json').write_text(json.dumps(REPORT,indent=2)+'\n')


if __name__=='__main__':main()
