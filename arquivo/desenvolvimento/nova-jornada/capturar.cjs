"use strict";
const { chromium } = require("playwright-core");
const fs = require("node:fs");
const path = require("node:path");
const out = process.argv[2] || "/tmp/guardiao-nova-jornada";
const origin = process.env.GUARDIAO_CAPTURE_URL || "http://127.0.0.1:4173/";
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 844, height: 390 },
      isMobile: true,
      hasTouch: true,
    });
    await page.clock.install();
    await page.addInitScript(() => {
      if (localStorage.getItem("galeria.inicializada")) return;
      localStorage.setItem(
        "guardiao.mapa.progresso.v1",
        JSON.stringify({ completed: [1, 2, 3, 4, 5], current: 5 }),
      );
      localStorage.setItem("galeria.inicializada", "1");
    });
    const snap = async (name) => {
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(
          [...document.images].map((image) => image.decode().catch(() => {})),
        );
      });
      await page.clock.runFor(1000);
      await page.screenshot({ path: path.join(out, name + ".png") });
    };
    await page.goto(origin + "tela-inicial/renascimento/creditos.html");
    await page.waitForFunction(
      () => document.body.dataset.endingReady === "true",
    );
    for (let i = 0; i < 5; i++) await page.locator("#epilogue-next").click();
    await snap("final-jogar-do-inicio");
    await page.locator("#ending-new-journey").click();
    await snap("confirmacao-nova-jornada");
    await page.locator("[data-new-confirm]").click();
    await page.waitForURL("**/nova-versao/index.html");
    await snap("inicio-tela-cheia");
    await page.goto(origin + "tela-inicial/nova-versao/aventura.html");
    await page.waitForFunction(() => window.GuardiaoMapa);
    await snap("mapa-reiniciado");
    await page.goto(origin + "jogo/floresta-viva/index.html");
    await page.waitForFunction(
      () => document.body.dataset.gameReady === "true",
    );
    await page.locator("#conversa-avancar").click();
    await page.locator("#conversa-avancar").click();
    await page.clock.runFor(2400);
    await page.locator("#app-fullscreen").click();
    await page.waitForFunction(
      () => GuardiaoTela.state().fullscreen && !GuardiaoTela.state().pending,
    );
    await snap("fase-tela-cheia");
    await page.locator("#pausa").click();
    await snap("pausa-sair-da-tela-cheia");
    console.log("Capturas salvas em " + out);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
