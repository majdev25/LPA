const path = require("path");
const { app, BrowserWindow, ipcMain } = require("electron");
const { registerIpcHandlers } = require("./ipc");

const windows = new Map();

function createWindow(type, data, id) {
  if (windows.has(id)) {
    focusWindow(id);
    return;
  }
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../../vue/dist/index.html"));
    win.webContents.openDevTools();
  }

  win.webContents.on("did-finish-load", () => {
    win.webContents.send("win-type", type);
    win.webContents.send("win-id", id);
    win.webContents.send("win-data", data);
  });

  win.on("closed", () => {
    windows.delete(id);
  });

  windows.set(id, win);
}

// App lifecycle
app.whenReady().then(() => {
  createWindow(
    "system",
    {
      systemGraph: {
        processes: [],
        channels: [],
      },
    },
    "root"
  );

  const dep = { createWindow, windows, restartApp };
  registerIpcHandlers(dep); // register IPC once app is ready
});

function restartApp(systemGraph) {
  // Close all existing windows
  for (const win of windows.values()) {
    if (!win.isDestroyed()) {
      win.close();
    }
  }
  windows.clear();

  console.log(windows);

  createWindow(
    "system",
    {
      systemGraph: systemGraph.systemGraph,
    },
    "root"
  );
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

function focusWindow(id) {
  const existingWin = windows.get(id);

  if (!existingWin.isDestroyed()) {
    if (existingWin.isMinimized()) {
      existingWin.restore();
    }
    existingWin.focus();
    return existingWin;
  } else {
    windows.delete(id);
  }
}
