"use strict";
const assert = require("node:assert/strict"),
  { chromium } = require("playwright-core");
const base =
    process.env.GUARDIAO_TEST_URL ||
    "http://127.0.0.1:5173/tela-inicial/nova-versao/",
  root = new URL("../../", base),
  MAP = "guardiao.mapa.progresso.v1";
const advance = (p, n) => p.clock.runFor(n * 1000),
  state = (p) =>
    p.evaluate(() =>
      window.GuardiaoJornada
        ? GuardiaoJornada.estado()
        : GuardiaoFloresta.estado(),
    );
async function until(p, test, label, max = 150) {
  for (let i = 0; i < max; i++) {
    const s = await state(p);
    if (test(s)) return s;
    await advance(p, 0.3);
  }
  throw Error(label + " " + JSON.stringify(await state(p)));
}
async function guide(p, type) {
  await p.locator('[data-goal="' + type + '"]').click();
  return until(p, (s) => !s.route.length, "Rota de " + type, 250);
}
async function interact(p, mobile) {
  if (mobile) await p.locator("#interagir").tap();
  else await p.keyboard.press("e");
}
async function hold(p, selector, seconds, mobile) {
  if (mobile) {
    const r = await p.locator(selector).boundingBox();
    const c = (p._cdp ??= await p.context().newCDPSession(p));
    await c.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ id: 6, x: r.x + r.width / 2, y: r.y + r.height / 2 }],
    });
    await advance(p, seconds);
    await c.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } else {
    await p.keyboard.down(" ");
    await advance(p, seconds);
    await p.keyboard.up(" ");
  }
}
const done = (t) => ["done", "safe"].includes(t.status);
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const failures = [];
  try {
    for (const mobile of process.env.GUARDIAO_TEST_MODE === "desktop"
      ? [false]
      : process.env.GUARDIAO_TEST_MODE === "mobile"
        ? [true]
        : [false, true]) {
      const p = await browser.newPage(
        mobile
          ? {
              viewport: { width: 390, height: 844 },
              isMobile: true,
              hasTouch: true,
            }
          : { viewport: { width: 1280, height: 720 } },
      );
      p.on("pageerror", (e) => failures.push(e.message));
      p.on("response", (r) => {
        if (r.status() >= 400) failures.push(r.status() + " " + r.url());
      });
      await p.clock.install();
      console.log("Iniciando campanha", mobile ? "CELULAR" : "PC");
      await p.goto(base + "index.html");
      await advance(p, 1.5);
      await p.getByRole("link", { name: "Jogar", exact: true }).click();
      await advance(p, 2.2);
      await p.waitForURL("**/aventura.html");
      await p.waitForFunction(() => window.GuardiaoMapa);
      await advance(p, 2);
      assert.equal(await p.locator("#map-credits").count(), 0);
      await p.locator('.map-hotspot[data-phase="1"]').click();
      await p.locator("[data-map-action=start]").click();
      await p.waitForURL("**/floresta-viva/index.html");
      await p.waitForFunction(() => document.body.dataset.gameReady === "true");
      for (let i = 0; i < 2; i++) await p.locator("#conversa-avancar").click();
      await advance(p, 2);
      assert.equal((await state(p)).itemsGiven, true);
      assert.equal((await state(p)).equipped, false);
      await p
        .locator("#mochila")
        .isVisible()
        .then(async (shown) =>
          shown
            ? await p.locator("#mochila").tap()
            : await p.keyboard.press("b"),
        );
      await p.locator("[data-pack-equip=mangueira]").click();
      await advance(p, 0.2);
      assert.ok((await state(p)).equipping > 0);
      assert.equal((await state(p)).equipped, false);
      await advance(p, 0.6);
      assert.equal((await state(p)).equipped, true);
      await guide(p, "agua");
      await interact(p, mobile);
      assert.equal((await state(p)).released, true);
      for (let i = 0; i < 8; i++) {
        console.log("Fogo", i + 1);
        if ((await state(p)).water < 18) {
          await guide(p, "agua");
          await interact(p, mobile);
        }
        await guide(p, "fogo");
        const before = (await state(p)).fires.filter((f) => !f.life).length;
        await hold(p, "#mangueira", 3.25, mobile);
        assert.ok(
          (await state(p)).fires.filter((f) => !f.life).length > before,
          "fogo realmente apagado",
        );
      }
      for (let i = 0; i < 3; i++) {
        console.log("Resgate Amazônia", i + 1);
        await guide(p, "animal");
        await interact(p, mobile);
        await advance(p, 1.9);
      }
      await until(
        p,
        (s) => s.stage === "recompensa" || s.completed,
        "retorno a Carlos",
        350,
      );
      await advance(p, 7);
      assert.equal((await state(p)).completed, true);
      assert.equal(await p.locator("#vitoria").isVisible(), true);
      assert.ok(
        await p.evaluate(() => GuardiaoMemoria.read().phases[1].completed),
      );
      await p.locator("#vitoria a.primary").click();
      await p.waitForURL("**/aventura.html?**");
      await p.waitForFunction(() => window.GuardiaoMapa);
      await advance(p, 4);
      for (let id = 2; id <= 5; id++) {
        console.log((mobile ? "CELULAR" : "PC") + " fase " + id);
        await p.locator("[data-map-action=start]").click();
        await p.waitForURL("**/jornada/index.html?fase=" + id);
        await p.waitForFunction(
          () => document.body.dataset.gameReady === "true",
        );
        assert.equal((await state(p)).itemsGiven, false);
        assert.equal(await p.locator("dialog[open]").count(), 1);
        assert.equal(
          await p
            .locator("dialog:not([open])")
            .evaluateAll((ds) =>
              ds.every((d) => getComputedStyle(d).display === "none"),
            ),
          true,
        );
        await p.locator("#intro-next").click();
        await p.locator("#intro-next").click();
        await advance(p, 1.7);
        assert.equal((await state(p)).itemsGiven, true);
        if (id === 2) {
          assert.equal((await state(p)).protective, false);
          assert.equal((await state(p)).stage, "dressing");
          await advance(p, 2.7);
          assert.equal((await state(p)).protective, true);
          assert.equal(
            await p.evaluate(() => GuardiaoMemoria.uniform("explorador")),
            false,
            "traje do rio não pode ser retirado durante a atividade",
          );
        }
        assert.equal(await p.locator("#joystick").isVisible(), mobile);
        await p.locator("#pausa").click();
        const stop = (await state(p)).elapsed;
        await advance(p, 1);
        assert.equal((await state(p)).elapsed, stop);
        await p.getByRole("button", { name: "Continuar", exact: true }).click();
        if (id === 2) {
          for (let i = 0; i < 8; i++) {
            await guide(p, "trash");
            await interact(p, mobile);
            await until(
              p,
              (s) =>
                s.tasks.filter((t) => t.type === "trash" && done(t)).length ===
                i + 1,
              "coleta do rio",
              60,
            );
            if (i === 0) {
              await advance(p, 2);
              assert.equal((await state(p)).flora.mode, "voando");
              await p.reload();
              await p.waitForFunction(
                () => document.body.dataset.gameReady === "true",
              );
              assert.equal((await state(p)).protective, true);
              assert.equal(
                (await state(p)).tasks.filter(
                  (t) => t.type === "trash" && done(t),
                ).length,
                1,
              );
            }
          }
          for (let i = 0; i < 3; i++) {
            await guide(p, "animal");
            await interact(p, mobile);
            await until(
              p,
              (s) =>
                s.tasks.filter(
                  (t) =>
                    ["fish", "turtle"].includes(t.type) &&
                    t.status !== "pending",
                ).length >=
                i + 1,
              "cuidado do rio",
              80,
            );
          }
        }
        if (id === 3) {
          await guide(p, "key");
          await interact(p, mobile);
          await until(
            p,
            (s) => s.tasks.find((t) => t.type === "key").status === "done",
            "chave",
            60,
          );
          assert.equal(
            await p.evaluate(() => GuardiaoMemoria.has("chave")),
            true,
          );
          let wrong = false;
          const answers = {
            macaco: "mata",
            tucano: "sementes",
            ave: "marina",
            capivara: "rio",
          };
          for (let i = 0; i < 5; i++) {
            await guide(p, "animal");
            await interact(p, mobile);
            await until(
              p,
              (s) => s.action || s.paused,
              "aproximação do animal",
              60,
            );
            if (await p.locator("#puzzle").isVisible()) {
              const text = await p.locator("#puzzle-title").textContent();
              const answer = text.includes("mico")
                ? "mata"
                : text.includes("tucano")
                  ? "sementes"
                  : text.includes("ave")
                    ? "marina"
                    : "rio";
              if (!wrong) {
                const bad = p.locator("[data-answer]").filter({
                  hasNot: p.locator('[data-answer="' + answer + '"]'),
                });
                const values = await p
                  .locator("[data-answer]")
                  .evaluateAll((bs) => bs.map((b) => b.dataset.answer));
                await p
                  .locator(
                    '[data-answer="' + values.find((v) => v !== answer) + '"]',
                  )
                  .click();
                assert.match(
                  await p.locator("#puzzle-feedback").textContent(),
                  /tentar/,
                );
                assert.equal((await state(p)).action, null);
                wrong = true;
              }
              await p.locator('[data-answer="' + answer + '"]').click();
              assert.equal(
                (await state(p)).action,
                null,
                "a explicação fica disponível antes de continuar",
              );
              assert.ok(
                (await p.locator("#puzzle-feedback").textContent()).length > 30,
              );
              await p.locator("#quiz-continue").click();
            }
            await until(
              p,
              (s) =>
                s.tasks.filter(
                  (t) =>
                    ["cage", "kitten", "bird", "care"].includes(t.type) &&
                    t.status !== "pending",
                ).length >=
                i + 1,
              "resgate",
              100,
            );
          }
          assert.ok(
            wrong,
            "permite errar, receber feedback e tentar outra vez",
          );
        }
        if (id === 4) {
          for (let i = 0; i < 6; i++) {
            await guide(p, "bed");
            await interact(p, mobile);
            await until(
              p,
              (s) =>
                s.tasks.filter(
                  (t) => t.type === "bed" && t.status === "cleared",
                ).length > 0,
              "limpar solo",
              60,
            );
            await interact(p, mobile);
            await until(
              p,
              (s) => s.tasks.some((t) => t.status === "dug"),
              "cavar",
              60,
            );
            await interact(p, mobile);
            await p.locator("#puzzle").waitFor();
            const plantingText = await p
              .locator("#puzzle-description")
              .textContent();
            const native = plantingText.match(/indicou (ipê|ingá|aroeira)/)[1];
            await p.locator('[data-answer="' + native + '"]').click();
            await until(
              p,
              (s) => s.tasks.some((t) => t.status === "seeded"),
              "plantar",
              60,
            );
            await hold(p, "#ferramenta", 2.3, mobile);
            if ((await state(p)).tasks.some((t) => t.status === "growing")) {
              await interact(p, mobile);
              await until(p, (s) => !s.action, "proteger muda", 60);
            }
            assert.equal(
              (await state(p)).tasks.filter((t) => t.type === "bed" && done(t))
                .length,
              i + 1,
            );
          }
          for (let i = 0; i < 2; i++) {
            await guide(p, "nest");
            await interact(p, mobile);
            await until(
              p,
              (s) =>
                s.tasks.filter((t) => t.type === "nest" && done(t)).length ===
                i + 1,
              "ninho",
              60,
            );
          }
        }
        if (id === 5) {
          for (let i = 0; i < 6; i++) {
            await guide(p, "recycle");
            await interact(p, mobile);
            await until(
              p,
              (s) => s.bag.length === i + 1,
              "coleta seletiva",
              60,
            );
          }
          await guide(p, "recycle");
          await interact(p, mobile);
          for (let i = 0; i < 6; i++) {
            await p.locator("#puzzle").waitFor();
            const text = await p.locator("#puzzle-description").textContent(),
              answer = text.includes("Garrafa")
                ? "plastic"
                : text.includes("Papel")
                  ? "paper"
                  : text.includes("Latinha")
                    ? "metal"
                    : "organic";
            if (i === 0) {
              await p.locator('[data-answer="paper"]').click();
              assert.match(
                await p.locator("#puzzle-feedback").textContent(),
                /tentar/,
              );
            }
            await p.locator('[data-answer="' + answer + '"]').click();
            await advance(p, 0.7);
          }
          assert.equal((await state(p)).bag.length, 0);
          for (let i = 0; i < 2; i++) {
            await guide(p, "solar");
            await interact(p, mobile);
            await p.locator("#puzzle").waitFor();
            await p.locator("[data-answer=sun]").click();
            await until(
              p,
              (s) =>
                s.tasks.filter((t) => t.type === "solar" && done(t)).length ===
                i + 1,
              "painel solar",
              60,
            );
          }
          for (let i = 0; i < 2; i++) {
            await guide(p, "garden");
            await interact(p, mobile);
            await until(
              p,
              (s) =>
                s.tasks.filter((t) => t.type === "garden" && done(t)).length ===
                i + 1,
              "jardim",
              60,
            );
          }
          for (let i = 0; i < 2; i++) {
            await guide(p, "transport");
            await interact(p, mobile);
            await p.locator("#puzzle").waitFor();
            const text = await p.locator("#puzzle-title").textContent();
            await p
              .locator(
                '[data-answer="' +
                  (text.includes("passeio") ? "bike" : "bus") +
                  '"]',
              )
              .click();
            await p.locator("#quiz-continue").click();
            await until(
              p,
              (s) =>
                s.tasks.filter((t) => t.type === "transport" && done(t))
                  .length ===
                i + 1,
              "transporte",
              60,
            );
          }
          await guide(p, "community");
          await interact(p, mobile);
          await until(
            p,
            (s) =>
              s.tasks.find((t) => t.type === "community").status === "done",
            "mutirão",
            60,
          );
        }
        await until(
          p,
          (s) => s.stage === "reward" || s.completed,
          "recompensa " + id,
          450,
        );
        await advance(p, 7);
        assert.equal((await state(p)).completed, true);
        assert.equal(await p.locator("#vitoria").isVisible(), true);
        assert.equal((await state(p)).tasks.every(done), true);
        assert.ok(
          await p.evaluate(
            (id) => GuardiaoMemoria.read().phases[id].completed,
            id,
          ),
        );
        const report = await p.evaluate(
          (id) => GuardiaoMemoria.read().phases[id],
          id,
        );
        if (id === 4)
          assert.equal(
            new Set(report.objectives.map((t) => t.seedSpecies).filter(Boolean))
              .size,
            3,
          );
        const save = await p.evaluate(
          (k) => JSON.parse(localStorage.getItem(k)),
          MAP,
        );
        assert.ok(save.completed.includes(id));
        await p.locator("#next-phase").click();
        await p.waitForFunction(() => window.GuardiaoMapa);
        await advance(p, 4);
        console.log(
          "PASS " +
            (mobile ? "celular" : "PC") +
            " fase " +
            id +
            " concluída com ações, tarefas e conquista reais.",
        );
      }
      await p.waitForURL("**/renascimento/creditos.html");
      await p.waitForFunction(
        () => document.body.dataset.endingReady === "true",
      );
      assert.equal(await p.locator("#ending-credits").isVisible(), false);
      const scenes = [
        "memorias",
        "reencontro",
        "animais",
        "comunidade",
        "amuleto",
        "festa",
      ];
      for (const [i, scene] of scenes.entries()) {
        assert.equal(
          await p.locator("body").getAttribute("data-epilogue-scene"),
          scene,
        );
        await advance(p, 0.2);
        assert.equal(await p.locator("#ending-credits").isVisible(), false);
        if (i < 5) await p.locator("#epilogue-next").click();
      }
      assert.match(
        await p.locator("#ending-caption").textContent(),
        /pessoas dispostas a cuidar/,
      );
      await p.locator("#ending-pause").click();
      const t = await p.evaluate(() => GuardiaoEpilogo.estado().time);
      await advance(p, 1);
      assert.equal(await p.evaluate(() => GuardiaoEpilogo.estado().time), t);
      await p.locator("#ending-pause").click();
      await advance(p, 10);
      assert.equal(await p.locator("#ending-credits").isVisible(), true);
      await p.locator("#ending-close-credits").click();
      await p.locator("#ending-replay").click();
      assert.equal(
        await p.locator("body").getAttribute("data-epilogue-scene"),
        "memorias",
      );
      assert.deepEqual(
        await p.evaluate(
          (k) => JSON.parse(localStorage.getItem(k)).completed,
          MAP,
        ),
        [1, 2, 3, 4, 5],
      );
      await p.close();
      console.log(
        "PASS campanha inteira " +
          (mobile ? "celular" : "computador") +
          " e epílogo de seis cenas, sem batalha.",
      );
    }
    assert.deepEqual(failures, []);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
