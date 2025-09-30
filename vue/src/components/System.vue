<script setup>
import { onMounted, ref, reactive, onUnmounted, watch } from "vue";
import * as d3 from "d3";
import { GraphRenderer } from "./SystemComponents/SystemGraphRenderer";
import ProcesInfo from "./SystemComponents/ProcesInfo.vue";
import Channel from "./SystemComponents/Channel.vue";
import procesImg from "./SystemComponents/proces.png";
import procesActiveImg from "./SystemComponents/proces.active.png";

const d3Container = ref(null);
const selectedProcesId = ref(null);
const selectedChannelId = ref(null);

const graph = reactive({
      processes: [],
      channels: [],
    }
  );
const mode = ref({ addProces: true, addChannel: false });

watch(
  () => graph,
  async (newGraph) => {
    try {
      const result = await window.api.invoke("update-system", {
        graph: JSON.stringify(newGraph),
      });
      console.log("Graph updated:", result);
    } catch (err) {
      console.error("Failed to update graph:", err);
    }
  },
  { deep: true }
);

let nextProcesId = 0;
let nextChannelId = 0;
function genProcesId() {
  return `p${nextProcesId++}`;
}
function genChannelId() {
  return `c${nextChannelId++}`;
}

function getProces(id) {
  return graph.processes.find((c) => c.id === id);
}
function getChannel(id) {
  return graph.channels.find((a) => a.id === id);
}

function updateProces(data) {
  const index = graph.processes.findIndex((c) => c.id === selectedProcesId.value);
  if (index !== -1) {
    graph.processes[index].label = data.label;
  }
  renderer.render();
}

function deleteProces(id) {
  const procesIndex = graph.processes.findIndex((c) => c.id === id);
  if (procesIndex !== -1) {
    graph.processes.splice(procesIndex, 1);
    // Also remove associated channels
    selectedProcesId.value = null;
    selectedChannelId.value = null;
    graph.channels = graph.channels.filter((e) => e.from !== id && e.to !== id);
    renderer.render();
  }
}

function globalClick({ x, y }) {
  if (mode.value.addProces) {
    addProces(x, y);
  }
}

function addProces(x, y) {
  let id = genProcesId();
  graph.processes.push({
    id,
    x,
    y,
    r: 15,
    label: id,
    procesGraph: {states: [], events: []}
  });
  selectedProcesId.value = id;
  renderer.render();
}

function addChannel(fromId, toId) {
  const c1 = getProces(fromId);
  const c2 = getProces(toId);
  if (!c1 || !c2) return;

  const exists = graph.channels.some(
    (ch) =>
      (ch.proces1.id === fromId && ch.proces2.id === toId) ||
      (ch.proces1.id === toId && ch.proces2.id === fromId)
  );
  if (exists) return;

  let ctrl;
  if (fromId === toId) {
    ctrl = {
      x: c1.x - c1.r * 3,
      y: c1.y - c1.r * 4,
    };
  } else {
    const mx = (c1.x + c2.x) / 2;
    const my = (c1.y + c2.y) / 2;
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const curveOffset = 40;
    const ox = mx + (curveOffset * -dy) / len;
    const oy = my + (curveOffset * dx) / len;
    ctrl = { x: ox, y: oy };
  }

  let id = genChannelId();
  graph.channels.push({
    id,
    proces1: {
      id: fromId,
      q_length: 2,
    },
    proces2: {
      id: toId,
      q_length: 2,
    },
    ctrl,
    type: "spr",
    renderChannelName,
  });
  renderer.render();
}


function renderChannelName(channel) {
  // use edge.type and edge.label directly
  return channel.proces1.id + "-" + channel.proces2.id;
}

function updateChannel(data) {
  const index = graph.channels.findIndex((c) => c.id === selectedChannelId.value);
  if (index !== -1) {
    graph.channels[index].proces1 = data.proces1;
    graph.channels[index].proces2 = data.proces2;
  }
  renderer.render();
}

function deleteChannel(id) {
  const channelIndex = graph.channels.findIndex((c) => c.id === id);
  if (channelIndex !== -1) {
    graph.channels.splice(channelIndex, 1);
    renderer.render();
  }
  selectedChannelId.value = null;
}

const renderer = new GraphRenderer();

