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
    const p = await b.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.addInitScript(() =>
      localStorage.setItem(
        "guardiao.mapa.progresso.v1",
        JSON.stringify({ completed: [1], current: 2 }),
      ),
    );
    await p.goto(new URL("jogo/jornada/index.html?fase=2", root).href);
    await p.waitForFunction(() => document.body.dataset.gameReady === "true");
    const poses = await p.evaluate(async () => {
      const art = new GuardiaoAdventureArt(2);
      await art.load();
      const out = [];
      for (let i = 0; i < 8; i++) {
        const c = document.createElement("canvas");
        c.width = c.height = 256;
        const ctx = c.getContext("2d");
        art.river(
          ctx,
          { x: 128, y: 168, direction: i, swimming: true, moving: false },
          0,
          true,
        );
        const px = ctx.getImageData(100, 124, 56, 60).data;
        let head = 0,
          water = 0;
        for (let j = 0; j < px.length; j += 4) {
          const y = 124 + Math.floor(j / 4 / 56);
          if (y < 156 && px[j + 3] > 220) head++;
          if (px[j + 3] > 25 && px[j + 3] < 210) water++;
        }
        out.push({ i, head, water });
      }
      return out;
    });
    for (const pose of poses) {
      assert.ok(pose.head > 30, "cabeça e visor visíveis na direção " + pose.i);
      assert.ok(
        pose.water > 50,
        "corpo submerso visível, sem recorte, na direção " + pose.i,
      );
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS: oito direções da natação com rosto/visor visíveis e corpo translúcido sob a água, sem apagar a cabeça.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
