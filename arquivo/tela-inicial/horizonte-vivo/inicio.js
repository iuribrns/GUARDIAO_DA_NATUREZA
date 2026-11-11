"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    d = GuardiaoHorizonteAtlas,
    pair = new Image(),
    fire = new Image(),
    canvas = document.getElementById("horizon-duo"),
    c = canvas.getContext("2d"),
    back = document.getElementById("horizon-fire"),
    bc = back.getContext("2d"),
    speech = document.querySelector(".camp-speech"),
    fd = GuardiaoVidaAtlas.fogo;
  let ready = false,
    raf = 0,
    timer = 0,
    reactUntil = 0,
    reactPerson = "kai",
    count = { kai: 0, flora: 0 };
  const reduced = () =>
    matchMedia("(prefers-reduced-motion:reduce)").matches ||
    document.body.classList.contains("reduce-motion");
  const frames = d.frames,
    l = Math.min(...frames.map((f) => f.bounds[0] - f.pivot[0])),
    t = Math.min(...frames.map((f) => f.bounds[1] - f.pivot[1])),
    r = Math.max(...frames.map((f) => f.bounds[0] + f.bounds[2] - f.pivot[0])),
    bottom = Math.max(
      ...frames.map((f) => f.bounds[1] + f.bounds[3] - f.pivot[1]),
    ),
    k = Math.min(
      (canvas.width - 24) / (r - l),
      (canvas.height - 24) / (bottom - t),
    ),
    x = (canvas.width - (r - l) * k) / 2 - l * k,
    y = (canvas.height - (bottom - t) * k) / 2 - t * k;
  const lines = {
    kai: [
      "Kai: Vamos cuidar desse mundo juntos.",
      "Kai: A floresta precisa da nossa ajuda.",
    ],
    flora: [
      "Flora: Huu-huu! Eu vou com você!",
      "Flora: Nosso próximo cuidado começa ali.",
    ],
  };
  document.querySelectorAll("[data-companion]").forEach((b) => {
    const react = () => {
      reactUntil = performance.now() + 1100;
      reactPerson = b.dataset.companion;
    };
    b.addEventListener("click", () => {
      react();
      const name = b.dataset.companion;
      speech.textContent = lines[name][count[name]++ % lines[name].length];
      speech.hidden = false;
      clearTimeout(timer);
      timer = setTimeout(() => (speech.hidden = true), 4100);
    });
    b.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse") react();
    });
  });
  function draw(now) {
    raf = 0;
    if (!ready || document.hidden) return;
    const time = now / 1000,
      rr = reduced(),
      pose = rr
        ? 0
        : now < reactUntil
          ? reactPerson === "flora"
            ? 3
            : 2
          : time % 4.7 > 4.46
            ? 1
            : 0,
      f = d.frames[pose],
      b = f.bounds;
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.save();
    c.translate(x, y);
    if (!rr) c.scale(1, 1 + Math.sin(time * 1.8) * 0.002);
    c.drawImage(
      pair,
      ...b,
      (b[0] - f.pivot[0]) * k,
      (b[1] - f.pivot[1]) * k,
      b[2] * k,
      b[3] * k,
    );
    c.restore();
    canvas.dataset.frame = String(pose);
    canvas.dataset.flora = "ombro";
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    if (
      back.width !== Math.round(innerWidth * ratio) ||
      back.height !== Math.round(innerHeight * ratio)
    ) {
      back.width = Math.round(innerWidth * ratio);
      back.height = Math.round(innerHeight * ratio);
    }
    bc.setTransform(ratio, 0, 0, ratio, 0, 0);
    bc.clearRect(0, 0, innerWidth, innerHeight);
    const scale = Math.max(innerWidth / 1672, innerHeight / 941),
      position = innerWidth <= 700 ? 0.72 : 0.5,
      ox = (innerWidth - 1672 * scale) * position,
      oy = (innerHeight - 941 * scale) * 0.5;
    [
      [0.571, 0.618, 23],
      [0.589, 0.623, 28],
      [0.607, 0.625, 22],
      [0.774, 0.535, 19],
      [0.792, 0.534, 25],
      [0.806, 0.538, 18],
    ].forEach(([xx, yy, h], i) => {
      const q = rr ? 0 : (Math.floor(time * 11) + i) % fd.frames.length,
        f = fd.frames[q],
        b = f.bounds,
        kk = (h * scale) / fd.referenceHeight;
      bc.drawImage(
        fire,
        ...b,
        xx * 1672 * scale + ox + (b[0] - f.pivot[0]) * kk,
        yy * 941 * scale + oy + (b[1] - f.pivot[1]) * kk,
        b[2] * kk,
        b[3] * kk,
      );
    });
    back.dataset.frame = String(
      rr ? 0 : Math.floor(time * 11) % fd.frames.length,
    );
    raf = requestAnimationFrame(draw);
  }
  function start() {
    if (ready && !raf && !document.hidden) raf = requestAnimationFrame(draw);
  }
  pair.src = new URL(d.file, base).href;
  fire.src = new URL("../../jogo/vida-natural/assets/" + fd.file, base).href;
  Promise.all([pair.decode(), fire.decode()])
    .then(() => {
      ready = true;
      document.body.dataset.menuCharactersReady = "true";
      start();
    })
    .catch(() => (document.body.dataset.menuCharactersReady = "unavailable"));
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
})();
