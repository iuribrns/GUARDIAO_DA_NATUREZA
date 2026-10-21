'use strict';
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const {chromium}=require('playwright-core');
const base=process.env.GUARDIAO_TEST_URL || 'http://127.0.0.1:5173/tela-inicial/nova-versao/';
const data=JSON.parse(readFileSync(join(__dirname,'../../../../assets/personagens/kai/animacoes/atlas.json'),'utf8'));
const ready=page=>page.waitForFunction(()=>document.querySelector('.training-kai')?.dataset.spriteStatus==='ready');
const state=page=>page.locator('.training-kai').getAttribute('data-animation');
async function open(page,url=base+'sobre.html') {
  await page.goto(url);await page.getByRole('tab',{name:'Como jogar',exact:true}).click();await ready(page);
  await page.locator('.mobile-controls').scrollIntoViewIfNeeded();
}
async function pixels(page) {
  return page.locator('.kai-animation-canvas').evaluate(canvas=>{
    const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    let hash=2166136261, count=0;
    for(let i=0;i<pixels.length;i+=4){hash=Math.imul(hash^pixels[i]^pixels[i+1]^pixels[i+2]^pixels[i+3],16777619);if(pixels[i+3]>80)count++;}
    return {hash:hash>>>0,count};
  });
}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
  const errors=[];
  function collect(page) {page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});}
  try {
    assert.equal(Object.keys(data.frames).length,24);
    assert.equal(data.animations.andando.frames.length,12);assert.equal(data.animations.pulo.frames.length,8);assert.equal(data.animations.parado.frames.length,4);
    for(const [name,frame] of Object.entries(data.frames)) {
      const image=data.images[frame.sheet],[x,y,w,h]=frame.bounds,[px,py]=frame.pivot;
      assert.ok(x>=0&&y>=0&&x+w<=image.width&&y+h<=image.height,name+' dentro da prancha');
      const left=52+(x-px)*image.scale,top=94+(y-py)*image.scale;
      assert.ok(left>=0&&top>=0&&left+w*image.scale<=104&&top+h*image.scale<=100,name+' inteiro no quadro de saída');
    }
    const page=await browser.newPage({viewport:{width:1360,height:900}});collect(page);await open(page);
    assert.deepEqual(await page.evaluate(()=>window.GuardiaoKaiAtlas),data,'dados clássicos e JSON correspondem');
    assert.ok((await pixels(page)).count>500,'personagem foi desenhado no canvas');
    await page.evaluate(()=>{
      window.quadrosKai=[];
      new MutationObserver(()=>{const id=document.querySelector('.training-kai').dataset.spriteFrame;if(id&&!window.quadrosKai.includes(id))window.quadrosKai.push(id);}).observe(document.querySelector('.training-kai'),{attributes:true,attributeFilter:['data-sprite-frame']});
    });
    await page.locator('.joystick').focus();await page.keyboard.down('ArrowRight');
    await page.waitForFunction(()=>document.querySelector('.training-kai').dataset.spriteFrame?.startsWith('andando_'));
    const first=await pixels(page);await page.waitForTimeout(170);
    assert.notEqual((await pixels(page)).hash,first.hash,'caminhada muda os pixels, não só a posição');
    await page.waitForFunction(()=>window.quadrosKai.filter(id=>id.startsWith('andando_')).length===12);
    await page.keyboard.up('ArrowRight');
    assert.equal(await state(page),'parado');
    const stopped=await page.locator('.training-kai').evaluate(node=>node.style.left);
    await page.waitForTimeout(200);assert.equal(await page.locator('.training-kai').evaluate(node=>node.style.left),stopped,'soltar o joystick para sem deslizar');
    await page.locator('.joystick').focus();await page.keyboard.down('ArrowLeft');await page.waitForTimeout(140);
    assert.equal(await page.locator('.training-kai').evaluate(node=>new DOMMatrix(getComputedStyle(node).transform).a),-1,'arte espelhada para a esquerda');
    assert.equal(await state(page),'andando');await page.keyboard.up('ArrowLeft');
    await page.getByRole('button',{name:'Pular com Kai',exact:true}).click();
    await page.waitForFunction(()=>window.quadrosKai.filter(id=>id.startsWith('pulo_')).length===8);
    await page.waitForFunction(()=>document.querySelector('.training-kai').dataset.animation==='parado');
    assert.equal(await page.locator('.training-kai').getAttribute('data-grounded'),'true');
    await page.waitForFunction(()=>window.quadrosKai.filter(id=>id.startsWith('parado_')).length===4);
    assert.equal((await page.evaluate(()=>window.quadrosKai)).length,24,'todos os 24 quadros finais aparecem no jogo');
    await page.getByRole('tab',{name:'A história',exact:true}).click();
    const hidden=await pixels(page);await page.waitForTimeout(300);assert.deepEqual(await pixels(page),hidden,'quadro oculto não continua animando');
    await page.getByRole('tab',{name:'Como jogar',exact:true}).click();
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(150);
    const quiet=await pixels(page);await page.waitForTimeout(1300);assert.deepEqual(await pixels(page),quiet,'redução pausa animação de repouso');
    await page.getByRole('button',{name:'Pular com Kai',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('.training-kai').dataset.animation==='no-ar');
    await page.waitForFunction(()=>document.querySelector('.training-kai').dataset.animation==='parado');
    assert.equal(await page.evaluate(()=>localStorage.getItem('guardiao.mapa.progresso.v1')),null);
    for(const viewport of [{width:320,height:740},{width:390,height:844},{width:844,height:390}]) {
      const phone=await browser.newPage({viewport,isMobile:true,hasTouch:true});collect(phone);await open(phone);
      assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      assert.ok((await pixels(phone)).count>500);
      await phone.getByRole('button',{name:'Pular com Kai',exact:true}).tap();
      await phone.waitForFunction(()=>document.querySelector('.training-kai').dataset.spriteFrame==='pulo_04');
      await phone.waitForFunction(()=>document.querySelector('.training-kai').dataset.grounded==='true');await phone.close();
    }
    const failed=await browser.newPage();collect(failed);
    await failed.route('**/kai-caminhada.png',route=>route.abort());await failed.goto(base+'sobre.html');
    await failed.getByRole('tab',{name:'Como jogar',exact:true}).click();
    await failed.waitForFunction(()=>document.querySelector('.training-kai').dataset.spriteStatus==='error');
    assert.match(await failed.locator('.training-status').textContent(),/sprites animados não carregaram/);
    await failed.getByRole('button',{name:'Pular com Kai',exact:true}).click();await failed.waitForFunction(()=>document.querySelector('.training-kai').dataset.grounded==='false');
    if(process.env.GUARDIAO_PRODUCTION==='true') {
      const published=await browser.newPage();collect(published);const origin=new URL(base).origin,prefix='/GUARDIAO_DA_NATUREZA';
      await published.route(origin+prefix+'/**',async route=>{const source=new URL(route.request().url());source.pathname=source.pathname.slice(prefix.length);await route.fulfill({response:await route.fetch({url:source.href})});});
      await open(published,origin+prefix+'/tela-inicial/nova-versao/sobre.html');assert.ok((await pixels(published)).count>500);
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: 24 quadros finais renderizados, 12 poses de caminhada, 8 de salto, 4 de repouso, mudança real de pixels, pés alinhados, esquerda/direita, parada, pausa, movimento reduzido, toque em 320/390/844px e falha de imagem sem bloquear controles.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
