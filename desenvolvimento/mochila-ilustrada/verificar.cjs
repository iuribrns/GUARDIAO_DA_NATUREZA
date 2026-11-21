"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  { chromium } = require("playwright-core");
const base =
    process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4189/jogo/viva/",
  out = "test-results/mochila-ilustrada";
fs.mkdirSync(out, { recursive: true });
async function assets(p) {
  await p.evaluate(async () => {
    const urls = [
      ...new Set(
        [...document.querySelectorAll("#mochila-jornada image")].map((e) =>
          e.getAttribute("href"),
        ),
      ),
    ];
    await Promise.all(
      urls.map(async (url) => {
        const im = new Image();
        im.src = url;
        await im.decode();
      }),
    );
    await document.fonts.ready;
  });
}
async function layout(p, label) {
  const result = await p.locator("#mochila-jornada").evaluate((dialog) => {
    const pack = dialog.getBoundingClientRect(),
      body = dialog.querySelector("#pack-content"),
      rect = body.getBoundingClientRect();
    const luminance = (rgb) =>
      rgb
        .map((v) =>
          (v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
        )
        .reduce((n, v, i) => n + v * [0.2126, 0.7152, 0.0722][i], 0);
    const contrast = (color) => {
      const fg = luminance(
          color
            .match(/[\d.]+/g)
            .slice(0, 3)
            .map(Number),
        ),
        bg = luminance([255, 239, 204]);
      return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
    };
    const cards = [...body.querySelectorAll(".kit-card")].map((c) => {
      const r = c.getBoundingClientRect(),
        h = c.querySelector("h3").getBoundingClientRect(),
        text = c.querySelector("p").getBoundingClientRect(),
        art = c
          .querySelector(".kit-outfit-picture,.kit-gem-picture")
          .getBoundingClientRect();
      return {
        contained:
          r.x >= rect.x &&
          r.right <= rect.right + 1 &&
          r.y >= rect.y &&
          r.bottom <= rect.bottom + 1,
        readable:
          h.x >= r.x &&
          h.right <= r.right + 1 &&
          h.y >= r.y &&
          h.bottom <= text.top + 1 &&
          text.bottom <= r.bottom + 1,
        separated: art.height > 15 && art.bottom <= h.top + 1,
        contrast: Math.min(
          contrast(getComputedStyle(c.querySelector("h3")).color),
          contrast(getComputedStyle(c.querySelector("p")).color),
        ),
        border: getComputedStyle(c).borderStyle,
      };
    });
    const button = dialog
        .querySelector("[data-pack-close]")
        .getBoundingClientRect(),
      icon = dialog
        .querySelector("[data-pack-close] svg")
        .getBoundingClientRect();
    return {
      contained:
        pack.x >= 0 &&
        pack.y >= 0 &&
        pack.right <= innerWidth + 1 &&
        pack.bottom <= innerHeight + 1,
      scroll: body.scrollHeight <= body.clientHeight + 1,
      cards,
      close:
        button.width >= 44 &&
        button.height >= 44 &&
        Math.abs(button.x + button.width / 2 - icon.x - icon.width / 2) < 1 &&
        Math.abs(button.y + button.height / 2 - icon.y - icon.height / 2) < 1,
    };
  });
  assert.ok(
    result.contained && result.scroll && result.close,
    label + JSON.stringify(result),
  );
  assert.equal(result.cards.length, 5);
  result.cards.forEach((c) =>
    assert.ok(
      c.contained &&
        c.readable &&
        c.separated &&
        c.contrast >= 4.5 &&
        c.border !== "dashed",
      label + JSON.stringify(c),
    ),
  );
}
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const [width, height] of [
      [1280, 720],
      [844, 390],
      [740, 320],
      [667, 375],
    ]) {
      for (const n of [0, 2, 5]) {
        const p = await browser.newPage({
            viewport: { width, height },
            isMobile: width < 1000,
            hasTouch: width < 1000,
          }),
          errors = [],
          requested = [];
        p.setDefaultTimeout(20000);
        p.on("pageerror", (e) => errors.push(e.message));
        p.on("response", (r) => {
          if (r.status() >= 400) errors.push(r.status() + " " + r.url());
        });
        p.on("request", (r) => {
          if (r.url().includes("mochila-ilustrada/assets/"))
            requested.push(r.url());
        });
        await p.addInitScript((n) => {
          const completed = Array.from({ length: n }, (_, i) => i + 1),
            grants = n === 2 ? [1, 2, 3] : completed;
          localStorage.setItem(
            "guardiao.mapa.progresso.v1",
            JSON.stringify({ completed, current: Math.min(5, n + 1) }),
          );
          localStorage.setItem(
            "guardiao.amanha.memoria.v1",
            JSON.stringify({
              version: 1,
              grants,
              found: [],
              uniform:
                n === 5 ? "voluntario" : n === 2 ? "resgate" : "explorador",
              phases: {},
            }),
          );
          localStorage.setItem("guardiao.viva.final.v1", "visto");
        }, n);
        await p.goto(base + "index.html#mapa");
        await p.waitForFunction(
          () =>
            document.body.dataset.uiReady === "true" &&
            !VivaTransicao.state().busy,
        );
        assert.deepEqual(
          requested,
          [],
          "as artes não carregam antes da mochila",
        );
        const before = await p.evaluate(() => ({
          memory: GuardiaoMemoria.read(),
          progress: GuardiaoProgresso.read(),
        }));
        if (width < 1000) await p.locator("#map-backpack").tap();
        else await p.keyboard.press("b");
        await p.locator("#mochila-jornada").waitFor({ state: "visible" });
        for (const tab of ["crystals", "uniforms"]) {
          await p.locator(`button[data-pack-tab="${tab}"]`).click();
          await assets(p);
          await layout(p, `${width} ${n} ${tab}: `);
          if (tab === "crystals") {
            assert.equal(await p.locator(".kit-crystal.is-known").count(), n);
            assert.equal(
              await p.locator("[data-kit-empty-gem]").count(),
              5 - n,
            );
            assert.equal(await p.locator(".kit-crystal .kit-check").count(), n);
            assert.equal(
              await p.locator(".kit-necklace figcaption").textContent(),
              n + " de 5 cristais",
            );
          } else {
            assert.equal(await p.locator("[data-uniform]").count(), 5);
            assert.equal(
              await p.locator(".kit-uniform.is-known").count(),
              n === 0 ? 1 : n === 2 ? 3 : 5,
            );
            assert.equal(await p.locator(".kit-uniform.is-worn").count(), 1);
            assert.equal(await p.locator(".worn-label").count(), 1);
            assert.equal(
              await p
                .locator(".kit-uniform.is-worn")
                .getAttribute("data-uniform"),
              n === 5 ? "voluntario" : n === 2 ? "resgate" : "explorador",
            );
            for (const e of await p.locator(".kit-outfit").all())
              assert.equal(
                await e.locator("image").count(),
                1,
                "uma pose por traje",
              );
            assert.ok(
              await p.locator("[data-uniform=explorador]").evaluate((e) => {
                const first = e;
                e.click();
                return first.isConnected;
              }),
              "clicar no cartão não recria o painel",
            );
          }
          await p.screenshot({
            path: `${out}/${tab}-${n}-${width}.png`,
            animations: "disabled",
          });
        }
        assert.deepEqual(
          await p.evaluate(() => ({
            memory: GuardiaoMemoria.read(),
            progress: GuardiaoProgresso.read(),
          })),
          before,
          "abrir abas não muda a partida",
        );
        await p.locator("button[data-pack-tab=uniforms]").focus();
        await p.keyboard.press("ArrowLeft");
        assert.equal(
          await p.locator("#mochila-jornada").getAttribute("data-pack-view"),
          "crystals",
        );
        await p.locator("button[data-pack-tab=uniforms]").focus();
        await p.keyboard.press("Enter");
        assert.equal(
          await p.locator("#mochila-jornada").getAttribute("data-pack-view"),
          "uniforms",
        );
        if (n === 2) {
          await p.evaluate(() => GuardiaoMemoria.grant(4));
          assert.equal(
            await p.locator(".kit-uniform.is-known").count(),
            4,
            "coleção aberta acompanha novas descobertas",
          );
        }
        await p.locator("button[data-pack-tab=items]").click();
        assert.equal(
          await p.locator(".brisa-collection [data-item]").count(),
          16,
        );
        await p.keyboard.press("b");
        await p.locator("#mochila-jornada").waitFor({ state: "hidden" });
        await p.locator("#map-backpack").click();
        await p.locator("[data-pack-close]").click();
        await p.locator("#mochila-jornada").waitFor({ state: "hidden" });
        assert.deepEqual(errors, []);
        await p.close();
        console.log(
          "PASS mochila, estado, contraste, encaixe e teclado/toque:",
          width,
          height,
          n,
          "cristais",
        );
      }
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
