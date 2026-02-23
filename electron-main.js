const { app, BrowserWindow, dialog } = require('electron');

let mainWindow = null;

app.whenReady().then(async () => {
  try {
    const { startServer } = require('./gui');
    const url = await startServer();

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

  } catch (err) {
    dialog.showErrorBox(
      'Erreur de démarrage',
      `Impossible de démarrer l'application :\n\n${err.message}`
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (!mainWindow) app.emit('ready');
});
