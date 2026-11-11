"use strict";
(() => {
  let el,
    busy = false,
    sequence = 0;
  const reduced = () =>
    Raizes.prefs().screenTransitions === false ||
    document.body.classList.contains("reduce-motion");
  function ensure() {
    if (el) return;
    el = document.createElement("div");
    el.id = "leaf-transition";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<div class="transition-canopy">' +
      Array.from(
        { length: 8 },
        (_, i) => '<i style="--i:' + i + '">' + Raizes.icon("leaf") + "</i>",
      ).join("") +
      "</div><span></span>";
    document.body.append(el);
  }
  async function animate(change) {
    if (busy || reduced()) {
      change?.();
      return;
    }
    busy = true;
    sequence++;
    ensure();
    el.classList.remove("is-leaving");
    el.classList.add("is-covering");
    document.body.dataset.transition = "fechando";
    await new Promise((r) => setTimeout(r, 270));
    change?.();
    el.classList.add("is-leaving");
    document.body.dataset.transition = "abrindo";
    await new Promise((r) => setTimeout(r, 390));
    el.classList.remove("is-covering", "is-leaving");
    busy = false;
    document.body.dataset.transition = "pronta";
  }
  const flash = () => animate();
  window.VivaTransicao = {
    run: animate,
    flash,
    state: () => ({ busy, count: sequence }),
  };
  document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (
        !a ||
        e.defaultPrevented ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        a.target ||
        a.hasAttribute("download")
      )
        return;
      const u = new URL(a.href);
      if (u.origin !== location.origin) return;
      if (u.pathname === location.pathname && u.search === location.search) {
        if (u.hash !== location.hash) {
          e.preventDefault();
          animate(() => (location.hash = u.hash));
        }
        return;
      }
      if (a.getAttribute("aria-disabled") === "true") return;
      e.preventDefault();
      animate(() => location.assign(u.href));
    });
    document
      .querySelector("#phase-dialog")
      ?.addEventListener("close", () => {});
    ensure();
    el.classList.add("is-covering", "is-leaving");
    setTimeout(() => el.classList.remove("is-covering", "is-leaving"), 450);
  });
})();
