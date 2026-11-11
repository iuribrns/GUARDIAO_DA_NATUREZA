'use strict';
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { chromium } = require('playwright-core');
const base = process.env.GUARDIAO_TEST_URL || 'http://127.0.0.1:5173/tela-inicial/nova-versao/';
const phases = JSON.parse(readFileSync(require('node:path').join(__dirname, '../conteudo-das-fases.json'), 'utf8')).fases;
const ready = page => page.waitForFunction(() => window.GuardiaoMapa && window.GuardiaoPaineis);
const closed = page => page.waitForFunction(() => !document.getElementById('phase-dialog').open);
const clickPhase = (page, number, list = false) => page.locator((list ? '.map-list' : '.map-stage') + ' [data-phase="' + number + '"]').click();
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const errors = [];
  function collect(page) {
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
  }
  try {
    const page = await browser.newPage({ viewport: { width: 1360, height: 900 } }); collect(page);
    await page.goto(base + 'aventura.html'); await ready(page);
    assert.deepEqual(await page.evaluate(() => window.GuardiaoFases), phases, 'conteúdo de todos os painéis corresponde ao ZIP');
    for (const phase of phases) {
      await clickPhase(page, phase.id);
      assert.equal(await page.locator('#phase-dialog').getAttribute('data-phase'), String(phase.id));
      for (const [id, value] of Object.entries({ 'phase-objective': phase.situacao, 'phase-npc': phase.npc, 'phase-profession': phase.profissao, 'phase-equipment': phase.equipamento, 'phase-reward': phase.recompensa, 'phase-duration': phase.duracao_estimada })) {
        assert.equal(await page.locator('#' + id).textContent(), value, id + ' da fase ' + phase.id);
      }
      assert.deepEqual(await page.locator('#phase-goals li').allTextContents(), phase.objetivos);
      assert.equal(await page.locator('[data-map-action="start"]').isDisabled(), phase.id !== 1, 'somente a floresta tem fase jogável');
      if (phase.id > 1) assert.match(await page.locator('#phase-state').textContent(), /Conclua a fase/);
      assert.equal(await page.locator('.map-stage').getAttribute('data-current-phase'), '1', 'consultar região bloqueada não muda Kai');
      const original = await page.locator('.npc-sprite').getAttribute('viewBox');
      await page.waitForFunction(box => document.querySelector('.npc-sprite').getAttribute('viewBox') !== box, original);
      await page.keyboard.press('Escape'); await closed(page);
    }
    // Região inteira responde ao clique, além das placas de madeira.
    await page.locator('[data-region="4"]').dispatchEvent('click');
    assert.equal(await page.locator('#phase-dialog').getAttribute('data-phase'), '4');
    await page.getByRole('button', { name: '← Voltar ao mapa', exact: true }).click(); await closed(page);
    await clickPhase(page, 2); await page.keyboard.press('Escape'); await closed(page);
    await clickPhase(page, 2);
    assert.equal(await page.locator('#phase-npc').textContent(), 'Seu Antônio', 'reabrir fase reconstrói o painel');
    await page.keyboard.press('Escape'); await closed(page);
    // Animações de ambiente avançam de verdade e pausam sob o painel.
    const river = page.locator('.map-current').first();
    const offset = await river.evaluate(node => getComputedStyle(node).strokeDashoffset);
    await page.waitForTimeout(180);
    assert.notEqual(await river.evaluate(node => getComputedStyle(node).strokeDashoffset), offset);
    await clickPhase(page, 1);
    assert.equal(await river.evaluate(node => getComputedStyle(node).animationPlayState), 'paused');
    await page.keyboard.press('Escape'); await closed(page);
    assert.equal(await river.evaluate(node => getComputedStyle(node).animationPlayState), 'running');
    // Zoom, arraste e limite da câmera não abrem um painel acidentalmente.
    await page.getByRole('button', { name: 'Ampliar mapa', exact: true }).click();
    await page.getByRole('button', { name: 'Ampliar mapa', exact: true }).click();
    assert.equal(await page.locator('#map-zoom-level').textContent(), '200%');
    const box = await page.locator('.map-stage').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 55, { steps: 12 }); await page.mouse.up();
    assert.equal(await page.locator('#phase-dialog').isVisible(), false);
    assert.notEqual(await page.locator('.map-world').evaluate(node => node.style.getPropertyValue('--pan-x')), '0px');
    await page.getByRole('button', { name: 'Ver ilha inteira' }).click();
    assert.equal(await page.locator('#map-zoom-level').textContent(), '100%');
    assert.equal(await page.locator('.map-world').evaluate(node => node.style.getPropertyValue('--pan-x')), '0px');
    // Sem animações, mas com todos os fluxos disponíveis: preferência do sistema.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await clickPhase(page, 5);
    const npc = await page.locator('.npc-sprite').getAttribute('viewBox');
    await page.waitForTimeout(1450);
    assert.equal(await page.locator('.npc-sprite').getAttribute('viewBox'), npc);
    assert.equal(await page.locator('#phase-dialog').evaluate(node => getComputedStyle(node).animationName), 'none');
    assert.equal(await river.evaluate(node => getComputedStyle(node).animationName), 'none');
    await page.keyboard.press('Escape'); await closed(page);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    // Preferência própria do jogo também impede poses e movimentos.
    await page.evaluate(() => localStorage.setItem('guardiao.horizonte.preferences.v1', JSON.stringify({ reduceMotion: true })));
    await page.reload(); await ready(page);
    await page.waitForFunction(() => document.body.classList.contains('reduce-motion'));
    await clickPhase(page, 6);
    assert.equal(await page.locator('#phase-dialog').getAttribute('data-pose'), '0');
    assert.equal(await page.locator('#phase-dialog').evaluate(node => getComputedStyle(node).animationName), 'none');
    await page.keyboard.press('Escape'); await closed(page);

    for (const viewport of [{ width:320,height:740 }, { width:390,height:844 }, { width:844,height:390 }]) {
      const phone = await browser.newPage({ viewport, isMobile:true, hasTouch:true }); collect(phone);
      await phone.goto(base + 'aventura.html'); await ready(phone);
      for (const phase of phases) {
        await phone.locator((viewport.width <= 650 ? '.map-list' : '.map-stage') + ' [data-phase="' + phase.id + '"]').tap();
        assert.equal(await phone.locator('#phase-npc').textContent(), phase.npc);
        assert.ok(await phone.locator('#phase-dialog').evaluate(node => node.scrollWidth <= node.clientWidth), 'painel sem corte horizontal em ' + viewport.width);
        await phone.locator('#phase-duration').scrollIntoViewIfNeeded();
        assert.equal(await phone.locator('#phase-duration').isVisible(), true);
        await phone.getByRole('button', { name:'← Voltar ao mapa', exact:true }).tap(); await closed(phone);
        assert.equal(await phone.locator('#phase-dialog').isVisible(), false);
      }
      assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'página sem overflow em ' + viewport.width);
      await phone.close();
    }
    assert.deepEqual(errors, []);
    console.log('PASS: seis painéis com dados completos do ZIP, reabertura, bloqueios, poses animadas, regiões clicáveis, correntes em movimento, pausa, zoom/arraste, movimento reduzido e toque em 320/390/844px.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
