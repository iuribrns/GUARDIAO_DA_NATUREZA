"use strict";
(() => {
  const root = new URL("../../", document.currentScript.src);
  function groupPause() {
    const d = document.getElementById("menu-pausa");
    if (!d) return;
    const header = document.createElement("header");
    header.className = "pause-heading";
    const controls = d.querySelector(".control-mode");
    const nav = document.createElement("nav");
    nav.className = "pause-buttons";
    nav.setAttribute("aria-label", "Opções da pausa");
    for (const node of [...d.children]) {
      if (node === controls) continue;
      if (node.matches("button,a")) nav.append(node);
      else header.append(node);
    }
    d.append(header, controls, nav);
    d.querySelector("#recomecar").textContent = "Reiniciar fase";
    const settings = d.querySelector('a[href*="configuracoes"]');
    if (settings) settings.textContent = "Configurações";
  }
  window.GuardiaoEtiquetas = Object.freeze({
    position(x, y, w, view, width, height) {
      const { s, ox, oy } = view;
      let screenX = Math.max(
        8 + (w * s) / 2,
        Math.min(width - 8 - (w * s) / 2, x * s + ox),
      );
      let screenY = Math.max(22, Math.min(height - 10, y * s + oy));
      // As etiquetas do cenário também respeitam as áreas ocupadas pela HUD.
      const reserved = document.querySelectorAll(
        "#jogo .mission,#jogo .missions,#jogo .top-actions,#jogo .joystick,#jogo .actions,#jogo #ajuda,#jogo #jump-action",
      );
      for (let pass = 0; pass < 2; pass++)
        for (const element of reserved) {
          const r = element.getBoundingClientRect();
          if (!r.width || !r.height) continue;
          const left = screenX - (w * s) / 2,
            right = screenX + (w * s) / 2;
          if (
            left < r.right + 5 &&
            right > r.left - 5 &&
            screenY - 17 * s < r.bottom + 5 &&
            screenY + 6 * s > r.top - 5
          )
            screenY =
              r.top < height / 2
                ? Math.min(height - 10, r.bottom + 7 + 17 * s)
                : Math.max(22, r.top - 7 - 6 * s);
        }
      return {
        x: (screenX - ox) / s,
        y: (screenY - oy) / s,
      };
    },
  });
  groupPause();
  const phase = document.getElementById("phase-dialog");
  if (phase) {
    const footer = document.createElement("footer");
    footer.className = "phase-actions";
    footer.append(phase.querySelector("[data-map-action=start]"));
    phase.append(footer);
    // O SVG pode ter espaço de letterbox. Limitar só o viewport ainda exibia
    // botas e pés do quadro vizinho da prancha nesse espaço adicional.
    let clipNumber = 0;
    const meeting = document.getElementById("phase-meeting");
    const clipPortraits = () => {
      for (const svg of meeting.querySelectorAll(
        ".meeting-kai > svg,.meeting-npc > svg",
      )) {
        if (svg.dataset.frameClipped) continue;
        svg.dataset.frameClipped = "true";
        const frame = svg.viewBox.baseVal;
        const ns = "http://www.w3.org/2000/svg";
        const defs = document.createElementNS(ns, "defs");
        const clip = document.createElementNS(ns, "clipPath");
        const rect = document.createElementNS(ns, "rect");
        const clipId = "meeting-frame-" + ++clipNumber;
        clip.id = clipId;
        clip.setAttribute("clipPathUnits", "userSpaceOnUse");
        for (const name of ["x", "y", "width", "height"])
          rect.setAttribute(name, frame[name]);
        clip.append(rect);
        defs.append(clip);
        svg.prepend(defs);
        svg.querySelector("image").setAttribute("clip-path", `url(#${clipId})`);
      }
    };
    new MutationObserver(clipPortraits).observe(meeting, {
      childList: true,
      subtree: true,
    });
    clipPortraits();
  }

  if (!window.GuardiaoGameUI) return;
  class GameUI extends window.GuardiaoGameUI {
    constructor(options) {
      super(options);
      this.care.setAttribute("aria-live", "off");
      const btn = document.getElementById("jump-action");
      btn.innerHTML = `<img src="${new URL("assets/interface/kai-pulando.png", root).href}" alt=""><small>PULAR</small>`;
      document
        .querySelectorAll(
          ".round,.map-hotspot,.ending-actions button,.ending-actions a",
        )
        .forEach((b) => b.classList.add("bounded-control"));
    }
    open(id) {
      for (const d of document.querySelectorAll("dialog[open]"))
        if (d.id !== id && d.id !== "girar-celular") d.close();
      const d = document.getElementById(id);
      if (d && !d.open) d.showModal();
    }
  }
  window.GuardiaoGameUI = GameUI;
})();
