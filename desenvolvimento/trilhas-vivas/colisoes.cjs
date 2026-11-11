"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm");
const root = path.resolve(__dirname, "../.."),
  w = { window: {}, structuredClone };
vm.createContext(w);
function read(f) {
  vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), w, {
    filename: f,
  });
}
for (const f of [
  "jogo/vida-natural/movimento.js",
  "jogo/raizes/caminhos.js",
  "jogo/raizes/navegacao.js",
  "jogo/jornada/fases.js",
  "jogo/novo-amanha/conteudo.js",
  "jogo/vida-em-equilibrio/conteudo.js",
  "jogo/cuidado-acessivel/elenco.js",
  "jogo/floresta-viva/mundo.js",
])
  read(f);
w.GuardiaoElenco = w.window.GuardiaoElenco;
w.GuardiaoFasesJogaveis = w.window.GuardiaoFasesJogaveis;
read("jogo/viva/elenco.js");
w.GuardiaoElenco = w.window.GuardiaoElenco;
w.GuardiaoFasesJogaveis = w.window.GuardiaoFasesJogaveis;
read("jogo/cuidado-acessivel/geometria.js");
w.GuardiaoFasesJogaveis = w.window.GuardiaoFasesJogaveis;
read("jogo/reencontro/conteudo.js");
w.GuardiaoFasesJogaveis = w.window.GuardiaoFasesJogaveis;
read("jogo/bosque-vivo/pintura.js");
w.BosquePintura = w.window.BosquePintura;
read("jogo/bosque-vivo/configuracao.js");
w.GuardiaoNavegacao = w.window.GuardiaoNavegacao;
w.GuardiaoFasesJogaveis = w.window.GuardiaoFasesJogaveis;
read("jogo/mata-ilustrada/layout.js");
w.MataLayout = w.window.MataLayout;
read("jogo/trilhas-vivas/disposicao.js");
read("jogo/mata-ilustrada/configuracao.js");
read("jogo/reencontro/geometria.js");
w.GuardiaoFasesJogaveis = w.window.GuardiaoFasesJogaveis;
read("jogo/mata-ilustrada/geometria-floresta.js");
read("jogo/reencontro/cuidados.js");
const W = w.window.FlorestaMundo,
  g = w.window.GuardiaoMovimento;
const stuck = { x: 256.5687527170712, y: 489.5021612856038 },
  end = { x: 260, y: 508 };
assert.equal(W.walkable(stuck), true);
assert.equal(W.walkable({ x: 256.74031508121766, y: 490.4270532213236 }), true);
assert.equal(
  W.visible(stuck, end),
  true,
  "a borda invisível da pintura anterior foi retirada do chão livre",
);
const route = W.route(stuck, end);
assert.ok(route.length > 0);
let pos = { ...stuck };
for (const p of route) {
  for (let i = 0; i < 150 && W.distance(pos, p) > 1; i++) {
    const d = W.distance(pos, p),
      dx = (p.x - pos.x) / d,
      dy = (p.y - pos.y) / d;
    assert.ok(
      g.move(pos, dx, dy, W.walkable) > 0,
      "a rota da capivara precisa ser executável pela colisão real",
    );
  }
}
assert.ok(W.distance(pos, end) < 2);
assert.equal(W.walkable({ x: 377, y: 356 }), false, "reservatório sólido");
assert.equal(W.walkable({ x: 575, y: 405 }), true, "travessia pela ponte");
assert.equal(W.walkable({ x: 575, y: 325 }), false, "rio fora da ponte");
const { Navigation } = w.window.GuardiaoNavegacao,
  phases = w.window.GuardiaoFasesJogaveis;
