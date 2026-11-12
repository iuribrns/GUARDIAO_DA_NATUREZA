const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
function page(url, storage = new Map()) {
  let now = 0,
    serial = 0,
    reduced = false;
  const timers = new Map(),
    listeners = {},
    observers = [];
  class Element {
    constructor() {
      this.className = "";
      this.dataset = {};
      this.classList = {
        add: (...xs) => {
          this.className = [
            ...new Set([...this.className.split(" ").filter(Boolean), ...xs]),
          ].join(" ");
        },
        remove: (...xs) => {
          this.className = this.className
            .split(" ")
            .filter((x) => !xs.includes(x))
            .join(" ");
        },
      };
    }
    setAttribute() {}
    append() {}
  }
  const w = {
    URL,
    console,
    Date: { now: () => now },
    location: new URL(url),
    sessionStorage: {
      setItem: (k, v) => storage.set(k, v),
      getItem: (k) => storage.get(k) || null,
      removeItem: (k) => storage.delete(k),
    },
    setTimeout: (cb, ms = 0) => {
      const id = ++serial;
      timers.set(id, { at: now + ms, cb });
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
    requestAnimationFrame: (cb) => w.setTimeout(() => cb(now), 16),
    BrisaArte: { reduced: () => reduced },
    Raizes: { prefs: () => ({ screenTransitions: true }) },
    MutationObserver: class {
      constructor(cb) {
        this.cb = cb;
        observers.push(this);
      }
      observe() {}
      disconnect() {
        this.off = true;
      }
    },
    document: {
      currentScript: {
        src: "https://example.org/jogo/brisa-suave/transicoes.js",
      },
      body: new Element(),
      createElement: () => new Element(),
      addEventListener: (event, cb) => (listeners[event] ??= []).push(cb),
      dispatchEvent() {},
      querySelector: () => null,
    },
    addEventListener: (event, cb) => (listeners[event] ??= []).push(cb),
  };
  w.window = w;
  w.BosqueMapa = { ready: () => Promise.resolve() };
  // Se a transição voltar a carregar a vegetação antiga, o teste falha.
  w.BosqueVegetacao = {
    load: () => {
      throw Error("carga de cenário descartado");
    },
  };
  vm.createContext(w);
  vm.runInContext(fs.readFileSync("jogo/brisa-suave/transicoes.js", "utf8"), w);
  const flush = async () => {
    for (let i = 0; i < 15; i++) await Promise.resolve();
  };
  return {
    w,
    storage,
    setReduced: (v) => {
      reduced = v;
    },
    emit: (name, event = {}) => {
      for (const cb of listeners[name] || []) cb(event);
    },
    ready: async () => {
      w.document.body.dataset.gameReady = "true";
      for (const o of observers) if (!o.off) o.cb();
      await flush();
    },
    advance: async (ms) => {
      const end = now + ms;
      await flush();
      for (;;) {
        const next = [...timers.entries()]
          .filter(([, t]) => t.at <= end)
          .sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        timers.delete(next[0]);
        now = next[1].at;
        next[1].cb();
        await flush();
      }
      now = end;
      await flush();
    },
  };
}
(async () => {
  const p = page("https://example.org/jogo/viva/index.html");
  p.emit("DOMContentLoaded");
  assert.equal(
    p.w.VivaTransicao.state().busy,
    false,
    "primeira visita não fica coberta aguardando artes opcionais",
  );
  let changes = 0;
  const run = p.w.VivaTransicao.run(() => {
    changes++;
    p.w.location.hash = "#mapa";
  });
  await p.advance(300);
  assert.equal(changes, 0);
  assert.equal(p.w.VivaTransicao.state().busy, true);
  await p.advance(1500);
  await run;
  assert.equal(changes, 1);
  assert.equal(p.w.VivaTransicao.state().busy, false);
  const target = "https://example.org/jogo/jornada/index.html?fase=2";
  const leaving = p.w.VivaTransicao.run(
    () => {
      changes++;
    },
    { navigation: target },
  );
  await p.advance(1000);
  await leaving;
  assert.equal(
    p.w.VivaTransicao.state().busy,
    true,
    "página de saída permanece coberta, sem piscar de volta",
  );
  const q = page(target, p.storage);
  q.emit("DOMContentLoaded");
  assert.equal(q.w.VivaTransicao.state().arriving, true);
  await q.advance(200);
  assert.equal(q.w.VivaTransicao.state().busy, true);
  await q.ready();
  await q.advance(1500);
  assert.equal(q.w.VivaTransicao.state().busy, false);
  q.setReduced(true);
  let immediate = false;
  await q.w.VivaTransicao.run(() => {
    immediate = true;
  });
  assert.ok(immediate);
  const slow = page("https://example.org/jogo/viva/index.html");
  slow.emit("DOMContentLoaded");
  slow.w.BosqueMapa.ready = () => new Promise(() => {});
  const pending = slow.w.VivaTransicao.run(() => {
    slow.w.location.hash = "#mapa";
  });
  await slow.advance(10000);
  await pending;
  assert.equal(
    slow.w.VivaTransicao.state().busy,
    false,
    "imagem lenta não mantém uma cortina bloqueada para sempre",
  );
  slow.emit("pageshow", { persisted: true });
  assert.equal(slow.w.document.body.dataset.transition, "pronta");
  console.log(
    "PASS: chegada, saída sem flash, toque único, redução de movimento, cache de navegação e recuperação de imagem lenta.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
