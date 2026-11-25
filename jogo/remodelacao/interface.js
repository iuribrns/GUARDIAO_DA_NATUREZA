"use strict";
(() => {
  const K = GuardiaoRemodelacao,
    phase = location.pathname.includes("floresta-viva")
      ? 1
      : Number(new URLSearchParams(location.search).get("fase") || 0);
  function controls(root = document) {
    const list = root.matches?.("[data-fullscreen],.icon-button") ? [root] : [];
    list.push(
      ...root.querySelectorAll(
        "[data-fullscreen],.icon-button,[data-pack-close]",
      ),
    );
    for (const b of list) {
      if (b.querySelector(".remodel-icon")) b.classList.add("remodel-control");
    }
  }
  function talk() {
    const d =
      document.getElementById("intro") || document.getElementById("conversa");
    if (!d?.classList.contains("ra-talk")) return;
    d.classList.add("remodel-talk");
    const head = d.querySelector("header"),
      title = head.querySelector("h2"),
      kicker = head.querySelector(".eyebrow"),
      copy = d.querySelector(".ra-talk-copy");
    kicker.textContent = "CONVERSA · FASE " + phase;
    copy.prepend(kicker, title);
    head.innerHTML =
      K.frame("faixa-titulo", 180, 0, "remodel-talk-frame") +
      K.icon("book") +
      "<p>Um cuidado começa com um encontro</p>";
    const footer = d.querySelector("footer");
    footer.querySelector("button").classList.add("remodel-action");
  }
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      document.body.classList.add("remodelacao");
      for (const [id, name] of [
        ["mochila", "bag"],
        ["pausa", "pause"],
        ["interagir", "hand"],
        ["settings-game", "gear"],
      ]) {
        const b = document.getElementById(id);
        if (!b) continue;
        b.innerHTML =
          K.icon(name) + (id === "interagir" ? "<small>CUIDAR</small>" : "");
        b.classList.add("remodel-control");
      }
      document.querySelectorAll("[data-icon]").forEach((el) => {
        if (K.has(el.dataset.icon)) el.innerHTML = K.icon(el.dataset.icon);
      });
      document.querySelectorAll("[data-fullscreen]").forEach((b) => {
        b.innerHTML =
          window.GuardiaoHUD?.fullIcon(GuardiaoTela.state().fullscreen) ||
          K.icon("full");
        b.classList.add("remodel-control");
      });
      const close = document.getElementById("close-phase");
      if (close) {
        close.innerHTML = K.icon("close");
        close.classList.add("remodel-control");
      }
      const tool = document.getElementById("tool-icon");
      if (phase === 5 && tool) tool.innerHTML = K.icon("trash");
      if (tool?.querySelector(".remodel-icon")) {
        const button = tool.closest("button");
        button.classList.add("remodel-tool");
        button.querySelector(".hud-ring")?.remove();
      }
      talk();
      controls();
      new MutationObserver((records) => {
        for (const r of records)
          for (const n of r.addedNodes) if (n instanceof Element) controls(n);
      }).observe(document.body, { childList: true });
    },
    { once: true },
  );
})();
