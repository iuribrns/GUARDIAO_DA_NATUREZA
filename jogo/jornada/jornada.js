"use strict";
(() => {
  const $ = (id) => document.getElementById(id),
    id = Number(new URLSearchParams(location.search).get("fase") || 2),
    data = window.GuardiaoFasesJogaveis[id];
  if (!data || !window.GuardiaoProgresso.unlocked(id)) {
    $("loading").innerHTML =
      'Esta região vem depois da missão anterior.<br><a href="../../tela-inicial/nova-versao/aventura.html">Voltar ao mapa</a>';
    return;
  }
  const KEY = "guardiao.jornada.fase." + id + ".v1",
    PREF = "guardiao.horizonte.preferences.v1";
  const { Navigation, distance } = window.GuardiaoNavegacao,
    nav = new Navigation({
      ...data,
      obstacles: [...data.obstacles, { ...data.npcPosition, rx: 12, ry: 9 }],
    }),
    canvas = $("cenario"),
    ctx = canvas.getContext("2d");
  const life = new window.GuardiaoVidaNatural(id);
  const colar = new window.GuardiaoColar({ phase: id, life });
  const sprites = new window.GuardiaoCampaignSprites(),
    shared = new window.FlorestaSprites(),
    player = {
      ...data.start,
      direction: 4,
      moving: false,
      distance: 0,
      idle: 0,
      swimming: false,
    },
    flora = { x: player.x - 25, y: player.y - 65, mode: "voando", elapsed: 0 };
  let tasks = data.tasks.map((t) => ({
      ...t,
      status: "pending",
      progress: 0,
      position: { x: t.x, y: t.y },
      route: [],
    })),
    ready = false,
    completed = false,
    itemsGiven = false,
    stage = "intro",
    water = 100,
    bag = [],
    route = [],
    action = null,
    puzzleTask = null;
  let time = 0,
    last = 0,
    raf = 0,
    elapsed = 0,
    dirty = false,
    messageUntil = 0,
    introIndex = 0,
    handoff = 0,
    rewardTime = 0,
    announcedReturn = false;
  let ground,
    healed,
    iconImage,
    preferences = {},
    view = { w: innerWidth, h: innerHeight },
    camera = { x: 640, y: 360, scale: 1 },
    keys = new Set(),
    stick = { x: 0, y: 0, id: null },
    heldTool = false,
    toolPointer = null;
  try {
    preferences = JSON.parse(localStorage.getItem(PREF) || "{}") || {};
  } catch {}
  const reduced = () =>
    preferences.reduceMotion === true ||
    matchMedia("(prefers-reduced-motion:reduce)").matches;
  const animal = (t) =>
      ["fish", "turtle", "cage", "kitten", "bird"].includes(t.type),
    finished = (t) => t.status === "done" || t.status === "safe";
  const group = (t, type) => (type === "animal" ? animal(t) : t.type === type),
    goalsDone = () => tasks.every(finished),
    paused = () =>
      document.hidden ||
      [...document.querySelectorAll("dialog")].some((d) => d.open),
    locked = () =>
      !ready || paused() || ["intro", "handoff", "reward"].includes(stage);
  const near = (p, r = 82) => distance(player, p) < r;
  function readSave() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s?.version !== 1 || s.phase !== id) return;
      itemsGiven = s.itemsGiven === true;
      if (!itemsGiven) return;
      for (const t of tasks) {
        const old = s.tasks?.find((a) => a.id === t.id);
        if (!old) continue;
        const allowed =
          t.type === "bed"
            ? ["pending", "seeded", "done"]
            : t.type === "recycle"
              ? ["pending", "carried", "done"]
              : animal(t)
                ? ["pending", "returning", "safe"]
                : ["pending", "done"];
        if (allowed.includes(old.status)) {
          t.status = old.status;
          t.progress = Math.max(0, Math.min(1, Number(old.progress) || 0));
          if (t.status === "returning") {
            if (old.position && nav.walkable(old.position))
              t.position = { ...old.position };
            t.route = animalRoute(t);
          }
        }
      }
      bag = tasks.filter((t) => t.status === "carried").map((t) => t.id);
      water = Number.isFinite(s.water)
        ? Math.min(100, Math.max(0, s.water))
        : 100;
      if (s.player && nav.walkable(s.player))
        Object.assign(player, { x: s.player.x, y: s.player.y });
      completed = s.completed === true && goalsDone();
      stage = "exploring";
    } catch {}
  }
  function save() {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          version: 1,
          phase: id,
          itemsGiven,
          completed,
          water,
          player: { x: player.x, y: player.y },
          tasks: tasks.map((t) => ({
            id: t.id,
            status: t.status,
            progress: t.progress,
            position: { ...t.position },
          })),
        }),
      );
      dirty = false;
      return true;
    } catch {
      return false;
    }
  }
  function neutral() {
    window.GuardiaoAudio?.water(false);
    keys.clear();
    stick = { x: 0, y: 0, id: null };
    heldTool = false;
    toolPointer = null;
    $("stick").style.transform = "";
    $("ferramenta").classList.remove("is-held");
  }
  function message(text, speaker = "Flora") {
    if (preferences.contextHints === false && speaker === "Dica") return;
    $("message").textContent =
      (speaker === "Dica" ? "" : speaker + ": ") + text;
    $("message").hidden = false;
    messageUntil = time + Math.max(2.8, Math.min(5, text.length / 22));
  }
  function open(id) {
    neutral();
    route = [];
    save();
    $(id).showModal();
  }
  function showIntro() {
    introIndex = 0;
    stage = "intro";
    introLine();
    $("intro").showModal();
  }
  function introLine() {
    $("intro-name").textContent = data.npc;
    $("intro-text").textContent = data.intro[introIndex];
    $("intro-count").textContent = introIndex + 1 + " / 2";
    $("intro-next").textContent =
      introIndex === 1 ? "Vamos cuidar!" : "Continuar";
    $("intro-portrait").innerHTML = sprites.markup(
      "npcs",
      data.npcRow * 3 + (introIndex === 1 ? 2 : 1),
    );
  }
  function advanceIntro() {
    if (introIndex === 0) {
      introIndex = 1;
      introLine();
      return;
    }
    $("intro").close();
    stage = "handoff";
    handoff = 1.5;
    $("cinema").hidden = false;
    $("cinema-text").textContent =
      data.npc + " entrega " + data.equipmentText.toLowerCase();
  }
  function grant() {
    itemsGiven = true;
    stage = "exploring";
    $("cinema").hidden = true;
    dirty = true;
    save();
    window.GuardiaoAudio?.effect("receber");
    message(data.hint);
    updateHUD();
  }
  function candidate(type = null) {
    return tasks
      .filter(
        (t) =>
          !finished(t) &&
          t.status !== "returning" &&
          t.status !== "carried" &&
          (!type || group(t, type)),
      )
      .sort((a, b) => distance(player, a) - distance(player, b))[0];
  }
  function dependencies(t) {
    return (
      !t.needs ||
      t.needs.every((id) => finished(tasks.find((v) => v.id === id)))
    );
  }
  function target() {
    return tasks
      .filter(
        (t) =>
          !finished(t) &&
          t.status !== "returning" &&
          t.status !== "carried" &&
          near(t, 90),
      )
      .sort((a, b) => distance(player, a) - distance(player, b))[0];
  }
  function guide(type = null) {
    if (locked() || action) return;
    let t =
      type === "home"
        ? { ...data.npcPosition, name: data.npc }
        : candidate(type);
    if (t && !dependencies(t))
      t = tasks.find((v) => t.needs?.includes(v.id) && !finished(v));
    if (id === 5 && bag.length && (!t || t.status === "carried"))
      t = { ...data.station, name: "Estação de reciclagem" };
    if (!t) {
      if (goalsDone() || tasks.some((t) => t.status === "returning"))
        t = { ...data.npcPosition, name: data.npc };
      else return;
    }
    route = nav.approach(player, t, 52);
    message("Vamos até " + t.name + "!");
    if (!route.length && distance(player, t) > 90)
      message("Siga pelo caminho livre.");
  }
  function startAction(t, kind, duration) {
    if (action) return;
    neutral();
    route = [];
    player.moving = false;
    action = { task: t.id, kind, elapsed: 0, duration };
    $("action-progress").hidden = false;
  }
  function animalHome(t) {
    if (id === 2)
      return t.type === "turtle"
        ? { x: 745, y: 430 }
        : { x: 610 + (t.id === "peixes2" ? 90 : 0), y: 420 };
    const index = tasks.filter(animal).indexOf(t);
    return {
      x: data.npcPosition.x - 38 + index * 20,
      y: data.npcPosition.y + 55,
    };
  }
  function animalRoute(t) {
    return nav.route(t.position, animalHome(t));
  }
  function rescue(t) {
    t.status = "returning";
    t.position = { x: t.x, y: t.y };
    t.route = animalRoute(t);
    if (!t.route.length) {
      const fallback = nav.approach(t.position, animalHome(t), 12);
      t.route = fallback;
    }
    t.restoredAt = elapsed;
    message(t.name + " está melhor!", "Kai");
  }
  function finishAction() {
    const a = action,
      t = tasks.find((t) => t.id === a.task);
    if (a.kind === "seed") {
      t.status = "seeded";
      message("Agora segure o regador para molhar a semente.", "Dica");
    } else if (a.kind === "water") {
      t.status = "done";
      t.progress = 1;
      t.restoredAt = elapsed;
      water = Math.max(0, water - 12);
      message("Mais uma árvore para a floresta!", "Kai");
    } else if (animal(t)) rescue(t);
    else if (t.type === "recycle") {
      t.status = "carried";
      bag.push(t.id);
      message("Na bolsa! Leve à estação de reciclagem.", "Dica");
    } else {
      t.status = "done";
      t.restoredAt = elapsed;
      message(
        t.type === "trash"
          ? "Lixo fora do rio!"
          : t.type === "nest"
            ? "Um lar para os passarinhos!"
            : t.type === "solar"
              ? "Energia limpa!"
              : "Jardim cuidado!",
        "Kai",
      );
    }
    action = null;
    nav.setDynamic(
      tasks.filter(
        (t) =>
          (t.type === "bed" && finished(t)) ||
          (t.type === "cage" && t.status === "pending"),
      ),
    );
    $("action-progress").hidden = true;
    dirty = true;
    save();
    updateHUD();
    window.GuardiaoAudio?.effect(
      animal(t)
        ? "resgate"
        : ["seed", "water", "garden", "nest"].includes(a.kind)
          ? "plantar"
          : "coletar",
    );
  }
  const picture = {
    banana:
      '<svg viewBox="0 0 50 50" aria-hidden="true"><path d="M9 10Q9 33 36 36L44 30Q37 49 20 43Q3 37 5 16Z" fill="#edc547" stroke="#8b652d" stroke-width="2"/><path d="M9 10L11 5" stroke="#5f7a34" stroke-width="5"/></svg>',
    fruta:
      '<svg viewBox="0 0 50 50" aria-hidden="true"><path d="M25 13Q5 5 6 28Q11 50 25 42Q41 50 45 27Q45 7 25 13" fill="#dc7046" stroke="#864027" stroke-width="2"/><path d="M25 14L27 5Q40 3 37 11Z" fill="#6c9e43"/></svg>',
  };
  function choices(type) {
    if (type === "cage")
      return [
        ["banana", "Banana", picture.banana],
        ["fruta", "Fruta", picture.fruta],
      ];
    if (type === "solar")
      return [
        ["sun", "Virar para o sol", window.GuardiaoIcones.markup("sun")],
        ["shade", "Virar para a sombra", window.GuardiaoIcones.markup("leaf")],
      ];
    return [
      ["paper", "Papel · azul", objectMarkup(6)],
      ["plastic", "Plástico · vermelho", objectMarkup(7)],
      ["metal", "Metal · amarelo", objectMarkup(8)],
      ["organic", "Orgânico · marrom", objectMarkup(9)],
    ];
  }
  function objectMarkup(i) {
    return sprites.markup("objetos", i);
  }
  function showPuzzle(t) {
    puzzleTask = t;
    $("puzzle-title").textContent =
      t.type === "cage"
        ? "Qual comidinha abre o abrigo?"
        : t.type === "solar"
          ? "Para onde o painel vai olhar?"
          : "Cada material no seu lugar";
    $("puzzle-description").textContent =
      t.type === "cage"
        ? t.species === 1
          ? "O mico adora banana."
          : "O tucano gosta de frutas."
        : t.type === "solar"
          ? "O sol ajuda a produzir energia limpa."
          : t.name + ": escolha uma lixeira.";
    $("puzzle-feedback").textContent = "";
    $("puzzle-options").replaceChildren(
      ...choices(t.type).map(([value, label, art]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.dataset.answer = value;
        b.innerHTML = art + "<span>" + label + "</span>";
        b.addEventListener("click", () => answer(value));
        return b;
      }),
    );
    open("puzzle");
  }
  function answer(value) {
    const t = puzzleTask;
    if (!t) return;
    const correct =
      t.type === "cage"
        ? value === t.answer
        : t.type === "solar"
          ? value === "sun"
          : value === t.material;
    if (!correct) {
      $("puzzle-feedback").textContent = "Vamos tentar outra? Você consegue!";
      tone(330);
      return;
    }
    $("puzzle").close();
    puzzleTask = null;
    if (t.type === "recycle") {
      t.status = "done";
      t.restoredAt = elapsed;
      bag = bag.filter((v) => v !== t.id);
      save();
      updateHUD();
      message("Reciclagem no lugar certo!", "Kai");
      tone(880);
      if (bag.length && near(data.station, 95))
        setTimeout(() => {
          if (!paused() && bag.length)
            showPuzzle(tasks.find((v) => v.id === bag[0]));
        }, 550);
    } else startAction(t, t.type, t.type === "solar" ? 1.8 : 1.5);
  }
  function interact() {
    if (locked() || action || !itemsGiven) return;
    if (goalsDone() && near(data.npcPosition, 100)) {
      startReward();
      return;
    }
    if (id === 4 && near(data.refill, 80)) {
      water = 100;
      save();
      updateHUD();
      message("Regador cheio!", "Kai");
      return;
    }
    if (
      id === 5 &&
      near(data.station, 95) &&
      bag.length &&
      (!target() ||
        distance(player, data.station) < distance(player, target()) - 8)
    ) {
      showPuzzle(tasks.find((t) => t.id === bag[0]));
      return;
    }
    const t = target();
    if (!t) {
      if (near(data.npcPosition, 80))
        message(
          goalsDone() ? "Você fez um lindo trabalho!" : data.hint,
          data.npc,
        );
      return;
    }
    if (!dependencies(t)) {
      message("Vamos recolher o lixo perto deste amigo primeiro.");
      return;
    }
    if (t.type === "cage" || t.type === "solar") {
      showPuzzle(t);
      return;
    }
    if (t.type === "bed") {
      if (t.status === "pending") startAction(t, "seed", 1.4);
      else message("Segure o regador para a semente crescer.", "Dica");
      return;
    }
    if (
      t.type === "nest" &&
      tasks.filter((t) => t.type === "bed" && finished(t)).length < 2
    ) {
      message("Plante duas árvores antes de preparar os ninhos.");
      return;
    }
    startAction(
      t,
      t.type,
      t.type === "kitten"
        ? 4.8
        : t.type === "turtle"
          ? 3
          : t.type === "bird"
            ? 2
            : t.type === "fish"
              ? 2.2
              : 1.2,
    );
  }
  function beginTool() {
    if (locked() || action) return;
    heldTool = true;
    $("ferramenta").classList.add("is-held");
    if (id !== 4) interact();
    else if (near(data.refill, 80)) {
      water = 100;
      updateHUD();
      save();
    } else if (
      !tasks.some(
        (t) => t.type === "bed" && t.status === "seeded" && near(t, 90),
      )
    )
      interact();
  }
  function updateHUD() {
    document.querySelectorAll("[data-goal]").forEach((b) => {
      const type = b.dataset.goal,
        total = tasks.filter((t) => group(t, type)).length,
        done = tasks.filter((t) => group(t, type) && finished(t)).length;
      b.querySelector("strong").textContent = done + "/" + total;
      b.classList.toggle("done", done === total);
    });
    $("reserva").value = water;
    $("inventory-state").textContent =
      id === 5
        ? bag.length + " materiais aguardando reciclagem."
        : data.equipmentText;
    const home = document.querySelector(".return-goal");
    home.hidden = !goalsDone();
    if (goalsDone() && !completed && !announcedReturn) {
      announcedReturn = true;
      message("Conseguimos! Vamos buscar o fragmento com " + data.npc + ".");
      route = nav.approach(player, data.npcPosition, 48);
    }
  }
  function startReward() {
    if (completed || stage === "reward") return;
    neutral();
    route = [];
    stage = "reward";
    rewardTime = 0;
    colar.begin(finishReward);
    $("cinema").hidden = false;
    $("cinema-text").textContent =
      data.npc + " entrega o fragmento " + data.colorName;
    $("skip-reward").hidden = false;
  }
  function finishReward() {
    if (stage !== "reward") return;
    colar.complete();
    completed = true;
    stage = "completed";
    const saved = save(),
      progress = window.GuardiaoProgresso.finish(id);
    $("cinema").hidden = true;
    $("skip-reward").hidden = true;
    $("save-state").textContent =
      saved && progress.saved
        ? "Sua conquista está guardada neste navegador."
        : "Sua conquista vale nesta aba. O navegador não permitiu salvar.";
    showVictory();
    tone(1047);
  }
  function showVictory() {
    $("victory-stats").innerHTML = data.goals
      .map(
        ([type, label, total]) =>
          `<span><strong>${total}</strong>${label}</span>`,
      )
      .join("");
    $("reward-label").textContent =
      "Fragmento " + data.colorName + " conquistado!";
    $("reward-label").style.color = data.color;
    $("next-phase").href =
      "../../tela-inicial/nova-versao/aventura.html?restaurar=" +
      id +
      "&destino=" +
      (id < 5 ? id + 1 : "creditos");
    $("next-phase").textContent =
      id === 5 ? "Ver encerramento →" : "Próxima aventura →";
    $("vitoria").showModal();
  }
  function canMove(p) {
    return (
      nav.walkable(p) &&
      !tasks.some(
        (t) =>
          ((t.type === "cage" && t.status === "pending") ||
            (t.type === "bed" && finished(t))) &&
          distance(p, t) < 16,
      )
    );
  }
  function move(dx, dy) {
    const moved = window.GuardiaoMovimento.move(player, dx, dy, canMove);
    if (moved > 0.02) {
      if (
        Math.floor((player.distance + moved) / 28) >
        Math.floor(player.distance / 28)
      )
        window.GuardiaoAudio?.effect(player.swimming ? "nadar" : "passo", {
          gain: 0.22,
        });
      player.distance += moved;
      player.direction =
        (Math.round(-Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8;
      player.idle = 0;
      dirty = true;
    }
    return moved;
  }
  function update(dt) {
    elapsed += dt;
    if (stage === "handoff") {
      handoff = Math.max(0, handoff - dt);
      if (!handoff) grant();
      updateFlora(dt);
      return;
    }
    if (stage === "reward") {
      rewardTime += dt;
      if (rewardTime > 6.5) finishReward();
      updateFlora(dt);
      return;
    }
    if (action) {
      action.elapsed += dt;
      $("action-progress").firstElementChild.style.scale =
        Math.min(1, action.elapsed / action.duration) + " 1";
      if (action.elapsed >= action.duration) finishAction();
      player.moving = false;
      player.idle = 0;
    } else {
      let dx =
          Number(keys.has("d") || keys.has("arrowright")) -
          Number(keys.has("a") || keys.has("arrowleft")) +
          stick.x,
        dy =
          Number(keys.has("s") || keys.has("arrowdown")) -
          Number(keys.has("w") || keys.has("arrowup")) +
          stick.y;
      if (dx || dy) route = [];
      else if (route.length) {
        while (route.length && distance(player, route[0]) < 3) route.shift();
        if (route.length) {
          const d = distance(player, route[0]);
          dx = (route[0].x - player.x) / d;
          dy = (route[0].y - player.y) / d;
        }
      }
      const len = Math.hypot(dx, dy);
      if (len > 1) {
        dx /= len;
        dy /= len;
      }
      player.swimming = id === 2 && nav.swimming(player);
      const travelled = move(
        dx * data.speed * (player.swimming ? 0.8 : 1) * dt,
        dy * data.speed * (player.swimming ? 0.8 : 1) * dt,
      );
      player.moving = travelled > 0.02;
      if (!player.moving) player.idle += dt;
      if (route.length && !travelled && len) route = [];
      if (id === 4 && heldTool) {
        const t = tasks
          .filter(
            (t) => t.type === "bed" && t.status === "seeded" && near(t, 90),
          )
          .sort((a, b) => distance(player, a) - distance(player, b))[0];
        if (t && water >= 12) startAction(t, "water", 1.8);
        else if (t && water < 12) {
          message("Vamos encher o regador na fonte!");
          heldTool = false;
        }
      }
    }
    for (const t of tasks) {
      if (t.status !== "returning") continue;
      while (t.route.length && distance(t.position, t.route[0]) < 3)
        t.route.shift();
      if (!t.route.length) {
        t.status = "safe";
        t.position = animalHome(t);
        t.restoredAt = elapsed;
        dirty = true;
        save();
        updateHUD();
        continue;
      }
      const next = t.route[0],
        d = distance(t.position, next),
        step = Math.min(d, 80 * dt);
      t.facingRight = next.x > t.position.x;
      t.position.x += ((next.x - t.position.x) / d) * step;
      t.position.y += ((next.y - t.position.y) / d) * step;
    }
    updateFlora(dt);
    if (
      goalsDone() &&
      !completed &&
      near(data.npcPosition, 85) &&
      !route.length
    )
      startReward();
  }
  function updateFlora(dt) {
    const resting =
      id !== 2 &&
      !player.moving &&
      !action &&
      player.idle > 2.5 &&
      stage !== "handoff";
    let x = player.x - 25,
      y = player.y - 65;
    if (stage === "reward" || $("vitoria").open) {
      flora.mode = "comemorando";
      x = player.x + 30;
      y = player.y - 72;
    } else if (resting) {
      if (flora.mode !== "ombro" && flora.mode !== "pousando") {
        flora.mode = "pousando";
        flora.elapsed = 0;
      }
      flora.elapsed += dt;
      if (flora.elapsed > 0.65) flora.mode = "ombro";
      x =
        player.x + (player.direction >= 3 && player.direction <= 5 ? 13 : -13);
      y = player.y - 43;
    } else {
      flora.mode = "voando";
      flora.elapsed = 0;
      if (action?.kind === "kitten") {
        x = player.x + 30;
        y =
          player.y -
          90 -
          Math.sin((action.elapsed / action.duration) * Math.PI) * 85;
      }
    }
    const k = 1 - Math.exp(-dt * 7);
    flora.x += (x - flora.x) * k;
    flora.y += (y - flora.y) * k;
  }
  function transform() {
    const s = camera.scale,
      visibleW = view.w / s,
      visibleH = view.h / s;
    camera.x = Math.min(1280 - visibleW / 2, Math.max(visibleW / 2, player.x));
    camera.y = Math.min(720 - visibleH / 2, Math.max(visibleH / 2, player.y));
    if (visibleW >= 1280) camera.x = 640;
    if (visibleH >= 720) camera.y = 360;
    return { s, ox: view.w / 2 - camera.x * s, oy: view.h / 2 - camera.y * s };
  }
  function resize() {
    view = { w: innerWidth, h: innerHeight };
    const pixel = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(view.w * pixel);
    canvas.height = Math.round(view.h * pixel);
    ctx.setTransform(pixel, 0, 0, pixel, 0, 0);
    camera.scale = Math.max(
      view.w / 1280,
      view.h / 720,
      view.w < 700 ? 1.2 : 0.8,
    );
    draw();
  }
  function ellipse(x, y, rx, ry, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  function icon(name, x, y, size) {
    window.GuardiaoIcones.paint(ctx, iconImage, name, x, y, size);
  }
  function label(text, x, y) {
    ctx.font = "bold 10px system-ui";
    ctx.textAlign = "center";
    const w = ctx.measureText(text).width + 14;
    ctx.fillStyle = "#fff5dceF";
    ctx.strokeStyle = "#94ad6f";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - 17, w, 23, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#355134";
    ctx.fillText(text, x, y - 2);
  }
  function drawGround() {
    ctx.drawImage(ground, 0, 0, 1280, 720);
    const finishedTasks = tasks.filter(
      (t) => finished(t) || t.status === "returning",
    );
    if (completed) {
      if (life.rebirth) life.rebirth.full(ctx, healed, reduced(), true);
      else ctx.drawImage(healed, 0, 0, 1280, 720);
    } else {
      life.restore(ctx, healed, finishedTasks, elapsed, reduced());
    }
    if (!reduced()) {
      if (id === 2) {
        for (let i = 0; i < 16; i++) {
          const x = 570 + Math.sin(i * 2.7 + time * 0.18) * 100,
            y = 220 + ((i * 33 + time * 13) % 430);
          if (!nav.swimming({ x, y })) continue;
          ctx.strokeStyle = "#dcfbff88";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(x, y, 8 + Math.sin(time * 2 + i) * 3, 2, 0, 0, Math.PI);
          ctx.stroke();
        }
      }
      ctx.save();
      const ashen = !completed && !finishedTasks.length && life.rebirth;
      for (let i = 0; i < 12; i++) {
        const x = (i * 123 + time * 18) % 1280,
          y = (i * 77 + time * 11) % 720;
        if (ashen) life.rebirth.ashLeaf(ctx, x, y, 9, Math.sin(time + i) * 0.7);
        else
          shared.draw(ctx, "natureza", i % 2 ? 4 : 5, x, y, 9, {
            angle: Math.sin(time + i) * 0.7,
            alpha: 0.7,
          });
      }
      ctx.restore();
    }
    if (route.length) {
      ctx.strokeStyle = "#fff1bf99";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 8]);
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      route.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (data.station) {
      for (let i = 0; i < 4; i++)
        sprites.draw(
          ctx,
          "objetos",
          6 + i,
          data.station.x - 45 + i * 30,
          data.station.y,
          29,
        );
    }
    if (id === 4) {
      ellipse(data.refill.x, data.refill.y, 22, 7, "#8ce9f144");
      icon("water", data.refill.x, data.refill.y - 17, 20);
    }
  }
  function drawTask(t) {
    const p = t.position,
      isAnimal = animal(t),
      isCurrent = action?.task === t.id;
    if (["trash", "recycle"].includes(t.type)) {
      if (t.status === "pending")
        sprites.draw(
          ctx,
          "objetos",
          t.type === "trash"
            ? Number(t.id.replace("lixo", "")) % 4
            : ["plastic", "paper", "metal", "organic"].indexOf(t.material),
          t.x,
          t.y,
          24,
          { angle: id === 2 ? Math.sin(time * 2 + t.x) * 0.1 : 0 },
        );
      return;
    }
    if (isAnimal) {
      if (
        isCurrent &&
        ["turtle", "fish", "kitten", "bird"].includes(action.kind)
      )
        return;
      let sheet,
        index,
        height = 36;
      if (id === 2) {
        sheet = "animais-rio";
        const base = t.type === "turtle" ? 0 : 8;
        if (t.status === "pending")
          index = base + (!reduced() && time % 4 > 3.7 ? 1 : 0);
        else if (t.status === "returning" || t.status === "safe")
          index = base + 4 + (Math.floor(time * 7) % 4);
        else index = base + 3;
        height = t.type === "turtle" ? 38 : 26;
      } else {
        sheet =
          t.status === "returning" ? "animais-fauna-andando" : "animais-fauna";
        const base = t.species * 4;
        index =
          base +
          (t.status === "pending"
            ? !reduced() && time % 4 > 3.7
              ? 1
              : 0
            : t.status === "returning"
              ? 3
              : 2);
        if (t.status === "returning")
          index = base + (reduced() ? 0 : Math.floor(time * 8) % 4);
        height = t.type === "kitten" ? 32 : t.species === 2 ? 37 : 34;
        if (t.type === "cage" && t.status !== "pending")
          sprites.draw(ctx, "objetos", 5, t.x, t.y, 60);
      }
      ellipse(p.x, p.y, 13, 4, "#1c452b44");
      sprites.draw(
        ctx,
        sheet,
        index,
        p.x,
        p.y - (t.type === "kitten" && t.status === "pending" ? 75 : 0),
        height,
        { flip: t.facingRight },
      );
      if (t.type === "cage" && t.status === "pending")
        sprites.draw(ctx, "objetos", 4, t.x, t.y, 60, { alpha: 0.88 });
      return;
    }
    if (t.type === "bed") {
      if (t.status === "seeded") {
        sprites.draw(ctx, "objetos", 12, t.x, t.y, 19);
        ellipse(t.x, t.y + 3, 22, 7, "#9caf5d44");
      }
      if (finished(t)) {
        const age = reduced()
          ? 1
          : Math.min(1, (elapsed - (t.restoredAt ?? -3)) / 2);
        shared.draw(ctx, "natureza", 2, t.x, t.y, 34 + age * 40, {
          angle: reduced() ? 0 : Math.sin(time * 1.7 + t.x) * 0.02,
        });
      }
    } else if (t.type === "nest")
      sprites.draw(ctx, "objetos", finished(t) ? 14 : 13, t.x, t.y, 43);
    else if (t.type === "solar")
      sprites.draw(ctx, "objetos", finished(t) ? 11 : 10, t.x, t.y, 43);
    else if (t.type === "garden" && finished(t))
      shared.draw(ctx, "natureza", 6, t.x, t.y, 40);
  }
  function drawPlayer() {
    const flip = player.direction >= 3 && player.direction <= 5;
    ellipse(player.x, player.y, 13, 4, "#173e2a55");
    let name = "kai-repouso",
      frame = 0,
      y = player.y,
      height = 63;
    if (stage === "reward" || $("vitoria").open) {
      name = "recompensa-" + data.reward;
      frame =
        stage === "reward"
          ? Math.min(7, Math.floor((rewardTime / 6.5) * 8))
          : 6;
      colar.drawActor(ctx, rewardTime, player.x, y, 66, $("vitoria").open);
    } else if (action) {
      const p = Math.min(0.999, action.elapsed / action.duration);
      if (["trash", "recycle"].includes(action.kind)) {
        name = "kai-rio";
        frame = Math.floor(p * 4);
      } else if (action.kind === "turtle") {
        name = "kai-rio";
        frame = 4 + Math.floor(p * 4);
      } else if (action.kind === "fish") {
        name = "kai-rio";
        frame = 8 + Math.floor(p * 4);
      } else if (action.kind === "kitten") {
        name = "kai-floresta";
        frame = Math.floor(p * 8);
        y -= Math.sin(p * Math.PI) * 85;
      } else if (action.kind === "bird") {
        name = "kai-floresta";
        frame = 8 + Math.floor(p * 4);
      } else if (action.kind === "seed") {
        name = "kai-plantio";
        frame = Math.floor(p * 4);
      } else if (action.kind === "water") {
        name = "kai-plantio";
        frame = 4 + Math.floor(p * 4);
      } else if (action.kind === "solar") {
        name = "kai-plantio";
        frame = 9 + Math.floor(p * 3);
      } else {
        name = "kai-floresta";
        frame = 8 + Math.floor(p * 4);
      }
      sprites.draw(ctx, name, frame, player.x, y, height, { flip });
    } else if (player.swimming) {
      name = "kai-nadando";
      frame =
        player.direction * 2 +
        (!reduced() ? Math.floor(time * (player.moving ? 7 : 3)) % 2 : 0);
      sprites.draw(ctx, name, frame, player.x, y, 43);
    } else if (player.moving) {
      name = "kai-livre";
      frame = player.direction * 2 + (Math.floor(player.distance / 18) % 2);
      life.walk(ctx, player, time, reduced(), false, height);
    } else {
      const d = player.direction,
        base = d === 2 ? 2 : d >= 3 && d <= 5 ? 4 : d === 6 ? 6 : 0;
      frame = base + (!reduced() && time % 4.6 > 4.4 ? 1 : 0);
      shared.draw(
        ctx,
        name,
        frame,
        player.x,
        y,
        height + (reduced() ? 0 : Math.sin(time * 1.8) * 0.35),
      );
    }
    if (!action && !player.swimming && stage !== "reward" && !$("vitoria").open)
      colar.chest(ctx, player);
    document.body.dataset.kaiSprite = name + ":" + frame;
    document.body.dataset.swimming = String(player.swimming);
  }
  function drawCanopy(c) {
    if (reduced()) return;
    const kx = ground.naturalWidth / 1280,
      ky = ground.naturalHeight / 720;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(Math.sin(time * 1.4 + c.x) * 0.003);
    const under =
      ((player.x - c.x) / c.rx) ** 2 + ((player.y - 35 - c.y) / c.ry) ** 2 < 1;
    ctx.globalAlpha = under ? 0.35 : 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, c.rx, c.ry, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(
      completed ? healed : ground,
      (c.x - c.rx) * kx,
      (c.y - c.ry) * ky,
      c.rx * 2 * kx,
      c.ry * 2 * ky,
      -c.rx,
      -c.ry,
      c.rx * 2,
      c.ry * 2,
    );
    ctx.restore();
  }
  function drawNPC() {
    ellipse(data.npcPosition.x, data.npcPosition.y, 14, 4, "#173d2855");
    const frame =
      data.npcRow * 3 + (stage === "handoff" ? 2 : $("intro").open ? 1 : 0);
    sprites.draw(
      ctx,
      "npcs",
      frame,
      data.npcPosition.x,
      data.npcPosition.y,
      65,
    );
    if (near(data.npcPosition, 105) && !paused())
      label(
        goalsDone() && !completed ? "Receber fragmento" : data.npc,
        data.npcPosition.x,
        data.npcPosition.y - 73,
      );
  }
  function drawFlora() {
    life.flora(ctx, flora, player, time, reduced());
    document.body.dataset.floraState = flora.mode;
  }
  function drawCelebration() {
    const c = $("celebration").getContext("2d");
    c.clearRect(0, 0, 420, 175);
    sprites.draw(c, "npcs", data.npcRow * 3 + 1, 105, 150, 108);
    colar.drawActor(c, 6.5, 210, 153, 125, true);
    life.draw(
      c,
      "flora",
      14 + (!reduced() ? Math.floor(time * 4) % 2 : 0),
      295,
      90,
      61,
    );
    const friends = tasks.filter(animal);
    friends
      .slice(0, 3)
      .forEach((t, i) =>
        sprites.draw(
          c,
          id === 2 ? "animais-rio" : "animais-fauna",
          id === 2 ? (t.type === "turtle" ? 3 : 11) : t.species * 4 + 2,
          75 + i * 115,
          170,
          32,
        ),
      );
  }
  function draw() {
    window.GuardiaoAudio?.water(!paused() && action?.kind === "water");
    if (!ready) return;
    const { s, ox, oy } = transform();
    ctx.clearRect(0, 0, view.w, view.h);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(s, s);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    drawGround();
    life.ground(ctx, player, time, reduced(), player.swimming);
    life.recovery(ctx, tasks, elapsed, reduced());
    const actors = tasks.map((t) => ({
      y: t.position.y,
      draw: () => drawTask(t),
    }));
    const canopies = id === 3 ? [{ x: 895, y: 223, rx: 140, ry: 77 }] : [];
    canopies.push(
      { x: 100, y: 390, rx: 75, ry: 125 },
      { x: 1180, y: 290, rx: 65, ry: 130 },
    );
    actors.push(
      ...canopies.map((c) => ({
        y: c.y + c.ry + 15,
        draw: () => drawCanopy(c),
      })),
    );
    actors.push(
      { y: data.npcPosition.y, draw: drawNPC },
      { y: player.y, draw: drawPlayer },
    );
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());
    drawFlora();
    for (const t of tasks) {
      if (finished(t) || t.status === "returning" || t.status === "carried")
        continue;
      const y =
          t.y -
          (t.type === "kitten"
            ? 118
            : animal(t)
              ? 53
              : t.type === "solar"
                ? 60
                : 37),
        size = animal(t) ? 24 : 18;
      ellipse(t.x, y, animal(t) ? 15 : 11, animal(t) ? 15 : 11, "#fff2c6eb");
      icon(t.icon, t.x, y, size);
      if (near(t, 95) && !paused() && !action) label(t.name, t.x, y - 20);
    }
    if (stage === "handoff") {
      const p = 1 - handoff / 1.5;
      data.equipment.forEach((name, i) =>
        icon(
          name,
          data.npcPosition.x + (player.x - data.npcPosition.x) * p + i * 15,
          data.npcPosition.y - 38 - Math.sin(p * Math.PI) * 25,
          25,
        ),
      );
    }
    if (stage === "reward" || $("vitoria").open) {
      for (let i = 0; i < 13; i++) {
        const a = time * 1.1 + i * 2.4,
          r = 30 + ((time * 24 + i * 19) % 90);
        ellipse(
          player.x + Math.cos(a) * r,
          player.y - 42 + Math.sin(a) * r * 0.6,
          2,
          2,
          data.color + "bb",
        );
      }
    }
    if (stage === "reward") colar.render(rewardTime, reduced());
    if (new URLSearchParams(location.search).has("colisoes")) {
      ctx.strokeStyle = "#ff5ca6";
      data.obstacles.forEach((o) => {
        ctx.beginPath();
        ctx.ellipse(o.x, o.y, o.rx, o.ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.beginPath();
      data.floor.forEach(([x, y], i) =>
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
      );
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
    document.body.classList.toggle(
      "near-hud",
      view.w < 700 && player.y * s + oy < 170,
    );
    if ($("vitoria").open) drawCelebration();
  }
  function frame(timestamp) {
    raf = 0;
    if (!ready || document.hidden) return;
    const dt = last ? Math.min(0.04, (timestamp - last) / 1000) : 0.016;
    last = timestamp;
    time += dt;
    if (!paused()) update(dt);
    if (!$("message").hidden && time > messageUntil) $("message").hidden = true;
    draw();
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (ready && !raf && !document.hidden) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }
  function tone(freq) {
    window.GuardiaoAudio?.effect(
      freq >= 1000
        ? "vitoria"
        : freq === 330
          ? "tentar"
          : freq >= 850
            ? "restaurar"
            : freq >= 750
              ? "coletar"
              : "toque",
    );
  }
  function syncControls(e) {
    neutral();
    preferences = e?.detail.preferences || preferences;
    document.documentElement.classList.toggle(
      "large-text",
      preferences.largeText === true,
    );
    document.body.classList.toggle("reduce-motion", reduced());
    const factor =
      1 + Math.max(0, Math.min(100, preferences.controlSize || 0)) / 1000;
    document.querySelectorAll(".joystick,.actions").forEach((el) => {
      el.style.scale = factor;
      el.style.transformOrigin = el.classList.contains("actions")
        ? preferences.leftHanded
          ? "bottom left"
          : "bottom right"
        : preferences.leftHanded
          ? "bottom right"
          : "bottom left";
    });
  }
  const pad = $("joystick");
  function stickMove(e) {
    const b = pad.getBoundingClientRect(),
      r = b.width * 0.3;
    let x = (e.clientX - b.x - b.width / 2) / r,
      y = (e.clientY - b.y - b.height / 2) / r,
      d = Math.hypot(x, y);
    if (d < 0.13) x = y = 0;
    else if (d > 1) {
      x /= d;
      y /= d;
    }
    stick.x = x;
    stick.y = y;
    $("stick").style.transform = `translate(${x * r}px,${y * r}px)`;
  }
  pad.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || stick.id !== null || locked() || action) return;
    e.preventDefault();
    stick.id = e.pointerId;
    pad.setPointerCapture(e.pointerId);
    stickMove(e);
  });
  pad.addEventListener("pointermove", (e) => {
    if (e.pointerId === stick.id) stickMove(e);
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
    pad.addEventListener(type, (e) => {
      if (e.pointerId === stick.id) {
        stick.x = stick.y = 0;
        stick.id = null;
        $("stick").style.transform = "";
        save();
      }
    });
  $("ferramenta").addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || locked()) return;
    e.preventDefault();
    toolPointer = e.pointerId;
    $("ferramenta").setPointerCapture(e.pointerId);
    beginTool();
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
    $("ferramenta").addEventListener(type, (e) => {
      if (e.pointerId === toolPointer) {
        heldTool = false;
        toolPointer = null;
        $("ferramenta").classList.remove("is-held");
        save();
      }
    });
  $("ferramenta").addEventListener("click", (e) => {
    if (e.detail === 0) {
      beginTool();
      heldTool = false;
    }
  });
  $("interagir").addEventListener("click", interact);
  $("ajuda").addEventListener("click", () => guide());
  $("intro-next").addEventListener("click", advanceIntro);
  $("intro").addEventListener("cancel", (e) => e.preventDefault());
  $("mochila").addEventListener("click", () => {
    if (!locked()) open("inventario");
  });
  $("pausa").addEventListener("click", () => {
    if (!locked() || $("menu-pausa").open) {
      $("pause-summary").textContent =
        tasks.filter(finished).length +
        " de " +
        tasks.length +
        " cuidados concluídos";
      open("menu-pausa");
    }
  });
  $("toggle-missions").addEventListener("click", () => {
    const el = document.querySelector(".missions"),
      expanded = el.classList.toggle("expanded");
    $("toggle-missions").setAttribute("aria-expanded", String(expanded));
  });
  document.querySelectorAll("[data-close]").forEach((b) =>
    b.addEventListener("click", () => {
      $(b.dataset.close).close();
      if (b.dataset.close === "vitoria") stage = "exploring";
    }),
  );
  $("skip-reward").addEventListener("click", finishReward);
  $("recomecar").addEventListener("click", () => {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    location.reload();
  });
  $("tela-cheia").addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $("jogo").requestFullscreen();
    } catch {
      message("Experimente virar seu celular para o lado.", "Dica");
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      neutral();
      if (!paused()) {
        e.preventDefault();
        open("menu-pausa");
      }
      return;
    }
    if (locked() || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (
      [
        "w",
        "a",
        "s",
        "d",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        " ",
      ].includes(k)
    ) {
      e.preventDefault();
      keys.add(k);
      if (k === " " && !e.repeat) beginTool();
    }
    if (k === "e" && !e.repeat) interact();
    if (k === "b" && !e.repeat) open("inventario");
  });
  document.addEventListener("keyup", (e) => {
    keys.delete(e.key.toLowerCase());
    if (e.key === " ") {
      heldTool = false;
      $("ferramenta").classList.remove("is-held");
    }
    if (dirty) save();
  });
  window.addEventListener("guardiao:controles", syncControls);
  window.addEventListener("resize", resize);
  window.addEventListener("blur", () => {
    neutral();
    if (dirty) save();
  });
  document.addEventListener("visibilitychange", () => {
    neutral();
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
      if (dirty) save();
    } else start();
  });
  window.addEventListener("pagehide", () => {
    neutral();
    cancelAnimationFrame(raf);
    raf = 0;
    if (dirty) save();
  });
  window.addEventListener("pageshow", start);
  $("phase-name").textContent = data.name;
  document.title = data.name + " · Guardião da Natureza";
  $("settings-link").href += "&fase=" + id;
  document.body.dataset.phase = id;
  syncControls();
  $("goals").innerHTML =
    data.goals
      .map(
        ([type, label, total, iconName]) =>
          `<button class="goal" data-goal="${type}"><span data-icon="${iconName}"></span><span class="goal-label">${label}</span><strong>0/${total}</strong></button>`,
      )
      .join("") +
    `<button class="goal return-goal" data-goal="home" hidden><span data-icon="leaf"></span><span>Voltar a ${data.npc}</span><strong>→</strong></button>`;
  document.querySelectorAll("[data-goal]").forEach((b) =>
    b.addEventListener("click", () => {
      guide(b.dataset.goal);
      document.querySelector(".missions").classList.remove("expanded");
      $("toggle-missions").setAttribute("aria-expanded", "false");
    }),
  );
  $("water-display").hidden = id !== 4;
  $("tool-icon").dataset.icon =
    id === 4 ? "watering" : id === 5 ? "recycle" : id === 3 ? "net" : "net";
  $("tool-name").textContent =
    id === 4 ? "REGAR" : id === 5 ? "RECICLAR" : "USAR";
  $("equipment-list").innerHTML = data.equipment
    .map((n) => window.GuardiaoIcones.markup(n))
    .join("");
  window.GuardiaoIcones.prepare();
  window.GuardiaoJornada = Object.freeze({
    estado: () =>
      structuredClone({
        ready,
        id,
        stage,
        completed,
        itemsGiven,
        player,
        flora,
        tasks,
        water,
        bag,
        action,
        route,
        camera,
        paused: paused(),
        rewardTime,
        necklace: colar.state(),
        elapsed,
      }),
    caminho: (from, to) => nav.route(from, to),
    podeAndar: (p) => nav.walkable(p),
  });
  readSave();
  nav.setDynamic(
    tasks.filter(
      (t) =>
        (t.type === "bed" && finished(t)) ||
        (t.type === "cage" && t.status === "pending"),
    ),
  );
  let loaded = 0;
  function progress() {
    loaded++;
    $("loading").textContent =
      "Preparando " + data.name.toLowerCase() + "… " + loaded;
  }
  const pictureLoad = async (src) => {
    const im = new Image();
    im.src = window.GuardiaoArte.url(new URL(src, location.href).href);
    await im.decode();
    progress();
    return im;
  };
  const specific =
    id === 2
      ? ["kai-nadando", "kai-rio", "animais-rio"]
      : id === 3
        ? ["kai-floresta", "animais-fauna", "animais-fauna-andando"]
        : id === 4
          ? ["kai-plantio", "kai-floresta"]
          : ["kai-rio", "kai-plantio", "kai-floresta"];
  Promise.all([
    sprites.load(["npcs", "objetos", ...specific], progress),
    shared.load(progress, ["kai-repouso", "natureza"]),
    pictureLoad("assets/mapa-" + data.map + ".png"),
    pictureLoad("assets/mapa-" + data.map + "-restaurado.png"),
    window.GuardiaoIcones.load(),
    life.load(),
    colar.load(),
  ])
    .then((r) => {
      ground = r[2];
      healed = r[3];
      iconImage = r[4];
      ready = true;
      $("loading").hidden = true;
      document.body.dataset.gameReady = "true";
      resize();
      updateHUD();
      if (!itemsGiven) showIntro();
      else if (completed) showVictory();
      else message(data.hint);
      start();
    })
    .catch((error) => {
      console.error(error);
      $("loading").innerHTML =
        'Não foi possível carregar a aventura.<br><a href="' +
        location.pathname +
        "?fase=" +
        id +
        '">Tentar novamente</a>';
    });
})();
