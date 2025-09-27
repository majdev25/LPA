const { contextBridge, ipcRenderer } = require("electron");

window.addEventListener("DOMContentLoaded", () => {
  console.log("Preload loaded");
});

contextBridge.exposeInMainWorld("electronAPI", {
  sendToMain: (channel, data) => ipcRenderer.send(channel, data),
  onFromMain: (channel, callback) =>
    ipcRenderer.on(channel, (event, data) => callback(data)),
});
