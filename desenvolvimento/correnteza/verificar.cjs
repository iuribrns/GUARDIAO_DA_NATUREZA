const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
const base =
  process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4189/jogo/viva/";
fs.mkdirSync("test-results/correnteza", { recursive: true });
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const mobile of [false, true]) {
      const p = await b.newPage({
        viewport: mobile
          ? { width: 844, height: 390 }
          : { width: 1280, height: 720 },
        isMobile: mobile,
        hasTouch: mobile,
      });
      const errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await p.addInitScript(() =>
        localStorage.setItem(
          "guardiao.mapa.progresso.v1",
          JSON.stringify({ completed: [1], current: 2 }),
        ),
      );
      await p.clock.install();
      await p.goto(new URL("../jornada/index.html?fase=2", base).href);
      await p.waitForFunction(() => window.GuardiaoJornada?.estado().ready);
      await p.locator("#intro-next").click();
      await p.locator("#intro-next").click();
      await p.clock.runFor(1700);
      assert.equal(
        (await p.evaluate(() => GuardiaoJornada.estado())).stage,
        "dressing",
      );
      const seen = [];
      for (let i = 0; i < 4; i++) {
        const s = await p.evaluate(async (i) => {
          const a = new GuardiaoAdventureArt(2);
          await a.load();
          const c = document.createElement("canvas");
          c.width = 180;
          c.height = 180;
          const g = c.getContext("2d");
          a.river(g, { x: 90, y: 150, direction: 6 }, 0, false, {
            dressing: true,
            progress: (i + 0.1) / 4,
          });
          return [...g.getImageData(0, 0, 180, 180).data].filter(
            (v, k) => k % 4 === 3 && v > 100,
          ).length;
        }, i);
        assert.ok(s > 1400, "pose de vestir visível " + i);
        seen.push(s);
        await p.clock.runFor(1100);
      }
      assert.ok(new Set(seen).size > 2);
      await p.clock.runFor(1800);
      assert.equal(
        (await p.evaluate(() => GuardiaoJornada.estado())).protective,
        true,
      );
      await p.evaluate(() => GuardiaoMochila.open());
      await p.locator("[data-pack-tab=uniforms]").click();
      assert.equal(await p.locator("[data-uniform]").count(), 5);
      assert.equal(
        await p.locator("[data-uniform].is-undiscovered").count(),
        3,
      );
      assert.equal(await p.locator("[data-uniform] clipPath").count(), 5);
      for (const e of await p
        .locator("[data-uniform] svg.bosque-uniform")
        .all())
        assert.equal(await e.locator("image").count(), 1);
      await p.screenshot({
        path: `test-results/correnteza/trajes-${mobile}.png`,
      });
      await p.locator("[data-pack-close]").click();
      await p.evaluate(async () => {
        document.querySelector("#colar-cena")?.remove();
        const c = new GuardiaoColar({
          phase: 2,
          life: { draw: (...a) => RaizesPersonagens.draw(...a) },
        });
        await c.load();
        c.earned = [1];
        c.begin(() => {});
        c.render(4, false);
        window.testReward = c;
      });
      assert.equal(
        await p.locator("#vitoria.reward-preview").isVisible(),
        true,
      );
      assert.equal(await p.locator("#colar-cena").isVisible(), false);
      await p.screenshot({
        path: `test-results/correnteza/conquista-${mobile}.png`,
      });
      await p.evaluate(() => {
        testReward.complete();
        document.getElementById("vitoria").showModal();
      });
      assert.equal(await p.locator("#vitoria.reward-preview").count(), 0);
      assert.equal(await p.locator("#vitoria[open]").count(), 1);
      assert.deepEqual(errors, []);
      await p.close();
      console.log(
        "PASS trajes individuais e bloqueios, quatro poses de vestir, uma conclusão:",
        mobile ? "celular" : "PC",
      );
    }
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
