const { chromium } = require("playwright-core"),
  fs = require("node:fs");
const url = process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4173/jogo/viva/",
  out = process.env.GUARDIAO_ARTIFACTS || "/workspace/entregas/mata-ilustrada";
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  fs.mkdirSync(out, { recursive: true });
  const errors = [];
  try {
    const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("response", (r) => {
      if (r.status() >= 400) errors.push(r.status() + " " + r.url());
    });
    await p.goto(url);
    await p.waitForFunction(() => document.body.dataset.uiReady === "true");
    await p.waitForTimeout(600);
    await p.screenshot({ path: out + "/inicio.png" });
    await p.click("#play-game");
    await p.waitForFunction(() => location.hash === "#mapa");
    await p.waitForTimeout(1200);
    await p.screenshot({ path: out + "/mapa.png" });
    console.log("Mapa", await p.evaluate(() => BosqueMapa.state()));
    for (let id = 1; id <= 5; id++) {
      await p.evaluate((id) => {
        localStorage.setItem(
          "guardiao.mapa.progresso.v1",
          JSON.stringify({ version: 1, completed: [1, 2, 3, 4], current: id }),
        );
      }, id);
      if (id === 1) await p.clock.install();
      await p.goto(
        new URL(
          id === 1
            ? "../floresta-viva/index.html"
            : "../jornada/index.html?fase=" + id,
          url,
        ).href,
      );
      await p.waitForFunction(() => document.body.dataset.gameReady === "true");
      const btn = id === 1 ? "#conversa-avancar" : "#intro-next";
      for (let i = 0; i < 2; i++) await p.locator(btn).click();
      await p.clock.runFor(6500);
      await p.screenshot({ path: out + "/fase-" + id + ".png" });
      console.log(
        "Fase",
        id,
        await p.evaluate(() => ({
          scene: (window.GuardiaoJornada || window.GuardiaoFloresta).estado()
            .scene,
          kai: BosqueKai.state(),
          error: document.getElementById("loading").textContent,
        })),
      );
    }
    if (errors.length) throw Error(errors.join("\n"));
    console.log(
      "PASS inspeção inicial das cinco fases, sem erros de script ou recursos",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
