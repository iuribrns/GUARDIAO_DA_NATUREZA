"use strict";
(() => {
  const root = new URL("../../", document.currentScript.src);
  let serial = 0;
  function portrait(d, index, src) {
    const b = d.frames[index].bounds;
    const id = "viva-kai-" + ++serial;
    return `<svg viewBox="${b.join(" ")}" aria-hidden="true"><defs><clipPath id="${id}"><rect x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}"/></clipPath></defs><image href="${src}" width="${d.width}" height="${d.height}" clip-path="url(#${id})"/></svg>`;
  }
  function kai() {
    const d = window.GuardiaoFlorestaAtlas.sheets["kai-repouso"];
    return portrait(
      d,
      6,
      new URL("jogo/floresta-viva/assets/" + d.file, root).href,
    );
  }
  function background(element, id) {
    const name = ["floresta", "rio", "fauna", "plantio", "cidade"][id - 1];
    if (name)
      element.style.setProperty(
        "--meeting-background",
        `url("${new URL("jogo/renascimento/assets/" + name + ".webp", root).href}")`,
      );
    else
      element.style.setProperty(
        "--meeting-background",
        `url("${new URL("jogo/vida-em-equilibrio/assets/mapa.webp", root).href}")`,
      );
  }
  function simplifyPack(pack) {
    for (const button of pack.querySelectorAll("[data-pack-equip]")) {
      const id = button.dataset.packEquip;
      const inUse =
        id === "mangueira"
          ? window.GuardiaoFloresta?.estado().equipped
          : id === "protecao" && window.GuardiaoJornada?.estado().protective;
      if (!["mangueira", "protecao"].includes(id) || inUse) {
        const label = document.createElement("span");
        label.className = "pack-label";
        label.textContent = inUse
          ? "Em uso"
          : "Pronto para os cuidados da fase";
        button.replaceWith(label);
      } else {
        const caption =
          id === "mangueira" ? "Pegar mangueira" : "Vestir proteção";
        if (button.textContent !== caption) button.textContent = caption;
      }
    }
  }
  let observedPack;
  new MutationObserver(() => {
    const pack = document.getElementById("mochila-jornada");
    if (!pack || pack === observedPack) return;
    observedPack = pack;
    new MutationObserver(() => simplifyPack(pack)).observe(pack, {
      childList: true,
      subtree: true,
    });
    simplifyPack(pack);
  }).observe(document.body, { childList: true });
  const phase = document.getElementById("phase-dialog");
  if (phase) {
    const info = document.createElement("section");
    info.className = "phase-information";
    info.append(
      phase.querySelector(".phase-scene"),
      phase.querySelector(".phase-copy"),
    );
    phase.append(info);
    const start = phase.querySelector("[data-map-action=start]");
    const syncState = () =>
      phase.classList.toggle("phase-unlocked", !start.disabled);
    new MutationObserver(syncState).observe(start, {
      attributes: true,
      attributeFilter: ["disabled"],
    });
    syncState();
    const meeting = document.getElementById("phase-meeting");
    new MutationObserver(() => {
      if (
        !meeting.querySelector(".meeting-kai") ||
        meeting.querySelector(".meeting-npc,.meeting-mascot")
      )
        return;
      const mascot = document.createElement("figure");
      mascot.className = "meeting-kai meeting-mascot";
      const d = GuardiaoAtores.spec("flora");
      mascot.innerHTML =
        portrait(d, 12, new URL(d.file, root).href) + "<span>Flora</span>";
      meeting.append(mascot);
    }).observe(meeting, { childList: true });
    background(phase, 1);
    document.addEventListener(
      "click",
      (e) => {
        const button = e.target.closest("button[data-phase]");
        if (button) background(phase, Number(button.dataset.phase));
      },
      { capture: true },
    );
    const mapList = document.getElementById("lista-fases");
    mapList.hidden = true;
    const regions = document.getElementById("map-regions");
    regions.setAttribute("role", "group");
    regions.setAttribute("aria-label", "Escolha uma região da ilha");
    document.querySelector(".skip-link").href = "#map-regions";
    regions.tabIndex = -1;
  }
  function story(id) {
    const d = document.getElementById(id === 1 ? "conversa" : "intro");
    const portrait = document.getElementById(
      id === 1 ? "retrato-carlos" : "intro-portrait",
    );
    const copy = portrait.nextElementSibling;
    copy.classList.add("conversation-copy");
    const art = document.createElement("div");
    art.className = "conversation-art";
    const friend = document.createElement("figure");
    friend.className = "conversation-friend";
    friend.append(portrait);
    const hero = document.createElement("figure");
    hero.className = "conversation-kai";
    hero.innerHTML = kai() + "<figcaption>Kai</figcaption>";
    art.append(friend, hero);
    d.prepend(art);
    background(d, id);
    const name = document.getElementById(
      id === 1 ? "conversa-nome" : "intro-name",
    );
    const label = document.createElement("figcaption");
    const update = () =>
      (label.textContent = name.textContent.split("·")[0].trim());
    friend.append(label);
    new MutationObserver(update).observe(name, {
      childList: true,
      subtree: true,
    });
    update();
  }
  function pause(id) {
    const d = document.getElementById("menu-pausa"),
      nav = d.querySelector(".pause-buttons");
    const details = document.createElement("details");
    details.className = "pause-more";
    details.innerHTML =
      '<summary>Mais opções</summary><div class="pause-extra-actions"></div>';
    const extra = details.lastElementChild;
    for (const selector of ["#tela-cheia", "#recomecar"])
      extra.append(d.querySelector(selector));
    for (const [selector, title, destination] of [
      ["#mochila", "Mochila de Kai", nav],
      ["#ajuda", "Dica da Flora", extra],
      ["#som", "Efeitos sonoros", extra],
      ["#jump-action", "Pular na trilha", extra],
    ]) {
      const button = document.querySelector(selector);
      button.className = "nature-button pause-utility";
      button.textContent = title;
      destination.append(button);
      if (selector === "#jump-action" && id === 2) button.hidden = true;
      if (["#mochila", "#ajuda", "#jump-action"].includes(selector))
        button.addEventListener("click", () => d.close(), { capture: true });
    }
    nav.append(details);
    const sound = document.getElementById("som");
    const syncSound = () =>
      (sound.textContent =
        sound.getAttribute("aria-pressed") === "true"
          ? "Efeitos: ligados"
          : "Efeitos: desligados");
    new MutationObserver(syncSound).observe(sound, {
      attributes: true,
      attributeFilter: ["aria-pressed"],
    });
    syncSound();
    d.addEventListener("close", () => (details.open = false));
    const primary = nav.querySelector('[data-close="menu-pausa"]');
    if (primary) {
      nav.prepend(primary);
      primary.after(document.getElementById("mochila"));
    }
  }
  if (!window.GuardiaoGameUI) return;
  class GameUI extends window.GuardiaoGameUI {
    constructor(options) {
      super(options);
      story(options.phase);
      pause(options.phase);
    }
  }
  window.GuardiaoGameUI = GameUI;
})();
