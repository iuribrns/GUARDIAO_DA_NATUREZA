"use strict";
(() => {
  const base = new URL("assets/", document.currentScript.src),
    shared = new URL(
      "../remodelacao/assets/icones/",
      document.currentScript.src,
    ),
    symbols = ["fogo", "agua", "pata", "cuidar", "solar"],
    colors = ["vermelho", "azul", "amarelo", "verde", "violeta"],
    // Recortes apenas de apresentação: os WebP originais não são alterados.
    gems = [
      [434, 724, 61, 137, 371, 517],
      [435, 724, 42, 134, 369, 469],
      [434, 724, 7, 93, 415, 615],
      [435, 724, 49, 61, 368, 565],
      [434, 724, 25, 61, 330, 516],
    ],
    $ = (selector) => document.querySelector(selector),
    // Estes seis símbolos do kit são idênticos aos do tema ativo; reutilizar
    // seus URLs evita copiar e baixar a mesma arte novamente.
    url = (name) =>
      new URL(
        name + ".webp",
        symbols.includes(name) || name === "mochila" ? shared : base,
      ).href;
  function concluded() {
    try {
      return localStorage.getItem("guardiao.viva.final.v1") === "visto";
    } catch {
      return window.VivaFinal?.state().finished === true;
    }
  }
  function region(id, progress) {
    if (progress.completed.includes(id))
      return ["recuperada", "Natureza recuperada"];
    if (id !== 1 && !progress.completed.includes(id - 1))
      return ["bloqueada", "Bloqueada"];
    return id === progress.current
      ? ["atual", "Região atual"]
      : ["disponivel", "Disponível"];
  }
  function fragment(id, earned) {
    if (!earned)
      return `<img src="${url("encaixe-vazio")}" width="383" height="384" alt="">`;
    const [w, h, x, y, width, height] = gems[id - 1];
    return `<svg viewBox="${x} ${y} ${width} ${height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><image href="${url("cristal-" + id)}" width="${w}" height="${h}"/></svg>`;
  }
  function update(progress = GuardiaoProgresso.read()) {
    const current = $("#map-current");
    if (!current) return;
    const id = progress.current || 1,
      name = GuardiaoFasesJogaveis[id]?.name || "Floresta em Chamas",
      [state, status] = region(id, progress),
      count = progress.completed.length,
      restored = count === 5 && concluded(),
      tree = restored ? "restaurada" : count ? "recuperando" : "enfraquecida",
      treeStatus = restored
        ? "Restaurada"
        : count === 5
          ? "Pronta para florescer"
          : count
            ? "Recuperando forças"
            : "Enfraquecida";
    $("[data-map-phase-icon]").src = url(symbols[id - 1]);
    $("[data-map-phase-name]").textContent = name;
    $("[data-map-phase-status]").textContent = restored
      ? "Jornada concluída"
      : status;
    current.dataset.regionState = state;
    current.setAttribute(
      "aria-label",
      name + ". " + status + (restored ? ". Jornada concluída" : ""),
    );
    $("[data-map-count]").textContent = count + "/5";
    // O colar também usa os IDs concluídos: lacunas no progresso continuam vazias.
    $(".map-hud-slots").innerHTML = colors
      .map((color, i) => {
        const earned = progress.completed.includes(i + 1);
        return `<span class="map-hud-slot" data-crystal="${i + 1}" data-earned="${earned}" role="img" aria-label="Cristal ${color} ${earned ? "conquistado" : "a conquistar"}">${fragment(i + 1, earned)}</span>`;
      })
      .join("");
    $("#map-fragments").setAttribute(
      "aria-label",
      count + " de 5 cristais conquistados",
    );
    $("[data-map-tree-icon]").src = url("arvore-" + tree);
    $("[data-map-tree-status]").textContent = treeStatus;
    $("#tree-state").dataset.treeState = restored
      ? "restaurada"
      : count === 5
        ? "pronta"
        : tree;
    $("#tree-state").setAttribute(
      "aria-label",
      "Árvore Guardiã " +
        (tree === "enfraquecida" || restored
          ? treeStatus.toLocaleLowerCase("pt-BR")
          : "— " + treeStatus),
    );
    document.querySelectorAll(".map-hotspot[data-phase]").forEach((button) => {
      const phase = Number(button.dataset.phase),
        phaseName = GuardiaoFasesJogaveis[phase]?.name || "Floresta em Chamas";
      button.setAttribute(
        "aria-label",
        phaseName + ". " + region(phase, progress)[1],
      );
    });
  }
  window.GuardiaoMapaHUD = { update };
})();
