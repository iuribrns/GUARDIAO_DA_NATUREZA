"use strict";
const assert = require("node:assert/strict"),
  { chromium } = require("playwright-core");
const base = new URL(
  "../",
  process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4189/jogo/viva/",
);
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 844, height: 390 },
      isMobile: true,
      hasTouch: true,
    });
    await context.addInitScript(() => {
      localStorage.setItem(
        "guardiao.mapa.progresso.v1",
        JSON.stringify({ completed: [1], current: 2 }),
      );
    });
    let blocked = false,
      restored = false;
    const errors = [];
    await context.route(
      "**/reencontro/assets/explorador.webp",
      async (route) => {
        blocked = true;
        await gate;
        await route.continue();
      },
    );
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (r.url().endsWith("/rio-depois.webp")) restored = true;
    });
    const swimming = page.waitForRequest("**/rio-claro/assets/kai-nado.webp");
    const dressing = page.waitForRequest(
      "**/jornada-final/assets/vestir-traje.webp",
    );
    await page.goto(new URL("jornada/index.html?fase=2", base).href, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForSelector("#guardiao-game");
    const frame = page.frame({ name: "guardiao-game" });
    await Promise.all([swimming, dressing]);
    await frame.waitForFunction(
      () => window.GuardiaoCarregamento?.state().done > 0,
    );
    await page.waitForTimeout(250);
    assert.ok(blocked);
    assert.equal(
      restored,
      false,
      "restauração não disputa a conexão enquanto há recursos obrigatórios pendentes",
    );
    const loading = await frame.evaluate(() => GuardiaoCarregamento.state());
    assert.ok(loading.percent < 100 && !loading.finished);
    assert.equal(await frame.locator("#loading").isVisible(), true);
    assert.ok(
      !(
        await frame.locator("#loading [data-load-status]").textContent()
      ).startsWith("Pronto:"),
    );
    release();
    await frame.waitForFunction(
      () => document.body.dataset.gameReady === "true",
    );
    assert.equal(await frame.locator("#loading").isVisible(), false);
    assert.ok(
      await frame.evaluate(() =>
        GuardiaoCarregamento.state().stages.every((s) => s.status === "ready"),
      ),
    );
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      "PASS nado e traje carregam em paralelo; restauração espera a fase; progresso real preservado",
    );
  } finally {
    release();
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
