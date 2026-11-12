"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  { chromium } = require("playwright-core");
const base =
  process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4189/jogo/viva/";
const out = "test-results/ilha-renascendo";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const [w, h] of [
      [1280, 720],
      [844, 390],
      [740, 320],
    ]) {
      const p = await b.newPage({
          viewport: { width: w, height: h },
          isMobile: w < 1000,
          hasTouch: w < 1000,
        }),
        errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("response", (r) => {
        if (r.status() >= 400) errors.push(r.status() + " " + r.url());
      });
      await p.clock.install();
      await p.goto(base + "index.html#mapa");
      await p.waitForFunction(() => document.body.dataset.uiReady === "true");
      await p.evaluate(() => BosqueMapa.ready());
      await p.clock.runFor(2500);
      const geometry = await p.locator(".map-stage").evaluate((e) => {
        const r = e.getBoundingClientRect();
        return {
          ratio: r.width / r.height,
          left: r.left,
          top: r.top,
          right: r.right,
          bottom: r.bottom,
        };
      });
      assert.ok(Math.abs(geometry.ratio - 1280 / 721) < 0.0001);
      assert.ok(
        geometry.left >= -0.1 &&
          geometry.top >= -0.1 &&
          geometry.right <= w + 0.1 &&
          geometry.bottom <= h + 0.1,
      );
      for (let id = 1; id <= 5; id++) {
        await p.evaluate((id) => {
          GuardiaoProgresso.finish(id);
          RaizesApp.refreshMap();
          BosqueMapa.update(
            Array.from({ length: id }, (_, i) => i + 1),
            id,
          );
        }, id);
        await p.evaluate(() => BosqueMapa.ready());
        const before = await p.evaluate(() => BosqueMapa.state());
        assert.equal(before.stage, id);
        assert.ok(before.progress < 0.05);
        await p.clock.runFor(2800);
        const mid = await p.evaluate(() => BosqueMapa.state());
        assert.ok(mid.progress > 0.2 && mid.progress < 0.7);
        await p.screenshot({ path: `${out}/etapa-${id}-durante-${w}.png` });
        await p.clock.runFor(3500);
        const match = await p.evaluate(async (id) => {
          BosqueMapa.paint(performance.now() / 1000, true);
          const actual = document.getElementById("living-island"),
            c = document.createElement("canvas");
          c.width = 1280;
          c.height = 721;
          const im = new Image();
          im.src = new URL(
            `../ilha-renascendo/assets/etapa-${id}.webp`,
            location.href,
          );
          await im.decode();
          const g = c.getContext("2d"),
            k = Math.min(1280 / im.naturalWidth, 721 / im.naturalHeight),
            w = im.naturalWidth * k,
            h = im.naturalHeight * k;
          g.fillStyle = "#235866";
          g.fillRect(0, 0, 1280, 721);
          g.drawImage(im, (1280 - w) / 2, (721 - h) / 2, w, h);
          const a = actual.getContext("2d").getImageData(0, 0, 1280, 721).data,
            d = g.getImageData(0, 0, 1280, 721).data;
          let error = 0;
          for (let i = 0; i < a.length; i++)
            error = Math.max(error, Math.abs(a[i] - d[i]));
          return error;
        }, id);
        assert.equal(
          match,
          0,
          "imagem final idêntica à etapa enviada, sem recortes ou mudanças de textura",
        );
        await p.screenshot({ path: `${out}/etapa-${id}-depois-${w}.png` });
      }
      await p.reload();
      await p.waitForFunction(() => document.body.dataset.uiReady === "true");
      await p.evaluate(() => BosqueMapa.ready());
      assert.equal(
        await p.evaluate(() => BosqueMapa.state().stage),
        5,
        "progresso persistido",
      );
      await p.evaluate(() => {
        BosqueMapa.finalGrowth(1);
        BosqueMapa.update([], 0);
        BosqueMapa.paint(performance.now() / 1000, true);
      });
      await p.evaluate(() => BosqueMapa.ready());
      assert.equal(await p.evaluate(() => BosqueMapa.state().stage), 0);
      assert.equal(await p.evaluate(() => BosqueMapa.state().finalGrowth), 0);
      assert.deepEqual(errors, []);
      await p.close();
      console.log(
        "PASS cinco restaurações, fidelidade de pixels, proporções, salvamento e reinício:",
        w,
        h,
      );
    }
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
