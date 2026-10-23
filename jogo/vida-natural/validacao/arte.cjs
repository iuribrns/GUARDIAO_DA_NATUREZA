"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright-core");
const base =
  process.env.GUARDIAO_TEST_URL ||
  "http://127.0.0.1:5173/tela-inicial/nova-versao/";
const game = new URL("../../jogo/floresta-viva/index.html", base).href;
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const errors = [],
    requests = [];
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
    });
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(r.status() + " " + r.url());
    });
    page.on("request", (r) => requests.push(r.url()));
    await page.clock.install();
    await page.goto(game);
    await page.waitForFunction(() => window.GuardiaoFloresta?.estado().ready);
    const atlas = await page.evaluate(() =>
      Object.fromEntries(
        Object.entries(GuardiaoVidaAtlas).map(([name, s]) => [
          name,
          s.frames.length,
        ]),
      ),
    );
    assert.deepEqual(atlas, {
      "kai-andando": 32,
      "kai-mangueira": 32,
      flora: 16,
      fogo: 8,
    });
    const empty = await page.evaluate(async () => {
      const failures = [];
      for (const [name, sheet] of Object.entries(GuardiaoVidaAtlas)) {
        const im = new Image();
        im.src = new URL(
          "../vida-natural/assets/" + sheet.file,
          location.href,
        ).href;
        await im.decode();
        const c = document.createElement("canvas");
        c.width = c.height = 16;
        const ctx = c.getContext("2d");
        for (const [i, f] of sheet.frames.entries()) {
          if (
            f.bounds[0] < 0 ||
            f.bounds[1] < 0 ||
            f.bounds[0] + f.bounds[2] > im.naturalWidth ||
            f.bounds[1] + f.bounds[3] > im.naturalHeight
          )
            failures.push(name + ":" + i + " fora da prancha");
          ctx.clearRect(0, 0, 16, 16);
          ctx.drawImage(im, ...f.bounds, 0, 0, 16, 16);
          const pixels = ctx.getImageData(0, 0, 16, 16).data;
          if (!pixels.some((v, index) => index % 4 === 3 && v > 100))
            failures.push(name + ":" + i + " vazio");
        }
      }
      return failures;
    });
    assert.deepEqual(
      empty,
      [],
      "todos os 88 recortes têm arte dentro da prancha",
    );
    await page.locator("#conversa-avancar").click();
    await page.locator("#conversa-avancar").click();
    await page.clock.runFor(2100);
    await page.evaluate(() => {
      window.motionFrames = new Set();
      new MutationObserver(() =>
        motionFrames.add(document.body.dataset.motionFrame),
      ).observe(document.body, {
        attributes: true,
        attributeFilter: ["data-motion-frame"],
      });
    });
    await page.keyboard.down("s");
    await page.clock.runFor(650);
    await page.keyboard.up("s");
    const frames = await page.evaluate(() => [...motionFrames].map(Number));
    assert.ok(
      new Set(frames).size >= 4,
      "a caminhada usa os quatro novos quadros da direção",
    );
    assert.ok(
      frames.every((n) => n >= 24 && n <= 27),
      "a direção sul usa a linha correta",
    );
    await page.clock.runFor(8000);
    assert.equal(
      (await page.evaluate(() => GuardiaoFloresta.estado())).flora.mode,
      "ombro",
    );
    assert.ok(
      [12, 13].includes(
        Number(await page.locator("body").getAttribute("data-flora-frame")),
      ),
      "Flora usa os novos quadros de repouso",
    );
    await page.locator("#pausa").click();
    const before = await page.locator("body").getAttribute("data-flora-frame");
    await page.clock.runFor(1000);
    assert.equal(
      await page.locator("body").getAttribute("data-flora-frame"),
      before,
      "a animação da fase fica congelada na pausa",
    );
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.clock.runFor(6000);
    assert.equal(
      await page.locator("body").getAttribute("data-flora-frame"),
      "12",
      "sem piscadas decorativas quando movimento é reduzido",
    );
    assert.ok(
      requests.some((u) =>
        u.includes("/vida-natural/assets/floresta-inicio.webp"),
      ),
      "a pintura com luz está no jogo",
    );
    assert.ok(
      !requests.some((u) =>
        /\/otimizados\/(kai-caminhada-suave|flora-suave|fogo-suave)-/.test(u),
      ),
      "as pranchas substituídas não são baixadas de novo",
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: 88 sprites reais, quatro quadros por direção, repouso de Flora, pausa, movimento reduzido, cenário novo e ausência de downloads duplicados.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
