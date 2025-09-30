const { ipcMain } = require("electron");

var systemGraph = {};

function registerIpcHandlers({ createWindow }) {
  function updateSystemGraph(graph) {
    systemGraph = graph;
    console.log(systemGraph);
  }

  ipcMain.handle("open-proces", async (event, { proces_id }) => {
    try {
      let proces = systemGraph.processes.find((x) => x.id == proces_id);
      console.log(proces);
      createWindow("proces", { proces, processes: systemGraph.processes });
      return true;
    } catch (err) {
      console.error("[open-proces] Error opening a proces window:", err);
      return false;
    }
  });

  ipcMain.handle("update-system", async (event, { graph }) => {
    try {
      updateSystemGraph(JSON.parse(graph));
      return true;
    } catch (err) {
      console.error("[update-system] Error updating system graph:", err);
      return false;
    }
  });
}

module.exports = { registerIpcHandlers };
