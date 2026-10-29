"use strict";
(() => {
  const root = new URL("../../", document.currentScript.src),
    memory = window.GuardiaoMemoria;
  let tab = "items",
    dialog,
    geomPromise;
  const icon = (name) => window.GuardiaoIcones?.markup(name) || "";
  function geometry() {
    if (window.GuardiaoColarGeometria) return Promise.resolve();
    return (geomPromise ??= new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL("jogo/colar-vivo/geometria.js", root).href;
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    }));
  }
  function create() {
    if (dialog) return;
    dialog = document.createElement("dialog");
    dialog.id = "mochila-jornada";
    dialog.className = "journey-pack";
    dialog.setAttribute("aria-labelledby", "pack-title");
    dialog.innerHTML =
      '<header><div><p>COLEÇÃO DO GUARDIÃO</p><h2 id="pack-title">Mochila de Kai</h2></div><button type="button" data-pack-close aria-label="Fechar mochila">×</button></header><div role="tablist" aria-label="Dentro da mochila"><button type="button" role="tab" id="pack-tab-items" aria-controls="pack-content" data-pack-tab="items">Itens</button><button type="button" role="tab" id="pack-tab-crystals" aria-controls="pack-content" data-pack-tab="crystals">Cristais / Amuleto</button><button type="button" role="tab" id="pack-tab-uniforms" aria-controls="pack-content" data-pack-tab="uniforms">Uniformes</button></div><section id="pack-content" role="tabpanel" tabindex="0"></section><p id="pack-status" role="status" aria-live="polite"></p><footer><button type="button" data-pack-close>Voltar à aventura</button></footer>';
    document.body.append(dialog);
    dialog.addEventListener("click", (e) => {
      if (e.target.closest("[data-pack-close]")) dialog.close();
      const next = e.target.closest("[data-pack-tab]")?.dataset.packTab;
      if (next) {
        tab = next;
        render();
      }
      const outfit = e.target.closest("[data-pack-uniform]")?.dataset
        .packUniform;
      if (outfit) {
        if (memory.uniform(outfit)) {
          $("pack-status").textContent =
            "Uniforme selecionado. Kai usará as sprites compatíveis.";
          render();
        }
      }
      const item = e.target.closest("[data-pack-equip]")?.dataset.packEquip;
      if (item && memory.equip(item)) {
        dialog.close();
      }
    });
    dialog.addEventListener("keydown", (e) => {
      const current = e.target.closest("[data-pack-tab]");
      if (
        !current ||
        !["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
      )
        return;
      e.preventDefault();
      const list = [...dialog.querySelectorAll("[data-pack-tab]")],
        i = list.indexOf(current),
        j =
          e.key === "Home"
            ? 0
            : e.key === "End"
              ? 2
              : (i + (e.key === "ArrowRight" ? 1 : 2)) % 3;
      tab = list[j].dataset.packTab;
      render();
      list[j].focus();
    });
  }
  const $ = (id) => document.getElementById(id);
  function necklace() {
    const g = window.GuardiaoColarGeometria;
    if (!g) return "<p>Preparando o amuleto…</p>";
    const earned = memory.obtained();
    return `<svg viewBox="0 0 ${g.width} ${g.height}" role="img" aria-label="Amuleto com ${earned.length} de cinco cristais"><image href="${new URL("jogo/colar-vivo/assets/colar-vazio.webp", root).href}" width="${g.width}" height="${g.height}"/>${g.gems.map((gem, i) => `<path d="${gem.path}" fill="${earned.includes(i + 1) ? memory.crystals[i].color : "#596354"}" opacity="${earned.includes(i + 1) ? 1 : 0.28}"/>`).join("")}</svg>`;
  }
  function render() {
    if (!dialog) return;
    const state = memory.read(),
      earned = memory.obtained();
    dialog.querySelectorAll("[data-pack-tab]").forEach((b) => {
      const selected = b.dataset.packTab === tab;
      b.setAttribute("aria-selected", String(selected));
      b.tabIndex = selected ? 0 : -1;
    });
    $("pack-content").setAttribute("aria-labelledby", "pack-tab-" + tab);
    if (tab === "items")
      $("pack-content").innerHTML =
        '<p class="pack-intro">Cada encontro traz uma ferramenta para cuidar. Os itens ainda não encontrados ficam bloqueados.</p><div class="pack-grid">' +
        memory.items
          .map((i) => {
            const unlocked = memory.has(i.id),
              current = Number(document.body.dataset.phase || 0);
            return `<article class="pack-card ${unlocked ? "" : "pack-locked"}" data-item="${i.id}" data-unlocked="${unlocked}"><div class="pack-icon">${icon(unlocked ? i.icon : "lock")}</div><div><h3>${i.name}</h3><p>${unlocked ? i.description : "Você vai encontrar este item durante a fase " + i.phase + "."}</p>${unlocked && current === i.phase ? `<button type="button" data-pack-equip="${i.id}">Usar na missão</button>` : `<span class="pack-label">${unlocked ? "Recebido" : "Ainda não encontrado"}</span>`}</div></article>`;
          })
          .join("") +
        "</div>";
    if (tab === "crystals") {
      $("pack-content").innerHTML =
        `<div class="pack-amulet">${necklace()}<div><h3>${earned.length} de 5 cristais</h3><p>Carlos guardava este amuleto dos cuidadores da ilha. Cada cristal lembra uma ação feita com os amigos.</p><p>Ele guarda a lembrança da jornada. Quem recupera a natureza são as pessoas e a própria vida, com tempo e cuidado.</p></div></div><div class="pack-grid">${memory.crystals.map((c) => `<article class="pack-card ${earned.includes(c.id) ? "" : "pack-locked"}" data-crystal="${c.id}"><svg class="crystal-gem" viewBox="0 0 48 56" aria-hidden="true"><path d="M24 3L43 18L38 43L24 53L10 43L5 18Z" fill="${earned.includes(c.id) ? c.color : "#65715c"}" stroke="#cda45c" stroke-width="3"/><path d="M24 3L15 20L24 43L33 20Z" fill="#fff5"/></svg><div><h3>Cristal da ${c.name}</h3><p>${earned.includes(c.id) ? c.description : "Conclua a fase " + c.id + " para descobrir este cristal."}</p><span class="pack-label">${earned.includes(c.id) ? "Conquistado" : "Bloqueado"}</span></div></article>`).join("")}</div>`;
      geometry()
        .then(() => {
          if (
            dialog.open &&
            tab === "crystals" &&
            !dialog.querySelector(".pack-amulet svg")
          )
            render();
        })
        .catch(() => {
          $("pack-status").textContent =
            "A coleção continua salva. A ilustração do amuleto não carregou.";
        });
    }
    if (tab === "uniforms")
      $("pack-content").innerHTML =
        '<p class="pack-intro">Escolha um uniforme recebido. Dentro da água contaminada, a proteção do rio é obrigatória.</p><div class="pack-grid">' +
        memory.uniforms
          .map((u) => {
            const unlocked = memory.hasUniform(u.id);
            return `<article class="pack-card ${unlocked ? "" : "pack-locked"}" data-uniform="${u.id}"><svg class="pack-outfit" viewBox="0 0 70 84" aria-hidden="true"><path d="M20 8L5 23L14 38L22 32V75H48V32L56 38L65 23L50 8L44 4Q35 15 26 4Z" fill="${unlocked ? u.color : "#647056"}" stroke="#3e5b3b" stroke-width="3"/><path d="M35 14V73M22 48H48" stroke="#f5df9c" stroke-width="3"/><path d="M35 26Q21 24 27 36Q39 42 43 24Q35 28 35 26" fill="#dfefb6"/></svg><div><h3>${u.name}</h3><p>${u.description}</p><button type="button" data-pack-uniform="${u.id}" ${!unlocked ? "disabled" : ""} aria-pressed="${state.uniform === u.id}">${!unlocked ? "Ainda não recebido" : state.uniform === u.id ? "Selecionado" : "Vestir uniforme"}</button></div></article>`;
          })
          .join("") +
        "</div>";
  }
  function open({ section = "items" } = {}) {
    create();
    tab = section;
    for (const d of document.querySelectorAll("dialog[open]")) d.close();
    render();
    if (!dialog.open) dialog.showModal();
    document.dispatchEvent(new CustomEvent("guardiao:mochila-aberta"));
  }
  document.addEventListener("guardiao:memoria", () => {
    if (dialog?.open) render();
  });
  document.addEventListener("keydown", (e) => {
    if (
      e.key.toLowerCase() === "b" &&
      !e.repeat &&
      !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) &&
      document.body.dataset.page === "missions" &&
      !document.querySelector("dialog[open]")
    ) {
      e.preventDefault();
      open();
    }
  });
  window.GuardiaoMochila = Object.freeze({
    open,
    render,
    close: () => dialog?.close(),
  });
})();
