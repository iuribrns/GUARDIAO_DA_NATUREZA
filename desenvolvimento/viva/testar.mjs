import { spawn } from "node:child_process";
import { resolve } from "node:path";
const production = process.argv.includes("--production"),
  port = production ? 4187 : 5187,
  origin = `http://127.0.0.1:${port}`,
  root = resolve(".");
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    ...(production ? ["preview"] : []),
    "--config",
    "desenvolvimento/vite.config.mjs",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  { cwd: root, stdio: ["ignore", "pipe", "pipe"] },
);
let log = "";
server.stdout.on("data", (d) => (log += d));
server.stderr.on("data", (d) => (log += d));
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw Error(log);
    try {
      if ((await fetch(origin + "/jogo/viva/index.html")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  if (!ready) throw Error("Servidor indisponível: " + log);
  for (const file of [
    "jogo/vida-natural/validacao/fisica.cjs",
    "jogo/viva/validacao/colisoes.cjs",
    "jogo/viva/validacao/interface.cjs",
    "desenvolvimento/brisa/interface.cjs",
    ...(production ? ["jogo/viva/validacao/subpasta.cjs"] : []),
    "jogo/viva/validacao/campanha.cjs",
  ])
    await new Promise((ok, bad) => {
      const child = spawn(process.execPath, [file], {
        cwd: root,
        stdio: "inherit",
        env: {
          ...process.env,
          GUARDIAO_TEST_URL: origin + "/jogo/viva/",
          GUARDIAO_PRODUCTION: String(production),
        },
      });
      child.on("error", bad);
      child.on("exit", (code) =>
        code === 0 ? ok() : bad(Error(file + " falhou: " + code)),
      );
    });
  console.log(
    "PASS fluxo atual: colisões, interface, configurações na fase, reinício, encerramento no mapa e cinco fases com teclado e toque.",
  );
} finally {
  server.kill("SIGTERM");
}
