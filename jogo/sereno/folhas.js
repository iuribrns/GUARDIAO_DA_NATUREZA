"use strict";
(() => {
  const A = BrisaArte,
    particles = Array.from({ length: 24 }, (_, i) => ({
      x: ((i * 317 + 53) % 997) / 997,
      y: ((i * 127 + 41) % 541) / 541,
      size: 24 + (i % 5) * 3,
      speed: 0.07 + (i % 4) * 0.012,
      spin: i * 1.7,
      frame: i % 3,
    }));
  let canvas,
    raf = 0,
    last = 0,
    previous = 0,
    time = 0,
    active = false,
    ready = false,
    burstCount = 0;
  const bursts = [],
    lastBurst = new WeakMap();
  function burst(target) {
    if (!ready || A.reduced() || Raizes.prefs().fallingLeaves === false) return;
    const now = performance.now();
    if (now - (lastBurst.get(target) ?? -Infinity) < 900) return;
    lastBurst.set(target, now);
    const r = target.getBoundingClientRect();
    for (let i = 0; i < 4; i++)
      bursts.push({
        x: r.x + r.width * (0.18 + i * 0.2),
        y: r.y + r.height * 0.15,
        vx: (i % 2 ? 1 : -1) * (24 + i * 5),
        vy: -35 - (i % 4) * 18,
        age: 0,
        ttl: 1.25 + (i % 3) * 0.15,
        size: 20 + (i % 3) * 3,
        frame: i === 3 ? 4 : i,
        spin: i,
      });
    burstCount++;
    if (bursts.length > 8) bursts.splice(0, bursts.length - 8);
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - last < 24 || document.hidden) return;
    last = now;
    const dt = Math.min(0.05, previous ? (now - previous) / 1000 : 0);
    previous = now;
    active =
      ready &&
      document.body.dataset.view === "inicio" &&
      Raizes.prefs().fallingLeaves !== false &&
      !A.reduced() &&
      !document.querySelector("dialog[open]");
    canvas.hidden = !active;
    if (!active) {
      bursts.length = 0;
      return;
    }
    time += dt;
    VivaArt.canvas(canvas, (c, w, h) => {
      const count =
        Raizes.prefs().graphicsQuality === "leve" ? 10 : w < 900 ? 18 : 24;
      const safe = [
        ...document.querySelectorAll(".game-logo,.menu-float-content"),
      ].map((e) => e.getBoundingClientRect());
      for (let i = 0; i < count; i++) {
        const p = particles[i];
        p.y += p.speed * dt;
        if (p.y > 1.12) {
          p.y = -0.13;
          p.x = (p.x + 0.37) % 1;
        }
        const xx = (p.x + Math.sin(time * 0.5 + i) * 0.055) * w,
          yy = p.y * h;
        const behindText = safe.some(
          (r) =>
            xx > r.left - 10 &&
            xx < r.right + 10 &&
            yy > r.top - 10 &&
            yy < r.bottom + 10,
        );
        A.draw(
          c,
          "botanica",
          p.frame,
          (p.x + Math.sin(time * 0.5 + i) * 0.055) * w,
          p.y * h,
          p.size * (w < 700 ? 0.8 : 1),
          {
            angle: p.spin + time * (i % 2 ? 0.5 : -0.42),
            alpha:
              (0.8 + (i % 2) * 0.1) *
              (behindText
                ? 0.24
                : xx > w * 0.72 && yy > h * 0.2 && yy < h * 0.9
                  ? 0.48
                  : 1),
            squeeze: 0.62 + Math.abs(Math.cos(time * 0.8 + i)) * 0.38,
          },
        );
      }
      for (let i = bursts.length - 1; i >= 0; i--) {
        const p = bursts[i];
        p.age += dt;
        if (p.age >= p.ttl) {
          bursts.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.vy += 75 * dt;
        p.y += p.vy * dt;
        A.draw(c, "botanica", p.frame, p.x, p.y, p.size, {
          angle: p.spin + p.age * 0.8,
          alpha: Math.max(0, Math.min(1, (p.ttl - p.age) * 2)),
        });
      }
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    canvas = document.createElement("canvas");
    canvas.id = "falling-leaves";
    canvas.setAttribute("aria-hidden", "true");
    document.body.append(canvas);
    A.load("botanica").then(() => {
      ready = true;
      if (!raf) raf = requestAnimationFrame(frame);
    });
    for (const b of document.querySelectorAll(".home-menu a,.home-settings")) {
      b.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "touch") burst(b);
      });
      b.addEventListener("pointerdown", () => burst(b));
      b.addEventListener("focus", () => burst(b));
    }
    window.VivaFolhas = {
      canvas,
      state: () => ({
        active,
        time,
        count:
          Raizes.prefs().graphicsQuality === "leve"
            ? 10
            : innerWidth < 900
              ? 18
              : 24,
        continuousFrames: [0, 1, 2],
        maxBurst: 8,
        burstCount,
        burstParticles: bursts.length,
      }),
      burst,
    };
    window.addEventListener("pagehide", () => {
      cancelAnimationFrame(raf);
      raf = 0;
      previous = 0;
    });
    window.addEventListener("pageshow", () => {
      if (ready && !raf) raf = requestAnimationFrame(frame);
    });
  });
})();
