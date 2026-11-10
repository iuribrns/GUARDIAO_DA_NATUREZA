// Publica o fluxo atual e suas dependências, preservando os caminhos do Pages.
import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  statSync,
} from "node:fs";
import { resolve, dirname, relative } from "node:path";
const root = resolve("."),
  keep = new Set(),
  add = (f) => {
    f = f.replace(/^\//, "");
    if (existsSync(resolve(root, f)) && statSync(resolve(root, f)).isFile())
      keep.add(f);
  };
for (const file of [
  "index.html",
  "tela-inicial/index.html",
  "tela-inicial/nova-versao/index.html",
  "tela-inicial/nova-versao/aventura.html",
  "tela-inicial/nova-versao/configuracoes.html",
  "tela-inicial/nova-versao/sobre.html",
  "tela-inicial/renascimento/creditos.html",
  "jogo/raizes/index.html",
  "jogo/floresta-viva/index.html",
  "jogo/jornada/index.html",
  "assets/identidade-flora/flora-32.png",
  "assets/itens-remodelados/kai/01_mangueira.png",
  ".nojekyll",
])
  add(file);
for (const log of [
  "/tmp/raizes-requests-pc.json",
  "/tmp/raizes-requests-mobile.json",
  "/tmp/raizes-requests-interface.json",
])
  if (existsSync(log))
    for (const file of JSON.parse(readFileSync(log))) add(file);
for (const folder of [
  "jogo/raizes",
  "jogo/raizes/assets",
  "jogo/encanto-natural/assets",
])
  for (const f of readdirSync(folder)) {
    if (/\.(js|css|json|webp|mp4|mp3)$/.test(f)) add(folder + "/" + f);
  }
const optimized = readFileSync("jogo/cuidado-acessivel/otimizados.js", "utf8");
for (const m of optimized.matchAll(/:\s*"([^"]+)"/g)) add(m[1]);
const seen = new Set();
for (;;) {
  const todo = [...keep].filter((f) => /\.(html|css)$/.test(f) && !seen.has(f));
  if (!todo.length) break;
  for (const f of todo) {
    seen.add(f);
    const text = readFileSync(f, "utf8");
    const references = [
      ...text.matchAll(/\b(?:src|href)=["']([^"']+)["']/g),
      ...text.matchAll(/(?:url\(|@import\s+)["']?([^\s"')]+)["']?\)?/g),
    ];
    for (const m of references) {
      const url = m[1].split(/[?#]/)[0];
      if (!url || /^(?:[a-z]+:|\/\/|\/)/i.test(url)) continue;
      add(relative(root, resolve(dirname(f), decodeURIComponent(url))));
    }
  }
}
const files = [...keep].sort(),
  bytes = files.reduce((n, f) => n + statSync(f).size, 0);
writeFileSync(
  "desenvolvimento/raizes/publicacao.json",
  JSON.stringify({ version: 1, files, bytes }, null, 2) + "\n",
);
console.log(
  files.length +
    " arquivos, " +
    (bytes / 1048576).toFixed(2) +
    " MiB no jogo atual",
);
