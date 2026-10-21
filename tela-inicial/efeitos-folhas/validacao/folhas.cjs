'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const base = process.env.GUARDIAO_TEST_URL || 'http://127.0.0.1:8008/tela-inicial/nova-versao/';
const home = `${base}index.html`;
const ready = page => page.waitForFunction(() => !document.querySelector('.navigation-veil'));

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    const errors = [];
    for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
      const mobile = viewport.width < 651;
      const page = await browser.newPage({ viewport, isMobile: mobile, hasTouch: mobile });
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
      await page.addInitScript(() => {
        document.addEventListener('animationend', event => {
          if (event.animationName === 'leaf-burst' && event.target.closest('.navigation-veil')) {
            const ended = Number(sessionStorage.getItem('guardiao.test.leaves-ended') || '0');
            sessionStorage.setItem('guardiao.test.leaves-ended', String(ended + 1));
          }
        }, true);
      });
      await page.goto(home);
      await page.getByRole('link', { name: 'Sobre o jogo', exact: true }).click();
      await page.waitForSelector('.navigation-veil.is-ready');
      const leaves = page.locator('.navigation-veil .transition-burst');
      assert.equal(await leaves.count(), mobile ? 16 : 28);
      const sizes = await leaves.evaluateAll(nodes => nodes.map(node => parseFloat(getComputedStyle(node).width)));
      assert.ok(sizes.every(size => size >= (mobile ? 40 : 56) && size < (mobile ? 76 : 112)));
      await page.waitForTimeout(220);
      const before = await leaves.first().boundingBox();
      assert.ok(Number(await leaves.first().evaluate(node => getComputedStyle(node).opacity)) >= .95, 'folhas permanecem opacas durante o efeito');
      assert.match(await leaves.first().evaluate(node => getComputedStyle(node).filter), /brightness\(1.25\)/);
      assert.equal(await leaves.first().evaluate(node => getComputedStyle(node).animationDuration), '1.3s');
      assert.ok(await page.locator('.transition-message').evaluate(node => Number(getComputedStyle(node).zIndex) > 2), 'mensagem fica acima das folhas');
      await page.waitForTimeout(180);
      const after = await leaves.first().boundingBox();
      assert.ok(Math.abs(after.x - before.x) > 2, 'posição das folhas muda de verdade');
      await page.screenshot({ path: mobile ? '/workspace/folhas-transicao-celular.png' : '/workspace/folhas-transicao-computador.png' });
      await page.waitForURL('**/sobre.html');
      assert.equal(await page.evaluate(() => Number(sessionStorage.getItem('guardiao.test.leaves-ended'))), mobile ? 16 : 28, 'todas as folhas terminam antes da troca de página');
      await ready(page);
      const arrival = page.locator('.transition-leaf-layer');
      assert.equal(await arrival.count(), 1, 'rajada da chegada continua após a abertura do círculo');
      assert.equal(await arrival.getAttribute('aria-hidden'), 'true');
      assert.equal(await arrival.evaluate(node => getComputedStyle(node).pointerEvents), 'none');
      assert.equal(await arrival.locator('.transition-burst').count(), mobile ? 16 : 28);
      await page.getByRole('tab', { name: 'Como jogar' }).click();
      assert.equal(await page.locator('#controls').isVisible(), true, 'botões funcionam enquanto as folhas passam');
      await arrival.waitFor({ state: 'detached' });
      assert.equal(await page.locator('.transition-burst').count(), 0, 'camada temporária é removida ao final');
      await page.close();
    }
    const reduced = await browser.newPage({ reducedMotion: 'reduce' });
    await reduced.goto(home);
    await reduced.getByRole('link', { name: 'Abrir configurações' }).click();
    await reduced.waitForURL('**/configuracoes.html'); await ready(reduced);
    assert.equal(await reduced.locator('.transition-burst,.transition-leaf-layer').count(), 0);
    await reduced.close();

    const dynamic = await browser.newPage();
    await dynamic.goto(home);
    await dynamic.getByRole('link', { name: 'Sobre o jogo', exact: true }).click();
    await dynamic.waitForURL('**/sobre.html'); await ready(dynamic);
    assert.equal(await dynamic.locator('.transition-leaf-layer').count(), 1);
    await dynamic.emulateMedia({ reducedMotion: 'reduce' });
    await dynamic.waitForFunction(() => !document.querySelector('.transition-leaf-layer'));
    assert.equal(await dynamic.locator('.transition-burst').count(), 0, 'pedido de movimento reduzido remove a rajada em andamento');
    await dynamic.close();
    assert.deepEqual(errors, []);
    console.log('PASS: 16/28 folhas, tamanho e contraste, movimento real, animação completa na saída, folhas inteiras na chegada, mensagem legível, botões sem bloqueio, limpeza e movimento reduzido.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
