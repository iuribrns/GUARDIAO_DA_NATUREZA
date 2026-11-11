"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright-core");
const base =
  process.env.GUARDIAO_TEST_URL ||
  "http://127.0.0.1:4173/tela-inicial/nova-versao/";
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 844, height: 390 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(r.status() + " " + r.url());
    });
    await page.addInitScript(() =>
      localStorage.setItem(
        "guardiao.mapa.progresso.v1",
        JSON.stringify({ completed: [1, 2, 3, 4, 5], current: 1 }),
      ),
    );
    const backgrounds = ["floresta", "rio", "fauna", "plantio", "cidade"];
    for (let id = 1; id <= 5; id++) {
      await page.goto(base + "aventura.html?destino=" + id);
      await page.waitForFunction(
        (id) =>
          document.querySelector("#phase-dialog").open &&
          document.querySelector("#phase-dialog").dataset.briefPhase ===
            String(id),
        id,
      );
      assert.equal(
        await page.locator("#phase-number").textContent(),
        "FASE " + id,
      );
      const bg = await page
        .locator("#phase-dialog")
        .evaluate((e) => e.style.getPropertyValue("--meeting-background"));
      assert.ok(
        bg.endsWith(backgrounds[id - 1] + '.webp")'),
        "pintura corresponde ao destino automático " + id,
      );
      assert.equal(
        await page.locator("[data-map-action=start]").isEnabled(),
        true,
      );
      assert.equal(
        (await page.locator(".brief-loot-art svg").count()) > 0,
        true,
      );
      await page.locator("[data-map-action=close]").click();
    }
    await page.evaluate(() => GuardiaoPaineis.abrir({ id: 6 }));
    await page.waitForFunction(
      () => document.querySelector("#phase-dialog").dataset.briefPhase === "6",
    );
    assert.equal(await page.locator("#phase-number").textContent(), "EPÍLOGO");
    assert.equal(
      await page
        .locator(".phase-loot > div:last-child .brief-loot-art svg")
        .count(),
      5,
    );
    assert.equal(await page.locator(".meeting-mascot").count(), 1);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: cinco destinos automáticos com título, pintura, itens e cristal corretos; abertura programática do epílogo com Flora e cinco fragmentos.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
