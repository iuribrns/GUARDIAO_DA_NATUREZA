"use strict";
(() => {
  let packCanvas,
    opened = 0,
    last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < 32 || document.hidden) return;
    last = now;
    if (packCanvas && document.querySelector("#mochila-jornada[open]"))
      VivaArt.canvas(packCanvas, (c, w, h) =>
        SerenoSprites.equipment(
          c,
          3,
          BrisaArte.reduced() ? 1 : Math.min(0.999, (now - opened) / 1400),
          w * 0.5,
          h * 0.96,
          h * 0.88,
        ),
      );
  }
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".home-menu a").forEach((a) => {
      const content = document.createElement("span");
      content.className = "menu-float-content";
      while (a.firstChild) content.append(a.firstChild);
      a.append(content);
    });
    const inspect = () => {
      const pack = document.getElementById("mochila-jornada");
      if (!pack) return;
      if (!packCanvas) {
        opened = performance.now();
        packCanvas = document.createElement("canvas");
        packCanvas.className = "pack-actor";
        packCanvas.setAttribute("aria-label", "Kai retira e abre sua mochila");
        pack
          .querySelector("header")
          .insertBefore(packCanvas, pack.querySelector("[data-pack-close]"));
        SerenoSprites.load(["equipamentos"]);
        new MutationObserver(() => {
          if (pack.open) opened = performance.now();
        }).observe(pack, { attributes: true, attributeFilter: ["open"] });
      }
    };
    new MutationObserver(inspect).observe(document.body, { childList: true });
    requestAnimationFrame(frame);
  });
})();
