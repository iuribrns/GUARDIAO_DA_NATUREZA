"use strict";
(() => {
  const $ = (id) => document.getElementById(id),
    panel = $("controls");
  function device(mode) {
    document
      .querySelectorAll("[data-help-device]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.helpDevice === mode)),
      );
    document
      .querySelectorAll("[data-help-for]")
      .forEach((e) => (e.hidden = e.dataset.helpFor !== mode));
  }
  document
    .querySelectorAll("[data-help-device]")
    .forEach((b) =>
      b.addEventListener("click", () => device(b.dataset.helpDevice)),
    );
  device(matchMedia("(pointer:coarse)").matches ? "touch" : "keyboard");
  const biomes = {
    amazonia: [
      "Amazônia",
      "Árvores, rios e chuvas formam uma grande rede de vida. Uma floresta protegida também ajuda a cuidar da água.",
      "Tucanos, peixes e muitos outros animais!",
    ],
    atlantica: [
      "Mata Atlântica",
      "Esta floresta tem muitas espécies que só vivem nela. Proteger e conectar seus trechos ajuda os animais a circular.",
      "O mico-leão-dourado é um de seus moradores.",
    ],
    cerrado: [
      "Cerrado",
      "Árvores de raízes profundas e campos guardam uma enorme diversidade. As nascentes também precisam de proteção.",
      "Lobo-guará e tamanduás encontram abrigo por lá.",
    ],
    caatinga: [
      "Caatinga",
      "Muitas plantas guardam água ou perdem folhas na estação seca. Elas estão adaptadas ao clima; isso não significa que o ambiente esteja morto.",
      "Asa-branca e tatu-bola fazem parte dessa história.",
    ],
    pantanal: [
      "Pantanal",
      "As cheias e as secas transformam esta grande área úmida. A água conecta a vida dos campos, rios e matas.",
      "Capivaras, tuiuiús e peixes dividem este lugar.",
    ],
    pampa: [
      "Pampa",
      "Campos naturais também são natureza. Suas plantas, aves e outros animais precisam de espaço e proteção.",
      "Veado-campeiro e muitas aves vivem nesses campos.",
    ],
  };
  document.querySelectorAll("[data-biome]").forEach((b) =>
    b.addEventListener("click", () => {
      const [name, description, friend] = biomes[b.dataset.biome];
      $("biome-name").textContent = name;
      $("biome-description").textContent = description;
      $("biome-friend").textContent = friend;
      document
        .querySelectorAll("[data-biome]")
        .forEach((t) => t.setAttribute("aria-pressed", String(t === b)));
    }),
  );
  document.querySelectorAll("[data-nature-answer]").forEach((b) =>
    b.addEventListener("click", () => {
      $("nature-feedback").textContent =
        b.dataset.natureAnswer === "care"
          ? "Isso! A muda precisa de água na medida certa, proteção e acompanhamento."
          : "O lixo pode atrapalhar a planta. Vamos tentar a outra opção?";
    }),
  );
  // Render a complete approved Kai pose rather than an arbitrary rectangle of the source sheet.
  let raf = 0,
    loaded = false;
  const canvas = $("demo-kai");
  function tick(time) {
    raf = 0;
    if (panel.hidden || document.hidden || !loaded) return;
    const reduced =
      matchMedia("(prefers-reduced-motion:reduce)").matches ||
      document.body.classList.contains("reduce-motion");
    const c = canvas.getContext("2d");
    c.clearRect(0, 0, canvas.width, canvas.height);
    GuardiaoAtores.fit(
      c,
      "kai",
      !reduced && (time / 1000) % 4.6 > 4.35 ? 7 : 6,
      canvas.width,
      canvas.height,
      [6, 7],
      5,
    );
    raf = requestAnimationFrame(tick);
  }
  function start() {
    if (!panel.hidden && !document.hidden) {
      if (!loaded) {
        GuardiaoAtores.load(["kai"])
          .then(() => {
            loaded = true;
            if (!raf) raf = requestAnimationFrame(tick);
          })
          .catch(() => {});
      } else if (!raf) raf = requestAnimationFrame(tick);
    }
  }
  new MutationObserver(() => {
    cancelAnimationFrame(raf);
    raf = 0;
    start();
  }).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
  document.addEventListener("visibilitychange", () => {
    cancelAnimationFrame(raf);
    raf = 0;
    start();
  });
  start();
  // Retain the accepted portraits, with sharper rendering and balanced full-body framing.
  for (const c of document.querySelectorAll(".student-actor canvas")) {
    c.width = 440;
    c.height = 800;
  }
})();
