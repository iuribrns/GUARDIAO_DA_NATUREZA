"use strict";
const { chromium } = require("playwright-core");
const fs = require("node:fs"),
  path = require("node:path");
const out = process.argv[2] || "/tmp/guardiao-encanto-natural";
const origin = process.env.GUARDIAO_CAPTURE_URL || "http://127.0.0.1:4173/";
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const errors = [];
  try {
    const p = await browser.newPage({
      viewport: { width: 844, height: 390 },
      isMobile: true,
      hasTouch: true,
    });
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("response", (r) => {
      if (r.status() >= 400) errors.push(r.status() + " " + r.url());
    });
    await p.clock.install();
    // Somente a galeria usa desbloqueio preparado. A campanha real tem teste próprio.
    await p.addInitScript(() =>
      localStorage.setItem(
        "guardiao.mapa.progresso.v1",
        JSON.stringify({ completed: [1, 2, 3, 4, 5], current: 1 }),
      ),
    );
    const snap = async (name) => {
      await p.evaluate(async () => {
        await document.fonts.ready;
        const urls = [...document.querySelectorAll("svg image")].map(
          (e) => e.href.baseVal,
        );
        await Promise.all(
          urls.map(async (src) => {
            const im = new Image();
            im.src = src;
            try {
              await im.decode();
            } catch {}
          }),
        );
      });
      await p.clock.runFor(600);
      await p.screenshot({ path: path.join(out, name + ".png") });
    };
    await p.goto(origin + "tela-inicial/nova-versao/aventura.html");
    await p.waitForFunction(() => window.GuardiaoMapa);
    await snap("mapa");
    for (const id of [1, 2, 3, 4, 5, 6]) {
      await p.locator(`.map-hotspot[data-phase="${id}"]`).tap();
      await snap("selecao-" + id);
      await p.locator("[data-map-action=close]").tap();
    }
    for (const id of [1, 2, 3, 4, 5]) {
      await p.goto(
        origin +
          (id === 1
            ? "jogo/floresta-viva/index.html"
            : "jogo/jornada/index.html?fase=" + id),
      );
      await p.waitForFunction(() => document.body.dataset.gameReady === "true");
      await snap("fala-" + id);
      const next = id === 1 ? "#conversa-avancar" : "#intro-next";
      await p.locator(next).tap();
      await p.locator(next).tap();
      await p.clock.runFor(4500);
      await snap("fase-" + id);
      if (id === 1) {
        await p.locator("#pausa").tap();
        await snap("pausa");
        await p.locator("#mochila").tap();
        await snap("mochila");
        await p.locator("[data-pack-tab=uniforms]").tap();
        await snap("uniformes");
        await p.locator("[data-pack-close]").first().tap();
      }
    }
    await p.goto(origin + "tela-inicial/nova-versao/aventura.html");
    await p.waitForFunction(() => window.GuardiaoArtesInterface);
    const gallery = await p.evaluate(async () => {
      await GuardiaoArtesInterface.load();
      document.querySelectorAll("dialog[open]").forEach((d) => d.close());
      const grid = document.createElement("main");
      grid.style.cssText =
        "position:relative;z-index:99999;width:100%;padding:24px;background:#f3e7c5;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;color:#335237;font:700 12px system-ui";
      const tools = [
        ["luvas", "Luva: cinco dedos"],
        ["mangueira", "Mangueira"],
        ["kit", "Kit de resgate"],
        ["rede", "Rede"],
        ["protecao", "Proteção"],
        ["corda", "Corda"],
        ["chave", "Chave"],
        ["pa", "Pá"],
        ["sementes", "Sementes"],
        ["regador", "Regador"],
        ["solar", "Painel solar"],
        ["mochila", "Mochila"],
      ];
      const symbols = [
        ["water", "Água"],
        ["fire", "Fogo"],
        ["paw", "Pata"],
        ["leaf", "Folha"],
        ["trash", "Lixeira"],
        ["fish", "Peixe"],
        ["turtle", "Tartaruga"],
        ["recycle", "Reciclagem"],
        ["sun", "Sol"],
        ["gear", "Configurações"],
        ["lock", "Cadeado"],
        ["shield", "Proteção"],
        ["heart", "Cuidado"],
        ["bike", "Bicicleta"],
        ["bus", "Ônibus"],
        ["compass", "Bússola"],
      ];
      for (const [equipment, items] of [
        [true, tools],
        [false, symbols],
      ])
        for (const [key, name] of items) {
          const cell = document.createElement("figure");
          cell.style.cssText =
            "margin:0;padding:12px;background:#fff8e7;border:1px solid #b1b27d;border-radius:15px 5px;text-align:center";
          cell.innerHTML = `<div style="height:128px;margin:0 auto 10px">${GuardiaoArtesInterface.svg(key, equipment)}</div><figcaption>${name}</figcaption>`;
          cell.querySelector("svg").style.cssText =
            "display:block;width:100%;height:100%";
          grid.append(cell);
        }
      return (
        '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Artes da interface</title><style>*{box-sizing:border-box}body{margin:0;background:#f3e7c5}svg{overflow:hidden}</style><body>' +
        grid.outerHTML +
        "</body></html>"
      );
    });
    await p.close();
    const sheet = await browser.newPage({
      viewport: { width: 844, height: 390 },
    });
    sheet.on("pageerror", (e) => errors.push(e.message));
    await sheet.setContent(gallery);
    await sheet.screenshot({
      path: path.join(out, "artes.png"),
      fullPage: true,
    });
    await sheet.close();
    if (errors.length) throw Error(errors.join("\n"));
    console.log("Capturas da interface: " + out);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
