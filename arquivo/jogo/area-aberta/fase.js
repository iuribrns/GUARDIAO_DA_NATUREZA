'use strict';
(() => {
  const W=window.GuardiaoMundo,$=id=>document.getElementById(id),canvas=$('cenario'),ctx=canvas.getContext('2d');
  const KEY='guardiao.area-aberta.floresta.v1',MAP_KEY='guardiao.mapa.progresso.v1';
  const player={x:650,y:370,facing:1,direction:'lado',distance:0,idle:0},stick={x:0,y:0,pointer:null},keys=new Set();
  let fires=W.fires.map(f=>({...f,life:1})),animals=W.animals.map(a=>({...a,safe:false,rescue:0}));
  let water=0,released=false,equipped=false,equipping=0,spraying=false,space=false,waterPointer=null;
  let target=null,route=[],routeGoal=null,selectedGoal='agua',completed=false,clock=0,previous=0,frame=0,toastUntil=0,dirty=false;
  let flora={x:607,y:293},camera={x:640,y:360,scale:1},size={w:1280,h:720},audio=null,sound=false,lastSound=0;
  let background,inhabitants,fireImage,directionImage,equipmentImage,rescueImage,stairsImage,animator,ready=false,paused=false,saveWarning=false,actionTime=0,rescueAnimal=null;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||preferences.reduceMotion;
  let preferences={};try{const saved=JSON.parse(localStorage.getItem('guardiao.horizonte.preferences.v1')||'{}');if(saved&&typeof saved==='object')preferences=saved;}catch{}
  document.documentElement.classList.toggle('large-text',preferences.largeText===true);
  function load() {
    try {
      const s=JSON.parse(localStorage.getItem(KEY)||'null');if(!s||s.version!==1)return;
      released=s.released===true;equipped=s.equipped===true;
      if(Array.isArray(s.fires)&&s.fires.length===8) fires.forEach((f,i)=>{f.life=Number.isFinite(s.fires[i])?Math.max(0,Math.min(1,s.fires[i])):1;});
      if(Array.isArray(s.animals)) animals.forEach(a=>{a.safe=s.animals.includes(a.id)&&a.fires.every(id=>fires[id].life===0);});
      water=released&&Number.isFinite(s.water)?Math.max(0,Math.min(100,s.water)):0;
      if(Number.isFinite(s.x)&&Number.isFinite(s.y)&&W.walkable({x:s.x,y:s.y}))Object.assign(player,{x:s.x,y:s.y});
      completed=released&&fires.every(f=>f.life===0)&&animals.every(a=>a.safe);
    }catch{ /* A falta de armazenamento não impede a aventura. */ }
  }
  function save() {
    try {localStorage.setItem(KEY,JSON.stringify({version:1,released,equipped,water,fires:fires.map(f=>f.life),animals:animals.filter(a=>a.safe).map(a=>a.id),x:player.x,y:player.y}));dirty=false;}
    catch {if(!saveWarning){saveWarning=true;toast('O navegador não permitiu salvar. A aventura continua nesta aba.');}}
  }
  function toast(text){$('toast').textContent=text;toastUntil=clock+4;}
  function speak(text){$('fala').textContent=text;$('flora-talk').hidden=false;}
  function stopped(){return paused||document.hidden||[...document.querySelectorAll('dialog')].some(d=>d.open);}
  function neutral(){keys.clear();stick.x=stick.y=0;stick.pointer=null;waterPointer=null;spraying=space=false;$('stick').style.transform='';$('mangueira').classList.remove('is-held');}
  function dialog(id){neutral();route=[];$(id).showModal();}
  function tone(freq=440,duration=.08){
    if(!sound||!audio)return;
    const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.value=freq;
    const volume=Number.isFinite(preferences.effectsVolume)?Math.max(0,Math.min(100,preferences.effectsVolume))/100:.6;
    if(volume===0)return;
    gain.gain.setValueAtTime(.04*volume,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);
    osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration);
  }
  const nearby=(p,range)=>W.distance(player,p)<range;
  function currentFire(){return fires.filter(f=>f.life>0&&nearby(f,155)).sort((a,b)=>W.distance(player,a)-W.distance(player,b))[0];}
  function equip(){equipped=true;equipping=.65;actionTime=.65;dirty=true;$('mangueira').setAttribute('aria-pressed','true');speak('Mangueira pronta! Segure o botão de água perto das chamas. Eu fico ao seu lado, Kai!');tone(660);}
  function pointForGoal(goal){
    if(goal==='agua')return {x:397,y:360,label:released?'registro para abastecer':'registro de água'};
    if(goal==='fogo')return fires.filter(f=>f.life>0).sort((a,b)=>W.distance(player,a)-W.distance(player,b))[0];
    const a=animals.filter(a=>!a.safe).sort((a,b)=>W.distance(player,a)-W.distance(player,b))[0];return a;
  }
  function guide(goal=selectedGoal){
    selectedGoal=goal;let point=pointForGoal(goal);
    if(!point){speak(goal==='fogo'?'Todos os incêndios foram apagados! Vamos buscar os animais.':'Todos os animais estão seguros! Falta verificar os incêndios.');return;}
    if(goal==='fogo'&&!released){point=pointForGoal('agua');speak('Primeiro precisamos abrir o registro vermelho. Vou mostrar o caminho!');}
    else if(goal==='animal'&&point.fires.some(id=>fires[id].life>0))speak('O animal está assustado com o fogo. Apague as chamas ao redor antes de usar o kit de resgate. Vou mostrar o caminho.');
    else speak(goal==='agua'?(released?'Vamos ao registro para encher o reservatório da mochila.':'Siga comigo até o registro e toque na mão para liberar a água.'):goal==='fogo'?'Vou mostrar o incêndio mais próximo. Ao chegar, segure o botão da mangueira.':'Vamos buscar o animal. Chegue perto e toque na mão para resgatá-lo.');
    route=W.route(player,point);routeGoal=point;target=point;
  }
  function interact(){
    if(stopped()||!ready)return;
    if(nearby({x:397,y:360},95)) {
      released=true;water=100;actionTime=.6;dirty=true;
      toast('Água liberada · reservatório cheio');speak('Conseguimos! Abra a mochila para equipar a mangueira, ou toque no botão de água.');tone(740,.2);save();updateHUD();return;
    }
    const animal=animals.filter(a=>!a.safe&&nearby(a,95)).sort((a,b)=>W.distance(player,a)-W.distance(player,b))[0];
    if(animal){
      if(animal.fires.some(id=>fires[id].life>0)){speak('Ainda há chamas perto deste animal! Apague esses focos para fazer o resgate com segurança.');tone(220);return;}
      if(rescueAnimal)return;
      rescueAnimal=animal;animal.rescue=1.1;actionTime=1.1;route=[];player.facing=animal.x>=player.x?1:-1;player.direction='lado';speak('Calma, pequeno… Kai está usando o kit de resgate. Eu vou ajudar no resgate e mostrar o caminho do abrigo!');return;
    }
    if(nearby({x:280,y:245},95)){speak('Carlos: o registro fica na barragem. Abra a água, use a mangueira e salve os animais. O abrigo junto à cabana está pronto para recebê-los!');actionTime=.4;return;}
    speak('Chegue perto do registro, de Carlos ou de um animal e toque na mão. Você também pode tocar em uma missão para eu guiar Kai.');
  }
  function updateHUD(){
    const out=fires.filter(f=>f.life===0).length,safe=animals.filter(a=>a.safe).length;
    $('agua-estado').textContent=released?'liberada':'fechada';$('agua-check').textContent=released?'✓':'○';
    $('incendios').textContent=out+'/8';$('animais').textContent=safe+'/3';
    $('fogo-check').textContent=out===8?'✓':'○';$('animal-check').textContent=safe===3?'✓':'○';
    $('reserva').value=water;$('agua-numero').textContent=Math.floor(water)+'%';
    if(!completed&&released&&out===8&&safe===3)win();
  }
  function win(){
    completed=true;save();
    let persisted=true;
    try{const old=JSON.parse(localStorage.getItem(MAP_KEY)||'null');localStorage.setItem(MAP_KEY,JSON.stringify({...old,completedFirst:true,current:2}));}catch{persisted=false;}
    $('salvo').textContent=persisted?'Rio Poluído liberado no mapa. Progresso salvo neste navegador.':'Missão concluída nesta aba. O navegador não permitiu salvar o mapa.';
    speak('Você conseguiu, Kai! A água voltou, os animais estão seguros e a floresta pode se recuperar.');tone(880,.4);dialog('vitoria');
  }
  function canStep(p){return W.walkable(p)&&!fires.some(f=>f.life>0&&W.distance(p,f)<25);}
  function move(dx,dy){
    const length=Math.hypot(dx,dy),steps=Math.max(1,Math.ceil(length/2));let travelled=0;
    for(let i=0;i<steps;i++){
      const old={x:player.x,y:player.y},nx=player.x+dx/steps,ny=player.y+dy/steps;
      if(canStep({x:nx,y:ny})){player.x=nx;player.y=ny;}
      else if(canStep({x:nx,y:player.y}))player.x=nx;
      else if(canStep({x:player.x,y:ny}))player.y=ny;
      travelled+=W.distance(old,player);
    }
    if(travelled>.01){player.distance+=travelled;player.idle=0;dirty=true;if(Math.abs(dx)>.01)player.facing=dx>0?1:-1;player.direction=Math.abs(dy)>Math.abs(dx)*1.3?(dy<0?'costas':'frente'):'lado';}
    return travelled;
  }
  function update(dt){
    clock+=dt;equipping=Math.max(0,equipping-dt);actionTime=Math.max(0,actionTime-dt);
    let dx=stick.x+Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));
    let dy=stick.y+Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));
    if(dx||dy){route=[];routeGoal=null;}
    else if(route.length){
      while(route.length&&W.distance(player,route[0])<5)route.shift();
      if(route.length){const dest=route[0],dist=W.distance(player,dest);dx=(dest.x-player.x)/dist;dy=(dest.y-player.y)/dist;}
      else if(routeGoal){toast('Você chegou. '+(routeGoal.label?'Toque na mão para interagir.':'Use o equipamento perto do objetivo.'));routeGoal=null;}
    }
    const amount=Math.hypot(dx,dy);if(amount>1){dx/=amount;dy/=amount;}
    let travelled=0;
    if(!rescueAnimal&&equipping===0)travelled=move(dx*112*dt,dy*112*dt);
    if(route.length&&!travelled&&amount>0){route=[];routeGoal=null;}
    if(travelled===0)player.idle+=dt;
    animator.update({state:travelled>.01?'andando':'parado',distance:player.distance,idleTime:player.idle,reduced:reduced()});
    if(released&&nearby({x:397,y:360},83)&&water<100){water=Math.min(100,water+35*dt);dirty=true;}
    target=null;
    if((spraying||space)&&equipped&&equipping===0&&released&&water>0&&!rescueAnimal){
      target=currentFire();water=Math.max(0,water-4*dt);dirty=true;
      if(target){
        if(Math.abs(target.x-player.x)>4)player.facing=target.x>player.x?1:-1;player.direction='lado';
        target.life=Math.max(0,target.life-.36*dt);
        if(target.life===0){target.extinguishedAt=clock;toast('Incêndio apagado! '+fires.filter(f=>f.life===0).length+'/8');tone(720,.15);save();}
      }
      if(clock-lastSound>.17){lastSound=clock;tone(1100+Math.random()*500,.04);}
    }
    if(rescueAnimal){
      rescueAnimal.rescue=Math.max(0,rescueAnimal.rescue-dt);
      if(rescueAnimal.rescue===0){rescueAnimal.safe=true;rescueAnimal.homeTime=clock;rescueAnimal.home={x:rescueAnimal.x,y:rescueAnimal.y};rescueAnimal.homeRoute=W.route(rescueAnimal,{x:320,y:265});toast(rescueAnimal.name+' em segurança!');tone(960,.2);rescueAnimal=null;save();}
    }
    animals.forEach(a=>{
      if(!a.homeRoute?.length)return;
      const next=a.homeRoute[0],d=W.distance(a.home,next),step=Math.min(d,100*dt);
      if(d<2)a.homeRoute.shift();else {a.home.x+=(next.x-a.home.x)/d*step;a.home.y+=(next.y-a.home.y)/d*step;}
    });
    const fx=rescueAnimal?rescueAnimal.x-20:route.length?player.x+dx*65:player.x-35;
    const fy=rescueAnimal?rescueAnimal.y-55:route.length?player.y+dy*50-65:player.y-65;
    flora.x+=(fx-flora.x)*Math.min(1,dt*4);flora.y+=(fy-flora.y)*Math.min(1,dt*4);
    if($('toast').textContent&&clock>toastUntil)$('toast').textContent='';
    updateHUD();contextHint();
  }
  function contextHint(){
    let text='Toque nas missões para Flora guiar Kai. WASD/setas: mover · E: interagir · Espaço: água · B: mochila';
    if(nearby({x:397,y:360},95))text=released?'Reservatório: fique perto para reabastecer ou toque na mão.':'Toque na mão para abrir o registro e liberar a água.';
    else if(animals.some(a=>!a.safe&&nearby(a,95)))text='Toque na mão para ajudar o animal. Apague antes o fogo ao redor.';
    else if(currentFire())text=!released?'Libere a água no registro antes de usar a mangueira.':water<1?'Água acabou! Toque na missão de água para voltar ao registro.':'Segure ÁGUA para apagar as chamas próximas.';
    if(rescueAnimal)text='Resgatando '+rescueAnimal.name.toLowerCase()+'…';
    if(equipping>0)text='Kai está tirando a mangueira da mochila…';
    if(completed)text='Floresta salva! Você pode continuar explorando ou voltar ao mapa.';
    if($('dica').textContent!==text)$('dica').textContent=text;
  }
  function resize(){
    size={w:innerWidth,h:innerHeight};const ratio=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(size.w*ratio);canvas.height=Math.round(size.h*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
    camera.scale=Math.max(size.w/1280,size.h/720);
    // Retrato usa uma câmera próxima; paisagem mostra a composição da referência.
    camera.scale=Math.min(camera.scale,1.8);draw();
  }
  function view(){
    const s=camera.scale,halfW=size.w/(2*s),halfH=size.h/(2*s);
    camera.x=Math.max(halfW,Math.min(1280-halfW,player.x));camera.y=Math.max(halfH,Math.min(720-halfH,player.y));
    if(halfW>=640)camera.x=640;if(halfH>=360)camera.y=360;
    return {s,ox:size.w/2-camera.x*s,oy:size.h/2-camera.y*s};
  }
  function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
  function sprite(index,x,y,width,height,flip=false){
    const [sx,sy,sw,sh]=W.sprites[index];ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);
    ctx.drawImage(inhabitants,sx,sy,sw,sh,-width/2,-height,width,height);ctx.restore();
  }
  function ring(x,y,color='#a8e7ed',radius=20){ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,radius,radius*.4,0,0,Math.PI*2);ctx.stroke();}
  function label(text,x,y,color='#ffe6a1'){
    ctx.font='bold 12px system-ui';ctx.textAlign='center';const width=ctx.measureText(text).width+18;
    ctx.fillStyle='#24180fe8';ctx.strokeStyle='#a7793d';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x-width/2,y-17,width,23,5);ctx.fill();ctx.stroke();ctx.fillStyle=color;ctx.fillText(text,x,y-1);
  }
  function fire(f){
    if(f.life<=0){
      const growth=reduced()?1:Math.min(1,(clock-(f.extinguishedAt??-3))/2);
      ellipse(f.x,f.y,28*growth,11*growth,'#49833e66');
      for(let j=0;j<8;j++){
        const x=f.x+Math.sin(j*2.4)*23,y=f.y+Math.cos(j*2.4)*7;
        ctx.save();ctx.translate(x,y);ctx.scale(growth,growth);ctx.strokeStyle='#618a36';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-9);ctx.stroke();
        ellipse(-3,-6,4,1.8,'#a4ce65');ellipse(3,-9,4,1.8,'#7eb943');if(j%3===0)ellipse(0,-11,1.8,1.8,'#ffe2a2');ctx.restore();
      }
      if(!reduced()){for(let j=0;j<3;j++){const t=(clock*.7+j*.33)%1;ellipse(f.x+Math.sin(j*3)*16,f.y-t*30,2,2,'#b8e799');}}return;
    }
    const time=reduced()?0:clock,pose=reduced()?0:(Math.floor(clock*10)+f.id*3)%8;
    ellipse(f.x,f.y,38,14,'#e94b224d');
    const spirit=f.kind==='espirito',h=(spirit?56:109)*(.45+.55*f.life),w=h*.75;
    const bob=spirit&&!reduced()?Math.sin(clock*5)*3:0;
    ctx.drawImage(fireImage,pose%4*384,Math.floor(pose/4)*512,384,512,f.x-w/2,f.y-h*.93+bob,w,h);
    if(spirit){ellipse(f.x-5,f.y-17+bob,2.5,4,'#462411');ellipse(f.x+5,f.y-17+bob,2.5,4,'#462411');ellipse(f.x-5.5,f.y-18.5+bob,.8,1,'#fff4ad');ellipse(f.x+4.5,f.y-18.5+bob,.8,1,'#fff4ad');ellipse(f.x,f.y-9+bob,2,2,'#963722');}
    if(!reduced()){
      for(let j=0;j<4;j++){const t=(time*.28+j*.23+f.id*.1)%1;ellipse(f.x+Math.sin(j+time*.3)*12,f.y-30-t*65,8+t*10,9+t*8,'rgba(69,58,50,'+((1-t)*.16)+')');}
      for(let j=0;j<3;j++){const t=(time*.8+j*.3)%1;ellipse(f.x+Math.sin(j*4+t*3)*20,f.y-t*70,1.3,2,'#ffc24a');}
    }
    if(f.life<.99){ctx.fillStyle='#25160b';ctx.fillRect(f.x-23,f.y+9,46,5);ctx.fillStyle='#5be0ff';ctx.fillRect(f.x-22,f.y+10,44*(1-f.life),3);}
  }
  function drawKai(){
    ellipse(player.x,player.y+1,15,6,'#17241365');ctx.save();ctx.translate(player.x,player.y);ctx.scale(player.facing,1);
    const bob=equipping>0?Math.sin((.65-equipping)*18)*2:0;
    const actionPose=!!rescueAnimal||equipping>0||equipped&&player.idle>0&&player.direction==='lado';
    if(rescueAnimal){
      const id=Math.min(11,Math.floor((1.1-rescueAnimal.rescue)/1.1*12)),f=window.GuardiaoKaiResgate[id],[sx,sy,sw,sh]=f.bounds,scale=57/342;
      ctx.drawImage(rescueImage,sx,sy,sw,sh,(sx-f.pivot[0])*scale,(sy-f.pivot[1])*scale,sw*scale,sh*scale);document.body.dataset.kaiActionFrame='resgate_'+id;
    }else if(actionPose){
      const id=equipping>0?Math.min(5,Math.floor((.65-equipping)/.65*6)):(spraying||space)?7:6;
      const f=window.GuardiaoKaiEquipamento[id],[sx,sy,sw,sh]=f.bounds,scale=57/342;
      ctx.drawImage(equipmentImage,sx,sy,sw,sh,(sx-f.pivot[0])*scale,(sy-f.pivot[1])*scale,sw*scale,sh*scale);
      document.body.dataset.kaiActionFrame=String(id);
    }else if(player.direction!=='lado'&&equipping===0&&!(spraying||space)){
      const id=(player.direction==='costas'?4:0)+(player.idle>0?1:Math.floor(player.distance/18)%4),f=window.GuardiaoKaiDirecoes[id];
      const [sx,sy,sw,sh]=f.bounds,scale=57/448;ctx.save();ctx.scale(player.facing,1);ctx.drawImage(directionImage,sx,sy,sw,sh,(sx-f.pivot[0])*scale,(sy-f.pivot[1])*scale,sw*scale,sh*scale);ctx.restore();
    }else ctx.drawImage(animator.canvas,-37,-67+bob,74,71);
    if(!actionPose)document.body.dataset.kaiActionFrame='none';
    if(equipped&&!actionPose){
      const t=equipping>0?1-equipping/.65:1;const hx=-12+38*t,hy=-34-16*Math.sin(t*Math.PI);
      // A mangueira sai da mochila e chega à mão; o tubo continua ligado ao reservatório.
      ctx.strokeStyle='#2c2011';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-10,-35);ctx.quadraticCurveTo(-24,-6,hx,hy);ctx.stroke();
      ctx.strokeStyle='#d0ab55';ctx.lineWidth=3;ctx.stroke();ctx.translate(hx,hy);ctx.rotate(-.18);
      ctx.fillStyle='#174465';ctx.fillRect(-6,-4,17,8);ctx.fillStyle='#48c8e8';ctx.fillRect(-3,-3,13,5);ctx.fillStyle='#e6b658';ctx.fillRect(9,-5,4,10);
    }
    ctx.restore();
    if(actionTime>0){ring(player.x,player.y,'#ffe49d',20+Math.sin(clock*10)*2);if(rescueAnimal)label('Resgatando…',player.x,player.y-80);}
  }
  function waterStream(){
    if(!(spraying||space)||!released||water<=0||!equipped||equipping>0||stopped())return;
    const from={x:player.x+player.facing*24,y:player.y-36},to=target?{x:target.x,y:target.y-12}:{x:player.x+player.facing*110,y:player.y-26};
    ctx.lineCap='round';ctx.strokeStyle='#258ab68c';ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.quadraticCurveTo((from.x+to.x)/2,Math.min(from.y,to.y)-26,to.x,to.y);ctx.stroke();
    ctx.strokeStyle='#b9f7ff';ctx.lineWidth=4;ctx.stroke();
    for(let j=0;j<18;j++){const t=(clock*2+j/18)%1,x=from.x+(to.x-from.x)*t,y=from.y+(to.y-from.y)*t-65*t*(1-t);ellipse(x+Math.sin(j*7)*t*8,y+Math.cos(j*4)*t*7,1.3,1.6,'#cbf7ff');}
    for(let j=0;j<8;j++)ellipse(to.x+Math.sin(j*6+clock*10)*16,to.y+Math.cos(j*5+clock*8)*9,1.6,1.8,'#e4fbff');
  }
  function draw(){
    if(!ready)return;
    const {s,ox,oy}=view();ctx.clearRect(0,0,size.w,size.h);ctx.save();ctx.translate(ox,oy);ctx.scale(s,s);ctx.drawImage(background,0,0,1280,720);
    // Uma segunda escadaria liga a clareira ao patamar da escada pintada.
    ctx.save();ctx.transform(.14,0,.012,.07,880,233);ctx.drawImage(stairsImage,0,0);ctx.restore();
    // Efeitos locais independentes; a interação não reproduz GIF ou vídeo.
    if(!reduced()){
      ctx.strokeStyle='#bcf7ff88';ctx.lineWidth=1.5;
      for(let j=0;j<9;j++){const t=(clock*.5+j*.17)%1;ctx.beginPath();ctx.moveTo(300+j%3*5,365+t*62);ctx.lineTo(298+j%3*5,371+t*62);ctx.stroke();}
      for(let j=0;j<5;j++){const t=(clock*.22+j*.2)%1;ctx.globalAlpha=(1-t)*.4;ctx.strokeStyle='#c6f5fa';ctx.beginPath();ctx.ellipse(374+j*16,321+j%2*8,4+t*14,2+t*4,0,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;
    }
    if(completed){ctx.fillStyle='#9fdd6d15';ctx.fillRect(0,0,1280,720);}
    else {ellipse(1229,263,2,3,'#ffd85c');ellipse(1241,263,2,3,'#ffd85c');}
    if(route.length){ctx.setLineDash([3,8]);ctx.strokeStyle='#ffeca78c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(player.x,player.y);route.forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke();ctx.setLineDash([]);}
    const objective=routeGoal||(!released?{x:397,y:360}:null);
    if(objective){ring(objective.x,objective.y,'#9ce9ff',25+(reduced()?0:Math.sin(clock*4)*3));}
    ring(397,360,released?'#86d991':'#75dfff',12);
    if(nearby({x:397,y:360},100))label(released?'Reabastecer · mão':'Liberar água · mão',397,311);
    const actors=[{y:245,draw:()=>{ellipse(280,245,15,5,'#17241355');sprite(7,280,245,38,67);if(nearby({x:280,y:245},90))label('Carlos',280,169);}},...fires.map(f=>({y:f.y,draw:()=>fire(f)}))];
    animals.forEach(a=>actors.push({y:a.safe?(a.home?.y??258+a.sprite*3):a.y,draw:()=>{
      let x=a.x,y=a.y;
      if(a.safe){x=a.home?.x??320+(a.sprite-4)*30;y=a.home?.y??258+(a.sprite-4)*10;}
      const width=a.sprite===6?25:43,height=a.sprite===5?51:a.sprite===6?26:36;
      ellipse(x,y,13,4,'#152a2055');sprite(a.sprite,x,y-(reduced()?0:Math.sin(clock*2+a.sprite)*.6),width,height);
      if(!a.safe){ring(x,y,a.fires.every(id=>fires[id].life===0)?'#b6f19b':'#ffcd80',17);if(nearby(a,105))label(a.name+(a.rescue?' · resgatando':' · mão'),x,y-height-9);}
      if(a.safe&&clock-(a.homeTime??-3)<2)label('Seguro! ✓',x,y-height-8,'#c3f59a');
    }}));
    actors.push({y:player.y,draw:drawKai});actors.sort((a,b)=>a.y-b.y).forEach(a=>a.draw());
    waterStream();
    const owlPose=rescueAnimal?2:Math.floor(clock*6)%3;const flutter=reduced()?0:Math.sin(clock*5)*3;
    sprite(reduced()?3:owlPose,flora.x,flora.y+flutter,43,36,player.facing<0);
    if(rescueAnimal){ring(rescueAnimal.x,rescueAnimal.y,'#caff9a',25);ctx.strokeStyle='#d3ff97';ctx.lineWidth=2;ctx.beginPath();ctx.arc(rescueAnimal.x,rescueAnimal.y-25,24,-Math.PI/2,-Math.PI/2+(1-rescueAnimal.rescue/1.1)*Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
  function loop(time){frame=0;if(!ready||document.hidden)return;const dt=previous?Math.min((time-previous)/1000,.034):.016;previous=time;if(!stopped())update(dt);draw();frame=requestAnimationFrame(loop);}
  function start(){if(ready&&!frame&&!document.hidden){previous=0;frame=requestAnimationFrame(loop);}}
  const joystick=$('joystick');
  function stickMove(e){const r=joystick.getBoundingClientRect(),radius=r.width*.3;let x=(e.clientX-r.left-r.width/2)/radius,y=(e.clientY-r.top-r.height/2)/radius;const length=Math.hypot(x,y);if(length<.12)x=y=0;else if(length>1){x/=length;y/=length;}stick.x=x;stick.y=y;$('stick').style.transform=`translate(${x*radius}px,${y*radius}px)`;}
  joystick.addEventListener('pointerdown',e=>{if(e.button!==0||stick.pointer!==null||stopped())return;e.preventDefault();stick.pointer=e.pointerId;joystick.setPointerCapture(e.pointerId);stickMove(e);});
  joystick.addEventListener('pointermove',e=>{if(e.pointerId===stick.pointer)stickMove(e);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(type,e=>{if(e.pointerId===stick.pointer){stick.pointer=null;stick.x=stick.y=0;$('stick').style.transform='';if(dirty)save();}});
  $('mangueira').addEventListener('pointerdown',e=>{if(e.button!==0||stopped())return;e.preventDefault();waterPointer=e.pointerId;$('mangueira').setPointerCapture(e.pointerId);beginWater();});
  function beginWater(){if(!released){speak('Antes da mangueira precisamos da água! Toque na missão de água e abra o registro vermelho.');return;}if(!equipped)equip();spraying=true;route=[];$('mangueira').classList.add('is-held');if(water<=0)speak('Reservatório vazio! Volte ao registro para abastecer.');}
  for(const type of ['pointerup','pointercancel','lostpointercapture'])$('mangueira').addEventListener(type,e=>{if(e.pointerId===waterPointer){spraying=false;waterPointer=null;$('mangueira').classList.remove('is-held');if(dirty)save();}});
  $('mangueira').addEventListener('click',e=>{if(e.detail===0&&!stopped()){if(spraying){spraying=false;save();}else beginWater();}});
  $('interagir').addEventListener('click',interact);$('mochila').addEventListener('click',()=>dialog('inventario'));
  $('equipar').addEventListener('click',()=>{$('inventario').close();equip();save();});
  $('pausa').addEventListener('click',()=>dialog('menu-pausa'));$('ajuda').addEventListener('click',()=>guide(released&&water>10?'fogo':'agua'));
  $('fechar-fala').addEventListener('click',()=>{$('flora-talk').hidden=true;});
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
  document.querySelectorAll('[data-goal]').forEach(b=>b.addEventListener('click',()=>{if(!stopped())guide(b.dataset.goal);}));
  $('recomecar').addEventListener('click',()=>{try{localStorage.removeItem(KEY);}catch{}location.reload();});
  $('tela-cheia').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('jogo').requestFullscreen();}catch{toast('Use o modo paisagem do celular para ampliar a visão.');}});
  $('som').addEventListener('click',async()=>{sound=!sound;if(sound){audio??=new (window.AudioContext||window.webkitAudioContext)();await audio.resume();} $('som').setAttribute('aria-pressed',String(sound));$('som').setAttribute('aria-label',sound?'Desativar efeitos sonoros':'Ativar efeitos sonoros');tone(660,.15);});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){neutral();if(![...document.querySelectorAll('dialog')].some(d=>d.open)){e.preventDefault();dialog('menu-pausa');}return;}
    if(stopped()||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))return;
    const key=e.key.toLowerCase();
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)){e.preventDefault();keys.add(key);if(key===' '&&!e.repeat){space=true;beginWater();}}
    if(key==='e'&&!e.repeat)interact();if(key==='b'&&!e.repeat)dialog('inventario');
  });
  document.addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());if(e.key===' '){space=spraying=false;$('mangueira').classList.remove('is-held');}if(dirty)save();});
  window.addEventListener('blur',()=>{neutral();if(dirty)save();});
  document.addEventListener('visibilitychange',()=>{neutral();if(document.hidden){cancelAnimationFrame(frame);frame=0;previous=0;if(dirty)save();}else start();});
  window.addEventListener('pagehide',()=>{neutral();cancelAnimationFrame(frame);frame=0;if(dirty)save();});window.addEventListener('pageshow',start);
  window.addEventListener('resize',resize);
  window.GuardiaoAreaAberta=Object.freeze({estado:()=>({ready,clock,player:{...player},flora:{...flora},water,released,equipped,equipping,fires:fires.map(f=>({...f})),animals:animals.map(a=>({...a})),route:route.map(p=>({...p})),completed,paused:stopped(),camera:{...camera},sprite:animator?.current})});
  load();
  Promise.all([loadImage('assets/floresta.png'),loadImage('assets/habitantes.png'),loadImage('assets/fogo.png'),loadImage('assets/kai-direcoes.png'),loadImage('../../assets/itens-remodelados/kai/01_mangueira.png'),loadImage('../../assets/itens-remodelados/kai/02_kit_medico.png'),loadImage('assets/escadaria.png')]).then(async images=>{
    [background,inhabitants,fireImage,directionImage,equipmentImage,rescueImage,stairsImage]=images;animator=new window.GuardiaoKaiAnimado(document.createElement('div'));await animator.ready;
    ready=true;flora.x=player.x-35;flora.y=player.y-65;document.body.dataset.gameReady='true';$('loading').hidden=true;
    $('mangueira').setAttribute('aria-pressed',String(equipped));updateHUD();resize();start();
    if(completed)speak('Bom te ver de novo, Kai! A floresta já está segura. Vamos explorar?');
    else if(released)speak('Vamos continuar, Kai! Os objetivos e a água da mochila estão salvos. Toque em uma missão se precisar de ajuda.');
  }).catch(()=>{$('loading').innerHTML='Não foi possível carregar a floresta.<br><a href="index.html">Toque aqui para tentar novamente</a>';});
  function loadImage(src){const im=new Image();im.src=new URL(src,location.href).href;return im.decode().then(()=>im);}
})();
