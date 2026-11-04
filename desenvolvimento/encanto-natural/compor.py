"""Uma única composição original de aventura; instrumentos acústicos e foley suave.

Renderiza localmente com libfluidsynth/TimGM6mb (não necessários no navegador).
Não usa músicas prontas. TimGM6mb: Tim Brechbill/David Bolton, GPL-2.
"""
from pathlib import Path
import ctypes as C
import json, math, tempfile, subprocess, wave
import numpy as np
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'jogo/encanto-natural/assets'
SR, BPM = 44100, 82
BEAT = 60 / BPM
RNG = np.random.default_rng(2382)
OUT.mkdir(parents=True, exist_ok=True)

def save(name, audio, target_rms, ceiling=.64, bitrate='96k', loop=False):
    audio = np.asarray(audio, dtype=np.float64)
    if audio.ndim == 1:
        audio = np.column_stack((audio, audio))
    audio -= np.mean(audio, axis=0)
    audio *= min(target_rms / max(1e-8, np.sqrt(np.mean(audio**2))), ceiling / max(1e-8, np.max(np.abs(audio))))
    if not loop:
        fade = min(400, len(audio)//8)
        audio[:fade] *= np.linspace(0, 1, fade)[:,None]
        audio[-fade:] *= np.linspace(1, 0, fade)[:,None]
    with tempfile.TemporaryDirectory(prefix='guardiao-som-') as td:
        wav = Path(td) / 'som.wav'
        with wave.open(str(wav), 'wb') as stream:
            stream.setparams((2,2,SR,len(audio),'NONE','not compressed'))
            stream.writeframes((audio*32767).astype('<i2').tobytes())
        subprocess.run(['ffmpeg','-y','-v','error','-i',str(wav),'-c:a','libmp3lame','-b:a',bitrate,'-write_xing','1',str(OUT/(name+'.mp3'))],check=True)
    return {'file':name+'.mp3','duration':round(len(audio)/SR,3),'peak':round(float(np.max(np.abs(audio))),4),'rms':round(float(np.sqrt(np.mean(audio**2))),4),'sampleRate':SR,'bytes':(OUT/(name+'.mp3')).stat().st_size}

def music():
    f = C.CDLL('libfluidsynth.so.3')
    def api(name, result, args):
        fn = getattr(f,name); fn.restype=result; fn.argtypes=args; return fn
    ptr, I, F = C.c_void_p, C.c_int, C.c_double
    settings = api('new_fluid_settings',ptr,[])()
    api('fluid_settings_setnum',I,[ptr,C.c_char_p,F])(settings,b'synth.sample-rate',SR)
    api('fluid_settings_setnum',I,[ptr,C.c_char_p,F])(settings,b'synth.gain',.55)
    api('fluid_settings_setint',I,[ptr,C.c_char_p,I])(settings,b'synth.reverb.active',1)
    api('fluid_settings_setint',I,[ptr,C.c_char_p,I])(settings,b'synth.chorus.active',0)
    synth = api('new_fluid_synth',ptr,[ptr])(settings)
    api('fluid_synth_sfload',I,[ptr,C.c_char_p,I])(synth,b'/usr/share/sounds/sf2/TimGM6mb.sf2',1)
    program = api('fluid_synth_program_change',I,[ptr,I,I])
    cc = api('fluid_synth_cc',I,[ptr,I,I,I])
    on = api('fluid_synth_noteon',I,[ptr,I,I,I])
    off = api('fluid_synth_noteoff',I,[ptr,I,I])
    render = api('fluid_synth_write_float',I,[ptr,I,ptr,I,I,ptr,I,I])
    # Violão de nylon, harpa, flauta, cordas, pizzicato, baixo acústico, celesta.
    for ch, patch, vol, pan in [(0,24,82,40),(1,46,68,90),(2,73,80,64),(3,48,46,64),(4,45,58,80),(5,32,66,58),(6,8,54,45)]:
        program(synth,ch,patch); cc(synth,ch,7,vol); cc(synth,ch,10,pan); cc(synth,ch,91,32)
    events=[]
    def note(ch, start, duration, pitch, velocity):
        # Pequena variação fixa preserva a frase e evita um ostinato mecânico.
        start=max(0,start+RNG.uniform(-.009,.009)); velocity=int(np.clip(velocity+RNG.integers(-3,4),1,110))
        events.append((round(start*BEAT*SR),1,ch,int(pitch),velocity))
        events.append((round((start+duration)*BEAT*SR),0,ch,int(pitch),0))
    # Ré maior; progressão com passagens menores e resoluções suaves, 48 compassos.
    chords = [(50,[62,66,69,73]),(45,[61,64,69,71]),(47,[59,62,66,69]),(43,[59,62,67,69]),
              (50,[62,66,69,74]),(45,[61,64,69,73]),(43,[59,62,67,71]),(45,[61,64,69,73])]
    phrase_a = [
        [(0,74,1.4),(1.5,78,.45),(2,81,1.6)],
        [(0,80,1),(1,78,.8),(2.5,76,1)],
        [(0,78,1.4),(1.5,76,.45),(2,74,1.5)],
        [(0,71,1.2),(1.5,74,1.7)],
        [(0,74,.9),(1,78,.9),(2,81,.8),(3,83,.65)],
        [(0,81,1.4),(1.5,78,.8),(2.5,76,.8)],
        [(0,74,1),(1.5,71,1.2),(3,69,.7)],
        [(0,73,1.4),(1.5,76,1.8)]
    ]
    phrase_b = [
        [(0,81,1.3),(1.5,83,.5),(2.5,86,1.2)],
        [(0,85,1),(1.5,81,1),(3,80,.6)],
        [(0,78,1.4),(1.5,81,.65),(2.5,78,.85)],
        [(0,79,1.2),(1.5,78,.65),(2.5,74,1.2)],
        [(0,78,.7),(1,81,.7),(2,86,1.6)],
        [(0,85,1.3),(1.5,83,.6),(2.5,81,1.1)],
        [(0,79,.8),(1,78,.6),(2,74,1.3)],
        [(0,76,1.3),(1.5,73,1.8)]
    ]
    bars=48; length=bars*4*BEAT
    for bar in range(bars):
        bass, tones = chords[bar%8]; start=bar*4
        intro = bar<4 or bar>=44
        # Dedilhado de violão com espaço para a melodia e pequenas respostas da harpa.
        pattern=[0,2,1,3,0,2,1,2]
        for j,k in enumerate(pattern): note(0,start+j*.5,.7,tones[k]-12,43 if intro else 49)
        note(5,start,2.9,bass-12,43)
        if not intro:
            note(5,start+3,.65,bass-12+7,32)
            if bar%2==0:
                for j,pitch in enumerate(tones): note(1,start+2+j*.25,1.5,pitch+12,35)
            # Cordas apenas em parte do arranjo; volume baixo para não cansar.
            if 12<=bar<28 or 36<=bar<44:
                for pitch in tones[:3]: note(3,start+.12,3.7,pitch,29)
            phrase = phrase_b if 12<=bar<20 or 28<=bar<36 else phrase_a
            melody = phrase[(bar-4)%8]
            instrument = 1 if 20<=bar<28 else 2
            for pos,pitch,duration in melody:
                note(instrument,start+pos,duration,pitch,61 if instrument==2 else 54)
            # Resposta breve da celesta, somente ao fim de algumas frases.
            if bar%8 in [3,7]:
                for j,pitch in enumerate([tones[2]+12,tones[1]+12]): note(6,start+3+j*.4,.9,pitch,32)
        elif bar in [2,46]:
            for j,pitch in enumerate(tones): note(1,start+j*.5,2,pitch+12,40)
    # Renderiza a reverberação posterior e a dobra no início do mesmo ciclo.
    total=round((length+5)*SR); audio=np.zeros((total,2),np.float32)
    events.sort()
    cursor=0
    def block(end):
        nonlocal cursor
        while cursor<end:
            n=min(8192,end-cursor); left=np.empty(n,np.float32); right=np.empty(n,np.float32)
            render(synth,n,left.ctypes.data,0,1,right.ctypes.data,0,1)
            audio[cursor:cursor+n,0]=left; audio[cursor:cursor+n,1]=right; cursor+=n
    for at,kind,ch,pitch,vel in events:
        block(min(at,total))
        if kind:on(synth,ch,pitch,vel)
        else:off(synth,ch,pitch)
    block(total)
    api('delete_fluid_synth',None,[ptr])(synth); api('delete_fluid_settings',None,[ptr])(settings)
    n=round(length*SR); tail=audio[n:].copy(); audio=audio[:n].copy(); audio[:len(tail)]+=tail
    # Quase inaudível, ar estéreo filtrado; sem batida eletrônica e sem graves fortes.
    breeze=sosfilt(butter(2,[600,3200],fs=SR,btype='bandpass',output='sos'),RNG.normal(0,1,(len(audio),2)),axis=0)
    audio+=breeze*.00007
    # Evita descontinuidade numérica na junção sem criar silêncio no loop.
    edge=audio[-1]-audio[0]
    audio[:128]+=edge[None,:]*np.linspace(1,0,128)[:,None]
    result=save('caminhos-da-floresta',audio,.085,loop=True)
    result.update(title='Caminhos da Floresta',bpm=BPM,transpose=0,shared=True)
    return result

def tone(notes, seconds, softness=.16):
    t=np.arange(round(seconds*SR))/SR; a=np.zeros(len(t))
    for start,pitch,duration,gain in notes:
        q=np.maximum(0,t-start); freq=440*2**((pitch-69)/12)
        env=(1-np.exp(-q/.012))*np.exp(-q/max(.08,duration))*(t>=start)
        a+=gain*env*(np.sin(2*np.pi*freq*q)+softness*np.sin(2*np.pi*freq*2*q)*np.exp(-q/.1))
    return a

def noise(seconds, low, high):
    return sosfilt(butter(2,[low,high],fs=SR,btype='bandpass',output='sos'),RNG.normal(size=round(seconds*SR)))

def effects():
    result={}
    def emit(name,a,rms=.09,loop=False):
        result[name]=save(name,a,rms,ceiling=.48,bitrate='80k',loop=loop)
        if loop:result[name]['loop']=True
    # Madeira abafada e curta: menus e passos, sem bipes agudos.
    t=np.arange(round(.19*SR))/SR
    emit('toque',np.sin(2*np.pi*420*t)*np.exp(-t*37)*.6+noise(.19,280,2100)*np.exp(-t*55)*.18,.075)
    emit('receber',tone([(0,74,.27,.5),(.12,78,.3,.45),(.25,81,.4,.42)],.95),.09)
    t=np.arange(round(1.2*SR))/SR
    flow=noise(1.2,200,4500)*np.sin(np.pi*t/1.2)**1.2
    emit('agua-liberada',flow*.14+tone([(.1,74,.3,.12),(.4,81,.3,.09)],1.2),.085)
    # Jato contínuo estéreo; ruído filtrado, fluxo ondulante, junção circular.
    t=np.arange(4*SR)/SR
    hose=noise(4,220,5200)*(.58+.08*np.sin(2*np.pi*t*.5)+.04*np.sin(2*np.pi*t*1.25))
    fade=round(.08*SR); blend=np.linspace(0,1,fade)
    hose[:fade]=hose[-fade:]*(1-blend)+hose[:fade]*blend
    hose=hose[:-fade]
    emit('mangueira',np.column_stack((hose,np.roll(hose,41))),.075,True)
    emit('restaurar',tone([(0,62,.5,.2),(.12,69,.4,.27),(.27,74,.5,.38),(.48,78,.6,.35),(.7,81,.5,.23)],1.6),.09)
    emit('resgate',tone([(0,74,.3,.35),(.19,78,.35,.4),(.4,81,.55,.36)],1.35),.09)
    t=np.arange(round(.48*SR))/SR
    emit('coletar',noise(.48,700,3300)*np.exp(-t*20)*.16+tone([(.07,78,.16,.35),(.17,81,.2,.25)],.48),.08)
    emit('tentar',tone([(0,62,.12,.35),(.13,66,.13,.2)],.4,0),.06)
    emit('vitoria',tone([(0,62,.7,.2),(0,66,.7,.15),(0,69,.7,.15),(.15,74,.4,.33),(.45,78,.4,.3),(.75,81,.5,.35),(1.15,86,.9,.24)],2.8),.09)
    t=np.arange(round(.17*SR))/SR
    emit('passo',noise(.17,120,1700)*np.exp(-t*38)*.4+np.sin(2*np.pi*125*t)*np.exp(-t*55)*.3,.06)
    t=np.arange(round(.34*SR))/SR
    emit('nadar',noise(.34,300,3800)*np.sin(np.pi*t/.34)**1.5,.065)
    t=np.arange(round(.62*SR))/SR
    emit('plantar',noise(.62,160,2300)*np.exp(-t*9)*.2+tone([(.2,74,.15,.25),(.35,78,.16,.2)],.62),.07)
    return result

if __name__=='__main__':
    track=music(); sounds=effects()
    catalog={'music':{key:track for key in ['menu','floresta','rio','fauna','plantio','cidade']},'effects':sounds,
             'credits':{'composition':'Caminhos da Floresta: composição e arranjo originais para Guardião da Natureza.',
                        'instruments':'TimGM6mb — Tim Brechbill e David Bolton; renderização FluidSynth.'}}
    (OUT/'manifesto.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
    (OUT.parent/'catalogo.js').write_text('"use strict";window.GuardiaoTrilha='+json.dumps(catalog,ensure_ascii=False,separators=(',',':'))+';\n')
    print(json.dumps({'musica':track,'efeitos':len(sounds)},ensure_ascii=False),flush=True)
