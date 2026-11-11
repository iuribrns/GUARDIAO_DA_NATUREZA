"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  { chromium } = require("playwright-core");
const base =
    process.env.GUARDIAO_TEST_URL ||
    "http://127.0.0.1:5173/tela-inicial/nova-versao/",
  root = new URL("../../", base);
const pictures = process.env.GUARDIAO_CAPTURE_DIR;
const errors = [];
const game = () =>
  window.GuardiaoJornada ? GuardiaoJornada.estado() : GuardiaoFloresta.estado();
async function inside(p, selector) {
  const r = await p.locator(selector).boundingBox();
  assert.ok(r, selector + " visível");
  const v = p.viewportSize();
  assert.ok(
    r.x >= -1 &&
      r.y >= -1 &&
      r.x + r.width <= v.width + 1 &&
      r.y + r.height <= v.height + 1,
    selector + " dentro da tela",
  );
  return r;
}
function overlaps(a, b) {
  return (
    a.x < b.x + b.width - 1 &&
    a.x + a.width > b.x + 1 &&
    a.y < b.y + b.height - 1 &&
    a.y + a.height > b.y + 1
  );
}
async function textFits(p, selector) {
  const bad = await p.locator(selector).evaluateAll((es) => {
    const out = [];
    for (const e of es) {
      const rect = e.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      const walker = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const n = walker.currentNode;
        if (
          !n.textContent.trim() ||
          n.parentElement.closest(
            "svg,[aria-hidden=true],.interaction-leaf,.sr-only",
          )
        )
          continue;
        const style = getComputedStyle(n.parentElement);
        if (style.visibility === "hidden" || style.display === "none") continue;
        const range = document.createRange();
        range.selectNodeContents(n);
        for (const r of range.getClientRects())
          if (
            r.width > 0 &&
            (r.left < rect.left - 2 || r.right > rect.right + 2)
          )
            out.push({
              text: n.textContent.trim().slice(0, 70),
              parent: e.id || e.tagName,
              left: r.left,
              right: r.right,
              boxLeft: rect.left,
              boxRight: rect.right,
            });
      }
    }
    return out;
  });
  assert.deepEqual(bad, [], "texto cabe nos botões e caixas");
}
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const viewport of [
      { width: 844, height: 390 },
      { width: 667, height: 375 },
      { width: 740, height: 320 },
      { width: 932, height: 430 },
      { width: 1024, height: 768 },
    ]) {
      const p = await b.newPage({ viewport, isMobile: true, hasTouch: true });
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("response", (r) => {
        if (r.status() >= 400) errors.push(r.status() + " " + r.url());
      });
      await p.clock.install();
      await p.addInitScript(() =>
        localStorage.setItem(
          "guardiao.mapa.progresso.v1",
          JSON.stringify({ completed: [1, 2, 3, 4, 5], current: 1 }),
        ),
      );
      await p.goto(base + "aventura.html");
      await p.waitForFunction(() => window.GuardiaoMapa);
      await p.clock.runFor(1200);
      assert.equal(await p.locator("#girar-celular").isVisible(), false);
      await inside(p, ".map-stage");
      for (let id = 1; id <= 6; id++) {
        await p.locator('.map-hotspot[data-phase="' + id + '"]').tap();
        await inside(p, "#phase-dialog");
        await inside(p, "#phase-dialog [data-map-action=start]");
        await textFits(
          p,
          "#phase-title,#phase-dialog button,.meeting-npc span,.meeting-kai span",
        );
        await p.locator("[data-map-action=close]").tap();
      }
      for (const name of [
        "configuracoes.html",
        "sobre.html#controls",
        "sobre.html#team",
      ]) {
        await p.goto(base + name);
        await p.clock.runFor(1000);
        assert.equal(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
      }
      if (viewport.width === 932) {
        await p.goto(base + "configuracoes.html");
        await p.clock.runFor(600);
        await p.locator("#leftHanded").check();
        await p.locator("#largeText").check();
        await p.locator("#controlSize").fill("100");
      }
      for (let id = 1; id <= 5; id++) {
        await p.goto(
          new URL(
            id === 1
              ? "jogo/floresta-viva/index.html"
              : "jogo/jornada/index.html?fase=" + id,
            root,
          ).href,
        );
        await p.waitForFunction(
          () => document.body.dataset.gameReady === "true",
        );
        const intro = id === 1 ? "#conversa" : "#intro",
          next = id === 1 ? "#conversa-avancar" : "#intro-next";
        await inside(p, intro);
        await textFits(p, intro + " h2," + intro + " p," + next);
        await p.locator(next).tap();
        await textFits(p, intro + " h2," + intro + " p," + next);
        await p.locator(next).tap();
        await p.clock.runFor(id === 2 ? 4500 : 2200);
        const controls = [];
        for (const selector of [
          "#joystick",
          "#mangueira",
          "#ferramenta",
          "#interagir",
          "#mochila",
          "#ajuda",
          "#jump-action",
        ])
          if (await p.locator(selector).isVisible()) {
            const r = await inside(p, selector);
            controls.push({ selector, ...r });
            assert.ok(
              r.width >= 43 && r.height >= 43,
              selector + " alvo confortável ao toque",
            );
          }
        for (let i = 0; i < controls.length; i++)
          for (let j = i + 1; j < controls.length; j++)
            assert.equal(
              overlaps(controls[i], controls[j]),
              false,
              "controles separados " +
                controls[i].selector +
                "/" +
                controls[j].selector,
            );
        await p.locator("#pausa").tap();
        await inside(p, "#menu-pausa");
        for (const el of await p
          .locator(
            "#menu-pausa .pause-buttons>button,#menu-pausa .pause-buttons>a",
          )
          .all()) {
          const r = await el.boundingBox();
          const d = await p.locator("#menu-pausa").boundingBox();
          assert.ok(
            r.y >= d.y && r.y + r.height <= d.y + d.height + 1,
            "todas as opções de pausa visíveis",
          );
        }
        await textFits(p, "#menu-pausa h2,#menu-pausa button,#menu-pausa a");
        await p.getByRole("button", { name: "Continuar", exact: true }).tap();
        await p.locator("#mochila").tap();
        await inside(p, "#mochila-jornada");
        for (const tab of ["items", "crystals", "uniforms"]) {
          await p.locator("[data-pack-tab=" + tab + "]").tap();
          await textFits(p, ".pack-card h3,.journey-pack button");
          assert.ok(
            await p
              .locator("#pack-content")
              .evaluate((e) => e.clientHeight > 90),
            "área real de consulta na mochila",
          );
        }
        await p.locator("[data-pack-close]").first().tap();
        if (viewport.width === 844) {
          if (pictures) {
            fs.mkdirSync(pictures, { recursive: true });
            await p.screenshot({
              path: path.join(pictures, "fase-" + id + "-paisagem.png"),
            });
          }
          const before = await p.evaluate(game);
          await p.setViewportSize({ width: 390, height: 844 });
          await p.clock.runFor(500);
          assert.equal(await p.locator("#girar-celular").isVisible(), true);
          const frozen = await p.evaluate(game);
          await p.clock.runFor(3000);
          const still = await p.evaluate(game);
          assert.equal(still.player.x, frozen.player.x);
          assert.equal(still.player.y, frozen.player.y);
          if (id === 1) assert.equal(still.clock, frozen.clock);
          else assert.equal(still.elapsed, frozen.elapsed);
          await p.setViewportSize(viewport);
          await p.clock.runFor(100);
          assert.equal(await p.locator("#girar-celular").isVisible(), false);
          const resumed = await p.evaluate(game);
          assert.equal(resumed.player.x, before.player.x);
          assert.equal(resumed.player.y, before.player.y);
        }
      }
      await p.goto(
        new URL("tela-inicial/renascimento/creditos.html", root).href,
      );
      await p.waitForFunction(
        () => document.body.dataset.endingReady === "true",
      );
      for (let i = 0; i < 5; i++) await p.locator("#epilogue-next").tap();
      await p.clock.runFor(150);
      await textFits(p, ".ending-actions button,.ending-actions a");
      for (const e of await p
        .locator(".ending-actions button,.ending-actions a")
        .all()) {
        const r = await e.boundingBox();
        assert.ok(r.y >= 0 && r.y + r.height <= viewport.height + 1);
      }
      await p.locator("#ending-open-credits").tap();
      await inside(p, "#ending-credits");
      await textFits(p, ".credit-paper h3,.credit-paper p");
      assert.match(await p.locator("#credit-roll").textContent(), /Eric/);
      assert.match(await p.locator("#credit-roll").textContent(), /Nadson/);
      await p.close();
      console.log("PASS interface " + viewport.width + "×" + viewport.height);
    }
    // Rotation while a conversation is already open leaves that exact conversation intact.
    const p = await b.newPage({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    await p.clock.install();
    await p.goto(new URL("jogo/floresta-viva/index.html", root).href);
    await p.waitForFunction(() => document.body.dataset.gameReady === "true");
    assert.ok(await p.locator("#girar-celular").isVisible());
    const text = await p.locator("#conversa-texto").textContent();
    await p.clock.runFor(9000);
    assert.equal(await p.locator("#conversa-texto").textContent(), text);
    await p.setViewportSize({ width: 844, height: 390 });
    await p.clock.runFor(100);
    assert.equal(await p.locator("#conversa").isVisible(), true);
    assert.equal(await p.locator("#conversa-texto").textContent(), text);
    await p.close();
    assert.deepEqual(errors, []);
    console.log(
      "PASS: orientação obrigatória, congelamento e retomada, conversas preservadas, controles sem sobreposição, nomes contidos, pausa inteira, mochila, menus e créditos em cinco formatos deitados.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
