'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {mkdirSync}=require('node:fs');const {join}=require('node:path');
const captureFolder=process.env.GUARDIAO_CAPTURE_DIR;
if(captureFolder)mkdirSync(captureFolder,{recursive:true});
const capture=(page,name)=>captureFolder?page.screenshot({path:join(captureFolder,name+'.png'),animations:'disabled'}):Promise.resolve();
const base=process.env.GUARDIAO_TEST_URL||'http://127.0.0.1:5173/tela-inicial/nova-versao/';
const url=new URL('../../jogo/floresta-viva/index.html',base).href;
const state=p=>p.evaluate(()=>GuardiaoFloresta.estado());
const ready=p=>p.waitForFunction(()=>document.body.dataset.gameReady==='true');
const advance=(p,s)=>p.clock.runFor(s*1000);
async function intro(p){for(let n=0;n<4;n++)await p.locator('#conversa-avancar').click();assert.equal((await state(p)).itemsGiven,false);await advance(p,2);assert.equal((await state(p)).itemsGiven,true);}
async function guide(p,goal){await p.locator('[data-goal='+goal+']').click();for(let n=0;n<100;n++){await advance(p,.8);if(!(await state(p)).route.length)return;}throw Error('Rota não terminou: '+goal);}
async function spray(p){
 const initial=(await state(p)).fires.filter(f=>f.life===0).length,r=await p.locator('#mangueira').boundingBox();
 await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();
 for(let i=0;i<20;i++){await advance(p,.5);const s=await state(p);if(s.fires.filter(f=>f.life===0).length>initial||s.water===0)break;}
 await p.mouse.up();
}
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const errors=[];
 try{
  const p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await p.goto(base+'aventura.html');await p.waitForFunction(()=>window.GuardiaoPaineis);await p.locator('.map-stage [data-phase="1"]').click();await p.clock.install();await p.getByRole('button',{name:'Entrar na floresta',exact:true}).click();await p.waitForURL('**/jogo/floresta-viva/index.html');await ready(p);
  let s=await state(p);assert.equal(s.stage,'abertura');assert.equal(s.itemsGiven,false);assert.ok(Math.hypot(s.player.x-245,s.player.y-245)<70,'começa ao lado de Carlos');assert.equal(await p.locator('#conversa').isVisible(),true);assert.equal(await p.locator('[data-goal=agua]').isDisabled(),true);
  await p.keyboard.press('w');await advance(p,.4);assert.deepEqual([(await state(p)).player.x,(await state(p)).player.y],[s.player.x,s.player.y],'não sai antes do diálogo');await capture(p,'01-encontro-carlos');
  const atlas=await p.evaluate(()=>GuardiaoFlorestaAtlas);assert.equal(Object.values(atlas.sheets).reduce((n,a)=>n+a.frames.length,0),108);
  assert.equal(await p.evaluate(()=>FlorestaMundo.nearest({x:286,y:260})),'inicio','um ponto coincidente não é desviado para outro nó');
  assert.equal(atlas.sheets['kai-mangueira'].frames.length,16);assert.equal(atlas.sheets.flora.frames.length,12);
  await p.evaluate(()=>{window.framesSeen=new Set();window.floraSeen=new Set();window.jetSeen=new Set();new MutationObserver(()=>{framesSeen.add(document.body.dataset.kaiSprite);floraSeen.add(document.body.dataset.floraState);jetSeen.add(document.body.dataset.waterFrame);}).observe(document.body,{attributes:true,attributeFilter:['data-kai-sprite','data-flora-state','data-water-frame']});});
  await intro(p);await advance(p,13);assert.equal((await state(p)).flora.mode,'ombro');assert.equal(await p.locator('#flora-talk').isVisible(),false,'balão some sozinho');assert.equal(await p.locator('#dica').isVisible(),false,'dica some sozinha');
  await capture(p,'02-flora-ombro');
  await p.keyboard.down('d');await advance(p,.3);await p.keyboard.up('d');await advance(p,.4);assert.equal((await state(p)).flora.mode,'voando');assert.ok((await state(p)).player.x>s.player.x);
  await p.locator('#pausa').click();const stopped=(await state(p)).clock;await advance(p,1);assert.equal((await state(p)).clock,stopped);await p.getByRole('button',{name:'Continuar',exact:true}).click();
  await guide(p,'agua');await p.locator('#interagir').click();assert.equal((await state(p)).released,true);
  await guide(p,'animal');await p.locator('#interagir').click();assert.equal((await state(p)).animals.filter(a=>a.stage==='seguro').length,0);assert.match(await p.locator('#fala').textContent(),/fogo/);
  for(let i=0;i<8;i++){
    if((await state(p)).water<18){await guide(p,'agua');await p.locator('#interagir').click();}
    await guide(p,'fogo');const count=(await state(p)).fires.filter(f=>f.life===0).length;await spray(p);s=await state(p);assert.ok(s.fires.filter(f=>f.life===0).length>count,'foco '+i+' apagado: '+JSON.stringify({water:s.water,player:s.player,fires:s.fires.map(f=>({id:f.id,life:f.life}))}));
    assert.ok(await p.evaluate(()=>FlorestaMundo.walkable(GuardiaoFloresta.estado().player)));
  }
  assert.equal(await p.evaluate(()=>localStorage.getItem('guardiao.mapa.progresso.v1')),null,'apagar fogo não concede vitória sozinho');
  for(let i=0;i<3;i++){
    await guide(p,'animal');await p.locator('#interagir').click();assert.equal((await state(p)).animals.filter(a=>a.stage==='tratando').length,1);await advance(p,1.8);
    assert.ok((await state(p)).animals.some(a=>a.stage==='voltando'),'animal volta caminhando ou voando, sem teleporte');
  }
  for(let i=0;i<60;i++){await advance(p,1);if((await state(p)).animals.every(a=>a.stage==='seguro'))break;}
  s=await state(p);assert.equal(s.animals.filter(a=>a.stage==='seguro').length,3);for(const a of s.animals)assert.ok(Math.hypot(a.position.x-245,a.position.y-245)<80,'animais chegaram até Carlos');
  assert.equal(s.completed,false);assert.equal(await p.locator('#voltar-carlos').isVisible(),true);await capture(p,'03-floresta-recuperada');await guide(p,'carlos');await p.locator('#interagir').click();assert.equal((await state(p)).stage,'recompensa');assert.equal(await p.locator('#vitoria').isVisible(),false,'premiação precede painel');
  await advance(p,3.5);assert.equal((await state(p)).completed,false,'a cena não concede o prêmio antes de terminar');await capture(p,'04-fragmento-colar');await advance(p,3.5);assert.equal((await state(p)).completed,true);assert.equal(await p.locator('#vitoria').isVisible(),true);
  assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('guardiao.colar.fragmentos.v1'))),[1]);assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('guardiao.mapa.progresso.v1'))),{completedFirst:true,current:2});
  assert.ok(await p.evaluate(()=>floraSeen.has('pousando')&&floraSeen.has('ombro')&&floraSeen.has('decolando')&&floraSeen.has('comemorando')),'transições reais de Flora');
  assert.ok(await p.evaluate(()=>Array.from({length:8},(_,i)=>framesSeen.has('kai-recompensa:'+i)).every(Boolean)),'Kai recebe, levanta e comemora com o cristal');
  assert.ok(await p.evaluate(()=>Array.from({length:4},(_,i)=>jetSeen.has(String(i))).every(Boolean)),'quatro sprites do jato');
  await p.getByRole('button',{name:'Continuar explorando',exact:true}).click();await advance(p,7);assert.equal((await state(p)).flora.mode,'ombro','Flora volta ao repouso após a comemoração');
  await p.reload();await ready(p);assert.equal((await state(p)).completed,true);assert.equal(await p.locator('#conversa').isVisible(),false,'não repete entrega nem perde conquista');
  await p.goto(base+'aventura.html');await p.waitForFunction(()=>window.GuardiaoMapa);assert.equal(await p.locator('.map-stage [data-phase="2"]').getAttribute('data-locked'),'false');
  console.log('PASS: abertura com Carlos, entrega real dos itens, 108 quadros, repouso e pouso/decolagem de Flora, balões temporários, oito focos, tratamento e trajeto de três animais até Carlos, prêmio levantado, comemoração, colar e mapa persistidos.');
  for(const viewport of [{width:320,height:740},{width:390,height:844},{width:844,height:390}]){
    const phone=await b.newPage({viewport,isMobile:true,hasTouch:true,reducedMotion:'reduce'});phone.on('pageerror',e=>errors.push(e.message));await phone.clock.install();await phone.goto(url);await ready(phone);
    assert.ok(await phone.locator('#conversa').evaluate(e=>e.scrollWidth<=e.clientWidth),'diálogo cabe em '+viewport.width);await intro(phone);
    for(const id of ['joystick','mangueira','interagir','mochila']){const r=await phone.locator('#'+id).boundingBox();assert.ok(r.width>=44&&r.height>=44&&r.x>=0&&r.x+r.width<=viewport.width+1);}
    const pad=await phone.locator('#joystick').boundingBox(),cdp=await phone.context().newCDPSession(phone),first=(await state(phone)).player;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:pad.x+pad.width/2,y:pad.y+pad.height/2+25}]});await advance(phone,.25);assert.ok((await state(phone)).player.y>first.y);await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
    await guide(phone,'agua');await phone.locator('#interagir').tap();await guide(phone,'fogo');
    const nozzle=await phone.locator('#mangueira').boundingBox(),old=await state(phone);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:pad.x+pad.width/2+25,y:pad.y+pad.height/2},{id:2,x:nozzle.x+nozzle.width/2,y:nozzle.y+nozzle.height/2}]});await advance(phone,1.5);const next=await state(phone);assert.ok(next.water<old.water,'dois dedos: água continua saindo');await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
    await advance(phone,.3);const cancelled=await state(phone);await advance(phone,.3);assert.equal((await state(phone)).water,cancelled.water);assert.equal((await state(phone)).player.x,cancelled.player.x);
    assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await phone.close();
  }
  const blocked=await b.newPage();await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked');}}));await blocked.clock.install();await blocked.goto(url);await ready(blocked);await intro(blocked);assert.equal((await state(blocked)).itemsGiven,true);
  const failure=await b.newPage();await failure.route('**/floresta-viva/assets/floresta-queimada.png',r=>r.abort());await failure.goto(url);await failure.getByText('Não foi possível carregar a floresta.').waitFor();await failure.waitForTimeout(500);assert.equal(await failure.getByRole('link',{name:'Toque para tentar novamente',exact:true}).isVisible(),true,'outros sprites não apagam o erro de carregamento');
  const mounted=await b.newPage();await mounted.route('**/GUARDIAO_DA_NATUREZA/**',async r=>{const u=new URL(r.request().url());u.pathname=u.pathname.replace('/GUARDIAO_DA_NATUREZA','');await r.fulfill({response:await r.fetch({url:u.href})});});await mounted.goto(new URL('/GUARDIAO_DA_NATUREZA/jogo/floresta-viva/index.html',url).href);await ready(mounted);assert.equal((await state(mounted)).ready,true);
  assert.deepEqual(errors,[]);console.log('PASS: toque em 320/390/844px, conversa acessível, joystick em profundidade, mangueira com dois dedos, cancelamento, movimento reduzido, armazenamento bloqueado, erro recuperável e caminho do Pages.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
