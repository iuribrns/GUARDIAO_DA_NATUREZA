"use strict";
(() => {
  const base = new URL("./", document.currentScript.src);
  let worker,
    phase,
    nav,
    serial = 0,
    ready,
    failed = false,
    workerReady = false;
  const pending = new Map(),
    metrics = { requests: 0, completed: 0, workerMs: 0, fallbacks: 0 };
  function init(id, owner) {
    if (ready) return ready;
    phase = id;
    nav = owner;
    ready = new Promise((resolve) => {
      try {
        worker = new Worker(new URL("rotas-worker.js?v=mata-1", base));
        worker.onmessage = ({ data: m }) => {
          if (m.type === "ready") {
            workerReady = true;
            resolve(true);
            return;
          }
          const p = pending.get(m.id);
          if (!p) return;
          pending.delete(m.id);
          clearTimeout(p.timer);
          if (m.error) p.reject(Error(m.error));
          else {
            metrics.completed++;
            metrics.workerMs += m.duration;
            p.resolve(m.route);
          }
        };
        worker.onerror = () => {
          failed = true;
          resolve(false);
          for (const p of pending.values()) {
            clearTimeout(p.timer);
            p.reject(Error("Rota indisponível"));
          }
          pending.clear();
          worker.terminate();
        };
        worker.postMessage({
          type: "init",
          phase: id,
          data: id === 1 ? null : owner.data,
        });
      } catch {
        failed = true;
        resolve(false);
      }
    });
    return ready;
  }
  async function route(from, to, options = {}) {
    metrics.requests++;
    await ready;
    if (failed || !worker) return fallback(from, to, options);
    const id = ++serial;
    try {
      return await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(Error("Tempo da rota"));
        }, 18000);
        pending.set(id, { resolve, reject, timer });
        worker.postMessage({ id, from, to, ...options });
      });
    } catch {
      return fallback(from, to, options);
    }
  }
  // Se Workers não estiverem disponíveis, a busca cede a tela entre pequenos lotes.
  async function fallback(from, to, options) {
    metrics.fallbacks++;
    return BosqueBuscaCooperativa.route(nav, from, to, options);
  }
  window.BosqueRotas = {
    init,
    route,
    state: () => ({
      ...metrics,
      pending: pending.size,
      failed,
      workerReady,
      phase,
    }),
  };
  window.addEventListener("pagehide", (e) => {
    if (!e.persisted) worker?.terminate();
  });
})();
