"use strict";
(() => {
  const base = new URL("./", document.currentScript.src);
  const atlas = window.GuardiaoInterfaceAtlas;
  const previous = window.GuardiaoIcones;
  const images = new Map();
  const loading = new Map();
  const tools = {
    hand: "luvas",
    seeds: "sementes",
    watering: "regador",
    bag: "mochila",
    net: "rede",
    rope: "corda",
    key: "chave",
    shovel: "pa",
  };
  let serial = 0;
  function spec(name, equipment = false) {
    const aliases = {
      saco: "mochila",
      veterinario: "kit",
      mudas: "sementes",
      jardim: "pa",
      reciclagem: "mochila",
    };
    const key = equipment ? aliases[name] || name : tools[name] || name;
    const group = equipment || tools[name] ? "ferramentas" : "simbolos";
    const sheet = atlas[group],
      index = sheet.keys[key];
    return index === undefined
      ? null
      : { group, sheet, frame: sheet.frames[index] };
  }
  async function sheet(name) {
    if (!loading.has(name))
      loading.set(
        name,
        (async () => {
          const d = atlas[name],
            im = new Image();
          im.src = new URL(d.file, base).href;
          await im.decode();
          if (im.naturalWidth !== d.width || im.naturalHeight !== d.height)
            throw Error("Prancha incompatível: " + name);
          images.set(name, im);
          return im;
        })(),
      );
    return loading.get(name);
  }
  function svg(name, equipment = false) {
    const d = spec(name, equipment);
    if (!d) return "";
    const b = d.frame.bounds,
      id = "viva-icon-" + ++serial;
    return `<svg viewBox="${b.join(" ")}" aria-hidden="true" overflow="hidden"><defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><rect x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}"/></clipPath></defs><image href="${new URL(d.sheet.file, base).href}" width="${d.sheet.width}" height="${d.sheet.height}" clip-path="url(#${id})"/></svg>`;
  }
  function markup(name) {
    if (name === "jump")
      return `<span class="ui-icon viva-icon" aria-hidden="true"><img src="${new URL("../../assets/interface/kai-pulando.png", base).href}" alt=""></span>`;
    const picture = svg(name);
    return picture
      ? `<span class="ui-icon viva-icon" aria-hidden="true">${picture}</span>`
      : previous.markup(name);
  }
  function prepare(parent = document) {
    parent
      .querySelectorAll("[data-icon]")
      .forEach((e) => (e.innerHTML = markup(e.dataset.icon)));
  }
  async function load() {
    const [legacy] = await Promise.all([
      previous.load(),
      sheet("ferramentas"),
      sheet("simbolos"),
    ]);
    return legacy;
  }
  function paint(ctx, legacy, name, x, y, size) {
    const d = spec(name),
      im = d && images.get(d.group);
    if (!im) return previous.paint(ctx, legacy, name, x, y, size);
    const b = d.frame.bounds,
      k = size / Math.max(b[2], b[3]);
    ctx.drawImage(
      im,
      ...b,
      x - (b[2] * k) / 2,
      y - (b[3] * k) / 2,
      b[2] * k,
      b[3] * k,
    );
  }
  window.GuardiaoIcones = Object.freeze({
    ...previous,
    markup,
    prepare,
    load,
    paint,
    draw: async (ctx, name, x, y, size) =>
      paint(ctx, await load(), name, x, y, size),
  });
  if (window.GuardiaoColecao) {
    const collection = window.GuardiaoColecao;
    window.GuardiaoColecao = Object.freeze({
      ...collection,
      item: (name) =>
        name === "mudas"
          ? window.GuardiaoColecao.plant("ipê")
          : svg(name, true) || collection.item(name),
      uniform(name) {
        const markup = collection.uniform(name);
        const template = document.createElement("template");
        template.innerHTML = markup;
        const node = template.content.querySelector("svg"),
          image = node?.querySelector("image");
        if (!image) return markup;
        const b = node.viewBox.baseVal,
          id = "viva-outfit-" + ++serial;
        image.setAttribute("clip-path", `url(#${id})`);
        node.insertAdjacentHTML(
          "afterbegin",
          `<defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}"/></clipPath></defs>`,
        );
        return node.outerHTML;
      },
    });
  }
  window.GuardiaoArtesInterface = Object.freeze({
    svg,
    load: () => Promise.all([sheet("ferramentas"), sheet("simbolos")]),
  });
  document.body.classList.add("interface-viva");
  prepare();
})();
