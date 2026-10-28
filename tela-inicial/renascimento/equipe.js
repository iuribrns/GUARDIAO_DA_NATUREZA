"use strict";
(() => {
  const panel = document.getElementById("team"),
    portraits = [...panel.querySelectorAll("[data-person]")],
    flora = document.getElementById("team-flora");
  let raf = 0,
    loaded = false,
    pending = false;
  const reduced = () =>
    matchMedia("(prefers-reduced-motion:reduce)").matches ||
    document.body.classList.contains("reduce-motion");
  function tick(t) {
    raf = 0;
    if (!loaded || document.hidden || panel.hidden) return;
    for (const c of portraits)
      GuardiaoAtores.portrait(c, c.dataset.person, t / 1000, reduced());
    GuardiaoAtores.flora(flora, t / 1000, reduced(), false);
    raf = requestAnimationFrame(tick);
  }
  async function start() {
    if (panel.hidden || document.hidden) return;
    if (!loaded && !pending) {
      pending = true;
      try {
        await GuardiaoAtores.load(["equipe", "flora"]);
        loaded = true;
        document.body.dataset.teamReady = "true";
      } catch {
        panel.dataset.artError = "true";
      } finally {
        pending = false;
      }
    }
    if (loaded && !raf) raf = requestAnimationFrame(tick);
  }
  new MutationObserver(() => {
    if (panel.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else start();
  }).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
  document.addEventListener("visibilitychange", () => {
    cancelAnimationFrame(raf);
    raf = 0;
    start();
  });
  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(raf);
    raf = 0;
  });
  window.addEventListener("pageshow", start);
  start();
})();
