"""Exportações reais por Inkscape, Krita, LibreSprite e WebP; fontes preservadas."""
from pathlib import Path
import json
import os
import shutil
import statistics
import struct
import subprocess
import tempfile
import xml.etree.ElementTree as ET
import zipfile
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / 'jogo/vida-natural/assets'
BIN = Path(os.environ.get('GUARDIAO_TOOLS_DIR', '/workspace/.tools/guardiao')) / 'bin'
SOURCES = HERE / 'fontes'


def run(tool, *args):
    subprocess.run([str(BIN / tool), *map(str, args)], check=True, stdout=subprocess.DEVNULL)


def svg(name, width, height, content, definitions=''):
    path = SOURCES / (name + '.svg')
    path.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" preserveAspectRatio="none"><defs>{definitions}</defs>{content}</svg>')
    shutil.copy2(path, OUT / path.name)
    return path


def vectors():
    definitions = '''<linearGradient id="wood" x2=".2" y2="1"><stop stop-color="#a97138"/><stop offset=".45" stop-color="#744322"/><stop offset="1" stop-color="#492d1c"/></linearGradient><linearGradient id="leaf" x2="1" y2="1"><stop stop-color="#c3db6d"/><stop offset=".5" stop-color="#6da141"/><stop offset="1" stop-color="#2e6335"/></linearGradient><radialGradient id="green" cx=".32" cy=".2" r=".85"><stop stop-color="#7e9c51"/><stop offset=".5" stop-color="#345f3b"/><stop offset="1" stop-color="#173c2b"/></radialGradient>'''
    grain = ''.join(f'<path d="M18 {y}C105 {y-12} 159 {y+17} 235 {y}S395 {y-7} 484 {y+3}" fill="none" stroke="#e8b772" stroke-opacity=".12" stroke-width="2"/>' for y in range(16,300,19))
    branch = '<path d="M0 0Q21-8 46-40Q22-44 0 0M0 0Q-8-22-36-27Q-26-2 0 0" fill="url(#leaf)" stroke="#25472b" stroke-width="1.5"/><path d="M-31-24L0 0L39-35" fill="none" stroke="#d4e491" stroke-opacity=".6"/>'
    wood = '<rect x="4" y="6" width="492" height="290" rx="24" fill="#243526" opacity=".7"/><rect x="4" y="2" width="492" height="290" rx="24" fill="url(#wood)" stroke="#35271c" stroke-width="6"/><rect x="10" y="8" width="480" height="278" rx="19" fill="none" stroke="#e6bb75" stroke-opacity=".8" stroke-width="2"/>'
    svg('painel-madeira',500,300,wood+grain+'<rect x="18" y="17" width="464" height="262" rx="15" fill="#193d2b" fill-opacity=".83" stroke="#be9859" stroke-width="1.5"/><g transform="translate(32 32) scale(.65)">'+branch+'</g><g transform="translate(472 268) rotate(180) scale(.6)">'+branch+'</g>',definitions)
    svg('botao-folha',128,128,'<circle cx="64" cy="68" r="57" fill="#152e22" opacity=".5"/><circle cx="64" cy="62" r="57" fill="url(#wood)" stroke="#382716" stroke-width="3"/><circle cx="64" cy="62" r="52" fill="none" stroke="#e7bd74" stroke-width="2"/><circle cx="64" cy="62" r="47" fill="url(#green)" stroke="#203e2b" stroke-width="3"/><path d="M34 32A42 42 0 0 1 85 27" fill="none" stroke="#e1edb1" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/><g transform="translate(104 102) rotate(30) scale(.35)">'+branch+'</g>',definitions)
    svg('folha-interacao',100,100,'<g transform="translate(46 70) scale(1.3)">'+branch+'</g>',definitions)
    svg('sombra-copa',400,260, ''.join(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="#123f2d" opacity=".11"/>' for x,y,rx,ry in [(180,105,100,60),(90,150,70,43),(280,125,90,63),(230,190,105,40),(130,65,83,40)]))
    defs = '<radialGradient id="shade"><stop offset=".32" stop-color="#0d4439" stop-opacity="0"/><stop offset="1" stop-color="#0b3a32" stop-opacity=".28"/></radialGradient><linearGradient id="ray" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff6bb" stop-opacity=".14"/><stop offset="1" stop-color="#fff5bb" stop-opacity="0"/></linearGradient>'
    light = '<rect width="1672" height="941" fill="url(#shade)"/>' + ''.join(f'<path d="M{x} -40L{x+300} -40L{x+800} 941L{x+650} 941Z" fill="url(#ray)"/>' for x in [-320,240,780])
    fire=''
    for i in range(8):
        wobble=round(6*__import__('math').sin(i*__import__('math').pi/4),2)
        fire+=f'<g transform="translate({i*128} 0)"><path d="M62 150C17 150 14 117 29 88Q29 109 45 112C28 76 66 59 62 12C108 55 80 77 98 88Q109 71 104 61C143 112 112 151 62 150Z" fill="url(#outer)"/><path d="M64 145C35 145 35 124 47 105Q55 121 59 108C48 83 {71+wobble} 71 76 49C98 87 68 102 89 113C103 135 82 147 64 145Z" fill="url(#inner)"/><path d="M63 144C49 144 48 132 58 121L69 100C69 120 85 128 76 139Q72 145 63 144Z" fill="#fff2b1"/></g>'
    fire_svg=svg('fogo',1024,160,fire,'<linearGradient id="outer" x2="0" y2="1"><stop stop-color="#ffb13b"/><stop offset=".5" stop-color="#ed622d"/><stop offset="1" stop-color="#ffce4a"/></linearGradient><linearGradient id="inner" x2="0" y2="1"><stop stop-color="#fff3b9"/><stop offset="1" stop-color="#ffd454"/></linearGradient>')
    run('inkscape',fire_svg,f'--export-filename={SOURCES / "estudo-fogo.png"}')
    return svg('luz-floresta',1672,941,light,defs)


def scenery(light):
    specs=[('floresta','jogo/floresta-viva/revisao/assets/floresta-ilustrada.png','jogo/floresta-viva/revisao/assets/floresta-restaurada.png')]
    for name in ['rio','fauna','plantio','cidade']:
        specs.append((name,f'jogo/jornada/assets/mapa-{name}.png',f'jogo/jornada/assets/mapa-{name}-restaurado.png'))
    report=[]
    with tempfile.TemporaryDirectory(prefix='guardiao-krita-') as temporary:
        work=Path(temporary)
        for name,burned,healthy in specs:
            for state,original in [('inicio',burned),('restaurado',healthy)]:
                target=OUT/f'{name}-{state}.webp'
                if target.exists():
                    report.append({'nome':name+'-'+state,'bytes':target.stat().st_size})
                    continue
                source=ROOT/original
                w,h=Image.open(source).size
                illumination=work/'luz.png'
                run('inkscape',light,f'--export-width={w}',f'--export-height={h}',f'--export-filename={illumination}')
                stack=ET.Element('image',{'w':str(w),'h':str(h),'name':f'{name} / {state}'})
                layers=ET.SubElement(stack,'stack')
                for filename,label in [('luz.png','Luz entre as folhas'),('cenario.png','Cenário original preservado')]:
                    ET.SubElement(layers,'layer',{'name':label,'src':'data/'+filename,'opacity':'1.0','composite-op':'svg:src-over','x':'0','y':'0','visibility':'visible'})
                ora=work/'cenario.ora'
                with zipfile.ZipFile(ora,'w') as archive:
                    archive.writestr('mimetype','image/openraster',compress_type=zipfile.ZIP_STORED)
                    archive.writestr('stack.xml',ET.tostring(stack,encoding='utf-8'))
                    archive.write(illumination,'data/luz.png')
                    archive.write(source,'data/cenario.png')
                exported=work/'cenario.png'
                run('krita','--nosplash','--export','--export-filename',exported,ora)
                if name=='floresta':
                    run('krita','--nosplash','--export','--export-filename',SOURCES/f'floresta-{state}.kra',ora)
                run('cwebp','-q','88','-m','6',exported,'-o',target)
                assert Image.open(target).size==(w,h)
                report.append({'nome':name+'-'+state,'bytes':target.stat().st_size})
                print('Krita + WebP:',name,state,flush=True)
    (HERE/'cenarios.json').write_text(json.dumps(report,indent=2)+'\n')


def sprites():
    atlas={}
    for name,cols,rows in [('kai-andando',8,4),('kai-mangueira',8,4),('flora',4,4),('fogo',4,2)]:
        path=SOURCES/f'{name}.png'
        if not path.exists():
            raise SystemExit('Falta a arte original: '+str(path))
        im=Image.open(path).convert('RGBA');w,h=im.size
        alpha=im.getchannel('A');frames=[]
        for row in range(rows):
            for col in range(cols):
                x0,x1=round(col*w/cols),round((col+1)*w/cols)
                y0,y1=round(row*h/rows),round((row+1)*h/rows)
                box=alpha.crop((x0,y0,x1,y1)).point(lambda n:255 if n>100 else 0).getbbox()
                if not box:raise ValueError('Quadro vazio: '+name)
                l,t,r,b=box
                # The atlas is metadata only: no source pixels are cropped or repainted.
                bounds=[x0+l,y0+t,r-l,b-t]
                pivot=[x0+(l+r)/2,y0+b]
                frames.append({'bounds':bounds,'pivot':pivot})
        if name.startswith('kai-'):
            # Cape and nozzle movement must not pull Kai sideways between poses.
            # Measure the head, then retain the average feet-to-head offset per view.
            for first in range(0,len(frames),4):
                heads=[]; offsets=[]
                for frame in frames[first:first+4]:
                    x,y,ww,hh=frame['bounds']
                    head=alpha.crop((x,y,x+ww,y+round(hh*.25))).point(lambda n:255 if n>100 else 0).getbbox()
                    feet=alpha.crop((x,y+hh-12,x+ww,y+hh)).point(lambda n:255 if n>100 else 0).getbbox()
                    head_x=x+(head[0]+head[2])/2
                    feet_x=x+(feet[0]+feet[2])/2
                    heads.append(head_x); offsets.append(feet_x-head_x)
                offset=statistics.mean(offsets)
                for frame,head_x in zip(frames[first:first+4],heads):
                    frame['pivot'][0]=round(head_x+offset,3)
        target=OUT/f'{name}.webp'
        if not target.exists() or target.stat().st_mtime < path.stat().st_mtime:run('cwebp','-q','92','-alpha_q','100','-m','6',path,'-o',target)
        atlas[name]={'file':target.name,'width':w,'height':h,'referenceHeight':statistics.median(f['bounds'][3] for f in frames),'frames':frames}
        editable=SOURCES/f'{name}.aseprite'
        if not editable.exists() or editable.stat().st_mtime < path.stat().st_mtime or struct.unpack_from('<H',editable.read_bytes(),6)[0] != cols*rows:
            # LibreSprite imports numbered PNGs as an editable animation timeline.
            # All pixel extraction is performed by the installed editor itself.
            with tempfile.TemporaryDirectory(prefix='guardiao-quadros-') as temporary:
                sequence=Path(temporary)
                cw,ch=__import__('math').ceil(w/cols),__import__('math').ceil(h/rows)
                for i in range(cols*rows):
                    x,y=round(i%cols*w/cols),round(i//cols*h/rows)
                    run('libresprite','--batch',path,'--crop',f'{x},{y},{cw},{ch}','--save-as',sequence/f'quadro-{i:02}.png')
                run('libresprite','--batch',sequence/'quadro-00.png','--save-as',editable)
            assert struct.unpack_from('<H',editable.read_bytes(),6)[0] == cols*rows
    (OUT/'atlas.json').write_text(json.dumps(atlas,indent=2)+'\n')
    (OUT.parent/'atlas.js').write_text('window.GuardiaoVidaAtlas='+json.dumps(atlas,separators=(',',':'))+';\n')
    print('Sprites: '+str(sum(len(s['frames']) for s in atlas.values()))+' quadros em WebP e fontes editáveis.',flush=True)


if __name__=='__main__':
    OUT.mkdir(parents=True,exist_ok=True);SOURCES.mkdir(parents=True,exist_ok=True)
    light=vectors()
    import sys
    if '--vetores' not in sys.argv:scenery(light);sprites()
