const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  { chromium } = require("playwright-core");
const base =
  process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4189/jogo/viva/";
const out = "test-results/mapa-ferido";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const [width, height] of [
      [1280, 720],
      [844, 390],
      [740, 320],
      [667, 375],
      [932, 430],
    ]) {
      const p = await b.newPage({
          viewport: { width, height },
          isMobile: width < 1000,
          hasTouch: width < 1000,
        }),
        errors = [],
        requests = [];
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("response", (r) => {
        if (r.status() >= 400) errors.push(r.status() + " " + r.url());
      });
      p.on("request", (r) => requests.push(r.url()));
      await p.goto(base + "index.html#mapa");
      await p.waitForFunction(() => document.body.dataset.uiReady === "true");
      await p.evaluate(() => BosqueMapa.ready());
      assert.equal(
        await p.evaluate(() => MapaFerido.prepare()),
        true,
        "retrato próprio carregado",
      );
      await p.waitForFunction(() => !VivaTransicao.state().busy);
      await p.waitForFunction(
        () =>
          Number(
            getComputedStyle(document.querySelector(".map-view")).opacity,
          ) > 0.99,
      );
      const states = () =>
        p
          .locator(".map-hotspot")
          .evaluateAll((bs) => bs.map((b) => b.dataset.regionState));
      assert.deepEqual(await states(), [
        "atual",
        "distante",
        "distante",
        "distante",
        "distante",
      ]);
      const sizes = await p.locator(".map-hotspot").evaluateAll((bs) =>
        bs.map((b) => {
          const r = b.getBoundingClientRect(),
            n = b.querySelector(".map-region-name"),
            field = n.getBoundingClientRect();
          const lines = [...n.children].map((e) => {
            const range = document.createRange();
            range.selectNodeContents(e);
            return range.getBoundingClientRect();
          });
          const top = Math.min(...lines.map((r) => r.top)),
            bottom = Math.max(...lines.map((r) => r.bottom));
          return {
            w: r.width,
            h: r.height,
            font: getComputedStyle(n).fontFamily,
            inside: lines.every(
              (t) =>
                t.left >= r.left &&
                t.right <= r.right &&
                t.top >= r.top &&
                t.bottom <= r.bottom,
            ),
            dx: Math.max(
              ...lines.map((t) =>
                Math.abs(t.x + t.width / 2 - field.x - field.width / 2),
              ),
            ),
            dy: Math.abs((top + bottom) / 2 - field.y - field.height / 2),
          };
        }),
      );
      for (const size of sizes) {
        assert.ok(size.inside, "texto inteiro dentro da placa");
        assert.ok(
          size.dx < 1 && size.dy < 1,
          "linhas centralizadas na horizontal e vertical",
        );
        assert.match(size.font, /Lilita/);
        if (width < 1000) {
          assert.ok(size.w <= 161 && size.h <= 59, "placas menores no celular");
          assert.ok(size.h >= 44, "alvo de toque preservado");
        }
      }
      if (await p.locator("#flora-map-line").isVisible()) {
        assert.ok(
          await p.locator("#flora-map-line").evaluate((e) => {
            const a = e.getBoundingClientRect();
            return [
              ...document.querySelectorAll(".map-region-name .map-name-line"),
            ].every((line) => {
              const b = line.getBoundingClientRect();
              return (
                a.right <= b.left ||
                a.left >= b.right ||
                a.bottom <= b.top ||
                a.top >= b.bottom
              );
            });
          }),
          "fala da Flora não encobre os nomes das fases",
        );
      }
      assert.ok(
        await p.evaluate(
          () => document.scrollingElement.scrollHeight <= innerHeight + 1,
        ),
        "sem rolagem da página",
      );
      const map = await p.locator(".map-stage").boundingBox();
      assert.ok(
        map.x >= -1 &&
          map.y >= -1 &&
          map.x + map.width <= width + 1 &&
          map.y + map.height <= height + 1,
        "ilha inteira",
      );
      await p.screenshot({ path: `${out}/inicial-${width}.png` });
      await p.locator('[data-phase="5"]').dispatchEvent("click");
      assert.equal(
        (await states())[4],
        "distante",
        "abrir a prévia não recupera a placa",
      );
      assert.equal(
        await p.locator("#start-phase").getAttribute("aria-disabled"),
        "true",
      );
      await p.locator("#close-phase").click();
      await p.evaluate(() => {
        GuardiaoProgresso.finish(1);
        RaizesApp.refreshMap();
      });
      assert.deepEqual(await states(), [
        "recuperada",
        "atual",
        "distante",
        "distante",
        "distante",
      ]);
      await p.screenshot({ path: `${out}/primeira-concluida-${width}.png` });
      await p.reload();
      await p.waitForFunction(() => document.body.dataset.uiReady === "true");
      assert.deepEqual(
        await states(),
        ["recuperada", "atual", "distante", "distante", "distante"],
        "estado acompanha o progresso salvo",
      );
      await p.locator("#map-reset").click();
      await p.locator("#ra-reset [data-confirm]").click();
      await p.waitForURL("**#inicio");
      await p.locator("#play-game").click();
      await p.waitForURL("**#mapa");
      await p.waitForFunction(() => !VivaTransicao.state().busy);
      assert.deepEqual(
        await states(),
        ["atual", "distante", "distante", "distante", "distante"],
        "reinício devolve o aspecto destruído às fases futuras",
      );
      assert.ok(
        requests.some((url) =>
          url.includes("/mapa-ferido/assets/mapa-antes.webp"),
        ),
      );
      assert.ok(
        requests.some((url) =>
          url.includes("/mapa-ferido/assets/kai-retrato.webp"),
        ),
      );
      assert.deepEqual(errors, []);
      await p.close();
      console.log(
        `PASS mapa destruído, placas por progresso, texto centralizado, retrato e reinício ${width}x${height}`,
      );
    }
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
