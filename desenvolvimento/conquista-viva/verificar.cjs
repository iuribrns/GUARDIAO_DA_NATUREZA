const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  { chromium } = require("playwright-core");
const base =
    process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4189/jogo/viva/",
  out = "test-results/conquista-viva";
fs.mkdirSync(out, { recursive: true });
async function decode(p, selector) {
  await p.locator(selector).evaluate(async (root) => {
    await Promise.all(
      [
        ...new Set(
          [...root.querySelectorAll("image")].map((i) =>
            i.getAttribute("href"),
          ),
        ),
      ].map(async (url) => {
        const im = new Image();
        im.src = url;
        await im.decode();
      }),
    );
    await document.fonts.ready;
  });
}
async function fit(p) {
  const result = await p.locator("#vitoria").evaluate((d) => {
    const r = d.getBoundingClientRect(),
      b = d.querySelector(".resumo-proximo").getBoundingClientRect(),
      f = d.querySelector(".resumo-acoes").getBoundingClientRect();
    const inside = (e, parent) => {
      const c = e.getBoundingClientRect(),
        p = parent.getBoundingClientRect();
      return (
        c.x >= p.x - 1 &&
        c.y >= p.y - 1 &&
        c.right <= p.right + 1 &&
        c.bottom <= p.bottom + 1
      );
    };
    return {
      screen:
        r.x >= 0 &&
        r.y >= 0 &&
        r.right <= innerWidth + 1 &&
        r.bottom <= innerHeight + 1,
      scroll:
        d.scrollHeight > d.clientHeight + 1 ||
        d.scrollWidth > d.clientWidth + 1,
      center: Math.abs(b.x + b.width / 2 - f.x - f.width / 2) < 1,
      content: [
        ...d.querySelectorAll(
          ".resumo-cabecalho,.resumo-corpo,.resumo-colar,.resumo-legenda,.resumo-nota,.resumo-acoes,.completion-stats,#victory-stats",
        ),
      ].every((e) => inside(e, d)),
      gems: [...d.querySelector(".resumo-colar").children].every((e) =>
        inside(e, d.querySelector(".resumo-colar")),
      ),
      stats: [...d.querySelectorAll(".conquista-stat-icon")].every((e) =>
        inside(e, e.parentElement),
      ),
      single:
        d.querySelectorAll(".resumo-acoes a").length === 1 &&
        d.querySelectorAll(".resumo-acoes button").length === 0,
    };
  });
  assert.ok(
    Object.entries(result).every(([k, v]) => (k === "scroll" ? !v : v)),
    JSON.stringify(result),
  );
}
async function buttonSkin(p, state) {
  const result = await p
    .locator("#vitoria .resumo-proximo")
    .evaluate((button) => {
      const art = button.querySelector(".conquista-next"),
        b = button.getBoundingClientRect(),
        a = art.getBoundingClientRect();
      return {
        position: getComputedStyle(button).position,
        edges: [a.x - b.x, a.y - b.y, a.right - b.right, a.bottom - b.bottom],
        hover: button.matches(":hover"),
        focus: button.matches(":focus-visible"),
      };
    });
  assert.ok(
    result.position !== "static" && result.edges.every((v) => Math.abs(v) < 1),
    state + ": " + JSON.stringify(result),
  );
}
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const [width, height] of [
      [1280, 720],
      [844, 390],
      [740, 320],
    ])
      for (let id = 1; id <= 5; id++) {
        const p = await b.newPage({
            viewport: { width, height },
            isMobile: width < 1000,
            hasTouch: width < 1000,
          }),
          errors = [],
          requests = [];
        p.setDefaultTimeout(20000);
        p.on("pageerror", (e) => errors.push(e.message));
        p.on("response", (r) => {
          if (r.status() >= 400) errors.push(r.status() + " " + r.url());
        });
        p.on("request", (r) => requests.push(r.url()));
        await p.addInitScript((id) => {
          localStorage.setItem(
            "guardiao.mapa.progresso.v1",
            JSON.stringify({ completed: [1, 2, 3, 4, 5], current: 5 }),
          );
          localStorage.setItem("guardiao.viva.final.v1", "visto");
          if (!sessionStorage.getItem("conquista-preparada")) {
            sessionStorage.setItem("conquista-preparada", "sim");
            if (id === 1)
              localStorage.setItem(
                "guardiao.floresta-viva.v2",
                JSON.stringify({
                  version: 2,
                  itemsGiven: true,
                  released: true,
                  water: 100,
                  completed: false,
                  fires: Array(8).fill(1),
                  animals: [],
                }),
              );
            else
              localStorage.setItem(
                `guardiao.jornada.fase.${id}.v1`,
                JSON.stringify({
                  version: 1,
                  phase: id,
                  itemsGiven: true,
                  completed: false,
                  protective: true,
                  tasks: [],
                }),
              );
          }
        }, id);
        const path =
          id === 1
            ? "../floresta-viva/index.html"
            : "../jornada/index.html?fase=" + id;
        await p.goto(new URL(path, base).href);
        await p.waitForFunction(
          () => document.body.dataset.gameReady === "true",
        );
        assert.equal(
          await p.locator("body").getAttribute("data-hud-design"),
          "kit",
        );
        assert.equal(
          requests.some((r) =>
            /conquista-viva\/assets\/(?:cenario|colar|kai|flora|carlos|antonio|painel|avancar)/.test(
              r,
            ),
          ),
          false,
          "artes da conclusão não bloqueiam o carregamento da fase",
        );
        await p
          .locator("dialog[open]")
          .evaluateAll((ds) => ds.forEach((d) => d.close()));
        await decode(p, ".top-actions");
        assert.equal(
          await p.locator("#mochila .hud-control-art").count(),
          1,
          "sem duplicar ícone da mochila após carregar a fase",
        );
        assert.ok(
          await p.locator(".top-actions .hud-button").evaluateAll((bs) =>
            bs.every((b) => {
              const r = b.getBoundingClientRect(),
                s = b.querySelector(".hud-control-art").getBoundingClientRect();
              return (
                r.width >= 44 &&
                r.height >= 44 &&
                Math.abs(r.x + r.width / 2 - s.x - s.width / 2) < 1 &&
                Math.abs(r.y + r.height / 2 - s.y - s.height / 2) < 1 &&
                r.x >= 0 &&
                r.right <= innerWidth &&
                r.y >= 0 &&
                r.bottom <= innerHeight
              );
            }),
          ),
          "três aros centrados e dentro da tela",
        );
        if (id === 1 || id === 4) {
          await p.evaluate(
            () => (document.getElementById("reserva").value = 37),
          );
          await p.waitForFunction(() =>
            document
              .querySelector(".hud-meter-fill")
              .style.clipPath.includes("63%"),
          );
        }
        if (id === 1) {
          await p.locator("#app-fullscreen").click();
          await p.waitForFunction(
            () =>
              GuardiaoTela.state().fullscreen && !GuardiaoTela.state().pending,
          );
          assert.equal(await p.locator("#app-fullscreen .hud-exit").count(), 1);
          await p.locator("#app-fullscreen").click();
          await p.waitForFunction(
            () =>
              !GuardiaoTela.state().fullscreen && !GuardiaoTela.state().pending,
          );
          assert.equal(await p.locator("#app-fullscreen .hud-exit").count(), 0);
        }
        await p.locator("#pausa").click();
        await p.locator("#menu-pausa").waitFor({ state: "visible" });
        await p.locator("[data-resume]").click();
        await p.locator("#mochila").click();
        await p.locator("#mochila-jornada").waitFor({ state: "visible" });
        await p.locator("[data-pack-close]").click();
        await p.screenshot({ path: `${out}/hud-${id}-${width}.png` });
        if (width < 1000)
          assert.ok(
            await p.locator("#jogo .actions small").evaluateAll((labels) =>
              labels.every((e) => {
                const r = e.getBoundingClientRect();
                return (
                  r.x >= 0 &&
                  r.right <= innerWidth + 1 &&
                  r.bottom <= innerHeight + 1
                );
              }),
            ),
            "legendas dos controles sem cortes na borda inferior",
          );
        // Abrir uma conclusão por meio de uma partida concluída salva, sem alterar a lógica do jogo.
        await p.evaluate((id) => {
          localStorage.setItem(
            "guardiao.colar.fragmentos.v1",
            JSON.stringify(Array.from({ length: id }, (_, i) => i + 1)),
          );
          if (id === 1) {
            const s = GuardiaoFloresta.estado();
            localStorage.setItem(
              "guardiao.floresta-viva.v2",
              JSON.stringify({
                version: 2,
                itemsGiven: true,
                released: true,
                completed: true,
                water: 100,
                fires: Array(8).fill(0),
                animals: s.animals.map((a) => ({ id: a.id, stage: "seguro" })),
              }),
            );
          } else {
            const s = GuardiaoJornada.estado();
            localStorage.setItem(
              `guardiao.jornada.fase.${id}.v1`,
              JSON.stringify({
                version: 1,
                phase: id,
                itemsGiven: true,
                completed: true,
                protective: true,
                tasks: s.tasks.map((t) => ({
                  id: t.id,
                  status: [
                    "fish",
                    "turtle",
                    "cage",
                    "kitten",
                    "bird",
                    "care",
                  ].includes(t.type)
                    ? "safe"
                    : "done",
                  quizPassed: true,
                  progress: 1,
                })),
              }),
            );
          }
        }, id);
        await p.reload();
        await p.waitForFunction(
          () => document.body.dataset.gameReady === "true",
        );
        await p.locator("#vitoria").waitFor({ state: "visible" });
        await decode(p, "#vitoria");
        await p.evaluate(async () => {
          await ConquistaViva.ready();
          await new Promise(requestAnimationFrame);
        });
        await fit(p);
        await buttonSkin(p, "foco inicial");
        await p.mouse.move(0, 0);
        await p.evaluate(() => document.activeElement.blur());
        await p.waitForTimeout(200);
        await buttonSkin(
          p,
          "sem foco e sem cursor: moldura permanece dentro do botão",
        );
        await p.screenshot({ path: `${out}/sem-foco-${id}-${width}.png` });
        if (width >= 1000) {
          await p.locator(".resumo-proximo").hover();
          await buttonSkin(p, "cursor sobre o botão");
        }
        await p.locator(".resumo-proximo").focus();
        await p.keyboard.press("ArrowRight");
        await buttonSkin(p, "foco pelo teclado");
        assert.equal(await p.locator("[data-close=vitoria]").count(), 0);
        assert.match(
          await p.locator(".resumo-colar figcaption").textContent(),
          new RegExp(id + " de 5"),
        );
        if (id <= 2) {
          assert.ok(
            (
              await p.locator(".conquista-colar-art image").getAttribute("href")
            ).endsWith(`colar-${id}.webp`),
          );
        }
        assert.equal(
          await p.locator(".conquista-stat-icon").count(),
          id === 1 ? 3 : documentCount(id),
        );
        await p.keyboard.press("Escape");
        assert.equal(await p.locator("#vitoria").evaluate((e) => e.open), true);
        const next = p.locator("#vitoria .resumo-proximo"),
          href = await next.getAttribute("href");
        assert.ok(href.includes("destino=" + (id < 5 ? id + 1 : "creditos")));
        await p.screenshot({ path: `${out}/conclusao-${id}-${width}.png` });
        if (width < 1000) await next.tap();
        else {
          await next.focus();
          await p.keyboard.press("Enter");
        }
        await p.waitForURL(
          (u) =>
            u.pathname.includes("/jogo/viva/") && u.hash.startsWith("#mapa"),
        );
        assert.deepEqual(errors, []);
        await p.close();
        console.log(
          "PASS HUD, controles, barra, bordas, conclusão, cristais e avanço:",
          id,
          width,
          height,
        );
      }
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
function documentCount(id) {
  return id === 2 || id === 3 ? 2 : id === 4 ? 1 : 3;
}
