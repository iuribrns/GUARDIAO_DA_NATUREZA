"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright-core");
const base =
  process.env.GUARDIAO_TEST_URL ||
  "http://127.0.0.1:5173/tela-inicial/nova-versao/";
const root = new URL("../../", base),
  KEY = "guardiao.horizonte.preferences.v1";
const state = (p) => p.evaluate(() => GuardiaoAudio.state());
const waitMusic = (p) =>
  p.waitForFunction(
    () => GuardiaoAudio.state().playing && GuardiaoAudio.state().duration > 90,
  );
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--autoplay-policy=document-user-activation-required",
    ],
  });
  const errors = [];
  const watch = (p) => {
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("response", (r) => {
      if (r.status() >= 400) errors.push(r.status() + " " + r.url());
    });
  };
  try {
    const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    watch(p);
    await p.addInitScript(() => {
      const C = window.AudioContext;
      window.audioContextCount = 0;
      if (C)
        window.AudioContext = class extends C {
          constructor(...args) {
            super(...args);
            audioContextCount++;
          }
        };
    });
    const musicRequests = [];
    p.on("request", (r) => {
      if (/\.mp3/.test(r.url())) musicRequests.push(r.url());
    });
    await p.goto(new URL("index.html", base).href);
    await p.waitForFunction(() => window.GuardiaoAudio);
    assert.equal(
      (await state(p)).preferences.music,
      true,
      "perfis novos têm música habilitada",
    );
    assert.equal(
      (await state(p)).context,
      "none",
      "primeiro acesso aguarda interação",
    );
    assert.equal(
      musicRequests.length,
      0,
      "nenhuma música é baixada antes da interação",
    );
    await p.mouse.click(12, 350);
    await waitMusic(p);
    await p.waitForFunction(() => GuardiaoAudio.level() > 0.0005);
    assert.equal(await p.evaluate(() => audioContextCount), 1);
    assert.equal((await state(p)).scene, "menu");
    assert.equal(
      musicRequests.filter((u) => u.includes("/menu.mp3")).length >= 1,
      true,
    );
    assert.ok(
      !musicRequests.some((u) =>
        /\/(rio|fauna|cidade|plantio|floresta)\.mp3/.test(u),
      ),
      "só baixa a faixa atual",
    );
    await p.evaluate(() => GuardiaoAudio.update({ musicVolume: 0 }));
    await p.waitForFunction(() => !GuardiaoAudio.state().playing);
    await p.evaluate(() => GuardiaoAudio.effect("coletar"));
    await p.waitForFunction(() => GuardiaoAudio.level() > 0.0002);
    assert.equal(
      (await state(p)).lastEffect,
      "coletar",
      "efeitos funcionam com música silenciada",
    );
    await p.evaluate(() => GuardiaoAudio.update({ effectsVolume: 0 }));
    await p.waitForTimeout(180);
    assert.ok(
      await p.evaluate(() => GuardiaoAudio.level() < 0.00001),
      "volumes zero produzem silêncio",
    );
    await p.evaluate(() =>
      GuardiaoAudio.update({ musicVolume: 35, effectsVolume: 55 }),
    );
    await waitMusic(p);
    await p.waitForTimeout(350);
    const position = (await state(p)).position;
    await p.goto(new URL("configuracoes.html", base).href);
    await p.locator("#preview-sound").click();
    await waitMusic(p);
    assert.ok(
      (await state(p)).position >= position - 0.15,
      "menu conserva a posição ao trocar de tela",
    );
    await p.locator("#music").uncheck();
    assert.equal((await state(p)).preferences.music, false);
    assert.equal((await state(p)).playing, false);
    await p.locator("#musicVolume").fill("28");
    await p.locator("#effectsVolume").fill("17");
    await p.locator("#music").check();
    await waitMusic(p);
    assert.equal((await state(p)).preferences.musicVolume, 28);
    assert.equal((await state(p)).preferences.effectsVolume, 17);
    await p.reload();
    await p.locator("#preview-sound").click();
    await waitMusic(p);
    assert.equal(await p.locator("#musicVolume").inputValue(), "28");
    assert.equal(await p.locator("#effectsVolume").inputValue(), "17");
    assert.equal(
      await p.evaluate(() => audioContextCount),
      1,
      "preferências e prévias usam só um contexto",
    );
    await p.evaluate(() => {
      window.audioHidden = true;
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => audioHidden,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await p.waitForFunction(
      () =>
        !GuardiaoAudio.state().playing &&
        GuardiaoAudio.state().context === "suspended",
    );
    await p.evaluate(() => {
      audioHidden = false;
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await waitMusic(p);
    assert.equal(
      await p.evaluate(() => audioContextCount),
      1,
      "voltar à aba reutiliza o contexto",
    );
    // Exercise the real hose, including release before its delayed sound finishes loading.
    await p.evaluate(() =>
      localStorage.setItem(
        "guardiao.floresta-viva.v2",
        JSON.stringify({
          version: 2,
          itemsGiven: true,
          released: true,
          equipped: true,
          hoseDrawn: true,
          water: 100,
          x: 286,
          y: 260,
          fires: Array(8).fill(1),
          animals: [],
          completed: false,
        }),
      ),
    );
    await p.goto(new URL("jogo/floresta-viva/index.html", root).href);
    await p.waitForFunction(() => GuardiaoFloresta.estado().ready);
    await p.mouse.click(900, 690);
    await waitMusic(p);
    assert.equal((await state(p)).scene, "floresta");
    await p.keyboard.down("s");
    await p.waitForTimeout(300);
    await p.keyboard.up("s");
    assert.equal((await state(p)).lastEffect, "passo");
    await p.evaluate(() => GuardiaoAudio.update({ musicVolume: 0 }));
    await p.route("**/mangueira.mp3", async (r) => {
      await new Promise((resolve) => setTimeout(resolve, 350));
      await r.continue();
    });
    await p.keyboard.down(" ");
    await p.waitForTimeout(80);
    await p.keyboard.up(" ");
    await p.waitForTimeout(500);
    assert.equal(
      (await state(p)).water,
      false,
      "um som carregado depois de soltar não começa atrasado",
    );
    await p.keyboard.down(" ");
    await p.waitForFunction(() => GuardiaoAudio.state().water);
    await p.waitForFunction(() => GuardiaoAudio.level() > 0.0001);
    await p.keyboard.up(" ");
    await p.waitForFunction(() => !GuardiaoAudio.state().water);
    await p.waitForTimeout(180);
    assert.equal((await state(p)).waterWanted, false);
    await p.keyboard.down(" ");
    await p.waitForFunction(() => GuardiaoAudio.state().water);
    await p.keyboard.press("Escape");
    await p.waitForFunction(() => !GuardiaoAudio.state().water);
    assert.equal(
      (await state(p)).ducked,
      true,
      "pausa suaviza a trilha e interrompe a mangueira",
    );
    await p.keyboard.up(" ");
    await p.getByRole("button", { name: "Continuar", exact: true }).click();
    await p.locator("#som").click();
    assert.equal((await state(p)).preferences.effects, false);
    await p.locator("#som").click();
    assert.equal((await state(p)).preferences.effects, true);
    await p.evaluate(() =>
      GuardiaoAudio.update({ musicVolume: 28 }, { persist: true }),
    );
    for (const [id, scene] of [
      [2, "rio"],
      [3, "fauna"],
      [4, "plantio"],
      [5, "cidade"],
    ]) {
      await p.evaluate(
        (id) =>
          localStorage.setItem(
            "guardiao.mapa.progresso.v1",
            JSON.stringify({
              completed: Array.from({ length: id - 1 }, (_, i) => i + 1),
              completedFirst: true,
              current: id,
            }),
          ),
        id,
      );
      await p.goto(new URL("jogo/jornada/index.html?fase=" + id, root).href);
      await p.waitForFunction(() => GuardiaoJornada.estado().ready);
      await p.locator("#intro-next").click();
      await waitMusic(p);
      assert.equal((await state(p)).scene, scene);
      assert.ok(
        (await state(p)).duration > 95 && (await state(p)).duration < 120,
      );
      assert.equal((await state(p)).ducked, true);
      assert.equal(await p.evaluate(() => audioContextCount), 1);
    }
    // Touch activation and saved mute settings on mobile.
    const phone = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    watch(phone);
    await phone.addInitScript(
      (key) =>
        localStorage.setItem(
          key,
          JSON.stringify({
            music: false,
            musicVolume: 32,
            effects: false,
            effectsVolume: 45,
          }),
        ),
      KEY,
    );
    await phone.goto(new URL("configuracoes.html", base).href);
    await phone.locator("h1").tap();
    assert.equal((await state(phone)).context, "none");
    assert.equal(await phone.locator("#music").isChecked(), false);
    await phone.locator("#music").tap();
    await waitMusic(phone);
    assert.equal(
      (await state(phone)).preferences.effects,
      false,
      "ativar música preserva os efeitos desativados",
    );
    await phone.locator("#musicVolume").fill("0");
    assert.equal((await state(phone)).playing, false);
    await phone.close();
    const blocked = await browser.newPage();
    watch(blocked);
    await blocked.addInitScript(() =>
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new DOMException("blocked");
        },
      }),
    );
    await blocked.goto(new URL("configuracoes.html", base).href);
    await blocked.locator("#preview-sound").click();
    await waitMusic(blocked);
    await blocked.locator("#musicVolume").fill("22");
    assert.equal((await state(blocked)).preferences.musicVolume, 22);
    await blocked.close();
    const unsupported = await browser.newPage();
    watch(unsupported);
    await unsupported.addInitScript(() => {
      window.AudioContext = undefined;
      window.webkitAudioContext = undefined;
    });
    await unsupported.goto(new URL("configuracoes.html", base).href);
    assert.equal(await unsupported.locator("#music").isDisabled(), true);
    assert.equal((await state(unsupported)).supported, false);
    await unsupported.close();
    const failure = await browser.newPage();
    watch(failure);
    await failure.route("**/menu.mp3", (r) => r.abort());
    await failure.goto(new URL("configuracoes.html", base).href);
    await failure.locator("#preview-sound").click();
    await failure.waitForFunction(() => GuardiaoAudio.state().musicFailed);
    await failure.waitForFunction(
      () => GuardiaoAudio.state().lastEffect === "toque",
    );
    assert.equal(
      (await state(failure)).lastEffect,
      "toque",
      "falha na música preserva os efeitos e a tela",
    );
    await failure.close();
    assert.deepEqual(errors, []);
    console.log(
      "PASS: seis músicas reais, sinal de áudio, ativação por gesto, cache seletivo, volumes independentes, preferências, posição, contexto único, aba oculta, mangueira contínua/cancelamento, passos, pausa, celular, armazenamento bloqueado e falha de áudio sem travar.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
