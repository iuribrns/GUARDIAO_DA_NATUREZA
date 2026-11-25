const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
const base =
    process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4189/jogo/viva/",
  root = new URL("../", base).href,
  out = process.env.GUARDIAO_ARTIFACTS || "/workspace/entregas/ajustes-finais";
fs.mkdirSync(out, { recursive: true });
async function ready(p, url) {
  await p.goto(url);
  await p.waitForFunction(
    () =>
      document.body.dataset.gameReady === "true" ||
      document.body.dataset.uiReady === "true",
  );
}
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
  });
  try {
    for (const mobile of [false, true]) {
      const ctx = await b.newContext({
          viewport: mobile
            ? { width: 844, height: 390 }
            : { width: 1280, height: 720 },
          hasTouch: mobile,
          isMobile: mobile,
        }),
        p = await ctx.newPage(),
        errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await p.clock.install();
      await p.addInitScript((mobile) => {
        localStorage.setItem(
          "guardiao.horizonte.preferences.v1",
          JSON.stringify({
            controlMode: mobile ? "touch" : "keyboard",
            music: true,
          }),
        );
        localStorage.setItem(
          "guardiao.mapa.progresso.v1",
          JSON.stringify({ completed: [1, 2, 3, 4, 5], current: 5 }),
        );
        localStorage.setItem("guardiao.viva.final.v1", "visto");
      }, mobile);
      await ready(p, root + "jornada/index.html?fase=2");
      await p.locator("#intro-next").click();
      await p.locator("#intro-next").click();
      await p.clock.runFor(1900);
      assert.equal(
        await p.evaluate(() => GuardiaoJornada.estado().stage),
        "dressing",
      );
      const poses = new Set();
      for (let i = 0; i < 6; i++) {
        await p.clock.runFor(800);
        poses.add(await p.locator("body").getAttribute("data-dressing-pose"));
      }
      assert.ok(poses.size >= 5);
      await p.screenshot({
        path: out + `/traje-${mobile ? "celular" : "pc"}.png`,
      });
      await p.clock.runFor(1500);
      assert.ok(await p.evaluate(() => GuardiaoJornada.estado().protective));
      await ready(p, root + "jornada/index.html?fase=3");
      const gate = await p.evaluate(() => {
        const d = GuardiaoFasesJogaveis[3],
          n = new GuardiaoNavegacao.Navigation(d);
        n.setDynamic(
          d.tasks
            .filter((t) => t.type === "cage")
            .map((t) => ({ ...t, status: "pending" })),
        );
        return {
          clear: n.visible({ x: 765, y: 100 }, { x: 860, y: 100 }),
          preguica: d.tasks.find((t) => t.id === "preguica"),
        };
      });
      assert.ok(gate.clear, "entrada esquerda do mico livre e contínua");
      assert.deepEqual(gate.preguica.home, {
        x: gate.preguica.x,
        y: gate.preguica.y,
      });
      await p.locator("#intro-next").click();
      await p.locator("#intro-next").click();
      await p.clock.runFor(2000);
      await p.locator('[data-goal="key"]').click();
      await p.waitForFunction(() => !GuardiaoJornada.estado().routePending);
      for (let i = 0; i < 150; i++) {
        await p.clock.runFor(300);
        if (!(await p.evaluate(() => GuardiaoJornada.estado())).route.length)
          break;
      }
      await p.keyboard.press("Enter");
      await p.clock.runFor(700);
      for (let j = 0; j < 9; j++) {
        if (
          (
            await p.evaluate(() =>
              GuardiaoJornada.estado().tasks.find((t) => t.id === "preguica"),
            )
          ).status === "safe"
        )
          break;
        await p.locator('[data-goal="animal"]').click();
        await p.waitForFunction(() => !GuardiaoJornada.estado().routePending);
        for (let i = 0; i < 200; i++) {
          await p.clock.runFor(300);
          if (!(await p.evaluate(() => GuardiaoJornada.estado())).route.length)
            break;
        }
        await p.keyboard.press("Enter");
        await p.clock.runFor(600);
        if (await p.locator("#puzzle").isVisible()) {
          const title = await p.locator("#puzzle-title").textContent(),
            answer = await p.evaluate(
              (q) =>
                GuardiaoJornada.estado().tasks.find(
                  (t) => t.quiz?.question === q,
                ).quiz.answer,
              title,
            );
          await p.locator(`[data-answer="${answer}"]`).click();
        }
        await p.clock.runFor(2000);
      }
      const before = await p.evaluate(() =>
        GuardiaoJornada.estado().tasks.find((t) => t.id === "preguica"),
      );
      assert.equal(before.status, "safe");
      await p.clock.runFor(12000);
      const after = await p.evaluate(() =>
        GuardiaoJornada.estado().tasks.find((t) => t.id === "preguica"),
      );
      assert.deepEqual(after.position, before.position);
      assert.equal(after.route?.length || 0, 0);
      await ready(p, root + "jornada/index.html?fase=5");
      const bins = await p.evaluate(() => ({
        bins: GuardiaoCidadeBins,
        types: GuardiaoFasesJogaveis[5].tasks
          .filter((t) => t.type === "recycle")
          .map((t) => t.material),
        obstacles: GuardiaoFasesJogaveis[5].obstacles.filter(
          (o) => o.name === "lixeira",
        ),
      }));
      assert.deepEqual(
        bins.bins.map((s) => s.kind),
        ["plastic", "glass", "metal", "paper"],
      );
      assert.equal(bins.obstacles.length, 4);
      assert.ok(bins.bins.every((bin) => bins.types.includes(bin.kind)));
      await p.locator("#intro-next").click();
      await p.locator("#intro-next").click();
      await p.clock.runFor(2200);
      await p.screenshot({
        path: out + `/lixeiras-${mobile ? "celular" : "pc"}.png`,
      });
      await ready(p, base + "index.html#mapa");
      await p.evaluate(() => BosqueMapa.ready());
      await p.clock.runFor(1200);
      await p.locator("#replay-ending").click();
      await p.waitForFunction(() => JornadaRetorno.state().ready);
      assert.equal(await p.locator("#final-cinema").isVisible(), false);
      assert.equal(await p.locator("#journey-return").isVisible(), true);
      const names = [];
      for (let i = 0; i < 5; i++) {
        await p.clock.runFor(1400);
        names.push(await p.evaluate(() => JornadaRetorno.state().npc));
        await p.screenshot({
          path: out + `/retorno-${i + 1}-${mobile ? "celular" : "pc"}.png`,
        });
        await p.locator("#return-next").click();
      }
      assert.deepEqual(names, [
        "Carlos",
        "Antônio",
        "Marina",
        "Rafael",
        "Luciana",
      ]);
      assert.equal(await p.locator("#journey-return").isVisible(), false);
      assert.equal(await p.locator("#final-cinema").isVisible(), true);
      await p.waitForFunction(
        () => document.getElementById("final-movie").videoWidth === 1280,
      );
      assert.equal(
        await p.evaluate(() => GuardiaoAudio.state().playing),
        false,
      );
      await p.locator("#ending-skip").click();
      await p.locator("#final-credits").waitFor({ state: "visible" });
      await p.locator("#ending-island").click();
      assert.equal(await p.evaluate(() => VivaFinal.active), false);
      assert.deepEqual(errors, []);
      console.log(
        "PASS",
        mobile ? "celular" : "computador",
        "traje, entrada esquerda, preguiça imóvel, quatro lixeiras, cinco reencontros e vídeo final",
      );
      await ctx.close();
    }
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
