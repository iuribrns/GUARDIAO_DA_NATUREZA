const assert = require("node:assert/strict"),
  { chromium } = require("playwright-core"),
  fs = require("node:fs");
const base =
    process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4173/jogo/viva/",
  root = new URL("../../", base),
  out = process.env.GUARDIAO_ARTIFACTS || "/workspace/entregas/trilhas-vivas";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const mobile of [false, true]) {
      const p = await b.newPage({
        viewport: mobile
          ? { width: 844, height: 390 }
          : { width: 1280, height: 720 },
        hasTouch: mobile,
        isMobile: mobile,
      });
      const errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await p.goto(base);
      await p.waitForFunction(
        () => document.body.dataset.transition === "pronta",
      );
      await p.waitForFunction(() => VivaFolhas.state().time > 0.1);
      const start = await p.evaluate(() => ({
        time: VivaFolhas.state().time,
        transform: getComputedStyle(document.querySelector(".home-landscape"))
          .transform,
      }));
      if (mobile) await p.touchscreen.tap(650, 160);
      else await p.mouse.move(1090, 200);
      await p.waitForTimeout(300);
      const after = await p.evaluate(() => ({
        time: VivaFolhas.state().time,
        transform: getComputedStyle(document.querySelector(".home-landscape"))
          .transform,
      }));
      assert.ok(after.time > start.time);
      assert.notEqual(
        after.transform,
        start.transform,
        "cenário responde a toque/cursor",
      );
      await p.waitForTimeout(150);
      const burst = await p.evaluate(() => VivaFolhas.state().burstCount);
      if (mobile)
        await p
          .locator("#play-game")
          .dispatchEvent("pointerdown", { pointerType: "touch" });
      else await p.hover("#play-game");
      assert.ok(
        await p.evaluate((n) => VivaFolhas.state().burstCount > n, burst),
      );
      await p.click("#play-game");
      await p.waitForTimeout(100);
      const a = await p
        .locator(".grove-half.left")
        .evaluate((e) => getComputedStyle(e).transform);
      await p.waitForTimeout(180);
      const z = await p
        .locator(".grove-half.left")
        .evaluate((e) => getComputedStyle(e).transform);
      assert.notEqual(a, z, "cortina avança entre quadros");
      assert.equal(new URL(p.url()).hash, "");
      await p.waitForURL("**/#mapa");
      await p.waitForFunction(
        () => document.body.dataset.transition === "pronta",
      );
      await p.evaluate(() => BosqueMapa.ready());
      assert.equal(
        await p.evaluate(() =>
          performance
            .getEntriesByType("resource")
            .some((r) =>
              /\/mata-ilustrada\/assets\/(aderecos|texturas)\.webp/.test(
                r.name,
              ),
            ),
        ),
        false,
        "mapa ilustrado não carrega as texturas do cenário descartado",
      );
      assert.equal(
        await p.evaluate(() => BosqueMapa.state().composition),
        "ilha-antiga",
      );
      await p.screenshot({
        path: out + "/mapa-" + (mobile ? "celular" : "pc") + ".png",
      });
      await p.evaluate(() => BosqueMapa.update([1]));
      await p.waitForFunction(() => BosqueMapa.state().restoredReady);
      await p.evaluate(() => BosqueMapa.update([]));
      const colors = await p.evaluate(async () => {
        const frame = () =>
          new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
          );
        const sample = () => {
          const c = document.getElementById("living-island");
          return [
            ...c
              .getContext("2d")
              .getImageData(
                Math.round((c.width * 430) / 1000),
                Math.round((c.height * 455) / 563),
                1,
                1,
              ).data,
          ].slice(0, 3);
        };
        BosqueMapa.update([]);
        await frame();
        const before = sample();
        BosqueMapa.update([1, 2, 3, 4, 5]);
        await frame();
        const green = sample();
        BosqueMapa.update([]);
        await frame();
        return { before, green, reset: sample() };
      });
      assert.ok(
        colors.before.reduce(
          (n, v, i) => n + Math.abs(v - colors.green[i]),
          0,
        ) > 30,
        "o solo muda ao recuperar a ilha",
      );
      assert.ok(
        colors.before.reduce(
          (n, v, i) => n + Math.abs(v - colors.reset[i]),
          0,
        ) < 20,
        "reiniciar remove o verde guardado no cache",
      );

      await p.click('[data-phase="1"]');
      await p.route(
        "**/jogo/bosque-vivo/assets/equipamentos.webp*",
        async (r) => {
          await new Promise((resolve) => setTimeout(resolve, 700));
          await r.continue();
        },
      );
      await p.click("#start-phase");
      await p.waitForURL("**/floresta-viva/index.html");
      await p.waitForFunction(() => document.body.dataset.gameReady === "true");
      await p.waitForFunction(
        () => document.body.dataset.transition === "pronta",
      );
      for (let i = 0; i < 2; i++) await p.click("#conversa-avancar");
      await p.click("#pausa");
      await p.getByRole("button", { name: "Continuar", exact: true }).click();
      assert.equal(
        await p
          .locator("#leaf-transition")
          .evaluate((e) => getComputedStyle(e).visibility),
        "hidden",
      );
      assert.deepEqual(errors, []);
      await p.close();
      console.log(
        "PASS passagem suave, abertura interativa e entrada da fase sem cortina presa",
        mobile ? "toque" : "mouse",
      );
    }
    for (const failure of ["error", "silent"]) {
      const p = await b.newPage({ viewport: { width: 844, height: 390 } });
      await p.addInitScript((failure) => {
        window.Worker = class {
          postMessage() {
            if (failure === "error")
              setTimeout(
                () =>
                  this.onmessage?.({
                    data: { error: "Falha simulada na inicialização" },
                  }),
                0,
              );
          }
          terminate() {}
        };
      }, failure);
      await p.goto(new URL("jogo/floresta-viva/index.html", root).href);
      await p.waitForFunction(() => document.body.dataset.gameReady === "true");
      await p.waitForFunction(() => BosqueRotas.state().failed);
      const result = await p.evaluate(async () => {
        FlorestaMundo.setHazards([]);
        const a = FlorestaMundo.animals[0],
          before = performance.now();
        let delay;
        const timer = new Promise((r) =>
          setTimeout(() => {
            delay = performance.now() - before - 30;
            r();
          }, 30),
        );
        const route = await BosqueRotas.route(a, a.home, { hazards: [] });
        await timer;
        return { points: route.length, delay, state: BosqueRotas.state() };
      });
      assert.ok(result.points > 0);
      assert.ok(result.delay < 700);
      assert.equal(result.state.pending, 0);
      await p.close();
      console.log(
        "PASS recuperação de Worker",
        failure,
        JSON.stringify(result),
      );
    }
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
