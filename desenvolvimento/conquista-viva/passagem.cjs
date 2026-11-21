const assert = require("node:assert/strict"),
  { chromium } = require("playwright-core");
const base =
  process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4189/jogo/viva/";
const ready = (p) =>
  p.waitForFunction(() => document.body.dataset.gameReady === "true");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const mobile of [false, true])
      for (let id = 1; id <= 5; id++) {
        const p = await browser.newPage({
            viewport: mobile
              ? { width: 844, height: 390 }
              : { width: 1280, height: 720 },
            isMobile: mobile,
            hasTouch: mobile,
          }),
          errors = [];
        p.setDefaultTimeout(25000);
        p.on("pageerror", (e) => errors.push(e.message));
        await p.addInitScript((id) => {
          if (sessionStorage.getItem("teste-passagem")) return;
          sessionStorage.setItem("teste-passagem", "preparado");
          localStorage.setItem(
            "guardiao.mapa.progresso.v1",
            JSON.stringify({
              completed: Array.from({ length: id - 1 }, (_, i) => i + 1),
              current: id,
            }),
          );
          localStorage.setItem(
            "guardiao.horizonte.preferences.v1",
            JSON.stringify({
              music: false,
              screenTransitions: true,
              reduceMotion: false,
            }),
          );
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
        }, id);
        await p.goto(
          new URL(
            id === 1
              ? "../floresta-viva/index.html"
              : "../jornada/index.html?fase=" + id,
            base,
          ).href,
        );
        await ready(p);
        assert.equal(
          await p.locator("#vitoria").isVisible(),
          false,
          "conclusão não aparece na partida em andamento",
        );
        await p.evaluate((id) => {
          if (id === 1) {
            const s = GuardiaoFloresta.estado();
            localStorage.setItem(
              "guardiao.floresta-viva.v2",
              JSON.stringify({
                version: 2,
                itemsGiven: true,
                released: true,
                water: 100,
                completed: false,
                fires: Array(8).fill(0),
                animals: s.animals.map((a) => ({ id: a.id, stage: "seguro" })),
              }),
            );
          } else {
            const s = GuardiaoJornada.estado(),
              data = GuardiaoFasesJogaveis[id],
              nav = new GuardiaoNavegacao.Navigation(data),
              npc = data.npcPosition;
            const points = [
                npc,
                ...Array.from({ length: 16 }, (_, i) => ({
                  x: npc.x + Math.cos((i * Math.PI) / 8) * 40,
                  y: npc.y + Math.sin((i * Math.PI) / 8) * 40,
                })),
              ],
              player = points.find((pt) => nav.walkable(pt));
            if (!player) throw Error("Sem posição próxima do aliado");
            localStorage.setItem(
              `guardiao.jornada.fase.${id}.v1`,
              JSON.stringify({
                version: 1,
                phase: id,
                itemsGiven: true,
                completed: false,
                protective: true,
                player,
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
        await p.clock.install();
        await p.reload();
        await ready(p);
        await p.clock.runFor(600);
        assert.equal(
          await p
            .locator("#vitoria")
            .evaluate((d) => d.classList.contains("reward-preview")),
          true,
          "animação real da recompensa iniciou",
        );
        await p.evaluate(() => ConquistaViva.ready());
        await p.clock.runFor(8000);
        assert.equal(
          await p.locator("#vitoria").evaluate((d) => d.open),
          true,
          "recompensa terminou na conclusão",
        );
        assert.equal(await p.locator("#vitoria.reward-preview").count(), 0);
        await p.clock.resume();
        await p.evaluate(() =>
          document.addEventListener("click", (e) => {
            if (!e.target.closest(".resumo-proximo")) return;
            const d = document.getElementById("vitoria");
            sessionStorage.setItem(
              "teste-saida-resumo",
              JSON.stringify({
                hidden: d.hidden,
                open: d.open,
                preview: d.classList.contains("reward-preview"),
                display: getComputedStyle(d).display,
                rects: d.getClientRects().length,
              }),
            );
          }),
        );
        const next = p.locator(".resumo-proximo");
        if (mobile) await next.tap();
        else {
          await next.focus();
          await p.keyboard.press("Enter");
        }
        await p.waitForURL(
          (u) =>
            u.pathname.includes("/jogo/viva/") && u.hash.startsWith("#mapa"),
        );
        await p.waitForFunction(
          () =>
            document.body.dataset.uiReady === "true" &&
            !VivaTransicao.state().busy,
        );
        assert.deepEqual(
          await p.evaluate(() =>
            JSON.parse(sessionStorage.getItem("teste-saida-resumo")),
          ),
          {
            hidden: true,
            open: false,
            preview: false,
            display: "none",
            rects: 0,
          },
          "painel desaparece antes da passagem e não mantém sombra ou prévia",
        );
        assert.equal(
          await p.locator("#vitoria").count(),
          0,
          "nenhuma conclusão antiga no mapa de destino",
        );
        if (id < 5) {
          await p.locator(`[data-phase="${id + 1}"]`).click();
          await p.locator("#start-phase").click();
          await p.waitForURL(
            (u) =>
              u.pathname.includes("/jornada/") &&
              u.searchParams.get("fase") === String(id + 1),
          );
          await ready(p);
          assert.equal(
            await p.locator("#vitoria").isVisible(),
            false,
            "próxima fase começa sem banner de missão concluída",
          );
        }
        assert.deepEqual(errors, []);
        await p.close();
        console.log(
          "PASS recompensa, avanço sem banner residual e chegada:",
          id,
          mobile ? "celular" : "PC",
        );
      }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
