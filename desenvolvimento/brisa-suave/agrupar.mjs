// Agrupa scripts clássicos sem alterar a ordem nem a origem dos caminhos de arte.
// Não requer bibliotecas extras, inclusive na compilação do GitHub Pages.
import { readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { resolve, dirname, relative, posix } from "node:path";
import { createHash } from "node:crypto";
import { Script } from "node:vm";
export function combine(htmlFile, html, read) {
  const sources = [
    ...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>\s*<\/script>/g),
  ];
  const selected = sources.filter(
    (m) =>
      /\bdefer\b/.test(m[0]) &&
      !/\btype=|\basync\b/.test(m[0]) &&
      !/^(?:[a-z]+:|\/\/)/i.test(m[1]),
  );
  const chunks = selected.map((m) => {
    const file = posix.normalize(
      posix.join(posix.dirname(htmlFile), m[1].split(/[?#]/)[0]),
    );
    if (file.startsWith("../")) throw Error("Script fora do projeto: " + file);
    const source = read(file);
    // Cada módulo continua resolvendo imagens/Workers a partir do seu arquivo original.
    const current =
      "({src:new URL(" + JSON.stringify(m[1]) + ",document.baseURI).href})";
    return (
      "\n;/* " +
      file +
      " */\n" +
      source.replaceAll("document.currentScript", current) +
      "\n"
    );
  });
  const code = '"use strict";\n' + chunks.join("");
  new Script(code, { filename: htmlFile + " agrupado" });
  const hash = createHash("sha256").update(code).digest("hex").slice(0, 12);
  const name = posix.basename(posix.dirname(htmlFile)) + "-" + hash + ".js";
  const file = "jogo/brisa-suave/compilados/" + name;
  const link = posix.relative(posix.dirname(htmlFile), file);
  let first = true;
  const chosen = new Set(selected.map((m) => m.index));
  const rewritten = html.replace(
    /<script\b[^>]*\bsrc="([^"]+)"[^>]*>\s*<\/script>/g,
    (match, _src, offset) => {
      if (!chosen.has(offset)) return match;
      if (!first) return "";
      first = false;
      return (
        '<script src="' + link + '" defer data-guardiao-bundle="true"></script>'
      );
    },
  );
  return { file, code, html: rewritten, count: selected.length };
}
export function build() {
  const manifestFile = "desenvolvimento/viva/publicacao.json",
    manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
  const generated = [],
    report = [];
  for (const entry of [
    "jogo/viva/index.html",
    "jogo/floresta-viva/index.html",
    "jogo/jornada/index.html",
  ]) {
    const result = combine(
      entry,
      readFileSync("dist/" + entry, "utf8"),
      (file) => readFileSync(file, "utf8"),
    );
    mkdirSync(dirname(resolve("dist", result.file)), { recursive: true });
    writeFileSync(resolve("dist", result.file), result.code);
    writeFileSync("dist/" + entry, result.html);
    generated.push(result.file);
    report.push({
      entry,
      scriptsBefore: result.count,
      scriptsAfter: 1,
      bytes: Buffer.byteLength(result.code),
    });
  }
  manifest.generated = generated;
  manifest.files = [...new Set([...manifest.files, ...generated])].sort();
  manifest.bytes = manifest.files.reduce(
    (n, f) => n + statSync("dist/" + f).size,
    0,
  );
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
  mkdirSync("test-results/brisa-suave", { recursive: true });
  writeFileSync(
    "test-results/brisa-suave/agrupamento.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    "Entrada: " +
      report.map((r) => r.scriptsBefore + " → 1 scripts").join("; ") +
      ".",
  );
}
