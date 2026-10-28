"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright-core");
const base =
  process.env.GUARDIAO_TEST_URL ||
  "http://127.0.0.1:5173/tela-inicial/nova-versao/";
(async () => {
  const b = await chromium.launch({
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
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    watch(p);
    await p.clock.install();
    await p.goto(base + "sobre.html#team");
    await p.waitForFunction(
      () =>
        document.body.dataset.teamReady === "true" &&
        window.GuardiaoEquipe2D?.ready(),
    );
    assert.equal(
      await p
        .locator("body")
        .evaluate((e) => e.classList.contains("team-open")),
      true,
    );
    assert.equal(await p.locator(".student-card").count(), 2);
    const sheets = await p.evaluate(async () => {
      const d = GuardiaoEquipe2DAtlas,
        im = new Image();
      im.src = new URL("../equipe-2d/" + d.file, location.href).href;
      await im.decode();
      return {
        count: d.frames.length,
        valid: d.frames.every(
          (f) =>
            f.bounds[0] >= 12 &&
            f.bounds[1] >= 12 &&
            f.bounds[0] + f.bounds[2] <= im.width - 12 &&
            f.bounds[1] + f.bounds[3] <= im.height - 12,
        ),
      };
    });
    assert.equal(sheets.count, 8);
    assert.ok(sheets.valid, "prancha com margem para cabelos, mãos e botas");
    const rendered = await p.evaluate(() => {
      const result = [];
      for (const person of ["iuri", "hicham"]) {
        const c = document.createElement("canvas");
        c.width = 330;
        c.height = 600;
        const hashes = [];
        for (const mode of ["idle", "blink", "reference", "greeting"]) {
          GuardiaoEquipe2D.draw(
            c,
            person,
            mode === "blink" ? 4.45 - (person === "iuri" ? 0.91 : 0) : 0,
            false,
            ["reference", "greeting"].includes(mode)
              ? { kind: mode, age: 0.4 }
              : null,
          );
          hashes.push(c.toDataURL());
          const a = c.getContext("2d").getImageData(0, 0, 330, 600).data;
          let minX = 330,
            maxX = 0,
            minY = 600,
            maxY = 0;
          for (let y = 0; y < 600; y++)
            for (let x = 0; x < 330; x++)
              if (a[(y * 330 + x) * 4 + 3] > 32) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
              }
          result.push({
            person,
            mode,
            frame: Number(c.dataset.frame),
            complete: minX > 3 && maxX < 326 && minY > 3 && maxY < 596,
            fullHeight: maxY - minY,
          });
        }
        result.push({ person, different: new Set(hashes).size === 4 });
      }
      return result;
    });
    for (const r of rendered) {
      if ("complete" in r) {
        assert.ok(r.complete, r.person + " " + r.mode + " sem cortes");
        assert.ok(
          r.fullHeight > 440,
          "corpo inteiro visível, incluindo as botas",
        );
      } else
        assert.ok(
          r.different,
          r.person + " tem quatro poses com pixels diferentes",
        );
    }
    for (const v of [
      { width: 1280, height: 900 },
      { width: 844, height: 390 },
      { width: 390, height: 844 },
      { width: 320, height: 740 },
    ]) {
      await p.setViewportSize(v);
      await p.clock.runFor(100);
      assert.ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "sem rolagem horizontal da página em " + v.width,
      );
      const layout = await p.evaluate(() => {
        const cards = [...document.querySelectorAll(".student-card")].map((e) =>
          e.getBoundingClientRect(),
        );
        return {
          sameRow: Math.abs(cards[0].y - cards[1].y) < 1,
          ordered: cards[1].x > cards[0].x,
          scrolls:
            document.getElementById("team-gallery").scrollWidth >
            document.getElementById("team-gallery").clientWidth + 5,
          pairs: [...document.querySelectorAll(".student-card")].map((card) => {
            const actor = card
                .querySelector(".student-actor")
                .getBoundingClientRect(),
              ref = card
                .querySelector(".pokemon-partner")
                .getBoundingClientRect();
            return {
              side: ref.x >= actor.right - 2,
              visible: ref.width > 65 && actor.width > 85,
            };
          }),
        };
      });
      assert.ok(
        layout.sameRow && layout.ordered,
        "estudantes na horizontal em " + v.width,
      );
      assert.ok(
        layout.pairs.every((p) => p.side && p.visible),
        "referências grandes ao lado dos bonecos em " + v.width,
      );
      assert.equal(layout.scrolls, v.width < 781);
      if (v.width < 781) {
        await p
          .getByRole("button", { name: "Ver próximo criador", exact: true })
          .click();
        await p.clock.runFor(700);
        await p.waitForFunction(
          () => document.getElementById("team-gallery").scrollLeft > 50,
        );
        const visible = await p
          .locator('[data-greet="hicham"]')
          .evaluate((e) => {
            const a = e.getBoundingClientRect(),
              r = document
                .getElementById("team-gallery")
                .getBoundingClientRect();
            return a.left >= r.left - 2 && a.right <= r.right + 2;
          });
        assert.ok(visible, "Hicham aparece ao deslizar a galeria");
        await p
          .getByRole("button", { name: "Ver criador anterior", exact: true })
          .click();
        await p.clock.runFor(700);
      }
    }
    await p.setViewportSize({ width: 1280, height: 900 });
    await p
      .getByRole("button", { name: "Cumprimentar Iuri", exact: true })
      .click();
    await p.clock.runFor(100);
    assert.equal(
      await p.locator('[data-person="iuri"]').getAttribute("data-pose"),
      "greeting",
    );
    assert.equal(
      await p.locator('[data-person="iuri"]').getAttribute("data-frame"),
      "3",
    );
    assert.match(await p.locator("#team-greeting").textContent(), /^Iuri:/);
    await p.clock.runFor(3600);
    assert.equal(await p.locator("#team-greeting").isVisible(), false);
    await p
      .getByRole("button", {
        name: "Ver referência Decidueye ao lado de Hicham",
        exact: true,
      })
      .click();
    await p.clock.runFor(100);
    assert.equal(
      await p.locator('[data-person="hicham"]').getAttribute("data-frame"),
      "6",
    );
    assert.ok(
      (await p.locator("#team-greeting").textContent()).includes(
        "referências visuais",
      ),
    );
    await p
      .getByRole("button", { name: "Cumprimentar Hicham", exact: true })
      .focus();
    await p.keyboard.press("Enter");
    await p.clock.runFor(100);
    assert.equal(
      await p.locator('[data-person="hicham"]').getAttribute("data-frame"),
      "7",
    );
    await p.emulateMedia({ reducedMotion: "reduce" });
    await p.clock.runFor(100);
    assert.equal(
      await p.locator('[data-person="iuri"]').getAttribute("data-frame"),
      "0",
    );
    assert.equal(
      await p.locator('[data-person="hicham"]').getAttribute("data-frame"),
      "4",
    );
    assert.equal(
      await p
        .locator(".pokemon-partner img")
        .first()
        .evaluate((e) => getComputedStyle(e).animationName),
      "none",
    );
    assert.equal(
      await p.locator('[data-person="peterson"]').getAttribute("data-frame"),
      "8",
      "professor preserva seu retrato e sua animação original",
    );
    assert.equal(
      await p.evaluate(() =>
        localStorage.getItem("guardiao.mapa.progresso.v1"),
      ),
      null,
      "interações dos criadores não alteram o progresso",
    );
    await p.getByRole("tab", { name: "A história", exact: true }).click();
    assert.equal(
      await p
        .locator("body")
        .evaluate((e) => e.classList.contains("team-open")),
      false,
    );
    assert.equal(await p.locator(".companions-camp").isVisible(), true);
    await p.getByRole("tab", { name: "Sobre Nós", exact: true }).click();
    await p.clock.runFor(100);
    assert.equal(
      await p.locator('[data-person="iuri"]').getAttribute("data-art"),
      "corpo-inteiro-2d",
    );
    const phone = await b.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    watch(phone);
    await phone.goto(base + "sobre.html#team");
    await phone.waitForFunction(
      () => document.body.dataset.teamReady === "true",
    );
    await phone
      .getByRole("button", { name: "Cumprimentar Iuri", exact: true })
      .tap();
    await phone.waitForFunction(
      () =>
        document.querySelector('[data-person="iuri"]').dataset.frame === "3",
    );
    await phone
      .getByRole("button", { name: "Ver próximo criador", exact: true })
      .tap();
    await phone.waitForFunction(
      () => document.getElementById("team-gallery").scrollLeft > 100,
    );
    await phone
      .getByRole("button", { name: "Cumprimentar Hicham", exact: true })
      .tap();
    await phone.waitForFunction(
      () =>
        document.querySelector('[data-person="hicham"]').dataset.frame === "7",
    );
    assert.match(
      await phone.locator("#team-greeting").textContent(),
      /^Hicham:/,
    );
    await phone.close();
    assert.deepEqual(errors, []);
    console.log(
      "PASS: oito sprites 2D completos, quatro poses reais por estudante, referências Pokémon ao lado, galeria horizontal em 320/390/844/1280px, toque/teclado, cumprimento, piscadas, mensagens temporárias, professor preservado e movimento reduzido.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
