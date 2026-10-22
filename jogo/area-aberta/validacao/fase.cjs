'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const base=process.env.GUARDIAO_TEST_URL||'http://127.0.0.1:5173/tela-inicial/nova-versao/';
const url=new URL('../../jogo/area-aberta/index.html',base).href;
const state=p=>p.evaluate(()=>GuardiaoAreaAberta.estado());
const ready=p=>p.waitForFunction(()=>document.body.dataset.gameReady==='true');
async function advance(p,seconds){await p.clock.runFor(seconds*1000);}
async function guide(p,goal){
  await p.locator('[data-goal='+goal+']').click();
  for(let n=0;n<90;n++){await advance(p,1);if(!(await state(p)).route.length)return;}
  throw new Error('Flora não conseguiu chegar ao objetivo '+goal);
}
async function spray(p){
  const box=await p.locator('#mangueira').boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();
  await advance(p,3.6);await p.mouse.up();
}
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const errors=[];
  try{
    const p=await b.newPage({viewport:{width:1280,height:720}});
    p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    await p.clock.install();await p.goto(url);await ready(p);
    assert.equal((await state(p)).fires.length,8);assert.equal((await state(p)).animals.length,3);
    await p.evaluate(()=>{window.actionFrames=new Set();new MutationObserver(()=>actionFrames.add(document.body.dataset.kaiActionFrame)).observe(document.body,{attributes:true,attributeFilter:['data-kai-action-frame']});});
    await p.locator('#mangueira').click();assert.match(await p.locator('#fala').textContent(),/água/);assert.equal((await state(p)).water,0,'mangueira não funciona sem água');
    const before=(await state(p)).player;
    await p.keyboard.down('w');await advance(p,.25);await p.keyboard.up('w');const after=(await state(p)).player;
    assert.ok(after.y<before.y,'Kai caminha no eixo de profundidade');assert.equal(after.direction,'costas');
    await p.keyboard.down('s');await advance(p,.2);await p.keyboard.up('s');assert.equal((await state(p)).player.direction,'frente');
    await p.keyboard.down('ArrowRight');await advance(p,.2);await p.keyboard.up('ArrowRight');assert.ok((await state(p)).player.x>before.x);
    await p.keyboard.down('a');await advance(p,4);await p.keyboard.up('a');assert.ok((await state(p)).player.x>540,'a margem impede atravessar o reservatório');
    assert.equal(await p.evaluate(()=>GuardiaoMundo.walkable({x:400,y:315})),false,'água do reservatório não é chão');
    // Não há API de teleporte: todo o percurso é feito pelas mesmas missões e controles do jogador.
    await guide(p,'agua');await p.locator('#interagir').click();assert.equal((await state(p)).released,true);assert.ok((await state(p)).water>99);
    await p.locator('#mochila').click();assert.equal((await state(p)).paused,true);const frozen=(await state(p)).clock;await advance(p,.5);assert.equal((await state(p)).clock,frozen);
    await p.locator('#equipar').click();assert.equal((await state(p)).equipped,true);assert.ok((await state(p)).equipping>0);await advance(p,.7);
    assert.equal(await p.evaluate(()=>Array.from({length:6},(_,i)=>actionFrames.has(String(i))).every(Boolean)),true,'seis poses de tirar mangueira da mochila');
    await guide(p,'animal');await p.locator('#interagir').click();assert.equal((await state(p)).animals.filter(a=>a.safe).length,0);assert.match(await p.locator('#fala').textContent(),/chamas/,'o fogo impede o resgate');
    for(let i=0;i<8;i++){
      await guide(p,'fogo');const count=(await state(p)).fires.filter(f=>f.life===0).length;
      await spray(p);const next=await state(p);assert.ok(next.fires.filter(f=>f.life===0).length>count,'apagar incêndio '+i);
      assert.ok(await p.evaluate(()=>GuardiaoMundo.walkable(GuardiaoAreaAberta.estado().player)),'colisão mantém Kai na trilha');
      if(next.water<15&&next.fires.some(f=>f.life>0)){await guide(p,'agua');await p.locator('#interagir').click();}
    }
    for(let i=0;i<3;i++){await guide(p,'animal');await p.locator('#interagir').click();await advance(p,1.3);assert.equal((await state(p)).animals.filter(a=>a.safe).length,i+1);}
    assert.equal((await state(p)).completed,true);assert.equal(await p.locator('#vitoria').isVisible(),true);
    assert.equal(await p.evaluate(()=>Array.from({length:12},(_,i)=>actionFrames.has('resgate_'+i)).every(Boolean)),true,'doze poses do kit de resgate');
    assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('guardiao.mapa.progresso.v1'))),{completedFirst:true,current:2});
    await p.reload();await ready(p);assert.equal((await state(p)).completed,true,'missões e água persistem');
    await p.goto(base+'aventura.html');await p.waitForFunction(()=>window.GuardiaoMapa);assert.equal(await p.locator('.map-stage [data-phase="2"]').getAttribute('data-locked'),'false');
    await p.locator('.map-stage [data-phase="2"]').click();assert.equal(await p.locator('[data-map-action="start"]').isDisabled(),false,'a campanha nova libera o rio depois de concluir a floresta');
    console.log('PASS: entrar pelo mapa, caminhar nos dois eixos, tirar mangueira da mochila, pausa, registro, oito incêndios reais, três resgates, Flora guia por trilhas, vitória e progresso persistido no mapa.');
    for(const viewport of [{width:320,height:740},{width:390,height:844},{width:844,height:390}]){
      const phone=await b.newPage({viewport,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
      phone.on('pageerror',e=>errors.push(e.message));await phone.clock.install();await phone.goto(url);await ready(phone);
      assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      for(const id of ['joystick','mangueira','interagir','mochila']){const box=await phone.locator('#'+id).boundingBox();assert.ok(box.width>=44&&box.height>=44);assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=viewport.width+1&&box.y+box.height<=viewport.height+1);}
      const box=await phone.locator('#joystick').boundingBox();
      // Touch real via CDP conserva captura e permite multitouch simultâneo.
      const cdp=await phone.context().newCDPSession(phone);
      const initial=(await state(phone)).player;
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:box.x+box.width/2,y:box.y+box.height/2-28}]});await advance(phone,.3);
      const moved=(await state(phone)).player;assert.ok(moved.y<initial.y,'joystick vertical em '+viewport.width);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await advance(phone,.2);const stopped=(await state(phone)).player;await advance(phone,.2);assert.equal((await state(phone)).player.y,stopped.y,'soltar o toque para Kai');
      await phone.locator('#mochila').tap();assert.equal(await phone.locator('#inventario').isVisible(),true);await phone.getByRole('button',{name:'Voltar à floresta',exact:true}).tap();
      if(viewport.width===390){
        await guide(phone,'agua');await phone.locator('#interagir').tap();await phone.locator('#mochila').tap();await phone.locator('#equipar').tap();await advance(phone,.7);await guide(phone,'fogo');
        const pad=await phone.locator('#joystick').boundingBox(),nozzle=await phone.locator('#mangueira').boundingBox(),beforeTouch=await state(phone);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:pad.x+pad.width/2+25,y:pad.y+pad.height/2},{id:2,x:nozzle.x+nozzle.width/2,y:nozzle.y+nozzle.height/2}]});await advance(phone,.8);
        const afterTouch=await state(phone);assert.ok(afterTouch.player.x>beforeTouch.player.x,'andar enquanto usa mangueira');assert.ok(afterTouch.fires.reduce((s,f)=>s+f.life,0)<beforeTouch.fires.reduce((s,f)=>s+f.life,0),'segundo dedo apaga o fogo');
        await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await advance(phone,.2);const cancelled=await state(phone);await advance(phone,.3);
        assert.equal((await state(phone)).player.x,cancelled.player.x);assert.deepEqual((await state(phone)).fires.map(f=>f.life),cancelled.fires.map(f=>f.life),'cancelamento solta a mangueira');
      }
      await phone.close();
    }
    const blocked=await b.newPage();await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked');}}));
    await blocked.clock.install();await blocked.goto(url);await ready(blocked);await guide(blocked,'agua');await blocked.locator('#interagir').click();assert.equal((await state(blocked)).released,true);
    const failure=await b.newPage();await failure.route('**/area-aberta/assets/floresta.png',r=>r.abort());await failure.goto(url);await failure.getByText('Não foi possível carregar a floresta.').waitFor();
    const mounted=await b.newPage();await mounted.route('**/GUARDIAO_DA_NATUREZA/**',async r=>{const u=new URL(r.request().url());u.pathname=u.pathname.replace('/GUARDIAO_DA_NATUREZA','');await r.fulfill({response:await r.fetch({url:u.href})});});
    await mounted.goto(new URL('/GUARDIAO_DA_NATUREZA/jogo/area-aberta/index.html',url).href);await ready(mounted);assert.equal((await state(mounted)).ready,true,'sprites e cenário carregam no caminho do Pages');
    assert.deepEqual(errors,[]);
    console.log('PASS: joystick com toque e eixo vertical, botões de 44px, retrato/paisagem em 320/390/844px, movimento reduzido, armazenamento bloqueado e erro de carregamento recuperável.');
  }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
