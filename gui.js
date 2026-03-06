#!/usr/bin/env node

const http = require('http');
const { run } = require('./runner');
const allTests = require('./tests/index');

const PORT = 3000;
const HOST = 'localhost';

// ---------------------------------------------------------------------------
// HTML de l'interface graphique (embarqué dans le serveur, sans dépendance)
// ---------------------------------------------------------------------------
const HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>RGAA Batch Testing</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --pass:    #16a34a;
      --fail:    #dc2626;
      --warn:    #d97706;
      --error:   #7c3aed;
      --bg:      #f8fafc;
      --card:    #ffffff;
      --border:  #e2e8f0;
      --text:    #1e293b;
      --muted:   #64748b;
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
    }

    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.25rem; }

    .subtitle { color: var(--muted); margin-bottom: 2rem; font-size: 0.95rem; }

    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .card h2 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; }

    label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; }

    textarea {
      width: 100%;
      min-height: 120px;
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      font-family: monospace;
      font-size: 0.875rem;
      resize: vertical;
      color: var(--text);
      background: var(--bg);
    }
    textarea:focus { outline: 2px solid var(--primary); outline-offset: 2px; border-color: transparent; }

    .file-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.75rem;
      font-size: 0.875rem;
      color: var(--muted);
    }

    .tests-actions { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }

    .btn-link {
      background: none;
      border: none;
      color: var(--primary);
      cursor: pointer;
      font-size: 0.8rem;
      padding: 0;
      text-decoration: underline;
    }

    .tests-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 0.5rem;
    }

    .test-item {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 400;
    }
    .test-item:hover { background: var(--bg); }
    .test-item input[type="checkbox"] { margin-top: 2px; flex-shrink: 0; accent-color: var(--primary); }
    .test-id { font-weight: 600; font-size: 0.8rem; color: var(--primary); }
    .test-title { color: var(--muted); font-size: 0.8rem; }

    .options-row { display: flex; gap: 2rem; align-items: flex-end; flex-wrap: wrap; }
    .options-row > div { display: flex; flex-direction: column; gap: 0.5rem; }

    input[type="text"], input[type="password"] {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      font-size: 0.875rem;
      background: var(--bg);
      color: var(--text);
    }
    input[type="text"]:focus, input[type="password"]:focus {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
      border-color: transparent;
    }

    .auth-row { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; }
    .auth-row > div { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; min-width: 160px; }

    select {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      font-size: 0.875rem;
      background: var(--bg);
      color: var(--text);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      cursor: pointer;
      font-weight: 400;
    }
    .checkbox-label input { accent-color: var(--primary); }

    .run-btn {
      width: 100%;
      padding: 0.875rem;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 0.75rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      margin-bottom: 1.5rem;
    }
    .run-btn:hover:not(:disabled) { background: var(--primary-hover); }
    .run-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    #loading {
      text-align: center;
      padding: 2rem;
      color: var(--muted);
      font-size: 0.95rem;
      margin-bottom: 1.5rem;
    }

    .spinner {
      display: inline-block;
      width: 1.25rem;
      height: 1.25rem;
      border: 3px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      vertical-align: middle;
      margin-right: 0.5rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .result-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      overflow: hidden;
      margin-bottom: 1.5rem;
    }

    .result-card-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .result-card-header h3 { font-size: 1rem; font-weight: 600; }
    .test-meta { font-size: 0.8rem; color: var(--muted); margin-top: 0.2rem; }

    .badges { display: flex; gap: 0.4rem; flex-shrink: 0; }
    .badge { padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
    .badge-pass  { background: #dcfce7; color: var(--pass); }
    .badge-fail  { background: #fee2e2; color: var(--fail); }
    .badge-warn  { background: #fef3c7; color: var(--warn); }
    .badge-error { background: #ede9fe; color: var(--error); }

    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th {
      text-align: left;
      padding: 0.6rem 1.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: var(--bg);
      border-bottom: 1px solid var(--border);
    }
    td { padding: 0.75rem 1.5rem; border-bottom: 1px solid var(--border); vertical-align: top; }
    tr:last-child td { border-bottom: none; }

    .status-cell { display: flex; align-items: center; gap: 0.4rem; font-weight: 600; font-size: 0.8rem; white-space: nowrap; }
    .status-pass  { color: var(--pass); }
    .status-fail  { color: var(--fail); }
    .status-warn  { color: var(--warn); }
    .status-error { color: var(--error); }

    .url-cell {
      font-family: monospace;
      font-size: 0.8rem;
      word-break: break-all;
    }
    .info-cell { color: var(--muted); font-size: 0.8rem; }

    .summary-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .summary-card h2 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .summary-stat { text-align: center; padding: 1rem; border-radius: 0.5rem; }
    .summary-stat.pass  { background: #dcfce7; }
    .summary-stat.fail  { background: #fee2e2; }
    .summary-stat.warn  { background: #fef3c7; }
    .summary-stat.error { background: #ede9fe; }
    .summary-stat .count { font-size: 2rem; font-weight: 700; }
    .summary-stat.pass  .count { color: var(--pass); }
    .summary-stat.fail  .count { color: var(--fail); }
    .summary-stat.warn  .count { color: var(--warn); }
    .summary-stat.error .count { color: var(--error); }
    .summary-stat .stat-label { font-size: 0.8rem; font-weight: 500; margin-top: 0.25rem; color: var(--muted); }

    .error-box {
      background: #fee2e2;
      color: var(--fail);
      padding: 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    [hidden] { display: none !important; }
  </style>
</head>
<body>
<div class="container">
  <h1>RGAA Batch Testing</h1>
  <p class="subtitle">Tests d'accessibilité automatisés sur un ensemble de pages web</p>

  <div class="card">
    <h2>URLs à tester</h2>
    <label for="urls-input">Saisir les URLs (une par ligne)/Extraire les URLs du texte collé</label>
    <textarea id="urls-input" placeholder="https://example.com&#10;https://example.org/page"></textarea>
    <div class="file-row">
      <span>ou charger un fichier .txt</span>
      <input type="file" id="file-input" accept=".txt">
      <span id="paste-hint" hidden style="color:var(--pass);font-size:0.8rem;margin-left:auto"></span>
    </div>
  </div>

  <div class="card">
    <h2>Authentification HTTP (htaccess)</h2>
    <p style="font-size:0.875rem;color:var(--muted);margin-bottom:1rem;">Laisser vide si les pages ne sont pas protégées.</p>
    <form class="auth-row" onsubmit="return false">
      <div>
        <label for="auth-user">Identifiant</label>
        <input type="text" id="auth-user" placeholder="login" autocomplete="username">
      </div>
      <div>
        <label for="auth-pass">Mot de passe</label>
        <input type="password" id="auth-pass" placeholder="••••••••" autocomplete="current-password">
      </div>
    </form>
  </div>

  <div class="card">
    <h2>Tests à exécuter</h2>
    <div class="tests-actions">
      <button class="btn-link" id="select-all">Tout sélectionner</button>
      <span style="color:var(--muted)">·</span>
      <button class="btn-link" id="deselect-all">Tout désélectionner</button>
    </div>
    <div class="tests-grid" id="tests-list"></div>
  </div>

  <div class="card">
    <h2>Options</h2>
    <div class="options-row">
      <div>
        <label for="browser-select">Navigateur</label>
        <select id="browser-select">
          <option value="chrome">Chrome (installé)</option>
          <option value="chromium">Chromium (bundlé)</option>
          <option value="firefox">Firefox</option>
          <option value="webkit">WebKit</option>
        </select>
      </div>
      <div style="justify-content:center">
        <label class="checkbox-label">
          <input type="checkbox" id="headless-check">
          Mode sans fenêtre (headless)
        </label>
      </div>
    </div>
  </div>

  <button class="run-btn" id="run-btn">Lancer les tests</button>

  <div id="loading" hidden>
    <span class="spinner"></span>Tests en cours… Veuillez patienter.
  </div>

  <div id="error-container"></div>
  <div id="results"></div>
</div>

  <script>
    const ICONS = { pass: '✅', fail: '❌', warn: '⚠️', error: '💥' };
    const STATUS_LABELS = { pass: 'PASS', fail: 'FAIL', warn: 'WARN', error: 'ERR' };

    // Chargement de la liste des tests disponibles
    fetch('/tests')
      .then(r => r.json())
      .then(tests => {
        const grid = document.getElementById('tests-list');
        grid.innerHTML = tests.map(t => \`
          <label class="test-item">
            <input type="checkbox" class="test-checkbox" value="\${t.id}" checked>
            <div>
              <div class="test-id">\${t.id}</div>
              <div class="test-title">\${t.title}</div>
            </div>
          </label>
        \`).join('');
      });

    // Extraire les URLs d'un texte quelconque collé
    function extractUrls(text) {
      const results = [];
      let i = 0;
      while (i < text.length) {
        const h = text.indexOf('http', i);
        if (h === -1) break;
        if (text.slice(h, h + 8) !== 'https://' && text.slice(h, h + 7) !== 'http://') {
          i = h + 1;
          continue;
        }
        let end = h;
        while (end < text.length) {
          const c = text.charCodeAt(end);
          // Arrêt sur espace(32) tab(9) LF(10) CR(13) < > " ' { } ( ) [ ]
          if (c===32||c===9||c===10||c===13||c===60||c===62||c===34||c===39||c===123||c===125||c===40||c===41||c===91||c===93) break;
          end++;
        }
        // Supprimer la ponctuation traînante
        while (end > h && '.,;:!?)'.indexOf(text[end - 1]) !== -1) end--;
        if (end > h) results.push(text.slice(h, end));
        i = end + 1;
      }
      return [...new Set(results)];
    }

    document.getElementById('urls-input').addEventListener('paste', e => {
      const pasted = (e.clipboardData || window.clipboardData).getData('text');
      const urls = extractUrls(pasted);
      if (urls.length > 0) {
        e.preventDefault();
        const ta = document.getElementById('urls-input');
        const existing = ta.value.trim();
        ta.value = existing ? existing + '\\n' + urls.join('\\n') : urls.join('\\n');
        const hint = document.getElementById('paste-hint');
        hint.textContent = urls.length + ' URL' + (urls.length > 1 ? 's extraites' : ' extraite') + ' du texte collé';
        hint.hidden = false;
        clearTimeout(hint._t);
        hint._t = setTimeout(() => { hint.hidden = true; }, 4000);
      }
    });

    // Charger un fichier .txt d'URLs
    document.getElementById('file-input').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        document.getElementById('urls-input').value = ev.target.result.trim();
      };
      reader.readAsText(file);
    });

    // Sélection globale des tests
    document.getElementById('select-all').addEventListener('click', () => {
      document.querySelectorAll('.test-checkbox').forEach(cb => cb.checked = true);
    });
    document.getElementById('deselect-all').addEventListener('click', () => {
      document.querySelectorAll('.test-checkbox').forEach(cb => cb.checked = false);
    });

    // Lancement des tests
    document.getElementById('run-btn').addEventListener('click', async () => {
      const urlsText = document.getElementById('urls-input').value.trim();
      const urls = urlsText.split('\\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'));

      if (urls.length === 0) {
        alert('Veuillez saisir au moins une URL.');
        return;
      }

      const selectedTests = [...document.querySelectorAll('.test-checkbox:checked')].map(cb => cb.value);
      if (selectedTests.length === 0) {
        alert('Veuillez sélectionner au moins un test.');
        return;
      }

      const browser = document.getElementById('browser-select').value;
      const headless = document.getElementById('headless-check').checked;
      const authUser = document.getElementById('auth-user').value.trim();
      const authPass = document.getElementById('auth-pass').value;
      const httpCredentials = authUser ? { username: authUser, password: authPass } : null;

      document.getElementById('run-btn').disabled = true;
      document.getElementById('loading').hidden = false;
      document.getElementById('results').innerHTML = '';
      document.getElementById('error-container').innerHTML = '';

      try {
        const response = await fetch('/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls, tests: selectedTests, browser, headless, httpCredentials }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erreur serveur');
        renderResults(data);
      } catch (err) {
        document.getElementById('error-container').innerHTML =
          \`<div class="error-box">Erreur : \${err.message}</div>\`;
      } finally {
        document.getElementById('run-btn').disabled = false;
        document.getElementById('loading').hidden = true;
      }
    });

    function renderResults(report) {
      const totals = { pass: 0, fail: 0, warn: 0, error: 0 };
      let html = '';

      for (const { test, results } of report) {
        const counts = { pass: 0, fail: 0, warn: 0, error: 0 };
        for (const r of results) counts[r.status] = (counts[r.status] || 0) + 1;
        for (const [s, n] of Object.entries(counts)) totals[s] = (totals[s] || 0) + n;

        const badges = Object.entries(counts)
          .filter(([, n]) => n > 0)
          .map(([s, n]) => \`<span class="badge badge-\${s}">\${n} \${STATUS_LABELS[s]}</span>\`)
          .join('');

        const rows = results.map(r => {
          const detail = r.error ? \`Erreur : \${r.error}\` : (r.info || '');
          return \`
            <tr>
              <td><div class="status-cell status-\${r.status}">\${ICONS[r.status]} \${STATUS_LABELS[r.status]}</div></td>
              <td><div class="url-cell" title="\${r.url}">\${r.url}</div></td>
              <td class="info-cell">\${detail}</td>
            </tr>
          \`;
        }).join('');

        html += \`
          <div class="result-card">
            <div class="result-card-header">
              <div>
                <h3>\${test.id}</h3>
                <div class="test-meta">\${test.title}</div>
              </div>
              <div class="badges">\${badges}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width:110px">Statut</th>
                  <th>URL</th>
                  <th>Détail</th>
                </tr>
              </thead>
              <tbody>\${rows}</tbody>
            </table>
          </div>
        \`;
      }

      if (report.length > 1) {
        const stats = ['pass', 'fail', 'warn', 'error'].map(s => \`
          <div class="summary-stat \${s}">
            <div class="count">\${totals[s] || 0}</div>
            <div class="stat-label">\${STATUS_LABELS[s]}</div>
          </div>
        \`).join('');
        html = \`<div class="summary-card"><h2>Résumé global</h2><div class="summary-grid">\${stats}</div></div>\` + html;
      }

      document.getElementById('results').innerHTML = html;
      document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
    }
  </script>
</body>
</html>`;

// ---------------------------------------------------------------------------
// Serveur HTTP
// ---------------------------------------------------------------------------
const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML);
    return;
  }

  if (req.method === 'GET' && req.url === '/tests') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(allTests.map(t => ({ id: t.id, title: t.title }))));
    return;
  }

  if (req.method === 'POST' && req.url === '/run') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      try {
        const { urls, tests, browser, headless, httpCredentials } = JSON.parse(body);
        const selectedTests = allTests.filter(t => tests.includes(t.id));
        const report = await run(urls, selectedTests, { browser, headless, httpCredentials });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(report));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

// ---------------------------------------------------------------------------
// Export — permet à electron-main.js de démarrer le serveur sans auto-lancement
// ---------------------------------------------------------------------------
function startServer(port = PORT) {
  return new Promise((resolve, reject) => {
    const onError = (err) => reject(err);
    server.once('error', onError);
    server.listen(port, HOST, () => {
      server.removeListener('error', onError);
      resolve(`http://${HOST}:${port}`);
    });
  });
}

module.exports = { startServer, findPidOnPort, killPid };

function findPidOnPort(port) {
  const { execSync } = require('child_process');
  try {
    if (process.platform === 'win32') {
      const out = execSync(`netstat -ano`).toString();
      for (const line of out.split('\n')) {
        if (line.includes(`:${port} `) && line.includes('LISTENING')) {
          const pid = line.trim().split(/\s+/).pop();
          if (pid && !isNaN(pid)) return pid;
        }
      }
    } else {
      return execSync(`lsof -ti :${port}`).toString().trim().split('\n')[0];
    }
  } catch {}
  return null;
}

function killPid(pid) {
  const { execSync } = require('child_process');
  if (process.platform === 'win32') {
    execSync(`taskkill /F /PID ${pid}`);
  } else {
    execSync(`kill -9 ${pid}`);
  }
}

// Auto-démarrage uniquement si le fichier est exécuté directement (node gui.js)
if (require.main === module) {
  const readline = require('readline');
  const { exec } = require('child_process');

  function launch() {
    startServer()
      .then(url => {
        console.log(`\nInterface graphique disponible : ${url}\n`);
        console.log('Appuyez sur Ctrl+C pour arrêter le serveur.\n');
        const cmd =
          process.platform === 'win32' ? `start "" "${url}"` :
          process.platform === 'darwin' ? `open "${url}"` :
          `xdg-open "${url}"`;
        exec(cmd);
      })
      .catch(err => {
        if (err.code === 'EADDRINUSE') {
          const pid = findPidOnPort(PORT);
          const desc = pid ? ` (PID ${pid})` : '';
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
          rl.question(`\nLe port ${PORT} est déjà utilisé${desc}. Fermer cette instance et démarrer ? [o/N] `, answer => {
            rl.close();
            if (answer.trim().toLowerCase() === 'o') {
              try {
                if (pid) killPid(pid);
                setTimeout(launch, 500);
              } catch (e) {
                console.error(`\nImpossible de fermer le processus : ${e.message}\n`);
                process.exit(1);
              }
            } else {
              console.log('\nAnnulé.\n');
              process.exit(0);
            }
          });
        } else {
          console.error('\nErreur serveur :', err.message, '\n');
          process.exit(1);
        }
      });
  }

  launch();

  process.on('SIGINT', () => {
    server.close(() => {
      console.log('\nServeur arrêté.');
      process.exit(0);
    });
  });
}
