const assert = require("node:assert/strict"),
  { chromium } = require("playwright-core"),
  fs = require("node:fs");
const base =
    process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4189/jogo/viva/",
  origin = new URL("../../", base).href,
  out = "/workspace/entregas/sementes-tela-cheia";
fs.mkdirSync(out, { recursive: true });
async function until(p, f, test, label) {
  for (let i = 0; i < 200; i++) {
    const s = await f.evaluate(() => GuardiaoJornada.estado());
    if (test(s)) return s;
    if (s.routePending)
      await f.waitForFunction(() => !GuardiaoJornada.estado().routePending);
    await p.clock.runFor(300);
  }
  throw Error(label);
}
async function hud(f) {
  return f.evaluate(() => {
    const panel = document.querySelector(".hud-kit"),
      box = panel.getBoundingClientRect();
    return [
      ...panel.querySelectorAll(
        ".goal-label,.goal strong,.current-care,#phase-name",
      ),
    ]
      .filter((el) => el.getBoundingClientRect().height)
      .map((el) => {
        const b = el.getBoundingClientRect();
        return {
          text: el.textContent,
          inside:
            b.left >= box.left + 5 &&
            b.right <= box.right - 5 &&
            b.bottom <= box.bottom - 4,
          overflow: el.scrollWidth > el.clientWidth + 1,
        };
      });
  });
}
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
  });
  try {
    for (const mobile of [false, true]) {
      const c = await b.newContext({
          viewport: mobile
            ? { width: 844, height: 390 }
            : { width: 1280, height: 720 },
          hasTouch: mobile,
          isMobile: mobile,
        }),
        p = await c.newPage(),
        errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await p.clock.install();
      await c.addInitScript((mobile) => {
        localStorage.setItem(
          "guardiao.mapa.progresso.v1",
          JSON.stringify({ completed: [1, 2, 3, 4], current: 5 }),
        );
        localStorage.setItem(
          "guardiao.horizonte.preferences.v1",
          JSON.stringify({
            controlMode: mobile ? "touch" : "keyboard",
            music: false,
            showKeyHelp: false,
          }),
        );
      }, mobile);
      await p.goto(base + "index.html#inicio", {
        waitUntil: "domcontentloaded",
      });
      await p.waitForSelector("#guardiao-game");
      let f = p.frame({ name: "guardiao-game" });
      await f.waitForFunction(() => document.body.dataset.uiReady === "true");
      await p.clock.runFor(1600);
      await f.locator("[data-fullscreen]:visible").first().click();
      await p.waitForFunction(() => !!document.fullscreenElement);
      await f.locator("#play-game").click();
      await p.clock.runFor(1600);
      await f.waitForFunction(() => document.body.dataset.view === "mapa");
      assert.ok(
        await p.evaluate(() => !!document.fullscreenElement),
        "Jogar mantém tela cheia",
      );
      for (const phase of [1, 2, 3, 4, 5]) {
        await f.locator(`.map-hotspot[data-phase="${phase}"]`).click();
        await f.locator("#start-phase").click();
        await p.clock.runFor(2000);
        await f.waitForURL(
          phase === 1
            ? "**/floresta-viva/index.html"
            : `**/jornada/index.html?fase=${phase}`,
          { waitUntil: "domcontentloaded" },
        );
        await f.waitForFunction(
          () => document.body.dataset.gameReady === "true",
        );
        assert.ok(
          await p.evaluate(() => !!document.fullscreenElement),
          `fase ${phase} mantém fullscreen`,
        );
        assert.ok((await f.evaluate(() => GuardiaoTela.state())).fullscreen);
        assert.match(
          await f.locator("#app-fullscreen").getAttribute("aria-label"),
          /Sair/,
        );
        const next = f.locator(
          phase === 1 ? "#conversa-avancar" : "#intro-next",
        );
        await next.click();
        await next.click();
        await p.clock.runFor(phase === 2 ? 8000 : 2200);
        if (phase === 4) {
          for (let i = 0; i < 6; i++) {
            await f.locator('[data-goal="bed"]').click();
            await until(
              p,
              f,
              (s) => !s.routePending && !s.route.length,
              "caminho canteiro",
            );
            if (mobile) await f.locator("#interagir").tap();
            else await p.keyboard.press("Enter");
            await f.locator("#puzzle").waitFor();
            assert.equal(await f.locator("#puzzle-options button").count(), 3);
            if (i === 0)
              await p.screenshot({
                path: out + `/sementes-${mobile ? "celular" : "pc"}.png`,
              });
            const names = ["Pau-brasil", "Araucária", "Cedro-rosa"];
            await f.locator(`[data-answer="${names[i % 3]}"]`).click();
            await until(
              p,
              f,
              (s) => s.tasks.some((t) => t.status === "seeded"),
              "semente plantada",
            );
            if (mobile) await f.locator("#interagir").tap();
            else await p.keyboard.press("Enter");
            await until(
              p,
              f,
              (s) =>
                s.tasks.filter((t) => t.status === "done").length === i + 1,
              "regar",
            );
          }
          const report = await f.evaluate(() => GuardiaoJornada.estado());
          assert.equal(new Set(report.tasks.map((t) => t.seedSpecies)).size, 3);
          assert.equal(
            await f.locator(".return-goal strong").textContent(),
            "→",
          );
          assert.ok(!(await f.locator("#goals").textContent()).includes("0/0"));
          await p.screenshot({
            path: out + `/plantio-${mobile ? "celular" : "pc"}.png`,
          });
        }
        const measure = await hud(f);
        assert.ok(
          measure.every((x) => x.inside && !x.overflow),
          JSON.stringify(measure),
        );
        // A real phase document navigation, while the fullscreen owner stays intact.
        await f.goto(base + "index.html#mapa", {
          waitUntil: "domcontentloaded",
        });
        await f.waitForFunction(() => document.body.dataset.uiReady === "true");
        await p.clock.runFor(1600);
        await f.evaluate(() => BosqueMapa.ready());
      }
      await f.locator("[data-fullscreen]:visible").first().click();
      await p.waitForFunction(() => !document.fullscreenElement);
      await f.goto(base + "index.html#inicio", {
        waitUntil: "domcontentloaded",
      });
      await f.waitForFunction(() => document.body.dataset.uiReady === "true");
      assert.equal(
        await p.evaluate(() => !!document.fullscreenElement),
        false,
        "saída manual continua respeitada",
      );
      assert.deepEqual(errors, []);
      console.log(
        "PASS",
        mobile ? "celular" : "computador",
        "fullscreen nativo em Jogar e cinco fases, saída manual, seis plantios, três espécies, textos dentro do painel",
      );
      await c.close();
    }
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
