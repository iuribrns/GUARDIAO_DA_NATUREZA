"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  { chromium } = require("playwright-core");
const path = require("node:path");
const artifacts =
  process.env.GUARDIAO_ARTIFACTS || path.resolve("test-results/viva");
fs.mkdirSync(artifacts, { recursive: true });
const base =
    process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4173/jogo/viva/",
  root = new URL("../../", base);
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const p = await b.newPage(),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("response", (r) => {
      if (r.status() >= 400) errors.push(r.status() + " " + r.url());
    });
    for (const [w, h] of [
      [1280, 720],
      [844, 390],
      [740, 320],
      [667, 375],
      [932, 430],
    ]) {
      await p.setViewportSize({ width: w, height: h });
      await p.goto(base + "index.html");
      await p.waitForFunction(() => document.body.dataset.uiReady === "true");
      await p.waitForTimeout(600);
      assert.equal(
        await p.locator("#home-actors").count(),
        0,
        "dupla pertence à pintura, sem sobreposições",
      );
      assert.equal(await p.evaluate(() => VivaFolhas.state().active), true);
      if (w === 1280)
        await p.screenshot({ path: artifacts + "/viva-capa-final.png" });
      await p.click("#play-game");
      await p.waitForFunction(() => location.hash === "#mapa");
      assert.ok(await p.evaluate(() => VivaTransicao.state().count > 0));
      await p.waitForTimeout(500);
      const r = await p.locator(".map-stage").boundingBox();
      assert.ok(
        r.x >= -0.1 &&
          r.y >= -0.1 &&
          r.x + r.width <= w + 0.5 &&
          r.y + r.height <= h + 0.5,
        "ilha inteira dentro da tela",
      );
      assert.equal(await p.locator(".map-hotspot").count(), 5);
      await p.screenshot({
        path: artifacts + "/viva-mapa-" + w + ".png",
      });
      await p.click('[data-phase="1"]');
      await p.waitForTimeout(650);
      const d = await p.locator("#phase-dialog").boundingBox();
      assert.ok(d.x >= 0 && d.y >= 0 && d.y + d.height <= h + 0.5);
      assert.equal(await p.locator("#start-phase").isVisible(), true);
      if (w === 844)
        await p.screenshot({
          path: artifacts + "/viva-encontro-celular.png",
        });
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
        await p.waitForTimeout(250);
        assert.equal(
          await p.locator('[data-about-panel="' + tab + '"]').isVisible(),
          true,
        );
        assert.equal(
          await p.evaluate(
            () => document.scrollingElement.scrollHeight <= innerHeight + 1,
          ),
          true,
        );
      }
      await p.waitForTimeout(400);
      assert.equal(
        await p.evaluate(() => VivaArt.images.has("professor")),
        true,
      );
      if (w === 844)
        await p.screenshot({
          path: artifacts + "/viva-professor-celular.png",
        });
      await p.click('[data-about-tab="comandos"]');
      await p.locator("#how-kai").focus();
      await p.keyboard.press("ArrowRight");
      await p.click("#demo-action");
      assert.match(await p.locator("#demo-feedback").innerText(), /cuida/);
      if (w === 844)
        await p.screenshot({
          path: artifacts + "/viva-comandos-celular.png",
        });
      await p.goto(base + "index.html#configuracoes");
      await p.waitForTimeout(550);
      for (const tab of ["audio", "conforto", "controles", "imagem"]) {
        await p.click('[data-setting-tab="' + tab + '"]');
        assert.equal(
          await p.locator('[data-setting-panel="' + tab + '"]').isVisible(),
          true,
        );
      }
      await p.selectOption("[name=graphicsQuality]", "leve");
      assert.equal(
        await p.locator("body").getAttribute("data-graphics"),
        "leve",
      );
      await p.locator("[name=screenTransitions]").uncheck();
      assert.equal(
        await p.evaluate(() => Raizes.prefs().screenTransitions),
        false,
      );
      await p.locator("[name=screenTransitions]").check();
      if (w === 844)
        await p.screenshot({
          path: artifacts + "/viva-ajustes-celular.png",
        });
      console.log(
        "PASS interface, ilha inteira, retrato e quatro abas",
        w + "x" + h,
      );
    }
    await p.setViewportSize({ width: 844, height: 390 });
    await p.goto(new URL("jogo/floresta-viva/index.html", root).href);
    await p.waitForFunction(() => document.body.dataset.gameReady === "true");
    assert.equal(await p.evaluate(() => GuardiaoElenco.actors(1).length), 0);
    assert.equal(await p.evaluate(() => VivaMundo.scale), 1.32);
    await p.waitForTimeout(400);
    await p.screenshot({ path: artifacts + "/viva-conversa-final.png" });
    await p.click("#conversa-avancar");
    await p.click("#conversa-avancar");
    await p.waitForTimeout(3200);
    await p.screenshot({ path: artifacts + "/viva-fase-final.png" });
    const url = p.url();
    await p.click("#pausa");
    await p.click("[data-adjust]");
    await p.click('[data-setting-tab="controles"]');
    await p.selectOption("[name=controlMode]", "touch");
    assert.equal(await p.locator("#joystick").isVisible(), true);
    await p.selectOption("[name=controlMode]", "keyboard");
    assert.equal(await p.locator("#joystick").isVisible(), false);
    assert.equal(p.url(), url);
    assert.equal(
      await p.evaluate(() => GuardiaoFloresta.estado().paused),
      true,
    );
    await p.click("#phase-settings header button");
    assert.equal(
      await p.evaluate(() => GuardiaoFloresta.estado().paused),
      false,
    );
    await p.goto(base + "index.html#configuracoes");
    await p.click("#reset-journey");
    await p.click("[data-confirm]");
    await p.waitForURL("**#inicio");
    assert.equal(
      await p.evaluate(() => localStorage.getItem("guardiao.floresta-viva.v2")),
      null,
    );
    assert.equal(
      await p.evaluate(() => Raizes.prefs().controlMode),
      "keyboard",
    );
    console.log(
      "PASS sem moradores; atores maiores; ajustes sem sair da fase; reset preserva preferências",
    );
    await p.evaluate(() => {
      localStorage.setItem(
        "guardiao.mapa.progresso.v1",
        JSON.stringify({ completed: [1, 2, 3, 4, 5], current: 5 }),
      );
      localStorage.removeItem("guardiao.viva.final.v1");
    });
    await p.clock.install();
    await p.goto(base + "index.html#mapa");
    await p.waitForFunction(() => window.VivaFinal?.active);
    await p.clock.runFor(4500);
    const first = await p.evaluate(() => VivaFinal.state());
    await p.screenshot({ path: artifacts + "/viva-final-caminho.png" });
    await p.clock.runFor(6500);
    assert.ok(
      (await p.evaluate(() => VivaFinal.state())).elapsed > first.elapsed,
    );
    await p.screenshot({
      path: artifacts + "/viva-final-restauracao.png",
    });
    assert.equal(await p.locator("video").count(), 0);
    assert.equal(await p.evaluate(() => document.body.dataset.view), "mapa");
    await p.clock.runFor(7000);
    await p.screenshot({
      path: artifacts + "/viva-final-celebracao.png",
    });
    await p.clock.runFor(4000);
    assert.equal(await p.locator("#final-credits").isVisible(), true);
    await p.click("#ending-island");
    assert.equal(await p.evaluate(() => VivaFinal.active), false);
    assert.equal(await p.locator(".map-hotspot").count(), 5);
    await p.click("#map-reset");
    await p.click("[data-confirm]");
    await p.waitForURL("**#inicio");
    assert.equal(await p.evaluate(() => Raizes.won()), false);
    console.log(
      "PASS encerramento no próprio mapa, caminho, restauração, créditos e nova jornada",
    );
    assert.deepEqual(errors, []);
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
