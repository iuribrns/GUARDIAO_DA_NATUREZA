"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  { chromium } = require("playwright-core");
const base =
    process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4189/jogo/viva/",
  out = "test-results/mapa-hud";
fs.mkdirSync(out, { recursive: true });
async function geometry(frame) {
  return frame.evaluate(() => {
    const rect = (e) => e.getBoundingClientRect(),
      inside = (r, p) =>
        r.left >= p.left - 1 &&
        r.right <= p.right + 1 &&
        r.top >= p.top - 1 &&
        r.bottom <= p.bottom + 1,
      overlap = (a, b) =>
        a.left < b.right - 1 &&
        a.right > b.left + 1 &&
        a.top < b.bottom - 1 &&
        a.bottom > b.top + 1;
    const cards = [...document.querySelectorAll(".map-hud-card")],
      buttons = [...document.querySelectorAll(".map-hotspot")],
      actions = [
        ...document.querySelectorAll(".map-hud-actions button:not([hidden])"),
      ];
    return {
      hudWidth: rect(document.querySelector(".map-hud")).width,
      hudHeight: rect(document.querySelector(".map-hud-card")).height,
      crystalGap:
        rect(document.querySelector("[data-map-count]")).left -
        rect(document.querySelector(".map-hud-slot:last-child")).right,
      overflow: cards.flatMap((card) =>
        [
          ...card.querySelectorAll(
            "img, strong, .map-hud-copy > span, .map-hud-slot",
          ),
        ]
          .filter((e) => !inside(rect(e), rect(card)))
          .map((e) => card.id + ":" + (e.textContent || e.tagName)),
      ),
      outside: cards
        .filter(
          (e) =>
            !inside(rect(e), {
              left: 0,
              top: 0,
              right: innerWidth,
              bottom: innerHeight,
            }),
        )
        .map((e) => e.id),
      collisions: [...cards, ...actions].flatMap((a) =>
        buttons
          .filter((b) => overlap(rect(a), rect(b)))
          .map((b) => a.id + ":fase" + b.dataset.phase),
      ),
      targets: [document.getElementById("map-backpack"), ...actions].every(
        (e) => rect(e).width >= 44 && rect(e).height >= 44,
      ),
      symbols: cards
        .flatMap((card) => [...card.querySelectorAll(":scope > img")])
        .every(
          (im) =>
            im.complete &&
            im.naturalWidth &&
            getComputedStyle(im).objectFit === "contain",
        ),
      mapFit: (() => {
        const c = document.getElementById("living-island"),
          r = rect(c);
        return Math.abs(r.width / r.height - c.width / c.height) < 0.001;
      })(),
      coordinates: buttons.map((e) => [
        e.style.getPropertyValue("--x"),
        e.style.getPropertyValue("--y"),
      ]),
      nestedIcons: document.querySelectorAll(
        ".map-hotspot img, .map-hotspot svg",
      ).length,
    };
  });
}
async function artReady(frame) {
  await frame.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.querySelectorAll(".map-hud img")].map((im) => im.decode()),
    );
  });
}
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
  });
  try {
    for (const [width, height, large] of [
      [1920, 1080, false],
      [1280, 720, false],
      [844, 390, false],
      [740, 320, false],
      [667, 375, false],
      [844, 390, true],
      [740, 320, true],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height },
        isMobile: width < 1000,
        hasTouch: width < 1000,
        reducedMotion: large ? "reduce" : "no-preference",
      });
      await context.addInitScript((large) => {
        localStorage.setItem(
          "guardiao.horizonte.preferences.v1",
          JSON.stringify({ largeText: large, reduceMotion: large }),
        );
      }, large);
      const page = await context.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("response", (r) => {
        if (r.status() >= 400) errors.push(r.status() + " " + r.url());
      });
      await page.goto(base + "index.html#mapa", {
        waitUntil: "domcontentloaded",
      });
      await page.waitForSelector("#guardiao-game");
      let frame = page.frame({ name: "guardiao-game" });
      await frame.waitForFunction(
        () => document.body.dataset.uiReady === "true",
      );
      await frame.evaluate(() => {
        VivaFinal.start = () => {};
      }); // A matriz de estados não inicia a cutscene automaticamente.
      for (const completed of [
        [],
        [1],
        [1, 2],
        [1, 2, 3],
        [1, 2, 3, 4],
        [1, 2, 3, 4, 5],
        [1, 3],
      ]) {
        const current =
          completed.length === 5
            ? 5
            : completed.length === 2 && completed[1] === 3
              ? 2
              : completed.length + 1;
        await frame.evaluate(
          ({ completed, current }) => {
            localStorage.setItem(
              "guardiao.mapa.progresso.v1",
              JSON.stringify({ completed, current }),
            );
            localStorage.removeItem("guardiao.viva.final.v1");
            RaizesApp.refreshMap();
            return BosqueMapa.ready();
          },
          { completed, current },
        );
        await artReady(frame);
        assert.equal(
          await frame.locator("[data-map-count]").textContent(),
          completed.length + "/5",
        );
        assert.match(
          await frame.locator("[data-map-phase-icon]").getAttribute("src"),
          new RegExp(
            "/" +
              ["fogo", "agua", "pata", "cuidar", "solar"][current - 1] +
              "\\.webp$",
          ),
        );
        assert.deepEqual(
          await frame
            .locator("[data-crystal][data-earned=true]")
            .evaluateAll((es) => es.map((e) => Number(e.dataset.crystal))),
          completed,
        );
        assert.deepEqual(
          await frame.evaluate(() => GuardiaoMemoria.obtained()),
          completed,
          "mesmos cristais do colar",
        );
        assert.equal(
          await frame.locator("#tree-state").getAttribute("data-tree-state"),
          completed.length === 5
            ? "pronta"
            : completed.length
              ? "recuperando"
              : "enfraquecida",
        );
        assert.equal(
          await frame.locator("#map-reset").isVisible(),
          !!completed.length,
        );
        assert.equal(
          await frame.locator("#replay-ending").isVisible(),
          completed.length === 5,
        );
        if (completed.length === 0 || completed.length === 5)
          await page.screenshot({
            path: `${out}/mapa-${width}-${large ? "maior" : "normal"}-${completed.length}.png`,
          });
        const g = await geometry(frame);
        assert.deepEqual(
          g.overflow,
          [],
          JSON.stringify({ width, height, large, completed, ...g }),
        );
        assert.deepEqual(g.outside, []);
        assert.deepEqual(
          g.collisions,
          [],
          JSON.stringify({ width, height, large, completed, ...g }),
        );
        assert.ok(g.targets && g.symbols);
        assert.ok(
          g.hudWidth <= 1360,
          "rodapé não estica demais em monitores largos",
        );
        if (width < 1000)
          assert.ok(
            g.hudHeight <= (large ? 52 : 48),
            "painéis compactos no celular",
          );
        assert.ok(
          g.crystalGap >= 0 && g.crystalGap <= 10,
          "cristais e contador ficam próximos e alinhados",
        );
        assert.ok(g.mapFit, "mapa inteiro com a proporção original");
        assert.deepEqual(
          g.coordinates,
          [
            ["77%", "24%"],
            ["82%", "49%"],
            ["76%", "78%"],
            ["27%", "75%"],
            ["25%", "25%"],
          ],
          "coordenadas originais das fases preservadas",
        );
        assert.equal(g.nestedIcons, 0);
        if (completed.join() === "1,3") {
          assert.match(
            await frame.locator('[data-phase="2"]').getAttribute("aria-label"),
            /Região atual/,
          );
          assert.match(
            await frame.locator('[data-phase="4"]').getAttribute("aria-label"),
            /Disponível/,
          );
          assert.match(
            await frame.locator('[data-phase="5"]').getAttribute("aria-label"),
            /Bloqueada/,
          );
        }
      }
      await frame.evaluate(() =>
        GuardiaoMapaHUD.update({ completed: [1, 3], current: 5 }),
      );
      assert.match(
        await frame.locator("#map-current").getAttribute("aria-label"),
        /Bloqueada/,
      );
      assert.match(
        await frame
          .locator("#map-current")
          .evaluate((e) => getComputedStyle(e, "::before").borderImageSource),
        /placa-bloqueado\.webp/,
      );
      await frame.evaluate(() => RaizesApp.refreshMap());
      const bag = frame.locator("#map-backpack"),
        r = await bag.boundingBox();
      await bag.dispatchEvent("pointerdown", {
        pointerType: width < 1000 ? "touch" : "mouse",
        isPrimary: true,
        button: 0,
        clientX: r.x + r.width / 2,
        clientY: r.y + r.height / 2,
      });
      assert.equal(await bag.locator(".map-touch-layer").count(), 1);
      assert.equal(
        await bag.evaluate((e) => e.getAnimations().length),
        large ? 0 : 1,
        "opção de menos movimento respeitada",
      );
      await page.waitForTimeout(70);
      await page.screenshot({
        path: `${out}/toque-${width}-${large ? "suave" : "animado"}.png`,
      });
      await page.waitForTimeout(300);
      assert.equal(
        await bag.locator(".map-touch-layer").count(),
        0,
        "efeito removido ao terminar",
      );
      for (let tap = 0; tap < 3; tap++)
        await bag.dispatchEvent("pointerdown", {
          pointerType: "touch",
          isPrimary: true,
          button: 0,
        });
      assert.equal(
        await bag.locator(".map-touch-layer").count(),
        1,
        "toques rápidos não acumulam efeitos",
      );
      await bag.dispatchEvent("pointercancel", { pointerType: "touch" });
      assert.equal(
        await bag.locator(".map-touch-layer").count(),
        0,
        "gesto cancelado limpa o efeito",
      );
      if (width < 1000) await bag.tap();
      else await bag.click();
      await frame.locator("#mochila-jornada").waitFor({ state: "visible" });
      await frame.locator("[data-pack-close]").click();
      await page.keyboard.press("Tab");
      await frame.locator("#map-backpack").focus();
      assert.equal(
        await frame
          .locator("#map-backpack")
          .evaluate((e) => getComputedStyle(e).outlineStyle),
        "solid",
      );
      await page.keyboard.press("Enter");
      await frame.locator("#mochila-jornada").waitFor({ state: "visible" });
      await frame.locator("[data-pack-close]").click();
      // Estado final deve sobreviver à volta ao mapa e a uma navegação completa.
      await frame.evaluate(() => {
        localStorage.setItem(
          "guardiao.mapa.progresso.v1",
          JSON.stringify({ completed: [1, 2, 3, 4, 5], current: 5 }),
        );
        localStorage.setItem("guardiao.viva.final.v1", "visto");
        RaizesApp.refreshMap();
      });
      await artReady(frame);
      assert.equal(
        await frame.locator("[data-map-tree-status]").textContent(),
        "Restaurada",
      );
      await page.screenshot({
        path: `${out}/restaurado-${width}-${large ? "maior" : "normal"}.png`,
      });
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForSelector("#guardiao-game");
      frame = page.frame({ name: "guardiao-game" });
      await frame.waitForFunction(
        () => document.body.dataset.uiReady === "true",
      );
      assert.equal(
        await frame.locator("#tree-state").getAttribute("data-tree-state"),
        "restaurada",
      );
      assert.match(
        await frame
          .locator("#tree-state")
          .evaluate((e) => getComputedStyle(e, "::before").borderImageSource),
        /placa-concluido\.webp/,
      );
      await frame.locator("#map-reset").click();
      await frame.locator("#ra-reset").waitFor({ state: "visible" });
      await frame.locator("[data-confirm]").click();
      await frame.waitForFunction(
        () =>
          document.body.dataset.view === "inicio" &&
          !VivaTransicao.state().busy,
      );
      await frame.locator("#play-game").click();
      await frame.waitForFunction(
        () =>
          document.body.dataset.view === "mapa" && !VivaTransicao.state().busy,
      );
      assert.equal(
        await frame.locator("[data-map-count]").textContent(),
        "0/5",
      );
      assert.equal(
        await frame.locator("#tree-state").getAttribute("data-tree-state"),
        "enfraquecida",
      );
      assert.equal(await frame.locator("#map-reset").isVisible(), false);
      assert.deepEqual(errors, []);
      await context.close();
      console.log(
        "PASS indicadores, 0–5 cristais, lacunas, mochila e reinício",
        width + "x" + height,
        large ? "texto maior" : "",
      );
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
