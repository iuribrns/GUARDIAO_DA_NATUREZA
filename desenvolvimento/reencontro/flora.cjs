const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
const draws = [],
  w = {
    RaizesPersonagens: { atlas: {}, draw: (...args) => draws.push(args) },
    GuardiaoFloraEncanto: { frames: Array.from({ length: 16 }, () => ({})) },
    GuardiaoVidaNatural: class {
      constructor(phase) {
        this.phase = phase;
      }
    },
    document: { body: { classList: { contains: () => false }, dataset: {} } },
    GuardiaoFasesJogaveis: {
      2: { npcPosition: { x: 290, y: 198 } },
      3: { npcPosition: { x: 330, y: 207 } },
    },
  };
w.window = w;
vm.createContext(w);
vm.runInContext(fs.readFileSync("jogo/reencontro/companheira.js", "utf8"), w);
for (let direction = 0; direction < 8; direction++) {
  const p = { x: 680, y: 400, direction, moving: false, idle: 4 },
    f = { x: 610, y: 305, mode: "voando", elapsed: 0 };
  for (let i = 0; i < 400; i++)
    w.FloraCompanheira.update(f, p, 1 / 60, {
      phase: 3,
      busy: false,
      reward: false,
    });
  assert.equal(f.mode, "ombro");
  assert.ok(
    Math.hypot(
      f.x - w.FloraCompanheira.shoulder(p, 3).x,
      f.y - w.FloraCompanheira.shoulder(p, 3).y,
    ) < 0.1,
  );
  const start = { ...f };
  p.moving = true;
  p.idle = 0;
  p.x += 2;
  w.FloraCompanheira.update(f, p, 1 / 60, {
    phase: 3,
    busy: false,
    reward: false,
  });
  assert.equal(f.mode, "decolando");
  assert.ok(
    Math.hypot(f.x - start.x, f.y - start.y) < 10,
    "sem teletransporte na decolagem",
  );
  const life = new w.GuardiaoVidaNatural(3),
    count = draws.length;
  life.flora({}, f, p, 1, false);
  assert.equal(draws.length - count, 1, "uma Flora por quadro");
}
const p = { x: 680, y: 440, direction: 0, moving: false, idle: 6 },
  f = { x: 620, y: 350, mode: "voando", elapsed: 0 };
for (let i = 0; i < 400; i++)
  w.FloraCompanheira.update(f, p, 1 / 60, {
    phase: 2,
    busy: false,
    reward: false,
  });
assert.equal(f.mode, "voando", "Flora permanece voando durante a fase do rio");
console.log(
  "PASS: pouso nas oito direções, decolagem sem salto, uma Flora por quadro e voo contínuo no rio.",
);
