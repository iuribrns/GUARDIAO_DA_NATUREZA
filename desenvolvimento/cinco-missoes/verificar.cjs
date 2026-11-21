const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  { chromium } = require("playwright-core");
const base =
  process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4189/jogo/viva/";
const out = "test-results/cinco-missoes";
fs.mkdirSync(out, { recursive: true });
async function images(p, selector) {
  await p.locator(selector).evaluate(async (root) => {
    await Promise.all(
      [
        ...new Set(
          [...root.querySelectorAll("image")].map((e) =>
            e.getAttribute("href"),
          ),
        ),
      ].map(async (url) => {
        const image = new Image();
        image.src = url;
        await image.decode();
      }),
    );
    await document.fonts.ready;
  });
}
async function contained(p, selector) {
  const fits = await p.locator(selector).evaluateAll((elements) =>
    elements.every((e) => {
      const r = e.getBoundingClientRect();
      return (
        r.x >= 0 &&
        r.y >= 0 &&
        r.right <= innerWidth + 1 &&
        r.bottom <= innerHeight + 1
      );
    }),
  );
  assert.ok(fits, selector + " dentro da tela");
}
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const [width, height] of [
      [1280, 720],
      [844, 390],
      [740, 320],
      [667, 375],
    ]) {
      for (const n of [0, 5]) {
        const p = await browser.newPage({
            viewport: { width, height },
            isMobile: width < 1000,
            hasTouch: width < 1000,
          }),
          errors = [],
          requested = [];
        p.setDefaultTimeout(20000);
        p.on("pageerror", (e) => errors.push(e.message));
        p.on("response", (r) => {
          if (r.status() >= 400) errors.push(r.status() + " " + r.url());
        });
        p.on("request", (r) => {
          if (r.url().includes("cinco-missoes/assets/"))
            requested.push(r.url());
        });
        await p.addInitScript((n) => {
          const completed = Array.from({ length: n }, (_, i) => i + 1);
          localStorage.setItem(
            "guardiao.mapa.progresso.v1",
            JSON.stringify({ completed, current: Math.min(5, n + 1) }),
          );
          localStorage.setItem(
            "guardiao.amanha.memoria.v1",
            JSON.stringify({
              version: 1,
              grants: completed,
              found: n === 5 ? ["chave"] : [],
              uniform: "explorador",
              phases: {},
            }),
          );
          localStorage.setItem("guardiao.viva.final.v1", "visto");
        }, n);
        await p.goto(base + "index.html#mapa");
        await p.waitForFunction(
          () =>
            document.body.dataset.uiReady === "true" &&
            !VivaTransicao.state().busy,
        );
        assert.deepEqual(
          requested,
          [],
          "novas artes carregam somente ao abrir os painéis",
        );
        const before = await p.evaluate(() => ({
          memory: GuardiaoMemoria.read(),
          progress: GuardiaoProgresso.read(),
        }));
        if (width < 1000) await p.locator("#map-backpack").tap();
        else await p.keyboard.press("b");
        await p.locator("#mochila-jornada").waitFor({ state: "visible" });
        await p.locator("button[data-pack-tab=items]").click();
        await images(p, "#mochila-jornada");
        const cards = p.locator(".mission-tool-card");
        assert.equal(await cards.count(), 16);
        assert.equal(
          await p.locator(".mission-tool-card.is-known").count(),
          n === 5 ? 16 : 0,
        );
        for (let i = 0; i < 16; i++) {
          assert.ok(
            (
              await cards
                .nth(i)
                .locator(".item-illustration image")
                .getAttribute("href")
            ).endsWith(`ferramenta-${i + 1}.webp`),
          );
        }
        const scroll = await p.locator("#pack-content").evaluate((e) => {
          const start = e.scrollTop;
          e.scrollTop = e.scrollHeight;
          return {
            start,
            end: e.scrollTop,
            overflow: getComputedStyle(e).overflowY,
            horizontal: e.scrollWidth > e.clientWidth + 1,
          };
        });
        assert.equal(scroll.overflow, "auto");
        assert.ok(
          scroll.end > scroll.start,
          "rolagem interna preservada até o último dos 16 itens",
        );
        assert.equal(scroll.horizontal, false, "sem rolagem lateral");
        await contained(
          p,
          "#mochila-jornada, #pack-content [data-item=jardim]",
        );
        if (n === 5)
          assert.match(
            await cards.last().textContent(),
            /espaços verdes da comunidade/,
          );
        await p.screenshot({
          path: `${out}/ferramentas-final-${n}-${width}.png`,
        });
        await p.locator("[data-pack-close]").click();
        for (const id of n === 5 ? [1, 2, 3, 4, 5] : [1, 2]) {
          await p
            .locator(`[data-phase="${id}"]`)
            .click({ force: n === 0 && id === 2 });
          await p.waitForFunction(
            () =>
              document.getElementById("phase-dialog").dataset.pictureReady ===
              "true",
          );
          await images(p, "#phase-dialog");
          assert.ok(
            (await p.locator("#phase-picture").getAttribute("src")).endsWith(
              `cena-${id}.webp`,
            ),
          );
          assert.equal(
            await p.locator("#phase-conversation").count(),
            0,
            "sem personagens duplicados sobre a cena",
          );
          assert.equal(
            await p
              .locator("#phase-picture")
              .evaluate((e) => getComputedStyle(e).objectFit),
            "contain",
          );
          assert.equal(
            await p
              .locator("#phase-picture")
              .evaluate((e) => e.naturalWidth / e.naturalHeight),
            631 / 481,
          );
          assert.equal(
            await p.locator("#phase-npc").textContent(),
            ["Carlos", "Antônio", "Marina", "Rafael", "Luciana"][id - 1],
          );
          assert.equal(await p.locator("#phase-goals li").count(), 3);
          assert.equal(
            await p.locator("#phase-items .mission-tool").count(),
            id === 4 ? 4 : 3,
          );
          assert.ok(
            (
              await p.locator("#phase-emblem image").getAttribute("href")
            ).endsWith(`emblema-${id}.webp`),
          );
          assert.equal(await p.locator("#phase-reward image").count(), 1);
          assert.equal(
            await p.locator("#start-phase .brief-action-art").count(),
            1,
            "moldura persiste ao trocar de fase",
          );
          assert.equal(
            await p.locator("#start-phase").getAttribute("aria-disabled"),
            String(n === 0 && id === 2),
          );
          const link = await p.locator("#start-phase").getAttribute("href");
          assert.ok(
            id === 1
              ? link.endsWith("/jogo/floresta-viva/index.html")
              : link.endsWith(`/jogo/jornada/index.html?fase=${id}`),
          );
          await contained(
            p,
            "#phase-dialog, #phase-picture, #phase-title, #phase-npc, #phase-back, #start-phase, #close-phase",
          );
          assert.ok(
            await p
              .locator(".phase-copy")
              .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
            "textos sem corte horizontal",
          );
          if (n === 0 && id === 2) {
            await p.locator("#start-phase").click({ force: true });
            assert.equal(
              await p.locator("#phase-dialog").evaluate((e) => e.open),
              true,
              "fase bloqueada não inicia",
            );
          }
          await p.screenshot({ path: `${out}/fase-${id}-${n}-${width}.png` });
          if (id % 2) {
            await p.locator("#phase-back").focus();
            await p.keyboard.press("Enter");
          } else if (width < 1000) await p.locator("#close-phase").tap();
          else await p.locator("#close-phase").click();
          await p.locator("#phase-dialog").waitFor({ state: "hidden" });
        }
        assert.deepEqual(
          await p.evaluate(() => ({
            memory: GuardiaoMemoria.read(),
            progress: GuardiaoProgresso.read(),
          })),
          before,
          "consultar painéis preserva a partida",
        );
        assert.deepEqual(errors, []);
        await p.close();
        console.log(
          "PASS ferramentas, rolagem, cinco cenas, alinhamento e navegação:",
          width,
          height,
          n,
        );
      }
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
