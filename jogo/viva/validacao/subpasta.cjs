const assert = require("node:assert/strict"),
  http = require("http"),
  fs = require("fs"),
  path = require("path"),
  { chromium } = require("playwright-core");
const root = path.resolve("dist"),
  prefix = "/GUARDIAO_DA_NATUREZA/";
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".json": "application/json",
  ".ttf": "font/ttf",
};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://localhost");
  if (!u.pathname.startsWith(prefix)) {
    res.writeHead(404);
    return res.end();
  }
  const relative =
      decodeURIComponent(u.pathname.slice(prefix.length)) || "index.html",
    file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) {
    res.writeHead(404);
    return res.end();
  }
  const size = fs.statSync(file).size,
    type = types[path.extname(file)] || "application/octet-stream",
    range = req.headers.range?.match(/bytes=(\d+)-(\d*)/);
  if (range) {
    const start = Number(range[1]),
      end = range[2] ? Math.min(size - 1, Number(range[2])) : size - 1;
    res.writeHead(206, {
      "Content-Type": type,
      "Content-Length": end - start + 1,
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
    });
    fs.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { "Content-Type": type, "Content-Length": size });
    fs.createReadStream(file).pipe(res);
  }
});
(async () => {
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  const base = "http://127.0.0.1:" + server.address().port + prefix,
    b = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    });
  try {
    const p = await b.newPage({
        viewport: { width: 844, height: 390 },
        isMobile: true,
        hasTouch: true,
      }),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("response", (r) => {
      if (r.status() >= 400) errors.push(r.status() + " " + r.url());
    });
    await p.goto(base);
    await p.waitForURL("**/GUARDIAO_DA_NATUREZA/jogo/viva/index.html#inicio");
    await p.waitForFunction(() => document.body.dataset.uiReady === "true");
    await p.click("#play-game");
    await p.click('[data-phase="1"]');
    await p.click("#start-phase");
    await p.waitForFunction(() => document.body.dataset.gameReady === "true");
    assert.match(p.url(), /GUARDIAO_DA_NATUREZA\/jogo\/floresta-viva/);
    await p.click("#conversa-avancar");
    await p.click("#conversa-avancar");
    await p.waitForTimeout(1800);
    await p.click("#pausa");
    await p.click("[data-adjust]");
    await p.click('[data-setting-tab="controles"]');
    assert.equal(await p.locator("[name=controlMode]").isVisible(), true);
    assert.deepEqual(errors, []);
    console.log(
      "PASS Pages em subpasta: entrada, menu, arte, primeira fase, conversa e ajustes sem 404.",
    );
  } finally {
    await b.close();
    await new Promise((ok) => server.close(ok));
  }
})().catch((e) => {
  console.error(e);
  server.close();
  process.exit(1);
});
