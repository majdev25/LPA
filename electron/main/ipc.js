const { ipcMain } = require("electron");

var systemGraph = {};

function registerIpcHandlers({ createWindow }) {
  function updateSystemGraph(graph) {
    // remove procesGraph property from processes
    const cleanedProcesses = graph.processes.map(
      ({ procesGraph, ...rest }) => rest
    );

    // channels don’t have procesGraph, so just copy them
    const cleanedChannels = graph.channels.map((channel) => ({ ...channel }));

    systemGraph = {
      processes: cleanedProcesses,
      channels: cleanedChannels,
    };

    console.log(systemGraph);
  }

  function updateProcesGraph(procesGraph, id) {
    if (!systemGraph || !systemGraph.processes) return;

    // find process with same id
    const proc = systemGraph.processes.find((p) => p.id === id);

    if (proc) {
      proc.procesGraph = procesGraph; // <-- graph is already procesGraph
      console.log(`Process ${id} updated`);
    } else {
      console.warn(`Process with id ${id} not found in systemGraph.`);
    }

    console.log(systemGraph);
  }

  ipcMain.handle("open-proces", async (event, { proces_id }) => {
    try {
      let proces = systemGraph.processes.find((x) => x.id == proces_id);
      console.log(proces);
      createWindow("proces", { proces, systemGraph: systemGraph }, proces_id);
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

  ipcMain.handle("update-proces", async (event, { data }) => {
    try {
      const proces = JSON.parse(data);
      updateProcesGraph(proces.procesGraph, proces.id);
      return true;
    } catch (err) {
      console.error("[update-system] Error updating system graph:", err);
      return false;
    }
  });
}

module.exports = { registerIpcHandlers };
