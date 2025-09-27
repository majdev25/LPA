const { ipcMain } = require("electron");

function registerIpcHandlers() {
  // Example IPC communication
  ipcMain.on("ping", (event, data) => {
    console.log("Received from Vue:", data);
    event.sender.send("pong", { msg: "Hello from Electron!" });
  });
}

module.exports = { registerIpcHandlers };
