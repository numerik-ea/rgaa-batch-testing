#!/usr/bin/env node
/**
 * Génère les icônes de l'application Electron à partir d'un rendu Playwright.
 * Produit : build/icon.png (Linux), build/icon.ico (Windows), build/icon.icns (macOS)
 *
 * Usage : node scripts/generate-icon.js
 */

const { chromium } = require('playwright');
const pngToIco   = require('png-to-ico').default;
const png2icons  = require('png2icons');
const fs         = require('fs');
const path       = require('path');

const MAIN_SIZE  = 512;

// ---------------------------------------------------------------------------
// Design de l'icône (HTML + CSS, rendu par Chromium)
// ---------------------------------------------------------------------------
const ICON_HTML = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
    background: linear-gradient(145deg, #3b82f6 0%, #1e40af 100%);
  }
  .letters {
    color: white;
    font-family: 'Arial Black', 'Arial Bold', Arial, sans-serif;
    font-size: 36vw;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -1.5vw;
    text-shadow: 0 0.04em 0.18em rgba(0, 0, 0, 0.4);
  }
</style>
</head><body>
  <span class="letters">RBT</span>
</body></html>`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function renderAtSize(page, size) {
  await page.setViewportSize({ width: size, height: size });
  return page.screenshot({ clip: { x: 0, y: 0, width: size, height: size } });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function generate() {
  const buildDir = path.resolve(__dirname, '..', 'build');
  fs.mkdirSync(buildDir, { recursive: true });

  console.log('\nGénération des icônes RBT…\n');

  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();

  await page.setContent(ICON_HTML, { waitUntil: 'load' });
  // Attendre que les polices système soient prêtes
  await page.evaluate(() => document.fonts.ready);

  // 1. PNG 512×512 — Linux + source pour ICNS
  const mainPng = await renderAtSize(page, MAIN_SIZE);
  fs.writeFileSync(path.join(buildDir, 'icon.png'), mainPng);
  console.log(`  ✅ build/icon.png   (${MAIN_SIZE}×${MAIN_SIZE})`);

  // 2. ICO multi-tailles — Windows
  // png-to-ico accepte un chemin de fichier et génère automatiquement les tailles
  const icoBuffer = await pngToIco(path.join(buildDir, 'icon.png'));
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);
  console.log('  ✅ build/icon.ico   (16–256px, multi-tailles)');

  // 3. ICNS — macOS
  const icnsBuffer = png2icons.createICNS(mainPng, png2icons.BILINEAR, 0);
  if (icnsBuffer) {
    fs.writeFileSync(path.join(buildDir, 'icon.icns'), icnsBuffer);
    console.log('  ✅ build/icon.icns  (macOS)');
  } else {
    console.warn('  ⚠️  build/icon.icns — échec, le build macOS utilisera l\'icône par défaut');
  }

  await browser.close();
  console.log('\nTerminé. Les fichiers sont dans build/\n');
}

generate().catch(err => {
  console.error('\nErreur :', err.message);
  process.exit(1);
});
