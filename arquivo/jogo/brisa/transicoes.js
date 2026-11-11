"use strict";
(() => {
  const cover = 720,
    reveal = 900;
  let el,
    busy = false,
    count = 0,
    arriving = false,
    queued = false,
    arrival;
  const reduced = () =>
    BrisaArte.reduced() || Raizes.prefs().screenTransitions === false;
  function ensure() {
    if (el) return;
    el = document.createElement("div");
    el.id = "leaf-transition";
    el.setAttribute("aria-hidden", "true");
    const d = BrisaAtlas.botanica;
    el.innerHTML =
      '<div class="transition-canopy">' +
      Array.from({ length: 14 }, (_, i) => {
        const f = d.frames[i % 4];
        return `<i style="--i:${i};--row:${i % 3}"><svg viewBox="${f.bounds.join(" ")}" aria-hidden="true"><image href="${new URL(d.file, BrisaArte.base)}" width="${d.width}" height="${d.height}"/></svg></i>`;
      }).join("") +
      "</div>";
    document.body.append(el);
  }
  async function run(change) {
    if (busy) {
      if (!arriving || queued) return false;
      queued = true;
      await arrival;
      queued = false;
      return run(change);
    }
    if (reduced()) {
      change?.();
      return true;
    }
    ensure();
    busy = true;
    count++;
    document.body.dataset.transition = "fechando";
    el.classList.remove("is-leaving");
    el.classList.add("is-covering");
    await new Promise((r) => setTimeout(r, cover));
    change?.();
    document.body.dataset.transition = "abrindo";
    el.classList.add("is-leaving");
    await new Promise((r) => setTimeout(r, reveal));
    el.classList.remove("is-covering", "is-leaving");
    busy = false;
    document.body.dataset.transition = "pronta";
    return true;
  }
  window.VivaTransicao = {
    run,
    flash: () => run(),
    state: () => ({ busy, count, cover, reveal, duration: cover + reveal }),
  };
  document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (
        !a ||
        e.defaultPrevented ||
        e.button > 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        a.target ||
        a.hasAttribute("download")
      )
        return;
      const url = new URL(a.href);
      if (
        url.origin !== location.origin ||
        a.getAttribute("aria-disabled") === "true"
      )
        return;
      if (
        url.pathname === location.pathname &&
        url.search === location.search
      ) {
        if (url.hash === location.hash) return;
        e.preventDefault();
        run(() => (location.hash = url.hash));
      } else {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent("guardiao:neutralizar"));
        a.closest("dialog[open]")?.close();
        run(() => location.assign(url.href));
      }
    });
    ensure();
    if (!reduced()) {
      busy = true;
      arriving = true;
      el.classList.add("is-covering", "is-arriving");
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          el.classList.add("is-leaving");
          el.classList.remove("is-arriving");
        }),
      );
      arrival = new Promise((resolve) =>
        setTimeout(() => {
          el.classList.remove("is-covering", "is-leaving");
          busy = false;
          arriving = false;
          document.body.dataset.transition = "pronta";
          resolve();
        }, reveal + 100),
      );
    } else document.body.dataset.transition = "pronta";
  });
})();