function clearAll() {
  mode.value.addProces = false;
  mode.value.addChannel = false;
  selectedChannelId.value = null;
  selectedProcesId.value = null;
  renderer.render();
}

function toggleAddProces() {
  clearAll();
  mode.value.addProces = !mode.value.addProces;
}

function toggleAddChannel() {
  clearAll();
  mode.value.addChannel = !mode.value.addChannel;
}

function handleProcesClick(channel, d) {
  channel.stopPropagation();
  selectedChannelId.value = null;
  if (selectedProcesId.value === null || !mode.value.addChannel) {
    selectedProcesId.value = d.id;
  } else if (mode.value.addChannel) {
    addChannel(selectedProcesId.value, d.id);
    selectedProcesId.value = null;
  }
  renderer.render();
}

function handleChannelClick(channel, i) {
  channel.stopPropagation();
  selectedProcesId.value = null;
  selectedChannelId.value = i;
  renderer.render();
}

onMounted(() => {
  const container = d3Container.value;

  // Create SVG to match container size
  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", container.clientWidth)
    .attr("height", container.clientHeight)
    .style("display", "block") // remove inline gaps
    .on("click", function (channel) {
      if (channel.target.tagName === "svg") {
        const [x, y] = d3.pointer(channel);
        globalClick({ x, y });
        selectedProcesId.value = null;
        selectedChannelId.value = null;
        renderer.render();
      }
    });

  // Make SVG resize when window resizes
  function resizeSvg() {
    svg
      .attr("width", container.clientWidth)
      .attr("height", container.clientHeight);
    renderer.render();
  }

  window.addEventListener("resize", resizeSvg);

  // Initialize renderer
  renderer.init({
    svg,
    d3,
    graph,
    selectedProcesId,
    selectedChannelId,
    handleProcesClick,
    handleChannelClick,
  });

  renderer.render();

  // Clean up
  onUnmounted(() => window.removeEventListener("resize", resizeSvg));
});
</script>
<template>
  <div
    class="d-flex flex-column"
    style="height: 100vh; width: 100vw; overflow: hidden"
  >
    <!-- Top menu -->
    <div
      class="d-flex border-bottom p-2"
      style="height: fit-content; z-index: 10; flex-shrink: 0"
    >
      <div>
        <div class="fs-sm fw-bold ms-2">Sistem</div>
        <div class="d-flex align-items-center">
          <div
            class="d-flex align-items-center me-2 cursor-pointer fs-6 text-tight text-sm _badge hover-bg-light"
            :class="{
              'bg-light text-primary': mode.addProces,
              'text-gray': !mode.addProces,
            }"
            @click="toggleAddProces"
          >
          <img v-if="!mode.addProces" :src="procesImg" width="20px" class="me-1"></img>
          <img v-else :src="procesActiveImg" width="20px" class="me-1"></img>
            Dodaj proces
          </div>
          <div
            class="d-flex align-items-center me-2 cursor-pointer fs-6 text-tight text-sm _badge hover-bg-light"
            :class="{
              'bg-light text-primary': mode.addChannel,
              'text-gray': !mode.addChannel,
            }"
            @click="toggleAddChannel"
          >
            <FontAwesomeIcon :icon="['fa', 'bullhorn']" class="me-1" />
            Dodaj dogodek
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom: left D3 + right menu -->
    <div class="d-flex flex-grow-1" style="min-height: 0">
      <!-- D3 canvas -->
      <div
        ref="d3Container"
        class="flex-grow-1 position-relative"
        style="min-width: 0; overflow: hidden"
      ></div>

      <!-- Right menu (fixed width) -->
      <div
        class="d-flex flex-column border-start p-3"
        style="width: 320px; flex-shrink: 0; overflow-y: auto"
      >
        <ProcesInfo
          v-if="selectedProcesId != null"
          :proces="getProces(selectedProcesId)"
          @save="updateProces"
          @delete="() => deleteProces(selectedProcesId)"
        />
        <Channel
          v-else-if="selectedChannelId != null"
          :channel="getChannel(selectedChannelId)"
          @save="updateChannel"
          @delete="() => deleteChannel(selectedChannelId)"
        />
        <div v-else class="bg-light p-3 text-gray">
          Izberite stanje ali dogodek za prikaz podrobnosti.
        </div>
      </div>
    </div>
  </div>
</template>
