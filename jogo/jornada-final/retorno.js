"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    images = new Map(),
    $ = (id) => document.getElementById(id);
  const visits = [
    {
      name: "Floresta em Chamas",
      map: "floresta",
      npc: "Carlos",
      line: "O fogo deu lugar à vida. Os animais estão seguros, e Carlos recebe Kai de braços abertos.",
    },
    {
      name: "Rio Poluído",
      map: "rio",
      npc: "Antônio",
      line: "A água está limpa. Os peixes nadam livres e a tartaruga voltou à areia, sem plástico.",
    },
    {
      name: "Resgate da Fauna",
      map: "fauna",
      npc: "Marina",
      line: "Mico, preguiça e seus amigos estão recuperados. Marina comemora cada vida protegida.",
    },
    {
      name: "Reflorestamento",
      map: "plantio",
      npc: "Rafael",
      line: "As mudas cresceram e devolveram sombra, flores e abrigo à floresta. Rafael celebra o cuidado de Kai.",
    },
    {
      name: "Cidade Sustentável",
      map: "cidade",
      npc: "Luciana",
      line: "A cidade ganhou jardins, energia limpa e coleta seletiva. Kai e Luciana celebram a comunidade.",
    },
  ];
  const artBase = new URL("../reencontros-finais/assets/", base),
    icons = ["fogo", "agua", "pata", "cuidar", "solar"],
    colors = ["vermelho", "azul", "amarelo", "verde", "violeta"],
    pending = new Map();
  let index = 0,
    elapsed = 0,
    last = 0,
    active = false,
    ready = false,
    busy = false,
    error = false,
    ticket = 0,
    onComplete = null,
    fade = null,
    waitTimer = 0,
    canSkip = false;
  const still = () =>
    Raizes.prefs().reduceMotion ||
    matchMedia("(prefers-reduced-motion:reduce)").matches;
  function image(n, priority = "low") {
    const key = visits[n].map;
    if (images.has(key)) return Promise.resolve(images.get(key));
    if (!pending.has(key))
      pending.set(
        key,
        (async () => {
          const im = new Image();
          im.decoding = "async";
          im.fetchPriority = priority;
          im.src = new URL(key + ".webp", artBase).href;
          await im.decode();
          images.set(key, im);
          return im;
        })().catch((e) => {
          pending.delete(key);
          throw e;
        }),
      );
    return pending.get(key);
  }
  function caption() {
    const v = visits[index];
    $("return-title").textContent = v.name;
    $("return-line").textContent = v.line;
    $("return-ally").textContent = "Reencontro com " + v.npc;
    $("return-count").textContent = index + 1 + " de 5";
    $("return-icon").src = new URL(
      "../remodelacao/assets/icones/" + icons[index] + ".webp",
      base,
    ).href;
    $("return-crystals").innerHTML = colors
      .map(
        (color, i) =>
          `<span role="img" aria-label="Cristal ${color} conquistado${i === index ? ", memória atual" : ""}" ${i === index ? 'aria-current="step"' : ""}>${GuardiaoMapaHUD.fragment(i + 1, true)}</span>`,
      )
      .join("");
    $("return-next").textContent =
      index === 4 ? "Ver vídeo final →" : "Próxima lembrança →";
    $("return-previous").disabled = index === 0 || busy;
    document.body.dataset.returnPhase = String(index + 1);
  }
  async function show(n) {
    if (!active || busy) return false;
    const run = ++ticket,
      old = $("return-art").hidden ? null : $("return-art").getAttribute("src"),
      focus = document.activeElement?.id;
    busy = true;
    canSkip = false;
    clearTimeout(waitTimer);
    ready = false;
    error = false;
    last = 0;
    $("journey-return").setAttribute("aria-busy", "true");
    $("return-next").disabled = true;
    $("return-previous").disabled = true;
    if (focus === "return-next" || focus === "return-previous")
      $("journey-return").focus({ preventScroll: true });
    $("return-status").hidden = false;
    $("return-status").textContent = "Preparando a lembrança…";
    waitTimer = setTimeout(() => {
      if (!active || run !== ticket || !busy) return;
      canSkip = true;
      $("return-status").textContent =
        "A imagem está demorando. Você pode seguir para o vídeo final.";
      $("return-next").disabled = false;
      $("return-next").textContent = "Ver vídeo final →";
      $("return-next").focus({ preventScroll: true });
    }, 8000);
    try {
      const im = await image(n, "high");
      if (!active || run !== ticket) return false;
      clearTimeout(waitTimer);
      canSkip = false;
      fade?.cancel();
      const before = $("return-art-before"),
        art = $("return-art");
      before.hidden = true;
      index = n;
      elapsed = 0;
      last = 0;
      busy = false;
      ready = true;
      caption();
      art.src = im.src;
      art.alt =
        "Kai e " +
        visits[n].npc +
        " celebram o reencontro na região restaurada, com Flora.";
      art.hidden = false;
      $("journey-return").style.setProperty(
        "--memory-scene",
        `url("${im.src}")`,
      );
      $("return-status").hidden = true;
      $("return-next").disabled = false;
      $("journey-return").setAttribute("aria-busy", "false");
      if (focus === "return-next" || focus === "return-previous")
        $(
          focus === "return-previous" && index > 0
            ? "return-previous"
            : "return-next",
        ).focus({ preventScroll: true });
      if (!still() && old && old !== im.src) {
        before.src = old;
        before.hidden = false;
        const animation = art.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 320,
          easing: "ease-in-out",
        });
        fade = animation;
        animation.onfinish = () => {
          if (fade === animation) {
            before.hidden = true;
            fade = null;
          }
        };
      }
      if (n < 4 && !navigator.connection?.saveData)
        image(n + 1).catch(() => {});
      if (n === 4) {
        const preview = new Image();
        preview.decoding = "async";
        preview.fetchPriority = "low";
        preview.src = new URL("cenario-final.webp", artBase).href;
      }
      return true;
    } catch {
      if (!active || run !== ticket) return false;
      clearTimeout(waitTimer);
      canSkip = false;
      busy = false;
      error = true;
      ready = false;
      $("journey-return").setAttribute("aria-busy", "false");
      $("return-status").textContent =
        "Não foi possível carregar esta lembrança. Você pode voltar ou seguir para o vídeo final.";
      $("return-next").disabled = false;
      $("return-next").textContent = "Ver vídeo final →";
      $("return-previous").disabled = index === 0;
      $("return-next").focus({ preventScroll: true });
      return false;
    }
  }
  function start(done) {
    if (!Raizes.won()) return;
    active = true;
    busy = false;
    ready = false;
    error = false;
    index = 0;
    elapsed = 0;
    last = 0;
    onComplete = done;
    fade?.cancel();
    fade = null;
    $("return-art").hidden = true;
    $("return-art-before").hidden = true;
    $("journey-return").style.setProperty(
      "--memory-scene",
      `url("${new URL("floresta.webp", artBase).href}")`,
    );
    $("journey-return").hidden = false;
    caption();
    // Um controle permanece focável durante a primeira transferência.
    $("journey-return").tabIndex = -1;
    $("journey-return").focus();
    show(0).then(() => {
      if (active) $("return-next").focus({ preventScroll: true });
    });
  }
  function finish() {
    if (!active) return;
    active = false;
    ready = false;
    busy = false;
    ticket++;
    clearTimeout(waitTimer);
    canSkip = false;
    fade?.cancel();
    fade = null;
    $("journey-return").hidden = true;
    $("journey-return").setAttribute("aria-busy", "false");
    const done = onComplete;
    onComplete = null;
    done?.();
  }
  function next() {
    if (!active) return Promise.resolve(false);
    if (busy) {
      if (!canSkip) return Promise.resolve(false);
      finish();
      return Promise.resolve(true);
    }
    if (error || index === 4) {
      finish();
      return Promise.resolve(true);
    }
    return show(index + 1);
  }
  function previous() {
    if (!active || busy || index === 0) return Promise.resolve(false);
    return show(index - 1);
  }
  function paint(_c, _w, _h, time) {
    if (!active || !ready || busy) return;
    if (last && !document.hidden)
      elapsed += Math.min(0.1, Math.max(0, time - last));
    last = time;
    if (elapsed >= 7.2) next();
  }
  function stop() {
    active = ready = busy = false;
    ticket++;
    clearTimeout(waitTimer);
    canSkip = false;
    last = 0;
    onComplete = null;
    fade?.cancel();
    fade = null;
    $("return-art-before").hidden = true;
    $("journey-return").hidden = true;
    $("journey-return").setAttribute("aria-busy", "false");
  }
  document.addEventListener("DOMContentLoaded", () => {
    $("return-next").onclick = next;
    $("return-previous").onclick = previous;
    $("journey-return").addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        const buttons = [$("return-previous"), $("return-next")].filter(
          (b) => !b.disabled,
        );
        if (!buttons.length) {
          e.preventDefault();
          return;
        }
        const i = buttons.indexOf(document.activeElement);
        e.preventDefault();
        buttons[
          (i + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length
        ].focus();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        finish();
      }
    });
    document.addEventListener("visibilitychange", () => {
      last = 0;
    });
  });
  window.JornadaRetorno = {
    start,
    next,
    previous,
    paint,
    stop,
    state: () => ({
      active,
      ready,
      loading: busy,
      failed: error,
      slow: canSkip,
      index,
      elapsed,
      npc: visits[index].npc,
    }),
  };
})();
