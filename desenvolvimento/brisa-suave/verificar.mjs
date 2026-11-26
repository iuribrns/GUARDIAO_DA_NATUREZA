import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script, createContext, runInContext } from "node:vm";
import { combine, combineStyles } from "./agrupar.mjs";

// Empacotamento conserva os caminhos originais em páginas aninhadas do Pages.
const files = {
  "jogo/a/primeiro.js":
    'window.order=["atlas"];window.imageURL=new URL("assets/teste.webp",document.currentScript.src).href;',
  "jogo/b/segundo.js":
    'window.order.push("jogo");window.workerURL=new URL("worker.js",document.currentScript.src).href;',
};
const html =
  '<script src="../a/primeiro.js?v=2" defer></script><script src="../b/segundo.js" defer></script>';
const grouped = combine("jogo/tela/index.html", html, (f) => files[f]);
const sandbox = {
  URL,
  document: {
    baseURI:
      "https://example.org/GUARDIAO_DA_NATUREZA/jogo/tela/index.html?fase=2",
  },
};
sandbox.window = sandbox;
createContext(sandbox);
runInContext(grouped.code, sandbox);
assert.deepEqual([...sandbox.order], ["atlas", "jogo"]);
assert.equal(
  sandbox.imageURL,
  "https://example.org/GUARDIAO_DA_NATUREZA/jogo/a/assets/teste.webp",
);
assert.equal(
  sandbox.workerURL,
  "https://example.org/GUARDIAO_DA_NATUREZA/jogo/b/worker.js",
);
assert.equal((grouped.html.match(/<script/g) || []).length, 1);
const styles = combineStyles(
  "jogo/tela/index.html",
  '<link rel="stylesheet" href="../a/base.css"><link rel="stylesheet" href="../b/final.css">',
  (f) =>
    ({
      "jogo/a/base.css":
        '@import url("../c/importado.css");.test{background:url("assets/fundo.webp?v=2#p")}@font-face{src:url(../fonte.woff2)}',
      "jogo/c/importado.css": ".importado{background:url(./fundo.webp)}",
      "jogo/b/final.css":
        ".test{color:green;filter:url(#luz);mask:url(data:image/png;base64,AA==)}",
    })[f],
);
assert.equal((styles.html.match(/rel="stylesheet"/g) || []).length, 1);
assert.ok(
  styles.code.indexOf("background:") < styles.code.indexOf("color:green"),
);
assert.ok(styles.code.includes('url("../../a/assets/fundo.webp?v=2#p")'));
assert.ok(styles.code.includes('url("../../fonte.woff2")'));
assert.ok(styles.code.includes('url("../../c/fundo.webp")'));
assert.ok(styles.code.indexOf(".importado") < styles.code.indexOf(".test"));
assert.ok(styles.code.includes("url(#luz)"));
assert.ok(styles.code.includes("url(data:image/png;base64,AA==)"));
for (const entry of ["viva", "floresta-viva", "jornada"]) {
  const text = readFileSync("dist/jogo/" + entry + "/index.html", "utf8");
  assert.equal((text.match(/rel="stylesheet"/g) || []).length, 1);
  const scripts = [
    ...text.matchAll(
      /<script[^>]+src="([^"]+)"[^>]*data-guardiao-bundle="true"/g,
    ),
  ];
  assert.equal(scripts.length, 1);
  assert.ok(
    text.includes('<script src="../tela-fixa/entrada.js"></script>'),
    "entrada síncrona preserva a tela cheia",
  );
  const url = new URL(
    scripts[0][1],
    "https://example.org/GUARDIAO_DA_NATUREZA/jogo/" + entry + "/index.html",
  );
  const code = readFileSync(
    "dist/" + url.pathname.split("/GUARDIAO_DA_NATUREZA/")[1],
    "utf8",
  );
  new Script(code);
  assert.ok(!code.includes("document.currentScript"));
  if (entry === "jornada")
    assert.ok(
      !code.includes("added < (id === 2"),
      "sem cálculo dos quatro mapas nativos descartados",
    );
}
console.log(
  "PASS: scripts agrupados, ordem preservada e caminhos de imagens/Workers corretos em subpasta.",
);

