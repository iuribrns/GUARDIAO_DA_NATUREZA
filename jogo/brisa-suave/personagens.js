"use strict";
(() => {
  const A = RaizesPersonagens,
    atlas = BrisaSuaveAtlas,
    base = new URL("./", document.currentScript.src);
  Object.assign(BosqueKaiAtlas.protecao, atlas.protecao, {
    file: "../brisa-suave/assets/protecao.webp",
  });
  const previousUniform = BosqueKai.uniformMarkup;
  const uniformImage = () =>
    `<img class="bosque-uniform" src="${new URL("assets/traje-rio-mini.webp", base)}" alt="" width="120" height="160" style="object-fit:contain">`;
  BosqueKai.uniformMarkup = (name) =>
    name === "protecao" ? uniformImage() : previousUniform?.(name) || "";
  if (window.BrisaArte) {
    const priorMarkup = BrisaArte.markup;
    BrisaArte.markup = (name) =>
      name === "protecao" ? uniformImage() : priorMarkup(name);
  }
  A.atlas.flora = { ...atlas.flora, file: "../brisa-suave/assets/flora.webp" };
  // Cinco vistas próprias e três reflexos: costas nunca usam uma pose de lado.
  const views = [
    [0, false],
    [1, false],
    [2, false],
    [1, true],
    [0, true],
    [3, true],
    [4, false],
    [3, false],
  ];
  const view = (d) => views[((Math.round(d || 0) % 8) + 8) % 8];
  const phase = location.pathname.includes("floresta-viva")
    ? 1
    : Number(new URLSearchParams(location.search).get("fase") || 0);
  let idleImage, idlePromise;
  function loadIdle() {
    return (idlePromise ||= (async () => {
      const im = new Image();
      im.decoding = "async";
      im.src = new URL(atlas.parado.file, base);
      await im.decode();
      idleImage = im;
    })().catch(() => false));
  }
  const priorLoad = BosqueKai.load,
    priorWalk = BosqueKai.walk;
  BosqueKai.load = (...args) => Promise.all([priorLoad(...args), loadIdle()]);
  function idle(c, p, time, reduced, height = 63, forced) {
    if (!idleImage) return false;
    const name =
      forced || window.GuardiaoMemoria?.read().uniform || "explorador";
    const role = [
      "explorador",
      "protecao",
      "resgate",
      "plantio",
      "voluntario",
    ].indexOf(name);
    const npc =
      phase === 1
        ? { x: 245, y: 245 }
        : window.GuardiaoFasesJogaveis?.[phase]?.npcPosition;
    const d =
      npc && Math.hypot(p.x - npc.x, p.y - npc.y) < 100
        ? (Math.round(-Math.atan2(npc.y - p.y, npc.x - p.x) / (Math.PI / 4)) +
            8) %
          8
        : (p.direction ?? 6);
    const { row, flip } = BosqueKai.pose({ ...p, direction: d }, true);
    const f = atlas.parado.frames[Math.max(0, role) * 5 + row],
      b = f.bounds;
    const h =
        (c.canvas.id === "cenario" ? height * 1.32 : height) +
        (reduced ? 0 : Math.sin(time * 1.7) * 0.28),
      k = h / atlas.parado.referenceHeight;
    c.save();
    c.translate(p.x, p.y);
    if (flip) c.scale(-1, 1);
    c.drawImage(
      idleImage,
      ...b,
      (b[0] - f.pivot[0]) * k,
      (b[1] - f.pivot[1]) * k,
      b[2] * k,
      b[3] * k,
    );
    c.restore();
    if (c.canvas.id === "cenario") {
      document.body.dataset.kaiUniform = name;
      document.body.dataset.heroDirection = String(d);
      document.body.dataset.kaiIdle = "true";
    }
    return true;
  }
  BosqueKai.walk = (
    c,
    p,
    time,
    reduced,
    height = 63,
    equipped = false,
    forced,
  ) => {
    if (!p.moving && !equipped && idle(c, p, time, reduced, height, forced))
      return true;
    if (c.canvas.id === "cenario") document.body.dataset.kaiIdle = "false";
    return priorWalk(c, p, time, reduced, height, equipped, forced);
  };
  function frame(direction, mode, time, progress = 0, reduced = false) {
    const [row, flip] = view(direction);
    const step =
      mode === "ombro" || mode === "fala"
        ? 6 + (!reduced && time % 5 > 4.72 ? 1 : 0)
        : mode === "pousando"
          ? 4 + Math.min(2, Math.floor(progress * 3))
          : mode === "decolando"
            ? 6 - Math.min(2, Math.floor(progress * 3))
            : reduced
              ? 1
              : Math.floor(time * 8) % 4;
    return { index: row * 8 + step, row, step, flip };
  }
  function owl(c, x, y, h, time, mode = "voo", flip = false) {
    const reduced = document.body.classList.contains("reduce-motion");
    const f = frame(6, mode, time, 0, reduced);
    A.draw(c, "flora", f.index, x, y, h, { flip });
  }
  A.owl = owl;
  if (window.VivaArt) VivaArt.owl = owl;
  const Life = window.GuardiaoVidaNatural;
  if (Life)
    window.GuardiaoVidaNatural = class extends Life {
      flora(c, f, p, time, reduced) {
        const visual = document.body.dataset.heroDirection;
        const direction =
            f.mode === "comemorando"
              ? 6
              : /^[0-7]$/.test(visual || "")
                ? Number(visual)
                : FloraCompanheira.direction(p, this.phase),
          mode = f.mode;
        const landed = mode === "ombro",
          amount =
            mode === "pousando"
              ? Math.min(1, f.elapsed / 0.55)
              : mode === "decolando"
                ? 1 - Math.min(1, f.elapsed / 0.38)
                : landed
                  ? 1
                  : 0;
        const pose = frame(
          direction,
          mode,
          time,
          Math.min(1, f.elapsed / (mode === "pousando" ? 0.55 : 0.38)),
          reduced,
        );
        A.draw(
          c,
          "flora",
          pose.index,
          f.x,
          f.y + (reduced || landed ? 0 : Math.sin(time * 4) * 0.7),
          35 - 8 * amount,
          { flip: pose.flip },
        );
        document.body.dataset.floraFrame = String(pose.index);
        document.body.dataset.floraView = String(direction);
        document.body.dataset.floraPerspective = String(pose.row);
      }
      draw(c, name, index, x, y, h, options = {}) {
        if (name === "flora")
          return A.draw(
            c,
            "flora",
            index >= 14
              ? 32 + (index % 2)
              : index >= 12
                ? 38 + (index % 2)
                : 32 + (index % 4),
            x,
            y,
            h,
            options,
          );
        return super.draw(c, name, index, x, y, h, options);
      }
    };
  const Art = window.GuardiaoAdventureArt;
  if (Art)
    window.GuardiaoAdventureArt = class extends Art {
      async load() {
        await Promise.all([super.load(), loadIdle()]);
        if (this.phase !== 2) return;
        const im = new Image();
        im.decoding = "async";
        im.src = new URL(atlas.rio.file, base);
        await im.decode();
        this.riverImage = im;
      }
      outfit(c, p, time, reduced, height = 63) {
        if (!p.moving && idle(c, p, time, reduced, height)) return true;
        return super.outfit(c, p, time, reduced, height);
      }
      river(c, p, time, reduced, options = {}) {
        if (this.phase !== 2 || !this.riverImage)
          return super.river(c, p, time, reduced, options);
        const progress = Math.max(0, Math.min(0.999, options.progress || 0));
        let index,
          flip = false;
        const swimming = p.swimming && !options.dressing && !options.kind;
        if (options.dressing) index = 20 + Math.floor(progress * 4);
        else if (options.kind)
          index =
            (options.problem === "plastic" ? 28 : 24) +
            Math.floor(progress * 4);
        else if (swimming) {
          const pose = BosqueKai.pose(p, reduced);
          index =
            pose.row * 4 +
            (reduced ? 1 : Math.floor(time * (p.moving ? 6 : 2)) % 4);
          flip = pose.flip;
        } else {
          BosqueKai.walk(c, p, time, reduced, 63, false, "protecao");
          return "traje-andar:" + BosqueKai.pose(p, reduced).step;
        }
        const f = atlas.rio.frames[index],
          b = f.bounds;
        if (!swimming) flip = p.direction >= 3 && p.direction <= 5;
        const k = swimming
          ? 83 / BosqueKaiAtlas.protecao.referenceHeight
          : (options.dressing ? 83 : 66) / atlas.rio.referenceHeight;
        const pivot = swimming ? f.head : f.pivot,
          y = p.y - (swimming ? 26 : 0);
        const paint = () =>
          c.drawImage(
            this.riverImage,
            ...b,
            (b[0] - pivot[0]) * k,
            (b[1] - pivot[1]) * k,
            b[2] * k,
            b[3] * k,
          );
        c.save();
        c.translate(p.x, y);
        if (flip) c.scale(-1, 1);
        c.globalAlpha = swimming ? 0.72 : 1;
        paint();
        if (swimming) {
          c.globalAlpha = 1;
          c.beginPath();
          c.ellipse(0, 0, 16, 18, 0, 0, Math.PI * 2);
          c.clip();
          paint();
        }
        c.restore();
        if (swimming) {
          c.save();
          c.strokeStyle = "#d7f0e5a0";
          c.lineWidth = 1.1;
          c.beginPath();
          c.ellipse(
            p.x,
            p.y - 10,
            24 + (reduced ? 0 : Math.sin(time * 4) * 2),
            5,
            0,
            0,
            Math.PI * 2,
          );
          c.stroke();
          c.restore();
        }
        document.body.dataset.kaiUniform = "protecao";
        document.body.dataset.heroDirection = String(
          swimming ? p.direction : flip ? 4 : 0,
        );
        document.body.dataset.riverPose =
          (options.kind === "desprender"
            ? "libertar-no-habitat:"
            : swimming
              ? "nado-natureza:"
              : "traje-natureza:") + index;
        return document.body.dataset.riverPose;
      }
    };
  window.BrisaSuavePersonagens = { frame, view, atlas };
})();
