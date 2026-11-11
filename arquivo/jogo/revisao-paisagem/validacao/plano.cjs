"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { chromium } = require("playwright-core");
const { resolve } = require("node:path");
const root = resolve(__dirname, "../../..");
const base =
  process.env.GUARDIAO_TEST_URL ||
  "http://127.0.0.1:5173/tela-inicial/nova-versao/";
const origin = new URL("../../", base);
const errors = [];
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const p = await b.newPage({
      viewport: { width: 844, height: 390 },
      isMobile: true,
      hasTouch: true,
    });
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(base + "aventura.html");
    await p.waitForFunction(() => window.GuardiaoMapa);
    assert.equal(await p.locator(".map-hotspot").count(), 6);
    await p.locator('.map-hotspot[data-phase="6"]').tap();
    assert.equal(await p.locator("[data-map-action=start]").isDisabled(), true);
    assert.equal(
      await p.locator('[data-healed="6"]').getAttribute("href"),
      null,
    );
    await p.locator("[data-map-action=close]").tap();
    await p.evaluate(() =>
      localStorage.setItem(
        "guardiao.mapa.progresso.v1",
        JSON.stringify({ completed: [1, 2, 3, 4], current: 5 }),
      ),
    );
    await p.reload();
    await p.waitForFunction(() => window.GuardiaoMapa);
    assert.equal(
      await p.locator('[data-healed="6"]').getAttribute("href"),
      null,
      "a quinta conquista é necessária para recuperar o centro",
    );
    await p.evaluate(() =>
      localStorage.setItem(
        "guardiao.mapa.progresso.v1",
        JSON.stringify({ completed: [1, 2, 3, 4, 5], current: 5 }),
      ),
    );
    await p.reload();
    await p.waitForFunction(() => window.GuardiaoMapa);
    assert.match(
      await p.locator('[data-healed="6"]').getAttribute("href"),
      /mapa-verde/,
    );
    await p.locator('.map-hotspot[data-phase="6"]').tap();
    assert.equal(
      await p.locator("[data-map-action=start]").isDisabled(),
      false,
    );
    await p.locator("[data-map-action=close]").tap();
    await p.locator("#map-pack").click();
    await p.locator("[data-pack-tab=uniforms]").tap();
    assert.equal(await p.locator("[data-pack-uniform]").count(), 0);
    assert.equal(await p.locator(".pack-card[data-uniform]").count(), 5);
    assert.equal(
      await p.evaluate(() => GuardiaoMemoria.uniform("voluntario")),
      false,
    );
    await p.locator("[data-pack-tab=crystals]").tap();
    const distinct = await p
      .locator("[data-crystal]>svg")
      .evaluateAll((es) =>
        es.map((e) => e.querySelector("g>path").getAttribute("d")),
      );
    assert.equal(
      new Set(distinct).size,
      5,
      "cada cristal tem sua silhueta própria",
    );
    await p.locator("[data-pack-close]").first().tap();
    for (const id of [1, 2, 3, 4, 5]) {
      await p.goto(
        new URL(
          id === 1
            ? "jogo/floresta-viva/index.html"
            : "jogo/jornada/index.html?fase=" + id,
          origin,
        ).href,
      );
      await p.waitForFunction(() => document.body.dataset.gameReady === "true");
      const result = await p.evaluate(async (id) => {
        const art = new GuardiaoAdventureArt(id);
        await art.load();
        const c = document.createElement("canvas");
        c.width = 1280;
        c.height = 720;
        const ctx = c.getContext("2d");
        const values = [];
        for (const ratio of [0, 0.5, 1]) {
          ctx.clearRect(0, 0, 1280, 720);
          art.community(ctx, 0, true, ratio);
          const px = ctx.getImageData(0, 0, 1280, 720).data;
          let hash = 0,
            opaque = 0;
          for (let n = 0; n < px.length; n += 4) {
            if (px[n + 3] > 200) opaque++;
            hash =
              (Math.imul(hash, 31) +
                px[n] +
                px[n + 1] +
                px[n + 2] +
                px[n + 3]) |
              0;
          }
          values.push({ mood: document.body.dataset.npcMood, hash, opaque });
        }
        return values;
      }, id);
      assert.deepEqual(
        result.map((x) => x.mood),
        ["preocupados", "esperancosos", "felizes"],
      );
      assert.equal(
        new Set(result.map((x) => x.hash)).size,
        3,
        "três aparências reais na fase " + id,
      );
      assert.ok(
        result.every((x) => x.opaque > 200),
        "NPCs presentes em todas as etapas",
      );
      if (id === 3) {
        const fade = await p.evaluate(() => {
          const a = new GuardiaoAdventureArt(3);
          return [
            a.underCanopy({ x: 895, y: 255 }),
            a.underCanopy({ x: 375, y: 225 }),
          ];
        });
        assert.deepEqual(fade, [true, false]);
      }
    }
    // Hybrid tablet with a fine pointer still has a touch screen. Explicit choices survive orientation changes.
    const hybrid = await b.newPage({
      viewport: { width: 1024, height: 768 },
      hasTouch: true,
    });
    await hybrid.addInitScript(() => {
      const original = matchMedia;
      window.matchMedia = (q) =>
        q.includes("pointer:")
          ? {
              matches: false,
              media: q,
              addEventListener() {},
              removeEventListener() {},
            }
          : original(q);
      Object.defineProperty(navigator, "maxTouchPoints", { get: () => 5 });
    });
    await hybrid.goto(base + "configuracoes.html");
    assert.equal(
      await hybrid.locator("body").getAttribute("data-controls"),
      "touch",
    );
    await hybrid.locator("[data-control-mode]").selectOption("keyboard");
    await hybrid.setViewportSize({ width: 768, height: 1024 });
    assert.equal(
      await hybrid.locator("body").getAttribute("data-controls"),
      "keyboard",
    );
    await hybrid.reload();
    assert.equal(
      await hybrid.locator("[data-control-mode]").inputValue(),
      "keyboard",
    );
    await hybrid.close();
    const sandbox = { window: {}, structuredClone };
    for (const name of [
      "jogo/jornada/fases.js",
      "jogo/novo-amanha/conteudo.js",
      "jogo/vida-em-equilibrio/conteudo.js",
    ])
      vm.runInNewContext(fs.readFileSync(resolve(root, name), "utf8"), sandbox);
    const phases = sandbox.window.GuardiaoFasesJogaveis;
    assert.equal(
      phases[3].tasks.some((t) => t.type === "kitten"),
      false,
    );
    for (const key of [
      "mico",
      "tucano",
      "capivara",
      "onca",
      "arara",
      "tamandua",
      "anta",
      "preguica",
    ])
      assert.ok(phases[3].tasks.some((t) => t.speciesKey === key));
    assert.ok(phases[4].tasks.every((t) => t.type === "bed"));
    assert.deepEqual([...new Set(phases[5].tasks.map((t) => t.type))].sort(), [
      "garden",
      "recycle",
      "solar",
    ]);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: seis destinos e desbloqueio/restauração do epílogo, cinco cristais distintos, uniformes só para consulta, três humores realmente desenhados em todas as fases, fauna brasileira própria, árvore visível e tablet híbrido com preferência persistente.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