// O cenário recuperado não bloqueia a entrada; o chão estático é desenhado de um cache.
let clock = 0,
  afterResolve,
  gradients = 0;
const requested = [],
  idle = [];
const context = () => ({
  clearRect() {},
  drawImage() {},
  fillRect() {},
  createRadialGradient() {
    gradients++;
    return { addColorStop() {} };
  },
});
class FakeImage {
  set src(value) {
    this.url = String(value);
    requested.push(this.url);
  }
  decode() {
    return this.url.includes("-depois")
      ? new Promise((r) => {
          afterResolve = r;
        })
      : Promise.resolve();
  }
}
const w = {
  URL,
  Image: FakeImage,
  performance: { now: () => clock * 1000 },
  requestIdleCallback: (cb) => idle.push(cb),
  document: {
    currentScript: { src: "https://example.org/jogo/reencontro/paisagem.js" },
    body: { dataset: { gameReady: "false" } },
    createElement: () => ({ getContext: () => context() }),
  },
};
let onReady;
w.MutationObserver = class {
  constructor(cb) {
    onReady = cb;
  }
  observe() {}
  disconnect() {}
};
w.window = w;
createContext(w);
runInContext(readFileSync("jogo/reencontro/paisagem.js", "utf8"), w);
const landscape = new w.GuardiaoPaisagem.Landscape("rio", 1280, 720);
await landscape.ready;
assert.equal(requested.length, 1);
assert.ok(requested[0].includes("-antes.webp"));
assert.equal(
  idle.length,
  0,
  "não agenda restauração antes de a fase ficar pronta",
);
w.document.body.dataset.gameReady = "true";
onReady();
assert.equal(
  idle.length,
  1,
  "restauração é preparada em segundo plano depois da entrada",
);
const c = context();
for (let i = 0; i < 300; i++) {
  clock = i / 60;
  landscape.draw(c, [], clock, false);
}
assert.equal(
  landscape.builds,
  1,
  "chão parado não é reconstruído a cada quadro",
);
landscape.draw(c, [{ id: 1, x: 500, y: 300, at: clock }], clock, false);
assert.equal(requested.length, 2);
assert.equal(landscape.depois, undefined, "restauração continua assíncrona");
afterResolve();
await landscape.afterPromise;
const start = clock;
for (let i = 0; i < 60; i++) {
  clock = start + i / 60;
  landscape.draw(c, [{ id: 1, x: 500, y: 300, at: start }], clock, false);
}
assert.ok(
  landscape.builds < 15,
  "restauração reconstrói a textura em baixa frequência",
);
assert.ok(gradients > 0);
console.log(
  "PASS: só cenário inicial bloqueia entrada; 300 quadros parados reutilizam uma composição.",
);

// Os atalhos de mapa continuam usando a ilustração aprovada.
const source = readFileSync("jogo/jornada/index.html", "utf8");
assert.ok(source.includes("reencontro/paisagem.js"));
assert.ok(!source.includes("bosque-vivo/configuracao.js"));
assert.ok(!source.includes("mata-ilustrada/configuracao.js"));
for (const name of ["flora", "inicio", "mapa-antes", "mapa-depois"]) {
  const image = readFileSync(
    "jogo/" +
      (name === "mapa-antes" ? "mapa-ferido" : "arte-viva") +
      "/assets/" +
      name +
      ".webp",
  );
  assert.equal(image.toString("ascii", 8, 12), "WEBP");
  assert.ok(image.length < 1024 * 1024, "cenário ou prancha abaixo de 1 MiB");
}
console.log(
  "PASS: mapas ilustrados mantidos e recursos substituídos fora da inicialização das fases.",
);
