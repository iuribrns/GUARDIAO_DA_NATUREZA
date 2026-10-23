"use strict";
const assert = require("node:assert/strict");
const { readFileSync, mkdirSync } = require("node:fs");
const { runInNewContext } = require("node:vm");
const { resolve } = require("node:path");
const { chromium } = require("playwright-core");
const ROOT = resolve(__dirname, "../../..");
const sandbox = { window: {} };
runInNewContext(
  readFileSync(resolve(ROOT, "jogo/jornada/fases.js"), "utf8"),
  sandbox,
);
const phases = JSON.parse(JSON.stringify(sandbox.window.GuardiaoFasesJogaveis));
const base = new URL(
  "../../",
  process.env.GUARDIAO_TEST_URL ||
    "http://127.0.0.1:5173/tela-inicial/nova-versao/",
);
const MAP = "guardiao.mapa.progresso.v1",
  SHARDS = "guardiao.colar.fragmentos.v1";
const captures = process.env.GUARDIAO_COLAR_CAPTURE_DIR;
if (captures) mkdirSync(captures, { recursive: true });
const state = (p) =>
  p.evaluate(
    () => window.GuardiaoFloresta?.estado() || GuardiaoJornada.estado(),
  );
async function until(p, time) {
  const s = await state(p);
  if (s.rewardTime < time)
    await p.clock.runFor(Math.ceil((time - s.rewardTime) * 1000));
}
function fixture(id) {
  if (id === 1)
    return {
      key: "guardiao.floresta-viva.v2",
      value: {
        version: 2,
        itemsGiven: true,
        released: true,
        water: 100,
        equipped: false,
        hoseDrawn: false,
        x: 286,
        y: 260,
        fires: Array(8).fill(0),
        animals: ["capivara", "cervo", "passaro"].map((id) => ({
          id,
          stage: "seguro",
        })),
        completed: false,
      },
    };
  const data = phases[id];
  return {
    key: "guardiao.jornada.fase." + id + ".v1",
    value: {
      version: 1,
      phase: id,
      itemsGiven: true,
      completed: false,
      water: 100,
      player: data.start,
      tasks: data.tasks.map((t) => ({
        id: t.id,
        status: ["fish", "turtle", "cage", "kitten", "bird"].includes(t.type)
          ? "safe"
          : "done",
        progress: 1,
        position: { x: t.x, y: t.y },
      })),
    },
  };
}
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const errors = [];
  try {
    // These isolated saves exercise the cutscene. Existing campaign tests earn every objective by playing.
    for (const test of [
      { id: 1, w: 1280, h: 720 },
      { id: 2, w: 320, h: 740 },
      { id: 3, w: 390, h: 844 },
      { id: 4, w: 844, h: 390, reduced: true },
      { id: 5, w: 1280, h: 720 },
      { id: 2, w: 390, h: 844, skip: true },
    ]) {
      const { id, w, h, reduced = false, skip = false } = test,
        context = await browser.newContext({
          viewport: { width: w, height: h },
          isMobile: w < 900,
          hasTouch: w < 900,
          reducedMotion: reduced ? "reduce" : "no-preference",
        }),
        p = await context.newPage();
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("response", (r) => {
        if (r.status() >= 400) errors.push(r.status() + " " + r.url());
      });
      await p.clock.install();
      await p.goto(new URL("tela-inicial/nova-versao/index.html", base).href);
      const previous = Array.from({ length: id - 1 }, (_, i) => i + 1);
      await p.evaluate(
        ({ previous, id, seed, MAP, SHARDS }) => {
          localStorage.clear();
          localStorage.setItem(
            MAP,
            JSON.stringify({
              completed: previous,
              completedFirst: id > 1,
              current: id,
            }),
          );
          localStorage.setItem(SHARDS, JSON.stringify(previous));
          localStorage.setItem(seed.key, JSON.stringify(seed.value));
        },
        { previous, id, seed: fixture(id), MAP, SHARDS },
      );
      await p.goto(
        new URL(
          id === 1
            ? "jogo/floresta-viva/index.html"
            : "jogo/jornada/index.html?fase=" + id,
          base,
        ).href,
      );
      await p.waitForFunction(() => document.body.dataset.gameReady === "true");
      for (let i = 0; i < 25; i++) {
        if ((await state(p)).necklace.active) break;
        await p.clock.runFor(200);
      }
      assert.equal(
        (await state(p)).necklace.active,
        true,
        "recompensa começa pelo retorno ao NPC",
      );
      await until(p, 1.2);
      let s = await state(p);
      assert.deepEqual(s.necklace.before, previous);
      assert.equal(s.necklace.pieces, id - 1);
      assert.equal(s.completed, false);
      assert.equal(await p.locator("#colar-cena").isVisible(), true);
      assert.deepEqual(
        await p.evaluate(
          (k) => JSON.parse(localStorage.getItem(k)).completed,
          MAP,
        ),
        previous,
        "não concede a pedra ao abrir a animação",
      );
      const visible = () =>
        p
          .locator("[data-colar-pedra]")
          .evaluateAll((nodes) =>
            nodes
              .filter((n) => n.style.opacity === "1")
              .map((n) => +n.dataset.colarPedra),
          );
      assert.deepEqual(
        await visible(),
        previous,
        "apenas as conquistas anteriores aparecem no início",
      );
      const emptyView = await p.locator(".colar-view").getAttribute("viewBox");
      await until(p, 2.1);
      assert.equal((await state(p)).necklace.state, "encaixando");
      await until(p, 3.05);
      s = await state(p);
      assert.equal(s.necklace.state, "encaixado");
      assert.equal(s.necklace.pieces, id);
      assert.deepEqual(
        await visible(),
        [...previous, id],
        "a pedra da fase se encaixa sem mostrar conquistas futuras",
      );
      assert.match(
        await p.locator("#colar-frase").textContent(),
        new RegExp(["", "vermelha", "azul", "amarela", "verde", "violeta"][id]),
      );
      if (reduced)
        assert.equal(
          await p.locator(".colar-view").getAttribute("viewBox"),
          emptyView,
          "movimento reduzido mantém enquadramento fixo",
        );
      const bounds = await p.locator(".colar-card").boundingBox(),
        button = await p.locator("#colar-continuar").boundingBox();
      assert.ok(
        bounds.x >= 0 &&
          bounds.y >= 0 &&
          bounds.x + bounds.width <= w + 1 &&
          bounds.y + bounds.height <= h + 1,
        "cutscene cabe na tela",
      );
      assert.ok(
        button.height >= 44 && button.y + button.height <= h,
        "botão acessível ao toque",
      );
      assert.ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "sem rolagem lateral",
      );
      if (captures && !skip)
        await p.screenshot({
          path: resolve(captures, "colar-fase-" + id + ".png"),
        });
      if (skip) {
        await p.locator("#colar-continuar").tap();
        assert.equal(
          (await state(p)).completed,
          true,
          "toque conclui somente a premiação conquistada",
        );
      } else {
        await until(p, 3.45);
        assert.equal(
          await p.locator("body").getAttribute("data-necklace-pose"),
          "4",
          "Kai levanta o colar",
        );
        if (id === 1) {
          await p.keyboard.press("Escape");
          assert.equal(await p.locator("#menu-pausa").isVisible(), true);
          const before = (await state(p)).rewardTime;
          await p.clock.runFor(800);
          assert.equal(
            (await state(p)).rewardTime,
            before,
            "pausa também congela a cutscene",
          );
          await p
            .getByRole("button", { name: "Continuar", exact: true })
            .click();
        }
        await until(p, 4.45);
        assert.equal(
          await p.locator("body").getAttribute("data-necklace-pose"),
          "5",
          "Kai passa o cordão pela cabeça",
        );
        await until(p, 5.15);
        assert.equal(
          await p.locator("body").getAttribute("data-necklace-pose"),
          "6",
          "Kai ajusta a nova pedra no peito",
        );
        await until(p, 5.9);
        assert.equal(
          await p.locator("body").getAttribute("data-necklace-pose"),
          "7",
          "Kai comemora com Flora",
        );
        await until(p, 6.7);
        assert.equal((await state(p)).completed, true);
      }
      assert.equal(await p.locator("#vitoria").isVisible(), true);
      assert.equal(await p.locator("#colar-cena").isVisible(), false);
      assert.deepEqual(
        await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), SHARDS),
        [...previous, id],
      );
      await p.reload();
      await p.waitForFunction(() => document.body.dataset.gameReady === "true");
      assert.equal(await p.locator("#vitoria").isVisible(), true);
      assert.deepEqual(
        (await state(p)).necklace.earned,
        [...previous, id],
        "colar completo persiste ao voltar",
      );
      await context.close();
      console.log(
        "PASS: colar fase",
        id,
        w + "×" + h,
        reduced
          ? "movimento reduzido"
          : skip
            ? "toque para continuar"
            : "oito poses e encaixe",
      );
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS: cinco pedras nas cores certas, primeira conquista vazia, encaixe, Kai vestindo, pausa, toque, quatro formatos de tela e progresso persistido.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
