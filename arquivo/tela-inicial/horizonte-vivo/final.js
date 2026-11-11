"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    $ = (id) => document.getElementById(id),
    all = [1, 2, 3, 4, 5].every((id) =>
      GuardiaoProgresso.read().completed.includes(id),
    );
  if (!all) {
    $("ending-loading").hidden = true;
    $("ending-locked").hidden = false;
    document.body.dataset.endingState = "locked";
    return;
  }
  const bank = GuardiaoAtores,
    canvas = $("ending-actors"),
    ctx = canvas.getContext("2d"),
    roll = $("credit-roll"),
    pause = $("ending-pause"),
    credits = $("ending-credits"),
    geometry = GuardiaoColarGeometria,
    colors = ["#ff4739", "#39b9ed", "#e9b63c", "#6acb5e", "#b98bff"],
    images = new Map();
  const reduced = () =>
      matchMedia("(prefers-reduced-motion:reduce)").matches ||
      document.body.classList.contains("reduce-motion"),
    ease = (n) => {
      n = Math.max(0, Math.min(1, n));
      return n * n * (3 - 2 * n);
    };
  let ready = false,
    raf = 0,
    last = 0,
    time = 0,
    paused = false,
    caption = -1,
    creditsShown = false,
    manualUntil = 0;
  const sheets = {
    npcs: { ...GuardiaoCampanhaAtlas.npcs, folder: "../../jogo/jornada/" },
    ...Object.fromEntries(
      ["capivara", "cervo", "passaro", "natureza"].map((name) => [
        name,
        {
          ...GuardiaoFlorestaAtlas.sheets[name],
          folder: "../../jogo/floresta-viva/assets/",
        },
      ]),
    ),
  };
  const party = [
    ["Carlos", 0],
    ["Antônio", 1],
    ["Marina", 2],
    ["Rafael", 3],
    ["Luciana", 4],
  ];
  function sprite(name, frame, x, y, h) {
    const d = sheets[name],
      im = images.get(name),
      f = d.frames[frame % d.frames.length],
      b = f.bounds,
      k = h / d.referenceHeight;
    ctx.drawImage(
      im,
      ...b,
      x + (b[0] - f.pivot[0]) * k,
      y + (b[1] - f.pivot[1]) * k,
      b[2] * k,
      b[3] * k,
    );
  }
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
  const pendantPaths = geometry.gems.map((g) => new Path2D(g.path));
  const pendantBox = geometry.gems.reduce(
    (b, g) => [
      Math.min(b[0], g.bounds[0] - 35),
      Math.min(b[1], g.bounds[1] - 70),
      Math.max(b[2], g.bounds[0] + g.bounds[2] + 35),
      Math.max(b[3], g.bounds[1] + g.bounds[3] + 35),
    ],
    [Infinity, Infinity, 0, 0],
  );
  function medallion(frame, x, y, h) {
    const d = bank.spec("colar"),
      f = d.frames[frame],
      anchor = d.pendants?.[frame];
    if (!anchor) return;
    const k = h / d.referenceHeight,
      box = pendantBox,
      size = h * 0.145;
    ctx.save();
    ctx.translate(
      x + (anchor[0] - f.pivot[0]) * k,
      y + (anchor[1] - f.pivot[1]) * k,
    );
    ctx.scale(size / (box[3] - box[1]), size / (box[3] - box[1]));
    ctx.translate(-(box[0] + box[2]) / 2, -(box[1] + box[3]) / 2);
    ctx.beginPath();
    ctx.rect(box[0], box[1], box[2] - box[0], box[3] - box[1]);
    ctx.clip();
    ctx.drawImage(images.get("pendant"), 0, 0);
    geometry.gems.forEach((g, i) => {
      const [xx, yy, ww, hh] = g.bounds,
        gradient = ctx.createLinearGradient(xx, yy, xx + ww, yy + hh);
      gradient.addColorStop(0, g.light);
      gradient.addColorStop(0.5, colors[i]);
      gradient.addColorStop(1, g.dark);
      ctx.fillStyle = gradient;
      ctx.fill(pendantPaths[i]);
    });
    ctx.restore();
  }
  function paint() {
    const r = reduced(),
      t = r ? 15 : time,
      w = innerWidth,
      h = innerHeight,
      phone = w / h < 0.8,
      dpi = Math.min(devicePixelRatio || 1, 1.5);
    if (
      canvas.width !== Math.round(w * dpi) ||
      canvas.height !== Math.round(h * dpi)
    ) {
      canvas.width = Math.round(w * dpi);
      canvas.height = Math.round(h * dpi);
    }
    ctx.setTransform(dpi, 0, 0, dpi, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!phone && h <= 500) ctx.translate(0, -22);
    const heal = ease((t - 3) / 7),
      cx = w * 0.51,
      cy = h * (phone ? 0.81 : 0.79),
      kh = Math.min(h * (phone ? 0.29 : 0.38), w * (phone ? 0.6 : 0.28)),
      scale = Math.min(w / 1100, h / 700),
      celebrate = t > 10.5;
    // The last patch recovers outward from Kai; new shoots and flowers appear with the wave.
    ctx.save();
    ctx.globalAlpha = (1 - heal) * 0.85;
    ctx.fillStyle = "#9a733fc9";
    ctx.beginPath();
    ctx.ellipse(w * 0.51, h * 0.82, w * 0.32, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    for (let i = 0; i < 35; i++) {
      const angle = i * 2.399,
        rad = 0.13 + (i % 8) * 0.035,
        x = w * 0.51 + Math.cos(angle) * w * rad,
        y = h * 0.81 + Math.sin(angle) * h * 0.12,
        grow = ease((t - 3.3 - i * 0.07) / 2);
      if (grow > 0) {
        sprite(
          "natureza",
          i % 3 ? 2 : 6,
          x,
          y,
          (18 + (i % 3) * 6) * grow * scale,
        );
        if (i % 3 === 0) {
          ctx.fillStyle = i % 2 ? "#fff5bd" : "#efb6b5";
          for (let j = 0; j < 5; j++) {
            ctx.beginPath();
            ctx.ellipse(
              x + Math.cos(j * 1.256) * 4 * grow,
              y - 8 * grow + Math.sin(j * 1.256) * 4 * grow,
              2.4 * grow,
              2.4 * grow,
              0,
              0,
              Math.PI * 2,
            );
            ctx.fill();
          }
        }
      }
    }
    if (t > 2.5 && t < 11) {
      ctx.save();
      ctx.globalAlpha = Math.sin(Math.PI * ease((t - 2.5) / 8)) * 0.42;
      ctx.strokeStyle = "#fff6ac";
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.ellipse(
        cx,
        cy - kh * 0.75,
        Math.max(12, w * 0.32 * heal),
        Math.max(10, h * 0.17 * heal),
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.restore();
    }
    const layout = phone
      ? [
          [0.19, 0.73, 0.21],
          [0.37, 0.57, 0.18],
          [0.69, 0.62, 0.19],
          [0.86, 0.78, 0.21],
          [0.19, 0.86, 0.21],
        ]
      : [
          [0.27, 0.78, 0.27],
          [0.38, 0.67, 0.23],
          [0.65, 0.69, 0.24],
          [0.78, 0.81, 0.28],
          [0.64, 0.86, 0.25],
        ];
    const actors = party.map(([name, row], i) => {
      const [x, y, hh] = layout[i],
        jump =
          celebrate && !r ? Math.max(0, Math.sin(t * 4 + i)) * 4 * scale : 0;
      return {
        y: y * h,
        draw: () =>
          sprite(
            "npcs",
            row * 3 + (celebrate && !r ? 1 + (Math.floor(t * 2 + i) % 2) : 1),
            x * w,
            y * h - jump,
            Math.min(hh * h, w * (phone ? 0.37 : 0.15)),
          ),
      };
    });
    const pose = t < 2.5 ? 3 : t < 10.5 ? 4 : t < 12 ? 3 : 7;
    actors.push({
      y: cy,
      draw: () => {
        const jump =
          celebrate && !r ? Math.max(0, Math.sin(t * 4)) * 4 * scale : 0;
        bank.draw(ctx, "colar", pose, cx, cy - jump, kh);
        medallion(pose, cx, cy - jump, kh);
      },
    });
    const animals = phone
      ? [
          [0.41, 0.87, 65, "capivara"],
          [0.73, 0.875, 90, "cervo"],
          [0.12, 0.53, 46, "passaro"],
        ]
      : [
          [0.38, 0.89, 70, "capivara"],
          [0.75, 0.91, 105, "cervo"],
          [0.21, 0.72, 48, "passaro"],
        ];
    for (const [xx, yy, hh, name] of animals)
      actors.push({
        y: yy * h,
        draw: () =>
          sprite(
            name,
            r ? 4 : 4 + (Math.floor(t * 4) % 3),
            xx * w,
            yy * h,
            phone
              ? h *
                  (name === "cervo"
                    ? 0.09
                    : name === "capivara"
                      ? 0.065
                      : 0.045)
              : Math.min(hh * scale, h * 0.12),
          ),
      });
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());
    bank.draw(
      ctx,
      "flora",
      r ? 14 : Math.floor(t * 12) % 8,
      cx + kh * 0.33,
      cy - kh * 1.0 + (r ? 0 : Math.sin(t * 3) * 8 * scale),
      Math.max(36, kh * 0.26),
    );
    if (celebrate && !r)
      for (let i = 0; i < 18; i++) {
        const phase = (t * 0.11 + i / 18) % 1,
          x = ((i * 137 + t * 24) % (w + 50)) - 25,
          y = h * (0.3 + phase * 0.55);
        sprite("natureza", 4 + (i % 2), x, y, 8 * scale + 2);
      }
    document.body.dataset.endingState =
      t < 3 ? "colar" : t < 10.5 ? "restaurando" : "celebrando";
    document.body.dataset.partyMembers = String(party.length);
    canvas.dataset.pose = String(pose);
    $("land-restored").style.setProperty("--healed", String(heal * 155) + "%");
    $("ending-necklace").classList.toggle("visible", t > 2.5);
    const n = t < 3 ? 0 : t < 10.5 ? 1 : 2;
    if (n !== caption) {
      caption = n;
      $("ending-caption").textContent = [
        "Cinco cristais. Muitos amigos. Uma história de cuidado.",
        "Kai ergue o colar, e a vida volta a florescer.",
        "A ilha renasceu. Vamos comemorar juntos!",
      ][n];
    }
    if (t > 17 && !r && !creditsShown) {
      creditsShown = true;
      credits.showModal();
    }
  }
  function tick(now) {
    raf = 0;
    if (!ready || document.hidden) return;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (!paused && !reduced()) {
      time += dt;
      if (credits.open && performance.now() > manualUntil)
        roll.scrollTop = Math.min(
          roll.scrollHeight - roll.clientHeight,
          roll.scrollTop + dt * 17,
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
  });
  $("ending-replay").addEventListener("click", () => {
    time = 0;
    last = 0;
    caption = -1;
    paused = false;
    creditsShown = false;
    pause.textContent = "Pausar animação";
    pause.setAttribute("aria-pressed", "false");
    roll.scrollTop = 0;
    document.body.dataset.endingPaused = "false";
    paint();
  });
  $("ending-open-credits").addEventListener("click", () => {
    creditsShown = true;
    credits.showModal();
  });
  $("ending-close-credits").addEventListener("click", () => credits.close());
  for (const event of ["wheel", "pointerdown", "keydown"])
    roll.addEventListener(
      event,
      () => (manualUntil = performance.now() + 12000),
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
  Promise.all([
    bank.load(["colar", "flora"]),
    (() => {
      const im = new Image();
      im.src = new URL(
        "../../jogo/colar-vivo/assets/colar-vazio.webp",
        base,
      ).href;
      return im.decode().then(() => images.set("pendant", im));
    })(),
    ...Object.entries(sheets).map(async ([name, d]) => {
      const im = new Image();
      im.src = new URL(d.folder + d.file, base).href;
      await im.decode();
      images.set(name, im);
    }),
    (() => {
      const im = new Image();
      im.src = new URL("assets/campo.webp", base).href;
      return im.decode();
    })(),
  ])
    .then(() => {
      necklace();
      $("land-restored").style.backgroundImage =
        `url("${new URL("assets/campo.webp", base).href}")`;
      $("ending-loading").hidden = true;
      $("ending").hidden = false;
      ready = true;
      document.body.dataset.endingReady = "true";
      start();
    })
    .catch(() => {
      $("ending-loading").textContent =
        "A comemoração não carregou. Recarregue para tentar novamente.";
    });
})();
