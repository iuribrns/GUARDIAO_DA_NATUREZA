"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  { chromium } = require("playwright-core");
const base = new URL(
    "../../",
    process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4189/jogo/viva/",
  ),
  out = "test-results/rio-claro";
fs.mkdirSync(out, { recursive: true });
async function turtleTrial(browser, mobile, errors) {
  const p = await browser.newPage({
    viewport: mobile
      ? { width: 844, height: 390 }
      : { width: 1280, height: 720 },
    isMobile: mobile,
    hasTouch: mobile,
  });
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("response", (r) => {
    if (r.status() >= 400) errors.push(r.status() + " " + r.url());
  });
  await p.addInitScript(() => {
    localStorage.setItem(
      "guardiao.mapa.progresso.v1",
      JSON.stringify({ completed: [1], current: 2 }),
    );
    localStorage.setItem("guardiao.colar.fragmentos.v1", "[1]");
    localStorage.setItem(
      "guardiao.jornada.fase.2.v1",
      JSON.stringify({
        version: 1,
        phase: 2,
        itemsGiven: true,
        protective: true,
        completed: false,
        player: { x: 335, y: 213 },
        water: 100,
        tasks: [
          ...Array.from({ length: 8 }, (_, i) => ({
            id: "lixo" + i,
            status: "done",
          })),
          { id: "peixes1", status: "safe" },
          { id: "peixes2", status: "safe" },
          { id: "tartaruga", status: "pending", position: { x: 930, y: 440 } },
        ],
      }),
    );
  });
  await p.goto(new URL("jogo/jornada/index.html?fase=2", base).href);
  await p.waitForFunction(() => window.GuardiaoJornada?.estado().ready);
  await p.clock.install();
  const state = () => p.evaluate(() => GuardiaoJornada.estado());
  async function until(test, label) {
    for (let i = 0; i < 300; i++) {
      const s = await state();
      if (test(s)) return s;
      if (s.routePending || s.tasks.some((t) => t.routePending))
        await p.waitForFunction(() => {
          const s = GuardiaoJornada.estado();
          return !s.routePending && !s.tasks.some((t) => t.routePending);
        });
      await p.clock.runFor(300);
    }
    throw Error(label + JSON.stringify(await state()));
  }
  const t = (await state()).tasks.find((t) => t.id === "tartaruga");
  assert.deepEqual(
    { x: t.x, y: t.y },
    { x: 970, y: 340 },
    "partida antiga usa a nova praia, sem perder objetivos",
  );
  assert.deepEqual(t.position, { x: 970, y: 340 });
  await p.locator('[data-goal="animal"]').click();
  await until((s) => !s.routePending && !s.route.length, "caminho até a praia");
  if (mobile) await p.locator("#interagir").tap();
  else await p.keyboard.press("Enter");
  await until((s) => !!s.action, "início do resgate na areia");
  await p.clock.runFor(650);
  await p.screenshot({
    path: `${out}/tartaruga-na-praia-${mobile ? "celular" : "pc"}.png`,
  });
  await until((s) => s.completed, "libertação, retorno e recompensa");
  assert.ok(
    (await state()).tasks.every((t) => ["safe", "done"].includes(t.status)),
  );
  assert.ok(await p.locator("#vitoria").isVisible());
  assert.match(
    await p.locator(".resumo-colar figcaption").textContent(),
    /2 de 5/,
  );
  await p.locator("#next-phase").click();
  await p.clock.runFor(2200);
  await p.waitForURL("**/viva/index.html?*#mapa");
  await p.close();
  console.log(
    "PASS tartaruga na areia, partida antiga, resgate, recompensa e próxima fase:",
    mobile ? "toque" : "teclado",
  );
}
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const errors = [];
  try {
    for (const [width, height] of [
      [1280, 720],
      [844, 390],
      [740, 320],
    ]) {
      const p = await browser.newPage({
        viewport: { width, height },
        isMobile: width < 1000,
        hasTouch: width < 1000,
      });
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("response", (r) => {
        if (r.status() >= 400) errors.push(r.status() + " " + r.url());
      });
      await p.addInitScript(() => {
        localStorage.setItem(
          "guardiao.mapa.progresso.v1",
          JSON.stringify({ completed: [1, 2, 3, 4, 5], current: 5 }),
        );
        localStorage.setItem("guardiao.colar.fragmentos.v1", "[1,2,3,4,5]");
      });
      await p.goto(new URL("jogo/jornada/index.html?fase=2", base).href);
      await p.waitForFunction(() => window.GuardiaoJornada?.estado().ready);
      const pixels = await p.evaluate(async () => {
        const art = new GuardiaoAdventureArt(2);
        await art.load();
        const c = document.createElement("canvas");
        c.width = 250;
        c.height = 220;
        const ctx = c.getContext("2d"),
          counts = [];
        for (let d = 0; d < 8; d++)
          for (const kind of [null, "trash", "desprender"]) {
            ctx.clearRect(0, 0, 250, 220);
            art.river(
              ctx,
              { x: 125, y: 125, swimming: true, moving: true, direction: d },
              0.2,
              false,
              { kind, progress: 0.55 },
            );
            const image = ctx.getImageData(0, 0, 250, 220).data;
            let body = 0,
              head = 0;
            for (let y = 0; y < 220; y++)
              for (let x = 0; x < 250; x++)
                if (image[(y * 250 + x) * 4 + 3] > 160) {
                  body++;
                  if (x > 109 && x < 141 && y > 85 && y < 114) head++;
                }
            counts.push({
              d,
              kind,
              body,
              head,
              drawn: document.body.dataset.riverSpriteDrawn,
            });
          }
        const gallery = document.createElement("canvas");
        gallery.width = 960;
        gallery.height = 480;
        const g = gallery.getContext("2d");
        g.fillStyle = "#367e83";
        g.fillRect(0, 0, 960, 480);
        for (let d = 0; d < 8; d++) {
          const x = 75 + (d % 4) * 230,
            y = 80 + Math.floor(d / 4) * 150;
          art.river(
            g,
            { x, y, swimming: true, moving: true, direction: d },
            0.2,
            false,
          );
          g.fillStyle = "#fff3ce";
          g.font = "14px sans-serif";
          g.fillText("Direção " + d, x - 25, y + 55);
        }
        for (let i = 0; i < 4; i++)
          art.river(
            g,
            { x: 80 + i * 230, y: 400, swimming: true, direction: 0 },
            0.2,
            false,
            { kind: "trash", progress: (i + 0.1) / 4 },
          );
        window.rioGallery = gallery.toDataURL();
        return counts;
      });
      for (const row of pixels) {
        assert.ok(row.body > 1200, JSON.stringify(row));
        assert.ok(row.head > 100, JSON.stringify(row));
        assert.equal(row.drawn, "true");
      }
      if (width === 1280) {
        const data = await p.evaluate(() => rioGallery.split(",")[1]);
        fs.writeFileSync(out + "/poses.png", Buffer.from(data, "base64"));
      }
      for (let phase = 1; phase <= 5; phase++) {
        await p.goto(
          new URL(
            phase === 1
              ? "jogo/floresta-viva/index.html"
              : "jogo/jornada/index.html?fase=" + phase,
            base,
          ).href,
        );
        await p.waitForFunction(
          () => document.body.dataset.gameReady === "true",
        );
        await p.evaluate(() => {
          document.querySelectorAll("dialog[open]").forEach((e) => e.close());
          const panel = document.getElementById("vitoria");
          const stats = panel.querySelector("#victory-stats");
          if (stats)
            stats.innerHTML =
              "<span><strong>8</strong> cuidados concluídos</span><span><strong>3</strong> amigos protegidos</span>";
          const reward = document.getElementById("reward-label");
          if (reward) reward.textContent = "Seu cristal já faz parte do colar!";
          const next = document.getElementById("next-phase");
          if (next) next.textContent = "Próxima aventura →";
          panel.showModal();
        });
        await p.waitForTimeout(150);
        const fit = await p.locator("#vitoria").evaluate((e) => {
          const r = e.getBoundingClientRect(),
            title = e.querySelector("h2"),
            strong = e.querySelector(
              ".completion-stats strong,#victory-stats strong",
            );
          const contained = [
            title,
            ...e.querySelectorAll(
              ".resumo-acoes>a,.resumo-acoes>button,.resumo-colar,.resumo-amigos",
            ),
          ].every((n) => {
            const a = n.getBoundingClientRect();
            return (
              a.left >= r.left &&
              a.right <= r.right &&
              a.top >= r.top &&
              a.bottom <= r.bottom
            );
          });
          return {
            scroll: e.scrollHeight - e.clientHeight,
            bottom: r.bottom,
            height: innerHeight,
            contained,
            title: getComputedStyle(title).color,
            stats: getComputedStyle(strong).color,
          };
        });
        assert.ok(
          fit.scroll <= 2,
          "Resumo sem rolagem " +
            phase +
            " " +
            width +
            " " +
            JSON.stringify(fit),
        );
        assert.ok(
          fit.contained,
          "Resumo sem sobreposição/recorte " + JSON.stringify(fit),
        );
        assert.ok(fit.bottom <= height, JSON.stringify(fit));
        assert.equal(fit.title, "rgb(255, 244, 204)");
        assert.equal(fit.stats, "rgb(40, 95, 62)");
        await p.screenshot({
          path: `${out}/conclusao-${phase}-${width}.png`,
          animations: "disabled",
        });
      }
      await p.goto(new URL("jogo/viva/index.html#configuracoes", base).href);
      await p.waitForFunction(
        () =>
          window.ArteVivaContextos &&
          document
            .querySelector(".settings-preview h2")
            ?.getBoundingClientRect().width > 0,
      );
      await p.waitForTimeout(200);
      await p.screenshot({
        path: `${out}/configuracoes-${width}.png`,
        animations: "disabled",
      });
      await p.close();
      console.log(
        "PASS nado/coleta: 8 direções; conclusão: 5 fases; configurações:",
        width,
        "×",
        height,
      );
    }
    for (const mobile of [false, true])
      await turtleTrial(browser, mobile, errors);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
