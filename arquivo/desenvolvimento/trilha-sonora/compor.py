"""Composições e efeitos originais, sem amostras externas. Reproduzível por semente."""
from pathlib import Path
import json,subprocess,tempfile,wave
import numpy as np
from scipy.signal import butter,sosfilt
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'jogo/sons-da-natureza/assets';SR=24000
OUT.mkdir(parents=True,exist_ok=True)
RNG=np.random.default_rng(720)
def freq(m):return 440*2**((m-69)/12)
def filt(v,hz,kind='lowpass',order=2):return sosfilt(butter(order,hz,fs=SR,btype=kind,output='sos'),v,axis=0)
def voice(m,duration,kind='keys'):
 t=np.arange(round(duration*SR))/SR;f=freq(m);phase=2*np.pi*f*t+.06*np.sin(2*np.pi*4.1*t)
 if kind=='bass':
  env=(1-np.exp(-t*90))*np.exp(-t*1.8);v=np.sin(phase)+.28*np.sin(phase*2)+.08*np.sin(phase*3)
 elif kind=='flute':
  env=(1-np.exp(-t*30))*np.exp(-t*2);v=np.sin(phase+.018*np.sin(2*np.pi*5*t))+.1*np.sin(phase*2)
 elif kind=='guitar':
  env=(1-np.exp(-t*240))*np.exp(-t*1.8);v=sum(np.sin(phase*n+.07*n)*np.exp(-t*n*.25)/n**1.8 for n in range(1,7))
 else:
  env=(1-np.exp(-t*145))*np.exp(-t*1.2);v=np.sin(phase+.14*np.sin(phase*2)*np.exp(-t*2))+.28*np.sin(phase*2)*np.exp(-t*1.5)+.055*np.sin(phase*3)*np.exp(-t*3)
 tail=np.clip((duration-t)/.045,0,1)
 return (v*env*tail).astype(np.float32)
def noise(duration,hz=1800):return filt(RNG.standard_normal(round(duration*SR)),hz).astype(np.float32)
def kick():
 t=np.arange(round(.31*SR))/SR;phase=2*np.pi*(43*t+38*.035*(1-np.exp(-t/.035)))
 return (np.sin(phase)*np.exp(-t*20)*(1-np.exp(-t*600))).astype(np.float32)
def brush():
 t=np.arange(round(.18*SR))/SR;return (filt(noise(.18,3100),400,'highpass')*np.exp(-t*27)+.13*np.sin(2*np.pi*170*t)*np.exp(-t*32)).astype(np.float32)
def hat():
 t=np.arange(round(.08*SR))/SR;return (filt(noise(.08,6200),2000,'highpass')*np.exp(-t*75)).astype(np.float32)
def add(mix,v,at,gain=1,pan=0,wrap=True):
 idx=round(at*SR);left=np.cos((pan+1)*np.pi/4);right=np.sin((pan+1)*np.pi/4)
 stereo=np.column_stack((v*left,v*right)).astype(np.float32)*gain
 # Circular tails make harmony/reverb continue across the musical loop.
 while len(stereo):
  pos=idx%len(mix);n=min(len(stereo),len(mix)-pos)
  if idx>=0:mix[pos:pos+n]+=stereo[:n]
  stereo=stereo[n:];idx+=n
  if not wrap:break
