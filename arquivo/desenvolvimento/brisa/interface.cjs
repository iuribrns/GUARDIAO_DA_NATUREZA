"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  { chromium } = require("playwright-core");
const base =
    process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4173/jogo/viva/",
  root = new URL("../../", base),
  artifacts =
    process.env.GUARDIAO_ARTIFACTS || path.resolve("test-results/brisa");
fs.mkdirSync(artifacts, { recursive: true });
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const errors = [];
    for (const [width, height] of [
      [1280, 720],
      [844, 390],
      [740, 320],
      [667, 375],
    ]) {
      const p = await b.newPage({
        viewport: { width, height },
        hasTouch: width < 1000,
        isMobile: width < 1000,
      });
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("response", (r) => {
        if (r.status() >= 400) errors.push(r.status() + " " + r.url());
      });
      await p.goto(base + "index.html");
      await p.waitForFunction(
        () =>
          document.body.dataset.uiReady === "true" &&
          document.body.dataset.transition === "pronta",
      );
      assert.notEqual(
        await p
          .locator(".game-logo")
          .evaluate((e) => getComputedStyle(e).animationName),
        "none",
      );
      assert.ok((await p.evaluate(() => VivaFolhas.state())).count >= 24);
      const start = await p.evaluate(() => VivaFolhas.state().burstCount);
      if (width === 1280) await p.locator("#play-game").hover();
      else
        await p
          .locator("#play-game")
          .dispatchEvent("pointerdown", { pointerType: "touch" });
      assert.ok(
        (await p.evaluate(() => VivaFolhas.state())).burstCount > start,
      );
      const before = Date.now();
      await p.click("#play-game");
      await p.waitForTimeout(350);
      assert.equal(await p.evaluate(() => location.hash), "");
      await p.waitForFunction(() => document.body.dataset.view === "mapa");
      assert.ok(
        Date.now() - before >= 700,
        "a cobertura deve ser visível antes da troca",
      );
      await p.waitForFunction(() => !VivaTransicao.state().busy);
      assert.ok(
        Date.now() - before >= 1550,
        "travessia deve durar aproximadamente 1,6 s",
      );
      const url = p.url();
      await p.click("#map-backpack");
      assert.equal(await p.locator("#mochila-jornada").isVisible(), true);
      assert.equal(p.url(), url);
      assert.equal(await p.locator("[data-item]").count(), 16);
      assert.ok((await p.locator(".is-undiscovered").count()) > 0);
      assert.equal(
        await p.locator("#mochila-jornada [data-pack-equip]").count(),
        0,
      );
      for (const tab of ["items", "crystals", "uniforms"]) {
        await p.click('[data-pack-tab="' + tab + '"]');
        const r = await p.locator("#mochila-jornada").boundingBox();
        assert.ok(
          r.x >= 0 &&
            r.y >= 0 &&
            r.x + r.width <= width + 1 &&
            r.y + r.height <= height + 1,
        );
        assert.equal(
          await p.evaluate(
            () => document.scrollingElement.scrollHeight <= innerHeight + 1,
          ),
          true,
        );
      }
      if (width === 844)
        await p.screenshot({
          path: path.join(artifacts, "trajes-celular.png"),
        });
      await p.click("[data-pack-close]");
      await p.click('[data-phase="1"]');
      await p.waitForFunction(() => VivaArt.images.has("encontros"));
      assert.equal(await p.locator("#phase-items .brisa-icon").count(), 3);
      await p.waitForTimeout(120);
      if (width === 844)
        await p.screenshot({
          path: path.join(artifacts, "previa-celular.png"),
        });
      await p.click("#close-phase");
      await p.goto(base + "index.html#configuracoes");
      await p.waitForFunction(
        () => document.body.dataset.transition === "pronta",
      );
      await p.click('[data-setting-tab="controles"]');
      assert.equal(await p.isChecked("[name=calmPace]"), true);
      await p.uncheck("[name=calmPace]");
      assert.equal(await p.evaluate(() => BrisaRitmo.speed), 1);
      await p.check("[name=calmPace]");
      assert.equal(await p.evaluate(() => BrisaRitmo.speed), 0.82);
      await p.click("#fs-toggle");
      await p.waitForFunction(() => !!document.fullscreenElement);
      assert.equal(await p.locator("#fs-toggle .brisa-full").count(), 1);
      await p.click("#fs-toggle");
      await p.waitForFunction(() => !document.fullscreenElement);
      assert.equal(await p.locator("#fs-toggle .brisa-full").count(), 1);
      await p.goto(new URL("jogo/floresta-viva/index.html", root).href);
      await p.waitForFunction(() => document.body.dataset.gameReady === "true");
      await p.click("#conversa-avancar");
      await p.click("#conversa-avancar");
      await p.waitForFunction(() => GuardiaoFloresta.estado().itemsGiven);
      await p.click("#mochila");
      assert.equal(await p.locator(".brisa-pack[open]").count(), 1);
      assert.equal(
        await p.locator('[data-item="mangueira"].is-known').count(),
        1,
      );
      assert.ok((await p.locator("[data-item].is-undiscovered").count()) > 0);
      const position = await p.evaluate(() => GuardiaoFloresta.estado().player);
      await p.waitForTimeout(200);
      assert.deepEqual(
        await p.evaluate(() => GuardiaoFloresta.estado().player),
        position,
      );
      if (width === 844)
        await p.screenshot({
          path: path.join(artifacts, "ferramentas-celular.png"),
        });
      await p.click('[data-pack-equip="mangueira"]');
      await p.waitForFunction(() => GuardiaoFloresta.estado().equipped);
      await p.click("#pausa");
      assert.equal(await p.locator("#menu-pausa nav > *").count(), 3);
      const pause = await p.locator("#menu-pausa").boundingBox();
      assert.ok(
        pause.x >= 0 &&
          pause.y >= 0 &&
          pause.x + pause.width <= width + 1 &&
          pause.y + pause.height <= height + 1,
      );
      if (width === 844)
        await p.screenshot({ path: path.join(artifacts, "pausa-celular.png") });
      await p.click("[data-adjust]");
      await p.click('[data-setting-tab="controles"]');
      await p.selectOption("[name=controlMode]", "touch");
      assert.equal(await p.locator("#joystick").isVisible(), true);
      if (width === 844)
        await p.screenshot({
          path: path.join(artifacts, "ajustes-celular.png"),
        });
      for (const selector of [
        "#joystick",
        "#mangueira",
        "#interagir",
        "#app-fullscreen",
        "#mochila",
        "#pausa",
      ]) {
        const r = await p.locator(selector).boundingBox();
        assert.ok(
          r &&
            r.x >= -1 &&
            r.y >= -1 &&
            r.x + r.width <= width + 1 &&
            r.y + r.height <= height + 1,
          selector + " dentro da tela",
        );
      }
      await p.click("#phase-settings header button");
      assert.equal(
        await p.evaluate(() => GuardiaoFloresta.estado().paused),
        false,
      );
      await p.close();
      console.log(
        "PASS Brisa: folhas, tempo de transição, mochila/silhuetas, trajes, ritmo, tela cheia e pausa",
        width + "x" + height,
      );
    }
    assert.deepEqual(errors, []);
    const atlas = JSON.parse(fs.readFileSync("jogo/brisa/assets/atlas.json"));
    for (const [bank, d] of Object.entries(atlas))
      for (const f of d.frames) {
        const [x, y, w, h] = f.bounds;
        assert.ok(
          x >= 0 &&
            y >= 0 &&
            w > 0 &&
            h > 0 &&
            x + w <= d.width &&
            y + h <= d.height,
          bank + " " + f.name,
        );
      }
    console.log("PASS limites de todos os sprites de interface e botânica");
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
