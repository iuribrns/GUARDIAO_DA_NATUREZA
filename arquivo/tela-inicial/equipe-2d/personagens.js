"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    d = window.GuardiaoEquipe2DAtlas,
    im = new Image(),
    unions = new Map();
  let ready = false,
    pending;
  function load() {
    if (!pending) {
      im.src = new URL(d.file, base).href;
      pending = im.decode().then(() => {
        ready = true;
      });
    }
    return pending;
  }
  function frameFor(person, time, reduced, gesture = null) {
    const first = d.people[person].first;
    if (reduced) return first;
    if (gesture && gesture.age < 1.35)
      return first + (gesture.kind === "reference" ? 2 : 3);
    const offset = person === "iuri" ? 0.91 : 0;
    return first + ((time + offset) % 4.6 > 4.32 ? 1 : 0);
  }
  function draw(canvas, person, time, reduced, gesture = null) {
    if (!ready) return;
    const c = canvas.getContext("2d"),
      p = d.people[person],
      frame = frameFor(person, time, reduced, gesture),
      f = d.frames[frame],
      b = f.bounds;
    if (!unions.has(person)) {
      const fs = d.frames.slice(p.first, p.first + p.count);
      unions.set(person, [
        Math.min(...fs.map((f) => f.bounds[0] - f.pivot[0])),
        Math.min(...fs.map((f) => f.bounds[1] - f.pivot[1])),
        Math.max(...fs.map((f) => f.bounds[0] + f.bounds[2] - f.pivot[0])),
        Math.max(...fs.map((f) => f.bounds[1] + f.bounds[3] - f.pivot[1])),
      ]);
    }
    const [l, t, r, bottom] = unions.get(person),
      k = Math.min(
        (canvas.width - 24) / (r - l),
        (canvas.height - 24) / (bottom - t),
      ),
      x = (canvas.width - (r - l) * k) / 2 - l * k,
      y = (canvas.height - (bottom - t) * k) / 2 - t * k;
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.save();
    c.translate(x, y);
    if (!reduced)
      c.scale(
        1,
        1 + Math.sin(time * 1.8 + (person === "iuri" ? 0 : 1.5)) * 0.002,
      );
    c.drawImage(
      im,
      ...b,
      (b[0] - f.pivot[0]) * k,
      (b[1] - f.pivot[1]) * k,
      b[2] * k,
      b[3] * k,
    );
    c.restore();
    canvas.dataset.frame = String(frame);
    canvas.dataset.pose =
      gesture && !reduced && gesture.age < 1.35 ? gesture.kind : "idle";
    canvas.dataset.art = "corpo-inteiro-2d";
  }
  window.GuardiaoEquipe2D = Object.freeze({
    load,
    draw,
    frameFor,
    ready: () => ready,
  });
})();
