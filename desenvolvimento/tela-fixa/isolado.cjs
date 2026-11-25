// Existing UI suites mount one game document at a time. The separate integration
// suite exercises the real permanent window and native fullscreen navigation.
const { chromium } = require("playwright-core");
const launch = chromium.launch.bind(chromium);
chromium.launch = async (...args) => {
  const browser = await launch(...args),
    newContext = browser.newContext.bind(browser);
  browser.newContext = async (options) => {
    const c = await newContext(options);
    await c.route("**/tela-fixa/entrada.js", (r) =>
      r.fulfill({
        contentType: "application/javascript",
        body: "/* isolated document fixture */",
      }),
    );
    return c;
  };
  browser.newPage = async (options) => {
    const c = await browser.newContext(options);
    return c.newPage();
  };
  return browser;
};
