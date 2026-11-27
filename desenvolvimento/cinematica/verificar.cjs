const assert = require("node:assert/strict"),
  { chromium } = require("playwright-core"),
  fs = require("node:fs");
const base =
    process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4189/jogo/viva/",
  out = "/workspace/entregas/cinematica";
fs.mkdirSync(out, { recursive: true });
async function setup(b, mobile) {
  const c = await b.newContext({
    viewport: mobile
      ? { width: 844, height: 390 }
      : { width: 1280, height: 720 },
    isMobile: mobile,
    hasTouch: mobile,
  });
  await c.addInitScript(() => {
    localStorage.setItem(
      "guardiao.mapa.progresso.v1",
      JSON.stringify({ completed: [1, 2, 3, 4, 5], current: 5 }),
    );
    localStorage.setItem("guardiao.viva.final.v1", "visto");
  });
  const p = await c.newPage(),
    errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(base + "index.html#mapa", { waitUntil: "domcontentloaded" });
  await p.waitForSelector("#guardiao-game");
  const f = p.frame({ name: "guardiao-game" });
  await f.waitForFunction(() => document.body.dataset.uiReady === "true");
  await f.evaluate(() => BosqueMapa.ready());
  return { c, p, f, errors };
}
async function rewindRetrospective(f) {
  await f.waitForFunction(() => JornadaRetorno.state().ready);
  await f.evaluate(async () => {
    while (JornadaRetorno.state().active) await JornadaRetorno.next();
  });
}
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
  });
  try {
    for (const mobile of [false, true]) {
      const { c, p, f, errors } = await setup(b, mobile);
      await f.locator("#replay-ending").click();
      await p.waitForFunction(() => !!document.fullscreenElement);
      await rewindRetrospective(f);
      await f.waitForFunction(
        () =>
          VivaFinal.state().cinema === "playing" &&
          document.getElementById("final-movie").currentTime > 0.2,
      );
      const info = await f.evaluate(() => {
        const v = document.getElementById("final-movie"),
          scene = document.getElementById("final-cinema"),
          r = scene.getBoundingClientRect();
        return {
          controls: v.controls,
          hasControls: v.hasAttribute("controls"),
          pip: v.disablePictureInPicture,
          fit: getComputedStyle(v).objectFit,
          w: r.width,
          h: r.height,
          iw: innerWidth,
          ih: innerHeight,
          music: GuardiaoAudio.state().playing,
        };
      });
      assert.equal(info.controls, false);
      assert.equal(info.hasControls, false);
      assert.equal(info.pip, true);
      assert.equal(info.fit, "contain");
      assert.equal(info.w, info.iw);
      assert.equal(info.h, info.ih);
      assert.equal(info.music, false);
      await f.waitForFunction(
        () =>
          document.getElementById("final-cinema").dataset.cinemaQuiet ===
          "true",
      );
      await f.waitForFunction(
        () =>
          Number(
            getComputedStyle(document.getElementById("ending-skip")).opacity,
          ) < 0.1,
      );
      await p.screenshot({
        path: out + `/cena-${mobile ? "celular" : "pc"}.png`,
      });
      const pauseAt = await f.evaluate(() => {
        const v = document.getElementById("final-movie");
        v.pause();
        return v.currentTime;
      });
      await f.waitForFunction(() => VivaFinal.state().cinema === "paused");
      await f.locator("#cinema-action").click();
      await f.waitForFunction(
        (t) => document.getElementById("final-movie").currentTime > t + 0.1,
        pauseAt,
      );
      assert.ok(await p.evaluate(() => !!document.fullscreenElement));
      // Ending follows the actual media ended event, then fades into the summary.
      await f.evaluate(() => {
        const v = document.getElementById("final-movie");
        v.currentTime = v.duration - 0.2;
      });
      await f.locator("#final-credits").waitFor({ state: "visible" });
      assert.equal(
        await f.locator("#tree-state").getAttribute("data-tree-state"),
        "restaurada",
        "cutscene concluída atualiza o mesmo indicador do mapa",
      );
      assert.match(
        await f.locator("[data-map-tree-icon]").getAttribute("src"),
        /arvore-restaurada\.webp$/,
      );
      assert.ok(await p.evaluate(() => !!document.fullscreenElement));
      await f.locator("#ending-island").click();
      assert.equal(
        await f.locator("[data-map-tree-status]").textContent(),
        "Restaurada",
      );
      assert.equal(await f.evaluate(() => VivaFinal.active), false);
      // Retry the ending: stop during the fade must not reopen a stale summary.
      await f.locator("#replay-ending").click();
      await rewindRetrospective(f);
      await f.waitForFunction(() => VivaFinal.state().cinema === "playing");
      await f.locator("#ending-skip").click();
      await f.evaluate(() => VivaFinal.stop());
      await p.waitForTimeout(950);
      assert.equal(await f.locator("#final-credits").isVisible(), false);
      assert.equal(await f.locator("#final-cinema").isVisible(), false);
      assert.deepEqual(errors, []);
      console.log(
        "PASS",
        mobile ? "celular" : "computador",
        "cinemática sem controles/tempo, tela cheia, retomada, término natural e limpeza da transição",
      );
      await c.close();
    }
    // Automatic final without a gesture gets a single entry button, never a dead player.
    const { c, p, f, errors } = await setup(b, false);
    // Evaluation itself carries test-runner activation: use a real delayed task
    // after that activation expires to reproduce an automatic game ending.
    await f.evaluate(() => {
      setTimeout(() => {
        VivaFinal.start();
        const advance = async () => {
          if (!JornadaRetorno.state().ready) {
            setTimeout(advance, 100);
            return;
          }
          while (JornadaRetorno.state().active) await JornadaRetorno.next();
        };
        advance();
      }, 6200);
    });
    await f.waitForFunction(() => VivaFinal.state().cinema === "awaiting");
    assert.equal(await p.evaluate(() => !!document.fullscreenElement), false);
    await f.locator("#cinema-action").click();
    await p.waitForFunction(() => !!document.fullscreenElement);
    await f.waitForFunction(() => VivaFinal.state().cinema === "playing");
    // Autoplay rejection remains recoverable without restoring native controls.
    await f.evaluate(() => {
      const v = document.getElementById("final-movie");
      v.pause();
      v.play = () =>
        Promise.reject(
          new DOMException("user gesture required", "NotAllowedError"),
        );
    });
    await f.locator("#cinema-action").click();
    await f.waitForFunction(() => VivaFinal.state().cinema === "awaiting");
    assert.equal(
      await f.evaluate(() => document.getElementById("final-movie").controls),
      false,
    );
    await f.evaluate(() => {
      delete document.getElementById("final-movie").play;
    });
    await f.locator("#cinema-action").click();
    await f.waitForFunction(() => VivaFinal.state().cinema === "playing");
    await f.locator("#ending-skip").click();
    await f.locator("#final-credits").waitFor();
    assert.deepEqual(errors, []);
    console.log(
      "PASS entrada automática, toque para tela cheia e recuperação de bloqueio de reprodução",
    );
    await c.close();
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
