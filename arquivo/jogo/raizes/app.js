"use strict";
(() => {
  const $ = (id) => document.getElementById(id),
    R = Raizes,
    A = RaizesPersonagens;
  const phases = [
    {
      id: 1,
      name: "Floresta em Chamas",
      npc: "Carlos",
      job: "Guarda florestal",
      region: [77, 24],
      icon: "fire",
      map: "floresta",
      color: "vermelho",
      items: "Mangueira e kit de cuidado",
      situation:
        "O fogo se espalhou. Carlos precisa de ajuda para proteger a floresta e os animais.",
      goals: [
        "Apague os oito focos de incêndio.",
        "Cuide dos três animais e libere as trilhas.",
        "Volte a Carlos para celebrar.",
      ],
      row: 0,
    },
    {
      id: 2,
      name: "Rio Poluído",
      npc: "Antônio",
      job: "Cuidador do rio",
      region: [82, 49],
      icon: "water",
      map: "rio",
      color: "azul",
      items: "Traje de proteção, rede e bolsa",
      situation:
        "Resíduos poluem a água. Antônio vai orientar Kai a cuidar do rio e de seus moradores.",
      goals: [
        "Vista a proteção e recolha os resíduos.",
        "Ajude os peixes e a tartaruga.",
        "Devolva a vida ao rio.",
      ],
      row: 1,
    },
    {
      id: 3,
      name: "Resgate da Fauna",
      npc: "Marina",
      job: "Cuidadora dos animais",
      region: [76, 78],
      icon: "paw",
      map: "fauna",
      color: "amarelo",
      items: "Kit de resgate e chave dos abrigos",
      situation:
        "Alguns amigos precisam de cuidado. Marina ensina a respeitar cada espécie e seu habitat.",
      goals: [
        "Encontre a chave dos abrigos.",
        "Responda às perguntas e ajude os animais.",
        "Acompanhe os amigos aos lugares seguros.",
      ],
      row: 2,
    },
    {
      id: 4,
      name: "Reflorestamento",
      npc: "Rafael",
      job: "Guardião das sementes",
      region: [27, 75],
      icon: "leaf",
      map: "plantio",
      color: "verde",
      items: "Mudas nativas e regador",
      situation:
        "A terra perdeu suas árvores. Rafael trouxe mudas nativas para fazer a vida voltar.",
      goals: [
        "Plante as seis mudas.",
        "Regue com o mesmo botão de cuidado.",
        "Veja a natureza crescer.",
      ],
      row: 3,
    },
    {
      id: 5,
      name: "Cidade Sustentável",
      npc: "Luciana",
      job: "Organizadora da comunidade",
      region: [25, 25],
      icon: "sun",
      map: "cidade",
      color: "violeta",
      items: "Bolsa de coleta e materiais da comunidade",
      situation:
        "A comunidade quer uma cidade mais saudável. Luciana convida Kai a cuidar dos espaços de todos.",
      goals: [
        "Separe os resíduos nas lixeiras.",
        "Ajuste os painéis e cuide dos jardins.",
        "Reúna o último cristal do colar.",
      ],
      row: 4,
    },
  ];
  const biomes = [
    [
      "Amazônia",
      "Árvores, rios e chuvas formam uma grande rede de vida. Floresta protegida também significa água cuidada.",
      "Por lá: tucanos, peixes e muitas outras espécies.",
    ],
    [
      "Mata Atlântica",
      "Essa floresta guarda muitas espécies que só vivem no Brasil. Preservar os pequenos trechos e conectá-los protege seus moradores.",
      "Por lá: mico-leão-dourado e preguiças.",
    ],
    [
      "Cerrado",
      "Árvores de raízes profundas ajudam a guardar água no solo. Suas nascentes alimentam grandes rios do Brasil.",
      "Por lá: lobo-guará, tamanduá e muitas aves.",
    ],
    [
      "Caatinga",
      "A vida se adapta ao tempo seco. Plantas e animais sabem aproveitar a água e precisam de seu ambiente preservado.",
      "Por lá: tatu-bola e ararinha-azul.",
    ],
    [
      "Pantanal",
      "As águas mudam a paisagem ao longo do ano. Proteger os rios ajuda os campos alagados e seus animais.",
      "Por lá: tuiuiú, onça-pintada e capivaras.",
    ],
    [
      "Pampa",
      "Campos e pequenas plantas também são natureza. Muitas espécies dependem desse espaço aberto para viver.",
      "Por lá: veado-campeiro e aves dos campos.",
    ],
  ];
  const advice = [
    "Encontrou lixo no caminho? Avise um adulto. Use proteção para recolher resíduos seguros e separe no lugar certo.",
    "Leve uma garrafinha reutilizável. Menos descartáveis significam menos resíduos perto dos rios.",
    "Cuide de uma planta com um adulto. Observe o solo e regue na medida certa.",
    "Animal silvestre não é bichinho de gaiola. Respeite sua distância e proteja o lugar onde ele vive.",
    "Fogo na natureza é perigoso. Afaste-se e peça ajuda a um adulto; não tente apagar sozinho.",
    "Feche a torneira enquanto escova os dentes. Cada pequena economia ajuda a cuidar da água.",
  ];
  const regionPaths = [
    "M535 0H1000V240L700 260L560 185Z",
    "M1000 240V563H820L700 420L700 260Z",
    "M560 185L700 260L700 420L820 563H400L460 390Z",
    "M0 265L290 245L560 185L460 390L400 563H0Z",
    "M0 0H535L560 185L290 245L0 265Z",
  ];
  let view = "inicio",
    selected = 1,
    activeAbout = "historia",
    adviceIndex = 0,
    last = 0,
    raf = 0,
    time = 0,
    ready = false,
    restoreTimer = 0,
    captionTimer = 0;
  const reduced = () =>
    R.prefs().reduceMotion ||
    matchMedia("(prefers-reduced-motion:reduce)").matches;
  const progress = () => GuardiaoProgresso.read();
  const file = (path) =>
    new URL(window.GuardiaoArquivosLeves?.[path] || path, R.root).href;
  const unlocked = (id) => id === 1 || progress().completed.includes(id - 1);
  function setIcon(id, name) {
    $(id).innerHTML = R.icon(name) + $(id).innerHTML;
  }
  function mapDraw(restoring = 0) {
    const p = progress();
    $("map-hotspots").innerHTML = phases
      .map(
        (d) =>
          `<button type="button" class="map-hotspot ${p.completed.includes(d.id) ? "is-complete" : ""}" data-phase="${d.id}" style="--x:${d.region[0]}%;--y:${d.region[1]}%" aria-label="${d.name}. ${unlocked(d.id) ? (p.completed.includes(d.id) ? "Natureza recuperada" : "Disponível") : "Complete a região anterior"}" aria-disabled="${!unlocked(d.id)}"><span class="number">${d.id}</span>${d.name}<small>${p.completed.includes(d.id) ? "Natureza recuperada" : unlocked(d.id) ? "Vamos cuidar?" : "Complete a região anterior"}</small></button>`,
      )
      .join("");
    let svg =
      '<defs><mask id="outside-tree"><rect width="1000" height="563" fill="white"/><ellipse cx="510" cy="265" rx="145" ry="170" fill="black"/></mask>';
    regionPaths.forEach(
      (path, i) =>
        (svg += `<clipPath id="ra-region-${i + 1}"><path d="${path}"/></clipPath>`),
    );
    svg += "</defs>";
    p.completed.forEach((id) => {
      svg += `<g clip-path="url(#ra-region-${id})" mask="url(#outside-tree)" class="${id === restoring && !reduced() ? "map-growth" : ""}"><image href="${new URL("assets/mapa-vivo.webp", R.base)}" width="1000" height="563" preserveAspectRatio="none"/></g>`;
    });
    if (R.won() && localStorage.getItem("guardiao.raizes.final.v1") === "visto")
      svg = `<image href="${new URL("assets/mapa-vivo.webp", R.base)}" width="1000" height="563"/>`;
    $("island-restoration").innerHTML = svg;
    const current = phases.find((d) => d.id === p.current) || phases[0];
    $("map-current").innerHTML = R.icon(current.icon) + current.name;
    $("map-fragments").textContent = p.completed.length + " / 5 cristais";
    $("map-reset").hidden = !p.completed.length;
    $("replay-ending").hidden = !R.won();
  }
  function maybeRestore() {
    const p = progress(),
      query = new URLSearchParams(location.search);
    const id = Number(query.get("restaurar") || p.pendingRestoration);
    if (id && p.completed.includes(id)) {
      mapDraw(id);
      clearTimeout(restoreTimer);
      restoreTimer = setTimeout(
        () => {
          const s = progress();
          delete s.pendingRestoration;
          try {
            localStorage.setItem(
              "guardiao.mapa.progresso.v1",
              JSON.stringify(s),
            );
          } catch {}
          history.replaceState(null, "", location.pathname + "#mapa");
          if (R.won()) location.hash = "final";
          else mapDraw();
        },
        reduced() ? 300 : 2100,
      );
    } else if (
      R.won() &&
      localStorage.getItem("guardiao.raizes.final.v1") !== "visto"
    ) {
      clearTimeout(restoreTimer);
      restoreTimer = setTimeout(() => (location.hash = "final"), 900);
    }
  }
  function brief(id) {
    selected = id;
    const d = phases[id - 1];
    $("phase-number").textContent = "FASE " + id;
    $("phase-title").textContent = d.name;
    $("phase-npc").textContent = d.npc;
    $("phase-job").textContent = d.job;
    $("phase-situation").textContent = d.situation;
    $("phase-goals").innerHTML = d.goals
      .map((g) => "<li>" + R.icon("leaf") + "<span>" + g + "</span></li>")
      .join("");
    $("phase-items").textContent = d.items;
    $("phase-reward").innerHTML = GuardiaoRelicario.fragment(id - 1, true);
    $("phase-reward-copy").textContent = "Cristal " + d.color + " do colar";
    $("start-phase").href = new URL(
      id === 1
        ? "jogo/floresta-viva/index.html"
        : "jogo/jornada/index.html?fase=" + id,
      R.root,
    ).href;
    $("start-phase").textContent = unlocked(id)
      ? "Iniciar fase"
      : "Conclua a região anterior";
    $("start-phase").setAttribute("aria-disabled", String(!unlocked(id)));
    const bg = file(`jogo/renascimento/assets/${d.map}.webp`);
    document.querySelector(".phase-scene").style.backgroundImage =
      `url("${bg}")`;
    A.load(["npcs"]);
    $("phase-dialog").showModal();
  }
  function show() {
    const next = location.hash.slice(1).split("?")[0] || "inicio";
    view = ["inicio", "mapa", "sobre", "configuracoes", "final"].includes(next)
      ? next
      : "inicio";
    if (view === "final" && !R.won()) {
      location.replace("#mapa");
      return;
    }
    document.querySelectorAll("#app > [data-view]").forEach((el) => {
      el.hidden = el.dataset.view !== view;
      el.classList.toggle("entering", !el.hidden && !reduced());
    });
    document.body.dataset.view = view;
    $("back-home").hidden = view === "inicio";
    $("back-home").innerHTML = R.icon("back") + "Início";
    if ($("phase-dialog").open) $("phase-dialog").close();
    clearTimeout(restoreTimer);
    if (view === "mapa") {
      mapDraw();
      maybeRestore();
      const line = $("flora-map-line");
      line.textContent = "Cada cuidado fortalece a Árvore Guardiã.";
      line.hidden = false;
      clearTimeout(captionTimer);
      captionTimer = setTimeout(() => (line.hidden = true), 4500);
    }
    if (view === "sobre" && activeAbout === "comandos") A.load(["kai"]);
    if (view === "final") window.RaizesCinema?.start();
    else window.RaizesCinema?.stop();
    document.title =
      (view === "inicio"
        ? "Guardião da Natureza"
        : {
            mapa: "Mapa das fases",
            sobre: "Sobre o jogo",
            configuracoes: "Configurações",
            final: "A Árvore Guardiã",
          }[view]) + " · Jornada de Kai";
  }
  function biome(i) {
    const d = biomes[i];
    $("biome-title").textContent = d[0];
    $("biome-copy").textContent = d[1];
    $("biome-friend").textContent = d[2];
    document
      .querySelectorAll("[data-biome]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(Number(b.dataset.biome) === i)),
      );
  }
  const demo = {
    x: 0.5,
    y: 0.82,
    direction: 6,
    movingUntil: 0,
    actionUntil: 0,
  };
  function demoMove(dx, dy) {
    demo.x = Math.max(0.2, Math.min(0.8, demo.x + dx * 0.06));
    demo.y = Math.max(0.65, Math.min(0.9, demo.y + dy * 0.03));
    demo.direction = (Math.round(-Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8;
    demo.movingUntil = time + 0.8;
    A.load(["kai"]);
  }
  function render(now) {
    raf = requestAnimationFrame(render);
    if (
      now - last < 33 ||
      document.hidden ||
      window.GuardiaoOrientacao?.blocked
    )
      return;
    last = now;
    time = now / 1000;
    if (!ready) return;
    if (view === "inicio")
      A.canvas($("home-actors"), (c, w, h) => {
        const hh = h * 0.56,
          x = w * 0.835,
          y = h * 0.865,
          breathe = reduced() ? 0 : Math.sin(time * 1.4) * 1.3;
        A.draw(c, "acoes", 0, x, y + breathe, hh, { flip: true });
        A.owl(
          c,
          x + hh * 0.13,
          y - hh * 0.62 + breathe,
          hh * 0.2,
          time,
          "ombro",
          true,
        );
      });
    if (view === "mapa") {
      A.canvas($("map-flora"), (c, w, h) => {
        A.owl(
          c,
          w * 0.48,
          h * 0.91,
          h * 0.7,
          time,
          time % 9 > 7.8 ? "fala" : "ombro",
          true,
        );
      });
      A.canvas($("map-kai"), (c, w, h) => {
        const completed = progress().completed;
        if (!reduced()) {
          c.save();
          c.lineWidth = 0.8;
          c.strokeStyle = "#b0e4e376";
          for (let i = 0; i < 9; i++) {
            const x = w * (0.05 + ((i * 137) % 89) / 100),
              y = h * (0.87 + (i % 3) * 0.025),
              r = 4 + ((time * 5 + i * 3) % 18);
            c.globalAlpha = 1 - r / 24;
            c.beginPath();
            c.ellipse(x, y, r, r * 0.24, 0, 0, Math.PI * 2);
            c.stroke();
          }
          if (!completed.includes(1))
            for (let i = 0; i < 13; i++) {
              const k = (time * 0.18 + i * 0.27) % 1;
              c.globalAlpha = (1 - k) * 0.8;
              c.fillStyle = i % 2 ? "#f2b45f" : "#eb7846";
              c.beginPath();
              c.arc(
                w * (0.72 + (i % 5) * 0.033) + Math.sin(time + i) * 3,
                h * (0.24 - k * 0.14),
                1.5,
                0,
                Math.PI * 2,
              );
              c.fill();
            }
          c.restore();
        }
        const d = phases[(progress().current || 1) - 1],
          x = (w * d.region[0]) / 100,
          y = (h * d.region[1]) / 100 - 57;
        c.fillStyle = "#305a39";
        c.strokeStyle = "#edce7a";
        c.lineWidth = 3;
        c.beginPath();
        c.arc(x, y, 19, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.save();
        c.beginPath();
        c.arc(x, y, 17, 0, Math.PI * 2);
        c.clip();
        A.draw(c, "acoes", 1, x, y + 78, 102);
        c.restore();
        c.fillStyle = "#e4c77d";
        c.beginPath();
        c.moveTo(x - 5, y + 21);
        c.lineTo(x + 5, y + 21);
        c.lineTo(x, y + 29);
        c.fill();
      });
    }
    if (view === "sobre") {
      A.canvas($("about-friends"), (c, w, h) => {
        const hh = Math.min(h * 0.81, w * 1.4);
        A.draw(c, "acoes", 1, w * 0.47, h * 0.94, hh);
        A.owl(
          c,
          w * 0.63,
          h * 0.94 - hh * 0.67,
          hh * 0.23,
          time,
          "ombro",
          true,
        );
      });
      if (activeAbout === "comandos")
        A.canvas($("how-kai"), (c, w, h) => {
          const hh = Math.min(h * 0.69, 160),
            x = w * demo.x,
            y = h * demo.y;
          c.fillStyle = "#214b3333";
          c.beginPath();
          c.ellipse(x, y, hh * 0.25, hh * 0.07, 0, 0, Math.PI * 2);
          c.fill();
          if (time < demo.actionUntil) A.draw(c, "acoes", 7, x, y, hh);
          else if (time < demo.movingUntil)
            A.draw(
              c,
              "kai",
              demo.direction * 2 + (reduced() ? 0 : Math.floor(time * 7) % 2),
              x,
              y,
              hh,
            );
          else A.draw(c, "acoes", 1, x, y, hh);
          A.owl(c, x + hh * 0.35, y - hh * 0.6, hh * 0.23, time, "voo", true);
        });
    }
    if (view === "configuracoes")
      A.canvas($("settings-flora"), (c, w, h) =>
        A.owl(c, w * 0.5, h * 0.9, h * 0.69, time, "ombro", false),
      );
    if ($("phase-dialog").open)
      A.canvas($("phase-conversation"), (c, w, h) => {
        const hh = Math.min(h * 0.76, w * 0.65),
          y = h * 0.92 - 29;
        A.draw(c, "acoes", 0, w * 0.28, y, hh * 0.84);
        A.draw(
          c,
          "npcs",
          selected - 1 + (reduced() ? 0 : Math.sin(time * 0.8) > 0.6 ? 5 : 0),
          w * 0.71,
          y,
          hh,
        );
        A.owl(c, w * 0.36, y - hh * 0.58, hh * 0.22, time, "voo", true);
      });
  }
  function init() {
    setIcon("play-game", "leaf");
    setIcon("about-game", "book");
    $("settings-game").innerHTML = R.icon("gear");
    $("close-phase").innerHTML = R.icon("close");
    R.bindSettings($("settings-form"));
    $("back-home").onclick = () => (location.hash = "inicio");
    $("phase-back").onclick = () => $("phase-dialog").close();
    $("close-phase").onclick = () => $("phase-dialog").close();
    $("start-phase").onclick = (e) => {
      if (!unlocked(selected)) {
        e.preventDefault();
        R.notice("Complete a região anterior para continuar.");
      }
    };
    $("map-hotspots").onclick = (e) => {
      const b = e.target.closest("[data-phase]");
      if (b) brief(Number(b.dataset.phase));
    };
    $("map-reset").onclick = R.askReset;
    $("reset-journey").onclick = R.askReset;
    $("ending-restart").onclick = R.askReset;
    $("replay-ending").onclick = () => (location.hash = "final");
    $("defaults-settings").onclick = () => {
      R.save({
        music: true,
        musicVolume: 40,
        effects: true,
        effectsVolume: 60,
        reduceMotion: false,
        largeText: false,
        contextHints: true,
        leftHanded: false,
        controlMode: "auto",
        controlSize: 0,
      });
      $("settings-form").replaceWith($("settings-form").cloneNode(false));
      R.bindSettings($("settings-form"));
    };
    document.querySelector(".about-tabs").onclick = (e) => {
      const b = e.target.closest("[data-about-tab]");
      if (!b) return;
      activeAbout = b.dataset.aboutTab;
      document
        .querySelectorAll("[data-about-tab]")
        .forEach((t) => t.setAttribute("aria-selected", String(t === b)));
      document
        .querySelectorAll("[data-about-panel]")
        .forEach((p) => (p.hidden = p.dataset.aboutPanel !== activeAbout));
      $("about-content").scrollTop = 0;
      if (activeAbout === "comandos") A.load(["kai"]);
    };
    document.querySelector(".about-tabs").addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      const tabs = [...document.querySelectorAll("[data-about-tab]")],
        i = tabs.indexOf(e.target);
      if (i < 0) return;
      e.preventDefault();
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : 4)) % tabs.length];
      next.click();
      next.focus();
    });
    $("five-care").innerHTML = phases
      .map((d) => `<article>${R.icon(d.icon)}<h3>${d.name}</h3></article>`)
      .join("");
    $("about-necklace").innerHTML = GuardiaoRelicario.necklace(
      [1, 2, 3, 4, 5],
      "about",
    );
    $("biome-tabs").innerHTML = biomes
      .map(
        (d, i) =>
          `<button type="button" data-biome="${i}" aria-pressed="${i === 0}">${d[0]}</button>`,
      )
      .join("");
    $("biome-tabs").onclick = (e) => {
      const b = e.target.closest("[data-biome]");
      if (b) biome(Number(b.dataset.biome));
    };
    biome(0);
    $("nature-advice").textContent = advice[0];
    $("next-advice").onclick = () =>
      ($("nature-advice").textContent = advice[++adviceIndex % advice.length]);
    $("how-kai").addEventListener("keydown", (e) => {
      const moves = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        w: [0, -1],
        a: [-1, 0],
        s: [0, 1],
        d: [1, 0],
      };
      if (moves[e.key]) {
        e.preventDefault();
        demoMove(...moves[e.key]);
      }
      if (e.key === "Enter") {
        e.preventDefault();
        demo.actionUntil = time + 1.4;
      }
    });
    $("how-kai").addEventListener("pointerdown", (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      demoMove(e.clientX < r.x + r.width / 2 ? -1 : 1, 0);
      demo.actionUntil = 0;
    });
    const motes = document.querySelector(".sun-motes");
    for (let i = 0; i < 10; i++) {
      const leaf = document.createElement("i");
      leaf.style.cssText = `left:${(i * 17) % 100}%;top:-20px;animation-delay:-${i * 1.3}s;animation-duration:${12 + (i % 4) * 2}s`;
      motes.append(leaf);
    }
    A.load(["acoes", "flora"])
      .then(() => {
        ready = true;
        document.body.dataset.uiReady = "true";
      })
      .catch(() => R.notice("Uma imagem não carregou. Atualize a página."));
    show();
    raf = requestAnimationFrame(render);
  }
  window.addEventListener("hashchange", show);
  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(raf);
    clearTimeout(restoreTimer);
    clearTimeout(captionTimer);
  });
  window.addEventListener("storage", (e) => {
    if (e.key === "guardiao.mapa.progresso.v1" && view === "mapa") mapDraw();
  });
  window.RaizesApp = { phases, show, progress, view: () => view };
  document.addEventListener("DOMContentLoaded", init, { once: true });
})();
