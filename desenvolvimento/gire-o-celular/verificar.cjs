"use strict";
const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
const base =
    process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4189/jogo/viva/",
  out = "test-results/gire-o-celular";
fs.mkdirSync(out, { recursive: true });
function seed() {
  localStorage.setItem(
    "guardiao.mapa.progresso.v1",
    JSON.stringify({ completed: [1, 2, 3, 4, 5], current: 5 }),
  );
  localStorage.setItem("guardiao.viva.final.v1", "visto");
  for (let id = 2; id <= 5; id++)
    localStorage.setItem(
      "guardiao.jornada.fase." + id + ".v1",
      JSON.stringify({
        version: 1,
        phase: id,
        itemsGiven: true,
        protective: true,
        completed: false,
        tasks: [],
      }),
    );
  window.rotateCalls = [];
  // Nem todo celular oferece essas APIs. O jogador deve poder girar à mão.
  HTMLElement.prototype.requestFullscreen = async () => {
    rotateCalls.push("fullscreen");
    throw new Error("Tela cheia indisponível neste teste");
  };
  screen.orientation.lock = async () => {
    rotateCalls.push("landscape");
    throw new Error("Rotação automática indisponível neste teste");
  };
}
async function fits(p) {
  const result = await p.locator("#girar-celular").evaluate((dialog) => {
    const card = dialog.querySelector(".rotate-card").getBoundingClientRect(),
      ids = [
        ".rotate-brand",
        ".rotate-flora",
        ".rotate-kicker",
        "#girar-titulo",
        "#girar-dica",
        "#girar-tela-cheia",
        "#girar-status",
      ],
      boxes = ids.map((s) =>
        dialog.querySelector(s).getBoundingClientRect().toJSON(),
      );
    return {
      card: card.toJSON(),
      boxes,
      w: innerWidth,
      h: innerHeight,
      scroll: dialog.scrollHeight > dialog.clientHeight + 1,
      stretched: [...dialog.querySelectorAll("img")].some(
        (im) =>
          Math.abs(
            im.clientWidth / im.clientHeight -
              im.naturalWidth / im.naturalHeight,
          ) > 0.02,
      ),
      sizes: [...dialog.querySelectorAll("img")].map((im) => im.naturalWidth),
    };
  });
  assert.ok(!result.scroll, "aviso cabe sem rolagem");
  assert.ok(!result.stretched, "proporções originais do kit");
  assert.ok(result.sizes.every((n) => n > 900));
  for (const b of result.boxes) {
    assert.ok(
      b.x >= 0 &&
        b.y >= 0 &&
        b.x + b.width <= result.w + 1 &&
        b.y + b.height <= result.h + 1,
      "conteúdo dentro da tela",
    );
  }
  for (let i = 1; i < result.boxes.length - 1; i++)
    assert.ok(
      result.boxes[i].bottom <= result.boxes[i + 1].top + 1,
      "ilustração, textos e botão separados",
    );
  assert.ok(result.boxes[5].height >= 44, "área de toque acessível");
}
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const errors = [];
  try {
    for (const [w, h] of [
      [320, 568],
      [360, 640],
      [390, 844],
      [412, 915],
    ]) {
      const p = await browser.newPage({
        viewport: { width: w, height: h },
        isMobile: true,
        hasTouch: true,
      });
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("response", (r) => {
        if (r.status() >= 400) errors.push(r.status() + " " + r.url());
      });
      await p.addInitScript(seed);
      await p.goto(base + "index.html");
      await p.locator("#girar-celular").waitFor({ state: "visible" });
      await p
        .locator("#girar-celular img")
        .evaluateAll((ims) => Promise.all(ims.map((im) => im.decode())));
      await p.evaluate(() => document.fonts.ready);
      await fits(p);
      await p.screenshot({ path: `${out}/celular-${w}.png` });
      await p.locator("#girar-tela-cheia").tap();
      await p.waitForFunction(
        () => !document.getElementById("girar-tela-cheia").disabled,
      );
      assert.deepEqual(await p.evaluate(() => rotateCalls), [
        "fullscreen",
        "landscape",
      ]);
      assert.equal(
        await p.locator("#girar-acao").textContent(),
        "JOGAR NA HORIZONTAL",
      );
      assert.match(
        await p.locator("#girar-status").textContent(),
        /com as mãos/,
      );
      await fits(p);
      await p.setViewportSize({ width: h, height: w });
      await p.locator("#girar-celular").waitFor({ state: "hidden" });
      assert.equal(await p.evaluate(() => GuardiaoOrientacao.blocked), false);
      await p.close();
      console.log("PASS kit, encaixe, proporções, toque e giro manual:", w, h);
    }
    for (let phase = 1; phase <= 5; phase++) {
      const p = await browser.newPage({
        viewport: { width: 844, height: 390 },
        isMobile: true,
        hasTouch: true,
      });
      p.on("pageerror", (e) => errors.push(e.message));
      const requested = [];
      p.on("request", (r) => {
        if (r.url().includes("gire-o-celular/assets/")) requested.push(r.url());
      });
      await p.addInitScript(seed);
      await p.goto(
        new URL(
          phase === 1
            ? "../floresta-viva/index.html"
            : "../jornada/index.html?fase=" + phase,
          base,
        ).href,
      );
      await p.waitForFunction(() => document.body.dataset.gameReady === "true");
      assert.deepEqual(requested, [], "o kit não pesa na entrada em paisagem");
      const save = await p.evaluate(() =>
        localStorage.getItem("guardiao.mapa.progresso.v1"),
      );
      await p.setViewportSize({ width: 390, height: 844 });
      await p.locator("#girar-celular").waitFor({ state: "visible" });
      await p
        .locator("#girar-celular img")
        .evaluateAll((ims) => Promise.all(ims.map((im) => im.decode())));
      await fits(p);
      assert.equal(
        await p.locator("#girar-tela-cheia").getAttribute("data-fullscreen"),
        null,
        "botão mantém seu controlador de rotação",
      );
      await p.locator("#girar-tela-cheia").tap();
      await p.waitForFunction(
        () => !document.getElementById("girar-tela-cheia").disabled,
      );
      assert.deepEqual(await p.evaluate(() => rotateCalls), [
        "fullscreen",
        "landscape",
      ]);
      await p.screenshot({ path: `${out}/fase-${phase}.png` });
      await p.keyboard.press("Escape");
      assert.ok(
        await p.locator("#girar-celular").isVisible(),
        "retrato continua bloqueado",
      );
      await p.setViewportSize({ width: 844, height: 390 });
      await p.locator("#girar-celular").waitFor({ state: "hidden" });
      assert.equal(
        await p.evaluate(() =>
          localStorage.getItem("guardiao.mapa.progresso.v1"),
        ),
        save,
        "girar preserva o progresso",
      );
      await p.close();
      console.log("PASS rotação, bloqueio, retomada e progresso: fase", phase);
    }
    const p = await browser.newPage({
      viewport: { width: 560, height: 800 },
      reducedMotion: "reduce",
    });
    await p.addInitScript(seed);
    await p.goto(base + "index.html");
    await p.locator("#girar-celular").waitFor({ state: "visible" });
    assert.equal(
      await p.locator("#girar-titulo").textContent(),
      "Amplie a janela",
    );
    assert.equal(
      await p.locator("#girar-acao").textContent(),
      "AMPLIAR A JANELA",
    );
    assert.equal(
      await p
        .locator(".rotate-flora")
        .evaluate((e) => getComputedStyle(e).animationName),
      "none",
    );
    await p.locator("#girar-tela-cheia").click();
    await p.waitForFunction(
      () => !document.getElementById("girar-tela-cheia").disabled,
    );
    assert.deepEqual(await p.evaluate(() => rotateCalls), ["fullscreen"]);
    await p.close();
    assert.deepEqual(errors, []);
    console.log(
      "PASS janela estreita, redução de movimento e recursos sem erros",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
