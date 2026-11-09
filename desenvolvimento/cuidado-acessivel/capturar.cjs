"use strict";
const { chromium } = require("playwright-core"),
  fs = require("node:fs"),
  path = require("node:path");
const origin = process.env.GUARDIAO_CAPTURE_URL || "http://127.0.0.1:5173/",
  out = process.argv[2] || "/tmp/guardiao-cuidado";
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    fs.mkdirSync(out, { recursive: true });
    const p = await b.newPage({
      viewport: { width: 844, height: 390 },
      isMobile: true,
      hasTouch: true,
    });
    await p.clock.install();
    await p.addInitScript(() =>
      localStorage.setItem(
        "guardiao.mapa.progresso.v1",
        JSON.stringify({ completed: [1, 2, 3, 4], current: 1 }),
      ),
    );
    const snap = async (name) => {
      await p.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(
          [...document.images].map((im) => im.decode().catch(() => {})),
        );
      });
      await p.clock.runFor(800);
      await p.screenshot({ path: path.join(out, name + ".png") });
    };
    await p.goto(origin + "tela-inicial/nova-versao/configuracoes.html");
    for (let i = 0; i < 3; i++) {
      await p.locator("#settings-tab-" + i).click();
      await snap("configuracoes-" + i);
    }
    for (const id of [1, 3, 4, 5]) {
      await p.goto(
        origin +
          (id === 1
            ? "jogo/floresta-viva/index.html"
            : "jogo/jornada/index.html?fase=" + id),
      );
      await p.waitForFunction(() => document.body.dataset.gameReady === "true");
      const next = id === 1 ? "#conversa-avancar" : "#intro-next";
      await p.locator(next).click();
      await p.locator(next).click();
      await p.clock.runFor(2600);
      await snap("fase-" + id);
    }
    await p.evaluate(() => {
      document.querySelectorAll("dialog[open]").forEach((d) => d.close());
      const panel = document.createElement("main");
      panel.id = "galeria-cuidado";
      panel.style.cssText =
        "position:fixed;inset:0;z-index:999;background:#eee3c2;color:#315436;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,1fr);gap:12px;padding:18px;font:700 15px system-ui";
      ["recyclable", "organic", "residual", "ipê", "ingá", "aroeira"].forEach(
        (name, i) => {
          const c = document.createElement("figure");
          c.style.cssText =
            "display:flex;flex-direction:column;align-items:center;margin:0;min-height:0";
          c.innerHTML =
            (i < 3 ? GuardiaoColecao.bin(name) : GuardiaoColecao.plant(name)) +
            "<figcaption>" +
            ["Recicláveis", "Orgânicos", "Rejeitos", "Ipê", "Ingá", "Aroeira"][
              i
            ] +
            "</figcaption>";
          c.querySelector("svg").style.cssText =
            "height:calc(100% - 24px);max-width:100%";
          panel.append(c);
        },
      );
      document.body.append(panel);
    });
    await snap("lixeiras-e-mudas");
    console.log(out);
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
