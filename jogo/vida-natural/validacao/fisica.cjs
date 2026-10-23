"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "../../..");
const world = { window: {}, console };
vm.createContext(world);
for (const file of [
  "jogo/vida-natural/movimento.js",
  "jogo/jornada/navegacao.js",
  "jogo/jornada/fases.js",
  "jogo/floresta-viva/mundo.js",
  "jogo/floresta-viva/revisao/navegacao.js",
])
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), world, {
    filename: file,
  });
const g = world.window.GuardiaoMovimento;
// Circle fixtures have exact independent answers, including an oblique contact.
for (const a of [0, Math.PI / 8, Math.PI / 4, Math.PI / 3, Math.PI / 2]) {
  assert.equal(
    g.touchesEllipse(
      { x: Math.cos(a) * 16.9, y: Math.sin(a) * 16.9 },
      { x: 0, y: 0, rx: 10, ry: 10 },
      7,
    ),
    true,
  );
  assert.equal(
    g.touchesEllipse(
      { x: Math.cos(a) * 17.1, y: Math.sin(a) * 17.1 },
      { x: 0, y: 0, rx: 10, ry: 10 },
      7,
    ),
    false,
  );
}
assert.equal(
  g.touchesEllipse({ x: 46.9, y: 0 }, { x: 0, y: 0, rx: 40, ry: 12 }, 7),
  true,
);
assert.equal(
  g.touchesEllipse({ x: 0, y: 19.1 }, { x: 0, y: 0, rx: 40, ry: 12 }, 7),
  false,
);
let player = { x: 10, y: 0 };
g.move(player, 100, 0, (p) => p.x < 24 || p.x > 26);
assert.ok(player.x < 24, "a 2px wall blocks a 100px movement; no tunnelling");
player = { x: 0, y: 0 };
g.move(player, 30, 30, (p) => p.x < 10);
assert.ok(
  player.x < 10 && Math.abs(player.y - 30) < 1e-6,
  "slides along a wall without losing the free axis",
);
assert.equal(
  g.move(player, NaN, 0, () => true),
  0,
);
const { Navigation } = world.window.GuardiaoNavegacao;
for (const id of [2, 3, 4, 5]) {
  const data = world.window.GuardiaoFasesJogaveis[id],
    nav = new Navigation(data);
  assert.ok(nav.walkable(data.start), "spawn livre na fase " + id);
  for (const t of data.tasks) {
    const route = nav.approach(data.start, t, 55);
    assert.ok(route.length, "objetivo alcançável: " + id + " / " + t.id);
    let from = data.start;
    for (const to of route) {
      assert.ok(
        nav.visible(from, to),
        "segmento completo livre: " + id + " / " + t.id,
      );
      from = to;
    }
  }
}
const forest = world.window.FlorestaMundo;
assert.equal(
  forest.walkable({ x: 377, y: 356 }),
  false,
  "o reservatório é sólido",
);
assert.equal(
  forest.walkable({ x: 575, y: 405 }),
  true,
  "o centro da ponte fica livre",
);
assert.equal(
  forest.walkable({ x: 575, y: 363 }),
  false,
  "a água fora da ponte não é chão",
);
assert.ok(
  forest.route({ x: 470, y: 405 }, { x: 680, y: 405 }).length,
  "travessia tem uma rota",
);
console.log(
  "PASS: contato oblíquo, círculo e elipse completos, parede fina, deslizamento, entradas inválidas, objetivos das quatro fases, reservatório, ponte e rio.",
);
