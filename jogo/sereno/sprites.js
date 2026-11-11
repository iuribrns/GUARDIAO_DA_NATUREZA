"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    atlas = SerenoAtlas,
    images = new Map(),
    loading = new Map();
  for (const name of ["kai", "mangueira", "acoes"])
    RaizesPersonagens.atlas[name] = {
      ...atlas[name],
      file: new URL(atlas[name].file, base).href,
    };
  function load(names = ["equipamentos", "conquista"]) {
    return Promise.all(
      names.map((name) => {
        if (!loading.has(name))
          loading.set(
            name,
            (async () => {
              const im = new Image();
              im.src = new URL(atlas[name].file, base);
              await im.decode();
              images.set(name, im);
            })(),
          );
        return loading.get(name);
      }),
    );
  }
  function draw(
    ctx,
    name,
    index,
    x,
    y,
    height,
    { flip = false, alpha = 1 } = {},
  ) {
    const im = images.get(name),
      d = atlas[name];
    if (!im || !d) return false;
    const f = d.frames[index % d.frames.length],
      b = f.bounds,
      k = height / d.referenceHeight;
    ctx.save();
    ctx.globalAlpha *= Math.max(0, Math.min(1, alpha));
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(
      im,
      ...b,
      (b[0] - f.pivot[0]) * k,
      (b[1] - f.pivot[1]) * k,
      b[2] * k,
      b[3] * k,
    );
    ctx.restore();
    return true;
  }
  function equipment(ctx, row, progress, x, y, height = 83, flip = false) {
    const frame =
      row * 6 +
      Math.min(5, Math.floor(Math.max(0, Math.min(0.999, progress)) * 6));
    return draw(ctx, "equipamentos", frame, x, y, height, { flip });
  }
  function diving() {
    return `<svg class="diving-outfit" viewBox="20 1007 177 293" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><image href="${new URL("../cuidado-acessivel/assets/amanha-traje-andar-e77d3b21.webp", base)}" width="864" height="1312"/></svg>`;
  }
  window.SerenoSprites = { base, atlas, images, load, draw, equipment, diving };
})();
