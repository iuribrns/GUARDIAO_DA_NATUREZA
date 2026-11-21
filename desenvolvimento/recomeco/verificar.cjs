const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  { chromium } = require("playwright-core");
const base =
  process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4189/jogo/viva/";
const out = "test-results/recomeco";
fs.mkdirSync(out, { recursive: true });
const ready = (p) =>
  p.waitForFunction(
    () =>
      document.body.dataset.uiReady === "true" && !VivaTransicao.state().busy,
  );
const campaign = (p) =>
  p.evaluate(() =>
    Object.fromEntries(
      Object.entries(localStorage).filter(([k]) => k.startsWith("guardiao.")),
    ),
  );
async function panel(p, width) {
  await p.locator("#ra-reset").waitFor({ state: "visible" });
  await p.locator(".recomeco-art").evaluate(async (e) => {
    await e.decode();
    await document.fonts.ready;
  });
  const checks = await p.locator("#ra-reset").evaluate((e) => {
    const r = e.getBoundingClientRect(),
      desc = e.querySelector("#ra-reset-description").getBoundingClientRect(),
      prefs = e.querySelector("#ra-reset-preferences").getBoundingClientRect(),
      title = e.querySelector("h2").getBoundingClientRect();
    const inside = (i) => {
      const b = i.getBoundingClientRect();
      return (
        b.x >= r.x &&
        b.y >= r.y &&
        b.right <= r.right + 1 &&
        b.bottom <= r.bottom + 1
      );
    };
    return {
      screen:
        r.x >= 0 &&
        r.y >= 0 &&
        r.right <= innerWidth + 1 &&
        r.bottom <= innerHeight + 1,
      ratio: r.width / r.height,
      overflow:
        e.scrollHeight > e.clientHeight + 1 ||
        e.scrollWidth > e.clientWidth + 1,
      inside: [...e.querySelectorAll("h2,p,button")].every(inside),
      separated:
        title.bottom < desc.top &&
        desc.bottom < r.y + r.height * 0.46 &&
        prefs.top > r.y + r.height * 0.5 &&
        prefs.bottom < r.y + r.height * 0.64,
      buttons: [...e.querySelectorAll("button")].map((b) => {
        const r = b.getBoundingClientRect();
        return r.width >= 44 && r.height >= 44;
      }),
      focus: document.activeElement === e.querySelector("[data-cancel]"),
      fit: getComputedStyle(e.querySelector("img")).objectFit,
    };
  });
  assert.ok(
    checks.screen && checks.inside && checks.separated,
    JSON.stringify(checks),
  );
  assert.ok(Math.abs(checks.ratio - 2) < 0.01, "moldura 2:1 sem distorção");
  assert.equal(checks.overflow, false, "sem corte nem rolagem no painel");
  assert.ok(checks.buttons.every(Boolean));
  assert.equal(checks.focus, true, "continuar recebe o foco inicial");
  assert.equal(checks.fit, "contain");
  await p.screenshot({ path: `${out}/painel-${width}.png` });
}
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const [width, height] of [
      [1280, 720],
      [844, 390],
      [740, 320],
      [667, 375],
    ]) {
      const context = await b.newContext({
          viewport: { width, height },
          isMobile: width < 1000,
          hasTouch: width < 1000,
        }),
        p = await context.newPage(),
        errors = [],
        requested = [];
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("response", (r) => {
        if (r.status() >= 400) errors.push(r.status() + " " + r.url());
      });
      p.on("request", (r) => {
        if (r.url().includes("recomeco/assets/")) requested.push(r.url());
      });
      await p.addInitScript(() => {
        if (sessionStorage.getItem("recomeco-teste")) return;
        sessionStorage.setItem("recomeco-teste", "preparado");
        const completed = [1, 2, 3, 4, 5];
        localStorage.setItem(
          "guardiao.mapa.progresso.v1",
          JSON.stringify({ completed, current: 5 }),
        );
        localStorage.setItem(
          "guardiao.amanha.memoria.v1",
          JSON.stringify({
            version: 1,
            grants: completed,
            found: ["chave"],
            uniform: "voluntario",
            phases: { 5: { completed: true } },
          }),
        );
        localStorage.setItem(
          "guardiao.colar.fragmentos.v1",
          JSON.stringify(completed),
        );
        localStorage.setItem(
          "guardiao.floresta-viva.v2",
          JSON.stringify({ completed: true, itemsGiven: true }),
        );
        for (let i = 2; i <= 5; i++)
          localStorage.setItem(
            `guardiao.jornada.fase.${i}.v1`,
            JSON.stringify({ completed: true, itemsGiven: true, phase: i }),
          );
        localStorage.setItem("guardiao.viva.final.v1", "visto");
        localStorage.setItem("guardiao.raizes.final.v1", "visto");
        localStorage.setItem(
          "guardiao.horizonte.preferences.v1",
          JSON.stringify({
            controlMode: "keyboard",
            music: false,
            musicVolume: 25,
            effects: true,
            effectsVolume: 35,
            reduceMotion: true,
          }),
        );
        localStorage.setItem("outro-projeto", "preservado");
      });
      await p.goto(base + "index.html#mapa");
      await ready(p);
      assert.deepEqual(
        requested,
        [],
        "arte carrega apenas ao pedir nova jornada",
      );
      const before = await campaign(p);
      await p.locator("#map-reset").click();
      await panel(p, width);
      if (width < 1000) await p.locator("#ra-reset [data-cancel]").tap();
      else await p.keyboard.press("Enter");
      await p.locator("#ra-reset").waitFor({ state: "hidden" });
      assert.deepEqual(
        await campaign(p),
        before,
        "continuar preserva toda a partida",
      );
      await p.locator("#map-reset").click();
      await p.keyboard.press("Escape");
      await p.locator("#ra-reset").waitFor({ state: "hidden" });
      assert.deepEqual(await campaign(p), before, "Escape preserva a partida");
      await p.evaluate(() => (location.hash = "configuracoes"));
      await ready(p);
      await p.locator("#reset-journey").click();
      let peer;
      if (width === 1280) {
        peer = await p.context().newPage();
        await peer.goto(base + "index.html#mapa");
        await ready(peer);
        await peer.evaluate(() => (window.recomecoTestDocument = true));
      }
      await p.evaluate(() => (window.recomecoTestDocument = true));
      if (width < 1000) await p.locator("#ra-reset [data-confirm]").tap();
      else {
        await p.locator("#ra-reset [data-confirm]").focus();
        await p.keyboard.press("Enter");
      }
      await p.waitForURL("**#inicio");
      await p.waitForFunction(() => !window.recomecoTestDocument);
      await ready(p);
      const after = await p.evaluate(() => ({
        progress: GuardiaoProgresso.read(),
        memory: GuardiaoMemoria.read(),
        prefs: localStorage.getItem("guardiao.horizonte.preferences.v1"),
        generation: localStorage.getItem("guardiao.jornada.geracao.v1"),
        other: localStorage.getItem("outro-projeto"),
        remaining: Object.keys(localStorage).filter((k) =>
          /^guardiao\.(?:floresta-viva|jornada\.fase|(?:viva|raizes)\.final|colar\.fragmentos)/.test(
            k,
          ),
        ),
      }));
      assert.deepEqual(after.progress.completed, []);
      assert.deepEqual(after.memory.grants, []);
      assert.deepEqual(after.memory.found, []);
      assert.equal(after.memory.uniform, "explorador");
      assert.deepEqual(after.memory.phases, {});
      assert.equal(after.prefs, before["guardiao.horizonte.preferences.v1"]);
      assert.ok(after.generation);
      assert.equal(after.other, "preservado");
      assert.deepEqual(after.remaining, []);
      if (peer) {
        await peer.waitForURL("**#inicio");
        await peer.waitForFunction(() => !window.recomecoTestDocument);
        await ready(peer);
        assert.deepEqual(
          await peer.evaluate(() => GuardiaoMemoria.read().grants),
          [],
          "outra aba também abandona o inventário antigo",
        );
        assert.deepEqual(
          await peer.evaluate(() => GuardiaoProgresso.read().completed),
          [],
        );
        await peer.close();
      }
      await p.evaluate(() => (location.hash = "mapa"));
      await p.waitForFunction(() => document.body.dataset.view === "mapa");
      await ready(p);
      assert.equal(await p.locator(".map-hotspot.is-complete").count(), 0);
      assert.equal(
        await p.locator('[data-phase="1"]').getAttribute("aria-disabled"),
        "false",
      );
      assert.equal(
        await p.locator('.map-hotspot[aria-disabled="true"]').count(),
        4,
      );
      assert.deepEqual(errors, []);
      await context.close();
      console.log(
        "PASS novo painel, teclado/toque, continuar, Escape e reinício completo com preferências preservadas:",
        width,
        height,
      );
    }
    // O mesmo diálogo continua disponível sem recarregar a fase atual.
    for (const path of [
      "../floresta-viva/index.html",
      "../jornada/index.html?fase=2",
    ]) {
      const p = await b.newPage({
        viewport: { width: 844, height: 390 },
        isMobile: true,
        hasTouch: true,
      });
      await p.addInitScript(() =>
        localStorage.setItem(
          "guardiao.mapa.progresso.v1",
          JSON.stringify({ completed: [1], current: 2 }),
        ),
      );
      await p.goto(new URL(path, base).href);
      await p.waitForFunction(() => document.body.dataset.gameReady === "true");
      await p.evaluate(() => Raizes.askReset());
      await panel(p, path.includes("floresta") ? "floresta" : "rio");
      const url = p.url();
      await p.locator("#ra-reset [data-cancel]").tap();
      assert.equal(p.url(), url);
      await p.close();
    }
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
