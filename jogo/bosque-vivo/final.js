"use strict";
(() => {
  const $ = (id) => document.getElementById(id);
  const seen = "guardiao.viva.final.v1";
  let active = false,
    finished = false,
    previousFocus = null;
  function complete() {
    if (!active || finished) return;
    finished = true;
    $("final-movie").pause();
    $("final-cinema").hidden = true;
    window.GuardiaoAudio?.cinematic(false);
    BosqueMapa.finalGrowth(1);
    try {
      localStorage.setItem(seen, "visto");
    } catch {}
    document.body.dataset.endingState = "concluido";
    $("tree-state").textContent = "Árvore Guardiã restaurada";
    $("credits-necklace").innerHTML = GuardiaoRelicario.necklace(
      [1, 2, 3, 4, 5],
      "credits",
    );
    if (!$("final-credits").open) $("final-credits").showModal();
  }
  function start() {
    if (!Raizes.won() || active) return;
    previousFocus = document.activeElement;
    active = true;
    finished = false;
    document.body.classList.add("island-ending");
    document.body.dataset.endingState = "video";
    document.body.dataset.finaleScene = "video";
    $("final-cinema").hidden = false;
    $("final-movie-status").hidden = true;
    const movie = $("final-movie");
    movie.currentTime = 0;
    window.GuardiaoAudio?.cinematic(true);
    movie.focus();
    movie.play().catch(() => {
      if (active && !finished) $("final-movie-status").hidden = false;
    });
  }
  function stop() {
    const wasActive = active;
    active = false;
    $("final-movie").pause();
    $("final-cinema").hidden = true;
    document.body.classList.remove("island-ending");
    if ($("final-credits").open) $("final-credits").close();
    if (wasActive) {
      window.GuardiaoAudio?.cinematic(false);
      if (document.body.dataset.view === "mapa") RaizesApp.refreshMap();
      previousFocus?.focus?.();
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    $("final-movie").addEventListener("ended", complete);
    $("final-movie").addEventListener("playing", () => {
      $("final-movie-status").hidden = true;
    });
    $("final-movie").addEventListener("error", () => {
      $("final-movie-status").textContent =
        "Não foi possível carregar o vídeo. Você pode tentar reproduzir novamente ou pular.";
      $("final-movie-status").hidden = false;
    });
    $("ending-skip").onclick = complete;
    $("ending-island").onclick = stop;
    $("final-credits").addEventListener("cancel", (e) => {
      e.preventDefault();
      stop();
    });
    $("final-cinema").addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        complete();
      }
      if (e.key === "Tab") {
        const controls = [$("final-movie"), $("ending-skip")];
        if (e.shiftKey && document.activeElement === controls[0]) {
          e.preventDefault();
          controls[1].focus();
        } else if (!e.shiftKey && document.activeElement === controls[1]) {
          e.preventDefault();
          controls[0].focus();
        }
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) $("final-movie").pause();
    });
  });
  window.VivaFinal = {
    get active() {
      return active;
    },
    start,
    stop,
    skip: complete,
    // The map keeps its own rendering loop; the replacement film needs no canvas overlay.
    paint() {},
    state: () => ({
      active,
      finished,
      elapsed: $("final-movie")?.currentTime || 0,
      scene: "video",
    }),
  };
})();
