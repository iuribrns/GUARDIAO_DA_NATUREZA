"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  { chromium } = require("playwright-core");
const base =
    process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4189/jogo/viva/",
  out = "test-results/reencontros-finais";
fs.mkdirSync(out, { recursive: true });
const phases = [
    "Floresta em Chamas",
    "Rio Poluído",
    "Resgate da Fauna",
    "Reflorestamento",
    "Cidade Sustentável",
  ],
  names = ["Carlos", "Antônio", "Marina", "Rafael", "Luciana"];
async function waitScene(f, index) {
  await f.waitForFunction(
    (i) => JornadaRetorno.state().ready && JornadaRetorno.state().index === i,
    index,
  );
  await f.evaluate(() => document.getElementById("return-art").decode());
}
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
  });
  try {
    for (const [w, h, quiet] of [
      [1280, 720, false],
      [1920, 720, false],
      [844, 390, false],
      [740, 320, false],
      [390, 844, false],
      [844, 390, true],
    ]) {
      const c = await b.newContext({
        viewport: { width: w, height: h },
        isMobile: w < 1000,
        hasTouch: w < 1000,
        reducedMotion: quiet ? "reduce" : "no-preference",
      });
      await c.addInitScript((q) => {
        if (sessionStorage.getItem("test.reencontros.init")) return;
        sessionStorage.setItem("test.reencontros.init", "true");
        localStorage.setItem(
          "guardiao.mapa.progresso.v1",
          JSON.stringify({ completed: [1, 2, 3, 4, 5], current: 5 }),
        );
        localStorage.setItem("guardiao.viva.final.v1", "visto");
        localStorage.setItem(
          "guardiao.horizonte.preferences.v1",
          JSON.stringify({
            largeText: q,
            reduceMotion: q,
            musicVolume: 25,
            controlMode: "keyboard",
          }),
        );
      }, quiet);
      const p = await c.newPage(),
        errors = [],
        requests = [];
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("response", (r) => {
        if (r.status() >= 400) errors.push(r.status() + " " + r.url());
      });
      p.on("request", (r) => requests.push(r.url()));
      await p.goto(base + "index.html#mapa", { waitUntil: "domcontentloaded" });
      await p.waitForSelector("#guardiao-game");
      const f = p.frame({ name: "guardiao-game" });
      await f.waitForFunction(() => document.body.dataset.uiReady === "true");
      await f.evaluate(() => {
        VivaFinal.start();
        localStorage.removeItem("guardiao.viva.final.v1");
        JornadaRetorno.paint = () => {};
      });
      await waitScene(f, 0);
      assert.equal(
        await f.locator("#girar-celular").isVisible(),
        false,
        "cenas podem ser vistas em retrato",
      );
      assert.equal(await f.locator("#return-previous").isDisabled(), true);
      await f.locator("#return-next").click();
      await waitScene(f, 1);
      await f.locator("#return-previous").click();
      await waitScene(f, 0);
      assert.equal(
        await f.evaluate(() => document.activeElement.id),
        "return-next",
        "voltar à primeira memória preserva foco útil",
      );
      for (let i = 0; i < 5; i++) {
        await waitScene(f, i);
        await p.waitForTimeout(350);
        await f.evaluate(() => document.fonts.ready);
        assert.equal(await f.locator("#return-title").textContent(), phases[i]);
        assert.match(
          await f.locator("#return-ally").textContent(),
          new RegExp(names[i]),
        );
        assert.equal(
          await f.locator("#return-count").textContent(),
          i + 1 + " de 5",
        );
        assert.equal(
          await f.locator('#return-crystals [role="img"]').count(),
          5,
        );
        assert.equal(
          await f.locator('#return-crystals [aria-current="step"]').count(),
          1,
        );
        assert.equal(
          await f
            .locator('#return-crystals [aria-current="step"]')
            .evaluate((e) => [...e.parentNode.children].indexOf(e)),
          i,
        );
        const g = await f.evaluate(() => {
          const im = document.getElementById("return-art"),
            r = im.getBoundingClientRect(),
            a = document
              .querySelector(".return-actions")
              .getBoundingClientRect(),
            caption = document
              .querySelector(".return-caption")
              .getBoundingClientRect();
          return {
            fit: getComputedStyle(im).objectFit,
            dimensions: [im.naturalWidth, im.naturalHeight],
            noCanvas: document.querySelectorAll("#journey-return canvas")
              .length,
            textInside: [
              ...document.querySelectorAll(
                "#return-title,#return-line,#return-ally",
              ),
            ].every((e) => {
              const b = e.getBoundingClientRect();
              return (
                b.left >= caption.left &&
                b.right <= caption.right + 1 &&
                b.bottom <= caption.bottom + 1
              );
            }),
            targets: [
              ...document.querySelectorAll(".return-actions button"),
            ].every((e) => {
              const r = e.getBoundingClientRect();
              return r.width >= 44 && r.height >= 44;
            }),
            noOverlap: innerHeight > innerWidth || caption.bottom <= a.top + 1,
            unclipped:
              innerHeight > innerWidth ||
              (r.top >= 0 && r.bottom <= innerHeight + 1),
          };
        });
        assert.equal(g.fit, "contain");
        assert.deepEqual(g.dimensions, [1672, 941]);
        assert.equal(g.noCanvas, 0);
        assert.ok(
          g.textInside && g.targets && g.noOverlap && g.unclipped,
          JSON.stringify({ w, h, quiet, i, ...g }),
        );
        await p.screenshot({
          path: `${out}/memoria-${i + 1}-${w}-${h}-${quiet ? "acessivel" : "normal"}.png`,
        });
        assert.equal(
          await f.evaluate(() =>
            localStorage.getItem("guardiao.viva.final.v1"),
          ),
          null,
          "lembranças não concluem o vídeo",
        );
        await f.locator("#return-next").click();
      }
      await f.locator("#final-cinema").waitFor();
      assert.equal(await f.locator("#journey-return").isVisible(), false);
      await f.locator("#ending-skip").click();
      await f.locator("#final-credits").waitFor();
      await f.locator(".credits-picture img").evaluate((e) => e.decode());
      const layout = await f.evaluate(() => {
        const d = document.getElementById("final-credits");
        return {
          top: d.scrollTop,
          focus: document.activeElement.id,
          noHorizontalOverflow: d.scrollWidth <= d.clientWidth + 1,
          actionsVisible:
            innerHeight > innerWidth ||
            [...d.querySelectorAll(".ra-dialog-actions button")].every((b) => {
              const r = b.getBoundingClientRect();
              return (
                r.top >= 0 &&
                r.bottom <= innerHeight + 1 &&
                r.width >= 44 &&
                r.height >= 44
              );
            }),
        };
      });
      assert.equal(
        layout.top,
        0,
        "créditos começam na arte, sem rolagem automática para o rodapé",
      );
      assert.equal(layout.focus, "credits-title");
      assert.ok(
        layout.noHorizontalOverflow && layout.actionsVisible,
        JSON.stringify({ w, h, quiet, ...layout }),
      );
      const text = await f.locator("#final-credits").textContent();
      for (const n of [
        "Iuri Barroso Nascimento",
        "Hicham Mohamed El Attar",
        "Eric Nascimento",
        "Natson Evangelista",
        "Professor Peterson Lobato",
        "UNEB · Web 1",
      ])
        assert.ok(text.includes(n));
      assert.equal(
        await f.locator("#credits-necklace [data-relicario-pedra]").count(),
        5,
      );
      assert.equal(
        await f.locator("#tree-state").getAttribute("data-tree-state"),
        "restaurada",
      );
      await p.screenshot({
        path: `${out}/creditos-${w}-${h}-${quiet ? "acessivel" : "normal"}.png`,
      });
      await f.locator("#ending-restart").click();
      await f.locator("#ra-reset").waitFor();
      await f.locator("#ra-reset [data-cancel]").click();
      assert.equal(await f.locator("#final-credits").isVisible(), true);
      await f.locator("#ending-island").click();
      assert.equal(await f.evaluate(() => VivaFinal.active), false);
      assert.deepEqual(
        await f.evaluate(() => GuardiaoProgresso.read().completed),
        [1, 2, 3, 4, 5],
      );
      await p.reload({ waitUntil: "domcontentloaded" });
      await p.waitForSelector("#guardiao-game");
      const re = p.frame({ name: "guardiao-game" });
      await re.waitForFunction(() => document.body.dataset.uiReady === "true");
      assert.equal(
        await re.locator("#tree-state").getAttribute("data-tree-state"),
        "restaurada",
      );
      assert.ok(
        !requests.some((u) => u.endsWith("/abracos.webp")),
        "não carrega sprites sobre as cenas completas",
      );
      assert.ok(
        requests.some((u) => u.endsWith("/reencontros-finais/assets/rio.webp")),
        "próxima arte preparada",
      );
      await re.evaluate(() => VivaFinal.start());
      await re.waitForFunction(() => JornadaRetorno.state().ready);
      await re.evaluate(async () => {
        while (JornadaRetorno.state().active) await JornadaRetorno.next();
      });
      await re.locator("#ending-skip").click();
      await re.locator("#final-credits").waitFor();
      await re.locator("#ending-restart").click();
      await re.locator("#ra-reset [data-confirm]").click();
      const fresh = p.frame({ name: "guardiao-game" });
      await fresh.waitForFunction(
        () =>
          document.body.dataset.uiReady === "true" &&
          document.body.dataset.view === "inicio" &&
          GuardiaoProgresso.read().completed.length === 0,
      );
      assert.equal(await fresh.evaluate(() => Raizes.prefs().musicVolume), 25);
      assert.equal(
        await fresh.evaluate(() => Raizes.prefs().controlMode),
        "keyboard",
      );
      assert.deepEqual(errors, []);
      await c.close();
      console.log(
        "PASS cinco memórias, anterior, vídeo, créditos, volta e persistência",
        w + "x" + h,
        quiet ? "texto maior/menos movimento" : "",
      );
    }
    // Transferência lenta, interrupção da sequência e falha de uma arte não
    // podem prender o foco nem reabrir uma lembrança depois de sair.
    const slow = await b.newContext({
      viewport: { width: 844, height: 390 },
      hasTouch: true,
      isMobile: true,
    });
    await slow.addInitScript(() => {
      localStorage.setItem(
        "guardiao.mapa.progresso.v1",
        JSON.stringify({ completed: [1, 2, 3, 4, 5], current: 5 }),
      );
      localStorage.setItem("guardiao.viva.final.v1", "visto");
    });
    let release;
    const gate = new Promise((r) => (release = r));
    await slow.route(
      "**/reencontros-finais/assets/floresta.webp",
      async (route) => {
        await gate;
        await route.continue();
      },
    );
    await slow.route("**/reencontros-finais/assets/fauna.webp", (route) =>
      route.abort(),
    );
    const p = await slow.newPage(),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(base + "index.html#mapa", { waitUntil: "domcontentloaded" });
    await p.waitForSelector("#guardiao-game");
    const f = p.frame({ name: "guardiao-game" });
    await f.waitForFunction(() => document.body.dataset.uiReady === "true");
    await f.evaluate(() => VivaFinal.start());
    await f.waitForFunction(() => JornadaRetorno.state().loading);
    assert.equal(await f.locator("#return-next").isDisabled(), true);
    assert.equal(
      await f.evaluate(() => document.activeElement.id),
      "journey-return",
    );
    await f.evaluate(() => VivaFinal.stop());
    release();
    await p.waitForTimeout(300);
    assert.equal(await f.locator("#journey-return").isVisible(), false);
    await f.locator("#replay-ending").click();
    await waitScene(f, 0);
    await f.evaluate(() => {
      for (let i = 0; i < 80; i++) JornadaRetorno.paint(null, 0, 0, i / 10);
    });
    await waitScene(f, 1);
    assert.equal(
      await f.evaluate(() => JornadaRetorno.state().npc),
      "Antônio",
      "avanço automático preservado",
    );
    await f.evaluate(() => {
      JornadaRetorno.paint = () => {};
    });
    await f.locator("#return-next").click();
    await f.waitForFunction(() => JornadaRetorno.state().failed);
    assert.equal(await f.locator("#return-next").isDisabled(), false);
    assert.equal(
      await f.evaluate(() => document.activeElement.id),
      "return-next",
    );
    assert.equal(
      await f.locator("#return-next").textContent(),
      "Ver vídeo final →",
    );
    await p.keyboard.press("Enter");
    await f.locator("#final-cinema").waitFor();
    await f.locator("#ending-skip").click();
    await f.locator("#final-credits").waitFor();
    assert.deepEqual(errors, []);
    await slow.close();
    console.log(
      "PASS carregamento lento, saída sem reabertura, avanço automático e falha recuperável pelo teclado",
    );
    const stalled = await b.newContext({
      viewport: { width: 740, height: 320 },
      hasTouch: true,
      isMobile: true,
    });
    await stalled.addInitScript(() => {
      localStorage.setItem(
        "guardiao.mapa.progresso.v1",
        JSON.stringify({ completed: [1, 2, 3, 4, 5], current: 5 }),
      );
      localStorage.setItem("guardiao.viva.final.v1", "visto");
    });
    let unblock;
    const held = new Promise((r) => (unblock = r));
    await stalled.route(
      "**/reencontros-finais/assets/floresta.webp",
      async (route) => {
        await held;
        await route.abort();
      },
    );
    const sp = await stalled.newPage();
    await sp.goto(base + "index.html#mapa", { waitUntil: "domcontentloaded" });
    await sp.waitForSelector("#guardiao-game");
    const sf = sp.frame({ name: "guardiao-game" });
    await sf.waitForFunction(() => document.body.dataset.uiReady === "true");
    await sf.evaluate(() => VivaFinal.start());
    await sf.waitForFunction(() => JornadaRetorno.state().slow, null, {
      timeout: 12000,
    });
    assert.equal(await sf.locator("#return-next").isDisabled(), false);
    assert.equal(
      await sf.locator("#return-next").textContent(),
      "Ver vídeo final →",
    );
    await sf.locator("#return-next").tap();
    await sf.locator("#final-cinema").waitFor();
    assert.equal(await sf.locator("#journey-return").isVisible(), false);
    unblock();
    await sp.waitForTimeout(100);
    await stalled.close();
    console.log("PASS imagem sem resposta não prende o jogador no celular");
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
