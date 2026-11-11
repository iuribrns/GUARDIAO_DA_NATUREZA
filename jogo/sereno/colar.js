"use strict";
(() => {
  const Parent = GuardiaoColar,
    bank = GuardiaoRelicario,
    clamp = (n) => Math.max(0, Math.min(1, n));
  class Necklace extends Parent {
    begin(callback) {
      this.focusAfterLanding = false;
      super.begin(callback);
    }
    async load() {
      await Promise.all([bank.load(), SerenoSprites.load(["conquista"])]);
    }
    drawActor(ctx, time, x, y, height, final = false) {
      const index = final ? 7 : Math.min(7, Math.floor((time / 6.5) * 8)),
        hh = ctx.canvas.id === "cenario" ? height * 1.32 : height;
      if (!SerenoSprites.draw(ctx, "conquista", index, x, y, hh))
        return super.drawActor(ctx, time, x, y, height, final);
      const d = SerenoAtlas.conquista,
        f = d.frames[index],
        k = hh / d.referenceHeight;
      if (f.pendant) {
        const [xx, yy, size] = f.pendant;
        bank.paint(
          ctx,
          x + (xx - f.pivot[0]) * k,
          y + (yy - f.pivot[1]) * k,
          size * k * 1.05,
          time >= 2.8 ? this.after || this.earned : this.before || this.earned,
        );
      }
      document.body.dataset.necklacePose = String(index);
    }
    render(time, reduced = false) {
      super.render(time, reduced);
      if (!this.active) return;
      const slot = bank.slots[this.phase - 1],
        cx = slot[0] + slot[2] / 2,
        cy = slot[1] + slot[3] / 2;
      let u = clamp((time - 1.2) / 1.6);
      u = u * u * (3 - 2 * u);
      const node = this.gemNodes[this.phase - 1];
      if (time >= 1.2) {
        node.style.opacity = reduced && time < 2.8 ? "0" : "1";
        const dx = reduced ? 0 : (1 - u) * bank.mount.width * 0.4,
          dy = reduced
            ? 0
            : -(1 - u) * bank.mount.height * 0.25 -
              Math.sin(u * Math.PI) * bank.mount.height * 0.08;
        const settle =
          time >= 2.8 && !reduced
            ? Math.sin(((time - 2.8) * Math.PI) / 0.35) *
              0.07 *
              Math.exp(-(time - 2.8) * 6)
            : 0;
        const scale = 0.65 + 0.35 * u + settle;
        node.setAttribute(
          "transform",
          `translate(${dx} ${dy}) translate(${cx} ${cy}) scale(${scale}) rotate(${reduced ? 0 : (1 - u) * -18}) translate(${-cx} ${-cy})`,
        );
      }
      this.button.disabled = time < 3;
      if (time >= 3 && !this.focusAfterLanding) {
        this.button.focus({ preventScroll: true });
        this.focusAfterLanding = true;
      }
    }
  }
  window.GuardiaoColar = Necklace;
})();