progression=[([48,55,59,62,64],36),([45,52,55,59,60],33),([50,57,60,64,65],38),([43,53,57,59,64],31),([52,59,62,66,67],40),([45,52,55,59,60],33),([53,57,60,64,67],41),([43,55,60,62,65],31)]
motifs=[[76,74,72],[71,69,None],[72,74,76],[74,71,67],[79,None,76],[76,72,71],[72,76,74],[71,69,67]]
profiles=[('menu','Brisa de boas-vindas',70,0,'keys'),('floresta','Clareira tranquila',72,-2,'guitar'),('rio','Águas de cristal',68,2,'keys'),('fauna','Amigos da mata',74,5,'flute'),('plantio','Sementes ao sol',66,-3,'guitar'),('cidade','Um amanhã mais verde',76,7,'keys')]
report={'sampleRate':SR,'music':{},'effects':{}}
def encode(name,data,category,title,bpm=None):
 data=np.asarray(data,np.float32)
 if data.ndim==1:data=np.column_stack((data,data))*.7071
 data=filt(data,30,'highpass');data=filt(data,6500)
 if category=='music':
  data=np.tanh(data*1.3)/1.3
  rms=float(np.sqrt(np.mean(data**2)));data*=.077/max(rms,1e-8)
  peak=float(abs(data).max());data*=min(1,.72/max(peak,1e-8))
 else:
  peak=float(abs(data).max());data*=.5/max(peak,1e-8)
  if name in ['mangueira','passo','nadar']:data*=.55
 # A short edge taper avoids clicks in MP3 playback and continuous noise loops.
 n=min(round(.018*SR),len(data)//8);data[:n]*=np.linspace(0,1,n)[:,None];data[-n:]*=np.linspace(1,0,n)[:,None]
 with tempfile.TemporaryDirectory() as tmp:
  wav=Path(tmp)/'mix.wav'
  with wave.open(str(wav),'wb') as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes((np.clip(data,-1,1)*32767).astype('<i2').tobytes())
  path=OUT/(name+'.mp3')
  subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','96k' if category=='music' else '64k','-ar','44100','-metadata','title='+title,'-metadata','artist=Guardião da Natureza — trilha original',str(path)],check=True)
 spec={'file':path.name,'title':title,'duration':round(len(data)/SR,3),'peak':round(float(abs(data).max()),5),'rms':round(float(np.sqrt(np.mean(data**2))),5),'bytes':path.stat().st_size}
 if bpm:spec['bpm']=bpm
 report[category][name]=spec
 print(category,name,spec['duration'],'s',spec['bytes'],'bytes',flush=True)
for scene,title,bpm,transpose,instrument in profiles:
 beat=60/bpm;length=32*4*beat;mix=np.zeros((round(length*SR),2),np.float32);RNG=np.random.default_rng(840+bpm)
 cache={}
 def tone(m,dur,kind):
  key=(m,round(dur,3),kind)
  if key not in cache:cache[key]=voice(m,dur,kind)
  return cache[key]
 for bar in range(32):
  chord,root=progression[bar%8];at=bar*4*beat;cycle=bar//8
  for i,m in enumerate(chord):
   add(mix,tone(m+transpose,3.8*beat,'keys'),at+.025+i*.009,.067,pan=(i-2)*.16)
   if bar%4!=3:add(mix,tone(m+transpose,1.8*beat,'keys'),at+2.65*beat+i*.006,.018,pan=(2-i)*.12)
  add(mix,tone(root+transpose,1.5*beat,'bass'),at,.084)
  add(mix,tone(root+transpose+(7 if bar%4==2 else 0),1.05*beat,'bass'),at+2.55*beat,.052)
  for k,m in enumerate(motifs[(bar+ (2 if scene=='rio' else 0))%8]):
   if m is None or (cycle==0 and bar<2 and k==2) or (bar%8==7 and k>0):continue
   offset=[.55,1.8,3.15][k]
   melody=m+transpose-(12 if scene=='plantio' else 0)
   add(mix,tone(melody,(.9 if k<2 else .65)*beat,instrument),at+offset*beat+RNG.uniform(-.009,.009),.042 if instrument=='flute' else .036,pan=.12*np.sin(bar+k))
  if cycle>0 and bar%4==2:add(mix,tone(chord[-2]+transpose,1.5*beat,'guitar'),at+3.55*beat,.018,pan=-.35)
  if not(bar%16==15):
   add(mix,kick(),at,.115);add(mix,kick(),at+2.5*beat,.072)
   for off in [1,3]:add(mix,brush(),at+(off+.035)*beat,.054,pan=.12)
   for h in range(8):add(mix,hat(),at+(h*.5+(.035 if h%2 else 0))*beat,.019 if h%2 else .012,pan=-.12)
 dry=mix.copy()
 for delay,gain in [(.071,.13),(.137,.10),(.233,.065),(.367,.04),(.481,.025)]:mix+=np.roll(dry[:,::-1],round(delay*SR),axis=0)*gain
 # Subtle filtered tape air; no abrasive crackles or sudden noises.
 mix+=noise(length,1700)[:,None]*.0008
 encode(scene,mix,'music',title,bpm)
 report['music'][scene]['transpose']=transpose
# Short original effects. Water is a continuous gentle filtered flow, not pitched beeps.
RNG=np.random.default_rng(998)
def effect_notes(notes,length,kind='guitar'):
 v=np.zeros(round(length*SR),np.float32)
 for m,at,gain,dur in notes:
  a=voice(m,dur,kind)*gain;i=round(at*SR);n=min(len(a),len(v)-i);v[i:i+n]+=a[:n]
 return v
encode('toque',effect_notes([(69,0,.7,.13),(76,.025,.18,.13)],.18),'effects','Toque de madeira')
encode('receber',effect_notes([(60,0,.45,.4),(64,.12,.4,.4),(67,.26,.3,.4)],.75),'effects','Itens recebidos')
encode('agua-liberada',effect_notes([(72,0,.3,.25),(79,.1,.22,.3),(76,.19,.2,.3)],.6)+noise(.6,1300)*np.exp(-np.arange(round(.6*SR))/SR*7)*.12,'effects','Água liberada')
t=np.arange(3*SR)/SR
water=filt(noise(3,2400),180,'highpass')*(.82+.07*np.sin(t*2*np.pi*.65)+.03*np.sin(t*2*np.pi*2.3))
encode('mangueira',water,'effects','Fluxo suave de água')
encode('restaurar',effect_notes([(67,0,.28,.7),(71,.13,.23,.7),(74,.27,.2,.7)],1.15),'effects','A natureza renasce')
encode('resgate',effect_notes([(72,0,.3,.65),(76,.18,.23,.65),(79,.4,.16,.6)],1.2,'flute'),'effects','Amigo em segurança')
encode('coletar',effect_notes([(64,0,.5,.22),(71,.08,.25,.24)],.4),'effects','Coleta cuidadosa')
encode('tentar',effect_notes([(55,0,.35,.15),(60,.09,.3,.16)],.3),'effects','Vamos tentar outra vez')
encode('vitoria',effect_notes([(60,0,.25,1.4),(64,.16,.25,1.4),(67,.32,.22,1.4),(71,.5,.2,1.4),(74,.7,.16,1.3),(76,.9,.12,1.2)],2.4),'effects','Um cuidado que virou luz')
t=np.arange(round(.12*SR))/SR
encode('passo',noise(.12,650)*np.exp(-t*45)+.4*np.sin(2*np.pi*105*t)*np.exp(-t*60),'effects','Passo na trilha')
t=np.arange(round(.22*SR))/SR
encode('nadar',noise(.22,1700)*np.exp(-t*19)+.3*np.sin(2*np.pi*(320*t-120*t*t))*np.exp(-t*22),'effects','Movimento na água')
t=np.arange(round(.5*SR))/SR
encode('plantar',noise(.5,1000)*np.exp(-t*13)*.18+effect_notes([(57,.04,.45,.4),(64,.15,.25,.3)],.5),'effects','Semente na terra')
(OUT/'manifesto.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
(OUT.parent/'catalogo.js').write_text('window.GuardiaoTrilha='+json.dumps(report,ensure_ascii=False,separators=(',',':'))+';\n')
