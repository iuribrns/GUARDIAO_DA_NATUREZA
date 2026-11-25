import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
const root = resolve("dist"),
  manifest = JSON.parse(readFileSync("desenvolvimento/viva/publicacao.json"));
assert.match(
  readFileSync(resolve(root, "index.html"), "utf8"),
  /jogo\/viva\/index\.html/,
);
for (const file of manifest.files) {
  assert.ok(existsSync(resolve(root, file)), "arquivo publicado: " + file);
  if (!/\.(html|css)$/.test(file)) continue;
  const text = readFileSync(resolve(root, file), "utf8");
  for (const m of [
    ...text.matchAll(/\b(?:src|href)=["']([^"']+)["']/g),
    ...text.matchAll(/(?:url\(|@import\s+)["']?([^\s"')]+)["']?\)?/g),
  ]) {
    const url = m[1].split(/[?#]/)[0];
    if (!url || url === "url(" || /^(?:[a-z]+:|#|\/\/)/i.test(url)) continue;
    assert.ok(!url.startsWith("/"), "caminho relativo ao projeto: " + url);
    const target = resolve(root, dirname(file), decodeURIComponent(url));
    assert.ok(!relative(root, target).startsWith(".."));
    assert.ok(existsSync(target), file + " referencia " + url);
  }
}
const html = readFileSync(resolve(root, "jogo/viva/index.html"), "utf8");
assert.ok(!html.includes('data-phase="6"'));
assert.ok(html.includes("tree-restoration"));
assert.match(html, /<video[^>]*id="final-movie"/);
assert.match(html, /playsinline/);
assert.match(html, /preload="none"/);
assert.ok(html.includes("assets/cutscene-final-com-creditos.mp4"));
assert.ok(!html.includes('id="island-finale-caption"'));
for (const file of [".git", "node_modules", ".cache"])
  assert.equal(existsSync(resolve(root, file)), false);
const atlas = JSON.parse(
  readFileSync(resolve(root, "jogo/raizes/assets/atlas.json")),
);
for (const [name, sheet] of Object.entries(atlas)) {
  assert.ok(existsSync(resolve(root, "jogo/raizes", sheet.file)));
  for (const f of sheet.frames) {
    assert.ok(f.bounds[0] >= 0 && f.bounds[1] >= 0);
    assert.ok(
      f.bounds[0] + f.bounds[2] <= sheet.width &&
        f.bounds[1] + f.bounds[3] <= sheet.height,
      name + " quadro contido na prancha",
    );
  }
}
const sprites = { window: {} };
vm.runInNewContext(
  readFileSync("jogo/jornada-final/atlas.js", "utf8"),
  sprites,
);
for (const [name, sheet] of Object.entries(sprites.window.JornadaFinalAtlas)) {
  const target = resolve(root, "jogo/jornada-final", sheet.file);
  assert.ok(existsSync(target), "arte do retorno publicada: " + name);
  for (const frame of sheet.frames) {
    const [x, y, w, h] = frame.bounds;
    assert.ok(
      x >= 0 && y >= 0 && x + w <= sheet.width && y + h <= sheet.height,
      "recorte da arte: " + name,
    );
  }
}
assert.ok(html.includes('id="journey-return"'));
const bytes = manifest.files.reduce(
  (n, f) => n + statSync(resolve(root, f)).size,
  0,
);
console.log(
  "PASS: " +
    manifest.files.length +
    " arquivos publicados, " +
    (bytes / 1048576).toFixed(2) +
    " MiB; caminhos relativos, artes e quadros válidos, sem pastas privadas.",
);
