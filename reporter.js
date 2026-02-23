const ICONS = { pass: '✅', fail: '❌', warn: '⚠️ ', error: '💥' };
const LABELS = { pass: 'PASS', fail: 'FAIL', warn: 'WARN', error: 'ERR ' };
const LINE = '─'.repeat(72);

function padEnd(str, len) {
  // Tronque si trop long, complète avec des espaces sinon
  if (str.length > len) return str.slice(0, len - 1) + '…';
  return str + ' '.repeat(len - str.length);
}

function printReport(report) {
  const totals = { pass: 0, fail: 0, warn: 0, error: 0 };

  for (const { test, results } of report) {
    console.log(`\n${test.id} — ${test.title}`);
    console.log(LINE);

    const counts = { pass: 0, fail: 0, warn: 0, error: 0 };

    for (const { url, status, info, error } of results) {
      const icon = ICONS[status] ?? '?';
      const label = LABELS[status] ?? status;
      const detail = error ? `Erreur : ${error}` : (info ?? '');
      console.log(`${icon} ${label}  ${padEnd(url, 50)}  ${detail}`);
      counts[status] = (counts[status] ?? 0) + 1;
      totals[status] = (totals[status] ?? 0) + 1;
    }

    console.log(LINE);
    const summary = Object.entries(counts)
      .filter(([, n]) => n > 0)
      .map(([s, n]) => `${n} ${s.toUpperCase()}`)
      .join(' · ');
    console.log(`${summary}  sur ${results.length} page${results.length > 1 ? 's' : ''}`);
  }

  if (report.length > 1) {
    console.log('\n' + '═'.repeat(72));
    console.log('RÉSUMÉ GLOBAL');
    console.log('═'.repeat(72));
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    const summary = Object.entries(totals)
      .filter(([, n]) => n > 0)
      .map(([s, n]) => `${n} ${s.toUpperCase()}`)
      .join(' · ');
    console.log(`${summary}  sur ${total} test${total > 1 ? 's' : ''} au total`);
  }
}

module.exports = { printReport };
