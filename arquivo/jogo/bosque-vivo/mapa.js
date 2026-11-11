"use strict";
(() => {
  const P = BosquePintura,
    centres = [
      [800, 130],
      [835, 310],
      [760, 440],
      [280, 420],
      [240, 130],
    ];
  const coast = [
    [74, 103],
    [168, 66],
    [300, 69],
    [389, 95],
    [501, 57],
    [613, 74],
    [742, 61],
    [872, 96],
    [943, 151],
    [932, 223],
    [967, 307],
    [933, 381],
    [897, 433],
    [817, 487],
    [714, 508],
    [624, 488],
    [539, 515],
    [451, 500],
    [359, 519],
    [260, 499],
    [172, 468],
    [100, 425],
    [53, 358],
    [68, 280],
    [47, 204],
  ];
  let canvas,
    done = [],
    restoring = 0,
    started = 0,
    final = 0,
    trees = [],
    now = 0;
  const terrain = {};
  function setup() {
    canvas = document.createElement("canvas");
    canvas.id = "living-island";
    canvas.setAttribute(
      "aria-label",
      "Uma ilha viva: árvores crescem e a água clareia com cada cuidado",
    );
    BosqueVegetacao.load().catch(() => {});
    document.querySelector(".map-stage").prepend(canvas);
    document.getElementById("island-ash")?.remove();
    const r = P.random(637);
    for (let i = 0; i < 260; i++) {
      const x = 80 + r() * 850,
        y = 105 + r() * 380;
      if (
        !P.inside({ x, y }, coast) ||
        Math.hypot(x - 510, (y - 280) * 0.9) < 86
      )
        continue;
      if (centres.some(([cx, cy]) => Math.hypot(x - cx, (y - cy) * 1.6) < 68))
        continue;
      const region = centres
        .map(([cx, cy], id) => ({ id: id + 1, d: Math.hypot(x - cx, y - cy) }))
        .sort((a, b) => a.d - b.d)[0].id;
      trees.push({ x, y, h: 26 + r() * 22, region, seed: i });
    }
    trees.sort((a, b) => a.y - b.y);
  }
  function update(ids, active = 0, seen = false) {
    if (!canvas) setup();
    done = [...ids];
    if (active && active !== restoring) {
      started = performance.now() / 1000;
      restoring = active;
    }
    if (!ids.includes(restoring)) restoring = 0;
    final = seen ? 1 : window.VivaFinal?.active ? final : 0;
    document.body.dataset.mapRenderer = "elementos";
  }
  function health(id, x, y, reduced) {
    if (!done.includes(id)) return 0;
    if (id !== restoring || reduced) return 1;
    const [cx, cy] = centres[id - 1],
      delay = Math.hypot(x - cx, y - cy) / 190;
    return P.ease((performance.now() / 1000 - started - delay) / 3.5);
  }
  function paint(time, reduced) {
    if (!canvas) return;
    now = time;
    VivaArt.canvas(canvas, (c, w, h) => {
      c.save();
      c.scale(w / 1000, h / 563);
      const sea = c.createLinearGradient(0, 0, 0, 563);
      sea.addColorStop(0, "#56bfc3");
      sea.addColorStop(0.55, "#318f9c");
      sea.addColorStop(1, "#276979");
      c.fillStyle = sea;
      c.fillRect(0, 0, 1000, 563);
      for (let i = 0; i < 52; i++) {
        const x = (i * 171.3 + (reduced ? 0 : time * 2)) % 1000,
          y = (i * 79.1) % 563;
        P.line(
          c,
          [
            [x, y],
            [x + 10 + (i % 4) * 3, y],
          ],
          "#cae9d34a",
          1,
        );
      }
      c.save();
      c.translate(0, 9);
      P.smoothPoly(c, coast);
      c.fillStyle = "#436b61";
      c.fill();
      c.restore();
      P.smoothPoly(c, coast);
      c.strokeStyle = "#eed9a3";
      c.lineWidth = 12;
      c.stroke();
      c.save();
      P.smoothPoly(c, coast);
      c.clip();
      P.terrain(
        c,
        terrain,
        1000,
        563,
        (x, y) => {
          const region = centres
            .map(([cx, cy], id) => ({
              id: id + 1,
              d: Math.hypot(x - cx, y - cy),
            }))
            .sort((a, b) => a.d - b.d)[0].id;
          return health(region, x, y, reduced);
        },
        time,
      );
      const r = P.random(75);
      for (let i = 0; i < 440; i++) {
        const x = r() * 1000,
          y = r() * 563;
        P.oval(
          c,
          x,
          y,
          1 + r() * 2,
          0.6 + r(),
          i % 2 ? "#eee0a633" : "#3a43221a",
        );
      }
      // The paths and river are geometry, shared with the animated finale route.
      for (const points of [
        [
          [251, 150],
          [288, 173],
          [320, 196],
          [342, 224],
          [360, 254],
          [396, 286],
          [422, 313],
          [452, 326],
        ],
        [
          [452, 326],
          [617, 330],
          [746, 430],
        ],
        [
          [452, 326],
          [340, 400],
          [275, 420],
        ],
        [
          [510, 260],
          [637, 166],
          [790, 130],
        ],
        [
          [637, 166],
          [773, 255],
          [830, 310],
        ],
      ]) {
        P.line(c, points, "#a68b59", 20);
        P.line(c, points, "#dfc58c", 13);
      }
      const river = [
        [686, 123],
        [723, 136],
        [700, 191],
        [750, 221],
        [791, 249],
        [821, 291],
        [875, 324],
        [882, 381],
        [868, 395],
        [846, 355],
        [798, 327],
        [775, 285],
        [740, 251],
        [689, 224],
        [669, 181],
      ];
      P.water(c, river, health(2, 830, 310, reduced), time, reduced, 8);
      P.bridge(c, [
        [720, 217],
        [766, 237],
        [759, 251],
        [713, 232],
      ]);
      // City repairs change details on the same buildings, not a replacement landscape.
      for (const [i, x] of [178, 217, 262, 295].entries()) {
        P.house(c, x, 134 + (i % 2) * 19, 32, 32, true);
        const g = health(5, x, 140, reduced);
        if (g > 0) {
          P.oval(c, x + 17, 143, 8 * g, 4 * g, "#759c50");
          P.line(
            c,
            [
              [x - 9, 106],
              [x + 6, 103],
            ],
            "#459caa",
            3 * g,
          );
        }
      }
      // Each region keeps its own landmarks while its vegetation grows in place.
      for (const [x, y] of [
        [196, 348],
        [315, 363],
        [347, 426],
      ]) {
        const g = health(4, x, y, reduced);
        if (g < 0.7)
          BosqueVegetacao.draw(c, "objetos", 5, x, y, 14 * (1 - g * 0.4));
        if (g > 0.01) P.tree(c, x, y, 34 * g, g, time, x, reduced);
      }
      c.save();
      c.translate(798, 395);
      c.scale(0.5, 0.5);
      P.fence(c, [-120, 0], [-20, 0]);
      P.fence(c, [35, 0], [145, 0]);
      P.fence(c, [-120, 0], [-120, 55]);
      P.fence(c, [145, 0], [145, 55]);
      if (health(3, 798, 395, reduced) < 0.7) {
        P.line(
          c,
          [
            [-55, -2],
            [-55, -29],
            [-12, -29],
            [-12, -2],
          ],
          "#7d6b3e",
          4,
        );
        for (let x = -47; x < -12; x += 8)
          P.line(
            c,
            [
              [x, -2],
              [x, -28],
            ],
            "#ac995a",
            2,
          );
      }
      c.restore();
      for (const t of trees)
        P.tree(
          c,
          t.x,
          t.y,
          t.h,
          health(t.region, t.x, t.y, reduced),
          time,
          t.seed,
          reduced,
        );
      for (const [i, x, y] of [
        [0, 724, 205],
        [1, 898, 203],
        [2, 905, 111],
      ])
        if (!done.includes(1)) P.flame(c, x, y, 24, reduced ? 0 : time, i);
      // The old central tree unfolds its own branches and leaves in the ending.
      const strength = (done.length / 5) * 0.16 + final * 0.84;
      P.tree(c, 510, 300, 165, strength, time, 810, reduced);
      P.oval(c, 510, 305, 53, 12, "#334a2b33");
      for (let i = 0; i < 9; i++) {
        const a = i * 2.399,
          g = final;
        if (g > 0.01)
          P.leaf(
            c,
            510 + Math.cos(a) * 55,
            305 + Math.sin(a) * 20,
            8 * g,
            a,
            "#a2c65c",
          );
      }
      c.restore();
      // Thin moving foam keeps the complete coast readable.
      c.save();
      c.globalAlpha = 0.24 + (reduced ? 0 : Math.sin(time * 0.7) * 0.08);
      P.smoothPoly(c, coast);
      c.strokeStyle = "#e4f4dc";
      c.lineWidth = 2;
      c.stroke();
      c.restore();
      c.restore();
    });
  }
  function finalGrowth(amount) {
    final = P.ease(amount);
  }
  window.BosqueMapa = {
    update,
    paint,
    finalGrowth,
    state: () => ({
      renderer: "elementos",
      trees: trees.length,
      completed: done,
      restoring,
      finalGrowth: final,
      bitmapReplacements: 0,
      time: now,
    }),
    health,
  };
})();
