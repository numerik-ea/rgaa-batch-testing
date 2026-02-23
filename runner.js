const playwright = require('playwright');

const BROWSERS = ['chromium', 'chrome', 'firefox', 'webkit'];

/**
 * Exécute une liste de tests sur une liste d'URLs.
 *
 * @param {string[]} urls
 * @param {object[]} tests    - tableau de { id, title, script }
 * @param {object}   options
 * @param {string}   options.browser   - 'chromium' | 'chrome' | 'firefox' | 'webkit' (défaut: 'chromium')
 * @param {boolean}  options.headless  - true = sans fenêtre, false = avec fenêtre (défaut: false)
 * @returns {Promise<object[]>}
 */
async function run(urls, tests, { browser = 'chrome', headless = false } = {}) {
  if (!BROWSERS.includes(browser)) {
    throw new Error(`Navigateur inconnu : "${browser}". Valeurs acceptées : ${BROWSERS.join(', ')}`);
  }
  // 'chrome' utilise le moteur Chromium avec le canal Chrome installé sur la machine
  const engine = browser === 'chrome' ? 'chromium' : browser;
  const launchOptions = { headless };
  if (browser === 'chrome') launchOptions.channel = 'chrome';
  const browserInstance = await playwright[engine].launch(launchOptions);
  const report = tests.map(test => ({ test, results: [] }));

  for (const url of urls) {
    const context = await browserInstance.newContext();
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (err) {
      // Si la page ne charge pas, on enregistre l'erreur pour tous les tests
      for (const entry of report) {
        entry.results.push({ url, status: 'error', value: null, info: null, error: err.message });
      }
      await context.close();
      continue;
    }

    for (const entry of report) {
      try {
        const result = await page.evaluate(entry.test.script);
        entry.results.push({ url, ...result, error: null });
      } catch (err) {
        entry.results.push({ url, status: 'error', value: null, info: null, error: err.message });
      }
    }

    await context.close();
  }

  await browserInstance.close();
  return report;
}

module.exports = { run };
