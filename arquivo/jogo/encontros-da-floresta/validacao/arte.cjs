"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright-core");
const base =
  process.env.GUARDIAO_TEST_URL ||
  "http://127.0.0.1:4173/tela-inicial/nova-versao/";
const root = new URL("../../", base);
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const p = await browser.newPage({
      viewport: { width: 844, height: 390 },
      isMobile: true,
      hasTouch: true,
    });
    const errors = [];
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
    await p.waitForFunction(
      () => window.GuardiaoMapa && window.GuardiaoRelicario,
    );
    const result = await p.evaluate(async () => {
      const atlas = GuardiaoEncontrosAtlas,
        failures = [];
      const prefix = new URL(
        "../../jogo/encontros-da-floresta/",
        location.href,
      );
      for (const s of atlas.scenes) {
        for (const field of ["normal", "blink"]) {
          const im = new Image();
          im.src = new URL(s[field], prefix).href;
          await im.decode();
          if (im.naturalWidth !== s.width || im.naturalHeight !== s.height)
            failures.push("câmera diferente no encontro " + s.id);
          const c = document.createElement("canvas");
          c.width = s.width;
          c.height = s.height;
          const ctx = c.getContext("2d");
          ctx.drawImage(im, 0, 0);
          const a = ctx.getImageData(0, 0, c.width, c.height).data;
          for (let y = 0; y < c.height; y++)
            for (let x = 0; x < c.width; x++)
              if (
                (x < 4 || x >= c.width - 4 || y < 4 || y >= c.height - 4) &&
                a[(y * c.width + x) * 4 + 3] > 0
              )
                failures.push("recorte no encontro " + s.id);
        }
      }
      const s = atlas.crystals,
        im = new Image();
      im.src = new URL(s.file, prefix).href;
      await im.decode();
      const c = document.createElement("canvas");
      c.width = s.width;
      c.height = s.height;
      const ctx = c.getContext("2d");
      ctx.drawImage(im, 0, 0);
      const a = ctx.getImageData(0, 0, c.width, c.height).data;
      const colors = s.frames.map((f) => {
        const [x, y, w, h] = f.bounds;
        let n = 0,
          r = 0,
          g = 0,
          b = 0;
        for (let yy = y; yy < y + h; yy++)
          for (let xx = x; xx < x + w; xx++) {
            const o = (yy * c.width + xx) * 4;
            if (a[o + 3] > 180) {
              r += a[o];
              g += a[o + 1];
              b += a[o + 2];
              n++;
            }
          }
        if (n < 500) failures.push("cristal vazio");
        return [r / n, g / n, b / n];
      });
      return {
        failures,
        colors,
        count: atlas.scenes.length,
        slots: atlas.mount.slots.length,
      };
    });
    assert.deepEqual(result.failures, []);
    assert.equal(result.count, 6);
    assert.equal(result.slots, 5);
    const [red, blue, yellow, green, purple] = result.colors;
    assert.ok(red[0] > red[1] * 1.1 && red[0] > red[2] * 1.1, "rubi vermelho");
    assert.ok(blue[2] > blue[0] * 1.1, "cristal azul");
    assert.ok(
      yellow[0] > yellow[2] * 1.1 && yellow[1] > yellow[2] * 1.1,
      "âmbar amarelo",
    );
    assert.ok(green[1] > green[0] * 1.1, "esmeralda verde");
    assert.ok(purple[0] + purple[2] > purple[1] * 2.1, "ametista violeta");
    for (let id = 1; id <= 5; id++) {
      await p.goto(base + "aventura.html?destino=" + id);
      await p.waitForFunction(
        (id) =>
          document.querySelector("#phase-dialog").open &&
          document
            .querySelector("#phase-meeting")
            .classList.contains("has-encontro") &&
          document.querySelector(".encontro-dupla").dataset.encontroPhase ===
            String(id),
        id,
      );
      assert.equal(
        await p
          .locator("#phase-dialog .encontro-dupla")
          .getAttribute("data-facing"),
        "kai-direita-aliado-esquerda",
      );
      assert.ok(
        (
          await p
            .locator(".journey-heading h1")
            .evaluate((e) => getComputedStyle(e).backgroundSize)
        ).includes("192px 96px"),
        "textura da madeira mantém escala fixa",
      );
      await p.goto(
        new URL(
          id === 1
            ? "jogo/floresta-viva/index.html"
            : "jogo/jornada/index.html?fase=" + id,
          root,
        ).href,
      );
      await p.waitForFunction(() => document.body.dataset.gameReady === "true");
      await p.clock.runFor(1000);
      await p.waitForFunction(() =>
        document
          .querySelector(".conversation-art")
          .classList.contains("has-encontro"),
      );
      const facing = await p.evaluate((id) => {
        const state = window.GuardiaoFloresta
            ? GuardiaoFloresta.estado()
            : GuardiaoJornada.estado(),
          n =
            id === 1
              ? { x: 245, y: 245 }
              : GuardiaoFasesJogaveis[id].npcPosition;
        return {
          actual: Number(document.body.dataset.talkDirection),
          wanted:
            (Math.round(
              (Math.atan2(-(n.y - state.player.y), n.x - state.player.x) * 4) /
                Math.PI,
            ) +
              8) %
            8,
          npc: document.body.dataset.npcFacing,
          wantedNpc: state.player.x < n.x ? "esquerda" : "direita",
        };
      }, id);
      assert.equal(
        facing.actual,
        facing.wanted,
        "Kai olha para o aliado na fase " + id,
      );
      assert.equal(
        facing.npc,
        facing.wantedNpc,
        "aliado olha para Kai na fase " + id,
      );
    }
    await p.locator("#intro-next").tap();
    await p.locator("#intro-next").tap();
    await p.clock.runFor(4500);
    await p.locator("#pausa").tap();
    await p.locator("#mochila").tap();
    await p.locator("[data-pack-tab=crystals]").tap();
    await p.waitForFunction(
      () =>
        document.querySelector(".pack-amulet > svg")?.dataset.relicario ===
        "novo",
    );
    assert.equal(await p.locator(".pack-card .cristal-folha").count(), 5);
    await p.goto(new URL("tela-inicial/renascimento/creditos.html", root).href);
    await p.waitForFunction(
      () =>
        window.GuardiaoEpilogo &&
        document.querySelector("#ending-necklace [data-relicario]"),
    );
    assert.equal(await p.locator("[data-ending-gem]").count(), 5);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: 12 poses com câmera igual e bordas livres, cinco joias nas cores corretas, madeira sem esticar, cinco encontros automáticos e na fase, olhares para o aliado, mochila e epílogo com a mesma montura.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
