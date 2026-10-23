"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright-core");
const base = new URL(
  "../../",
  process.env.GUARDIAO_TEST_URL ||
    "http://127.0.0.1:5173/tela-inicial/nova-versao/",
);
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const p = await browser.newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("response", (r) => {
      if (r.status() >= 400) errors.push(r.status() + " " + r.url());
    });
    await p.goto(new URL("tela-inicial/nova-versao/index.html", base).href);
    const result = await p.evaluate(async (base) => {
      const atlas = await (
        await fetch(new URL("jogo/sprites-integros/assets/atlas.json", base))
      ).json();
      const sheets = Object.entries(atlas.grupos)
        .flatMap(([group, all]) =>
          Object.entries(all).map(([name, s]) => ({ group, name, ...s })),
        )
        .concat({ group: "colar", name: "kai-vestindo", ...atlas.colar });
      const failures = [];
      let count = 0;
      for (const s of sheets) {
        const im = new Image();
        im.src = new URL("jogo/sprites-integros/" + s.file, base).href;
        await im.decode();
        if (im.naturalWidth !== s.width || im.naturalHeight !== s.height)
          failures.push(s.name + ": dimensões");
        const c = document.createElement("canvas");
        c.width = s.width;
        c.height = s.height;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(im, 0, 0);
        const data = ctx.getImageData(0, 0, s.width, s.height).data,
          used = new Uint8Array(s.width * s.height);
        const alpha = (x, y) => data[(y * s.width + x) * 4 + 3];
        for (const [i, f] of s.frames.entries()) {
          const [x, y, w, h] = f.bounds;
          if (
            Math.min(x, y) < 12 ||
            x + w > s.width - 12 ||
            y + h > s.height - 12
          )
            failures.push(s.name + ":" + i + " margem externa");
          let visible = 0,
            overlap = false,
            cut = false;
          for (let yy = y - 10; yy < y + h + 10; yy++)
            for (let xx = x - 10; xx < x + w + 10; xx++) {
              if (xx >= x && xx < x + w && yy >= y && yy < y + h) {
                if (alpha(xx, yy) > 100) visible++;
                if (used[yy * s.width + xx]) overlap = true;
                used[yy * s.width + xx] = 1;
              } else if (alpha(xx, yy) > 0) cut = true;
            }
          if (overlap) failures.push(s.name + ":" + i + " quadros sobrepostos");
          if (cut)
            failures.push(
              s.name + ":" + i + " recorte na borda da asa/cabelo/roupa",
            );
          if (visible < 100) failures.push(s.name + ":" + i + " vazio");
          const [px, py] = f.pivot;
          if (!(px > 0 && px < s.width && py > 0 && py <= s.height))
            failures.push(s.name + ":" + i + " âncora inválida");
          count++;
        }
        if (used.some((v, i) => !v && data[i * 4 + 3] > 0))
          failures.push(s.name + ": partes soltas fora dos quadros");
        if (s.name === "kai-nadando") {
          const heights = s.frames
              .map((f) => f.bounds[3])
              .sort((a, b) => a - b),
            median = (heights[7] + heights[8]) / 2;
          if (heights.at(-1) >= median * 1.25)
            failures.push("Resíduo de outra pose na natação");
        }
        if (["kai-andando", "kai-mangueira"].includes(s.name))
          for (let start = 0; start < s.frames.length; start += 4) {
            const heights = s.frames
              .slice(start, start + 4)
              .map((f) => f.bounds[3]);
            if (Math.max(...heights) / Math.min(...heights) >= 1.12)
              failures.push(s.name + ": tamanho muda durante caminhada");
          }
      }
      const flora = atlas.grupos.vida.flora;
      if (
        flora.referenceHeight !== 300 ||
        Math.max(...flora.frames.slice(0, 8).map((f) => f.bounds[2])) <=
          flora.frames[12].bounds[2] * 1.6
      )
        failures.push("Asas completas do modelo anterior de Flora");
      if (atlas.colar.pendants.length !== 8)
        failures.push("Colar não acompanha as oito poses");
      return { count, sheets: sheets.length, failures };
    }, base.href);
    assert.deepEqual(result.failures, []);
    assert.deepEqual(errors, []);
    assert.equal(result.count, 330);
    assert.equal(result.sheets, 24);
    console.log(
      "PASS: 330 quadros em 24 pranchas publicadas, bordas transparentes livres, sem partes vizinhas; natação isolada, tamanho estável e asas completas de Flora.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
