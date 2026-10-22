'use strict';
const assert = require('node:assert/strict');
const {chromium} = require('playwright-core');
const base = process.env.GUARDIAO_TEST_URL || 'http://127.0.0.1:5173/tela-inicial/nova-versao/';
// O pulo foi preservado no laboratório; a campanha atual explora áreas abertas.
const trainingURL=new URL('../../desenvolvimento/modelos/legado/treino.html',base).href;
const ready = page => page.waitForFunction(()=>document.querySelector('[data-guardiao-controles]')?.dataset.controlsReady === 'true' && document.querySelector('[data-control-demo]')?.dataset.demoReady === 'true' && !document.querySelector('.navigation-veil'));
const x = page => page.locator('.training-kai').evaluate(node=>parseFloat(node.style.left));
(async()=>{
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
  const errors=[];
  const collect=page=>{
    page.on('pageerror',error=>errors.push(error.message));
    page.on('response',response=>{if(response.status()>=400)errors.push(response.status()+' '+response.url());});
  };
  try {
    const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});collect(page);
    await page.goto(trainingURL);await ready(page);
    await page.getByRole('tab',{name:'Como jogar',exact:true}).tap();
    await page.locator('.mobile-controls').scrollIntoViewIfNeeded();
    assert.ok(await page.locator('.control-jump img').evaluate(node=>node.complete && node.naturalWidth>0),'arte de Kai pulando carregada');
    const stick=await page.locator('.joystick').boundingBox(), jump=await page.locator('.control-jump').boundingBox();
    const start={x:stick.x+stick.width/2,y:stick.y+stick.height/2,id:1};
    const right={...start,x:start.x+30};const second={x:jump.x+jump.width/2,y:jump.y+jump.height/2,id:2};
    const touch=await page.context().newCDPSession(page);
    const before=await x(page);
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
    await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[right]});
    await page.waitForTimeout(160);
    assert.ok(await x(page)>before+5,'joystick move Kai para a direita');
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[right,second]});
    await page.waitForFunction(()=>document.querySelector('.training-kai').dataset.grounded==='false');
    assert.ok(Number(await page.locator('.joystick').getAttribute('aria-valuenow'))>80,'primeiro dedo continua segurando o joystick');
    assert.equal(await page.locator('.control-jump').evaluate(node=>node.classList.contains('is-held')),true);
    const airborne=await x(page);await page.waitForTimeout(80);
    assert.ok(await x(page)>airborne,'Kai anda e pula simultaneamente com dois dedos');
    await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[second]});
    assert.equal(await page.locator('.control-jump').evaluate(node=>node.classList.contains('is-held')),false);
    assert.ok(Number(await page.locator('.joystick').getAttribute('aria-valuenow'))>80,'soltar pulo mantém movimento do outro dedo');
    await touch.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
    assert.equal(await page.locator('.joystick').getAttribute('aria-valuenow'),'0');
    const stopped=await x(page);await page.waitForTimeout(180);assert.equal(await x(page),stopped,'cancelar toque não deixa Kai andando');
    await page.waitForFunction(()=>document.querySelector('.training-kai').dataset.grounded==='true');
    await page.locator('.joystick').focus();await page.keyboard.down('ArrowLeft');await page.waitForTimeout(140);await page.keyboard.up('ArrowLeft');
    assert.ok(await x(page)<stopped,'alternativa de teclado move para a esquerda');
    assert.equal(await page.locator('.joystick').getAttribute('aria-valuenow'),'0');
    await page.getByRole('button',{name:'Pular com Kai',exact:true}).focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.querySelector('.training-kai').dataset.grounded==='false');
    await page.getByRole('tab',{name:'A história',exact:true}).tap();
    assert.equal(await page.locator('.training-kai').getAttribute('data-grounded'),'true','trocar de aba neutraliza o treino');
    await page.getByRole('tab',{name:'Como jogar',exact:true}).tap();
    await page.getByRole('button',{name:'Usar equipamento ou interagir',exact:true}).tap();
    assert.match(await page.locator('.training-status').textContent(),/botão de ação/);
    assert.equal(await page.evaluate(()=>localStorage.getItem('guardiao.mapa.progresso.v1')),null,'treino não altera a campanha');
    for(const viewport of [{width:320,height:740},{width:390,height:844},{width:844,height:390}]) {
      await page.setViewportSize(viewport);await page.locator('.mobile-controls').scrollIntoViewIfNeeded();
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'sem overflow em '+viewport.width);
      for(const selector of ['.joystick','.control-jump','.control-use']) {const rect=await page.locator(selector).boundingBox();assert.ok(rect.width>=44 && rect.height>=44);}
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.getByRole('button',{name:'Pular com Kai',exact:true}).tap();
    await page.waitForFunction(()=>document.querySelector('.training-kai').dataset.grounded==='false');
    await page.waitForFunction(()=>document.querySelector('.training-kai').dataset.grounded==='true');
    if(process.env.GUARDIAO_PRODUCTION==='true') {
      const published=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});collect(published);
      const origin=new URL(base).origin, prefix='/GUARDIAO_DA_NATUREZA';
      await published.route(origin+prefix+'/**',async route=>{
        const source=new URL(route.request().url());source.pathname=source.pathname.slice(prefix.length)||'/';
        await route.fulfill({response:await route.fetch({url:source.href})});
      });
      await published.goto(origin+prefix+'/');
      await published.waitForURL('**/GUARDIAO_DA_NATUREZA/tela-inicial/nova-versao/index.html');
      await published.goto(origin+prefix+'/desenvolvimento/modelos/legado/treino.html');
      await published.waitForURL('**/treino.html');await ready(published);
      await published.getByRole('tab',{name:'Como jogar',exact:true}).tap();
      assert.ok(await published.locator('.control-jump img').evaluate(node=>node.complete && node.naturalWidth>0),'arte carrega sob o caminho do Pages');
      await published.getByRole('button',{name:'Pular com Kai',exact:true}).tap();
      await published.waitForFunction(()=>document.querySelector('.training-kai').dataset.grounded==='false');
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: joystick real, pulo ilustrado, dois dedos simultâneos, cancelamento, teclado, troca de aba, toque em 320/390/844px e entrada/caminhos em subpasta do Pages na produção.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
