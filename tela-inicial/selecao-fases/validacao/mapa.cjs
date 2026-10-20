'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const base = process.env.GUARDIAO_TEST_URL || 'http://127.0.0.1:8005/tela-inicial/nova-versao/';
const mapURL = `${base}aventura.html`;
const ready = page => page.waitForFunction(() => window.GuardiaoMapa && !document.querySelector('.map-stage').hasAttribute('aria-busy'));
const phase = (page, number) => page.locator(`.map-stage [data-phase="${number}"]`);

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1672, height: 941 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto(mapURL); await ready(page);
    assert.equal(await page.locator('.map-art').first().evaluate(image => image.naturalWidth), 1672);
    await page.locator('.map-stage').screenshot({ path: '/workspace/mapa-inicial-implementado.png' });
    assert.equal(await phase(page, 1).getAttribute('aria-current'), 'step');
    for (let number = 2; number <= 6; number++) assert.equal(await phase(page, number).getAttribute('aria-disabled'), 'true');
    await phase(page, 2).dispatchEvent('click');
    assert.equal(await page.locator('#phase-dialog').isVisible(), true);
    assert.match(await page.locator('#phase-state').textContent(), /Conclua a fase 1/);
    assert.equal(await page.locator('.map-stage').getAttribute('data-current-phase'), '1');
    await page.keyboard.press('Escape');
    await phase(page, 1).click();
    assert.match(await page.locator('#phase-state').textContent(), /desenvolvimento/);
    await page.getByRole('button', { name: 'Ver recuperação da floresta' }).click();
    await page.waitForFunction(() => {
      const opacity = Number(getComputedStyle(document.querySelector('.map-restored')).opacity);
      return opacity > .15 && opacity < .85;
    });
    await page.locator('.map-stage').screenshot({ path: '/workspace/mapa-recuperacao-em-andamento.png' });
    await ready(page);
    assert.equal(await page.locator('.map-stage').getAttribute('data-current-phase'), '2');
    assert.equal(await phase(page, 2).getAttribute('aria-disabled'), 'false');
    assert.equal(await phase(page, 3).getAttribute('aria-disabled'), 'true');
    assert.deepEqual(await page.evaluate(() => GuardiaoMapa.obterProgresso()), { completedFirst: false, current: 1, preview: true });
    assert.equal(await page.evaluate(() => localStorage.getItem('guardiao.mapa.progresso.v1')), null, 'prévia não registra conclusão real');
    await phase(page, 2).click();
    await page.getByRole('button', { name: 'Voltar ao progresso salvo' }).click();
    assert.equal(await page.locator('.map-stage').getAttribute('data-current-phase'), '1');
    assert.equal(await phase(page, 2).getAttribute('aria-disabled'), 'true');
    // A futura fase jogável chama a mesma recuperação com persistência real.
    assert.deepEqual(await page.evaluate(() => GuardiaoMapa.concluirFase(1)), { completedFirst: true, current: 2, preview: false });
    await page.reload(); await ready(page);
    assert.equal(await page.locator('.map-stage').getAttribute('data-current-phase'), '2');
    await page.mouse.move(0, 0);
    await page.locator('.map-stage').screenshot({ path: '/workspace/mapa-restaurado-implementado.png' });
    await phase(page, 1).click();
    assert.equal(await page.locator('.map-revisit').isVisible(), true);
    assert.equal(await page.locator('.map-stage').getAttribute('data-current-phase'), '1');
    assert.equal(await page.locator('.map-restored').evaluate(image => Number(getComputedStyle(image).opacity)), 1, 'revisita mantém a floresta verde');
    await page.keyboard.press('Escape'); await page.mouse.move(0, 0);
    await page.locator('.map-stage').screenshot({ path: '/workspace/mapa-revisita-floresta.png' });
    await phase(page, 2).click(); await page.keyboard.press('Escape');
    assert.equal(await page.locator('.map-revisit').isVisible(), false);
    assert.equal(await page.evaluate(() => GuardiaoMapa.concluirFase(2).then(() => false, error => error instanceof RangeError)), true);

    for (const viewport of [{ width: 320, height: 740 }, { width: 390, height: 844 }, { width: 667, height: 375 }]) {
      await page.setViewportSize(viewport); await page.reload(); await ready(page);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `mapa sem overflow em ${viewport.width}px`);
      for (const button of await page.locator('.map-stage .map-hotspot').all()) {
        const box = await button.boundingBox();
        assert.ok(box.width >= 44 && box.height >= 44, 'área de toque de pelo menos 44px');
      }
      assert.equal(await page.locator('.map-list').isVisible(), viewport.width <= 650);
    }
    await page.setViewportSize({ width: 390, height: 844 }); await page.reload(); await ready(page);
    await page.locator('.map-restored').evaluate(image => image.decode());
    await page.screenshot({ path: '/workspace/selecao-fases-celular.png', fullPage: true });
    await page.getByRole('link', { name: 'Voltar à tela inicial' }).click();
    await page.waitForURL('**/index.html'); await page.waitForFunction(() => !document.querySelector('.navigation-veil'));
    await page.getByRole('link', { name: 'Jogar', exact: true }).click();
    await page.waitForURL('**/aventura.html'); await ready(page);
    await page.waitForFunction(() => !document.querySelector('.navigation-veil'));
    await page.goto(`${base}sobre.html`);
    await page.getByRole('tab', { name: 'Sua missão' }).click();
    assert.equal(await page.locator('.necklace').count(), 0);
    const necklace = page.getByRole('img', { name: /^Colar remodelado completo/ });
    assert.equal(await necklace.isVisible(), true);
    assert.match(await necklace.evaluate(element => getComputedStyle(element).backgroundImage), /01_progressao.png/);
    await page.waitForTimeout(350); await page.screenshot({ path: '/workspace/colar-remodelado-implementado.png', fullPage: true });
    assert.deepEqual(errors, []);

    const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await reduced.goto(mapURL); await ready(reduced);
    await phase(reduced, 1).tap();
    await reduced.getByRole('button', { name: 'Ver recuperação da floresta' }).tap();
    await reduced.waitForFunction(() => Number(getComputedStyle(document.querySelector('.map-restored')).opacity) > 0);
    assert.equal(await reduced.locator('.map-restored').evaluate(element => getComputedStyle(element).transitionDuration), '0.24s');
    await ready(reduced);
    assert.equal(await phase(reduced, 2).getAttribute('aria-disabled'), 'false');

    const blocked = await browser.newPage();
    await blocked.addInitScript(() => {
      for (const key of ['localStorage', 'sessionStorage']) Object.defineProperty(window, key, { get() { throw new DOMException('blocked'); } });
    });
    await blocked.goto(mapURL); await ready(blocked);
    await blocked.evaluate(() => GuardiaoMapa.concluirFase(1));
    assert.equal(await blocked.locator('.map-stage').getAttribute('data-current-phase'), '2');
    assert.match(await blocked.locator('.map-error').textContent(), /não permitiu salvá-lo/);

    const failure = await browser.newPage();
    await failure.route('**/mapa-apos-fase-1.png', route => route.abort());
    await failure.goto(mapURL); await ready(failure);
    assert.equal(await failure.evaluate(() => GuardiaoMapa.concluirFase(1).then(() => false, () => true)), true);
    assert.equal(await phase(failure, 2).getAttribute('aria-disabled'), 'true');
    assert.equal(await failure.locator('.map-stage').getAttribute('aria-busy'), null);
    assert.match(await failure.locator('.map-error').textContent(), /Não foi possível carregar/);

    const invalid = await browser.newPage();
    await invalid.addInitScript(() => localStorage.setItem('guardiao.mapa.progresso.v1', JSON.stringify({ completedFirst: 'yes', current: 99 })));
    await invalid.goto(mapURL); await ready(invalid);
    assert.equal(await invalid.locator('.map-stage').getAttribute('data-current-phase'), '1');
    console.log('PASS: artes originais, seis regiões, bloqueios, restauração animada, prévia separada do progresso real, persistência, revisita, toque, 320/390/667px, transições de navegação, colar remodelado, movimento reduzido, armazenamento bloqueado e falha de imagem.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
