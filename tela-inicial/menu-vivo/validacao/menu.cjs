'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const base = process.env.GUARDIAO_TEST_URL || 'http://127.0.0.1:5173/tela-inicial/nova-versao/';
const ready = page => page.waitForFunction(() => window.GuardiaoFolhas && (document.body.dataset.page==='settings'||document.body.dataset.menuCharactersReady==='true'||document.querySelector('.camp-flora-sprite')?.dataset.pose === '0') && !document.querySelector('.navigation-veil'));
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args:['--no-sandbox'] });
  const errors = [];
  function collect(page) {
    page.on('pageerror',error => errors.push(error.message));
    page.on('response',response => { if (response.status() >= 400) errors.push(response.status()+' '+response.url()); });
  }
  try {
    const page = await browser.newPage({ viewport:{width:1360,height:900} }); collect(page);
    await page.goto(base+'index.html'); await ready(page);
    assert.equal(await page.locator('#home-kai').count(),1,'personagens do início usam quadros completos');
    assert.equal(await page.locator('.living-leaf').count(),20);
    assert.equal(await page.locator('.living-leaf svg image').count(),20);
    const leaf = page.locator('.living-leaf').nth(6);
    const before = await leaf.evaluate(node => ({fall:getComputedStyle(node).transform,sway:getComputedStyle(node.querySelector('.leaf-sway')).transform,turn:getComputedStyle(node.querySelector('.leaf-turn')).transform}));
    await page.waitForTimeout(250);
    const after = await leaf.evaluate(node => ({fall:getComputedStyle(node).transform,sway:getComputedStyle(node.querySelector('.leaf-sway')).transform,turn:getComputedStyle(node.querySelector('.leaf-turn')).transform}));
    for (const key of ['fall','sway','turn']) assert.notEqual(before[key],after[key],key+' se move de verdade');
    assert.equal(await leaf.locator('.leaf-sway').evaluate(node=>getComputedStyle(node).backgroundImage),'none','sem textura duplicada sobre o recorte');
    await page.getByRole('button',{name:'Conversar com Flora',exact:true}).hover();
    await page.waitForFunction(()=>document.querySelector('#home-flora').dataset.mode === 'voando');
    await page.getByRole('button',{name:'Conversar com Flora',exact:true}).click();
    assert.match(await page.locator('.camp-speech').textContent(),/^Flora:/);
    await page.waitForFunction(()=>Number(document.querySelector('#home-flora').dataset.frame) < 8);
    await page.waitForFunction(()=>document.querySelector('#home-flora').dataset.mode === 'ombro');
    await page.getByRole('button',{name:'Conversar com Kai',exact:true}).focus(); await page.keyboard.press('Enter');
    assert.match(await page.locator('.camp-speech').textContent(),/^Kai:/);
    assert.match(await page.locator('.camp-speech').textContent(),/^Kai:/,'clique de teclado também tem resposta');
    await page.waitForTimeout(700);
    assert.equal(await page.locator('.menu-click-ripple,.menu-click-layer').count(),0,'efeito e camada temporários são removidos');
    await page.goto(base+'configuracoes.html'); await ready(page);
    await page.locator('#musicVolume').fill('27');
    assert.equal(await page.locator('#musicVolumeValue').textContent(),'27%');
    assert.equal(await page.locator('#musicVolume').evaluate(node=>node.style.getPropertyValue('--volume')),'27%');
    await page.locator('#fallingLeaves').uncheck(); assert.equal(await page.locator('.living-leaves').isVisible(),false);
    await page.locator('#fallingLeaves').check(); assert.equal(await page.locator('.living-leaves').isVisible(),true);
    await page.locator('#reduceMotion').check();
    assert.equal(await page.locator('.living-leaves').isVisible(),false);
    assert.equal(await page.locator('.settings-companion img').evaluate(node=>getComputedStyle(node).animationName),'none');
    assert.equal(await page.locator('[data-companion]').count(),0,'configurações contém ajustes; explicações e personagens interativos estão no diário');
    await page.reload();await ready(page);assert.equal(await page.locator('#reduceMotion').isChecked(),true);assert.equal(await page.locator('#musicVolume').inputValue(),'27');
    await page.locator('#reset').click(); assert.equal(await page.locator('#reduceMotion').isChecked(),false);
    await page.goto(base+'sobre.html'); await ready(page);
    await page.getByRole('tab',{name:'Sua missão',exact:true}).click();
    await page.getByRole('button',{name:'Fazer o colar brilhar',exact:true}).click();
    assert.match(await page.locator('.camp-speech').textContent(),/Cinco peças/);
    await page.waitForFunction(()=>gsap.getTweensOf(document.querySelector('.necklace-sprite')).length > 0);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>gsap.getTweensOf(document.querySelector('.necklace-sprite')).length === 0);
    assert.equal(await page.locator('.living-leaves').isVisible(),false);
    assert.equal(await page.evaluate(()=>localStorage.getItem('guardiao.mapa.progresso.v1')),null,'interações do menu não inventam progresso');

    for (const viewport of [{width:320,height:740},{width:390,height:844},{width:844,height:390}]) {
      const phone = await browser.newPage({viewport,isMobile:true,hasTouch:true}); collect(phone);
      for (const file of ['index','configuracoes','sobre']) {
        await phone.goto(base+file+'.html'); await ready(phone);
        assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),'sem overflow em '+file+'/'+viewport.width);
        for (const button of await phone.locator('[data-companion]').all()) {
          const rect=await button.boundingBox(); assert.ok(rect.width>=44 && rect.height>=44,'alvo de toque confortável');
        }
        if(file!=='configuracoes'){await phone.getByRole('button',{name:'Conversar com Flora',exact:true}).tap();assert.match(await phone.locator('.camp-speech').textContent(),/^Flora:/);}
        if (file==='configuracoes') {
          await phone.locator('#largeText').check();
          assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'texto maior sem corte');
          await phone.locator('#musicVolume').fill('77');
          await phone.reload(); await ready(phone);
          assert.equal(await phone.locator('#musicVolume').inputValue(),'77');
        }
        if (file==='sobre') {
          for (const name of ['Como jogar','Sua missão','A história']) {
            await phone.getByRole('tab',{name,exact:true}).tap();
            assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'aba '+name+' sem corte');
          }
        }
      }
      await phone.close();
    }
    const fallback=await browser.newPage(); collect(fallback);
    await fallback.route('**/gsap-3.15.0.min.js',route=>route.abort());
    await fallback.goto(base+'index.html'); await ready(fallback);
    await fallback.getByRole('button',{name:'Conversar com Flora',exact:true}).click();
    assert.match(await fallback.locator('.camp-speech').textContent(),/^Flora:/,'falha da biblioteca não bloqueia a conversa');
    assert.deepEqual(errors,[]);
    console.log('PASS: folhas com queda/balanço/giro reais, hover, toque, teclado, poses de Kai e Flora, cliques, preferências, colar, redução durante a animação, 320/390/844px e funcionamento sem GSAP.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
