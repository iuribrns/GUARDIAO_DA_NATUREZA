import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
const plan = JSON.parse(
  readFileSync("desenvolvimento/organizacao/plano.json", "utf8"),
);
const manifest = JSON.parse(
  readFileSync("desenvolvimento/viva/publicacao.json", "utf8"),
);
const hash = (file) =>
  createHash("sha256").update(readFileSync(file)).digest("hex");
const compare = process.argv.includes("--comparar-originais");
for (const entry of plan.arquivados) {
  assert.ok(
    existsSync(entry.arquivo),
    "material preservado: " + entry.original,
  );
  assert.equal(
    hash(entry.arquivo),
    entry.sha256,
    "conteúdo histórico: " + entry.original,
  );
  if (compare)
    assert.equal(
      existsSync(entry.original),
      false,
      "material já foi movido: " + entry.original,
    );
}
let originals = 0;
for (const entry of plan.ativos) {
  const same = existsSync(entry.file) && hash(entry.file) === entry.sha256;
  if (same) originals++;
  if (compare)
    assert.ok(same, "recurso do jogo permanece idêntico: " + entry.file);
}
for (const file of manifest.files)
  assert.ok(
    existsSync(manifest.generated?.includes(file) ? "dist/" + file : file),
    "recurso publicado: " + file,
  );
if (compare)
  assert.deepEqual(
    manifest.files,
    [...plan.ativos.map((p) => p.file)].sort(),
    "publicação contém somente o fluxo aprovado",
  );
assert.equal(
  manifest.files.some((p) =>
    /^(?:arquivo|desenvolvimento|node_modules|test-results)\//.test(p),
  ),
  false,
);
console.log(
  `PASS: ${plan.arquivados.length} arquivos históricos preservados byte a byte; ${originals} recursos originais permanecem idênticos; ${manifest.files.length} arquivos publicados.`,
);
console.log(
  `Site: ${plan.antes.arquivos} → ${manifest.files.length} arquivos; ${(plan.antes.bytes / 1048576).toFixed(2)} → ${(manifest.bytes / 1048576).toFixed(2)} MiB. Mover materiais não apaga o histórico nem altera a jogabilidade.`,
);
