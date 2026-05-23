const { app, BrowserWindow } = require('electron');
const path = require('path');

// Standardize production environment variables
process.env.NODE_ENV = 'production';

// Start the Express server
try {
  require('../dist/server.cjs');
} catch (err) {
  console.error('Failed to initialize Express backend server:', err);
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    title: 'Spool Extractor',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadURL('http://localhost:3000');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

function performSecureCleanup() {
  const fs = require('fs');
  const appDataPath = process.env.APPDATA 
    ? path.join(process.env.APPDATA, 'spool-extractor')
    : path.join(process.cwd(), 'data');

  const DB_FILE = path.join(appDataPath, 'database.json');
  const UPLOADS_DIR = path.join(appDataPath, 'uploads');

  console.log("Electron main process: Performing secure shutdown cleanup...");

  // 1. Wipe database.json back to clean state
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      const db = JSON.parse(data);
      db.spools = [];
      db.jobs = [];
      db.logs = [
        {
          id: 'log-01',
          timestamp: new Date().toISOString(),
          userId: 'admin-01',
          username: 'admin',
          action: 'SYSTEM_READY',
          details: 'System cleared and ready for user testing.'
        }
      ];
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
      console.log("Database spools, jobs, and logs wiped successfully.");
    }
  } catch (err) {
    console.error("Error wiping database during Electron shutdown:", err);
  }

  // 2. Clear all files in uploads directory
  try {
    if (fs.existsSync(UPLOADS_DIR)) {
      const files = fs.readdirSync(UPLOADS_DIR);
      for (const file of files) {
        const filePath = path.join(UPLOADS_DIR, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      }
      console.log("Uploads directory cleared successfully.");
    }
  } catch (err) {
    console.error("Error clearing uploads directory during Electron shutdown:", err);
  }
}

app.on('before-quit', async (e) => {
  try {
    const { session } = require('electron');
    if (session && session.defaultSession) {
      e.preventDefault();
      await session.defaultSession.clearStorageData();
      console.log("Electron storage data cleared successfully.");
    }
  } catch (err) {
    console.error("Error clearing Electron session storage:", err);
  } finally {
    performSecureCleanup();
    app.exit(0);
  }
});

