"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright-core");
const base =
  process.env.GUARDIAO_TEST_URL ||
  "http://127.0.0.1:5173/tela-inicial/nova-versao/";
const game = new URL("../../jogo/floresta-viva/index.html", base).href;
const seed = {
  version: 2,
  itemsGiven: true,
  released: true,
  equipped: true,
  hoseDrawn: true,
  water: 100,
  x: 286,
  y: 260,
  fires: Array(8).fill(1),
  animals: [],
  completed: false,
};
const state = (p) => p.evaluate(() => GuardiaoFloresta.estado());
async function ready(p) {
  await p.waitForFunction(() => GuardiaoFloresta.estado().ready);
}
async function guideFire(p) {
  await p.locator("[data-goal=fogo]").click();
  for (let i = 0; i < 120; i++) {
    await p.clock.runFor(400);
    if (!(await state(p)).route.length) return;
  }
  throw Error("Trilha para o fogo não termina");
}
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const errors = [];
  try {
    const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("response", (r) => {
      if (r.status() >= 400) errors.push(r.status() + " " + r.url());
    });
    await p.clock.install();
    await p.addInitScript(
      (seed) =>
        localStorage.setItem("guardiao.floresta-viva.v2", JSON.stringify(seed)),
      seed,
    );
    await p.goto(game);
    await ready(p);
    const art = await p.evaluate(async () => {
      const atlas = GuardiaoAguaAtlas,
        im = new Image();
      im.src = new URL("../agua-viva/" + atlas.file, location.href).href;
      await im.decode();
      const canvas = document.createElement("canvas");
      canvas.width = atlas.width;
      canvas.height = atlas.height;
      const c = canvas.getContext("2d", { willReadFrequently: true });
      c.drawImage(im, 0, 0);
      const pixels = c.getImageData(0, 0, canvas.width, canvas.height).data;
      const failures = [];
      for (const [i, f] of [...atlas.streams, ...atlas.splashes].entries()) {
        const [x, y, w, h] = f.bounds;
        let count = 0;
        for (let yy = y - 8; yy < y + h + 8; yy++)
          for (let xx = x - 8; xx < x + w + 8; xx++) {
            const alpha = pixels[(yy * atlas.width + xx) * 4 + 3];
            if (xx >= x && xx < x + w && yy >= y && yy < y + h) {
              if (alpha > 100) count++;
            } else if (alpha) failures.push("quadro " + i + " toca a margem");
          }
        if (count < 1000) failures.push("quadro " + i + " vazio");
      }
      const water = new GuardiaoAgua();
      await water.load();
      const c2 = document.createElement("canvas");
      c2.width = 400;
      c2.height = 200;
      const ctx = c2.getContext("2d");
      const sample = (time, reduced, contact = true) => {
        ctx.clearRect(0, 0, 400, 200);
        water.draw(ctx, { x: 30, y: 100 }, { x: 300, y: 100 }, time, reduced, {
          contact,
        });
        return c2.toDataURL();
      };
      const normal = new Set(
        Array.from({ length: 8 }, (_, i) => sample(i / 16 + 0.01, false)),
      );
      const reduced = [sample(1, true), sample(2, true), sample(7, true)];
      const free = sample(10, true, false),
        hit = sample(10, true, true);
      const cleanTransform =
        ctx.getTransform().isIdentity && ctx.globalAlpha === 1;
      const empty = water.draw(ctx, { x: 1, y: 1 }, { x: 1, y: 1 }, 0, false);
      // All eight directions keep their outlet on the blue metal, including the mirrored SW pose.
      const nozzleErrors = [];
      for (const moving of [false, true])
        for (let direction = 0; direction < 8; direction++) {
          const player = { x: 200, y: 200, direction, moving, distance: 0 };
          const nozzle = water.nozzle(player, 0, true);
          const name = "kai-mangueira",
            s = moving
              ? GuardiaoVidaAtlas[name]
              : GuardiaoFlorestaAtlas.sheets[name],
            f = s.frames[direction * (moving ? 4 : 2)],
            b = f.bounds,
            k = 63 / s.referenceHeight;
          const flipped = !moving && direction === 5;
          const x = f.pivot[0] + ((nozzle.x - 200) / k) * (flipped ? -1 : 1),
            y = f.pivot[1] + (nozzle.y - 200) / k;
          if (x < b[0] || x > b[0] + b[2] || y < b[1] || y > b[1] + b[3])
            nozzleErrors.push({ direction, moving });
        }
      return {
        frames: [atlas.streams.length, atlas.splashes.length],
        failures: failures.slice(0, 8),
        normal: normal.size,
        steady: reduced.every((s) => s === reduced[0]),
        impact: free !== hit,
        cleanTransform,
        empty,
        nozzleErrors,
      };
    });
    assert.deepEqual(art.frames, [8, 8]);
    assert.deepEqual(art.failures, []);
    assert.ok(art.normal >= 6, "os quadros mudam os pixels da água");
    assert.equal(
      art.steady,
      true,
      "redução de animações mantém a água estável",
    );
    assert.equal(art.impact, true, "respingos só aparecem em contato");
    assert.equal(art.cleanTransform, true);
    assert.equal(art.empty, -1);
    assert.deepEqual(art.nozzleErrors, []);
    await guideFire(p);
    const before = await state(p);
    await p.evaluate(() => {
      window.waterFrames = new Set();
      new MutationObserver(() =>
        waterFrames.add(document.body.dataset.waterFrame),
      ).observe(document.body, {
        attributes: true,
        attributeFilter: ["data-water-frame"],
      });
    });
    await p.keyboard.down(" ");
    await p.clock.runFor(900);
    let s = await state(p);
    assert.equal(s.waterEffect.active, true);
    assert.equal(s.waterEffect.sprites, true);
    assert.equal(s.waterEffect.impact, true);
    assert.ok(s.water < before.water);
    assert.ok(
      s.fires.some((f, i) => f.life < before.fires[i].life),
      "o jato continua apagando o fogo real",
    );
    assert.equal(
      (await p.evaluate(() => [...waterFrames].filter((x) => x !== "none")))
        .length,
      8,
      "a fase usa todos os quadros",
    );
    await p.keyboard.up(" ");
    await p.clock.runFor(120);
    assert.equal((await state(p)).waterEffect.active, false);
    const stopped = (await state(p)).water;
    await p.clock.runFor(350);
    assert.equal(
      (await state(p)).water,
      stopped,
      "soltar o botão para consumo e respingos",
    );
    await p.keyboard.down(" ");
    await p.clock.runFor(150);
    await p.keyboard.press("Escape");
    const clock = (await state(p)).clock;
    await p.clock.runFor(500);
    assert.equal((await state(p)).clock, clock);
    assert.equal((await state(p)).waterEffect.active, false);
    await p.keyboard.up(" ");
    await p.close();
    for (const viewport of [
      { width: 320, height: 740 },
      { width: 844, height: 390 },
    ]) {
      const phone = await browser.newPage({
        viewport,
        isMobile: true,
        hasTouch: true,
      });
      phone.on("pageerror", (e) => errors.push(e.message));
      await phone.clock.install();
      await phone.addInitScript(
        (seed) =>
          localStorage.setItem(
            "guardiao.floresta-viva.v2",
            JSON.stringify(seed),
          ),
        seed,
      );
      await phone.goto(game);
      await ready(phone);
      const r = await phone.locator("#mangueira").boundingBox();
      const cdp = await phone.context().newCDPSession(phone);
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ id: 1, x: r.x + r.width / 2, y: r.y + r.height / 2 }],
      });
      await phone.clock.runFor(400);
      assert.equal((await state(phone)).waterEffect.active, true);
      assert.equal(
        (await state(phone)).waterEffect.impact,
        false,
        "não cria impacto sem alvo",
      );
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchCancel",
        touchPoints: [],
      });
      await phone.clock.runFor(100);
      assert.equal((await state(phone)).waterEffect.active, false);
      assert.equal((await state(phone)).waterEffect.age, 0);
      assert.ok(
        await phone.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await phone.close();
    }
    const fallback = await browser.newPage();
    fallback.on("pageerror", (e) => errors.push(e.message));
    await fallback.clock.install();
    await fallback.route("**/agua-viva/assets/agua.webp", (r) => r.abort());
    await fallback.addInitScript(
      (seed) =>
        localStorage.setItem("guardiao.floresta-viva.v2", JSON.stringify(seed)),
      seed,
    );
    await fallback.goto(game);
    await ready(fallback);
    await fallback.keyboard.down(" ");
    await fallback.clock.runFor(300);
    assert.equal((await state(fallback)).waterEffect.sprites, false);
    assert.equal((await state(fallback)).waterEffect.active, true);
    assert.ok(
      (await state(fallback)).water < 100,
      "imagem indisponível não impede a mangueira",
    );
    await fallback.close();
    assert.deepEqual(errors, []);
    console.log(
      "PASS: 16 sprites de água completos, quadros reais, engates nas oito direções, impactos com alvo, fogo apagando, início/fim, pausa, toque/cancelamento, modo reduzido e alternativa sem imagem.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
