const { chromium } = require("playwright-core"),
  fs = require("fs");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const results = [];
  try {
    for (const id of [0, 1, 2, 3, 4, 5]) {
      const p = await browser.newPage({
        viewport: { width: 844, height: 390 },
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 2,
      });
      await p.addInitScript(() =>
        localStorage.setItem(
          "guardiao.mapa.progresso.v1",
          JSON.stringify({ completed: [1, 2, 3, 4], current: 5 }),
        ),
      );
      await p.goto(
        "http://127.0.0.1:4173/jogo/" +
          (id === 0
            ? "viva/"
            : id === 1
              ? "floresta-viva/"
              : "jornada/?fase=" + id),
      );
      await p.waitForFunction(
        (id) =>
          document.body.dataset[id === 0 ? "uiReady" : "gameReady"] === "true",
        id,
      );
      if (id === 0) {
        await p.click("#play-game");
        await p.waitForURL("**/#mapa");
      } else {
        for (let i = 0; i < 2; i++)
          await p.click(id === 1 ? "#conversa-avancar" : "#intro-next");
      }
      await p.waitForTimeout(600);
      const r = await p.evaluate(async () => {
        let last = performance.now(),
          gaps = [],
          long = [];
        const observer = new PerformanceObserver((list) =>
          long.push(...list.getEntries().map((e) => e.duration)),
        );
        observer.observe({ type: "longtask", buffered: false });
        await new Promise((resolve) => {
          const end = last + 2500;
          function frame(t) {
            gaps.push(t - last);
            last = t;
            if (t < end) requestAnimationFrame(frame);
            else resolve();
          }
          requestAnimationFrame(frame);
        });
        observer.disconnect();
        gaps.sort((a, b) => a - b);
        return {
          p95: gaps[Math.floor(gaps.length * 0.95)],
          max: gaps.at(-1),
          frames: gaps.length,
          longTasks: long.length,
          longMax: Math.max(0, ...long),
          bytes: performance
            .getEntriesByType("resource")
            .reduce((n, r) => n + r.encodedBodySize, 0),
          resources: performance.getEntriesByType("resource").map((r) => ({
            file: new URL(r.name).pathname,
            bytes: r.encodedBodySize,
          })),
        };
      });
      console.log(id, JSON.stringify({ ...r, resources: undefined }));
      results.push({ id, ...r });
      await p.close();
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(
    process.env.OUT || "/workspace/entregas/trilhas-vivas/antes.json",
    JSON.stringify(results, null, 2),
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
