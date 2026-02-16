const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let backendProcess = null;
let mainWindow = null;

// 获取后端 exe 路径
function getBackendPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'backend.exe');
  }
  return path.join(__dirname, '../backend/dist/backend.exe');
}

// 获取前端路径
function getFrontendPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'frontend');
  }
  return path.join(__dirname, '../frontend/dist');
}

// 启动后端
function startBackend() {
  const backendPath = getBackendPath();
  const dbPath = path.join(app.getPath('userData'), 'data', 'app.db');
  const dbDir = path.dirname(dbPath);
  
  // 确保数据库目录存在
  const fs = require('fs');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  console.log('Starting backend:', backendPath);
  console.log('Database path:', dbPath);
  
  backendProcess = spawn(backendPath, [], {
    env: {
      ...process.env,
      SQLITE_PATH: dbPath,
      SECRET_KEY: 'fart-manager-secret-key-2024',
      JWT_SECRET_KEY: 'fart-manager-jwt-secret-2024',
      FLASK_ENV: 'production',
    },
    stdio: 'inherit',
  });
  
  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err);
  });
  
  backendProcess.on('exit', (code) => {
    console.log('Backend exited with code:', code);
    backendProcess = null;
  });
}

// 等待后端就绪
function waitForBackend(maxRetries = 60) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const check = () => {
      const req = http.get('http://127.0.0.1:5000/api/health', (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          retry();
        }
      });
      req.on('error', retry);
      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      retries++;
      if (retries >= maxRetries) {
        reject(new Error('Backend not ready after ' + maxRetries + ' retries'));
      } else {
        setTimeout(check, 500);
      }
    };
    check();
  });
}

// 创建窗口
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'assets/icon.ico'),
    title: '屁管家',
  });

  // 开发模式加载本地服务器，生产模式加载静态文件
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(getFrontendPath(), 'index.html'));
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  // 开发模式下打开 DevTools
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 应用就绪
app.whenReady().then(async () => {
  console.log('App is ready, starting backend...');
  
  try {
    startBackend();
    console.log('Waiting for backend...');
    await waitForBackend();
    console.log('Backend is ready!');
    await createWindow();
  } catch (err) {
    console.error('Failed to start:', err);
    app.quit();
  }

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

// 所有窗口关闭时退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出时清理后端进程
app.on('will-quit', () => {
  if (backendProcess) {
    console.log('Killing backend process...');
    backendProcess.kill();
    backendProcess = null;
  }
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
