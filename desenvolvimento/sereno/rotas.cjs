"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  { chromium } = require("playwright-core");
const path = require("node:path"),
  artifacts =
    process.env.GUARDIAO_ARTIFACTS || path.resolve("test-results/sereno");
fs.mkdirSync(artifacts, { recursive: true });
const origin = new URL(
  "../../",
  process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4173/jogo/viva/",
).href;
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const reports = [];
  try {
    for (const id of [1, 2, 3]) {
      const p = await b.newPage({ viewport: { width: 844, height: 390 } });
      p.on("pageerror", (e) => {
        throw e;
      });
      await p.addInitScript(
        (id) =>
          localStorage.setItem(
            "guardiao.mapa.progresso.v1",
            JSON.stringify({
              completed: Array.from({ length: id - 1 }, (_, i) => i + 1),
              current: id,
            }),
          ),
        id,
      );
      await p.goto(
        origin +
          (id === 1
            ? "jogo/floresta-viva/index.html"
            : "jogo/jornada/index.html?fase=" + id),
      );
      await p.waitForFunction(() => document.body.dataset.gameReady === "true");
      const next = id === 1 ? "#conversa-avancar" : "#intro-next";
      await p.click(next);
      await p.click(next);
      await p.waitForFunction(() =>
        window.GuardiaoJornada
          ? GuardiaoJornada.estado().itemsGiven
          : GuardiaoFloresta.estado().itemsGiven,
      );
      await p.waitForFunction(() => !SerenoRotas.state().failed);
      await p.waitForTimeout(300);
      const r = await p.evaluate(async (id) => {
        const original = RaizesBusca.prototype.route;
        let mainCalls = 0;
        RaizesBusca.prototype.route = function (...args) {
          mainCalls++;
          return original.apply(this, args);
        };
        const before = performance.now();
        let ticks = 0,
          gaps = [],
          last = before,
          on = true;
        function tick(t) {
          if (!on) return;
          gaps.push(t - last);
          last = t;
          ticks++;
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        let timerLag = 0;
        const timer = new Promise((resolve) =>
          setTimeout(() => {
            timerLag = performance.now() - before - 30;
            resolve();
          }, 30),
        );
        const state = window.GuardiaoJornada
          ? GuardiaoJornada.estado()
          : GuardiaoFloresta.estado();
        const animals =
          id === 1
            ? state.animals
            : state.tasks.filter((t) =>
                ["fish", "turtle", "cage", "kitten", "bird", "care"].includes(
                  t.type,
                ),
              );
        const paths = [];
        for (const a of animals) {
          const home =
            id === 1
              ? a.home
              : id === 2
                ? a.type === "turtle"
                  ? { x: 745, y: 430 }
                  : { x: 610 + (a.id === "peixes2" ? 90 : 0), y: 420 }
                : GuardiaoElenco.habitat(a.speciesKey);
          if (!home) continue;
          const path = await SerenoRotas.route(
            { x: a.x, y: a.y },
            home,
            id === 1
              ? { hazards: [] }
              : {
                  dynamic: state.tasks.filter(
                    (t) =>
                      t.type === "cage" &&
                      t.status === "pending" &&
                      t.id !== a.id,
                  ),
                },
          );
          paths.push({ animal: a.id, points: path.length, last: path.at(-1) });
        }
        await timer;
        on = false;
        return {
          phase: id,
          mainCalls,
          ticks,
          timerLag,
          maxFrameGap: Math.max(...gaps),
          duration: performance.now() - before,
          paths,
          worker: SerenoRotas.state(),
        };
      }, id);
      assert.equal(
        r.mainCalls,
        0,
        "nenhuma busca síncrona do retorno na interface",
      );
      assert.equal(r.worker.failed, false);
      assert.ok(
        r.paths.length > 0 && r.paths.every((p) => p.points > 0),
        "cada animal tem rota",
      );
      assert.ok(
        r.timerLag < 700,
        "a interface atende os temporizadores enquanto o worker calcula",
      );
      reports.push(r);
      console.log("PASS rotas fase", id, JSON.stringify(r));
      await p.close();
    }
    // Cenário sem suporte a Worker: a busca alternativa precisa ceder a interface.
    const p = await b.newPage({ viewport: { width: 844, height: 390 } });
    await p.addInitScript(() => (window.Worker = undefined));
    await p.goto(origin + "jogo/floresta-viva/index.html");
    await p.waitForFunction(() => document.body.dataset.gameReady === "true");
    await p.click("#conversa-avancar");
    await p.click("#conversa-avancar");
    await p.waitForFunction(() => GuardiaoFloresta.estado().itemsGiven);
    const fallback = await p.evaluate(async () => {
      const a = FlorestaMundo.animals.find((a) => a.id === "cervo");
      FlorestaMundo.setHazards([]);
      let delay = 0;
      const start = performance.now(),
        timer = new Promise((r) =>
          setTimeout(() => {
            delay = performance.now() - start - 30;
            r();
          }, 30),
        );
      const path = await SerenoRotas.route(a, a.home, { hazards: [] });
      await timer;
      return { delay, points: path.length, stats: SerenoRotas.state() };
    });
    assert.ok(fallback.points > 0);
    assert.ok(fallback.stats.fallbacks > 0);
    assert.ok(fallback.delay < 700);
    console.log("PASS busca cooperativa sem Worker", JSON.stringify(fallback));
    reports.push({ fallback });
    await p.close();
    fs.writeFileSync(
      path.join(artifacts, "rotas-medidas.json"),
      JSON.stringify(reports, null, 2) + "\n",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
