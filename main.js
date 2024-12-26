const { app, BrowserWindow, autoUpdater } = require('electron');
const path = require('path');
const electronReload = require('electron-reload');

var is_development = true;

const UI_FOLDER = path.join(__dirname, 'ui');
const DIST_FOLDER = path.join(UI_FOLDER, 'dist');
const BASE_URL = is_development ? "http://localhost:3001" : `file://${path.join(DIST_FOLDER, 'index.html')}`;

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

if (is_development) {
  electronReload(UI_FOLDER, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
  });
}

let mainWindow;

let update_data = {
  current_version: app.getVersion(),
  update_available: false,
  data: null,
  is_downloading: false,
  update_downloaded: false,
  error: null
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false, // This is the default after Electron v5
      contextIsolation: true, // Protect against prototype pollution
      enableRemoteModule: false, // Disable remote module (security)
      preload: path.join(__dirname, 'preload.js') // Preload script
    },
    icon: path.join(__dirname, 'eHisaab.ico'), // Set the window icon
    title: "eHisaab"
  });

  const startURL = is_development
    ? BASE_URL
    : `file://${path.join(DIST_FOLDER, 'index.html')}`;

  mainWindow.loadURL(startURL);

  if (is_development) {
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

autoUpdater.on('update-available', (info) => {
  update_data.update_available = true;
  update_data.data = info;
});

autoUpdater.on('update-downloaded', () => {
  update_data.update_downloaded = true;
});

autoUpdater.on('error', (err) => {
  update_data.error = err;
});

function checkForUpdates() {
  if (!is_development) {
    autoUpdater.checkForUpdates();
  }
}

app.whenReady().then(() => {
  checkForUpdates();
});
