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
    await page.goto(base + "aventura.html");
    await page.waitForFunction(
      () => document.body.dataset.floraMapReady === "true",
    );
    const result = await page.evaluate(async () => {
      const s = GuardiaoVidaAtlas.flora,
        im = new Image();
      im.src = new URL(
        s.file,
        new URL("../../jogo/vida-natural/assets/", location.href),
      ).href;
      await im.decode();
      const c = document.createElement("canvas");
      c.width = s.width;
      c.height = s.height;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(im, 0, 0);
      const pixels = ctx.getImageData(0, 0, c.width, c.height).data;
      const failures = [];
      const used = new Uint8Array(c.width * c.height);
      for (const [i, f] of s.frames.entries()) {
        const [x, y, w, h] = f.bounds;
        if (
          Math.min(x, y) < 12 ||
          x + w > c.width - 12 ||
          y + h > c.height - 12
        )
          failures.push("margem " + i);
        let visible = 0;
        for (let yy = y - 10; yy < y + h + 10; yy++)
          for (let xx = x - 10; xx < x + w + 10; xx++) {
            const alpha = pixels[(yy * c.width + xx) * 4 + 3];
            if (xx >= x && xx < x + w && yy >= y && yy < y + h) {
              used[yy * c.width + xx] = 1;
              if (alpha > 100) visible++;
            } else if (alpha > 0) failures.push("parte vizinha " + i);
          }
        if (visible < 1000) failures.push("pose vazia " + i);
      }
      if (used.some((v, i) => !v && pixels[i * 4 + 3] > 0))
        failures.push("resíduo fora das poses");
      return {
        failures,
        count: s.frames.length,
        file: s.file,
        width: im.naturalWidth,
        height: im.naturalHeight,
      };
    });
    assert.deepEqual(result.failures, []);
    assert.equal(result.count, 16);
    assert.match(result.file, /encanto-natural/);
    const frames = await page.evaluate(async () => {
      const c = document.querySelector("#map-flora canvas");
      const hash = () =>
        Array.from(
          c.getContext("2d").getImageData(0, 0, c.width, c.height).data,
        ).reduce((a, x, i) => (a + x * (i % 101)) % 1000000007, 0);
      const frames = [];
      for (const time of [0, 4.6]) {
        GuardiaoAtores.flora(c, time, false);
        frames.push({ frame: c.dataset.frame, hash: hash() });
      }
      GuardiaoAtores.flora(c, 4.6, true);
      frames.push({ frame: c.dataset.frame, hash: hash() });
      return frames;
    });
    assert.equal(frames[0].frame, "12");
    assert.equal(frames[1].frame, "13");
    assert.notEqual(frames[0].hash, frames[1].hash);
    assert.equal(frames[2].frame, "12");
    await page.locator("#map-flora").click();
    assert.equal(await page.locator("#flora-map-speech").isVisible(), true);
    await page.waitForTimeout(4500);
    assert.equal(await page.locator("#flora-map-speech").isVisible(), false);
    await page.goto(base + "configuracoes.html");
    assert.equal(await page.locator('img[src*="flora-180-"]').count(), 0);
    assert.ok(
      (await page
        .locator('img[src*="encanto-natural/assets/flora-retrato"]')
        .count()) >= 1,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: 16 poses novas de Flora sem cortes ou resíduos, atlas ativo, piscada real, movimento reduzido, dica temporária e retrato de configurações.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
