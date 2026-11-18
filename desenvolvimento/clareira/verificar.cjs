const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
const base =
  process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4189/jogo/viva/";
fs.mkdirSync("test-results/clareira", { recursive: true });
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
      await p.clock.install();
      await p.addInitScript(() => {
        localStorage.setItem(
          "guardiao.mapa.progresso.v1",
          JSON.stringify({ completed: [1, 2, 3, 4, 5], current: 5 }),
        );
        localStorage.setItem("guardiao.viva.final.v1", "visto");
        localStorage.setItem(
          "guardiao.jornada.fase.5.v1",
          JSON.stringify({
            version: 1,
            phase: 5,
            itemsGiven: true,
            completed: false,
            player: { x: 450, y: 400 },
            tasks: Array.from({ length: 6 }, (_, i) => ({
              id: "reciclavel" + i,
              status: "carried",
            })),
          }),
        );
      });
      await p.goto(base + "index.html#mapa");
      await p.waitForFunction(() => document.body.dataset.uiReady === "true");
      await p.waitForFunction(() => !VivaTransicao.state().busy);
      for (let id = 1; id <= 5; id++) {
        await p.locator(`[data-phase="${id}"]`).click();
        await p.clock.runFor(300);
        const r = await p.locator("#phase-dialog").boundingBox();
        assert.ok(
          r.x >= 0 &&
            r.y >= 0 &&
            r.x + r.width <= w + 1 &&
            r.y + r.height <= h + 1,
        );
        if (w < 1000) assert.ok(r.height <= h * 0.905, "painel compacto");
        await p.screenshot({
          path: `test-results/clareira/brief-${id}-${w}.png`,
        });
        await p.locator("#phase-dialog").evaluate((e) => e.close());
      }
      await p.goto(new URL("../jornada/index.html?fase=5", base).href);
      await p.waitForFunction(() => document.body.dataset.gameReady === "true");
      const result = await p.evaluate(async () => {
        const a = new GuardiaoAdventureArt(5);
        await a.load();
        const c = document.createElement("canvas");
        c.width = 1280;
        c.height = 720;
        const ctx = c.getContext("2d");
        const actors = a.binActors(ctx);
        actors.forEach((a) => a.draw());
        const pixels = ctx.getImageData(0, 0, 1280, 720).data;
        let count = 0;
        for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 128) count++;
        const d = GuardiaoFasesJogaveis[5],
          nav = new GuardiaoNavegacao.Navigation(d);
        return {
          drawings: a.drawings.size,
          count,
          actors: actors.length,
          station: nav.walkable(d.station),
          bins: [
            { x: 154, y: 514 },
            { x: 225, y: 493 },
            { x: 300, y: 472 },
          ].map((p) => nav.walkable(p)),
        };
      });
      assert.equal(result.actors, 3);
      assert.ok(result.drawings >= 3 && result.count > 3000);
      assert.ok(result.station);
      assert.deepEqual(result.bins, [false, false, false]);
      await p.locator('[data-goal="recycle"]').click();
      for (let i = 0; i < 160; i++) {
        const s = await p.evaluate(() => GuardiaoJornada.estado());
        if (!s.route.length && !s.routePending) break;
        await p.clock.runFor(300);
      }
      if (w < 1000) await p.locator("#interagir").tap();
      else await p.keyboard.press("Enter");
      await p.waitForFunction(() => document.getElementById("puzzle").open);
      await p.locator('[data-answer="recyclable"]').click();
      assert.equal(
        await p.evaluate(() => GuardiaoJornada.estado().bag.length),
        5,
        "reciclagem acessível",
      );
      await p.locator("#puzzle").evaluate((e) => e.close());
      await p.screenshot({ path: `test-results/clareira/cidade-${w}.png` });
      const npcFrames = () =>
        p.evaluate(async () => {
          await RaizesPersonagens.load(["npcs"]);
          const canvas = document.createElement("canvas");
          canvas.id = "cenario";
          canvas.width = 180;
          canvas.height = 180;
          const ctx = canvas.getContext("2d");
          return Array.from({ length: 5 }, (_, id) => {
            ctx.clearRect(0, 0, 180, 180);
            RaizesPersonagens.draw(ctx, "npcs", id + 5, 90, 160, 125);
            return canvas.toDataURL();
          });
        });
      const first = await npcFrames();
      await p.clock.runFor(3200);
      const second = await npcFrames();
      first.forEach((frame, id) =>
        assert.notEqual(frame, second[id], "NPC animado " + id),
      );
      await p.locator("body").evaluate((e) => e.classList.add("reduce-motion"));
      const quiet = await npcFrames();
      await p.clock.runFor(3200);
      assert.deepEqual(
        await npcFrames(),
        quiet,
        "NPCs respeitam reduzir animações",
      );
      assert.deepEqual(errors, []);
      await p.close();
      console.log(
        "PASS apresentações compactas, três lixeiras visíveis/sólidas, reciclagem acessível e cinco NPCs animados:",
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
