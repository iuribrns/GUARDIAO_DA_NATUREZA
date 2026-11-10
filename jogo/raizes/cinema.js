"use strict";
(() => {
  const A = RaizesPersonagens,
    R = Raizes,
    $ = (id) => document.getElementById(id),
    images = {};
  let running = false,
    raf = 0,
    startTime = 0,
    current = 0,
    loaded,
    finished = false;
  const clamp = (v) => Math.max(0, Math.min(1, v)),
    ease = (v) => {
      v = clamp(v);
      return v * v * (3 - 2 * v);
    },
    mix = (a, b, t) => a + (b - a) * t;
  async function load() {
    if (!loaded)
      loaded = Promise.all([
        A.load(),
        ...["mapa-cinzas", "mapa-vivo"].map(async (name) => {
          const im = new Image();
          im.src = new URL("assets/" + name + ".webp", R.base);
          await im.decode();
          images[name] = im;
        }),
      ]);
    return loaded;
  }
  function paint(seconds) {
    current = seconds;
    const canvas = $("guardian-cinema");
    if (!canvas || !images["mapa-cinzas"]) return;
    A.canvas(canvas, (ctx, w, h) => {
      const ash = images["mapa-cinzas"],
        green = images["mapa-vivo"];
      const zoom =
        seconds < 9
          ? mix(1.03, 2.25, ease(seconds / 9))
          : seconds < 21
            ? 2.25
            : mix(2.25, 1.18, ease((seconds - 21) / 8));
      const scale = Math.max(w / ash.width, h / ash.height) * zoom,
        cx = ash.width * 0.51,
        cy =
          ash.height *
          (seconds < 9 ? mix(0.51, 0.48, ease(seconds / 9)) : 0.48),
        ox = w / 2 - cx * scale,
        oy = h / 2 - cy * scale;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(scale, scale);
      ctx.drawImage(ash, 0, 0);
      if (seconds > 11) {
        const amount = ease((seconds - 11) / 11),
          radius = Math.hypot(ash.width, ash.height) * amount;
        ctx.save();
        ctx.beginPath();
        ctx.arc(ash.width * 0.51, ash.height * 0.43, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(green, 0, 0);
        ctx.restore();
        if (seconds < 22) {
          ctx.strokeStyle = "#ffe5a0";
          ctx.lineWidth = 5 / scale;
          ctx.globalAlpha = Math.sin(amount * Math.PI) * 0.7;
          ctx.beginPath();
          ctx.arc(ash.width * 0.51, ash.height * 0.43, radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
      const travel = ease(seconds / 8),
        x = mix(ash.width * 0.67, ash.width * 0.51, travel),
        y = mix(ash.height * 0.82, ash.height * 0.59, travel),
        hh = ash.height * 0.073;
      ctx.fillStyle = "#1b423a44";
      ctx.beginPath();
      ctx.ellipse(x, y, hh * 0.28, hh * 0.075, 0, 0, Math.PI * 2);
      ctx.fill();
      if (seconds < 8)
        A.draw(ctx, "kai", 6 + (Math.floor(seconds * 7) % 2), x, y, hh);
      else if (seconds < 10) A.draw(ctx, "acoes", 1, x, y, hh);
      else if (seconds < 23) A.draw(ctx, "acoes", 5, x, y, hh);
      else A.draw(ctx, "acoes", 6, x, y + Math.sin(seconds * 4) * 1.5, hh);
      A.owl(
        ctx,
        x + hh * 0.45,
        y - hh * 0.8 + Math.sin(seconds * 3) * 4,
        hh * 0.39,
        seconds,
        seconds > 23 ? "festa" : "voo",
        seconds % 7 < 3.5,
      );
      if (seconds > 22) {
        const alpha = ease((seconds - 22) / 3);
        for (let i = 0; i < 5; i++) {
          const a = Math.PI * (0.24 + i * 0.135),
            xx = x + Math.cos(a) * hh * 2.2,
            yy = y + Math.sin(a) * hh * 0.8 + hh * 0.45;
          A.draw(ctx, "npcs", 5 + i, xx, yy, hh * 0.82, { alpha, flip: i > 2 });
        }
      }
      if (seconds > 9 && seconds < 27) {
        const opacity = clamp((seconds - 9) / 2) * clamp((27 - seconds) / 3);
        for (let i = 0; i < 36; i++) {
          const a = i * 2.399 + seconds * 0.3,
            r = 12 + (seconds - 9) * 4 + (i % 7) * 6,
            xx = x + Math.cos(a) * r,
            yy = y - hh * 0.8 + Math.sin(a) * r * 0.6;
          ctx.fillStyle = i % 2 ? "#ffe8a2" : "#d0ed98";
          ctx.globalAlpha = opacity * (0.4 + 0.4 * Math.sin(seconds * 3 + i));
          ctx.beginPath();
          ctx.arc(xx, yy, 1.5 + (i % 3) * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    });
    syncText(seconds);
  }
  function syncText(seconds) {
    current = seconds;
    const line =
      seconds < 8
        ? "Kai e Flora seguem até o coração da ilha."
        : seconds < 11
          ? "Cinco cristais. Tudo o que aprenderam juntos."
          : seconds < 22
            ? "Cada cuidado devolve força à Árvore Guardiã."
            : "A natureza floresce quando cuidamos juntos.";
    $("ending-line").textContent = line;
    $("ending-title").textContent =
      seconds < 11
        ? "O coração da ilha"
        : seconds < 22
          ? "A vida encontra seu caminho."
          : "Um novo amanhecer.";
    $("final-credits").hidden = seconds < 30;
    if (seconds >= 30 && !finished) {
      finished = true;
      try {
        localStorage.setItem("guardiao.raizes.final.v1", "visto");
      } catch {}
      document.body.dataset.endingState = "concluido";
    }
  }
  function tick(now) {
    raf = 0;
    if (!running) return;
    if (document.hidden || window.GuardiaoOrientacao?.blocked) {
      startTime = now - current * 1000;
      raf = requestAnimationFrame(tick);
      return;
    }
    const video = $("guardian-video");
    if (video && !video.hidden) {
      syncText(video.ended ? 33 : video.currentTime);
    } else paint(Math.min(33, (now - startTime) / 1000));
    if (current < 33) raf = requestAnimationFrame(tick);
  }
  async function start() {
    if (!R.won()) return;
    finished = false;
    running = true;
    current = 0;
    document.body.dataset.endingState = "cinema";
    const reduced =
      R.prefs().reduceMotion ||
      matchMedia("(prefers-reduced-motion:reduce)").matches;
    if (reduced) {
      await load();
      $("guardian-video").hidden = true;
      paint(32);
      return;
    }
    const video = $("guardian-video");
    video.hidden = false;
    video.src = new URL("assets/arvore-guardia.mp4", R.base);
    video.currentTime = 0;
    try {
      await video.play();
    } catch {
      video.hidden = true;
      await load();
    }
    startTime = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    running = false;
    $("guardian-video")?.pause();
    cancelAnimationFrame(raf);
    raf = 0;
  }
  document.addEventListener("DOMContentLoaded", () => {
    $("ending-skip").onclick = async () => {
      stop();
      await load();
      $("guardian-video").hidden = true;
      paint(32);
    };
  });
  window.RaizesCinema = {
    load,
    start,
    stop,
    frame: paint,
    state: () => ({ time: current, running, finished }),
  };
})();