for (let id = 2; id <= 5; id++) {
  const data = phases[id],
    nav = new Navigation({
      ...data,
      obstacles: [...data.obstacles, { ...data.npcPosition, rx: 12, ry: 9 }],
    });
  assert.ok(nav.walkable(data.start), "início válido da fase " + id);
  assert.equal(
    w.GuardiaoElenco.actors(id).length,
    0,
    "sem moradores extras ou colisores invisíveis",
  );
  for (const a of w.GuardiaoElenco.actors(id).filter((a) => a.solid)) {
    assert.equal(nav.walkable(a), false, "pé do morador sólido");
    assert.ok(
      Math.hypot(a.x - data.start.x, a.y - data.start.y) > 30,
      "morador fora do ponto de início",
    );
  }
  nav.setDynamic(data.tasks.filter((t) => t.type === "cage"));
  for (const t of data.tasks) {
    const p = nav.approach(data.start, t, 46);
    assert.ok(p.length, "objetivo alcançável " + id + ":" + t.id);
    assert.ok(
      Math.hypot(p.at(-1).x - t.x, p.at(-1).y - t.y) <= 47,
      "interação ao alcance",
    );
    let previous = data.start;
    for (const q of p) {
      assert.ok(
        nav.visible(previous, q),
        "todos os trechos respeitam as colisões",
      );
      previous = q;
    }
    if (t.speciesKey || ["fish", "turtle"].includes(t.type)) {
      const beside = w.window.GuardiaoCuidados.approach(p.at(-1), t, nav);
      if (beside) {
        assert.ok(
          nav.visible(p.at(-1), beside),
          "aproximação para cuidar sem atravessar obstáculos",
        );
        assert.ok(
          nav.route(p.at(-1), beside).length,
          "pose lateral alcançável",
        );
      }
    }
  }
  // Simule a colisão real com o passo do jogador, inclusive nas curvas.
  let moving = { ...data.start };
  const remaining = [...data.tasks];
  while (remaining.length) {
    remaining.sort(
      (a, b) =>
        Math.hypot(a.x - moving.x, a.y - moving.y) -
        Math.hypot(b.x - moving.x, b.y - moving.y),
    );
    const target = remaining.shift(),
      path = nav.approach(moving, target, 46);
    assert.ok(path.length, "rota sequencial " + id + ":" + target.id);
    for (const q of path) {
      for (
        let tick = 0;
        tick < 3000 && Math.hypot(q.x - moving.x, q.y - moving.y) > 0.1;
        tick++
      ) {
        const d = Math.hypot(q.x - moving.x, q.y - moving.y),
          step = Math.min(125 * 0.016, d);
        assert.ok(
          g.move(
            moving,
            ((q.x - moving.x) / d) * step,
            ((q.y - moving.y) / d) * step,
            (p) => nav.walkable(p),
          ) > 0,
          "curva executável " + id + ":" + target.id,
        );
      }
      assert.ok(
        Math.hypot(q.x - moving.x, q.y - moving.y) < 0.11,
        "chegada ao ponto sem cortar quina",
      );
    }
    assert.ok(
      Math.hypot(moving.x - target.x, moving.y - target.y) < 47,
      "chegada para interagir",
    );
  }
  if (id === 2) {
    for (const t of data.tasks.filter((t) => t.type === "fish")) {
      assert.ok(t.problem === "plastic" || t.problem === "net");
      for (let i = 0; i <= 20; i++) {
        const p = {
          x: t.x + ((t.home.x - t.x) * i) / 20,
          y: t.y + ((t.home.y - t.y) * i) / 20,
        };
        assert.ok(
          nav.swimming(p),
          "o peixe continua na água depois do resgate: " + t.id,
        );
      }
    }
    const turtle = data.tasks.find((t) => t.type === "turtle");
    assert.equal(nav.swimming(turtle), false, "tartaruga começa na margem");
    assert.equal(
      nav.swimming({ x: 350, y: 420 }),
      true,
      "água coincide com a margem desenhada",
    );
    assert.equal(nav.swimming({ x: 350, y: 260 }), false, "píer seco");
    assert.equal(nav.swimming({ x: 600, y: 180 }), false, "ponte seca");
    assert.equal(nav.walkable({ x: 405, y: 371 }), false, "rocha/ilha sólida");
    assert.equal(
      nav.walkable({ x: 458, y: 396 }),
      true,
      "retirado obstáculo invisível no rio",
    );
  }
  if (id === 3) {
    assert.equal(
      data.tasks.filter((t) => t.speciesKey).length,
      9,
      "nove espécies para resgatar",
    );
    assert.ok(
      data.tasks
        .filter((t) => t.speciesKey)
        .every((t) => t.problem && t.problemLabel),
      "problemas visíveis antes do cuidado",
    );
    for (const t of data.tasks.filter((t) => t.speciesKey)) {
      nav.setDynamic(
        data.tasks.filter((c) => c.type === "cage" && c.id !== t.id),
      );
      const home = w.GuardiaoElenco.habitat(t.speciesKey);
      assert.ok(nav.walkable(home), "habitat fora da cerca: " + t.speciesKey);
      const path = nav.route(t, home);
      assert.ok(
        path.length,
        "animal consegue chegar ao habitat: " + t.speciesKey,
      );
      assert.ok(
        Math.hypot(path.at(-1).x - home.x, path.at(-1).y - home.y) < 2,
        "rota chega ao habitat sem teletransporte",
      );
    }
    nav.setDynamic([]);
    assert.equal(nav.walkable({ x: 866, y: 136 }), false, "cerca sólida");
    assert.equal(
      nav.interactionVisible({ x: 866, y: 110 }, { x: 866, y: 170 }),
      false,
      "sem resgate através da cerca",
    );
    assert.equal(
      nav.walkable({ x: 945, y: 153 }),
      true,
      "abertura do cercado livre",
    );
  }
  if (id === 4)
    assert.equal(nav.walkable({ x: 308, y: 307 }), false, "fonte sólida");
  if (id === 5) {
    assert.equal(
      nav.walkable({ x: 1120, y: 530 }),
      false,
      "canal sólido para quem não nada",
    );
    assert.equal(
      nav.walkable({ x: 1150, y: 410 }),
      true,
      "ponte da cidade acessível",
    );
    assert.equal(
      nav.walkable({ x: 865, y: 450 }),
      false,
      "canteiro circular respeitado",
    );
  }
}
console.log(
  "PASS: quina real do resgate da capivara, rota executável sem travamento, reservatório, ponte, rochas, píer, cercas, portões, fonte, moradores e canal urbano; todos os objetivos alcançáveis.",
);
