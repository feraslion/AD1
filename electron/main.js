const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let serverProcess = null;

function startBackendServer() {
  return new Promise((resolve, reject) => {
    const unpackedPath = path.join(process.resourcesPath || '', 'app.asar.unpacked', 'dist', 'server.cjs');
    const relativePath = path.join(__dirname, '../dist/server.cjs');
    const localPath = path.join(__dirname, 'dist/server.cjs');

    let finalPath = relativePath;
    if (fs.existsSync(unpackedPath)) {
      finalPath = unpackedPath;
    } else if (fs.existsSync(relativePath)) {
      finalPath = relativePath;
    } else if (fs.existsSync(localPath)) {
      finalPath = localPath;
    }

    if (!fs.existsSync(finalPath)) {
      console.warn(`[Backend]: Could not find server script at ${finalPath}, proceeding with direct load.`);
      return resolve();
    }

    console.log(`[Backend]: Starting backend server from ${finalPath}`);

    const spawnEnv = {
      ...process.env,
      NODE_ENV: 'production',
      PORT: process.env.PORT || '3000',
      ELECTRON_RUN_AS_NODE: '1',
      JWT_SECRET: process.env.JWT_SECRET || 'ad1_erp_enterprise_production_jwt_secret_key_2026',
      REFRESH_SECRET: process.env.REFRESH_SECRET || 'ad1_erp_enterprise_production_refresh_secret_key_2026',
      SQL_HOST: process.env.SQL_HOST || '',
      SQL_USER: process.env.SQL_USER || '',
      SQL_PASSWORD: process.env.SQL_PASSWORD || ''
    };

    serverProcess = spawn(process.execPath, [finalPath], {
      env: spawnEnv,
      stdio: 'pipe'
    });

    let isResolved = false;

    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      console.log(`[Backend]: ${msg}`);
      if (!isResolved && (msg.includes('Server running on') || msg.includes('Server running') || msg.includes('3000'))) {
        isResolved = true;
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[Backend Error]: ${data.toString()}`);
    });

    serverProcess.on('error', (err) => {
      console.error('[Backend Spawn Error]:', err);
      if (!isResolved) {
        isResolved = true;
        reject(err);
      }
    });

    // Safety timeout after 5 seconds if stdout string format varies
    setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        resolve();
      }
    }, 5000);
  });
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'AD1 ERP & POS System',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000');
  } else {
    try {
      await startBackendServer();
      win.loadURL('http://localhost:3000');
    } catch (err) {
      console.error('Failed to start backend server:', err);
      dialog.showErrorBox(
        'فشل تشغيل الخادم',
        'تعذر تشغيل خادم النظام المحلي. تأكد من عدم استخدام المنفذ 3000 من برنامج آخر.'
      );
      app.quit();
    }
  }
}

function cleanupServer() {
  if (serverProcess) {
    try {
      serverProcess.kill('SIGTERM');
    } catch (_) {}
    serverProcess = null;
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  cleanupServer();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  cleanupServer();
});

