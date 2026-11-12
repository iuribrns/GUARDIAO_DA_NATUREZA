const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  { chromium } = require("playwright-core");
const base =
  process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:5180/jogo/viva/";
const out = "test-results/arte-viva";
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
    ]) {
      const p = await b.newPage({
          viewport: { width, height },
          isMobile: width < 1000,
          hasTouch: width < 1000,
        }),
        errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("response", (r) => {
        if (r.status() >= 400) errors.push(r.status() + " " + r.url());
      });
      await p.goto(base);
      await p.waitForFunction(
        () => window.ArteVivaAmbiente?.state().time > 0.1,
      );
      await p.waitForFunction(
        () => document.querySelector(".home-landscape")?.naturalWidth > 1000,
      );
      await p.screenshot({ path: `${out}/inicio-${width}.png` });
      assert.equal(
        await p.evaluate(() => ArteVivaAtlas.flora.frames.length),
        28,
      );
      const centered = await p.locator("#fs-toggle").evaluate((b) => {
        const a = b.getBoundingClientRect(),
          r = b.querySelector("svg").getBoundingClientRect();
        return Math.hypot(
          a.x + a.width / 2 - r.x - r.width / 2,
          a.y + a.height / 2 - r.y - r.height / 2,
        );
      });
      assert.ok(centered < 2, "ícone de tela cheia centralizado");
      await p.locator("#play-game").click();
      await p.waitForURL("**/#mapa");
      await p.evaluate(() => BosqueMapa.ready());
      await p.waitForFunction(() => !VivaTransicao.state().busy);
      assert.equal(await p.locator("[data-phase]").count(), 5);
      assert.ok(
        await p.evaluate(
          () => document.scrollingElement.scrollHeight <= innerHeight + 1,
        ),
        "mapa não cria rolagem da página",
      );
      for (const selector of [
        ".map-title-plaque h1",
        ...Array.from(
          { length: 5 },
          (_, i) => `[data-phase="${i + 1}"] .map-region-name`,
        ),
      ]) {
        const fit = await p.locator(selector).evaluate((e) => {
          const a = e.getBoundingClientRect(),
            r = e.parentElement.getBoundingClientRect();
          return (
            a.x >= r.x - 1 &&
            a.right <= r.right + 1 &&
            a.y >= r.y - 1 &&
            a.bottom <= r.bottom + 1
          );
        });
        assert.ok(fit, selector + " dentro da placa");
      }
      await p.screenshot({ path: `${out}/mapa-${width}.png` });
      for (const view of ["sobre", "configuracoes"]) {
        await p.goto(base + "index.html#" + view);
        await p.waitForTimeout(500);
        if (view === "sobre")
          assert.ok(
            await p.locator(".journal-friends").evaluate((e) => {
              const r = e.getBoundingClientRect(),
                a = e.querySelector("canvas").getBoundingClientRect();
              return a.bottom < r.bottom && a.width > r.width * 0.9;
            }),
            "banner inteiro, sem recortar os personagens",
          );
        await p.screenshot({ path: `${out}/${view}-${width}.png` });
      }
      await p.goto(new URL("../floresta-viva/index.html", base).href);
      await p.waitForFunction(() => window.GuardiaoFloresta?.estado().ready);
      await p.waitForTimeout(900);
      await p.clock.install();
      await p.clock.pauseAt(new Date());
      await p.evaluate(async () => {
        document.querySelectorAll("dialog[open]").forEach((e) => e.close());
        document.querySelector("#colar-cena")?.remove();
        const life = { draw: (...args) => RaizesPersonagens.draw(...args) },
          c = new GuardiaoColar({ phase: 5, life });
        await c.load();
        await RaizesPersonagens.load(["acoes"]);
        c.earned = [1, 2, 3, 4];
        c.begin(() => {});
        await RaizesPersonagens.load(["acoes"]);
        if (!c.celebrationReady)
          throw Error("Pose clássica da quinta conquista não carregou");
        c.render(4, false);
      });
      const card = await p.locator("#vitoria").boundingBox();
      assert.ok(
        card.x >= 0 &&
          card.y >= 0 &&
          card.x + card.width <= width &&
          card.y + card.height <= height,
      );
      assert.equal(await p.locator(".colar-pedras .obtained").count(), 5);
      assert.ok(
        await p
          .locator("#colar-frase")
          .evaluate((e) => getComputedStyle(e).color === "rgb(103, 71, 44)"),
        "legenda escura sobre pergaminho",
      );
      await p.screenshot({
        path: `${out}/colar-${width}.png`,
        animations: "disabled",
      });
      assert.deepEqual(errors, []);
      await p.close();
      console.log(
        "PASS arte original, placas, banners, ícones e conquista " +
          width +
          "x" +
          height,
      );
    }
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
