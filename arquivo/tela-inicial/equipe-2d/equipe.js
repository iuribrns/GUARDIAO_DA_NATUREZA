"use strict";
(() => {
  const panel = document.getElementById("team"),
    portraits = [...panel.querySelectorAll("[data-person]")],
    flora = document.getElementById("team-flora"),
    gallery = document.getElementById("team-gallery"),
    speech = document.getElementById("team-greeting"),
    gestures = new Map();
  let raf = 0,
    loaded = false,
    pending = false,
    timer = 0;
  const reduced = () =>
    matchMedia("(prefers-reduced-motion:reduce)").matches ||
    document.body.classList.contains("reduce-motion");
  function tick(t) {
    raf = 0;
    if (!loaded || document.hidden || panel.hidden) return;
    const r = reduced();
    for (const c of portraits) {
      if (c.dataset.person === "peterson")
        GuardiaoAtores.portrait(c, "peterson", t / 1000, r);
      else {
        const gesture = gestures.get(c.dataset.person);
        GuardiaoEquipe2D.draw(
          c,
          c.dataset.person,
          t / 1000,
          r,
          gesture ? { kind: gesture.kind, age: (t - gesture.at) / 1000 } : null,
        );
      }
    }
    GuardiaoAtores.flora(flora, t / 1000, r, false);
    raf = requestAnimationFrame(tick);
  }
  async function start() {
    document.body.classList.toggle("team-open", !panel.hidden);
    if (panel.hidden || document.hidden) return;
    if (!loaded && !pending) {
      pending = true;
      try {
        await Promise.all([
          GuardiaoEquipe2D.load(),
          GuardiaoAtores.load(["equipe", "flora"]),
        ]);
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
  function greet(person, kind) {
    gestures.set(person, { kind, at: performance.now() });
    const names = { iuri: "Iuri", hicham: "Hicham" };
    speech.textContent =
      kind === "reference"
        ? "Rowlet e Decidueye são referências visuais da aventura."
        : names[person] + ": Que bom ter você nesta aventura!";
    speech.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => (speech.hidden = true), 3500);
  }
  panel.querySelectorAll("[data-greet]").forEach((b) => {
    b.addEventListener("click", () => greet(b.dataset.greet, "greeting"));
    b.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse")
        gestures.set(b.dataset.greet, {
          kind: "greeting",
          at: performance.now(),
        });
    });
  });
  panel
    .querySelectorAll("[data-reference-for]")
    .forEach((b) =>
      b.addEventListener("click", () =>
        greet(b.dataset.referenceFor, "reference"),
      ),
    );
  function syncGallery() {
    const amount = gallery.scrollWidth - gallery.clientWidth,
      left = gallery.scrollLeft;
    panel.querySelector(".team-gallery-controls").hidden = amount < 2;
    panel.querySelector('[data-team-scroll="previous"]').disabled = left < 2;
    panel.querySelector('[data-team-scroll="next"]').disabled =
      left >= amount - 2;
  }
  panel.querySelectorAll("[data-team-scroll]").forEach((b) =>
    b.addEventListener("click", () => {
      gallery.scrollBy({
        left:
          (b.dataset.teamScroll === "next" ? 1 : -1) *
          (gallery.clientWidth * 0.94),
        behavior: reduced() ? "instant" : "smooth",
      });
    }),
  );
  gallery.addEventListener("scroll", syncGallery, { passive: true });
  new ResizeObserver(syncGallery).observe(gallery);
  new MutationObserver(() => {
    if (panel.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
      clearTimeout(timer);
      speech.hidden = true;
      gestures.clear();
    }
    start();
    syncGallery();
  }).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
  document.addEventListener("visibilitychange", () => {
    cancelAnimationFrame(raf);
    raf = 0;
    start();
  });
  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(raf);
    raf = 0;
    clearTimeout(timer);
  });
  window.addEventListener("pageshow", start);
  start();
  syncGallery();
})();
