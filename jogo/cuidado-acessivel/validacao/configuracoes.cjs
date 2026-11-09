"use strict";
const assert = require("node:assert/strict"),
  { chromium } = require("playwright-core");
const base =
  process.env.GUARDIAO_TEST_URL ||
  "http://127.0.0.1:5173/tela-inicial/nova-versao/";
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const viewport of [
      { width: 844, height: 390 },
      { width: 667, height: 375 },
      { width: 740, height: 320 },
      { width: 1280, height: 720 },
    ]) {
      const p = await b.newPage({ viewport });
      const errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await p.goto(base + "configuracoes.html");
      await p.waitForFunction(
        () => document.querySelectorAll(".settings-tabs button").length === 3,
      );
      assert.equal(
        await p.getByRole("link", { name: /Conhecer o jogo/ }).count(),
        0,
      );
      for (let i = 0; i < 3; i++) {
        await p.locator("#settings-tab-" + i).focus();
        await p.keyboard.press("Enter");
        assert.equal(
          await p.locator("#preferences fieldset:visible").count(),
          1,
        );
        assert.equal(await p.locator("#settings-panel-" + i).isVisible(), true);
        const dimensions = await p
          .locator("#settings-panel-" + i)
          .evaluate((e) => ({
            visible: e.clientHeight,
            content: e.scrollHeight,
          }));
        assert.ok(
          dimensions.content <= dimensions.visible + 2,
          "ajustes da aba cabem sem rolagem",
        );
        const r = await p.locator(".settings-tabs").boundingBox();
        assert.ok(r.x >= 0 && r.x + r.width <= viewport.width + 1);
      }
      await p.locator("#settings-tab-0").focus();
      await p.keyboard.press("ArrowRight");
      assert.equal(
        await p.locator("#settings-tab-1").getAttribute("aria-selected"),
        "true",
      );
      await p.locator("#largeText").focus();
      const old = await p.locator("#largeText").isChecked();
      await p.keyboard.press("Enter");
      assert.equal(
        await p.locator("#largeText").isChecked(),
        !old,
        "Enter alterna um ajuste e salva",
      );
      await p.reload();
      await p.locator("#settings-tab-1").click();
      assert.equal(await p.locator("#largeText").isChecked(), !old);
      await p.goto(base + "sobre.html");
      assert.equal(
        await p.getByRole("link", { name: /Ver as missões/ }).count(),
        0,
      );
      await p.locator("#tab-team").click();
      assert.match(
        await p.locator("#team").textContent(),
        /Iuri Barroso Nascimento/,
      );
      assert.match(
        await p.locator("#team").textContent(),
        /Hicham Mohamed El Attar/,
      );
      assert.deepEqual(errors, []);
      await p.close();
      console.log(
        "PASS: abas, Enter nos ajustes e autoria " +
          viewport.width +
          "×" +
          viewport.height,
      );
    }
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
