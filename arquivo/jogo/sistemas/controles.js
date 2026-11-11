"use strict";
(() => {
  const KEY = "guardiao.horizonte.preferences.v1",
    coarse = matchMedia("(pointer: coarse)");
  const valid = (v) => ["auto", "touch", "keyboard"].includes(v);
  function read(fallback = {}) {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || "{}");
      return v && typeof v === "object" ? v : fallback;
    } catch {
      return fallback;
    }
  }
  let preferences = read();
  function mode() {
    return valid(preferences.controlMode) ? preferences.controlMode : "auto";
  }
  function effective() {
    return mode() === "auto" ? (coarse.matches ? "touch" : "keyboard") : mode();
  }
  function apply() {
    document.body.dataset.controls = effective();
    document.body.classList.toggle(
      "left-handed",
      preferences.leftHanded === true,
    );
    document
      .querySelectorAll("[data-control-mode]")
      .forEach((input) => (input.value = mode()));
    document
      .querySelectorAll("[data-control-description]")
      .forEach(
        (el) =>
          (el.textContent =
            effective() === "touch"
              ? "Joystick e botões visíveis na tela."
              : "Joystick e botões de toque ocultos."),
      );
    window.dispatchEvent(
      new CustomEvent("guardiao:controles", {
        detail: {
          mode: mode(),
          effective: effective(),
          preferences: { ...preferences },
        },
      }),
    );
  }
  function setMode(value) {
    if (!valid(value)) return;
    preferences = { ...preferences, ...read(preferences), controlMode: value };
    try {
      localStorage.setItem(KEY, JSON.stringify(preferences));
    } catch {}
    apply();
  }
  document.addEventListener("change", (e) => {
    if (e.target.matches("[data-control-mode]")) setMode(e.target.value);
  });
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      preferences = read(preferences);
      apply();
    }
  });
  coarse.addEventListener("change", apply);
  window.GuardiaoControles = Object.freeze({
    mode,
    effective,
    setMode,
    refresh: (overrides) => {
      preferences = { ...preferences, ...read(preferences), ...overrides };
      apply();
    },
  });
  apply();
})();
