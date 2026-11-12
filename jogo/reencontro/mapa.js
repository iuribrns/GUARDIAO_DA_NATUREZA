"use strict";
(() => {
  const centres = [
    [800, 130],
    [835, 310],
    [760, 440],
    [280, 420],
    [240, 130],
  ];
  let canvas,
    land,
    done = [],
    restoring = 0,
    started = 0,
    final = 0,
    now = 0;
  const setup = () => {
    canvas = document.createElement("canvas");
    canvas.id = "living-island";
    canvas.setAttribute("aria-hidden", "true");
    canvas.width = 1500;
    canvas.height = 845;
    document.querySelector(".map-stage").prepend(canvas);
    document.getElementById("island-ash")?.remove();
    land = new GuardiaoPaisagem.Landscape("mapa", 1000, 563);
    land.ready.catch(() => {
      canvas.dataset.loadError = "true";
    });
  };
  function update(completed, id = 0) {
    if (!canvas) setup();
    const ids = completed.filter((id) => id >= 1 && id <= 5);
    if (ids.length < 5) final = 0;
    if (ids.join() !== done.join() || (id > 0 && restoring !== id)) {
      done = [...ids];
      restoring = id;
      started = performance.now() / 1000;
      land.signature = null;
    }
  }
  function health(id, x, y, reduced) {
    if (!done.includes(id)) return 0;
    if (id !== restoring || reduced) return 1;
    return GuardiaoPaisagem.ease(
      (performance.now() / 1000 -
        started -
        Math.hypot(x - centres[id - 1][0], y - centres[id - 1][1]) / 190) /
        3.5,
    );
  }
  function paint(time, reduced) {
    if (!canvas) setup();
    now = time;
    const c = canvas.getContext("2d");
    c.setTransform(1.5, 0, 0, 1.5, 0, 0);
    c.clearRect(0, 0, 1000, 563);
    const points = done.map((id) => ({
      id,
      x: centres[id - 1][0],
      y: centres[id - 1][1],
      at: id === restoring ? started : -10,
      radius: 270,
    }));
    land.draw(c, points, time, reduced, final);
    if (reduced || !land.antes) return;
    // Pequenas marolas e reflexos, conservando a costa e os detalhes da ilha original.
    c.save();
    c.strokeStyle = "#e0ffff58";
    c.lineWidth = 1;
    for (let i = 0; i < 32; i++) {
      const x = 8 + ((i * 83) % 978),
        y = i % 2 ? 532 + (i % 3) * 8 : 21 + (i % 3) * 9;
      c.beginPath();
      c.ellipse(
        x + Math.sin(time * 0.5 + i) * 3,
        y,
        5 + Math.sin(time + i) * 2,
        1,
        0,
        0,
        Math.PI * 2,
      );
      c.stroke();
    }
    // Fagulhas discretas sobre a floresta em chamas, sem cobrir os botões.
    if (!done.includes(1))
      for (let i = 0; i < 13; i++) {
        const age = (time * 0.32 + i * 0.071) % 1;
        c.fillStyle = `rgba(255,185,82,${(1 - age) * 0.6})`;
        c.beginPath();
        c.ellipse(
          785 + ((i * 29) % 120) + Math.sin(time + i) * 3,
          173 - age * 68,
          1,
          2,
          0,
          0,
          Math.PI * 2,
        );
        c.fill();
      }
    c.restore();
  }
  window.BosqueMapa = {
    update,
    paint,
    health,
    ready: () => {
      if (!canvas) setup();
      return land.ready;
    },
    finalGrowth: (amount) => {
      final = GuardiaoPaisagem.ease(amount);
    },
    state: () => ({
      renderer: "ilustrado-interativo",
      composition: "ilha-antiga",
      completed: done,
      restoring,
      finalGrowth: final,
      bitmapReplacements: 0,
      time: now,
      restoredReady: !!land?.depois,
    }),
  };
})();
