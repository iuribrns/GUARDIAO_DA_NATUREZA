"use strict";
(() => {
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
      "shield",
      "rope",
      "key",
      "shovel",
      "jump",
      "heart",
      "bike",
      "bus",
    ],
    src = new URL("assets/icones.svg", document.currentScript.src).href;
  let promise;
  function index(name) {
    return Math.max(0, names.indexOf(name));
  }
  function markup(name) {
    if (name === "flora")
      return (
        '<span class="ui-icon flora-icon" aria-hidden="true"><img src="' +
        new URL(
          "../../assets/identidade-flora/flora-180.png",
          document.currentScript?.src || src,
        ).href +
        '" alt=""></span>'
      );
    const i = index(name),
      x = (i % 8) * 64,
      y = Math.floor(i / 8) * 64;
    return (
      '<span class="ui-icon" aria-hidden="true"><svg viewBox="' +
      x +
      " " +
      y +
      ' 64 64" overflow="hidden"><image href="' +
      src +
      '" width="512" height="192"/></svg></span>'
    );
  }
  const flora = new URL(
    "../../assets/identidade-flora/flora-180.png",
    document.currentScript.src,
  ).href;
  const original = markup;
  function safeMarkup(n) {
    return n === "flora"
      ? '<span class="ui-icon flora-icon" aria-hidden="true"><img src="' +
          flora +
          '" alt=""></span>'
      : original(n);
  }
  function prepare(p = document) {
    p.querySelectorAll("[data-icon]").forEach(
      (e) => (e.innerHTML = safeMarkup(e.dataset.icon)),
    );
  }
  function load() {
    return (promise ??= new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = src;
    }));
  }
  function paint(ctx, im, name, x, y, size) {
    if (!im) return;
    const i = index(name);
    ctx.drawImage(
      im,
      (i % 8) * 64,
      Math.floor(i / 8) * 64,
      64,
      64,
      x - size / 2,
      y - size / 2,
      size,
      size,
    );
  }
  async function draw(ctx, name, x, y, size) {
    paint(ctx, await load(), name, x, y, size);
  }
  window.GuardiaoIcones = Object.freeze({
    markup: safeMarkup,
    prepare,
    load,
    paint,
    draw,
  });
  prepare();
})();
