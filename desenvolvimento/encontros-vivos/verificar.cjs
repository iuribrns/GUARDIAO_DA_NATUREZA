const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
const base =
  process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4189/jogo/viva/";
fs.mkdirSync("test-results/encontros-vivos", { recursive: true });
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const [w, h] of [
      [1280, 720],
      [844, 390],
    ]) {
      const p = await b.newPage({
          viewport: { width: w, height: h },
          isMobile: w < 1000,
          hasTouch: w < 1000,
        }),
        errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("response", (r) => {
        if (r.status() >= 400) errors.push(r.status() + r.url());
      });
      await p.addInitScript(() => {
        localStorage.setItem(
          "guardiao.mapa.progresso.v1",
          JSON.stringify({ completed: [1, 2, 3, 4, 5], current: 5 }),
        );
        localStorage.setItem("guardiao.viva.final.v1", "visto");
      });
      await p.goto(base + "index.html#mapa");
      await p.waitForFunction(() => document.body.dataset.uiReady === "true");
      await p.evaluate(() => BosqueMapa.ready());
      await p.waitForFunction(() => !VivaTransicao.state().busy);
      for (let id = 1; id <= 5; id++) {
        await p.locator(`[data-phase="${id}"]`).click();
        await p.waitForTimeout(180);
        assert.equal(
          await p.locator("body").getAttribute("data-meeting-flora"),
          "ombro",
        );
        await p.screenshot({
          path: `test-results/encontros-vivos/fase-${id}-${w}.png`,
        });
        const checks = await p.evaluate(async (id) => {
          await RaizesPersonagens.load(["acoes", "flora", "npcs"]);
          const canvas = document.createElement("canvas");
          canvas.width = 480;
          canvas.height = 350;
          const c = canvas.getContext("2d");
          const shots = [];
          for (const time of [0, 2.4]) {
            c.clearRect(0, 0, 480, 350);
            VivaArt.meeting(c, 480, 350, id, time);
            shots.push(canvas.toDataURL());
          }
          document.body.classList.add("reduce-motion");
          const reduced = [];
          for (const time of [0, 2.4]) {
            c.clearRect(0, 0, 480, 350);
            VivaArt.meeting(c, 480, 350, id, time);
            reduced.push(canvas.toDataURL());
          }
          document.body.classList.remove("reduce-motion");
          return {
            moving: shots[0] !== shots[1],
            still: reduced[0] === reduced[1],
          };
        }, id);
        assert.ok(checks.moving);
        assert.ok(checks.still);
        await p.locator("#phase-dialog").evaluate((e) => e.close());
      }
      for (let id = 1; id <= 5; id++) {
        await p.goto(
          new URL(
            id === 1
              ? "../floresta-viva/index.html"
              : "../jornada/index.html?fase=" + id,
            base,
          ).href,
        );
        await p.waitForFunction(
          () => document.body.dataset.gameReady === "true",
        );
        const checks = await p.evaluate(async (id) => {
          const outfit =
            id === 1 ? "explorador" : GuardiaoMemoria.phaseUniform(id);
          await BosqueKai.load([outfit]);
          const c = document.createElement("canvas");
          c.width = 220;
          c.height = 200;
          c.id = "cenario";
          const ctx = c.getContext("2d");
          const player = {
              x: 110,
              y: 155,
              direction: 0,
              moving: false,
              distance: 0,
              idle: 4,
            },
            before = JSON.stringify(player),
            shots = [];
          for (const t of [0, 2]) {
            ctx.clearRect(0, 0, 220, 200);
            BosqueKai.walk(ctx, player, t, false, 63, false, outfit);
            shots.push(c.toDataURL());
          }
          const transform = ctx.getTransform();
          return {
            moving: shots[0] !== shots[1],
            same: before === JSON.stringify(player),
            identity:
              transform.a === 1 &&
              transform.d === 1 &&
              transform.e === 0 &&
              transform.f === 0,
          };
        }, id);
        assert.ok(checks.moving && checks.same && checks.identity);
      }
      assert.deepEqual(errors, []);
      await p.close();
      console.log(
        "PASS Flora no ombro nas cinco apresentações, descanso nos cinco trajes, redução de movimentos e posição física preservada:",
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
