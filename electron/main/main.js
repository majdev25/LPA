const path = require("path");
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { registerIpcHandlers } = require("./ipc");

const windows = new Map();
let root_win_counter = 0;

let forceQuit = false;

let hasUnsavedState = false;

function createWindow(type, data, id) {
  const isRoot = id === "root";
  if (isRoot) {
    id = id + root_win_counter++;
  }
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

  windows.set(id, win);
  win.__isRoot = isRoot;

  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../../vue/dist/index.html"));
    //win.webContents.openDevTools();
  }

  win.webContents.on("did-finish-load", () => {
    win.webContents.send("win-type", type);
    win.webContents.send("win-id", id);
    win.webContents.send("win-data", data);
  });

  win.on("close", (event) => {
    if (!win.__isRoot || forceQuit) return;

    if (!hasUnsavedState) {
      forceQuit = true;
      return;
    }

    const choice = dialog.showMessageBoxSync(win, {
      type: "question",
      buttons: ["Prekliči", "Nadaljuj"],
      defaultId: 0,
      cancelId: 0,
      title: "Ali ste prepričani, da želite nadaljevati?",
      message:
        "Trenutno stanje bo izgubljeno. Prepričajte se, da ste shranili svoje delo.",
    });

    if (choice === 0) {
      event.preventDefault();
      return;
    }

    // uporabnik je potrdil → dovoli zapiranje okna
    forceQuit = true;
  });

  win.on("closed", () => {
    windows.delete(id);
    console.log("window closed:", id);
  });
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
    "root",
  );

  const dep = { createWindow, windows, restartApp, setUnsavedState };
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

  forceQuit = false;
  createWindow(
    "system",
    {
      systemGraph: systemGraph.systemGraph,
    },
    "root",
  );
}

app.on("window-all-closed", () => {
  // zdaj res zapri aplikacijo (tudi na macOS)
  app.quit();
});

app.on("activate", () => {
  if (windows.size === 0) {
    root_win_counter = 0; // optional but recommended
    createWindow(
      "system",
      {
        systemGraph: {
          processes: [],
          channels: [],
        },
      },
      "root",
    );
  }
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

function setUnsavedState(state = true) {
  hasUnsavedState = state;
}
