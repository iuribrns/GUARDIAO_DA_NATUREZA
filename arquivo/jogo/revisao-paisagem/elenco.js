"use strict";
(() => {
  const positions = {
    1: [
      [330, 300],
      [265, 470],
    ],
    2: [
      [221, 228],
      [1000, 560],
    ],
    3: [
      [486, 278],
      [640, 604],
    ],
    4: [
      [436, 179],
      [810, 576],
    ],
    5: [
      [555, 430],
      [780, 518],
      [550, 368],
      [952, 477],
    ],
  };
  const habitats = {
    mico: { x: 746, y: 159 },
    tucano: { x: 1040, y: 270 },
    passaro: { x: 769, y: 211 },
    capivara: { x: 1052, y: 310 },
    onca: { x: 877, y: 575 },
    arara: { x: 703, y: 109 },
    tamandua: { x: 620, y: 626 },
    anta: { x: 1063, y: 402 },
    preguica: { x: 489, y: 144 },
  };
  function actors(phase, time = 0, ratio = 0, reduced = false) {
    return (positions[phase] || []).map(([x, y], i) => {
      const row = phase === 5 ? i : [1, 3][i],
        moving = phase === 5 && row === 2 && ratio >= 1;
      const xx = moving && !reduced ? 400 + ((time * 24) % 470) : x;
      const stage = ratio >= 1 ? 3 : ratio > 0 ? 2 : 0;
      return {
        id: "vizinho-" + i,
        row,
        x: xx,
        y,
        height: 56,
        solid: row !== 2,
        frame:
          row * 4 +
          (stage === 3
            ? reduced
              ? 3
              : 2 + (Math.floor(time * 4 + i) % 2)
            : stage),
      };
    });
  }
  window.GuardiaoElenco = Object.freeze({
    actors,
    habitat: (name) => habitats[name] && { ...habitats[name] },
  });
})();
