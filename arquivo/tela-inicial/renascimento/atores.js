"use strict";
(() => {
  const root = new URL("../../", document.currentScript.src),
    images = new Map();
  function spec(name) {
    if (name === "kai")
      return {
        ...GuardiaoFlorestaAtlas.sheets["kai-repouso"],
        file:
          "jogo/floresta-viva/assets/" +
          GuardiaoFlorestaAtlas.sheets["kai-repouso"].file,
      };
    if (name === "flora")
      return {
        ...GuardiaoVidaAtlas.flora,
        file: "jogo/vida-natural/assets/" + GuardiaoVidaAtlas.flora.file,
      };
    if (name === "colar")
      return {
        ...GuardiaoColarArte,
        file: "jogo/sprites-integros/" + GuardiaoColarArte.file,
      };
    return window.GuardiaoRenascimentoAtlas[name];
  }
  async function load(names) {
    return Promise.all(
      names.map(async (name) => {
        const s = spec(name);
        if (!images.has(name)) {
          const im = new Image();
          images.set(name, im);
          im.src = new URL(s.file, root).href;
        }
        const im = images.get(name);
        await im.decode();
        return im;
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
      s = spec(name);
    if (!im?.complete || !im.naturalWidth || !s) return;
    const f = s.frames[index % s.frames.length],
      b = f.bounds,
      k = height / s.referenceHeight;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha *= alpha;
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
  }
  const extents = new Map();
  function fit(ctx, name, index, w, h, indices = null, padding = 18) {
    const s = spec(name),
      key = name + ":" + (indices ? indices.join(",") : "all");
    if (!s) return;
    if (!extents.has(key)) {
      const frames = indices ? indices.map((i) => s.frames[i]) : s.frames;
      extents.set(key, [
        Math.min(...frames.map((f) => f.bounds[0] - f.pivot[0])),
        Math.min(...frames.map((f) => f.bounds[1] - f.pivot[1])),
        Math.max(...frames.map((f) => f.bounds[0] + f.bounds[2] - f.pivot[0])),
        Math.max(...frames.map((f) => f.bounds[1] + f.bounds[3] - f.pivot[1])),
      ]);
    }
    const [l, t, r, b] = extents.get(key),
      k = Math.min((w - padding * 2) / (r - l), (h - padding * 2) / (b - t));
    draw(
      ctx,
      name,
      index,
      (w - (r - l) * k) / 2 - l * k,
      (h - (b - t) * k) / 2 - t * k,
      k * s.referenceHeight,
    );
  }
  function portrait(canvas, person, time, reduced) {
    const c = canvas.getContext("2d"),
      row = { hicham: 0, iuri: 1, peterson: 2 }[person],
      s = spec("equipe");
    if (!s) return;
    const blink = !reduced && (time + row * 0.91) % 4.6 > 4.32;
    const frame = row * 4 + (blink ? 2 : 0);
    c.clearRect(0, 0, canvas.width, canvas.height);
    fit(
      c,
      "equipe",
      frame,
      canvas.width,
      canvas.height,
      [row * 4, row * 4 + 1, row * 4 + 2, row * 4 + 3],
      4,
    );
    canvas.dataset.frame = String(frame);
  }
  function faceMarkup() {
    const s = spec("kai"),
      b = s.frames[6].bounds,
      href = new URL(s.file, root).href;
    return `<svg viewBox="${b[0] + b[2] * 0.17} ${b[1]} ${b[2] * 0.68} ${b[3] * 0.44}" aria-hidden="true"><image href="${href}" width="${s.width}" height="${s.height}"/></svg>`;
  }
  function flora(canvas, time, reduced, excited = false) {
    const c = canvas.getContext("2d");
    c.clearRect(0, 0, canvas.width, canvas.height);
    const frame = reduced
      ? 12
      : excited
        ? Math.floor(time * 12) % 8
        : time % 4.7 > 4.42
          ? 13
          : 12;
    fit(c, "flora", frame, canvas.width, canvas.height, null, 12);
    canvas.dataset.frame = String(frame);
  }
  window.GuardiaoAtores = Object.freeze({
    load,
    draw,
    fit,
    portrait,
    flora,
    faceMarkup,
    spec,
  });
})();
