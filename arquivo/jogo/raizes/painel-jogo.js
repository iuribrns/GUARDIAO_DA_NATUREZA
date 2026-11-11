"use strict";
(() => {
  const R = Raizes,
    A = RaizesPersonagens,
    $ = (id) => document.getElementById(id);
  const phase = location.pathname.includes("/floresta-viva/")
    ? 1
    : Number(new URLSearchParams(location.search).get("fase") || 2);
  let pack,
    tab = "items",
    adjustments,
    raf = 0,
    last = 0;
  function makePack() {
    if (pack) return;
    pack = document.createElement("dialog");
    pack.id = "mochila-jornada";
    pack.className = "ra-dialog ra-pack";
    pack.setAttribute("aria-labelledby", "pack-title");
    pack.innerHTML = `<header><div><p class="eyebrow">COM VOCÊ NA AVENTURA</p><h2 id="pack-title">Mochila de Kai</h2></div><button type="button" data-pack-close class="icon-button" aria-label="Fechar mochila">${R.icon("close")}</button></header><div class="ra-tabs" role="tablist" aria-label="Dentro da mochila"><button type="button" role="tab" data-pack-tab="items">Ferramentas</button><button type="button" role="tab" data-pack-tab="crystals">Colar</button><button type="button" role="tab" data-pack-tab="uniforms">Traje</button></div><section id="pack-content" tabindex="0" role="tabpanel"></section><p id="pack-status" role="status"></p>`;
    document.body.append(pack);
    pack.onclick = (e) => {
      if (e.target.closest("[data-pack-close]")) pack.close();
      const b = e.target.closest("[data-pack-tab]");
      if (b) {
        tab = b.dataset.packTab;
        renderPack();
      }
      const equip = e.target.closest("[data-pack-equip]");
      if (equip) {
        const id = equip.dataset.packEquip;
        if (GuardiaoMemoria.has(id)) {
          pack.close();
          document.dispatchEvent(
            new CustomEvent("guardiao:equipar", { detail: { id } }),
          );
        }
      }
    };
    pack.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        pack.close();
      }
    });
  }
  function renderPack() {
    const m = GuardiaoMemoria,
      earned = m.obtained();
    pack
      .querySelectorAll("[data-pack-tab]")
      .forEach((b) =>
        b.setAttribute("aria-selected", String(b.dataset.packTab === tab)),
      );
    const body = $("pack-content");
    if (tab === "items") {
      const equipment = m.items.filter((i) => i.phase === phase && m.has(i.id));
      body.innerHTML = equipment.length
        ? '<div class="ra-tool-grid">' +
          equipment
            .map((i) => {
              const icon =
                {
                  mangueira: "hose",
                  luvas: "hand",
                  kit: "paw",
                  rede: "water",
                  saco: "bag",
                  protecao: "water",
                  veterinario: "paw",
                  corda: "leaf",
                  chave: "leaf",
                  pa: "leaf",
                  sementes: "leaf",
                  mudas: "leaf",
                  regador: "water",
                  reciclagem: "bag",
                  solar: "sun",
                  jardim: "leaf",
                }[i.id] || "leaf";
              const state =
                  phase === 1
                    ? window.GuardiaoFloresta?.estado()
                    : window.GuardiaoJornada?.estado(),
                usable =
                  (i.id === "mangueira" && !state?.equipped) ||
                  (i.id === "protecao" && !state?.protective);
              return `<article>${R.icon(icon)}<div><h3>${i.name}</h3><p>${i.description}</p>${usable ? `<button type="button" data-pack-equip="${i.id}">Preparar equipamento</button>` : ""}</div></article>`;
            })
            .join("") +
          "</div>"
        : "<p>O aliado vai entregar os equipamentos antes da missão.</p>";
    } else if (tab === "crystals")
      body.innerHTML = `<div class="ra-pack-necklace">${GuardiaoRelicario.necklace(earned, "pack")}<div><h3>${earned.length} de 5 cristais</h3><p>Cada peça lembra um cuidado feito com os amigos.</p><p>Ao reunir as cinco, Kai e Flora voltam à Árvore Guardiã.</p></div></div>`;
    else {
      const uniform = m.uniforms.find((u) => u.id === m.read().uniform);
      body.innerHTML = `<div class="ra-uniform">${R.icon(phase === 2 ? "water" : "leaf")}<div><h3>${uniform?.name || "Explorador"}</h3><p>${phase === 2 ? "A proteção é necessária para entrar na água do rio." : "O traje acompanha os cuidados desta região."}</p></div></div>`;
    }
  }
  function openPack() {
    makePack();
    document.querySelectorAll("dialog[open]").forEach((d) => {
      if (d !== pack && d.id !== "girar-celular") d.close();
    });
    document.dispatchEvent(new CustomEvent("guardiao:neutralizar"));
    renderPack();
    if (!pack.open) pack.showModal();
  }
  window.GuardiaoMochila = { open: openPack };
  function openAdjustments() {
    if (!adjustments) {
      adjustments = document.createElement("dialog");
      adjustments.id = "phase-settings";
      adjustments.className = "ra-dialog ra-phase-settings";
      adjustments.setAttribute("aria-labelledby", "phase-settings-title");
      adjustments.innerHTML = `<header><div><p class="eyebrow">AJUSTES SEM SAIR DA FASE</p><h2 id="phase-settings-title">Do seu jeito</h2></div><button type="button" class="icon-button" aria-label="Retomar jogo">${R.icon("close")}</button></header><div class="phase-settings-form"></div>`;
      document.body.append(adjustments);
      R.bindSettings(adjustments.querySelector(".phase-settings-form"));
      adjustments.querySelector("header button").onclick = () =>
        adjustments.close();
    }
    document.querySelectorAll("dialog[open]").forEach((d) => {
      if (d.id !== "girar-celular") d.close();
    });
    document.dispatchEvent(new CustomEvent("guardiao:neutralizar"));
    adjustments.showModal();
  }
  function setupTalk() {
    const talk = $("conversa") || $("intro");
    if (!talk) return;
    const text = $("conversa-texto") || $("intro-text"),
      next = $("conversa-avancar") || $("intro-next"),
      counter = $("conversa-pagina") || $("intro-count");
    const bin = document.createElement("div");
    bin.hidden = true;
    bin.className = "ra-legacy";
    while (talk.firstChild) bin.append(talk.firstChild);
    document.body.append(bin);
    talk.classList.add("ra-talk");
    talk.setAttribute("aria-labelledby", "ra-talk-title");
    talk.innerHTML = `<header><p class="eyebrow">UM CUIDADO COMEÇA COM UM ENCONTRO</p><h2 id="ra-talk-title">${["Carlos", "Antônio", "Marina", "Rafael", "Luciana"][phase - 1]}</h2></header><div class="ra-talk-columns"><canvas class="ra-talk-scene" aria-label="Kai e o aliado se olham durante a conversa"></canvas><div class="ra-talk-copy"></div></div><footer></footer>`;
    talk.querySelector(".ra-talk-copy").append(text);
    talk.querySelector("footer").append(counter, next);
    next.className = "wood-button primary";
    next.autofocus = true;
  }
  function setupPause() {
    const d = $("menu-pausa"),
      bin = document.createElement("div");
    bin.hidden = true;
    bin.className = "ra-legacy";
    while (d.firstChild) bin.append(d.firstChild);
    document.body.append(bin);
    d.className = "ra-dialog ra-pause";
    d.setAttribute("aria-labelledby", "ra-pause-title");
    d.innerHTML = `<header><canvas id="pause-flora" aria-label="Flora descansa durante a pausa"></canvas><p class="eyebrow">UMA PAUSA NA TRILHA</p><h2 id="ra-pause-title">Respire com a floresta.</h2><button type="button" class="icon-button ra-pause-full" aria-label="Entrar em tela cheia"></button></header><p>Sua aventura continua aqui.</p><nav><button type="button" class="wood-button primary" data-resume>Continuar</button><button type="button" class="wood-button" data-adjust>${R.icon("gear")}Ajustes</button><a class="wood-button" href="${new URL("index.html#mapa", R.base)}">${R.icon("back")}Voltar ao mapa</a></nav>`;
    d.querySelector("[data-resume]").onclick = () => d.close();
    d.querySelector("[data-adjust]").onclick = openAdjustments;
    R.bindFull(d.querySelector(".ra-pause-full"));
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - last < 66 || document.hidden) return;
    last = now;
    const t = now / 1000,
      talk = document.querySelector(".ra-talk[open]");
    if (talk)
      A.canvas(talk.querySelector("canvas"), (c, w, h) => {
        const hh = Math.min(h * 0.92, w * 0.58);
        A.draw(c, "acoes", 0, w * 0.28, h * 0.96, hh * 0.84);
        A.draw(
          c,
          "npcs",
          phase - 1 + (Math.sin(t * 0.8) > 0.6 ? 5 : 0),
          w * 0.73,
          h * 0.96,
          hh,
        );
        A.owl(c, w * 0.37, h * 0.96 - hh * 0.65, hh * 0.24, t, "voo", true);
      });
    if (phase === 1 && $("vitoria")?.open && $("ra-celebration"))
      A.canvas($("ra-celebration"), (c, w, h) => {
        A.draw(
          c,
          "acoes",
          6,
          w * 0.38,
          h * 0.93 + Math.sin(t * 4) * 2,
          h * 0.84,
        );
        A.draw(c, "npcs", 5, w * 0.7, h * 0.93, h * 0.86);
        A.owl(c, w * 0.52, h * 0.42, h * 0.35, t, "festa", false);
      });
    if ($("menu-pausa")?.open)
      A.canvas($("pause-flora"), (c, w, h) =>
        A.owl(c, w * 0.5, h * 0.95, h * 0.75, t, "ombro", false),
      );
  }
  function init() {
    document.body.classList.add("raizes-jogo");
    setupTalk();
    setupPause();
    const top = document.querySelector("#jogo .top-actions"),
      bag = $("mochila");
    if (bag) {
      bag.className = "ra-world-icon";
      bag.innerHTML = R.icon("bag");
      bag.setAttribute("aria-label", "Mochila de Kai");
      top.prepend(bag);
    }
    const fs = document.createElement("button");
    fs.type = "button";
    fs.id = "app-fullscreen";
    fs.className = "ra-world-icon";
    top.prepend(fs);
    R.bindFull(fs);
    $("pausa").innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4v16M16 4v16" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>';
    $("pausa").className = "ra-world-icon";
    document
      .querySelectorAll("[data-icon]")
      .forEach((el) => (el.innerHTML = R.icon(el.dataset.icon)));
    const hidden = document.createElement("div");
    hidden.hidden = true;
    hidden.className = "ra-legacy";
    document.body.append(hidden);
    for (const id of ["som", "ajuda", "jump-action"])
      if ($(id)) hidden.append($(id));
    if (phase === 1) {
      const waterGoal = document.querySelector('[data-goal="agua"]');
      if (waterGoal) hidden.append(waterGoal);
      $("mangueira").innerHTML = R.icon("hose") + "<small>ÁGUA</small>";
      const title = document.querySelector(".mission h1,.mission h2");
      if (title) title.textContent = "Floresta em Chamas";
    } else {
      $("tool-icon").innerHTML = R.icon(
        phase === 2
          ? "net"
          : phase === 4
            ? "water"
            : phase === 5
              ? "trash"
              : "paw",
      );
    }
    $("interagir").innerHTML = R.icon("hand") + "<small>CUIDAR</small>";
    const rotate = $("girar-tela-cheia");
    if (rotate) R.bindFull(rotate);
    if (phase === 1) {
      const art = document.querySelector(".celebration-art");
      if (art) {
        art.style.backgroundImage = "none";
        art.replaceChildren(
          Object.assign(document.createElement("canvas"), {
            id: "ra-celebration",
          }),
        );
      }
    }
    A.load(["acoes", "flora", "npcs"]).then(
      () => (document.body.dataset.newActorsReady = "true"),
    );
    raf = requestAnimationFrame(frame);
  }
  window.addEventListener(
    "keydown",
    (e) => {
      if (document.querySelector("dialog[open]")) return;
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
        ].includes(e.key) &&
        e.target.closest?.(".top-actions")
      )
        $("cenario").focus({ preventScroll: true });
    },
    { capture: true },
  );
  window.addEventListener("pagehide", () => cancelAnimationFrame(raf));
  document.addEventListener("DOMContentLoaded", init, { once: true });
})();
