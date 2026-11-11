"use strict";
(() => {
  const root = new URL("../../", document.currentScript.src);
  const names = [
    "water",
    "fire",
    "paw",
    "hand",
    "leaf",
    "trash",
    "fish",
    "turtle",
    "seeds",
    "watering",
    "recycle",
    "sun",
    "bag",
    "gear",
    "net",
    "lock",
  ];
  let imagePromise = null;
  function source() {
    return (
      window.GuardiaoArte?.url(
        new URL("jogo/jornada/assets/icones.png", root).href,
      ) || new URL("jogo/jornada/assets/icones.png", root).href
    );
  }
  function markup(name) {
    if (name === "flora")
      return `<span class="ui-icon flora-icon" aria-hidden="true"><img src="${window.GuardiaoArte?.url(new URL("assets/identidade-flora/flora-180.png", root).href) || new URL("assets/identidade-flora/flora-180.png", root).href}" alt=""></span>`;
    const data = window.GuardiaoCampanhaAtlas?.icones,
      index = Math.max(0, names.indexOf(name));
    if (!data) return "";
    const f = data.frames[index],
      b = f.bounds;
    return `<span class="ui-icon" aria-hidden="true"><svg viewBox="${b.join(" ")}"><image href="${source()}" width="${data.width}" height="${data.height}"/></svg></span>`;
  }
  function prepare(parent = document) {
    parent.querySelectorAll("[data-icon]").forEach((el) => {
      el.innerHTML = markup(el.dataset.icon);
    });
  }
  function load() {
    return (imagePromise ??= new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = source();
    }));
  }
  async function draw(ctx, name, x, y, size) {
    const im = await load();
    paint(ctx, im, name, x, y, size);
  }
  function paint(ctx, im, name, x, y, size) {
    if (!im) return;
    const d = window.GuardiaoCampanhaAtlas.icones,
      f = d.frames[Math.max(0, names.indexOf(name))],
      b = f.bounds;
    ctx.drawImage(im, ...b, x - size / 2, y - size / 2, size, size);
  }
  window.GuardiaoIcones = Object.freeze({ markup, prepare, load, paint, draw });
  prepare();
})();
