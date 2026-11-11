"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  { chromium } = require("playwright-core");
const base =
    process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4173/jogo/viva/",
  root = new URL("../../", base),
  out =
    process.env.GUARDIAO_ARTIFACTS ||
    path.resolve("test-results/trilhas-vivas");
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const p = await b.newPage({
        viewport: { width: 844, height: 390 },
        hasTouch: true,
        isMobile: true,
      }),
      errors = [],
      requests = [];
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("request", (r) => requests.push(new URL(r.url()).pathname));
    await p.route("**/jogo/viva/assets/inicio.webp*", (r) => r.abort());
    await p.goto(base);
    await p.waitForFunction(() => document.body.dataset.uiReady === "true");
    assert.match(
      await p
        .locator(".backdrop")
        .evaluate((el) => getComputedStyle(el).backgroundImage),
      /data:image\/webp/,
    );
    assert.ok(await p.locator("#play-game").isVisible());
    await p.unroute("**/jogo/viva/assets/inicio.webp*");
    await p.reload();
    await p.waitForFunction(
      () => document.querySelector(".home-landscape")?.naturalWidth > 1000,
    );
    await p.click("#play-game");
    await p.waitForFunction(() => location.hash === "#mapa");
    await p.waitForFunction(() => window.BosqueVegetacao.ready);
    await p.clock.install();
    await p.evaluate(() => {
      GuardiaoProgresso.finish(1);
      RaizesApp.refreshMap();
      BosqueMapa.update([1], 1);
    });
    const before = await p.evaluate(() =>
      BosqueMapa.health(1, 800, 130, false),
    );
    assert.ok(before < 0.04);
    await p.clock.runFor(1500);
    const during = await p.evaluate(() =>
      BosqueMapa.health(1, 800, 130, false),
    );
    assert.ok(during > before && during < 0.9);
    await p.screenshot({ path: out + "/mapa-crescimento.png" });
    await p.clock.runFor(5000);
    assert.equal(
      await p.evaluate(() => BosqueMapa.health(1, 800, 130, false)),
      1,
    );
    assert.equal(
      await p
        .locator(
          "#island-restoration image,#tree-restoration image,#island-ash",
        )
        .count(),
      0,
    );
    await p.screenshot({ path: out + "/mapa-regiao-restaurada.png" });
    await p.evaluate(() => {
      GuardiaoProgresso.finish(2);
      GuardiaoProgresso.finish(3);
    });
    await p.goto(new URL("jogo/jornada/index.html?fase=4", root).href);
    await p.waitForFunction(() => document.body.dataset.gameReady === "true");
    await p.click("#intro-next");
    await p.click("#intro-next");
    await p.clock.runFor(2500);
    assert.equal(
      await p.evaluate(() => document.body.dataset.kaiUniform),
      "plantio",
    );
    await p.keyboard.down("d");
    const steps = [];
    for (let i = 0; i < 16; i++) {
      await p.clock.runFor(65);
      steps.push(await p.evaluate(() => document.body.dataset.kaiWalkFrame));
    }
    await p.keyboard.up("d");
    assert.equal(
      new Set(steps).size,
      6,
      "as seis passadas aparecem durante o movimento real",
    );
    await p.click('[data-goal="bed"]');
    for (let i = 0; i < 120; i++) {
      const s = await p.evaluate(() => GuardiaoJornada.estado());
      if (s.routePending)
        await p.waitForFunction(() => !GuardiaoJornada.estado().routePending);
      if (!s.route.length && !s.routePending) break;
      await p.clock.runFor(250);
    }
    await p.keyboard.press("Enter");
    await p.clock.runFor(400);
    assert.equal(
      await p.evaluate(() => document.body.dataset.kaiUniform),
      "plantio",
    );
    assert.equal(await p.evaluate(() => document.body.dataset.kaiAction), "1");
    await p.screenshot({ path: out + "/kai-plantando.png" });
    await p.clock.runFor(2000);
    assert.ok(
      await p.evaluate(() =>
        GuardiaoJornada.estado().tasks.some((t) => t.status === "seeded"),
      ),
    );
    await p.keyboard.press("Enter");
    await p.clock.runFor(600);
    assert.equal(
      await p.evaluate(() => document.body.dataset.kaiUniform),
      "plantio",
    );
    assert.equal(await p.evaluate(() => document.body.dataset.kaiAction), "2");
    await p.screenshot({ path: out + "/kai-regando.png" });
    await p.clock.runFor(6000);
    assert.ok(
      await p.evaluate(() =>
        GuardiaoJornada.estado().tasks.some(
          (t) => t.type === "bed" && t.status === "done",
        ),
      ),
    );
    await p.screenshot({ path: out + "/primeira-arvore.png" });
    const turtle = await p.evaluate(() => {
      const d = GuardiaoFasesJogaveis[2],
        t = d.tasks.find((t) => t.id === "tartaruga");
      return {
        x: t.x,
        y: t.y,
        swimming: new GuardiaoNavegacao.Navigation(d).swimming(t),
      };
    });
    assert.deepEqual(turtle, { x: 930, y: 440, swimming: false });
    assert.ok(
      !requests.some((url) =>
        /mapa-(vivo|cinzas)|floresta-(ilustrada|restaurada)|\/(floresta|rio|fauna|plantio|cidade)-restaurado-/.test(
          url,
        ),
      ),
      "nenhum mapa de antes/depois baixado",
    );
    const a = JSON.parse(fs.readFileSync("jogo/bosque-vivo/assets/atlas.json"));
    for (const [name, d] of Object.entries(a))
      for (const f of d.frames) {
        assert.ok(f.bounds[0] >= 0 && f.bounds[1] >= 0);
        assert.ok(
          f.bounds[0] + f.bounds[2] <= d.width &&
            f.bounds[1] + f.bounds[3] <= d.height,
          name + ": quadro contido na prancha",
        );
      }
    assert.deepEqual(errors, []);
    console.log(
      "PASS fundo com falha de rede, restauração por elementos, seis passadas, traje durante plantar/regar, crescimento real e tartaruga na areia.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
