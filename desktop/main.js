const { app, BrowserWindow, dialog } = require('electron');
const http = require('node:http');
const { startServer } = require('../backend/server');

let backend;

function isBackendRunning() {
  return new Promise((resolve) => {
    const request = http.get('http://127.0.0.1:8080/api/status', () => resolve(true));
    request.on('error', () => resolve(false));
    request.setTimeout(1000, () => { request.destroy(); resolve(false); });
  });
}

async function ensureBackend() {
  if (await isBackendRunning()) return;
  backend = await startServer();
}

async function createWindow() {
  try {
    await ensureBackend();
    const window = new BrowserWindow({ width: 1280, height: 850, minWidth: 900, minHeight: 650, title: 'Meu XAMPP', webPreferences: { contextIsolation: true, nodeIntegration: false } });
    await window.loadURL('http://127.0.0.1:8080');
  } catch (error) {
    dialog.showErrorBox('Meu XAMPP', error.message);
    app.quit();
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (backend) backend.close(); if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => { if (backend) backend.close(); });
