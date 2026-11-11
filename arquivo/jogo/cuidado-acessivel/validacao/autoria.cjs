"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright-core");
const base =
  process.env.GUARDIAO_TEST_URL ||
  "http://127.0.0.1:5173/tela-inicial/nova-versao/";
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const errors = [],
    requests = [];
  try {
    for (const viewport of [
      { width: 1280, height: 720 },
      { width: 844, height: 390 },
      { width: 667, height: 375 },
      { width: 740, height: 320 },
    ]) {
      const mobile = viewport.width < 1000;
      const p = await browser.newPage({
        viewport,
        isMobile: mobile,
        hasTouch: mobile,
      });
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("request", (r) => requests.push(r.url()));
      p.on("response", (r) => {
        if (r.status() >= 400) errors.push(r.status() + " " + r.url());
      });
      await p.clock.install();
      await p.goto(base + "sobre.html#team");
      await p.waitForFunction(() => document.body.dataset.teamReady === "true");
      await p.clock.runFor(600);
      assert.equal(await p.locator("#team [data-person]").count(), 1);
      assert.equal(await p.locator("#team [data-person=peterson]").count(), 1);
      assert.equal(
        await p
          .locator("#team .student-card,#team-gallery,.team-gallery-controls")
          .count(),
        0,
      );
      assert.match(
        await p.locator("#team").textContent(),
        /Iuri Barroso Nascimento/,
      );
      assert.match(
        await p.locator("#team").textContent(),
        /Hicham Mohamed El Attar/,
      );
      assert.doesNotMatch(
        await p.locator("#team").textContent(),
        /Rowlet|Decidueye|Pokémon/,
      );
      assert.equal(
        await p.evaluate(() => typeof window.GuardiaoEquipe2D),
        "undefined",
      );
      assert.ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await p.locator(".professor-card").scrollIntoViewIfNeeded();
      await p.clock.runFor(600);
      const textsFit = await p.locator(".professor-card").evaluate((card) => {
        const box = card.getBoundingClientRect();
        return [...card.querySelectorAll("h3,p,figcaption")].every((e) => {
          const range = document.createRange();
          range.selectNodeContents(e);
          return [...range.getClientRects()].every(
            (r) => r.left >= box.left && r.right <= box.right,
          );
        });
      });
      assert.ok(
        textsFit,
        "nome e textos dentro do cartão em " + viewport.width,
      );
      await p.evaluate(() => {
        window.testPortraitFrames = new Set();
        new MutationObserver(() =>
          testPortraitFrames.add(
            document.querySelector('[data-person="peterson"]').dataset.frame,
          ),
        ).observe(document.querySelector('[data-person="peterson"]'), {
          attributes: true,
          attributeFilter: ["data-frame"],
        });
      });
      await p.clock.runFor(5000);
      assert.ok(
        await p.evaluate(
          () => testPortraitFrames.has("8") && testPortraitFrames.has("10"),
        ),
        "professor pisca com o retrato preservado",
      );
      if (mobile) await p.locator(".professor-card").tap();
      else await p.locator(".professor-card").hover();
      await p.clock.runFor(150);
      assert.notEqual(
        await p
          .locator(".profile-leaf")
          .first()
          .evaluate((e) => getComputedStyle(e).transform),
        "none",
        "folhas reagem ao mouse ou toque",
      );
      await p.emulateMedia({ reducedMotion: "reduce" });
      await p.clock.runFor(200);
      assert.equal(
        await p.locator('[data-person="peterson"]').getAttribute("data-frame"),
        "8",
      );
      await p.clock.runFor(3000);
      assert.equal(
        await p.locator('[data-person="peterson"]').getAttribute("data-frame"),
        "8",
      );
      assert.equal(
        await p
          .locator(".profile-leaf")
          .first()
          .evaluate((e) => getComputedStyle(e).transform),
        "none",
      );
      await p.getByRole("tab", { name: "A história", exact: true }).click();
      assert.equal(await p.locator("#team").isVisible(), false);
      await p.clock.runFor(100);
      assert.equal(
        await p
          .locator("body")
          .evaluate((e) => e.classList.contains("team-open")),
        false,
      );
      await p.getByRole("tab", { name: "Sobre Nós", exact: true }).click();
      await p.clock.runFor(100);
      assert.equal(await p.locator("#team").isVisible(), true);
      if (mobile) {
        await p.setViewportSize({
          width: viewport.height,
          height: viewport.width,
        });
        await p.clock.runFor(200);
        assert.equal(await p.locator("#girar-celular").isVisible(), true);
        await p.setViewportSize(viewport);
        await p.clock.runFor(200);
        assert.equal(await p.locator("#girar-celular").isVisible(), false);
      }
      await p.close();
    }
    const fallback = await browser.newPage({
      viewport: { width: 844, height: 390 },
      hasTouch: true,
    });
    fallback.on("pageerror", (e) => errors.push(e.message));
    await fallback.route("**/vendor/gsap-*", (r) => r.abort());
    await fallback.goto(base + "sobre.html#team");
    await fallback.waitForFunction(
      () => document.body.dataset.teamReady === "true",
    );
    await fallback.locator(".professor-card").scrollIntoViewIfNeeded();
    assert.equal(await fallback.locator(".professor-card").isVisible(), true);
    await fallback.close();
    assert.ok(
      !requests.some((u) =>
        /amanha-equipe-2d|equipe-corpo-inteiro|rowlet\.webp|decidueye\.webp/.test(
          u,
        ),
      ),
      "nenhum download das artes removidas",
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: autoria de Iuri e Hicham com o perfil do Professor Peterson em Sobre Nós, retrato e piscada preservados, nomes contidos, folhas com GSAP por mouse/toque, quatro tamanhos deitados, troca de abas, rotação, movimento reduzido e alternativa sem GSAP; artes antigas não carregam.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
