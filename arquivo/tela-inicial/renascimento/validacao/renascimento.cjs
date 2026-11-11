"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright-core");
const base =
    process.env.GUARDIAO_TEST_URL ||
    "http://127.0.0.1:5173/tela-inicial/nova-versao/",
  root = new URL("../../", base),
  MAP = "guardiao.mapa.progresso.v1";
(async () => {
  const browser = await chromium.launch({
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
    const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    watch(p);
    await p.clock.install();
    const requests = [];
    p.on("request", (r) => requests.push(r.url()));
    await p.goto(base + "aventura.html");
    await p.waitForFunction(
      () =>
        window.GuardiaoMapa && document.body.dataset.floraMapReady === "true",
    );
    assert.equal(await p.evaluate(() => GuardiaoFases.length), 5);
    assert.equal(await p.locator(".map-hotspot").count(), 5);
    assert.equal(await p.locator('[data-phase="6"]').count(), 0);
    assert.equal(await p.locator("#map-credits").count(), 0);
    assert.ok(
      !requests.some((u) => /ilha-curada|mapa(?:-celular)?-verde/.test(u)),
      "sem revelar/download da ilha recuperada antes da conquista",
    );
    await assert.rejects(() =>
      p.evaluate(() => GuardiaoMapa.selecionarFase(6)),
    );
    await assert.rejects(() => p.evaluate(() => GuardiaoMapa.concluirFase(1)));
    assert.equal(await p.evaluate(() => GuardiaoProgresso.unlocked(6)), false);
    for (const viewport of [
      { width: 1280, height: 720 },
      { width: 390, height: 844 },
      { width: 320, height: 740 },
      { width: 844, height: 390 },
    ]) {
      await p.setViewportSize(viewport);
      await p.clock.runFor(100);
      const fit = await p.evaluate(() => {
        const stage = document.querySelector(".map-stage"),
          r = document.querySelector(".map-art").getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          scroll: stage.scrollWidth > stage.clientWidth + 1,
          left: r.left,
          right: r.right,
          top: r.top,
          bottom: r.bottom,
          buttons: [...document.querySelectorAll(".map-hotspot")].map((e) => {
            const r = e.getBoundingClientRect();
            return [r.width, r.height];
          }),
        };
      });
      assert.ok(
        !fit.overflow && !fit.scroll,
        "ilha inteira sem arrastar em " + viewport.width,
      );
      assert.ok(
        fit.left >= 0 &&
          fit.right <= viewport.width + 1 &&
          fit.top >= 0 &&
          fit.bottom <= viewport.height,
        "enquadramento da ilha em " + viewport.width,
      );
      assert.ok(
        fit.buttons.every(([w, h]) => w >= 44 && h >= 44),
        "alvos de toque em " + viewport.width,
      );
    }
    await p.locator("#map-flora").click();
    assert.equal(await p.locator("#flora-map-speech").isVisible(), true);
    await p.clock.runFor(4500);
    assert.equal(await p.locator("#flora-map-speech").isVisible(), false);
    await p.locator('.map-hotspot[data-phase="1"]').click();
    assert.equal(
      await p
        .getByRole("button", { name: "Vamos cuidar!", exact: true })
        .count(),
      1,
      "folhas decorativas não alteram o nome acessível do botão",
    );
    await p.locator('[data-map-action="close"]').click();
    // Conquista real: o verde se espalha gradualmente e só na região concluída.
    await p.evaluate((key) => {
      localStorage.setItem(
        "guardiao.floresta-viva.v2",
        JSON.stringify({ completed: true }),
      );
      localStorage.setItem(
        key,
        JSON.stringify({ completed: [1], current: 2, pendingRestoration: 1 }),
      );
    }, MAP);
    await p.goto(base + "aventura.html");
    await p.waitForFunction(
      () => document.getElementById("map-cutscene")?.hidden === false,
    );
    await p.clock.runFor(1000);
    const reveal = Number(
      await p.locator('[data-reveal-circle="1"]').getAttribute("r"),
    );
    assert.ok(
      reveal > 0 && reveal < 1200,
      "a máscara SVG passa por um estado intermediário real",
    );
    await p.clock.runFor(3000);
    assert.equal(await p.locator("image.healed").count(), 1);
    assert.equal(await p.locator("#map-cutscene").isVisible(), false);
    const paintings = await p.evaluate(async () => {
      async function green(src) {
        const im = new Image();
        im.src = src;
        await im.decode();
        const c = document.createElement("canvas");
        c.width = 160;
        c.height = 90;
        const ctx = c.getContext("2d");
        ctx.drawImage(im, 0, 0, 160, 90);
        const data = ctx.getImageData(0, 0, 160, 90).data;
        let count = 0;
        for (let i = 0; i < data.length; i += 4)
          if (
            data[i + 1] > data[i] * 1.12 &&
            data[i + 1] > data[i + 2] * 1.06 &&
            data[i + 1] > 45
          )
            count++;
        return count / (160 * 90);
      }
      const out = [];
      for (const name of ["floresta", "rio", "fauna", "plantio", "cidade"])
        out.push({
          name,
          before: await green(
            "../../jogo/renascimento/assets/" + name + ".webp",
          ),
          after: await green(
            "../../jogo/vida-natural/assets/" + name + "-restaurado.webp",
          ),
        });
      return out;
    });
    for (const art of paintings) {
      assert.ok(
        art.before < 0.02,
        "sem vegetação verde no início de " + art.name,
      );
      assert.ok(
        art.after > art.before + 0.08,
        "a recuperação muda visivelmente " + art.name,
      );
    }
    // Migra o antigo sexto destino sem criar uma sexta fase.
    await p.evaluate(
      (key) =>
        localStorage.setItem(
          key,
          JSON.stringify({ completed: [1, 2, 3, 4, 5], current: 6 }),
        ),
      MAP,
    );
    await p.reload();
    await p.waitForFunction(() => window.GuardiaoMapa);
    assert.equal(
      await p.evaluate(() => GuardiaoMapa.obterProgresso().current),
      5,
    );
    assert.equal(await p.locator("#map-final-replay").isVisible(), true);
    assert.equal(await p.locator("image.healed").count(), 5);
    await p.goto(new URL("tela-inicial/renascimento/creditos.html", root).href);
    await p.waitForFunction(() => document.body.dataset.endingReady === "true");
    assert.equal(await p.locator("[data-ending-gem]").count(), 5);
    const before = await p.evaluate((key) => localStorage.getItem(key), MAP);
    for (let i = 0; i < 5; i++) await p.locator("#epilogue-next").click();
    await p.clock.runFor(100);
    assert.equal(
      await p.locator("body").getAttribute("data-ending-state"),
      "celebrando",
    );
    assert.equal(
      await p.locator("#ending-actors").getAttribute("data-pose"),
      "7",
    );
    assert.equal(
      await p
        .locator("#land-restored")
        .evaluate((n) => parseFloat(n.style.getPropertyValue("--healed"))),
      155,
    );
    await p.locator("#ending-pause").click();
    const pose = await p.locator("#ending-actors").getAttribute("data-pose");
    await p.clock.runFor(1000);
    assert.equal(
      await p.locator("#ending-actors").getAttribute("data-pose"),
      pose,
    );
    await p.locator("#ending-replay").click();
    await p.clock.runFor(100);
    assert.equal(
      await p.locator("body").getAttribute("data-ending-state"),
      "memorias",
    );
    assert.equal(
      await p.evaluate((key) => localStorage.getItem(key), MAP),
      before,
      "rever créditos não muda a conquista",
    );
    await p.emulateMedia({ reducedMotion: "reduce" });
    for (let i = 0; i < 5; i++) await p.locator("#epilogue-next").click();
    await p.clock.runFor(100);
    assert.equal(
      await p.locator("body").getAttribute("data-ending-state"),
      "celebrando",
    );
    assert.equal(await p.locator(".ending-petals").isVisible(), false);
    await p.emulateMedia({ reducedMotion: "no-preference" });
    await p.goto(base + "sobre.html#team");
    await p.waitForFunction(() => document.body.dataset.teamReady === "true");
    for (const text of [
      "Iuri Barroso Nascimento",
      "Hicham Mohamed El Attar",
      "Professor Peterson Lobato",
      "UNEB",
      "Web 1",
      "Rowlet",
      "Decidueye",
    ])
      assert.ok((await p.locator("#team").textContent()).includes(text));
    assert.equal(await p.locator("[data-person]").count(), 3);
    const frames = await p.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 360;
      c.height = 330;
      let signatures = [];
      for (const name of ["iuri", "hicham", "peterson"]) {
        const draw = (time) =>
          name === "peterson"
            ? GuardiaoAtores.portrait(c, name, time, false)
            : GuardiaoEquipe2D.draw(c, name, time, false);
        draw(0);
        const first = c.toDataURL();
        draw(4.45 - { iuri: 1, hicham: 0, peterson: 2 }[name] * 0.91);
        signatures.push(first !== c.toDataURL());
      }
      return signatures;
    });
    assert.ok(
      frames.every(Boolean),
      "os três retratos piscam em quadros de arte diferentes",
    );
    for (const width of [320, 390, 1280]) {
      await p.setViewportSize({ width, height: 844 });
      assert.ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "equipe sem corte em " + width,
      );
    }
    await p.goto(base + "index.html");
    await p.waitForFunction(
      () => document.body.dataset.menuCharactersReady === "true",
    );
    const homeFrame = await p
      .locator("#horizon-duo")
      .getAttribute("data-frame");
    assert.ok(["0", "1", "2", "3"].includes(homeFrame));
    await p
      .getByRole("button", { name: "Conversar com Flora", exact: true })
      .click();
    await p.clock.runFor(150);
    assert.equal(
      await p.locator("#horizon-duo").getAttribute("data-flora"),
      "ombro",
    );
    assert.equal(
      await p.locator("#horizon-duo").getAttribute("data-frame"),
      "3",
    );
    await p.clock.runFor(4500);
    assert.equal(await p.locator(".camp-speech").isVisible(), false);
    // Um acesso direto não revela o final a uma aventura nova.
    const locked = await browser.newPage();
    watch(locked);
    const hiddenRequests = [];
    locked.on("request", (r) => hiddenRequests.push(r.url()));
    await locked.goto(
      new URL("tela-inicial/renascimento/creditos.html", root).href,
    );
    await locked.waitForFunction(
      () => document.body.dataset.endingState === "locked",
    );
    assert.equal(await locked.locator("#ending").isVisible(), false);
    assert.ok(!hiddenRequests.some((u) => /campo\.webp|colar-vazio/.test(u)));
    await locked.close();
    assert.deepEqual(errors, []);
    console.log(
      "PASS: cinco regiões, ilha inteira em 320/390/844/1280px, créditos conquistados, sem prévia da restauração, migração do sexto destino, animação do colar completo, pausa/replay, retratos reais piscando, falas temporárias e movimento reduzido.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
