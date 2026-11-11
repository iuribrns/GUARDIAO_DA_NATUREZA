"use strict";
const assert = require("node:assert/strict"),
  { chromium } = require("playwright-core");
const base =
    process.env.GUARDIAO_TEST_URL ||
    "http://127.0.0.1:5173/tela-inicial/nova-versao/",
  root = new URL("../../", base),
  KEY = "guardiao.mapa.progresso.v1";
(async () => {
  const b = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    }),
    errors = [];
  try {
    for (const viewport of [
      { width: 1280, height: 720 },
      { width: 390, height: 844 },
      { width: 320, height: 740 },
      { width: 844, height: 390 },
      { width: 667, height: 375 },
    ]) {
      const p = await b.newPage({
        viewport,
        isMobile: viewport.width < 900,
        hasTouch: viewport.width < 900,
      });
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("response", (r) => {
        if (r.status() >= 400) errors.push(r.status() + " " + r.url());
      });
      const requests = [];
      p.on("request", (r) => requests.push(r.url()));
      await p.goto(base + "aventura.html");
      await p.waitForFunction(() => window.GuardiaoMapa);
      const map = await p.locator(".map-stage").boundingBox();
      assert.equal(map.width, viewport.width);
      assert.equal(map.height, viewport.height);
      assert.equal(map.x + map.y, 0);
      assert.ok(
        !requests.some(
          (u) => u.includes("mapa-verde") || u.includes("mapa-celular-verde"),
        ),
        "sem restauração antecipada",
      );
      for (let id = 1; id <= 5; id++) {
        await p.locator('.map-hotspot[data-phase="' + id + '"]').click();
        assert.equal(await p.locator("dialog[open]").count(), 1);
        await p.locator("[data-map-action=close]").click();
      }
      await p.locator("#map-pack").click();
      assert.equal(await p.locator("#mochila-jornada").isVisible(), true);
      assert.equal(
        await p.locator(".pack-card[data-unlocked=true]").count(),
        0,
      );
      await p.locator("[data-pack-tab=crystals]").click();
      assert.match(
        await p.locator("#pack-content").textContent(),
        /0 de 5 cristais/,
      );
      await p.locator("[data-pack-tab=uniforms]").click();
      assert.equal(
        await p.locator("[data-pack-uniform=explorador]").isEnabled(),
        true,
      );
      assert.equal(
        await p.locator("[data-pack-uniform=protecao]").isDisabled(),
        true,
      );
      assert.equal(
        await p
          .locator("#mochila-jornada")
          .evaluate((d) => d.scrollWidth <= d.clientWidth),
        true,
      );
      await p.locator("[data-pack-close]").last().click();
      assert.deepEqual(
        await p.evaluate(() => GuardiaoMapa.obterProgresso().completed),
        [],
      );
      assert.ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await p.goto(base + "sobre.html#controls");
      await p.locator("#controls").waitFor();
      await p.locator("[data-help-device=keyboard]").click();
      assert.equal(
        await p.locator("[data-help-for=keyboard]").isVisible(),
        true,
      );
      assert.equal(await p.locator("[data-help-for=touch]").isVisible(), false);
      assert.match(
        await p.locator("[data-help-for=keyboard]").textContent(),
        /J/,
      );
      await p.locator("[data-help-device=touch]").click();
      assert.equal(await p.locator("[data-help-for=touch]").isVisible(), true);
      await p.getByRole("tab", { name: "Na natureza", exact: true }).click();
      for (const biome of [
        "atlantica",
        "cerrado",
        "caatinga",
        "pantanal",
        "pampa",
        "amazonia",
      ])
        await p.locator("[data-biome=" + biome + "]").click();
      await p.locator("[data-nature-answer=trash]").click();
      assert.match(await p.locator("#nature-feedback").textContent(), /tentar/);
      await p.locator("[data-nature-answer=care]").click();
      assert.match(await p.locator("#nature-feedback").textContent(), /Isso/);
      await p.getByRole("tab", { name: "Sobre Nós", exact: true }).click();
      await p.waitForFunction(() => document.body.dataset.teamReady === "true");
      assert.equal(await p.locator("[data-person=peterson]").count(), 1);
      assert.match(
        await p.locator("[data-person=iuri]").getAttribute("aria-label"),
        /crespo cacheado/,
      );
      assert.ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await p.close();
    }
    const p = await b.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    p.on("pageerror", (e) => errors.push(e.message));
    await p.addInitScript(
      (key) =>
        localStorage.setItem(
          key,
          JSON.stringify({ completed: [1, 2, 3, 4, 5], current: 5 }),
        ),
      KEY,
    );
    await p.clock.install();
    for (const id of [1, 2, 3, 4, 5]) {
      await p.goto(
        new URL(
          "jogo/" +
            (id === 1
              ? "floresta-viva/index.html"
              : "jornada/index.html?fase=" + id),
          root,
        ).href,
      );
      await p.waitForFunction(() => document.body.dataset.gameReady === "true");
      assert.equal(
        await p.locator("dialog[open]").count(),
        1,
        "só uma conversa na entrada " + id,
      );
      assert.equal(
        await p
          .locator("dialog:not([open])")
          .evaluateAll((ds) =>
            ds.every((d) => getComputedStyle(d).display === "none"),
          ),
        true,
      );
      assert.ok(
        await p
          .locator("dialog[open]")
          .evaluate((d) => d.scrollWidth <= d.clientWidth),
        "conversa sem recorte lateral em " + id,
      );
      const text = await p.locator("dialog[open]").innerText();
      assert.ok(text.length < 650, "introdução curta " + id);
      const next = p.locator(id === 1 ? "#conversa-avancar" : "#intro-next");
      await next.tap();
      await next.tap();
      await p.clock.runFor(4500);
      const pad = await p.locator("#joystick").boundingBox(),
        old = await p.evaluate(() =>
          window.GuardiaoJornada
            ? GuardiaoJornada.estado().player
            : GuardiaoFloresta.estado().player,
        );
      const c = await p.context().newCDPSession(p);
      await c.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [
          { id: 1, x: pad.x + pad.width * 0.7, y: pad.y + pad.height * 0.7 },
        ],
      });
      await p.clock.runFor(350);
      await c.send("Input.dispatchTouchEvent", {
        type: "touchCancel",
        touchPoints: [],
      });
      await p.clock.runFor(150);
      const stop = await p.evaluate(() =>
        window.GuardiaoJornada
          ? GuardiaoJornada.estado().player
          : GuardiaoFloresta.estado().player,
      );
      assert.ok(
        Math.hypot(stop.x - old.x, stop.y - old.y) > 2,
        "toque movimenta " + id,
      );
      await p.clock.runFor(350);
      assert.equal(
        await p.evaluate(() =>
          window.GuardiaoJornada
            ? GuardiaoJornada.estado().player.x
            : GuardiaoFloresta.estado().player.x,
        ),
        stop.x,
      );
      await p.locator("#mochila").tap();
      await p.locator("[data-pack-tab=uniforms]").tap();
      assert.equal(await p.locator("#mochila-jornada").isVisible(), true);
      await p.locator("[data-pack-close]").last().tap();
      await p.locator("#pausa").tap();
      await p.selectOption("#pauseControlMode", "keyboard");
      assert.equal(await p.locator("#joystick").isVisible(), false);
      assert.equal(await p.locator(".actions").isVisible(), false);
      await p.getByRole("button", { name: "Continuar", exact: true }).tap();
      await p.locator("#pausa").click();
      await p.selectOption("#pauseControlMode", "touch");
      await p.getByRole("button", { name: "Continuar", exact: true }).click();
    }
    const fresh = await b.newPage();
    fresh.on("pageerror", (e) => errors.push(e.message));
    await fresh.goto(
      new URL("tela-inicial/renascimento/creditos.html", root).href,
    );
    await fresh.waitForFunction(
      () => document.body.dataset.endingState === "locked",
    );
    assert.equal(await fresh.locator("#ending").isVisible(), false);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: mapa em tela inteira em cinco formatos, cinco placas alcançáveis, mochila sem falsos desbloqueios, três abas, tutorial por dispositivo, seis biomas, tentativas educativas, retratos preservados, uma conversa por fase, toque e cancelamento em todas as fases, troca para teclado e epílogo protegido.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
