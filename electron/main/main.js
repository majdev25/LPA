const path = require("path");
const { app, BrowserWindow, ipcMain } = require("electron");
const { registerIpcHandlers } = require("./ipc");

function createWindow() {
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
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  registerIpcHandlers(); // register IPC once app is ready
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
