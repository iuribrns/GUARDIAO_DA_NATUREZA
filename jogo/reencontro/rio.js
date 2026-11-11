"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    atlas = ReencontroRioAtlas;
  const Previous = GuardiaoAdventureArt;
  window.GuardiaoAdventureArt = class extends Previous {
    async load() {
      await super.load();
      if (this.phase !== 2) return;
      const im = new Image();
      im.src = new URL(atlas.file, base);
      await im.decode();
      this.rescueImage = im;
    }
    river(c, p, time, reduced, options = {}) {
      if (options.kind !== "desprender" || !this.rescueImage)
        return super.river(c, p, time, reduced, options);
      const progress = Math.max(0, Math.min(0.999, options.progress));
      const frame =
        (options.problem === "net" ? 0 : 4) + Math.floor(progress * 4);
      const f = atlas.frames[frame],
        b = f.bounds,
        k = 66 / atlas.referenceHeight;
      c.save();
      c.translate(p.x, p.y);
      if (p.direction >= 3 && p.direction <= 5) c.scale(-1, 1);
      c.drawImage(
        this.rescueImage,
        ...b,
        (b[0] - f.pivot[0]) * k,
        (b[1] - f.pivot[1]) * k,
        b[2] * k,
        b[3] * k,
      );
      c.restore();
      document.body.dataset.riverPose = "libertar-no-habitat:" + frame;
      return "libertar-no-habitat:" + frame;
    }
  };
})();
