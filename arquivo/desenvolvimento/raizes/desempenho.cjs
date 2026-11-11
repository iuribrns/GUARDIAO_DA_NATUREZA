const vm = require("vm"),
  fs = require("fs"),
  { performance } = require("perf_hooks");
const root = process.cwd();
function bench(modern) {
  const w = { window: {}, structuredClone };
  vm.createContext(w);
  const read = (f) =>
    vm.runInContext(fs.readFileSync(root + "/" + f, "utf8"), w);
  for (const f of [
    "jogo/vida-natural/movimento.js",
    ...(modern
      ? ["jogo/raizes/caminhos.js", "jogo/raizes/navegacao.js"]
      : ["jogo/revisao-paisagem/navegacao.js"]),
    "jogo/jornada/fases.js",
    "jogo/novo-amanha/conteudo.js",
    "jogo/vida-em-equilibrio/conteudo.js",
    "jogo/cuidado-acessivel/elenco.js",
    "jogo/floresta-viva/mundo.js",
  ])
    read(f);
  w.GuardiaoElenco = w.window.GuardiaoElenco;
  w.GuardiaoFasesJogaveis = w.window.GuardiaoFasesJogaveis;
  read("jogo/cuidado-acessivel/geometria.js");
  read(
    modern
      ? "jogo/raizes/floresta-colisao.js"
      : "jogo/cuidado-acessivel/floresta-colisao.js",
  );
  const results = [];
  for (let phase = 2; phase <= 5; phase++) {
    const data = w.GuardiaoFasesJogaveis[phase],
      nav = new w.window.GuardiaoNavegacao.Navigation({
        ...data,
        obstacles: [...data.obstacles, { ...data.npcPosition, rx: 12, ry: 9 }],
      });
    nav.setDynamic(data.tasks.filter((t) => t.type === "cage"));
    const start = performance.now();
    let paths = 0;
    for (let round = 0; round < 4; round++)
      for (const t of data.tasks)
        if (nav.approach(data.start, t, 46).length) paths++;
    results.push({
      phase,
      paths,
      ms: Math.round((performance.now() - start) * 10) / 10,
    });
  }
  return results;
}
const result = { baseline: bench(false), raizes: bench(true) };
fs.writeFileSync(
  "desenvolvimento/raizes/desempenho.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(result);
