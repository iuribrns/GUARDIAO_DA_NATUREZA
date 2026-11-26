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
// Conserva a ordem da cascata e resolve cada imagem/fonte a partir de seu CSS.
// O navegador recebe uma folha de estilos em vez de dezenas de pedidos bloqueantes.
export function combineStyles(htmlFile, html, read) {
  const selected = [
    ...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/g),
  ].filter(
    (m) =>
      /\bhref="(?![a-z]+:|\/\/)[^"]+"/i.test(m[0]) &&
      !/\bmedia=|\bdisabled\b/.test(m[0]),
  );
  const folder = "jogo/brisa-suave/compilados";
  function sheet(file, parents = []) {
    if (parents.includes(file)) throw Error("Importação circular: " + file);
    const css = read(file);
    // Resolver os imports no lugar preserva sua posição na cascata e evita
    // mais uma rodada de rede ao abrir a Floresta em Chamas.
    const imports = [];
    const source = css.replace(
      /@import\s+url\(\s*['"]?([^)'"\s]+)['"]?\s*\)\s*([^;]*);/gi,
      (_, href, media) => {
        if (/^(?:[a-z]+:|\/)/i.test(href))
          throw Error("Importação externa: " + href);
        const imported = posix.normalize(
          posix.join(posix.dirname(file), href.split(/[?#]/)[0]),
        );
        const content = sheet(imported, [...parents, file]);
        imports.push(
          media.trim() ? "@media " + media + "{\n" + content + "\n}" : content,
        );
        return "/* guardiao-import-" + (imports.length - 1) + " */";
      },
    );
    const resolved = source.replace(
      /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi,
      (match, a, b, c) => {
        const raw = a ?? b ?? c;
        if (!raw || /^(?:[a-z]+:|\/|#)/i.test(raw)) return match;
        const url = new URL(raw, "https://guardiao.invalid/" + file);
        return (
          "url(" +
          JSON.stringify(
            posix.relative(folder, url.pathname.slice(1)) +
              url.search +
              url.hash,
          ) +
          ")"
        );
      },
    );
    return (
      "/* " +
      file +
      " */\n" +
      resolved.replace(
        /\/\* guardiao-import-(\d+) \*\//g,
        (_, n) => imports[Number(n)],
      )
    );
  }
  const code = selected
    .map((m) => {
      const href = m[0].match(/\bhref="([^"]+)"/)[1];
      const file = posix.normalize(
        posix.join(posix.dirname(htmlFile), href.split(/[?#]/)[0]),
      );
      return sheet(file);
    })
    .join("\n");
  const hash = createHash("sha256").update(code).digest("hex").slice(0, 12);
  const file =
    folder +
    "/" +
    posix.basename(posix.dirname(htmlFile)) +
    "-" +
    hash +
    ".css";
  const chosen = new Set(selected.map((m) => m.index));
  let first = true;
  const rewritten = html.replace(
    /<link\b[^>]*\brel="stylesheet"[^>]*>/g,
    (match, offset) => {
      if (!chosen.has(offset)) return match;
      if (!first) return "";
      first = false;
      return (
        '<link rel="stylesheet" href="' +
        posix.relative(posix.dirname(htmlFile), file) +
        '" data-guardiao-styles="true">'
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
    const styles = combineStyles(entry, result.html, (file) =>
      readFileSync(file, "utf8"),
    );
    writeFileSync(resolve("dist", styles.file), styles.code);
    writeFileSync("dist/" + entry, styles.html);
    generated.push(result.file, styles.file);
    report.push({
      entry,
      scriptsBefore: result.count,
      scriptsAfter: 1,
      bytes: Buffer.byteLength(result.code),
      stylesBefore: styles.count,
      stylesAfter: 1,
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
