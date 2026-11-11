"use strict";
(() => {
  const root = new URL("../../", document.currentScript.src);
  const home = new URL("tela-inicial/nova-versao/index.html", root).href;
  const GENERATION = "guardiao.jornada.geracao.v1";
  const progressKey = (key) =>
    /^guardiao\.(?:mapa\.progresso|colar\.fragmentos|amanha\.memoria|floresta-viva|jornada\.fase\.\d+|area-aberta\.floresta)\.v\d+$/.test(
      key,
    );
  const readGeneration = () => {
    try {
      return localStorage.getItem(GENERATION) || "";
    } catch {
      return "";
    }
  };
  let generation = readGeneration(),
    busy = false,
    restartDialog;
  const controls = new Map();
  const active = () =>
    !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.webkitIsFullScreen
    );
  const icon = (exit) =>
    `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${exit ? "M9 3v6H3M15 3v6h6M3 15h6v6M21 15h-6v6" : "M9 3H3v6M15 3h6v6M3 15v6h6M15 21h6v-6"}"/></svg>`;
  function announce(message) {
    const modal = document.activeElement?.closest("dialog[open]");
    let target = document.querySelector("#girar-celular[open] #girar-status");
    if (!target && modal) {
      target = modal.querySelector(".viewport-feedback");
      if (!target) {
        target = document.createElement("p");
        target.className = "viewport-feedback";
        target.setAttribute("role", "status");
        target.setAttribute("aria-live", "polite");
        modal.append(target);
      }
    }
    target ||= document.getElementById("viewport-status");
    if (!target) return;
    target.textContent = message;
    target.hidden = false;
  }
  function sync() {
    const full = active(),
      label = full ? "Sair da tela cheia" : "Entrar em tela cheia";
    document.body.dataset.fullscreenState = full ? "cheia" : "normal";
    for (const [button, text] of controls) {
      button.setAttribute("aria-label", label);
      button.setAttribute("aria-pressed", String(full));
      button.title = label;
      button.disabled = busy;
      button.innerHTML = icon(full) + (text ? `<span>${label}</span>` : "");
    }
  }
  async function toggle(forceEnter = false) {
    if (busy) return;
    busy = true;
    sync();
    try {
      if (active() && !forceEnter) {
        const webkitExit =
          document.webkitExitFullscreen || document.webkitCancelFullScreen;
        const exit = document.fullscreenElement
          ? document.exitFullscreen || webkitExit
          : webkitExit || document.exitFullscreen;
        if (!exit) throw Error("unsupported");
        await exit.call(document);
        try {
          screen.orientation?.unlock?.();
        } catch {}
      } else {
        if (!active()) {
          const request =
            document.documentElement.requestFullscreen ||
            document.documentElement.webkitRequestFullscreen ||
            document.documentElement.webkitRequestFullScreen;
          if (!request) throw Error("unsupported");
          // A raiz inclui também os diálogos, a mochila e os controles de saída.
          await request.call(document.documentElement);
        }
        if (
          navigator.maxTouchPoints > 0 ||
          matchMedia("(any-pointer:coarse)").matches
        ) {
          try {
            await screen.orientation?.lock?.("landscape");
          } catch {}
        }
      }
      for (const status of document.querySelectorAll(
        "#viewport-status,.viewport-feedback",
      )) {
        status.textContent = "";
        status.hidden = true;
      }
    } catch {
      announce(
        "Este navegador não abriu a tela cheia. No celular, você também pode adicionar o jogo à tela inicial pelo menu do navegador.",
      );
    } finally {
      busy = false;
      sync();
      window.GuardiaoOrientacao?.refresh();
    }
  }
  function bind(button, text = false) {
    if (!button || controls.has(button)) return;
    button.hidden = false;
    button.classList.add("viewport-control");
    if (!text) button.classList.add("viewport-icon");
    controls.set(button, text);
    // Intercepta os controles antigos para não solicitar/fechar duas vezes.
    button.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        window.GuardiaoAudio?.effect("toque", { gain: 0.55 });
        toggle();
      },
      { capture: true },
    );
    sync();
  }
  function button(id, className = "") {
    const b = document.createElement("button");
    b.type = "button";
    b.id = id;
    b.className = className;
    return b;
  }
  function won() {
    try {
      const s = JSON.parse(
        localStorage.getItem("guardiao.mapa.progresso.v1") || "null",
      );
      return [1, 2, 3, 4, 5].every((id) => s?.completed?.includes(id));
    } catch {
      return false;
    }
  }
  function restart() {
    const backup = new Map();
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (progressKey(key) || key === GENERATION)
          backup.set(key, localStorage.getItem(key));
      }
      for (const key of backup.keys())
        if (key !== GENERATION) localStorage.removeItem(key);
      const next =
        crypto.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(GENERATION, next);
      generation = next;
      document.dispatchEvent(new CustomEvent("guardiao:neutralizar"));
      location.replace(home);
    } catch {
      // Se uma operação falhar, repõe os dados removidos antes de tentar de novo.
      for (const [key, value] of backup)
        try {
          localStorage.setItem(key, value);
        } catch {}
      restartDialog.querySelector("[data-new-error]").textContent =
        "Não foi possível reiniciar. Tente novamente.";
      restartDialog.querySelector("[data-new-confirm]").disabled = false;
    }
  }
  function offerRestart() {
    if (!restartDialog || !won() || restartDialog.open) return;
    restartDialog.querySelector("[data-new-error]").textContent = "";
    restartDialog.querySelector("[data-new-confirm]").disabled = false;
    restartDialog.showModal();
  }
  function ending() {
    if (!document.getElementById("ending") || !won()) return;
    restartDialog = document.createElement("dialog");
    restartDialog.id = "nova-jornada";
    restartDialog.setAttribute("aria-labelledby", "nova-jornada-title");
    restartDialog.setAttribute("aria-describedby", "nova-jornada-description");
    restartDialog.innerHTML = `<h2 id="nova-jornada-title">Começar uma nova jornada?</h2><p id="nova-jornada-description">O mapa volta ao começo. As missões, os itens e os cristais serão reiniciados.</p><p>Suas configurações de áudio e controles continuam salvas.</p><div class="new-journey-actions"><button type="button" data-new-cancel autofocus>Continuar por aqui</button><button type="button" data-new-confirm>Sim, jogar do início</button></div><p data-new-error role="status" aria-live="polite"></p>`;
    document.body.append(restartDialog);
    const pause = document.getElementById("ending-pause");
    let resumeEnding = false;
    restartDialog.addEventListener("close", () => {
      if (resumeEnding && pause?.getAttribute("aria-pressed") === "true")
        pause.click();
      resumeEnding = false;
    });
    restartDialog
      .querySelector("[data-new-cancel]")
      .addEventListener("click", () => restartDialog.close());
    restartDialog
      .querySelector("[data-new-confirm]")
      .addEventListener("click", (event) => {
        event.currentTarget.disabled = true;
        restart();
      });
    const make = (id) => {
      const b = button(id, "nature-button new-journey-button");
      b.textContent = "Jogar do início";
      b.addEventListener("click", () => {
        resumeEnding = pause?.getAttribute("aria-pressed") === "false";
        if (resumeEnding) pause.click();
        offerRestart();
      });
      return b;
    };
    document
      .querySelector(".ending-actions")
      .append(make("ending-new-journey"));
    const paper = document.querySelector("#ending-credits .credit-paper");
    if (paper) paper.append(make("credits-new-journey"));
  }
  function init() {
    document.body.classList.add("nova-jornada-controles");
    const status = document.createElement("p");
    status.id = "viewport-status";
    status.hidden = true;
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    document.body.append(status);
    ending();
    const map = document.getElementById("map-fullscreen"),
      top = document.querySelector("#jogo .top-actions"),
      nav = document.querySelector(".ending-actions");
    if (map) bind(map);
    else {
      const main = button(
        "app-fullscreen",
        top ? "game-fullscreen" : nav ? "ending-fullscreen" : "page-fullscreen",
      );
      if (top) top.prepend(main);
      else if (nav) nav.append(main);
      else document.body.append(main);
      bind(main);
    }
    bind(document.getElementById("tela-cheia"), true);
    const rotate = document.getElementById("girar-tela-cheia");
    rotate?.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        toggle(true);
      },
      { capture: true },
    );
    // Um controle dentro dos diálogos continua acionável na camada modal.
    for (const id of [
      "phase-dialog",
      "conversa",
      "intro",
      "ending-credits",
      "nova-jornada",
    ]) {
      const d = document.getElementById(id);
      if (!d) continue;
      const b = button("fullscreen-" + id, "dialog-fullscreen");
      d.append(b);
      bind(b);
    }
    const pause = document.getElementById("menu-pausa"),
      fullscreen = document.getElementById("tela-cheia");
    if (pause && fullscreen) {
      const resume = pause.querySelector('[data-close="menu-pausa"]');
      if (resume) {
        const row = document.createElement("div");
        row.className = "pause-screen-actions";
        resume.before(row);
        row.append(resume, fullscreen);
        controls.set(fullscreen, false);
        fullscreen.classList.add("viewport-icon");
        sync();
      }
    }
    for (const event of [
      "fullscreenchange",
      "webkitfullscreenchange",
      "fullscreenerror",
      "webkitfullscreenerror",
    ])
      document.addEventListener(event, sync);
    sync();
  }
  // Impede que a volta pelo histórico reabra uma campanha anterior em memória.
  const stale = () => readGeneration() !== generation;
  window.addEventListener("pageshow", () => {
    if (stale()) location.replace(home);
    else sync();
  });
  window.addEventListener("storage", (event) => {
    if (event.key === GENERATION && stale()) {
      document.dispatchEvent(new CustomEvent("guardiao:neutralizar"));
      location.replace(home);
    }
  });
  for (const [target, event] of [
    [window, "pagehide"],
    [document, "visibilitychange"],
  ])
    target.addEventListener(
      event,
      (e) => {
        if (stale()) e.stopImmediatePropagation();
      },
      { capture: true },
    );
  window.GuardiaoTela = Object.freeze({
    toggle,
    state: () => ({ fullscreen: active(), pending: busy }),
  });
  window.GuardiaoNovaJornada = Object.freeze({
    available: won,
    open: offerRestart,
  });
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
