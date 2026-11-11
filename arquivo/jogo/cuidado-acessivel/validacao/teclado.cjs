"use strict";
const assert = require("node:assert/strict"),
  { chromium } = require("playwright-core");
const base =
    process.env.GUARDIAO_TEST_URL ||
    "http://127.0.0.1:5173/tela-inicial/nova-versao/",
  root = new URL("../../", base);
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const p = await b.newPage({ viewport: { width: 1280, height: 720 } }),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.clock.install();
    await p.goto(new URL("jogo/floresta-viva/index.html", root).href);
    await p.waitForFunction(() => document.body.dataset.gameReady === "true");
    await p.locator("#conversa-avancar").focus();
    await p.keyboard.press("Enter");
    await p.keyboard.press("Enter");
    await p.clock.runFor(2300);
    assert.equal(
      await p.evaluate(() => GuardiaoFloresta.estado().itemsGiven),
      true,
    );
    await p.locator("#app-fullscreen").focus();
    await p.keyboard.press("Enter");
    await p.waitForFunction(() => GuardiaoTela.state().fullscreen);
    await p.keyboard.press("Enter");
    await p.waitForFunction(() => !GuardiaoTela.state().fullscreen);
    await p.locator("#pausa").focus();
    await p.keyboard.press("Enter");
    assert.equal(await p.locator("#menu-pausa").isVisible(), true);
    await p.getByRole("button", { name: "Continuar", exact: true }).focus();
    await p.keyboard.press("Enter");
    assert.equal(await p.locator("#menu-pausa").isVisible(), false);
    await p.evaluate(() =>
      localStorage.setItem(
        "guardiao.mapa.progresso.v1",
        JSON.stringify({ completed: [1, 2], current: 3 }),
      ),
    );
    await p.goto(new URL("jogo/jornada/index.html?fase=3", root).href);
    await p.waitForFunction(() => document.body.dataset.gameReady === "true");
    await p.locator("#intro-next").focus();
    await p.keyboard.press("Enter");
    await p.keyboard.press("Enter");
    await p.clock.runFor(2200);
    const guide = async (type) => {
      await p.locator('[data-goal="' + type + '"]').click();
      for (let i = 0; i < 250; i++) {
        if (!(await p.evaluate(() => GuardiaoJornada.estado().route.length)))
          return;
        await p.clock.runFor(300);
      }
      throw Error("rota não chegou");
    };
    await guide("key");
    await p.keyboard.press("Enter");
    await p.clock.runFor(1600);
    assert.equal(
      await p.evaluate(
        () =>
          GuardiaoJornada.estado().tasks.find((t) => t.type === "key").status,
      ),
      "done",
    );
    await guide("animal");
    await p.keyboard.press("Enter");
    for (let i = 0; i < 100 && !(await p.locator("#puzzle").isVisible()); i++)
      await p.clock.runFor(100);
    assert.equal(await p.locator("#puzzle").isVisible(), true);
    const first = await p.evaluate(() => document.activeElement.dataset.answer);
    await p.keyboard.press("ArrowRight");
    assert.notEqual(
      await p.evaluate(() => document.activeElement.dataset.answer),
      first,
    );
    const answer = await p.evaluate(() => {
      const question = document.getElementById("puzzle-title").textContent;
      return GuardiaoJornada.estado().tasks.find(
        (t) => t.quiz?.question === question,
      ).quiz.answer;
    });
    await p.locator('[data-answer="' + answer + '"]').focus();
    await p.keyboard.press("Enter");
    assert.equal(await p.locator("#puzzle").isVisible(), false);
    assert.equal(await p.locator("#quiz-continue").count(), 0);
    assert.ok(
      await p.evaluate(() =>
        GuardiaoJornada.estado().tasks.some(
          (t) => t.quizPassed && t.status === "returning",
        ),
      ),
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: Enter na introdução, equipamento, pausa, continuar, tela cheia, chave e resposta; setas nas opções; cura sem outra tela.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
