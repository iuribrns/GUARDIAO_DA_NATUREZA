"use strict";
(() => {
  const $ = (id) => document.getElementById(id),
    stage = document.querySelector(".map-stage"),
    world = document.querySelector(".map-world"),
    dialog = $("phase-dialog");
  const phases = window.GuardiaoFases,
    playable = window.GuardiaoFasesJogaveis,
    KEY = "guardiao.mapa.progresso.v1";
  const locations = [
      [77, 24],
      [82, 49],
      [76, 78],
      [27, 75],
      [25, 25],
      [50, 51],
    ],
    icons = ["fire", "water", "paw", "seeds", "recycle", "lock"];
  const paths = [
    "M580 25L910 25 949 165 849 190 730 160 609 137Z",
    "M630 150L868 170 970 260 965 315 847 301 727 239 642 207Z",
    "M607 300L904 307 939 429 822 491 627 472 563 397Z",
    "M65 240L358 248 449 386 422 497 211 482 66 402Z",
    "M80 45L359 25 398 149 317 194 117 183 44 132Z",
    "M401 142L570 136 641 258 582 327 429 323 355 252Z",
  ];
  let progress = window.GuardiaoProgresso.read(),
    selected = 1,
    busy = false,
    timer = null,
    finish = null,
    animating = 0;
  const unlocked = (id) => id === 1 || progress.completed.includes(id - 1),
    title = (p) =>
      p.nome
        .toLowerCase()
        .replace(/(^|\s)\S/g, (c) => c.toUpperCase())
        .replace(/\b(Em|Da|Do|De|Das|Dos)\b/g, (c) => c.toLowerCase());
  const reduced = () =>
    matchMedia("(prefers-reduced-motion:reduce)").matches ||
    document.body.classList.contains("reduce-motion");
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(progress));
    } catch {
      $("map-status").textContent = "Sua aventura continua nesta aba.";
    }
  };
  const caption = (id) =>
    progress.completed.includes(id)
      ? "Natureza recuperada"
      : !unlocked(id)
        ? "Complete a região anterior"
        : id === 6
          ? "Encontro final · em breve"
          : "Pronta para explorar";
  phases.forEach((p, i) => {
    for (const container of [$("map-regions"), $("phase-list")]) {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.phase = p.id;
      b.className = container.id === "map-regions" ? "map-hotspot" : "";
      b.style.setProperty("--x", locations[i][0] + "%");
      b.style.setProperty("--y", locations[i][1] + "%");
      b.setAttribute("aria-haspopup", "dialog");
      b.innerHTML = `<span class="number">${p.id}</span><span><strong>${title(p)}</strong><small data-phase-state></small></span>`;
      if (container.id === "phase-list") {
        const li = document.createElement("li");
        li.append(b);
        container.append(li);
      } else container.append(b);
    }
  });
  let svg =
    "<defs>" +
    paths
      .map(
        (p, i) => `<clipPath id="region-${i + 1}"><path d="${p}"/></clipPath>`,
      )
      .join("") +
    "</defs>";
  paths.forEach((p, i) => {
    svg += `<g clip-path="url(#region-${i + 1})"><image class="restored-image" data-healed="${i + 1}" width="1000" height="563" preserveAspectRatio="none"/></g><path class="region-growth" data-growth="${i + 1}" d="${p}"/>`;
  });
  svg +=
    '<path class="island-current" d="M605 145Q625 175 676 184T751 212Q800 221 846 251T948 288"/><path class="island-current" d="M500 285Q490 351 498 400T474 507"/>';
  [
    [100, 210],
    [550, 538],
    [950, 340],
    [70, 460],
    [866, 505],
  ].forEach(
    ([x, y], i) =>
      (svg += `<ellipse class="sea-wave" cx="${x}" cy="${y}" rx="18" ry="5" style="animation-delay:-${i * 0.7}s"/>`),
  );
  [
    [654, 87],
    [705, 116],
    [769, 75],
    [819, 117],
    [880, 91],
  ].forEach(
    ([x, y], i) =>
      (svg += `<g class="forest-fire"><path class="island-flame" d="M${x - 5} ${y}Q${x - 10} ${y - 8} ${x} ${y - 20}Q${x - 1} ${y - 10} ${x + 6} ${y - 11}Q${x + 13} ${y + 3} ${x - 5} ${y}" style="animation-delay:-${i * 0.13}s"/><circle class="island-smoke" cx="${x}" cy="${y - 17}" r="7" style="animation-delay:-${i * 0.65}s"/></g>`),
  );
  svg += '<ellipse class="portal-ring" cx="501" cy="221" rx="14" ry="25"/>';
  $("island-life").innerHTML = svg;
  const healthy = window.GuardiaoArte.url(
    new URL("../jornada-viva/assets/ilha-restaurada.png", location.href).href,
  );
  function render() {
    stage.dataset.currentPhase = progress.current;
    stage.classList.toggle(
      "is-restored",
      progress.completed.includes(1) && animating !== 1,
    );
    document.querySelectorAll("[data-phase]").forEach((b) => {
      const id = Number(b.dataset.phase);
      b.dataset.locked = String(!unlocked(id));
      b.classList.toggle("is-complete", progress.completed.includes(id));
      b.setAttribute(
        "aria-label",
        `Fase ${id}: ${title(phases[id - 1])}. ${caption(id)}.`,
      );
      b.toggleAttribute("aria-current", id === progress.current);
      if (id === progress.current) b.setAttribute("aria-current", "step");
      b.querySelector("[data-phase-state]").textContent = caption(id);
    });
    document.querySelectorAll("[data-healed]").forEach((im) => {
      const id = Number(im.dataset.healed),
        earned = progress.completed.includes(id);
      if (earned) im.setAttribute("href", healthy);
      im.classList.toggle("healed", earned && id !== animating);
    });
    document
      .querySelectorAll(".forest-fire")
      .forEach(
        (g) =>
          (g.style.display =
            progress.completed.includes(1) && animating !== 1 ? "none" : ""),
      );
    const [x, y] = locations[progress.current - 1];
    $("kai-marker").style.setProperty("--kai-x", x + "%");
    $("kai-marker").style.setProperty("--kai-y", y - 8 + "%");
    $("journey-current").textContent = title(phases[progress.current - 1]);
    $("journey-fragments").textContent =
      progress.completed.length + " / 5 fragmentos";
    document.dispatchEvent(
      new CustomEvent("guardiao:mapa-atualizado", { detail: { ...progress } }),
    );
  }
  function center() {
    const x = (locations[progress.current - 1][0] / 100) * world.clientWidth;
    stage.scrollTo({
      left: Math.max(0, x - stage.clientWidth / 2),
      behavior: reduced() ? "instant" : "smooth",
    });
  }
  function selectPhase(id) {
    if (!Number.isInteger(id) || !unlocked(id))
      throw new RangeError("Complete a região anterior primeiro.");
    if (busy) throw Error("Aguarde a transformação.");
    progress.current = id;
    save();
    render();
    return getProgress();
  }
  function npcArt(row) {
    const d = window.GuardiaoCampanhaAtlas.npcs,
      f = d.frames[row * 3 + 1],
      b = f.bounds,
      src = window.GuardiaoArte.url(
        new URL(
          "../../tela-inicial/mapa-interativo/assets/01_npcs_dialogo.png",
          location.href,
        ).href,
      );
    return `<svg viewBox="${b.join(" ")}" aria-hidden="true"><image href="${src}" width="${d.width}" height="${d.height}"/></svg>`;
  }
  function kaiArt() {
    const src = window.GuardiaoArte.url(
      new URL(
        "../../jogo/floresta-viva/revisao/assets/kai-repouso-suave.png",
        location.href,
      ).href,
    );
    return `<svg viewBox="135 446 283 425" aria-hidden="true"><image href="${src}" width="1774" height="887"/></svg>`;
  }
  function openPhase(id) {
    if (busy || !phases[id - 1]) return;
    selected = id;
    if (unlocked(id)) selectPhase(id);
    const p = phases[id - 1],
      d = playable[id];
    $("phase-number").textContent =
      id === 6 ? "UM PRÓXIMO ENCONTRO" : `DESTINO ${id} · JORNADA DE KAI`;
    $("phase-title").textContent = title(p);
    $("phase-npc").textContent = d?.npc || p.npc;
    $("phase-profession").textContent = d?.profession || p.profissao;
    $("phase-objective").textContent =
      id === 1
        ? "A floresta precisa de água e nossos amigos precisam de cuidado."
        : d?.subtitle || p.situacao;
    $("phase-symbol").innerHTML = window.GuardiaoIcones.markup(icons[id - 1]);
    $("phase-goals").replaceChildren(
      ...(id === 1
        ? [
            "Abra o registro e apague os oito focos.",
            "Ajude os três animais a chegar até Carlos.",
          ]
        : d
          ? d.goals.map(([, label, total]) => `${label}: ${total}.`)
          : ["O encontro final está sendo preparado."]
      ).map((t) => {
        const li = document.createElement("li");
        li.textContent = t;
        return li;
      }),
    );
    $("phase-equipment").textContent =
      d?.equipmentText ||
      (id === 1 ? "Mangueira e kit de resgate" : p.equipamento);
    $("phase-reward").textContent =
      id === 1
        ? "Fragmento vermelho"
        : d
          ? "Fragmento " + d.colorName
          : "O equilíbrio da natureza";
    const row = d?.npcRow || 0;
    $("phase-meeting").innerHTML =
      `<div class="meeting-npc">${npcArt(row)}<span>${d?.npc || p.npc}</span></div><div class="meeting-dialogue"><p>${id === 6 ? "Uma nova aventura vai chegar!" : id === 1 ? "Carlos: Pegue os equipamentos. Vamos cuidar da floresta!" : d.npc + ": " + d.intro[0].replace(/^.*?\! /, "")}</p><div>${(d?.equipment || ["water", "hand"]).map((icon) => window.GuardiaoIcones.markup(icon)).join("")}</div></div><div class="meeting-kai">${kaiArt()}<span>Kai</span></div>`;
    const start = dialog.querySelector("[data-map-action=start]");
    start.disabled = !unlocked(id) || id === 6;
    start.textContent =
      id === 6
        ? "Aventura em preparação"
        : !unlocked(id)
          ? "Complete a região anterior"
          : progress.completed.includes(id)
            ? "Revisitar esta região"
            : "Vamos cuidar!";
    $("phase-state").textContent = !unlocked(id)
      ? `Termine a fase ${id - 1} para visitar esta região.`
      : id === 6
        ? "Cinco fragmentos reunidos. O encontro final chega depois."
        : "Converse com seu aliado e receba os equipamentos antes de partir.";
    dialog.showModal();
  }
  function getProgress() {
    return {
      completedFirst: progress.completed.includes(1),
      current: progress.current,
      completed: [...progress.completed],
    };
  }
  function proof(id) {
    try {
      if (id === 1)
        return (
          JSON.parse(
            localStorage.getItem("guardiao.floresta-viva.v2") || "null",
          )?.completed === true
        );
      return (
        JSON.parse(
          localStorage.getItem("guardiao.jornada.fase." + id + ".v1") || "null",
        )?.completed === true
      );
    } catch {
      return false;
    }
  }
  async function restore(id) {
    if (!proof(id) || !progress.completed.includes(id))
      throw Error("Conclua a missão para recuperar esta região.");
    if (busy) throw Error("Aguarde a transformação.");
    busy = true;
    animating = id;
    stage.setAttribute("aria-busy", "true");
    if (dialog.open) dialog.close();
    try {
      const im = new Image();
      im.src = healthy;
      await im.decode();
      render();
      center();
      $("map-cutscene").hidden = false;
      $("cutscene-text").textContent = "Seu cuidado trouxe a vida de volta!";
      $("map-status").textContent = "A natureza está voltando…";
      if (!reduced())
        await new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        );
      document.querySelector(`[data-healed="${id}"]`).classList.add("healed");
      document
        .querySelector(`[data-growth="${id}"]`)
        .classList.add("restoring");
      await new Promise((r) => {
        finish = r;
        timer = setTimeout(r, reduced() ? 60 : 2700);
      });
      clearTimeout(timer);
      finish = null;
      animating = 0;
      delete progress.pendingRestoration;
      progress.current = Math.min(6, id + 1);
      save();
      render();
      center();
      $("map-cutscene").hidden = true;
      $("map-status").textContent =
        "Região recuperada! " +
        (id < 5
          ? "Uma nova missão espera por você."
          : "Você reuniu os cinco fragmentos!");
    } finally {
      busy = false;
      animating = 0;
      stage.removeAttribute("aria-busy");
      document
        .querySelector(`[data-growth="${id}"]`)
        ?.classList.remove("restoring");
      $("map-cutscene").hidden = true;
    }
    return getProgress();
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-phase]");
    if (b) {
      openPhase(Number(b.dataset.phase));
      return;
    }
    const a = e.target.closest("[data-map-action]")?.dataset.mapAction;
    if (a === "close") dialog.close();
    if (a === "start" && unlocked(selected) && selected <= 5)
      location.href =
        selected === 1
          ? "../../jogo/floresta-viva/index.html"
          : "../../jogo/jornada/index.html?fase=" + selected;
  });
  $("map-fit").addEventListener("click", center);
  $("skip-cutscene").addEventListener("click", () => finish?.());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.x ||
        e.clientX > r.right ||
        e.clientY < r.y ||
        e.clientY > r.bottom
      )
        dialog.close();
    }
  });
  window.GuardiaoPaineis = Object.freeze({
    abrir: (p) => openPhase(p.id),
    fechar: () => dialog.close(),
  });
  window.GuardiaoMapa = Object.freeze({
    obterProgresso: getProgress,
    selecionarFase: selectPhase,
    concluirFase: restore,
  });
  const destination = Number(
    new URLSearchParams(location.search).get("destino"),
  );
  const openDestination = () => {
    if (destination >= 1 && destination <= 6 && unlocked(destination))
      openPhase(destination);
  };
  render();
  if (progress.pendingRestoration && proof(progress.pendingRestoration))
    restore(progress.pendingRestoration)
      .then(openDestination)
      .catch(() => {});
  else {
    center();
    openDestination();
  }
  window.addEventListener("pagehide", () => {
    clearTimeout(timer);
    finish?.();
  });
})();
