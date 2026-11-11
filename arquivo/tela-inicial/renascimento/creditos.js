"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    $ = (id) => document.getElementById(id),
    earned = GuardiaoProgresso.read().completed,
    all = [1, 2, 3, 4, 5].every((id) => earned.includes(id));
  if (!all) {
    $("ending-loading").hidden = true;
    $("ending-locked").hidden = false;
    document.body.dataset.endingState = "locked";
    return;
  }
  const colors = ["#ff4739", "#39b9ed", "#e9b63c", "#6acb5e", "#b98bff"],
    geometry = GuardiaoColarGeometria,
    bank = GuardiaoAtores,
    canvas = $("ending-actors"),
    ctx = canvas.getContext("2d"),
    roll = $("credit-roll"),
    pause = $("ending-pause");
  const reduced = () =>
    matchMedia("(prefers-reduced-motion:reduce)").matches ||
    document.body.classList.contains("reduce-motion");
  let ready = false,
    raf = 0,
    last = 0,
    time = 0,
    paused = false,
    manualUntil = 0,
    caption = -1;
  const clamp = (n) => Math.max(0, Math.min(1, n)),
    ease = (n) => {
      n = clamp(n);
      return n * n * (3 - 2 * n);
    };
  function necklace() {
    const defs = geometry.gems
      .map(
        (g, i) =>
          `<linearGradient id="ending-gem-${i}" x2=".8" y2="1"><stop stop-color="${g.light}"/><stop offset=".5" stop-color="${colors[i]}"/><stop offset="1" stop-color="${g.dark}"/></linearGradient>`,
      )
      .join("");
    $("ending-necklace").innerHTML =
      `<svg viewBox="0 0 ${geometry.width} ${geometry.height}" aria-hidden="true"><defs>${defs}</defs><image href="${new URL("../../jogo/colar-vivo/assets/colar-vazio.webp", base).href}" width="${geometry.width}" height="${geometry.height}"/>${geometry.gems.map((g, i) => `<path data-ending-gem="${i + 1}" d="${g.path}" fill="url(#ending-gem-${i})"/>`).join("")}</svg>`;
  }
  function medallion(frame, x, y, h) {
    const d = bank.spec("colar"),
      f = d.frames[frame],
      a = d.pendants?.[frame];
    if (!a) return;
    const k = h / d.referenceHeight;
    ctx.save();
    ctx.translate(x + (a[0] - f.pivot[0]) * k, y + (a[1] - f.pivot[1]) * k);
    ctx.scale(h / 78, h / 78);
    ctx.fillStyle = "#ddb553";
    ctx.strokeStyle = "#6d481e";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.bezierCurveTo(6, -2, 4, 3, 0, 6);
    ctx.bezierCurveTo(-5, 2, -5, -2, 0, -5);
    ctx.fill();
    ctx.stroke();
    [
      [-1.6, -1.9],
      [-1.7, 1.3],
      [0, 3.2],
      [1.5, 1.1],
      [1.6, -1.7],
    ].forEach((p, i) => {
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.ellipse(...p, 1, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
  function paint() {
    const r = reduced(),
      t = r ? 15 : time,
      frame = t < 3 ? 3 : t < 7 ? 4 : t < 9 ? 5 : t < 10.5 ? 6 : 7;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const x = 465,
      y = 730,
      h = 565;
    bank.draw(ctx, "colar", frame, x, y - (r ? 0 : Math.sin(t * 2) * 2), h);
    medallion(frame, x, y - (r ? 0 : Math.sin(t * 2) * 2), h);
    const fx = 670 + (r ? 0 : Math.sin(t * 1.3) * 45),
      fy = 255 + (r ? 0 : Math.sin(t * 2.4) * 15);
    bank.draw(ctx, "flora", r ? 14 : Math.floor(t * 12) % 8, fx, fy, 170);
    if (t > 4) {
      ctx.save();
      const light = ease((t - 4) / 2) * (1 - ease((t - 13) / 3));
      ctx.globalAlpha = light;
      const g = ctx.createRadialGradient(x - 35, 290, 4, x - 35, 290, 210);
      g.addColorStop(0, "#fff7bd88");
      g.addColorStop(1, "#fff7bd00");
      ctx.fillStyle = g;
      ctx.fillRect(50, 50, 850, 750);
      ctx.strokeStyle = "#ffeba2";
      ctx.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6 + t * 0.15;
        ctx.beginPath();
        ctx.moveTo(430 + Math.cos(a) * 80, 290 + Math.sin(a) * 80);
        ctx.lineTo(430 + Math.cos(a) * 185, 290 + Math.sin(a) * 185);
        ctx.stroke();
      }
      ctx.restore();
    }
    const heal = ease((t - 4) / 6);
    $("land-restored").style.setProperty("--healed", heal * 155 + "%");
    $("ending-necklace").classList.toggle("visible", t > 2.5);
    $("ending").classList.toggle("is-celebrating", t > 9 && !r);
    document.body.dataset.endingState =
      t < 4 ? "colar" : t < 10 ? "restaurando" : "celebrando";
    canvas.dataset.pose = String(frame);
    const n = t < 4 ? 0 : t < 10 ? 1 : 2;
    if (n !== caption) {
      caption = n;
      $("ending-caption").textContent = [
        "O colar guarda cada gesto de carinho.",
        "Cinco cristais. Uma onda de vida pela floresta.",
        "Você trouxe a esperança de volta. Obrigado, Guardião!",
      ][n];
    }
  }
  function tick(now) {
    raf = 0;
    if (!ready || document.hidden) return;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (!paused && !reduced()) {
      time += dt;
      if (time > 5 && performance.now() > manualUntil)
        roll.scrollTop = Math.min(
          roll.scrollHeight - roll.clientHeight,
          roll.scrollTop + dt * 18,
        );
    }
    paint();
    raf = requestAnimationFrame(tick);
  }
  function start() {
    if (ready && !raf && !document.hidden) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  }
  pause.addEventListener("click", () => {
    paused = !paused;
    pause.setAttribute("aria-pressed", String(paused));
    pause.textContent = paused ? "Continuar animação" : "Pausar animação";
    document.body.dataset.endingPaused = String(paused);
    $("ending").classList.toggle("paused", paused);
  });
  $("ending-replay").addEventListener("click", () => {
    time = 0;
    last = 0;
    caption = -1;
    paused = false;
    pause.textContent = "Pausar animação";
    pause.setAttribute("aria-pressed", "false");
    document.body.dataset.endingPaused = "false";
    roll.scrollTop = 0;
    manualUntil = 0;
    $("ending").classList.remove("paused");
    paint();
  });
  for (const event of ["wheel", "pointerdown", "keydown"])
    roll.addEventListener(
      event,
      () => {
        manualUntil = performance.now() + 12000;
      },
      { passive: true },
    );
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
  async function load() {
    try {
      const paths = ["inicio-cinzas.webp", "inicio-curado.webp"];
      await Promise.all([
        bank.load(["colar", "flora"]),
        ...paths.map(async (path) => {
          const im = new Image();
          im.src = new URL("assets/" + path, base).href;
          await im.decode();
        }),
      ]);
      $("land-burned").style.backgroundImage =
        `url("${new URL("assets/inicio-cinzas.webp", base).href}")`;
      $("land-restored").style.backgroundImage =
        `url("${new URL("assets/inicio-curado.webp", base).href}")`;
      necklace();
      for (let i = 0; i < 16; i++) {
        const leaf = document.createElement("i");
        leaf.textContent = "❧";
        leaf.style.cssText = `--x:${i * 6}%;--time:${5 + (i % 4)}s;--delay:-${i * 0.6}s`;
        $("ending").querySelector(".ending-petals").append(leaf);
      }
      $("ending-loading").hidden = true;
      $("ending").hidden = false;
      ready = true;
      document.body.dataset.endingReady = "true";
      paint();
      start();
    } catch {
      $("ending-loading").textContent =
        "A celebração não carregou. Recarregue a página para tentar novamente.";
    }
  }
  load();
})();
