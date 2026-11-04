"use strict";
(() => {
  const panel = document.getElementById("team");
  if (!panel) return;
  const card = panel.querySelector(".professor-card");
  const portrait = card.querySelector('[data-person="peterson"]');
  const flora = document.getElementById("team-flora");
  const leaves = [...card.querySelectorAll(".profile-leaf")];
  const motion = matchMedia("(prefers-reduced-motion:reduce)");
  const reduced = () =>
    motion.matches || document.body.classList.contains("reduce-motion");
  let raf = 0,
    loading,
    ready = false,
    entrance;
  const active = () =>
    ready &&
    !panel.hidden &&
    !document.hidden &&
    !window.GuardiaoOrientacao?.blocked;
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
    if (window.gsap) {
      entrance?.kill();
      gsap.killTweensOf(leaves);
      gsap.set([card, ...leaves], { clearProps: "opacity,transform" });
    }
  }
  function tick(time) {
    raf = 0;
    if (!active()) return;
    GuardiaoAtores.portrait(portrait, "peterson", time / 1000, reduced());
    GuardiaoAtores.flora(flora, time / 1000, reduced(), false);
    if (!reduced()) raf = requestAnimationFrame(tick);
  }
  const observer = new IntersectionObserver(
    (entries) => {
      if (!active() || !entries.some((e) => e.isIntersecting)) return;
      observer.unobserve(card);
      if (window.gsap && !reduced())
        entrance = gsap.fromTo(
          card,
          { opacity: 0.65, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: "power2.out",
            clearProps: "opacity,transform",
          },
        );
    },
    { threshold: 0.15 },
  );
  async function start() {
    document.body.classList.toggle("team-open", !panel.hidden);
    if (panel.hidden || document.hidden || window.GuardiaoOrientacao?.blocked)
      return;
    try {
      loading ||= GuardiaoAtores.load(["equipe", "flora"]);
      await loading;
      ready = true;
      document.body.dataset.teamReady = "true";
      if (active() && !raf) {
        raf = requestAnimationFrame(tick);
        observer.observe(card);
      }
    } catch {
      panel.dataset.artError = "true";
    }
  }
  function breeze() {
    if (!active() || reduced() || !window.gsap) return;
    gsap.killTweensOf(leaves);
    gsap.fromTo(
      leaves,
      { rotation: -6 },
      {
        rotation: 7,
        duration: 0.4,
        stagger: 0.06,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut",
        clearProps: "transform",
      },
    );
  }
  card.addEventListener("pointerenter", (e) => {
    if (e.pointerType === "mouse") breeze();
  });
  card.addEventListener(
    "pointerdown",
    (e) => {
      if (e.pointerType !== "mouse") breeze();
    },
    { passive: true },
  );
  function refresh() {
    stop();
    start();
  }
  new MutationObserver(refresh).observe(panel, {
    attributes: true,
    attributeFilter: ["hidden"],
  });
  new MutationObserver(refresh).observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
  motion.addEventListener("change", refresh);
  document.addEventListener("visibilitychange", refresh);
  window.addEventListener("guardiao:orientacao", refresh);
  window.addEventListener("pagehide", () => {
    stop();
    observer.unobserve(card);
  });
  window.addEventListener("pageshow", start);
  start();
})();
