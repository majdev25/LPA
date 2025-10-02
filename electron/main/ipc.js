const { ipcMain } = require("electron");

var systemGraph = {};

function registerIpcHandlers({ createWindow, windows }) {
  function updateWindowsData() {
    windows.forEach((win, id) => {
      win.webContents.send("win-data", { systemGraph });
    });
  }
  function updateSystemGraph(graph) {
    // Update processes in place, leaving procesGraph intact
    if (!systemGraph.processes) systemGraph.processes = [];

    graph.processes.forEach((newProcess, i) => {
      if (systemGraph.processes[i]) {
        Object.keys(newProcess).forEach((key) => {
          if (key !== "procesGraph") {
            systemGraph.processes[i][key] = newProcess[key];
          }
        });
      } else {
        systemGraph.processes[i] = { ...newProcess };
      }
    });
    systemGraph.channels = graph.channels.map((c) => ({ ...c }));

    // Channels: shallow copy of the array
    systemGraph.channels = [...graph.channels];
    systemGraph._updateId = Math.random().toString(36).slice(2);
    console.log(systemGraph);

    fixGraph();

    updateWindowsData();
  }

  function updateProcesGraph(procesGraph, id, _updateId) {
    console.log("[IPC] updateProcesGraph");
    if (!systemGraph || !systemGraph.processes) return;

    // find process with same id
    const proc = systemGraph.processes.find((p) => p.id === id);

    if (proc) {
      proc.procesGraph = procesGraph; // <-- graph is already procesGraph
      systemGraph._updateId = _updateId;
      console.log(`Process ${id} updated`);
    } else {
      console.warn(`Process with id ${id} not found in systemGraph.`);
    }
    updateWindowsData();
  }

  ipcMain.handle("open-proces", async (event, { proces_id }) => {
    try {
      let proces = systemGraph.processes.find((x) => x.id == proces_id);
      createWindow("proces", { systemGraph }, proces_id);
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
      const { procesGraph, id, _updateId } = JSON.parse(data);
      updateProcesGraph(procesGraph, id, _updateId);
      return true;
    } catch (err) {
      console.error("[update-system] Error updating system graph:", err);
      return false;
    }
  });
}

function fixGraph() {
  // Create a set of all channel IDs for fast lookup
  const channelIds = new Set(systemGraph.channels.map((c) => c.id));

  systemGraph.processes.forEach((proces) => {
    if (!proces.procesGraph || !proces.procesGraph.events) return;

    // Keep events whose channel exists OR which are local (no channel yet)
    proces.procesGraph.events = proces.procesGraph.events.filter((event) => {
      if (!event.channel_id) {
        // local event, keep it
        return true;
      }

      const channelExists = channelIds.has(event.channel_id);

      if (!channelExists) {
        console.warn(
          `Removed event ${event.id} because channel ${event.channel_id} is missing`
        );
      }

      return channelExists;
    });
  });
}

module.exports = { registerIpcHandlers };
