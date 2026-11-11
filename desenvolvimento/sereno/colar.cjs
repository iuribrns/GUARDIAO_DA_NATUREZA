"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  { chromium } = require("playwright-core");
const base =
    process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4173/jogo/viva/",
  root = new URL("../../", base),
  out = process.env.GUARDIAO_ARTIFACTS || path.resolve("test-results/sereno");
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (let phase = 1; phase <= 5; phase++) {
      const p = await b.newPage({ viewport: { width: 844, height: 390 } }),
        errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await p.addInitScript(
        (phase) =>
          localStorage.setItem(
            "guardiao.mapa.progresso.v1",
            JSON.stringify({
              completed: Array.from({ length: phase - 1 }, (_, i) => i + 1),
              current: phase,
            }),
          ),
        phase,
      );
      const url = new URL(
        phase === 1
          ? "jogo/floresta-viva/index.html"
          : "jogo/jornada/index.html?fase=" + phase,
        root,
      ).href;
      await p.goto(url);
      await p.waitForFunction(() => document.body.dataset.gameReady === "true");
      await p.evaluate((phase) => {
        if (phase === 1) {
          const w = FlorestaMundo;
          localStorage.setItem(
            "guardiao.floresta-viva.v2",
            JSON.stringify({
              version: 2,
              itemsGiven: true,
              released: true,
              equipped: false,
              water: 100,
              x: 286,
              y: 260,
              fires: w.fires.map(() => 0),
              animals: w.animals.map((a) => ({
                id: a.id,
                stage: "seguro",
                position: a.home,
              })),
              completed: false,
            }),
          );
        } else {
          const d = GuardiaoFasesJogaveis[phase],
            npc = d.npcPosition;
          let player = { x: npc.x + 40, y: npc.y + 30 };
          const candidates = Array.from({ length: 24 }, (_, i) => ({
            x: npc.x + Math.cos((i * Math.PI) / 12) * 45,
            y: npc.y + Math.sin((i * Math.PI) / 12) * 45,
          }));
          player =
            candidates.find((p) => GuardiaoJornada.podeAndar(p)) || d.start;
          localStorage.setItem(
            "guardiao.jornada.fase." + phase + ".v1",
            JSON.stringify({
              version: 1,
              phase,
              itemsGiven: true,
              protective: true,
              water: 100,
              player,
              tasks: d.tasks.map((t) => ({
                ...t,
                status: [
                  "fish",
                  "turtle",
                  "cage",
                  "kitten",
                  "bird",
                  "care",
                ].includes(t.type)
                  ? "safe"
                  : "done",
                quizPassed: true,
                seedSpecies: "ipê",
              })),
              completed: false,
            }),
          );
        }
      }, phase);
      await p.clock.install();
      await p.reload();
      await p.waitForFunction(() => document.body.dataset.gameReady === "true");
      await p.clock.runFor(1800);
      let state = await p.evaluate(() =>
        window.GuardiaoJornada
          ? GuardiaoJornada.estado()
          : GuardiaoFloresta.estado(),
      );
      assert.ok(
        ["recompensa", "reward"].includes(state.stage),
        "a fase deve iniciar a recompensa",
      );
      await p.clock.runFor(1700);
      assert.equal(
        await p.locator("#colar-cena").getAttribute("data-state"),
        "encaixado",
      );
      assert.equal(
        await p.locator("#colar-cena").getAttribute("data-pieces"),
        String(phase),
      );
      assert.equal(await p.locator("#colar-continuar").isEnabled(), true);
      await p.screenshot({
        path: path.join(out, "colar-fase-" + phase + ".png"),
      });
      await p.clock.runFor(4000);
      assert.equal(await p.locator("#vitoria").isVisible(), true);
      assert.deepEqual(errors, []);
      console.log("PASS novo encaixe, pose e cor do cristal", phase);
      await p.close();
    }
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
