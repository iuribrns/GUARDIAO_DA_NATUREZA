import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import vm from "node:vm";
const root = fileURLToPath(new URL("../../", import.meta.url));
const output = resolve(root, "desenvolvimento/arte-natural/mapas");
await mkdir(output, { recursive: true });
const context = { window: {}, console };
vm.createContext(context);
for (const file of [
  "jogo/vida-natural/movimento.js",
  "jogo/floresta-viva/mundo.js",
  "jogo/floresta-viva/revisao/navegacao.js",
  "jogo/jornada/fases.js",
])
  vm.runInContext(await readFile(resolve(root, file), "utf8"), context);
const w = context.window.FlorestaMundo;
const phases = [
  {
    id: 1,
    map: "floresta",
    obstacles: w.obstacles,
    targets: w.animals,
    start: { x: 286, y: 260 },
    zones: w.zones,
  },
  ...Object.values(context.window.GuardiaoFasesJogaveis),
];
const sx = 1672 / 1280,
  sy = 941 / 720;
for (const phase of phases) {
  let next = 1;
  const polygon = (name, points) => ({
    id: next++,
    name,
    type: "limite",
    x: 0,
    y: 0,
    polygon: points.map(([x, y]) => ({ x: x * sx, y: y * sy })),
    visible: true,
  });
  const objects = phase.obstacles.map((item, i) => {
    if (item.polygon)
      return polygon(item.name || "obstáculo " + i, item.polygon);
    const e = item.ellipse || item;
    return {
      id: next++,
      name: item.name || "obstáculo " + i,
      type: "solido",
      ellipse: true,
      x: (e.x - e.rx) * sx,
      y: (e.y - e.ry) * sy,
      width: e.rx * 2 * sx,
      height: e.ry * 2 * sy,
      visible: true,
    };
  });
  const paths = phase.floor
    ? [polygon("Limite caminhável", phase.floor)]
    : (phase.zones || []).map((p, i) => polygon("Clareira " + (i + 1), p));
  const markers = [
    { ...phase.start, name: "Entrada de Kai" },
    ...(phase.tasks || phase.targets),
  ].map((t) => ({
    id: next++,
    name: t.name || t.id,
    type: "objetivo",
    point: true,
    x: t.x * sx,
    y: t.y * sy,
    visible: true,
  }));
  const map = {
    type: "map",
    version: "1.10",
    tiledversion: "1.12.2",
    orientation: "orthogonal",
    renderorder: "right-down",
    infinite: false,
    width: 53,
    height: 30,
    tilewidth: 32,
    tileheight: 32,
    nextlayerid: 5,
    nextobjectid: next,
    properties: [
      { name: "largura-logica", type: "int", value: 1280 },
      { name: "altura-logica", type: "int", value: 720 },
      {
        name: "uso",
        type: "string",
        value:
          "Referência de inspeção. Runtime: movimento.js + navegação de cada fase.",
      },
    ],
    layers: [
      {
        id: 1,
        name: "Cenário com luz",
        type: "imagelayer",
        image: `../../../jogo/vida-natural/assets/${phase.map}-inicio.webp`,
        x: 0,
        y: 0,
        opacity: 1,
        visible: true,
      },
      {
        id: 2,
        name: "Sólidos nos pés",
        type: "objectgroup",
        color: "#ff6888",
        opacity: 0.55,
        visible: true,
        objects,
      },
      {
        id: 3,
        name: "Áreas caminháveis",
        type: "objectgroup",
        color: "#6ecf98",
        opacity: 0.2,
        visible: true,
        objects: paths,
      },
      {
        id: 4,
        name: "Entrada e objetivos",
        type: "objectgroup",
        color: "#fae297",
        visible: true,
        objects: markers,
      },
    ],
  };
  const source = resolve(output, phase.map + ".tmj"),
    exported = resolve(output, phase.map + ".json");
  await writeFile(source, JSON.stringify(map, null, 2) + "\n");
  execFileSync(
    resolve(
      process.env.GUARDIAO_TOOLS_DIR || "/workspace/.tools/guardiao",
      "bin/tiled",
    ),
    ["--export-map", "json", source, exported],
    { stdio: "pipe" },
  );
  const verified = JSON.parse(await readFile(exported, "utf8"));
  await writeFile(exported, JSON.stringify(verified, null, 2) + "\n");
  if (verified.layers.length !== 4)
    throw Error("Camadas ausentes: " + phase.map);
  console.log(
    "Tiled:",
    phase.map,
    "—",
    objects.length,
    "sólidos e",
    markers.length,
    "marcadores exportados.",
  );
}
