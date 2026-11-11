// Publica as entradas atuais, o código alcançável e os recursos dos atlas.
// O histórico não é uma dependência da compilação.
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, relative, extname } from "node:path";
const root = resolve("."),
  catalog = JSON.parse(
    readFileSync("desenvolvimento/organizacao/recursos.json", "utf8"),
  ),
  keep = new Set();
function add(file) {
  file = file.replace(/^\/+/, "");
  if (
    file.startsWith("arquivo/") ||
    file.startsWith("desenvolvimento/") ||
    file.startsWith("node_modules/") ||
    file.startsWith("..")
  )
    throw Error("Caminho fora do site: " + file);
  if (!existsSync(file) || !statSync(file).isFile())
    throw Error("Recurso ausente: " + file);
  keep.add(file);
}
for (const f of [...catalog.entries, ...catalog.assets]) add(f);
const seen = new Set();
for (;;) {
  const pending = [...keep].filter(
    (f) => !seen.has(f) && [".html", ".css", ".js"].includes(extname(f)),
  );
  if (!pending.length) break;
  for (const f of pending) {
    seen.add(f);
    const content = readFileSync(f, "utf8"),
      references = [];
    if (f.endsWith(".html"))
      references.push(...content.matchAll(/\b(?:src|href)=["']([^"']+)["']/g));
    if (/\.(?:html|css)$/.test(f))
      references.push(...content.matchAll(/url\(["']?([^"')\s]+)["']?\)/g));
    if (f.endsWith(".css"))
      references.push(...content.matchAll(/@import\s+["']([^"']+)["']/g));
    if (f.endsWith(".js"))
      references.push(
        ...content.matchAll(/["']([^"'\n]+\.js(?:\?[^"']*)?)["']/g),
      );
    for (const m of references) {
      const value = m[1];
      if (!value || /^(?:[a-z]+:|#|\/\/)/i.test(value)) continue;
      const url = value.split(/[?#]/)[0];
      if (!url) continue;
      if (url.startsWith("/"))
        throw Error("Use caminho relativo em " + f + ": " + url);
      const target = relative(
        root,
        resolve(
          f.endsWith(".js") && url.startsWith("jogo/") ? root : dirname(f),
          decodeURIComponent(url),
        ),
      );
      add(target);
    }
  }
}
const files = [...keep].sort(),
  bytes = files.reduce((n, f) => n + statSync(f).size, 0);
writeFileSync(
  "desenvolvimento/viva/publicacao.json",
  JSON.stringify({ version: 3, files, bytes }, null, 2) + "\n",
);
console.log(
  `${files.length} arquivos; ${(bytes / 1048576).toFixed(2)} MiB; arquivo histórico fora do site.`,
);
