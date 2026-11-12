const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
const draws = [];
const w = {
  window: null,
  document: { body: { dataset: {}, classList: { contains: () => false } } },
  RaizesPersonagens: {
    atlas: {},
    draw: (...args) => draws.push(args),
    load: async () => {},
  },
  VivaArt: {},
  GuardiaoVidaAtlas: {},
  FloraCompanheira: { direction: (p) => p.direction },
  GuardiaoVidaNatural: class {
    async load() {}
    draw() {}
  },
};
w.window = w;
vm.createContext(w);
for (const file of ["atlas", "personagens"])
  vm.runInContext(fs.readFileSync("jogo/arte-viva/" + file + ".js", "utf8"), w);
const life = new w.GuardiaoVidaNatural();
life.phase = 3;
for (let d = 0; d < 8; d++)
  for (const mode of ["voando", "pousando", "decolando", "ombro"]) {
    const n = draws.length;
    life.flora(
      {},
      { x: 20, y: 30, mode, elapsed: 1 },
      { direction: d },
      2,
      false,
    );
    assert.equal(draws.length, n + 1, "uma única Flora inteira por quadro");
    const f = draws.at(-1)[2],
      opts = draws.at(-1).at(-1);
    if (d === 2) assert.ok(f >= 16 && f <= 19, "costas de fato");
    if (d === 1 || d === 3)
      assert.ok(f >= 20 && f <= 23, "diagonais de costas");
    if (d === 0 || d === 4) assert.ok(f >= 24 && f <= 27, "perfil próprio");
    if (d >= 5)
      assert.ok(f < 16, "artes anteriores preservadas nas vistas frontais");
    if (mode === "ombro" && d <= 4) assert.equal(f % 4, 3, "asas dobradas");
    assert.equal(opts.flip, [3, 4, 5].includes(d));
  }
for (const mode of ["ombro", "voo", "festa"]) {
  w.VivaArt.owl({}, 0, 0, 40, 2, mode);
  assert.ok(draws.at(-1)[2] < 16, "menus usam o rosto original");
}
assert.equal(w.ArteVivaAtlas.flora.frames.length, 28);
const catalog = JSON.parse(
  fs.readFileSync("desenvolvimento/organizacao/recursos.json", "utf8"),
);
for (const name of [
  "explorador",
  "protecao",
  "resgate",
  "plantio",
  "voluntario",
])
  assert.ok(
    catalog.assets.includes("jogo/reencontro/assets/" + name + ".webp"),
    "traje original publicado: " + name,
  );
for (const entry of ["viva", "jornada", "floresta-viva"]) {
  const s = fs.readFileSync("jogo/" + entry + "/index.html", "utf8");
  assert.ok(s.includes("arte-viva/personagens.js"));
  assert.ok(
    !s.includes("brisa-suave/personagens.js"),
    "nenhum traje ou idle redesenhado substitui o original",
  );
  assert.ok(s.includes("reencontro/quadros.js"), "recortes limpos preservados");
}
console.log(
  "PASS: aparência anterior preservada; Flora em oito direções, pouso, voo e comemoração sem duplicação.",
);
