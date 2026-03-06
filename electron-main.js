const { app, BrowserWindow, dialog } = require('electron');

let mainWindow = null;

async function launch() {
  const { startServer, findPidOnPort, killPid } = require('./gui');

  let url;
  try {
    url = await startServer();
  } catch (err) {
    if (err.code !== 'EADDRINUSE') {
      dialog.showErrorBox('Erreur de démarrage', `Impossible de démarrer l'application :\n\n${err.message}`);
      app.quit();
      return;
    }

    const pid = findPidOnPort(3000);
    const desc = pid ? ` (PID ${pid})` : '';
    const { response } = await dialog.showMessageBox({
      type: 'question',
      buttons: ['Fermer et démarrer', 'Annuler'],
      defaultId: 0,
      title: 'Port déjà utilisé',
      message: `Le port 3000 est déjà utilisé${desc}.`,
      detail: 'Voulez-vous fermer cette instance et démarrer l\'application ?',
    });

    if (response !== 0) { app.quit(); return; }

    try {
      if (pid) killPid(pid);
    } catch (e) {
      dialog.showErrorBox('Erreur', `Impossible de fermer le processus${desc} :\n\n${e.message}`);
      app.quit();
      return;
    }

    await new Promise(r => setTimeout(r, 500));
    try {
      url = await startServer();
    } catch (e) {
      dialog.showErrorBox('Erreur de démarrage', `Impossible de démarrer l'application :\n\n${e.message}`);
      app.quit();
      return;
    }
  }

  mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    title: 'RGAA Batch Testing',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(url);
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(launch);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (!mainWindow) app.emit('ready');
});
