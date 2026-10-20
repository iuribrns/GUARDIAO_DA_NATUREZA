'use strict';
// Validação em navegador real; requer playwright-core e um servidor HTTP local.
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const base = process.env.GUARDIAO_TEST_URL || 'http://127.0.0.1:8005/tela-inicial/nova-versao/';
const home = `${base}index.html`;
const ready = page => page.waitForFunction(() => !document.querySelector('.navigation-veil') && !document.body.hasAttribute('aria-busy'));
const options = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const errors = [];
  const page = await browser.newPage(options);
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  // Reproduzia um salto direto sem animação em navegadores sem recorte circular.
  await page.addInitScript(() => {
    const supports = CSS.supports.bind(CSS);
    CSS.supports = (name, value) => name === 'clip-path' ? false : supports(name, value);
  });
  await page.goto(home);
  await ready(page);
  for (const [label, destination] of [['Jogar', 'aventura'], ['Sobre o jogo', 'sobre'], ['Abrir configurações', 'configuracoes']]) {
    await page.getByRole('link', { name: label, exact: true }).tap();
    await page.waitForFunction(() => {
      const circle = document.querySelector('.is-covering .transition-circle');
      if (!circle) return false;
      const scale = new DOMMatrix(getComputedStyle(circle).transform).a;
      return scale > .03 && scale < .95;
    });
    assert.ok(page.url().endsWith('index.html'), 'o círculo cresce antes de trocar de página');
    await page.waitForURL(`**/${destination}.html`);
    await page.waitForFunction(() => {
      const circle = document.querySelector('.is-revealing .transition-circle');
      if (!circle) return false;
      const scale = new DOMMatrix(getComputedStyle(circle).transform).a;
      return scale > .03 && scale < .95;
    });
    await ready(page);
    await page.getByRole('link', { name: 'Voltar à tela inicial' }).tap();
    await page.waitForURL('**/index.html'); await ready(page);
  }
  const gear = page.getByRole('link', { name: 'Abrir configurações' });
  const gearBox = await gear.boundingBox();
  assert.ok(Math.abs(gearBox.width - gearBox.height) < .1, 'botão circular sem esticar');
  assert.ok(gearBox.width >= 44);
  const svgBox = await gear.locator('svg').boundingBox();
  assert.ok(Math.abs(svgBox.width - svgBox.height) < .1, 'símbolo vetorial mantém proporção');
  assert.equal(await gear.locator('img').count(), 0, 'ícone não depende do sprite deformado');
  await gear.focus(); await page.keyboard.press('Enter');
  await page.waitForURL('**/configuracoes.html'); await ready(page);
  await page.locator('#music').check(); await page.locator('#musicVolume').fill('35');
  await page.locator('#largeText').check();
  await page.locator('#reduceMotion').check();
  assert.match(await page.locator('#motion-status').textContent(), /Transições desativadas/);
  await page.getByRole('link', { name: 'Voltar à tela inicial' }).tap();
  await page.waitForURL('**/index.html');
  assert.equal(await page.locator('.navigation-veil').count(), 0, 'preferência explícita respeitada');
  await page.getByRole('link', { name: 'Abrir configurações' }).tap();
  await page.waitForURL('**/configuracoes.html');
  assert.equal(await page.locator('#musicVolume').inputValue(), '35');
  await page.locator('#reset').click();
  await page.getByRole('link', { name: 'Voltar à tela inicial' }).tap();
  await page.waitForURL('**/index.html'); await ready(page);
  await page.getByRole('link', { name: 'Sobre o jogo', exact: true }).tap();
  await page.waitForURL('**/sobre.html'); await ready(page);
  await page.getByRole('tab', { name: 'Como jogar' }).tap();
  assert.equal(await page.locator('#controls').isVisible(), true);
  assert.equal(await page.locator('#controls').evaluate(panel => panel.getAnimations().length > 0), true);
  await page.goBack(); await page.waitForURL('**/index.html'); await ready(page);

  // A preferência antiga era das folhas; não pode desativar as trocas de tela.
  const legacy = await browser.newPage(options);
  await legacy.addInitScript(() => localStorage.setItem('guardiao.menu.preferences', JSON.stringify({ motion: false, sound: true })));
  await legacy.goto(home);
  assert.equal(await legacy.locator('.leaves').isVisible(), false);
  assert.equal(await legacy.locator('body').evaluate(body => body.classList.contains('reduce-motion')), false);
  await legacy.getByRole('link', { name: 'Abrir configurações' }).tap();
  await legacy.waitForURL('**/configuracoes.html'); await ready(legacy);
  assert.equal(await legacy.locator('#fallingLeaves').isChecked(), false);
  assert.equal(await legacy.locator('#reduceMotion').isChecked(), false);
  await legacy.locator('#fallingLeaves').check();
  assert.equal(await legacy.locator('.leaves').isVisible(), true);

  const blocked = await browser.newPage(options);
  await blocked.addInitScript(() => {
    for (const key of ['sessionStorage', 'localStorage']) Object.defineProperty(window, key, { get() { throw new DOMException('blocked'); } });
  });
  await blocked.goto(home);
  await blocked.getByRole('link', { name: 'Sobre o jogo', exact: true }).tap();
  assert.equal(await blocked.locator('.navigation-veil').count(), 1, 'saída funciona sem armazenamento');
  await blocked.waitForURL('**/sobre.html'); await ready(blocked);
  await blocked.goBack(); await ready(blocked);

  const reduced = await browser.newPage({ ...options, reducedMotion: 'reduce' });
  await reduced.goto(home);
  await reduced.getByRole('link', { name: 'Abrir configurações' }).tap();
  await reduced.waitForURL('**/configuracoes.html');
  assert.equal(await reduced.locator('.navigation-veil').count(), 0);
  assert.match(await reduced.locator('#motion-status').textContent(), /dispositivo solicita movimento reduzido/);
  // A preferência do sistema não fica gravada como escolha manual permanente.
  await reduced.emulateMedia({ reducedMotion: 'no-preference' });
  assert.equal(await reduced.locator('#reduceMotion').isChecked(), false);
  await reduced.getByRole('link', { name: 'Voltar à tela inicial' }).tap();
  await reduced.waitForURL('**/index.html'); await ready(reduced);

  // CSS que não chega ou animationend ausente nunca pode bloquear os links.
  const noCSS = await browser.newPage(options);
  await noCSS.route('**/transicoes.css*', route => route.abort());
  await noCSS.goto(home);
  await noCSS.getByRole('link', { name: 'Jogar', exact: true }).tap();
  await noCSS.waitForURL('**/aventura.html'); await ready(noCSS);
  const interrupted = await browser.newPage(options);
  await interrupted.addInitScript(() => document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style'); style.textContent = '.transition-circle{animation:none!important}'; document.head.append(style);
  }));
  await interrupted.goto(home);
  await interrupted.getByRole('link', { name: 'Sobre o jogo', exact: true }).tap();
  await interrupted.waitForURL('**/sobre.html'); await ready(interrupted);

  for (const viewport of [{ width: 320, height: 740 }, { width: 667, height: 375 }, { width: 1280, height: 720 }]) {
    await page.setViewportSize(viewport);
    for (const file of ['index', 'configuracoes', 'sobre', 'aventura']) {
      await page.goto(`${base}${file}.html`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${file} sem overflow em ${viewport.width}px`);
    }
  }
  assert.deepEqual(errors, []);
  await browser.close();
  console.log('PASS: ida/volta nos três botões, saída e revelação animadas sem clip-path, toque/teclado, engrenagem proporcional, migração das folhas, abas, preferências, sistema, armazenamento bloqueado, CSS ausente e animação interrompida, layouts 320–1280px.');
})().catch(error => { console.error(error); process.exit(1); });
