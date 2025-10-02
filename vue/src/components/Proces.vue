<script setup>
import { onMounted, ref, reactive, onUnmounted, watch, computed } from "vue";
import * as d3 from "d3";
import { GraphRenderer } from "./ProcesComponents/ProcesGraphRenderer.js";
import State from "./ProcesComponents/State.vue";
import Event from "./ProcesComponents/Event.vue";

const d3Container = ref(null);
const selectedStateId = ref(null);
const selectedEventId = ref(null);

const props = defineProps({
  _systemGraph: {
    type: Array,
    default: () => {},
  },
  _id: null,
});
const graph = { states: [], events: [] };
const systemGraph = reactive({ ...props._systemGraph });

const lastUpdateId = ref(null);

watch(
  () => props._systemGraph._updateId,
  (newGraph) => {
    console.log("[PROCES] _systemGraph change: ", props._systemGraph);
    setVars();
    renderer.render();
  },
  { deep: true }
);

const mode = ref({ addState: true, addEvent: false });

function setVars() {
  console.log("[PROCES] setting variables");
  console.log(props._systemGraph._updateId, lastUpdateId.value);
  if (
    props._systemGraph._updateId &&
    props._systemGraph._updateId === lastUpdateId.value
  ) {
    console.log("[PROCES] skipping setting variables");
    return;
  }
  Object.keys(systemGraph).forEach((key) => delete graph[key]);
  Object.assign(systemGraph, props._systemGraph);

  var g = systemGraph.processes?.find((x) => x.id === props._id)?.procesGraph;
  if (g == undefined || g == null) {
    console.log("[PROCES] creating empty graph");
    g = { states: [], events: [] };
  }
  graph.states = [...g.states];
  graph.events = [...g.events];
}

async function saveGraph() {
  console.log("[PROCES] sending copy of graph");

  // updateId
  let _updateId = Math.random().toString(36).slice(2);

  // remember it locally so we can detect echoes
  lastUpdateId.value = _updateId;

  // send to backend
  await window.api.invoke("update-proces", {
    data: JSON.stringify({
      procesGraph: graph,
      id: props._id,
      _updateId,
    }),
  });
}

const procesName = computed(() => {
  return systemGraph.processes?.find((x) => x.id == props._id).label;
});

function genStateId() {
  const ids = graph.states.map((s) => parseInt(s.id.slice(1), 10));
  let next = 0;
  while (ids.includes(next)) {
    next++;
  }
  return `s${next}`;
}

function genEventId() {
  const ids = graph.events.map((e) => parseInt(e.id.slice(1), 10));
  let next = 0;
  while (ids.includes(next)) {
    next++;
  }
  return `d${next}`;
}

function getState(id) {
  return graph.states.find((c) => c.id === id);
}
function getEvent(id) {
  return graph.events.find((a) => a.id === id);
}

function updateState(data) {
  const index = graph.states.findIndex((c) => c.id === selectedStateId.value);
  if (index !== -1) {
    graph.states[index] = data;
  }
  renderer.render();
  saveGraph();
}

function deleteState(id) {
  const stateIndex = graph.states.findIndex((c) => c.id === id);
  if (stateIndex !== -1) {
    graph.states.splice(stateIndex, 1);
    // Also remove associated events
    graph.events = graph.events.filter((e) => e.from !== id && e.to !== id);
    selectedStateId.value = -1;
    renderer.render();
  }
  saveGraph();
}

function globalClick({ x, y }) {
  if (mode.value.addState) {
    addState(x, y);
  }
}

function addState(x, y) {
  let id = genStateId();
  let isStart = false;
  if (graph.states.length < 1) {
    isStart = true;
  }
  graph.states.push({
    id,
    x,
    y,
    r: 15,
    label: id,
    isStart,
    parent_proces: props._id,
  });
  selectedStateId.value = id;
  renderer.render();
  saveGraph();
}

function addEvent(fromId, toId) {
  const c1 = getState(fromId);
  const c2 = getState(toId);
  if (!c1 || !c2) return;
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
  let id = genEventId();
  graph.events.push({
    id,
    from: fromId,
    to: toId,
    ctrl,
    label: id,
    type: "spr",
    from_process: "p0",
    to_process: "p0",
  });
  selectedEventId.value = id;
  renderer.render();
  saveGraph();
}

