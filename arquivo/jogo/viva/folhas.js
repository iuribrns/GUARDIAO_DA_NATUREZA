"use strict";
(() => {
  let leaves,
    raf = 0,
    last = 0,
    previous = 0,
    t = 0,
    active = true;
  const A = VivaArt;
  const particles = Array.from({ length: 16 }, (_, i) => ({
    x: ((i * 317) % 997) / 997,
    y: ((i * 127) % 541) / 541,
    s: 15 + (i % 5) * 4,
    spin: i * 1.7,
    speed: 0.035 + (i % 4) * 0.009,
  }));
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - last < 34 || document.hidden) return;
    last = now;
    const dt = Math.min(0.06, previous ? (now - previous) / 1000 : 0);
    previous = now;
    const p = Raizes.prefs();
    active =
      p.fallingLeaves !== false &&
      !document.body.classList.contains("reduce-motion") &&
      document.body.dataset.view === "inicio";
    leaves.hidden = !active;
    if (!active) return;
    t += dt;
    A.canvas(leaves, (c, w, h) => {
      const count = p.graphicsQuality === "leve" ? 6 : w < 900 ? 10 : 16;
      for (let i = 0; i < count; i++) {
        const a = particles[i];
        a.y += a.speed * dt;
        if (a.y > 1.12) {
          a.y = -0.1;
          a.x = (a.x + 0.37) % 1;
        }
        const x = (a.x + Math.sin(t * 0.45 + i) * 0.065) * w,
          y = a.y * h,
          angle = a.spin + t * (i % 2 ? 0.8 : -0.65);
        c.save();
        c.translate(x, y);
        c.rotate(angle);
        c.scale(0.45 + Math.abs(Math.cos(t * 1.1 + i)) * 0.55, 1);
        c.globalAlpha = 0.66 + (i % 3) * 0.1;
        A.draw(c, "folhas", i % 8, 0, a.s / 2, a.s);
        c.restore();
      }
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    leaves = document.createElement("canvas");
    leaves.id = "falling-leaves";
    leaves.setAttribute("aria-hidden", "true");
    document.body.append(leaves);
    A.load(["folhas"]).then(() => {
      raf = requestAnimationFrame(frame);
    });
    window.VivaFolhas = {
      state: () => ({ time: t, active, count: particles.length }),
      canvas: leaves,
    };
    window.addEventListener("pagehide", () => {
      cancelAnimationFrame(raf);
      raf = 0;
    });
    window.addEventListener("pageshow", () => {
      if (!raf) raf = requestAnimationFrame(frame);
    });
  });
})();
