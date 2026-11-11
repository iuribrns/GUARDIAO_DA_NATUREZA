"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  { chromium } = require("playwright-core");
const base =
    process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4173/jogo/raizes/",
  root = new URL("../../", base),
  requests = new Set(),
  errors = [];
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const c = await b.newContext(),
      p = await c.newPage();
    p.on("request", (r) => {
      if (r.url().startsWith(root.origin))
        requests.add(new URL(r.url()).pathname);
    });
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("response", (r) => {
      if (r.status() >= 400) errors.push(r.status() + " " + r.url());
    });
    for (const [width, height] of [
      [1280, 720],
      [844, 390],
      [667, 375],
      [740, 320],
      [932, 430],
    ]) {
      await p.setViewportSize({ width, height });
      await p.goto(base + "index.html");
      await p.waitForFunction(() => document.body.dataset.uiReady === "true");
      await p.waitForTimeout(550);
      assert.equal(await p.locator("#play-game").isVisible(), true);
      assert.equal(
        await p.locator("video[src]").count(),
        0,
        "sem carregar filme no início",
      );
      await p.click("#play-game");
      await p.waitForTimeout(650);
      assert.equal(await p.locator(".map-hotspot").count(), 5);
      assert.equal(await p.locator('[data-phase="6"]').count(), 0);
      const mapBox = await p.locator("#island-ash").boundingBox();
      assert.ok(
        mapBox.width >= Math.min(width, height * 1.776) * 0.98,
        "ilha ocupa a tela sem recorte",
      );
      await p.click('[data-phase="1"]');
      assert.equal(await p.locator("#phase-dialog").isVisible(), true);
      await p.waitForTimeout(250);
      const dialog = await p.locator("#phase-dialog").boundingBox(),
        start = await p.locator("#start-phase").boundingBox();
      assert.ok(
        dialog.x >= 0 &&
          dialog.y >= 0 &&
          dialog.x + dialog.width <= width + 1 &&
          dialog.y + dialog.height <= height + 1,
      );
      assert.ok(
        start.y + start.height <= height,
        "ação acessível sem rolar a tela",
      );
      await p.click("#close-phase");
      await p.goto(base + "index.html#sobre");
      await p.waitForTimeout(650);
      for (const tab of [
        "historia",
        "comandos",
        "missao",
        "natureza",
        "equipe",
      ]) {
        await p.click('[data-about-tab="' + tab + '"]');
        assert.equal(
          await p.locator('[data-about-panel="' + tab + '"]').isVisible(),
          true,
        );
        assert.equal(
          await p.evaluate(
            () => document.scrollingElement.scrollHeight <= innerHeight + 1,
          ),
          true,
          "tela externa fixa",
        );
      }
      assert.match(await p.locator("#equipe").innerText(), /Eric Nascimento/);
      assert.match(
        await p.locator("#equipe").innerText(),
        /Natson Evangelista/,
      );
      await p.goto(base + "index.html#configuracoes");
      await p.waitForTimeout(550);
      for (const tab of ["audio", "conforto", "controles"]) {
        await p.click('[data-setting-tab="' + tab + '"]');
        assert.equal(
          await p.locator('[data-setting-panel="' + tab + '"]').isVisible(),
          true,
        );
      }
      assert.equal(await p.locator("[name=controlMode]").isVisible(), true);
      console.log("PASS interface paisagem", width + "×" + height);
    }
    await p.goto(new URL("jogo/floresta-viva/index.html", root).href);
    await p.waitForFunction(() => document.body.dataset.gameReady === "true");
    await p.click("#conversa-avancar");
    await p.click("#conversa-avancar");
    await p.waitForTimeout(1800);
    const url = p.url();
    await p.click("#pausa");
    const before = await p.evaluate(() => GuardiaoFloresta.estado().player);
    await p.click("[data-adjust]");
    await p.click('[data-setting-tab="controles"]');
    await p.selectOption("[name=controlMode]", "touch");
    await p.waitForTimeout(200);
    assert.equal(await p.locator("#joystick").isVisible(), true);
    await p.selectOption("[name=controlMode]", "keyboard");
    await p.waitForTimeout(200);
    assert.equal(await p.locator("#joystick").isVisible(), false);
    assert.equal(p.url(), url);
    assert.deepEqual(
      await p.evaluate(() => GuardiaoFloresta.estado().player),
      before,
    );
    assert.equal(
      await p.evaluate(() => GuardiaoFloresta.estado().paused),
      true,
    );
    await p.click("#phase-settings header button");
    assert.equal(
      await p.evaluate(() => GuardiaoFloresta.estado().locked),
      false,
    );
    await p.click("#mochila");
    for (const tab of ["items", "crystals", "uniforms"]) {
      await p.click('[data-pack-tab="' + tab + '"]');
      assert.equal(await p.locator("#pack-content").isVisible(), true);
    }
    await p.click("[data-pack-close]");
    assert.equal(p.url(), url);
    console.log(
      "PASS ajustes e mochila sobre a fase, sem navegação, sem perder posição, controles aplicados imediatamente",
    );
    const other = await c.newPage();
    await other.goto(base + "index.html#configuracoes");
    await other.click("#reset-journey");
    await other.click("[data-confirm]");
    await p.waitForURL("**/raizes/index.html#inicio");
    assert.equal(
      await p.evaluate(() => localStorage.getItem("guardiao.floresta-viva.v2")),
      null,
    );
    assert.equal(
      await p.evaluate(
        () =>
          JSON.parse(localStorage.getItem("guardiao.horizonte.preferences.v1"))
            .controlMode,
      ),
      "keyboard",
    );
    assert.ok(
      await p.evaluate(() =>
        localStorage.getItem("guardiao.jornada.geracao.v1"),
      ),
    );
    await other.close();
    console.log(
      "PASS reinício completo preserva preferências e invalida partida aberta em outra aba",
    );
    await p.goto(base + "index.html");
    await p.evaluate(() => {
      localStorage.setItem(
        "guardiao.mapa.progresso.v1",
        JSON.stringify({ completed: [1, 2, 3, 4, 5], current: 5 }),
      );
    });
    await p.goto(base + "index.html#final");
    await p.waitForFunction(
      () => document.querySelector("#guardian-video").currentTime > 0,
    );
    assert.equal(await p.locator("#guardian-video").isVisible(), true);
    await p.click("#ending-skip");
    await p.waitForFunction(
      () => document.body.dataset.endingState === "concluido",
    );
    assert.equal(await p.locator("#final-credits").isVisible(), true);
    await p.click("#ending-restart");
    await p.click("[data-cancel]");
    assert.equal(await p.evaluate(() => Raizes.won()), true);
    await p.click("#ending-restart");
    await p.click("[data-confirm]");
    await p.waitForURL("**#inicio");
    assert.equal(await p.evaluate(() => Raizes.won()), false);
    console.log(
      "PASS vídeo MP4 toca, créditos só no final, reinício confirma e restaura a ilha",
    );
    await p.setViewportSize({ width: 390, height: 844 });
    await p.waitForFunction(() => GuardiaoOrientacao.blocked);
    assert.equal(await p.locator("#girar-celular").isVisible(), true);
    await p.setViewportSize({ width: 844, height: 390 });
    await p.waitForFunction(() => !GuardiaoOrientacao.blocked);
    await p.click("#fs-toggle");
    await p.waitForFunction(() => !!document.fullscreenElement);
    await p.click("#fs-toggle");
    await p.waitForFunction(() => !document.fullscreenElement);
    console.log("PASS orientação e entrada/saída de tela cheia");
    assert.deepEqual(errors, []);
  } finally {
    fs.writeFileSync(
      "/tmp/raizes-requests-interface.json",
      JSON.stringify([...requests].sort(), null, 2),
    );
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
