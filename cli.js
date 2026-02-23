#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const minimist = require('minimist');
const { run } = require('./runner');
const { printReport } = require('./reporter');
const allTests = require('./tests/index');

const args = minimist(process.argv.slice(2), {
  string: ['tests', 'browser'],
  boolean: ['headless', 'help'],
  alias: { t: 'tests', b: 'browser', h: 'help' },
  default: { headless: false, browser: 'chrome' },
});

if (args.help) {
  console.log(`
Usage :
  node cli.js <urls.txt>                         Tester toutes les URLs du fichier
  node cli.js <url1> <url2> ...                  Tester des URLs passées en argument
  node cli.js urls.txt --tests rgaa-8-3          Sélectionner des tests spécifiques
  node cli.js urls.txt --browser firefox         Utiliser un navigateur spécifique

Options :
  --tests, -t     IDs des tests à lancer, séparés par des virgules (ex: rgaa-8-3,rgaa-8-4)
                  Par défaut : tous les tests disponibles.
  --browser, -b   Navigateur à utiliser : chromium | chrome | firefox | webkit  (défaut: chromium)
                  chrome = Chrome installé sur la machine, chromium = Chromium bundlé
  --headless      Lancer le navigateur sans fenêtre (par défaut: visible)
  --help, -h      Afficher cette aide

Tests disponibles :
${allTests.map(t => `  ${t.id}`).join('\n')}
`);
  process.exit(0);
}

// --- Collecte des URLs ---
const positionals = args._;
const urls = [];

for (const arg of positionals) {
  if (arg.startsWith('http://') || arg.startsWith('https://')) {
    urls.push(arg);
  } else {
    // C'est un fichier
    const filePath = path.resolve(arg);
    if (!fs.existsSync(filePath)) {
      console.error(`Fichier introuvable : ${filePath}`);
      process.exit(1);
    }
    const lines = fs.readFileSync(filePath, 'utf-8')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'));
    urls.push(...lines);
  }
}

if (urls.length === 0) {
  console.error('Aucune URL fournie. Lancez "node cli.js --help" pour l\'aide.');
  process.exit(1);
}

// --- Sélection des tests ---
let testsToRun = allTests;

if (args.tests) {
  const ids = args.tests.split(',').map(s => s.trim().toLowerCase());
  testsToRun = allTests.filter(t => ids.includes(t.id.toLowerCase()));
  if (testsToRun.length === 0) {
    console.error(`Aucun test trouvé pour : ${args.tests}`);
    console.error(`Tests disponibles : ${allTests.map(t => t.id).join(', ')}`);
    process.exit(1);
  }
}

// --- Lancement ---
const browserName = args.browser;
const headless = args.headless;

console.log(`\nLancement de ${testsToRun.length} test(s) sur ${urls.length} page(s) [${browserName}${headless ? '' : ' · visible'}]…\n`);

run(urls, testsToRun, { browser: browserName, headless })
  .then(report => {
    printReport(report);
    console.log('');
  })
  .catch(err => {
    console.error('Erreur inattendue :', err.message);
    process.exit(1);
  });
