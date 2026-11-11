import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  statSync,
} from "node:fs";
import { resolve, dirname, relative } from "node:path";
const root = resolve("."),
  old = JSON.parse(readFileSync("desenvolvimento/raizes/publicacao.json")),
  keep = new Set(),
  omit = new Set([
    "assets/itens-remodelados/kai/01_mangueira.png",
    "assets/identidade-flora/flora-32.png",
    "assets/interface/kai-pulando.png",
    "tela-inicial/jornada-viva/assets/festa-da-floresta.png",
    "jogo/floresta-viva/fase.css",
    "jogo/floresta-viva/revisao/interface.css",
    "jogo/raizes/app.js",
    "jogo/raizes/ui.css",
    "jogo/raizes/comum.js",
    "jogo/raizes/painel-jogo.js",
    "jogo/raizes/cinema.js",
    "jogo/raizes/assets/capa.webp",
    "jogo/raizes/assets/arvore-guardia.mp4",
    "jogo/revisao-paisagem/interface.js",
    "jogo/sistemas/icones.js",
    "jogo/novo-amanha/icones.js",
    "jogo/interface-viva/artes.js",
  ]);
function add(f) {
  f = f.replace(/^\//, "");
  if (!omit.has(f) && existsSync(f) && statSync(f).isFile()) keep.add(f);
}
old.files.forEach(add);
for (const dir of [
  "jogo/viva",
  "jogo/viva/assets",
  "jogo/brisa",
  "jogo/brisa/assets",
  "jogo/sereno",
  "jogo/sereno/assets",
])
  for (const f of readdirSync(dir))
    if (/\.(html|js|css|webp|json)$/.test(f)) add(dir + "/" + f);
const seen = new Set();
for (;;) {
  const todo = [...keep].filter((f) => /\.(html|css)$/.test(f) && !seen.has(f));
  if (!todo.length) break;
  for (const f of todo) {
    seen.add(f);
    const text = readFileSync(f, "utf8");
    for (const m of [
      ...text.matchAll(/\b(?:src|href)=["']([^"']+)["']/g),
      ...text.matchAll(/(?:url\(|@import\s+)["']?([^\s"')]+)["']?\)?/g),
    ]) {
      const url = m[1].split(/[?#]/)[0];
      if (!url || url === "url(" || /^(?:[a-z]+:|\/\/|\/)/i.test(url)) continue;
      const target = relative(
        root,
        resolve(dirname(f), decodeURIComponent(url)),
      );
      if (omit.has(target)) throw Error(f + " ainda depende de " + target);
      add(target);
    }
  }
}
const files = [...keep].sort(),
  bytes = files.reduce((s, f) => s + statSync(f).size, 0);
writeFileSync(
  "desenvolvimento/viva/publicacao.json",
  JSON.stringify({ version: 2, files, bytes }, null, 2) + "\n",
);
console.log(
  files.length +
    " arquivos; " +
    (bytes / 1048576).toFixed(2) +
    " MiB; sem vídeo nem laboratório no site.",
);
