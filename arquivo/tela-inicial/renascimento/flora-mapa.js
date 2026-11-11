"use strict";
(() => {
  const button = document.getElementById("map-flora"),
    canvas = button.querySelector("canvas"),
    speech = document.getElementById("flora-map-speech");
  let raf = 0,
    timer = 0,
    excited = 0,
    ready = false,
    index = 0;
  const reduced = () =>
    matchMedia("(prefers-reduced-motion:reduce)").matches ||
    document.body.classList.contains("reduce-motion");
  const lines = [
    "Cinco lugares precisam do nosso cuidado.",
    "Escolha uma região. Vamos juntos!",
    "Cada cristal guarda um cuidado especial.",
  ];
  function say() {
    speech.textContent = "Flora: " + lines[index++ % lines.length];
    speech.hidden = false;
    excited = performance.now() + 1500;
    clearTimeout(timer);
    timer = setTimeout(() => (speech.hidden = true), 4300);
  }
  function tick(t) {
    raf = 0;
    if (document.hidden || !ready) return;
    GuardiaoAtores.flora(canvas, t / 1000, reduced(), t < excited);
    raf = requestAnimationFrame(tick);
  }
  GuardiaoAtores.load(["flora"])
    .then(() => {
      ready = true;
      raf = requestAnimationFrame(tick);
      document.body.dataset.floraMapReady = "true";
    })
    .catch(() => {
      button.hidden = true;
    });
  button.addEventListener("click", say);
  document.addEventListener("visibilitychange", () => {
    cancelAnimationFrame(raf);
    if (!document.hidden && ready) raf = requestAnimationFrame(tick);
  });
  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(raf);
    clearTimeout(timer);
  });
  window.addEventListener("pageshow", () => {
    if (ready && !raf) raf = requestAnimationFrame(tick);
  });
})();
