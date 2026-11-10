import { readFile, mkdir, cp, rm } from "node:fs/promises";
import { resolve, dirname } from "node:path";
const root = resolve("."),
  dist = resolve(root, "dist"),
  manifest = JSON.parse(
    await readFile("desenvolvimento/viva/publicacao.json", "utf8"),
  );
await rm(dist, { recursive: true, force: true });
for (const f of manifest.files) {
  const src = resolve(root, f),
    out = resolve(dist, f);
  if (!src.startsWith(root + "/") || !out.startsWith(dist + "/"))
    throw Error("Caminho fora da publicação: " + f);
  await mkdir(dirname(out), { recursive: true });
  await cp(src, out);
}
console.log(
  "Site estático pronto em dist/: " + manifest.files.length + " arquivos.",
);
