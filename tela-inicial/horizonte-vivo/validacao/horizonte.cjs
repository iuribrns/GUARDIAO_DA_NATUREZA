"use strict";
const assert = require("node:assert/strict"),
  { chromium } = require("playwright-core");
const base =
    process.env.GUARDIAO_TEST_URL ||
    "http://127.0.0.1:5173/tela-inicial/nova-versao/",
  root = new URL("../../", base),
  KEY = "guardiao.mapa.progresso.v1";
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const errors = [];
  const watch = (p) => {
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("response", (r) => {
      if (r.status() >= 400) errors.push(r.status() + " " + r.url());
    });
  };
  try {
    const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
    watch(p);
    await p.clock.install();
    await p.goto(base + "index.html");
    await p.waitForFunction(
      () => document.body.dataset.menuCharactersReady === "true",
    );
    await p.clock.runFor(1100);
    assert.ok(
      await p
        .getByRole("link", { name: "Jogar", exact: true })
        .locator(".claude-card-art")
        .count(),
      "placas do menu anterior recuperadas",
    );
    const first = await p.locator("#horizon-fire").getAttribute("data-frame");
    await p.clock.runFor(230);
    assert.notEqual(
      await p.locator("#horizon-fire").getAttribute("data-frame"),
      first,
      "árvores distantes recebem fogo com quadros animados",
    );
    await p
      .getByRole("button", { name: "Conversar com Flora", exact: true })
      .click();
    await p.clock.runFor(100);
    assert.equal(
      await p.locator("#horizon-duo").getAttribute("data-frame"),
      "3",
    );
    assert.equal(
      await p.locator("#horizon-duo").getAttribute("data-flora"),
      "ombro",
    );
    await p.clock.runFor(4300);
    assert.equal(await p.locator(".camp-speech").isVisible(), false);
    const poses = new Set();
    for (let i = 0; i < 50; i++) {
      await p.clock.runFor(100);
      poses.add(await p.locator("#horizon-duo").getAttribute("data-frame"));
    }
    assert.ok(
      poses.has("0") && poses.has("1"),
      "Kai e Flora realmente piscam olhando o horizonte",
    );
    await p
      .getByRole("link", { name: "Abrir configurações", exact: true })
      .click();
    await p.clock.runFor(2200);
    await p.waitForURL("**/configuracoes.html");
    for (const v of [
      { width: 1280, height: 720 },
      { width: 390, height: 844 },
      { width: 320, height: 740 },
      { width: 844, height: 390 },
      { width: 667, height: 375 },
    ]) {
      await p.setViewportSize(v);
      await p.goto(base + "index.html");
      await p.waitForFunction(
        () => document.body.dataset.menuCharactersReady === "true",
      );
      const hero = await p.locator(".home-horizon-actors").boundingBox();
      assert.ok(
        hero.y > 0 && hero.y + hero.height <= v.height,
        "dupla no chão e dentro da tela",
      );
      assert.ok(
        await p.evaluate(
          () =>
            document.documentElement.scrollWidth <= innerWidth &&
            document.documentElement.scrollHeight <= innerHeight,
        ),
        "início sem cortes",
      );
      await p.goto(base + "aventura.html");
      await p.waitForFunction(
        () =>
          window.GuardiaoMapa && document.body.dataset.floraMapReady === "true",
      );
      assert.equal(await p.locator("#map-credits").count(), 0);
      assert.equal(await p.locator('[data-phase="6"]').count(), 0);
      const rect = await p.locator(".map-stage").boundingBox();
      assert.ok(
        rect.x === 0 &&
          rect.y === 0 &&
          Math.abs(rect.width - v.width) < 1 &&
          Math.abs(rect.height - v.height) < 1,
        "mapa ocupa toda a tela " + v.width,
      );
      assert.ok(
        await p
          .locator(".map-stage")
          .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
        "mapa sem deslocamento lateral",
      );
      const inside = await p.evaluate(() => {
        const title = document
            .querySelector(".journey-heading")
            .getBoundingClientRect(),
          info = document.querySelector(".map-bottom").getBoundingClientRect(),
          map = document.querySelector(".map-stage").getBoundingClientRect();
        return (
          title.top >= map.top &&
          title.bottom < map.bottom &&
          info.bottom <= map.bottom + 1 &&
          info.top > map.top
        );
      });
      assert.ok(inside, "título e informações dentro do cenário");
      const asset = await p.locator(".map-art").evaluate((e) => e.currentSrc);
      assert.equal(
        asset.includes("ilha-degradada-celular.webp"),
        v.width / v.height < 0.75,
        "arte adaptada à orientação",
      );
      const overlaps = await p.locator(".map-hotspot").evaluateAll((nodes) => {
        const rects = nodes.map((e) => e.getBoundingClientRect());
        return rects.some((a, i) =>
          rects.some(
            (b, j) =>
              i < j &&
              a.left < b.right &&
              a.right > b.left &&
              a.top < b.bottom &&
              a.bottom > b.top,
          ),
        );
      });
      assert.equal(
        overlaps,
        false,
        "as cinco placas têm áreas separadas em " + v.width,
      );
      for (const id of [1, 2, 3, 4, 5]) {
        await p.locator('.map-hotspot[data-phase="' + id + '"]').click();
        assert.equal(
          await p.locator("#phase-dialog").isVisible(),
          true,
          "placa " + id + " alcançável sem ser tampada pelo rodapé",
        );
        await p.locator("[data-map-action=close]").click();
      }
    }
    // A última restauração leva à comemoração; o mapa nunca vira uma sexta fase.
    await p.evaluate((key) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          completed: [1, 2, 3, 4, 5],
          current: 5,
          pendingRestoration: 5,
        }),
      );
      localStorage.setItem(
        "guardiao.jornada.fase.5.v1",
        JSON.stringify({ completed: true }),
      );
    }, KEY);
    await p.goto(base + "aventura.html?restaurar=5&destino=creditos");
    await p.waitForFunction(
      () => document.querySelector("#map-cutscene")?.hidden === false,
    );
    await p.clock.runFor(3100);
    await p.waitForURL("**/renascimento/creditos.html");
    await p.waitForFunction(() => document.body.dataset.endingReady === "true");
    assert.equal(
      await p.locator("body").getAttribute("data-party-members"),
      "5",
    );
    assert.equal(
      await p.locator("#ending-credits").isVisible(),
      false,
      "campo e festa aparecem antes dos agradecimentos",
    );
    const names = await p.locator(".ending-art").getAttribute("aria-label");
    for (const name of ["Carlos", "Antônio", "Marina", "Rafael", "Luciana"])
      assert.ok(names.includes(name));
    assert.equal(await p.locator("[data-ending-gem]").count(), 5);
    assert.equal(
      await p.locator("body").getAttribute("data-epilogue-scene"),
      "memorias",
    );
    for (let i = 0; i < 4; i++) await p.locator("#epilogue-next").click();
    await p.clock.runFor(2200);
    assert.equal(
      await p.locator("body").getAttribute("data-epilogue-scene"),
      "amuleto",
    );
    assert.equal(
      await p.locator("#ending-actors").getAttribute("data-pose"),
      "4",
    );
    await p.locator("#epilogue-next").click();
    assert.equal(
      await p.locator("#ending-actors").getAttribute("data-pose"),
      "7",
    );
    assert.equal(await p.locator("#ending-credits").isVisible(), false);
    await p.locator("#ending-pause").click();
    const stopped = await p.evaluate(() => GuardiaoEpilogo.estado().time);
    await p.clock.runFor(2000);
    assert.equal(
      await p.evaluate(() => GuardiaoEpilogo.estado().time),
      stopped,
    );
    await p.locator("#ending-pause").click();
    await p.clock.runFor(10000);
    assert.equal(await p.locator("#ending-credits").isVisible(), true);
    await p.locator("#ending-close-credits").click();
    const save = await p.evaluate((key) => localStorage.getItem(key), KEY);
    await p.locator("#ending-replay").click();
    assert.equal(
      await p.locator("body").getAttribute("data-epilogue-scene"),
      "memorias",
    );
    assert.equal(
      await p.evaluate((key) => localStorage.getItem(key), KEY),
      save,
    );
    await p.emulateMedia({ reducedMotion: "reduce" });
    for (let i = 0; i < 5; i++) await p.locator("#epilogue-next").click();
    await p.clock.runFor(100);
    assert.equal(
      await p.locator("#ending-actors").getAttribute("data-pose"),
      "7",
    );
    const fresh = await b.newPage();
    watch(fresh);
    const requests = [];
    fresh.on("request", (r) => requests.push(r.url()));
    await fresh.goto(
      new URL("tela-inicial/renascimento/creditos.html", root).href,
    );
    await fresh.waitForFunction(
      () => document.body.dataset.endingState === "locked",
    );
    assert.ok(
      !requests.some((u) => u.includes("/campo.webp")),
      "comemoração não é antecipada antes das cinco fases",
    );
    await fresh.close();
    assert.deepEqual(errors, []);
    console.log(
      "PASS: início recuperado, Kai e Flora no horizonte com piscadas, fogo animado, mapa realmente em tela inteira, cinco placas alcançáveis, arte móvel, informações dentro do mapa, final após cinco fases e comemoração no campo com todos os aliados.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
