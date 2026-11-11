"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright-core");
const base =
  process.env.GUARDIAO_TEST_URL ||
  "http://127.0.0.1:4173/tela-inicial/nova-versao/";
const root = new URL("../../", base);
const endingURL = new URL("tela-inicial/renascimento/creditos.html", root).href;
const prefs = JSON.stringify({
  controlMode: "keyboard",
  musicVolume: 27,
  effectsVolume: 35,
  largeText: false,
});
const generation = "guardiao.jornada.geracao.v1";
const progressKeys = [
  "guardiao.mapa.progresso.v1",
  "guardiao.colar.fragmentos.v1",
  "guardiao.amanha.memoria.v1",
  "guardiao.floresta-viva.v2",
  "guardiao.area-aberta.floresta.v1",
  ...[2, 3, 4, 5].map((id) => `guardiao.jornada.fase.${id}.v1`),
];
const seed = {
  "guardiao.mapa.progresso.v1": JSON.stringify({
    completed: [1, 2, 3, 4, 5],
    current: 5,
    completedFirst: true,
  }),
  "guardiao.colar.fragmentos.v1": JSON.stringify([1, 2, 3, 4, 5]),
  "guardiao.amanha.memoria.v1": JSON.stringify({
    version: 1,
    grants: [1, 2, 3, 4, 5],
    found: ["chave"],
    uniform: "voluntario",
    phases: { 1: { completed: true }, 5: { completed: true } },
  }),
  "guardiao.floresta-viva.v2": JSON.stringify({
    completed: true,
    itemsGiven: true,
  }),
  "guardiao.area-aberta.floresta.v1": JSON.stringify({ completed: true }),
  ...Object.fromEntries(
    [2, 3, 4, 5].map((id) => [
      `guardiao.jornada.fase.${id}.v1`,
      JSON.stringify({ completed: true, itemsGiven: true }),
    ]),
  ),
  "guardiao.horizonte.preferences.v1": prefs,
  "guardiao.menu.preferences": JSON.stringify({ effects: true }),
  "outro-projeto.nao-apagar": "preservado",
};
const errors = [];
let browser;
async function context(options = {}, completed = false) {
  const c = await browser.newContext({
    viewport: { width: 844, height: 390 },
    ...options,
  });
  if (completed)
    await c.addInitScript((values) => {
      if (!/^https?:$/.test(location.protocol)) return;
      if (localStorage.getItem("teste.inicializado")) return;
      for (const [key, value] of Object.entries(values))
        localStorage.setItem(key, value);
      localStorage.setItem("teste.inicializado", "1");
    }, seed);
  c.on("page", (p) => {
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("response", (r) => {
      if (r.status() >= 400) errors.push(r.status() + " " + r.url());
    });
  });
  return c;
}
async function ending(p) {
  await p.clock.install();
  await p.goto(endingURL);
  await p.waitForFunction(
    () =>
      document.body.dataset.endingReady === "true" &&
      window.GuardiaoNovaJornada,
  );
  await p.clock.runFor(900);
}
async function fullscreen(p, selector, expected) {
  await p.locator(selector).click();
  await p.waitForFunction(
    (value) =>
      GuardiaoTela.state().fullscreen === value &&
      !GuardiaoTela.state().pending,
    expected,
  );
  assert.equal(
    await p.locator(selector).getAttribute("aria-pressed"),
    String(expected),
  );
  assert.equal(
    await p.locator(selector).getAttribute("aria-label"),
    expected ? "Sair da tela cheia" : "Entrar em tela cheia",
  );
  if (expected)
    assert.equal(
      await p.evaluate(() => document.fullscreenElement?.tagName),
      "HTML",
      "diálogos fazem parte da tela cheia",
    );
}
async function inside(p, selector) {
  const box = await p.locator(selector).boundingBox(),
    v = p.viewportSize();
  assert.ok(
    box &&
      box.x >= -1 &&
      box.y >= -1 &&
      box.x + box.width <= v.width + 1 &&
      box.y + box.height <= v.height + 1,
    selector + " cabe na tela",
  );
}
(async () => {
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    // APIs reais do Chromium, com mouse e toque. Um clique precisa alternar só uma vez.
    for (const touch of [false, true]) {
      const c = await context({ isMobile: touch, hasTouch: touch });
      const p = await c.newPage();
      await p.goto(base + "index.html");
      await fullscreen(p, "#app-fullscreen", true);
      await fullscreen(p, "#app-fullscreen", false);
      await p.goto(base + "aventura.html");
      await p.waitForFunction(() => window.GuardiaoMapa);
      await fullscreen(p, "#map-fullscreen", true);
      await p.locator('.map-hotspot[data-phase="1"]').click();
      await inside(p, "#fullscreen-phase-dialog");
      await fullscreen(p, "#fullscreen-phase-dialog", false);
      await fullscreen(p, "#fullscreen-phase-dialog", true);
      await p.evaluate(() => document.exitFullscreen());
      await p.waitForFunction(
        () => document.body.dataset.fullscreenState === "normal",
      );
      assert.equal(
        await p
          .locator("#fullscreen-phase-dialog")
          .getAttribute("aria-pressed"),
        "false",
        "saída externa sincroniza os ícones",
      );
      await c.close();
    }
    console.log(
      "PASS: entrar/sair em computador e toque, raiz HTML, diálogos e saída externa.",
    );

    // Computador continua oferecendo tela cheia mesmo com o joystick oculto.
    {
      const c = await context();
      const p = await c.newPage();
      await p.clock.install();
      await p.addInitScript(
        (value) =>
          localStorage.setItem("guardiao.horizonte.preferences.v1", value),
        prefs,
      );
      await p.goto(new URL("jogo/floresta-viva/index.html", root).href);
      await p.waitForFunction(() => document.body.dataset.gameReady === "true");
      await fullscreen(p, "#fullscreen-conversa", true);
      await fullscreen(p, "#fullscreen-conversa", false);
      await p.locator("#conversa-avancar").click();
      await p.locator("#conversa-avancar").click();
      await p.clock.runFor(2300);
      assert.equal(await p.locator("#joystick").isVisible(), false);
      await inside(p, "#app-fullscreen");
      await fullscreen(p, "#app-fullscreen", true);
      await p.locator("#pausa").click();
      await inside(p, "#tela-cheia");
      assert.ok(
        await p.locator(".pause-screen-actions #tela-cheia").isVisible(),
        "saída na primeira linha da pausa",
      );
      await fullscreen(p, "#tela-cheia", false);
      await p.getByRole("button", { name: "Continuar", exact: true }).click();
      assert.equal(await p.locator("#menu-pausa").isVisible(), false);
      await c.close();
    }
    console.log(
      "PASS: tela cheia na fase, introdução e pausa, mesmo no modo teclado.",
    );

    // Um navegador sem API, uma recusa e a implementação WebKit têm tratamento próprio.
    for (const mode of ["ausente", "recusada", "webkit"]) {
      const c = await context();
      await c.addInitScript((mode) => {
        Object.defineProperty(Element.prototype, "requestFullscreen", {
          configurable: true,
          value:
            mode === "recusada"
              ? () => Promise.reject(new Error("Not allowed"))
              : undefined,
        });
        for (const key of [
          "webkitRequestFullscreen",
          "webkitRequestFullScreen",
        ])
          Object.defineProperty(Element.prototype, key, {
            configurable: true,
            value: undefined,
          });
        if (mode === "webkit") {
          Object.defineProperty(Element.prototype, "webkitRequestFullscreen", {
            configurable: true,
            value() {
              Object.defineProperty(document, "webkitFullscreenElement", {
                configurable: true,
                writable: true,
                value: this,
              });
              document.dispatchEvent(new Event("webkitfullscreenchange"));
            },
          });
          document.webkitExitFullscreen = () => {
            document.webkitFullscreenElement = null;
            document.dispatchEvent(new Event("webkitfullscreenchange"));
          };
        }
      }, mode);
      const p = await c.newPage();
      await p.goto(base + "index.html");
      await p.locator("#app-fullscreen").click();
      if (mode === "webkit") {
        assert.equal(
          await p.evaluate(() => GuardiaoTela.state().fullscreen),
          true,
        );
        assert.equal(
          await p.locator("#app-fullscreen").getAttribute("aria-label"),
          "Sair da tela cheia",
        );
        await p.locator("#app-fullscreen").click();
      } else {
        await p.locator("#viewport-status").waitFor({ state: "visible" });
        assert.match(
          await p.locator("#viewport-status").textContent(),
          /navegador/,
        );
      }
      assert.equal(
        await p.evaluate(() => GuardiaoTela.state().fullscreen),
        false,
      );
      if (mode === "ausente") {
        await p.goto(base + "aventura.html");
        await p.waitForFunction(() => window.GuardiaoMapa);
        await p.locator('.map-hotspot[data-phase="1"]').click();
        await p.locator("#fullscreen-phase-dialog").click();
        assert.equal(
          await p.locator("#phase-dialog .viewport-feedback").isVisible(),
          true,
          "aviso permanece legível na camada modal",
        );
      }
      await c.close();
    }
    console.log(
      "PASS: WebKit e mensagens quando a API está ausente ou recusa a solicitação.",
    );

    // Cancelar não modifica a jornada. Falha de armazenamento repõe o que foi removido.
    {
      const c = await context({}, true),
        p = await c.newPage();
      await ending(p);
      const saved = await p.evaluate(
        (keys) =>
          Object.fromEntries(keys.map((k) => [k, localStorage.getItem(k)])),
        progressKeys,
      );
      await p.locator("#ending-new-journey").click();
      assert.equal(
        await p.locator("#ending-pause").getAttribute("aria-pressed"),
        "true",
        "confirmação pausa o encerramento",
      );
      assert.equal(
        await p.evaluate(() =>
          document.activeElement.hasAttribute("data-new-cancel"),
        ),
        true,
      );
      await p.locator("[data-new-cancel]").click();
      await p.clock.runFor(100);
      assert.equal(
        await p.locator("#ending-pause").getAttribute("aria-pressed"),
        "false",
        "cancelar restaura a reprodução anterior",
      );
      assert.deepEqual(
        await p.evaluate(
          (keys) =>
            Object.fromEntries(keys.map((k) => [k, localStorage.getItem(k)])),
          progressKeys,
        ),
        saved,
      );
      await p.locator("#ending-new-journey").click();
      await p.evaluate(() => {
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
          if (key === "guardiao.jornada.geracao.v1") {
            Storage.prototype.setItem = original;
            throw new Error("Teste de falha");
          }
          return original.call(this, key, value);
        };
      });
      await p.locator("[data-new-confirm]").click();
      assert.equal(p.url(), endingURL);
      assert.match(
        await p.locator("[data-new-error]").textContent(),
        /Não foi possível/,
      );
      assert.equal(await p.locator("[data-new-confirm]").isEnabled(), true);
      assert.deepEqual(
        await p.evaluate(
          (keys) =>
            Object.fromEntries(keys.map((k) => [k, localStorage.getItem(k)])),
          progressKeys,
        ),
        saved,
      );
      await c.close();
    }
    console.log(
      "PASS: confirmação, cancelamento sem alterações e recuperação de falha ao salvar.",
    );

    // O caminho dos créditos também reinicia; outra aba não pode restaurar o progresso antigo.
    {
      const c = await context({ isMobile: true, hasTouch: true }, true);
      const other = await c.newPage();
      await other.goto(base + "aventura.html");
      await other.waitForFunction(() => window.GuardiaoMapa);
      const p = await c.newPage();
      await ending(p);
      await p.locator("#ending-open-credits").click();
      await p.locator("#credits-new-journey").scrollIntoViewIfNeeded();
      await p.locator("#credits-new-journey").click();
      await inside(p, "#nova-jornada");
      await fullscreen(p, "#fullscreen-nova-jornada", true);
      await fullscreen(p, "#fullscreen-nova-jornada", false);
      await p.locator("[data-new-confirm]").click();
      await p.waitForURL("**/nova-versao/index.html");
      await other.waitForURL("**/nova-versao/index.html");
      const values = await p.evaluate(
        (keys) =>
          Object.fromEntries(keys.map((k) => [k, localStorage.getItem(k)])),
        progressKeys,
      );
      assert.ok(
        Object.values(values).every((value) => value === null),
        "todos os saves, coleção e mapa apagados",
      );
      assert.equal(
        await p.evaluate(() =>
          localStorage.getItem("guardiao.horizonte.preferences.v1"),
        ),
        prefs,
      );
      assert.equal(
        await p.evaluate(() =>
          localStorage.getItem("outro-projeto.nao-apagar"),
        ),
        "preservado",
      );
      assert.equal(
        await p.evaluate(() =>
          localStorage.getItem("guardiao.menu.preferences"),
        ),
        seed["guardiao.menu.preferences"],
      );
      assert.ok(
        await p.evaluate((key) => localStorage.getItem(key), generation),
      );
      await p.goto(base + "aventura.html");
      await p.waitForFunction(() => window.GuardiaoMapa);
      await p.clock.runFor(800);
      assert.equal(
        await p.locator("#journey-fragments").textContent(),
        "0 / 5 fragmentos",
      );
      assert.equal(
        await p.locator('.map-hotspot[data-locked="false"]').count(),
        1,
      );
      assert.equal(
        await p
          .locator(".map-hotspot.is-complete,[data-healed].healed")
          .count(),
        0,
      );
      assert.equal(await p.locator(".map-stage.is-restored").count(), 0);
      assert.equal(await p.locator("#map-final-replay").isVisible(), false);
      assert.deepEqual(await p.evaluate(() => GuardiaoMemoria.obtained()), []);
      assert.deepEqual(
        await p.evaluate(() => GuardiaoMemoria.read().grants),
        [],
      );
      assert.equal(
        await p.evaluate(() => GuardiaoMemoria.read().uniform),
        "explorador",
      );
      await p.goto(new URL("jogo/floresta-viva/index.html", root).href);
      await p.waitForFunction(() => document.body.dataset.gameReady === "true");
      assert.equal(
        await p.locator("#conversa").isVisible(),
        true,
        "Carlos apresenta novamente a missão",
      );
      assert.equal(
        await p.evaluate(() => GuardiaoFloresta.estado().itemsGiven),
        false,
      );
      assert.equal(
        await p.evaluate(() => GuardiaoFloresta.estado().completed),
        false,
      );
      await p.goto(endingURL);
      await p.waitForFunction(
        () => document.body.dataset.endingState === "locked",
      );
      assert.equal(
        await p.locator("#ending-new-journey").count(),
        0,
        "recomeço completo só é oferecido após a vitória",
      );
      await c.close();
    }
    console.log(
      "PASS: nova jornada pelo crédito, mapa devastado, só fase 1 aberta, cristais/itens/trajes zerados, Carlos e preferências preservadas; outra aba invalidada.",
    );
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
