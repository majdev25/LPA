<script setup>
import { onMounted, ref, reactive, onUnmounted } from "vue";
import * as d3 from "d3";
import { GraphRenderer } from "./GraphRenderer";
import State from "./State.vue";
import Dogodek from "./Dogodek.vue";

const d3Container = ref(null);
const selectedCircleId = ref(-1);
const selectedArrowId = ref(-1);

const props = defineProps({
  _procesi: {
    type: Array,
    default: () => [
      { label: "p0", id: "p0" },
      { label: "p1", id: "p1" },
    ],
  },
  _graph: {
    type: Object,
    default: () => ({
      nodes: [],
      edges: [],
      id: "p0",
    }),
  },
});
const graph = reactive({ ...props._graph });
const procesi = reactive([...props._procesi]);

const mode = ref({ addCircle: true, addArrow: false });

let nextCircleId = 0;
let nextArrowId = 0;
function genCircleId() {
  return `s${nextCircleId++}`;
}
function genArrowId() {
  return `d${nextArrowId++}`;
}

function getCircle(id) {
  return graph.nodes.find((c) => c.id === id);
}
function getEdge(id) {
  return graph.edges.find((a) => a.id === id);
}

function updateNode(data) {
  const index = graph.nodes.findIndex((c) => c.id === selectedCircleId.value);
  if (index !== -1) {
    graph.nodes[index] = data;
  }
  renderer.render();
}

function deleteNode(id) {
  const nodeIndex = graph.nodes.findIndex((c) => c.id === id);
  if (nodeIndex !== -1) {
    graph.nodes.splice(nodeIndex, 1);
    // Also remove associated edges
    graph.edges = graph.edges.filter((e) => e.from !== id && e.to !== id);
    selectedCircleId.value = -1;
    renderer.render();
  }
}

function globalClick({ x, y }) {
  if (mode.value.addCircle) {
    addCircle(x, y);
  }
}

function addCircle(x, y) {
  let id = genCircleId();
  graph.nodes.push({
    id,
    x,
    y,
    r: 15,
    label: id,
    isStart: false,
    parent_proces: graph.id,
  });
  selectedCircleId.value = id;
  renderer.render();
}

function addArrow(fromId, toId) {
  const c1 = getCircle(fromId);
  const c2 = getCircle(toId);
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
  let id = genArrowId();
  graph.edges.push({
    id,
    from: fromId,
    to: toId,
    ctrl,
    label: id,
    type: "spr",
    from_process: "p0",
    to_process: "p0",
    parent_proces: graph.id,
    renderArrowName,
  });
  renderer.render();
}

function renderArrowName(edge) {
  // use edge.type and edge.label directly
  if (edge.type === "spr") {
    return "+" + edge.label + "(" + edge.from_process + ")";
  } else if (edge.type === "odd") {
    return "-" + edge.label + "(" + edge.to_process + ")";
  } else if (edge.type === "lok") {
    return "#" + edge.label;
  } else if (edge.type === "tra") {
    return edge.label + "(" + edge.from_process + "," + edge.to_process + ")";
  }
}

function updateEdge(data) {
  const index = graph.edges.findIndex((c) => c.id === selectedArrowId.value);
  if (index !== -1) {
    graph.edges[index] = data;
  }
  renderer.render();
}

function deleteEdge(id) {
  console.log(id);
  const edgeIndex = graph.edges.findIndex((c) => c.id === id);
  if (edgeIndex !== -1) {
    graph.edges.splice(edgeIndex, 1);
    renderer.render();
  }
}

const renderer = new GraphRenderer();

function clearAll() {
  mode.value.addCircle = false;
  mode.value.addArrow = false;
  selectedArrowId.value = null;
  selectedCircleId.value = null;
  renderer.render();
}

function toggleAddCircle() {
  clearAll();
  mode.value.addCircle = !mode.value.addCircle;
}

function toggleAddArrow() {
  clearAll();
  mode.value.addArrow = !mode.value.addArrow;
}

function handleCircleClick(event, d) {
  event.stopPropagation();
  selectedArrowId.value = null;
  if (selectedCircleId.value === null || !mode.value.addArrow) {
    selectedCircleId.value = d.id;
  } else if (mode.value.addArrow) {
    addArrow(selectedCircleId.value, d.id);
    selectedCircleId.value = null;
  }
  renderer.render();
}

function handleArrowClick(event, i) {
  event.stopPropagation();
  selectedCircleId.value = null;
  selectedArrowId.value = i;
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
    .on("click", function (event) {
      if (event.target.tagName === "svg") {
        const [x, y] = d3.pointer(event);
        globalClick({ x, y });
        selectedCircleId.value = null;
        selectedArrowId.value = null;
        renderer.render();
      }
    });

  // Make SVG resize when window resizes
  function resizeSvg() {
    svg
      .attr("width", container.clientWidth)
      .attr("height", container.clientHeight);
    renderer.render(); // optional: re-render nodes/edges to fit
  }

  window.addEventListener("resize", resizeSvg);

  // Initialize renderer
  renderer.init({
    svg,
    d3,
    graph,
    selectedCircleId,
    selectedArrowId,
    handleCircleClick,
    handleArrowClick,
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
        <div class="fs-sm fw-bold ms-2">
          Proces {{ procesi.find((x) => x.id == graph.id).label }}
        </div>
        <div class="d-flex align-items-center">
          <div
            class="d-flex align-items-center me-2 cursor-pointer fs-6 text-tight text-sm _badge hover-bg-light"
            :class="{
              'bg-light text-primary': mode.addCircle,
              'text-gray': !mode.addCircle,
            }"
            @click="toggleAddCircle"
          >
            <FontAwesomeIcon :icon="['fa', 'circle-notch']" class="me-1" />
            Dodaj stanje
          </div>
          <div
            class="d-flex align-items-center me-2 cursor-pointer fs-6 text-tight text-sm _badge hover-bg-light"
            :class="{
              'bg-light text-primary': mode.addArrow,
              'text-gray': !mode.addArrow,
            }"
            @click="toggleAddArrow"
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
          v-if="selectedCircleId != null"
          :state="getCircle(selectedCircleId)"
          @save="updateNode"
          @delete="() => deleteNode(selectedCircleId)"
        />
        <Dogodek
          v-else-if="selectedArrowId != null"
          :state="getEdge(selectedArrowId)"
          :procesi="_procesi"
          @save="updateEdge"
          @delete="() => deleteEdge(selectedArrowId)"
        />
        <div v-else class="bg-light p-3 text-gray">
          Izberite stanje ali dogodek za prikaz podrobnosti.
        </div>
      </div>
    </div>
  </div>
</template>
