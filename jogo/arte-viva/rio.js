"use strict";
(() => {
  const Previous = GuardiaoAdventureArt,
    base = new URL("../reencontro/", document.currentScript.src);
  window.GuardiaoAdventureArt = class extends Previous {
    async load(...args) {
      await super.load(...args);
      if (this.phase !== 2) return;
      this.rescueImage = new Image();
      this.rescueImage.src = new URL(ReencontroRioAtlas.file, base);
      await this.rescueImage.decode();
    }
    river(c, p, time, reduced, options = {}) {
      if (this.phase !== 2) return super.river(c, p, time, reduced, options);
      if (!p.swimming && !options.kind && !options.dressing) {
        BosqueKai.walk(c, p, time, reduced, 63, false, "protecao");
        return "traje-andar:" + BosqueKai.pose(p, reduced).step;
      }
      document.body.dataset.heroDirection = String(p.direction ?? 6);
      if (options.kind !== "desprender" || !this.rescueImage)
        return super.river(c, p, time, reduced, options);
      const progress = Math.max(0, Math.min(0.999, options.progress || 0));
      const index =
        (options.problem === "net" ? 0 : 4) + Math.floor(progress * 4);
      const d = ReencontroRioAtlas,
        f = d.frames[index],
        b = f.bounds,
        k = 66 / d.referenceHeight;
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
      document.body.dataset.riverPose = "libertar-no-habitat:" + index;
      return document.body.dataset.riverPose;
    }
  };
})();
