"use strict";
(() => {
  const base = new URL("./", document.currentScript.src);
  document.body.classList.add("encontros-natureza");
  const names = ["Carlos", "Antônio", "Marina", "Rafael", "Luciana", "Flora"];
  function together(parent, id) {
    let group = parent.querySelector(".encontro-dupla");
    if (group?.dataset.encontroPhase === String(id)) return;
    const d = GuardiaoEncontrosAtlas.scenes[id - 1];
    if (!d) return;
    const next = document.createElement("div");
    next.className = "encontro-dupla";
    next.dataset.encontroPhase = String(id);
    next.dataset.facing = "kai-direita-aliado-esquerda";
    next.setAttribute("role", "img");
    next.setAttribute(
      "aria-label",
      `Kai e ${names[id - 1]} se olham e conversam sobre os cuidados da fase`,
    );
    for (const [kind, src] of [
      ["olhar", d.normal],
      ["piscada", d.blink],
    ]) {
      const image = new Image(d.width, d.height);
      image.alt = "";
      image.className = "encontro-" + kind;
      image.src = new URL(src, base).href;
      image.decoding = "async";
      next.append(image);
    }
    parent.classList.remove("has-encontro");
    if (group) group.replaceWith(next);
    else parent.prepend(next);
    Promise.all([...next.children].map((image) => image.decode()))
      .then(() => {
        if (next.parentElement === parent) {
          parent.classList.add("has-encontro");
          document.body.dataset.encontroReady = "true";
        }
      })
      .catch(() => {
        next.hidden = true;
      });
  }
  const panel = document.getElementById("phase-dialog");
  if (panel) {
    const meeting = document.getElementById("phase-meeting");
    const sync = () => {
      together(meeting, Number(panel.dataset.briefPhase || 1));
      for (const figure of meeting.querySelectorAll(".meeting-kai")) {
        const label = figure.querySelector("span");
        if (label && !label.querySelector("small")) {
          const role = document.createElement("small");
          role.className = "brief-profession";
          role.textContent = figure.classList.contains("meeting-mascot")
            ? "Companheira de aventura"
            : "Guardião da natureza";
          label.append(role);
        }
      }
    };
    new MutationObserver(sync).observe(meeting, { childList: true });
    new MutationObserver(sync).observe(document.getElementById("phase-title"), {
      childList: true,
    });
    sync();
    for (const button of document.querySelectorAll(".map-hotspot")) {
      if (!button.querySelector(".placa-folhas")) {
        const leaves = document.createElement("span");
        leaves.className = "placa-folhas";
        leaves.setAttribute("aria-hidden", "true");
        button.prepend(leaves);
      }
    }
    // O controlador recria as placas ao mudar o progresso.
    new MutationObserver(() => {
      for (const button of document.querySelectorAll(".map-hotspot"))
        if (!button.querySelector(".placa-folhas")) {
          const leaves = document.createElement("span");
          leaves.className = "placa-folhas";
          leaves.setAttribute("aria-hidden", "true");
          button.prepend(leaves);
        }
    }).observe(document.getElementById("map-regions"), { childList: true });
  }
  const amulet = document.querySelector(".necklace-sprite");
  if (amulet) amulet.innerHTML = GuardiaoRelicario.necklace([1, 2, 3, 4, 5]);
  const observed = new WeakSet();
  function watchPack() {
    const pack = document.getElementById("mochila-jornada");
    if (!pack || observed.has(pack)) return;
    observed.add(pack);
    const refresh = () => {
      const old = pack.querySelector(
        ".pack-amulet > svg:not([data-relicario])",
      );
      if (old)
        old.outerHTML = GuardiaoRelicario.necklace(GuardiaoMemoria.obtained());
    };
    new MutationObserver(refresh).observe(pack, {
      childList: true,
      subtree: true,
    });
    refresh();
  }
  new MutationObserver(watchPack).observe(document.body, { childList: true });
  watchPack();
  if (!window.GuardiaoGameUI) return;
  class GameUI extends window.GuardiaoGameUI {
    constructor(options) {
      super(options);
      const root = document.getElementById(
        options.phase === 1 ? "conversa" : "intro",
      );
      together(root.querySelector(".conversation-art"), options.phase);
    }
  }
  window.GuardiaoGameUI = GameUI;
})();
