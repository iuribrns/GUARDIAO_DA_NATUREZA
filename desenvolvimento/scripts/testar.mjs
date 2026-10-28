import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const root = fileURLToPath(new URL('../../', import.meta.url));
const production = process.argv.includes('--production');
const port = production ? 4187 : 5187;
const origin = `http://127.0.0.1:${port}`;
const vite = resolve(root, 'node_modules/vite/bin/vite.js');
const server = spawn(process.execPath, [vite, ...(production ? ['preview'] : []), '--config', 'desenvolvimento/vite.config.mjs', '--host', '127.0.0.1', '--port', String(port)], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
let startup = '';
server.stdout.on('data', data => { startup += data; });
server.stderr.on('data', data => { startup += data; });
let browser;
try {
  let started = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Servidor não iniciou: ${startup}`);
    if (!startup.includes('Local:')) { await new Promise(resolve => setTimeout(resolve, 100)); continue; }
    try { const response = await fetch(`${origin}/tela-inicial/nova-versao/index.html`); if (response.ok) { started = true; break; } } catch { /* Servidor ainda iniciando. */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(started, `Servidor não respondeu: ${startup}`);
  const executablePath = process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(`${origin}/`);
  await page.waitForURL('**/tela-inicial/nova-versao/index.html');
  assert.equal(await page.getByRole('link', { name: 'Jogar', exact: true }).count(), 1);
  await page.goto(`${origin}/desenvolvimento/laboratorio/index.html`);
  await page.waitForFunction(() => document.body.dataset.engineReady === 'true' && document.body.dataset.gsapReady === 'true');
  assert.equal(await page.locator('#game canvas').count(), 1);
  assert.match((await page.evaluate(() => GuardiaoLaboratorio.versoes())).phaser, /^3\./);
  const first = await page.evaluate(() => GuardiaoLaboratorio.quadro());
  await page.waitForTimeout(240);
  assert.notEqual(await page.evaluate(() => GuardiaoLaboratorio.quadro()), first, 'Phaser está avançando os quadros do sprite');
  await page.getByRole('button', { name: 'Pausar animação' }).click();
  const stopped = await page.evaluate(() => GuardiaoLaboratorio.quadro());
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => GuardiaoLaboratorio.quadro()), stopped, 'botão pausa os quadros');
  await page.getByRole('button', { name: 'Reproduzir animação' }).click();
  assert.equal(await page.evaluate(() => GuardiaoLaboratorio.pausado()), false);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => GuardiaoLaboratorio.pausado());
  assert.deepEqual(errors, []);
  await browser.close(); browser = undefined;
  console.log(`PASS: ${production ? 'build de produção' : 'Vite em desenvolvimento'}, menu, Phaser com sprite real, GSAP, pausa, movimento reduzido e celular.`);
  {
    // O mapa redesenhado e a exploração atual têm uma validação completa própria.
    // Os controles de plataforma seguem testados no laboratório legado preservado.
    const suites = [
      'tela-inicial/renascimento/validacao/renascimento.cjs',
      'jogo/vida-natural/validacao/fisica.cjs',
      'jogo/vida-natural/validacao/arte.cjs',
      'jogo/sprites-integros/validacao/quadros.cjs',
      'jogo/agua-viva/validacao/agua.cjs',
      'jogo/sons-da-natureza/validacao/audio.cjs',
      'jogo/colar-vivo/validacao/colar.cjs',
      ...(!production ? ['tela-inicial/nova-versao/validacao/transicoes.cjs','tela-inicial/efeitos-folhas/validacao/folhas.cjs'] : []),
      'tela-inicial/menu-vivo/validacao/menu.cjs',
      'jogo/controles/validacao/controles.cjs',
      'jogo/personagens/kai/validacao/animacoes.cjs',
      'jogo/area-aberta/validacao/fase.cjs',
      'jogo/floresta-viva/revisao/validacao/revisao.cjs',
      'jogo/jornada/validacao/campanha.cjs',
      'jogo/jornada/validacao/celular.cjs'
    ];
    for (const file of suites) {
      await new Promise((resolveRun, reject) => {
        const child = spawn(process.execPath, [file], { cwd: root, stdio: 'inherit', env: { ...process.env, GUARDIAO_TEST_URL: `${origin}/tela-inicial/nova-versao/`, GUARDIAO_PRODUCTION: String(production) } });
        child.on('error', reject);
        child.on('exit', code => code === 0 ? resolveRun() : reject(new Error(`${file} falhou (${code}).`)));
      });
    }
  }
} finally {
  await browser?.close();
  server.kill();
}
