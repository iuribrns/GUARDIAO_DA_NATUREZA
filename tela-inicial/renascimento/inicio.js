"use strict";
(() => {
  const bank = window.GuardiaoAtores,
    kai = document.getElementById("home-kai"),
    flora = document.getElementById("home-flora"),
    speech = document.querySelector(".camp-speech");
  const reduced = () =>
    matchMedia("(prefers-reduced-motion:reduce)").matches ||
    document.body.classList.contains("reduce-motion");
  let ready = false,
    raf = 0,
    kaiReact = 0,
    floraReact = 0,
    timer = null,
    count = { kai: 0, flora: 0 };
  const lines = {
    kai: [
      "Kai: Vamos devolver a vida à floresta!",
      "Kai: Cada pequeno cuidado faz diferença.",
      "Kai: Nossos amigos precisam da gente.",
    ],
    flora: [
      "Flora: Huu-huu! Eu vou com você!",
      "Flora: Vamos cuidar de cada pedacinho da ilha.",
      "Flora: Nosso colar vai guardar essas conquistas.",
    ],
  };
  function say(name) {
    speech.textContent = lines[name][count[name]++ % lines[name].length];
    speech.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => {
      speech.hidden = true;
    }, 4200);
  }
  document.querySelectorAll("[data-companion]").forEach((b) => {
    const react = () => {
      if (b.dataset.companion === "kai") kaiReact = performance.now() + 950;
      else floraReact = performance.now() + 1600;
    };
    b.addEventListener("click", () => {
      say(b.dataset.companion);
      react();
    });
    b.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse") react();
    });
  });
  function frame(now) {
    raf = 0;
    if (!ready || document.hidden) return;
    const t = now / 1000,
      r = reduced();
    const c = kai.getContext("2d");
    c.clearRect(0, 0, kai.width, kai.height);
    c.save();
    if (!r)
      c.translate(
        0,
        Math.sin(t * 1.9) * 1.2 -
          (now < kaiReact
            ? Math.sin(((kaiReact - now) / 950) * Math.PI) * 7
            : 0),
      );
    const pose = !r && t % 4.8 > 4.62 ? 7 : 6;
    bank.fit(c, "kai", pose, kai.width, kai.height, [6, 7], 20);
    c.restore();
    kai.dataset.frame = String(pose);
    bank.flora(flora, t, r, now < floraReact);
    flora.dataset.mode = now < floraReact ? "voando" : "ombro";
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (ready && !raf && !document.hidden) raf = requestAnimationFrame(frame);
  }
  bank
    .load(["kai", "flora"])
    .then(() => {
      ready = true;
      document.body.dataset.menuCharactersReady = "true";
      start();
    })
    .catch(() => {
      document.body.dataset.menuCharactersReady = "unavailable";
    });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else start();
  });
  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(raf);
    raf = 0;
    clearTimeout(timer);
  });
  window.addEventListener("pageshow", start);
})();