function renderEventName(event) {
  // use edge.type and edge.label directly
  if (event.type === "spr") {
    return "+" + event.label + "(" + event.from_process + ")";
  } else if (event.type === "odd") {
    return "-" + event.label + "(" + event.to_process + ")";
  } else if (event.type === "lok") {
    return "#" + event.label;
  } else if (event.type === "tra") {
    return (
      event.label + "(" + event.from_process + "," + event.to_process + ")"
    );
  }
}

function updateEvent(data) {
  const index = graph.events.findIndex((c) => c.id === selectedEventId.value);
  if (index !== -1) {
    graph.events[index] = data;
  }
  renderer.render();
  saveGraph();
}

function deleteEvent(id) {
  const eventIndex = graph.events.findIndex((c) => c.id === id);
  if (eventIndex !== -1) {
    graph.events.splice(eventIndex, 1);
    renderer.render();
  }
  saveGraph();
}

const renderer = new GraphRenderer();

function clearAll() {
  mode.value.addState = false;
  mode.value.addEvent = false;
  selectedEventId.value = null;
  selectedStateId.value = null;
  renderer.render();
}

function toggleAddState() {
  clearAll();
  mode.value.addState = !mode.value.addState;
}

function toggleAddEvent() {
  clearAll();
  mode.value.addEvent = !mode.value.addEvent;
}

function handleStateClick(event, d) {
  event.stopPropagation();
  selectedEventId.value = null;
  if (selectedStateId.value === null || !mode.value.addEvent) {
    selectedStateId.value = d.id;
  } else if (mode.value.addEvent) {
    addEvent(selectedStateId.value, d.id);
    selectedStateId.value = null;
  }
  renderer.render();
}

function handleEventClick(event, i) {
  event.stopPropagation();
  selectedStateId.value = null;
  selectedEventId.value = i;
  renderer.render();
}

onMounted(() => {
  const container = d3Container.value;

  setVars();

  // Create SVG to match container size
  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", container.clientWidth)
    .attr("height", container.clientHeight)
    .style("display", "block") // remove inline gaps
    .on("click", function (event) {
      if (event.target.tagName === "svg") {
        const [x, y] = d3.pointer(event);
        globalClick({ x, y });
        selectedStateId.value = null;
        selectedEventId.value = null;
        renderer.render();
      }
    });

  // Make SVG resize when window resizes
  function resizeSvg() {
    svg
      .attr("width", container.clientWidth)
      .attr("height", container.clientHeight);
    renderer.render(); // optional: re-render states/events to fit
  }

  window.addEventListener("resize", resizeSvg);

  // Initialize renderer
  renderer.init({
    svg,
    d3,
    graph,
    selectedStateId,
    selectedEventId,
    handleStateClick,
    handleEventClick,
    renderEventName,
  });

  renderer.render();

  // Clean up
  onUnmounted(() => window.removeEventListener("resize", resizeSvg));
});
</script>
<template>
  {{ systemGraph.channels }}
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
        <div class="fs-sm fw-bold ms-2">
          Proces
          {{ procesName }}
        </div>
        <div class="d-flex align-items-center">
          <div
            class="d-flex align-items-center me-2 cursor-pointer fs-6 text-tight text-sm _badge hover-bg-light"
            :class="{
              'bg-light text-primary': mode.addState,
              'text-gray': !mode.addState,
            }"
            @click="toggleAddState"
          >
            <FontAwesomeIcon :icon="['fa', 'circle-notch']" class="me-1" />
            Dodaj stanje
          </div>
          <div
            class="d-flex align-items-center me-2 cursor-pointer fs-6 text-tight text-sm _badge hover-bg-light"
            :class="{
              'bg-light text-primary': mode.addEvent,
              'text-gray': !mode.addEvent,
            }"
            @click="toggleAddEvent"
          >
            <FontAwesomeIcon :icon="['fa', 'arrow-right']" class="me-1" />
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
        <State
          v-if="selectedStateId != null"
          :state="getState(selectedStateId)"
          @save="updateState"
          @delete="() => deleteState(selectedStateId)"
        />
        <Event
          v-else-if="selectedEventId != null"
          :event="getEvent(selectedEventId)"
          :systemGraph="systemGraph"
          :_procId="_id"
          @save="updateEvent"
          @delete="() => deleteEvent(selectedEventId)"
        />
        <div v-else class="bg-light p-3 text-gray">
          Izberite stanje ali dogodek za prikaz podrobnosti.
        </div>
      </div>
    </div>
  </div>
</template>
