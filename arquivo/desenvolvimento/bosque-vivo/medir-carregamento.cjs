const { chromium } = require("playwright-core"),
  fs = require("fs");
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const p = await b.newPage({
      viewport: { width: 844, height: 390 },
      hasTouch: true,
      isMobile: true,
    });
    await p.goto(
      (process.env.GUARDIAO_TEST_URL || "http://127.0.0.1:4173/jogo/viva/") +
        "index.html",
    );
    await p.waitForFunction(() => document.body.dataset.uiReady === "true");
    await p.waitForTimeout(1600);
    const report = await p.evaluate(() => {
      const entries = performance.getEntriesByType("resource");
      return {
        initialAssets: entries.length,
        encodedBytes: entries.reduce((n, e) => n + e.encodedBodySize, 0),
        videoRequested: entries.some((e) => /arvore-guardia.mp4/.test(e.name)),
        resources: entries.map((e) => ({
          file: new URL(e.name).pathname,
          bytes: e.encodedBodySize,
        })),
      };
    });
    fs.writeFileSync(
      "desenvolvimento/bosque-vivo/carregamento.json",
      JSON.stringify(report, null, 2) + "\n",
    );
    console.log(
      report.initialAssets +
        " recursos; " +
        (report.encodedBytes / 1048576).toFixed(2) +
        " MiB; vídeo solicitado no início: " +
        report.videoRequested,
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
