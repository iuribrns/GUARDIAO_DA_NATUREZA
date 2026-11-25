"use strict";
const assert = require("node:assert/strict"),
  { chromium } = require("playwright-core"),
  fs = require("node:fs");
const base = new URL(
    "../",
    process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4189/jogo/viva/",
  ),
  out = "test-results/remodelacao",
  phaseURL = (id) =>
    new URL(
      id === 1 ? "floresta-viva/index.html" : "jornada/index.html?fase=" + id,
      base,
    ).href;
fs.mkdirSync(out, { recursive: true });
async function context(
  browser,
  width = 1280,
  height = 720,
  accessible = false,
) {
  const c = await browser.newContext({
    viewport: { width, height },
    isMobile: width < 1000,
    hasTouch: width < 1000,
    reducedMotion: accessible ? "reduce" : "no-preference",
  });
  await c.addInitScript((accessible) => {
    localStorage.setItem(
      "guardiao.mapa.progresso.v1",
      JSON.stringify({ completed: [1, 2, 3, 4, 5], current: 5 }),
    );
    localStorage.setItem("guardiao.viva.final.v1", "visto");
    localStorage.setItem(
      "guardiao.horizonte.preferences.v1",
      JSON.stringify({ largeText: accessible, reduceMotion: accessible }),
    );
  }, accessible);
  return c;
}
async function open(p, id) {
  await p.goto(phaseURL(id), { waitUntil: "domcontentloaded" });
  await p.waitForSelector("#guardiao-game");
  const f = p.frame({ name: "guardiao-game" });
  await f.waitForFunction(() => !!window.GuardiaoCarregamento);
  return f;
}
async function ready(f) {
  await f.waitForFunction(() => document.body.dataset.gameReady === "true");
  await f.waitForFunction(() => document.body.dataset.transition === "pronta");
  assert.equal(await f.locator("#loading").isVisible(), false);
  const s = await f.evaluate(() => GuardiaoCarregamento.state());
  assert.equal(s.percent, 100);
  assert.equal(s.done, s.total);
  assert.equal(s.finished, true);
}
async function dialogFit(f) {
  await f.waitForFunction(
    () => !!document.querySelector(".remodel-talk[open]"),
  );
  // Wait for the existing entry animation before measuring the final layout.
  await f.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      document
        .querySelector(".remodel-talk")
        .getAnimations()
        .map((a) => a.finished),
    );
  });
  const result = await f.locator(".remodel-talk").evaluate((d) => {
    const rect = d.getBoundingClientRect(),
      within = (r, p) =>
        r.x >= p.x - 1 &&
        r.y >= p.y - 1 &&
        r.right <= p.right + 1 &&
        r.bottom <= p.bottom + 1,
      children = [
        ...d.querySelectorAll(
          "header,.ra-talk-columns,.ra-talk-copy,footer,footer button,canvas",
        ),
      ];
    return {
      fits: within(rect, {
        x: 0,
        y: 0,
        right: innerWidth,
        bottom: innerHeight,
      }),
      children: children.every((e) => within(e.getBoundingClientRect(), rect)),
      noScroll:
        d.scrollWidth <= d.clientWidth + 1 &&
        d.scrollHeight <= d.clientHeight + 1,
      text: getComputedStyle(d.querySelector(".ra-talk-copy > p:last-child"))
        .fontSize,
      button: d.querySelector("footer button").getBoundingClientRect().height,
      left:
        d.querySelector("canvas").getBoundingClientRect().right <=
        d.querySelector(".ra-talk-copy").getBoundingClientRect().x,
    };
  });
  assert.ok(
    result.fits && result.children && result.noScroll && result.left,
    JSON.stringify(result),
  );
  assert.ok(parseFloat(result.text) >= 15);
  assert.ok(result.button >= 44);
}
async function seedVictory(f, id) {
  await f.evaluate((id) => {
    const s = GuardiaoJornada.estado();
    localStorage.setItem(
      "guardiao.colar.fragmentos.v1",
      JSON.stringify(Array.from({ length: id }, (_, i) => i + 1)),
    );
    localStorage.setItem(
      `guardiao.jornada.fase.${id}.v1`,
      JSON.stringify({
        version: 1,
        phase: id,
        itemsGiven: true,
        completed: true,
        protective: true,
        water: 100,
        tasks: s.tasks.map((t) => ({
          id: t.id,
          status: ["fish", "turtle", "cage", "kitten", "bird", "care"].includes(
            t.type,
          )
            ? "safe"
            : "done",
          progress: 1,
          quizPassed: true,
          seedSpecies: "pau-brasil",
        })),
      }),
    );
  }, id);
  await f.goto(phaseURL(id));
  await ready(f);
  await f.locator("#vitoria").waitFor();
  const stats = await f.locator("#victory-stats").evaluate((root) => {
    const r = root.getBoundingClientRect();
    return {
      count: root.children.length,
      width: r.width,
      cards: [...root.children].map((c) => {
        const b = c.getBoundingClientRect();
        return {
          width: b.width,
          center: b.x + b.width / 2,
          text: c.textContent,
          frame: c.querySelectorAll(".remodel-stat-frame").length,
          fit: b.x >= r.x - 1 && b.right <= r.right + 1,
          scroll: c.scrollWidth > c.clientWidth + 1,
        };
      }),
      center: r.x + r.width / 2,
    };
  });
  assert.equal(stats.count, id === 4 ? 1 : 3);
  assert.ok(
    stats.cards.every((c) => c.frame === 1 && c.fit && !c.scroll),
    JSON.stringify(stats),
  );
  if (id === 4) {
    assert.ok(stats.cards[0].width <= 440);
    assert.ok(Math.abs(stats.cards[0].center - stats.center) < 1);
    assert.match(stats.cards[0].text, /6/);
  }
  assert.equal(await f.locator(".resumo-acoes a").count(), 1);
  assert.equal(await f.locator(".resumo-acoes button").count(), 0);
}
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const [width, height] of [
      [1280, 720],
      [844, 390],
      [740, 320],
      [667, 375],
    ]) {
      const c = await context(b, width, height, width === 740),
        p = await c.newPage(),
        errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      if (width === 740)
        await p.emulateMedia({ reducedMotion: "no-preference" });
      if (width === 667) await p.emulateMedia({ reducedMotion: "reduce" });
      p.on("response", (r) => {
        if (r.status() >= 400) errors.push(r.status() + " " + r.url());
      });
      await p.goto(new URL("viva/index.html#inicio", base).href, {
        waitUntil: "domcontentloaded",
      });
      await p.waitForSelector("#guardiao-game");
      const home = p.frame({ name: "guardiao-game" });
      await home.waitForFunction(
        () =>
          document.body.dataset.uiReady === "true" &&
          document.body.dataset.transition === "pronta",
      );
      assert.ok(
        await home.locator("#settings-game").evaluate((b) => {
          const r = b.getBoundingClientRect();
          return (
            getComputedStyle(b).position === "absolute" &&
            r.x >= innerWidth - 125 &&
            r.y >= innerHeight - 125 &&
            r.right <= innerWidth &&
            r.bottom <= innerHeight
          );
        }),
        "engrenagem permanece inteira no canto inferior direito",
      );
      await p.screenshot({ path: `${out}/inicio-${width}.png` });
      for (let id = 1; id <= 5; id++) {
        const f = await open(p, id);
        await ready(f);
        await dialogFit(f);
        if (width === 740)
          assert.ok(
            await f
              .locator("#intro-text,#conversa-texto")
              .evaluate((e) => parseFloat(getComputedStyle(e).fontSize) >= 17),
            "preferência de texto maior respeitada",
          );
        if (width === 740 || width === 667)
          assert.equal(
            await f
              .locator("[data-load-fill]")
              .evaluate((e) => getComputedStyle(e).transitionDuration),
            "0s",
            "menos movimento pelo jogo ou pelo sistema",
          );
        await p.screenshot({ path: `${out}/dialogo-${id}-${width}.png` });
        const icons = await f.locator(".top-actions button").evaluateAll((bs) =>
          bs.map((b) => {
            const r = b.getBoundingClientRect(),
              a = b
                .querySelector(".remodel-full,.remodel-icon")
                ?.getBoundingClientRect();
            return {
              target: r.width >= 44 && r.height >= 44,
              centered:
                a &&
                Math.abs(r.x + r.width / 2 - a.x - a.width / 2) < 1 &&
                Math.abs(r.y + r.height / 2 - a.y - a.height / 2) < 1,
            };
          }),
        );
        assert.ok(
          icons.every((i) => i.target && i.centered),
          JSON.stringify(icons),
        );
        assert.ok(
          await f.locator("#interagir").evaluate((b) => {
            const r = b.getBoundingClientRect(),
              i = b.querySelector(".remodel-icon").getBoundingClientRect(),
              t = document
                .querySelector(".actions .hud-tool")
                .getBoundingClientRect();
            return (
              Math.abs(r.x - i.x) < 1 &&
              Math.abs(r.y - i.y) < 1 &&
              Math.abs(r.width - i.width) < 1 &&
              Math.abs(r.height - i.height) < 1 &&
              Math.abs(r.y + r.height / 2 - t.y - t.height / 2) < 1
            );
          }),
          "cuidar e ferramenta têm aros inteiros e centros alinhados",
        );
        if (id === 4 || id === 5) {
          const tool = await f.locator("#ferramenta").evaluate((b) => {
            const r = b.getBoundingClientRect(),
              a = b
                .querySelector("#tool-icon .remodel-icon")
                .getBoundingClientRect();
            return (
              Math.abs(r.width - a.width) < 1 &&
              Math.abs(r.height - a.height) < 1 &&
              Math.abs(r.x - a.x) < 1 &&
              Math.abs(r.y - a.y) < 1
            );
          });
          assert.ok(
            tool,
            "emblema da ferramenta ocupa o botão sem ficar deslocado",
          );
          assert.equal(await f.locator("#ferramenta .hud-ring").count(), 0);
        }
        if (id === 5) {
          assert.deepEqual(
            await f.evaluate(() =>
              GuardiaoCidadeBins.map((b) => b.kind).sort(),
            ),
            ["glass", "metal", "paper", "plastic"],
          );
          assert.ok(
            await f.evaluate(() =>
              GuardiaoRemodelacao.bank.has("materiais/painel-solar"),
            ),
          );
        }
      }
      for (const id of [4, 5]) {
        const f = await open(p, id);
        await ready(f);
        await seedVictory(f, id);
        await p.screenshot({ path: `${out}/conclusao-${id}-${width}.png` });
      }
      assert.deepEqual(errors, []);
      await c.close();
      console.log(
        "PASS cinco fases, diálogos, controles e conquistas",
        width + "x" + height,
      );
    }
    // A dependency held by the network cannot produce a fake 100% or start the phase.
    const c = await context(b),
      p = await c.newPage();
    let release,
      requested = false;
    const gate = new Promise((r) => (release = r));
    await c.route("**/remodelacao/assets/icones/cuidar.webp", async (r) => {
      requested = true;
      await gate;
      await r.continue();
    });
    let f = await open(p, 2);
    await f.waitForFunction(
      () => document.body.dataset.loadingState === "loading",
    );
    await f.locator("#loading").waitFor();
    await f.waitForFunction(
      () => document.body.dataset.transition === "pronta",
    );
    await p.waitForTimeout(1200);
    assert.ok(requested);
    const before = await f.evaluate(() => ({
      load: GuardiaoCarregamento.state(),
      player: GuardiaoJornada.estado().player,
    }));
    assert.ok(
      before.load.percent < 100 && before.load.done < before.load.total,
    );
    await p.keyboard.press("Enter");
    await p.keyboard.down("ArrowRight");
    await p.waitForTimeout(250);
    await p.keyboard.up("ArrowRight");
    assert.deepEqual(
      await f.evaluate(() => GuardiaoJornada.estado().player),
      before.player,
    );
    assert.notEqual(
      await f.locator("body").getAttribute("data-game-ready"),
      "true",
    );
    await p.screenshot({ path: `${out}/carregamento-real.png` });
    release();
    await ready(f);
    await c.close();
    // An essential art failure keeps a recoverable screen. A decorative background failure does not block play.
    for (const essential of [true, false]) {
      const c = await context(b),
        p = await c.newPage(),
        pattern = essential
          ? "**/remodelacao/assets/icones/cuidar.webp"
          : "**/remodelacao/assets/loading/fundo.webp";
      await c.route(pattern, (r) => r.abort("failed"));
      const f = await open(p, 3);
      if (essential) {
        await f.waitForFunction(
          () => document.body.dataset.loadingState === "error",
        );
        assert.ok(await f.locator(".remodel-retry").isVisible());
        assert.notEqual(
          await f.locator("body").getAttribute("data-game-ready"),
          "true",
        );
        assert.ok(
          (await f.evaluate(() => GuardiaoCarregamento.state())).percent < 100,
        );
        await p.screenshot({ path: `${out}/carregamento-erro.png` });
        await c.unroute(pattern);
        await f.locator(".remodel-retry").click();
      }
      await ready(f);
      await c.close();
    }
    console.log(
      "PASS progresso real, controles bloqueados, erro recuperável, nova tentativa e fundo opcional",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
