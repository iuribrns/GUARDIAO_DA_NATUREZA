const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
const base =
  process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4189/jogo/viva/";
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const p = await b.newPage({ viewport: { width: 1280, height: 720 } }),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.clock.install();
    await p.addInitScript(() => {
      localStorage.setItem(
        "guardiao.mapa.progresso.v1",
        JSON.stringify({
          completed: [1, 2, 3, 4, 5],
          current: 5,
          pendingRestoration: 5,
        }),
      );
      localStorage.setItem("guardiao.colar.fragmentos.v1", "[1,2,3,4,5]");
    });
    let release;
    const gate = new Promise((r) => (release = r));
    let requested = false;
    await p.route("**/ilha-renascendo/assets/etapa-5.webp", async (r) => {
      requested = true;
      await gate;
      await r.continue();
    });
    await p.goto(base + "index.html?restaurar=5#mapa", {
      waitUntil: "domcontentloaded",
    });
    await p.waitForFunction(() => document.body.dataset.uiReady === "true");
    await p.waitForFunction(() => BosqueMapa.state().loading);
    await p.clock.runFor(9000);
    assert.ok(requested);
    assert.equal(
      await p.evaluate(() => VivaFinal.active),
      false,
      "encerramento espera imagem em rede lenta",
    );
    release();
    await p.evaluate(() => BosqueMapa.ready());
    await p.clock.runFor(5900);
    assert.equal(
      await p.evaluate(() => VivaFinal.active),
      false,
      "encerramento espera a animação inteira",
    );
    await p.clock.runFor(800);
    await p.waitForFunction(() => VivaFinal.active);
    await p.clock.runFor(18000);
    fs.mkdirSync("test-results/ilha-renascendo", { recursive: true });
    await p.screenshot({
      path: "test-results/ilha-renascendo/arvore-encerramento.png",
    });
    await p.locator("#ending-skip").click();
    await p.waitForFunction(
      () => document.getElementById("final-credits").open,
    );
    await p.locator("#ending-island").click();
    assert.equal(await p.evaluate(() => VivaFinal.active), false);
    assert.equal(await p.evaluate(() => BosqueMapa.state().stage), 5);
    await p.reload();
    await p.waitForFunction(() => document.body.dataset.uiReady === "true");
    await p.evaluate(() => BosqueMapa.ready());
    await p.clock.runFor(1200);
    await p.evaluate(() => (location.hash = "configuracoes"));
    await p.clock.runFor(8500);
    assert.equal(
      await p.evaluate(() => VivaFinal.active),
      false,
      "não inicia encerramento sobre configurações",
    );
    assert.equal(
      await p.evaluate(() => document.body.dataset.view),
      "configuracoes",
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS rede lenta, quinta restauração completa antes do encerramento, árvore, créditos e retorno à ilha.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
