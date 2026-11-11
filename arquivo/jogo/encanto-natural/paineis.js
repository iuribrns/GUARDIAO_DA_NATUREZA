"use strict";
(() => {
  const base = new URL("./", document.currentScript.src);
  document.body.classList.add("encanto-natural");
  const portraitURL = new URL("assets/flora-retrato.webp", base).href;
  // O mesmo modelo aparece nos retratos e nas animações do mapa e das fases.
  for (const img of document.querySelectorAll('img[src*="flora-180-"]'))
    img.src = portraitURL;
  const oldIcons = window.GuardiaoIcones;
  if (oldIcons) {
    const portrait = new Image();
    portrait.src = portraitURL;
    const markup = (name) =>
      name === "flora"
        ? `<span class="ui-icon encanto-flora" aria-hidden="true"><img src="${portraitURL}" alt=""></span>`
        : oldIcons.markup(name);
    const prepare = (parent = document) => {
      oldIcons.prepare?.(parent);
      for (const el of parent.querySelectorAll('[data-icon="flora"]'))
        el.innerHTML = markup("flora");
    };
    window.GuardiaoIcones = Object.freeze({
      ...oldIcons,
      markup,
      prepare,
      async load() {
        const [legacy] = await Promise.all([
          oldIcons.load(),
          portrait.decode(),
        ]);
        return legacy;
      },
      paint(ctx, legacy, name, x, y, size) {
        if (name === "flora" && portrait.complete && portrait.naturalWidth)
          ctx.drawImage(portrait, x - size / 2, y - size / 2, size, size);
        else oldIcons.paint(ctx, legacy, name, x, y, size);
      },
    });
    prepare();
  }

  const panel = document.getElementById("phase-dialog");
  if (!panel) return;
  const header = panel.querySelector(".phase-scene"),
    copy = panel.querySelector(".phase-copy"),
    footer = panel.querySelector(".phase-actions"),
    close = panel.querySelector('[data-map-action="close"]');
  panel.prepend(header);
  panel.append(footer);
  const information = panel.querySelector(".phase-information");
  information.tabIndex = 0;
  information.setAttribute("role", "region");
  information.setAttribute("aria-label", "Informações da fase");
  close.className = "nature-button brief-back";
  close.textContent = "← Voltar ao mapa";
  close.setAttribute("aria-label", "Voltar ao mapa");
  footer.prepend(close);

  function section(className, title, node) {
    const box = document.createElement("section");
    box.className = "brief-section " + className;
    const heading = document.createElement("h3");
    heading.className = "brief-label";
    heading.textContent = title;
    box.append(heading, node);
    return box;
  }
  const objective = document.getElementById("phase-objective"),
    goals = document.getElementById("phase-goals"),
    loot = copy.querySelector(".phase-loot");
  copy.querySelector(".phase-ally").hidden = true;
  const situation = section("brief-situation", "Situação", objective),
    objectives = section("brief-goals", "Objetivos", goals);
  copy.querySelector("h3:not(.brief-label)")?.remove();
  copy.prepend(situation, objectives);
  const lootLabels = ["Você recebe", "Recompensa"];
  const artwork = [...loot.children].map((box, i) => {
    box.firstElementChild.textContent = lootLabels[i];
    box.firstElementChild.classList.add("brief-label");
    const art = document.createElement("div");
    art.className = "brief-loot-art";
    art.setAttribute("aria-hidden", "true");
    box.insertBefore(art, box.querySelector("strong"));
    return art;
  });
  let current = 1;
  function refresh() {
    const number = document.getElementById("phase-number");
    const destination = number.textContent.match(/(?:DESTINO|FASE)\s+(\d+)/i);
    if (destination) current = Number(destination[1]);
    panel.dataset.briefPhase = String(current);
    const landscape =
      current === 6
        ? "vida-em-equilibrio/assets/mapa.webp"
        : "renascimento/assets/" +
          ["floresta", "rio", "fauna", "plantio", "cidade"][current - 1] +
          ".webp";
    panel.style.setProperty(
      "--meeting-background",
      `url("${new URL("../" + landscape, base).href}")`,
    );
    const npcLabel = panel.querySelector(".meeting-npc > span");
    if (npcLabel && !npcLabel.querySelector("small")) {
      const role = document.createElement("small");
      role.className = "brief-profession";
      role.textContent =
        document.getElementById("phase-profession").textContent;
      npcLabel.append(role);
    }
    document.getElementById("phase-number").textContent =
      current === 6 ? "EPÍLOGO" : "FASE " + current;
    objectives.hidden = !goals.children.length;
    const items = {
      1: ["mangueira", "kit"],
      2: ["rede", "protecao"],
      3: ["chave", "kit"],
      4: ["regador"],
      5: ["mochila", "solar", "pa"],
    }[current];
    artwork[0].innerHTML = items
      ? items.map((name) => GuardiaoArtesInterface.svg(name, true)).join("")
      : GuardiaoIcones.markup("heart");
    if (current === 4)
      artwork[0].insertAdjacentHTML(
        "afterbegin",
        GuardiaoColecao.item("mudas"),
      );
    const equipment = document.getElementById("phase-equipment");
    const briefEquipment = {
      2: "Proteção, rede e bolsa",
      3: "Kit, alimento e chave",
      5: "Bolsa, painel e pá",
    }[current];
    if (briefEquipment) equipment.textContent = briefEquipment;
    artwork[1].innerHTML =
      current === 6
        ? [0, 1, 2, 3, 4].map((i) => GuardiaoColecao.gem(i, true)).join("")
        : GuardiaoColecao.gem(current - 1, true).replaceAll(
            "#f47739",
            "#de442d",
          );
  }
  document.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest("button[data-phase]");
      if (button) current = Number(button.dataset.phase);
    },
    { capture: true },
  );
  new MutationObserver(refresh).observe(
    document.getElementById("phase-title"),
    {
      childList: true,
      subtree: true,
    },
  );
  refresh();
})();
