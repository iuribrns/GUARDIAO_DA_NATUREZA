const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
const draws = [],
  views = [
    [0, false],
    [1, false],
    [2, false],
    [1, true],
    [0, true],
    [3, false],
    [4, false],
    [3, true],
  ];
const w = {
  URL,
  URLSearchParams,
  performance: { now: () => 0 },
  location: { pathname: "/jogo/jornada/", search: "?fase=2" },
  document: {
    currentScript: {
      src: "https://example.org/jogo/brisa-suave/personagens.js",
    },
    body: { dataset: {}, classList: { contains: () => false } },
  },
  RaizesPersonagens: { atlas: {}, draw: (...args) => draws.push(args) },
  BosqueKaiAtlas: { protecao: {} },
  BosqueKai: {
    load: async () => {},
    pose: (p) => ({
      row: views[p.direction][0],
      flip: views[p.direction][1],
      step: 1,
    }),
    walk: () => true,
  },
  GuardiaoVidaNatural: class {
    constructor(phase) {
      this.phase = phase;
    }
    draw() {}
  },
  GuardiaoAdventureArt: class {
    async load() {}
    river() {}
  },
  FloraCompanheira: { direction: (p) => p.direction },
  Image: class {
    decode() {
      return Promise.resolve();
    }
  },
};
w.window = w;
vm.createContext(w);
vm.runInContext(fs.readFileSync("jogo/brisa-suave/atlas.js", "utf8"), w);
vm.runInContext(fs.readFileSync("jogo/brisa-suave/personagens.js", "utf8"), w);
const life = new w.GuardiaoVidaNatural(3),
  f = { x: 10, y: 20, mode: "ombro", elapsed: 1 };
for (let direction = 0; direction < 8; direction++)
  for (const mode of ["voando", "pousando", "decolando", "ombro"]) {
    f.mode = mode;
    const before = draws.length;
    life.flora({}, f, { direction }, 2, false);
    assert.equal(draws.length - before, 1, "uma Flora por quadro");
    const call = draws.at(-1),
      row = Math.floor(call[2] / 8);
    assert.equal(row, views[direction][0]);
    if (direction === 2)
      assert.ok(
        call[2] >= 16 && call[2] <= 23,
        "costas completas, sem pose de lado",
      );
    if (mode === "ombro")
      assert.equal(call[2] % 8, 6, "asas dobradas na direção de Kai");
  }
assert.equal(w.BrisaSuaveAtlas.protecao.frames.length, 30);
assert.equal(w.BrisaSuaveAtlas.flora.frames.length, 40);
assert.equal(w.BrisaSuaveAtlas.rio.frames.length, 32);
assert.equal(w.BrisaSuaveAtlas.parado.frames.length, 25);
console.log(
  "PASS: Flora nas oito direções durante voo, pouso e decolagem; 127 novas poses de personagens.",
);
(async () => {
  const art = new w.GuardiaoAdventureArt();
  art.phase = 2;
  await art.load();
  const c = {
    canvas: { id: "cenario" },
    save() {},
    restore() {},
    translate() {},
    scale() {},
    drawImage(...args) {
      draws.push(args);
    },
    beginPath() {},
    ellipse() {},
    clip() {},
    stroke() {},
  };
  for (let direction = 0; direction < 8; direction++) {
    const pose = art.river(
      c,
      { x: 100, y: 200, direction, moving: true, swimming: true },
      1,
      false,
      {},
    );
    assert.match(pose, /nado-natureza/);
    const index = Number(pose.split(":")[1]);
    assert.equal(Math.floor(index / 4), views[direction][0]);
  }
  assert.match(
    art.river(c, { x: 100, y: 200, direction: 0 }, 1, false, {
      kind: "desprender",
      problem: "plastic",
      progress: 0.5,
    }),
    /^libertar-no-habitat:/,
  );
  for (const uniform of [
    "explorador",
    "protecao",
    "resgate",
    "plantio",
    "voluntario",
  ]) {
    w.GuardiaoMemoria = { read: () => ({ uniform }) };
    for (let direction = 0; direction < 8; direction++) {
      assert.equal(
        art.outfit(c, { x: 100, y: 200, direction, moving: false }, 1, false),
        true,
      );
      assert.equal(w.document.body.dataset.kaiUniform, uniform);
      assert.equal(w.document.body.dataset.heroDirection, String(direction));
    }
  }
  console.log(
    "PASS: poses paradas nos cinco uniformes e nas oito direções, sem congelar um passo da caminhada.",
  );
  console.log(
    "PASS: traje, nado, retirada de redes/plástico e direção das costas usam a mesma arte.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
