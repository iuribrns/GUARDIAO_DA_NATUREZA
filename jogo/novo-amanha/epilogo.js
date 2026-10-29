"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    $ = (id) => document.getElementById(id),
    won = [1, 2, 3, 4, 5].every((n) =>
      GuardiaoProgresso.read().completed.includes(n),
    );
  if (!won) {
    $("ending-loading").hidden = true;
    $("ending-locked").hidden = false;
    document.body.dataset.endingState = "locked";
    return;
  }
  const bank = GuardiaoAtores,
    canvas = $("ending-actors"),
    ctx = canvas.getContext("2d"),
    roll = $("credit-roll"),
    credits = $("ending-credits"),
    pause = $("ending-pause"),
    geometry = GuardiaoColarGeometria,
    colors = ["#ff4739", "#39b9ed", "#e9b63c", "#6acb5e", "#b98bff"],
    images = new Map(),
    art = new GuardiaoAdventureArt(6);
  const chapters = [
    {
      id: "memorias",
      start: 0,
      end: 10,
      title: "Olhe o que cuidamos juntos!",
      line: "Cinco lugares. Muitas pequenas mudanças.",
    },
    {
      id: "reencontro",
      start: 10,
      end: 16,
      title: "Cada amigo fez parte.",
      line: "Carlos: Obrigado por cuidar junto, Kai!",
    },
    {
      id: "animais",
      start: 16,
      end: 23,
      title: "A vida encontra seu lugar.",
      line: "Marina: Os amigos voltaram a viver em segurança.",
    },
    {
      id: "comunidade",
      start: 23,
      end: 30,
      title: "A comunidade também floresceu.",
      line: "Luciana: Nossa cidade mudou com a ajuda de todos.",
    },
    {
      id: "amuleto",
      start: 30,
      end: 37,
      title: "Um compromisso para levar.",
      line: "O amuleto lembra cada cuidado. A vida renasce com tempo e colaboração.",
    },
    {
      id: "festa",
      start: 37,
      end: 46,
      title: "Um Novo Amanhã",
      line: "O mundo não precisa de um único herói. Precisa de pessoas dispostas a cuidar dele.",
    },
  ];
  const names = [
      "Floresta em Chamas",
      "Rio Poluído",
      "Resgate da Fauna",
      "Reflorestamento",
      "Cidade Sustentável",
    ],
    maps = ["floresta", "rio", "fauna", "plantio", "cidade"],
    party = [
      ["Carlos", 0],
      ["Antônio", 1],
      ["Marina", 2],
      ["Rafael", 3],
      ["Luciana", 4],
    ],
    npc = GuardiaoCampanhaAtlas.npcs,
    river = GuardiaoCampanhaAtlas["animais-rio"],
    cats = GuardiaoCampanhaAtlas["animais-fauna"],
    deer = GuardiaoFlorestaAtlas.sheets.cervo,
    redbird = GuardiaoFlorestaAtlas.sheets.passaro;
  const records = GuardiaoMemoria.read().phases;
  const reduced = () =>
      matchMedia("(prefers-reduced-motion:reduce)").matches ||
      document.body.classList.contains("reduce-motion"),
    ease = (n) => {
      n = Math.max(0, Math.min(1, n));
      return n * n * (3 - 2 * n);
    };
  let ready = false,
    raf = 0,
    time = 0,
    last = 0,
    paused = false,
    shown = false,
    chapterId = "",
    manualScene = reduced() ? 5 : 0,
    manualUntil = 0;
  function sheet(name, d, f, x, y, h) {
    const im = images.get(name),
      frame = d.frames[f % d.frames.length],
      b = frame.bounds,
      k = h / d.referenceHeight;
    if (!im) return;
    ctx.drawImage(
      im,
      ...b,
      x + (b[0] - frame.pivot[0]) * k,
      y + (b[1] - frame.pivot[1]) * k,
      b[2] * k,
      b[3] * k,
    );
  }
  function cover(im, w, h) {
    const k = Math.max(w / im.naturalWidth, h / im.naturalHeight);
    ctx.drawImage(
      im,
      (w - im.naturalWidth * k) / 2,
      (h - im.naturalHeight * k) / 2,
      im.naturalWidth * k,
      im.naturalHeight * k,
    );
  }
  function result(id) {
    const r = records[id],
      list = r?.objectives || [],
      count = list.filter((t) => ["done", "safe"].includes(t.status)).length;
    if (id === 1) return "O fogo foi apagado e os animais chegaram ao abrigo.";
    if (id === 2) return "Resíduos fora do rio. Peixes e tartaruga cuidados.";
    if (id === 3)
      return list.some((t) => t.speciesKey === "mico")
        ? "Mico-leão-dourado, aves e outros amigos protegidos."
        : "Os animais voltaram a lugares seguros.";
    if (id === 4) {
      const species = [
        ...new Set(list.map((t) => t.seedSpecies).filter(Boolean)),
      ];
      return species.length
        ? "Novas árvores: " + species.join(", ") + "."
        : "Árvores nativas e novos lares para as aves.";
    }
    return count
      ? count + " cuidados pela comunidade. Um lugar mais limpo e acolhedor."
      : "Reciclagem, energia limpa, jardins e colaboração.";
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
  function flowers(w, h, t) {
    for (let i = 0; i < 30; i++) {
      const a = i * 2.399,
        x = w * 0.5 + Math.cos(a) * w * (0.12 + (i % 6) * 0.032),
        y = h * 0.82 + Math.sin(a) * h * 0.1,
        grow = ease((t - i * 0.05) / 2);
      if (grow <= 0) continue;
      ctx.strokeStyle = "#7fa84e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - 12 * grow);
      ctx.stroke();
      ctx.fillStyle = i % 2 ? "#f1d58a" : "#f2b9b0";
      for (let j = 0; j < 5; j++) {
        ctx.beginPath();
        ctx.ellipse(
          x + Math.cos(j * 1.256) * 3 * grow,
          y - 12 * grow + Math.sin(j * 1.256) * 3 * grow,
          2.2 * grow,
          2.2 * grow,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
  }
  function field(w, h, chapter, t, r) {
    cover(images.get("field"), w, h);
    const phone = w / h < 0.8,
      short = !phone && h < 500,
      kh = Math.min(h * (phone ? 0.28 : 0.36), w * (phone ? 0.59 : 0.27)),
      cx = w * 0.5,
      cy = h * (phone ? 0.8 : 0.78) - (short ? 22 : 0),
      cheer = chapter.id === "festa",
      greeting = chapter.id === "reencontro";
    if (chapter.id === "amuleto") {
      ctx.save();
      ctx.globalAlpha = (1 - ease(t / 5)) * 0.65;
      ctx.fillStyle = "#ac8143";
      ctx.beginPath();
      ctx.ellipse(cx, h * 0.82, w * 0.3, h * 0.11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      flowers(w, h, t);
      if (!r) {
        ctx.save();
        ctx.globalAlpha = Math.sin(Math.PI * Math.min(1, t / 7)) * 0.5;
        ctx.strokeStyle = "#fff0ad";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(
          cx,
          cy - kh * 0.7,
          15 + w * 0.33 * ease(t / 6),
          10 + h * 0.13 * ease(t / 6),
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
        ctx.restore();
      }
    } else if (cheer) flowers(w, h, 4);
    const layout = phone
      ? [
          [0.17, 0.7, 0.19],
          [0.36, 0.57, 0.18],
          [0.7, 0.61, 0.18],
          [0.87, 0.76, 0.2],
          [0.18, 0.85, 0.2],
        ]
      : [
          [0.25, 0.77, 0.26],
          [0.37, 0.66, 0.22],
          [0.64, 0.68, 0.23],
          [0.78, 0.8, 0.27],
          [0.64, 0.86, 0.24],
        ];
    const actors = party.flatMap(([name, row], i) => {
      if (greeting && row === 0) return [];
      const [x, y, hh] = layout[i];
      return [
        {
          y: y * h,
          draw: () =>
            sheet(
              "npcs",
              npc,
              row * 3 + (cheer && !r ? 1 + (Math.floor(time * 2 + i) % 2) : 1),
              x * w,
              y * h -
                (short ? 22 : 0) -
                (cheer && !r ? Math.max(0, Math.sin(time * 4 + i)) * 3 : 0),
              Math.min(hh * h, w * (phone ? 0.36 : 0.15)),
            ),
        },
      ];
    });
    if (greeting) {
      actors.push({
        y: cy,
        draw: () =>
          art.draw(
            ctx,
            "reencontros",
            Math.min(5, Math.floor(t)),
            cx - w * 0.05,
            cy,
            kh * 0.85,
          ),
      });
      canvas.dataset.pose = "reencontro";
    } else {
      const pose =
        chapter.id === "amuleto" ? (t < 1.3 ? 3 : t < 5.8 ? 4 : 5) : 7;
      actors.push({
        y: cy,
        draw: () => {
          bank.draw(ctx, "colar", pose, cx, cy, kh);
          medallion(pose, cx, cy, kh);
        },
      });
      canvas.dataset.pose = String(pose);
    }
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());
    sheet(
      "cats",
      cats,
      2,
      w * 0.49,
      h * (phone ? 0.855 : 0.88) - (short ? 24 : 0),
      h * 0.052,
    );
    bank.draw(
      ctx,
      "flora",
      r ? 14 : Math.floor(time * 12) % 8,
      cx + kh * 0.33,
      cy - kh + (r ? 0 : Math.sin(time * 4) * 5),
      Math.max(35, kh * 0.26),
    );
    for (const [key, x, y] of [
      ["capivara", 0.39, 0.89],
      ["mico", 0.72, 0.89],
      ["tucano", 0.12, 0.53],
    ])
      art.animal(
        ctx,
        { speciesKey: key, status: "safe", position: {} },
        time,
        r,
        x * w,
        y * h - (short ? 24 : 0),
        phone ? h * 0.052 : h * 0.075,
      );
    if (cheer && !r)
      for (let i = 0; i < 20; i++) {
        const x = ((i * 137 + time * 22) % (w + 30)) - 15,
          y = h * (0.25 + ((time * 0.1 + i / 20) % 1) * 0.6);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(time + i);
        ctx.fillStyle = i % 2 ? "#c8d899" : "#f0d18a";
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    $("land-restored").style.setProperty(
      "--healed",
      cheer ? "155%" : ease(t / 7) * 155 + "%",
    );
  }
  function paint() {
    const r = reduced(),
      global = r ? chapters[manualScene].start + 2 : time,
      chapter = chapters.find((c) => global < c.end) || chapters[5],
      t = global - chapter.start,
      w = innerWidth,
      h = innerHeight,
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
    if (chapterId !== chapter.id) {
      chapterId = chapter.id;
      $("ending-title").textContent = chapter.title;
      $("ending-caption").textContent = chapter.line;
      $("epilogue-counter").textContent =
        chapters.indexOf(chapter) + 1 + " / 6";
      document.body.dataset.epilogueScene = chapter.id;
    }
    if (chapter.id === "memorias") {
      const i = Math.min(4, Math.floor(t / 2)),
        age = t % 2,
        blend = r ? 1 : ease((age - 0.35) / 1.1);
      cover(images.get("before-" + i), w, h);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w * blend, h);
      ctx.clip();
      cover(images.get("after-" + i), w, h);
      ctx.restore();
      $("ending-caption").textContent = names[i] + " · " + result(i + 1);
      canvas.dataset.pose = "memorias";
    } else if (chapter.id === "animais") {
      const waterScene = t < 2.4;
      cover(images.get(waterScene ? "after-1" : "after-2"), w, h);
      if (waterScene) {
        sheet(
          "river",
          river,
          12 + (r ? 0 : Math.floor(time * 5) % 4),
          w * 0.43,
          h * 0.68,
          h * 0.075,
        );
        sheet(
          "river",
          river,
          4 + (r ? 0 : Math.floor(time * 5) % 4),
          w * 0.65,
          h * 0.76,
          h * 0.085,
        );
      } else {
        for (const [key, x, y] of [
          ["mico", 0.3, 0.61],
          ["tucano", 0.7, 0.48],
          ["passaro", 0.5, 0.53],
          ["capivara", 0.63, 0.82],
        ])
          art.animal(
            ctx,
            { speciesKey: key, status: "safe", position: {} },
            time,
            r,
            w * x,
            h * y,
            h * (key === "capivara" ? 0.11 : 0.085),
          );
      }
      bank.draw(
        ctx,
        "flora",
        r ? 14 : Math.floor(time * 12) % 8,
        w * 0.4,
        h * 0.41,
        h * 0.08,
      );
      if (!waterScene) {
        sheet(
          "deer",
          deer,
          r ? 3 : 4 + (Math.floor(time * 4) % 4),
          w * 0.82,
          h * 0.86,
          h * 0.13,
        );
        sheet(
          "redbird",
          redbird,
          r ? 3 : 4 + (Math.floor(time * 4) % 4),
          w * 0.18,
          h * 0.46,
          h * 0.065,
        );
      }
      canvas.dataset.pose = "habitats";
    } else if (chapter.id === "comunidade") {
      cover(images.get("after-4"), w, h);
      const spots = [
        [0.22, 0.69],
        [0.62, 0.81],
        [0.5, 0.58],
        [0.83, 0.7],
      ];
      for (let i = 0; i < 4; i++) {
        const [x, y] = spots[i],
          moving = i === 2 && !r ? Math.sin(time * 0.55) * w * 0.15 : 0;
        art.draw(
          ctx,
          "moradores",
          i * 4 + 2 + (r ? 0 : Math.floor(time * 5) % 2),
          w * x + moving,
          h * y,
          Math.min(h * 0.17, w * 0.23),
        );
      }
      if (images.get("icons"))
        GuardiaoIcones.paint(
          ctx,
          images.get("icons"),
          "bus",
          w * (0.4 + (r ? 0 : Math.sin(time * 0.3) * 0.15)),
          h * 0.85,
          Math.min(80, w * 0.22),
        );
      canvas.dataset.pose = "comunidade";
    } else field(w, h, chapter, t, r);
    $("ending-necklace").classList.toggle(
      "visible",
      ["amuleto", "festa"].includes(chapter.id),
    );
    document.body.dataset.endingState =
      chapter.id === "festa"
        ? "celebrando"
        : chapter.id === "amuleto"
          ? "restaurando"
          : chapter.id;
    document.body.dataset.partyMembers = "5";
    if (!r && time > 46 && !shown) {
      shown = true;
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
    pause.textContent = paused ? "Continuar animação" : "Pausar animação";
    pause.setAttribute("aria-pressed", String(paused));
    document.body.dataset.endingPaused = String(paused);
  });
  $("ending-replay").addEventListener("click", () => {
    time = 0;
    manualScene = 0;
    last = 0;
    paused = false;
    shown = false;
    chapterId = "";
    pause.textContent = "Pausar animação";
    pause.setAttribute("aria-pressed", "false");
    document.body.dataset.endingPaused = "false";
    roll.scrollTop = 0;
    paint();
  });
  $("epilogue-next").addEventListener("click", () => {
    const i = chapters.findIndex((c) => c.id === chapterId),
      next = Math.min(5, i + 1);
    time = chapters[next].start;
    manualScene = next;
    last = 0;
    paint();
  });
  $("ending-open-credits").addEventListener("click", () => {
    shown = true;
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
  window.addEventListener("resize", () => {
    if (ready) paint();
  });
  async function image(name, src) {
    const im = new Image();
    im.src = new URL(src, base).href;
    await im.decode();
    images.set(name, im);
  }
  Promise.all([
    bank.load(["colar", "flora"]),
    art.load(),
    image("pendant", "../../jogo/colar-vivo/assets/colar-vazio.webp"),
    image("field", "../../tela-inicial/horizonte-vivo/assets/campo.webp"),
    image("npcs", "../../jogo/jornada/" + npc.file),
    image("river", "../../jogo/jornada/" + river.file),
    image("cats", "../../jogo/jornada/" + cats.file),
    image("deer", "../../jogo/floresta-viva/assets/" + deer.file),
    image("redbird", "../../jogo/floresta-viva/assets/" + redbird.file),
    GuardiaoIcones.load().then((im) => images.set("icons", im)),
    ...maps.flatMap((name, i) => [
      image("before-" + i, "../../jogo/renascimento/assets/" + name + ".webp"),
      image(
        "after-" + i,
        "../../jogo/vida-natural/assets/" + name + "-restaurado.webp",
      ),
    ]),
  ])
    .then(() => {
      necklace();
      $("ending-loading").hidden = true;
      $("ending").hidden = false;
      ready = true;
      paint();
      document.body.dataset.endingReady = "true";
      start();
    })
    .catch((e) => {
      console.error(e);
      $("ending-loading").textContent =
        "A história não carregou. Recarregue para tentar novamente.";
    });
  window.GuardiaoEpilogo = Object.freeze({
    estado: () => ({
      time,
      paused,
      chapter: chapterId,
      records: structuredClone(records),
    }),
    capitulos: () => chapters.map(({ id, title }) => ({ id, title })),
  });
})();
