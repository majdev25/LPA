<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import * as d3 from "d3";

const props = defineProps({
  _pgss_data: {
    type: Object,
    required: true,
  },
});

const svgRef = ref(null);
const draw_args = ref({
  tree_type: 0,
  levels_to_draw: -1,
  root_node: 0,
});

const tree_types = [
  { val: 0, text: "Navadno drevo" },
  { val: 1, text: "Strnjeno drevo" },
];

watch(
  () => draw_args,
  () => {
    restart();
  },
  { deep: true }
);

// nastavitve kvadratov in razmikov
let rectWidth = 100;
let rectHeight = 50;
const verticalSpacing = 80;
const horizontalSpacing = 20;

let zoom, g;

// Rekurzivna funkcija za layout
// --- classic tree layout ---
function layoutTree(node, depth = 0, xStart = 0) {
  node.y = depth * (rectHeight + verticalSpacing); // vertical spacing

  if (!node.children || node.children.length === 0) {
    node.x = xStart;
    return xStart + rectWidth + horizontalSpacing; // next sibling
  }

  let currentX = xStart;
  for (let child of node.children) {
    currentX = layoutTree(child, depth + 1, currentX);
  }

  node.x = (node.children[0].x + node.children[node.children.length - 1].x) / 2;
  return currentX;
}

// --- compact tree layout ---
function collectNodesByLevel(node, levels = {}, depth = 0) {
  if (!levels[depth]) levels[depth] = [];
  levels[depth].push(node);

  node.y = depth * (rectHeight * 2 + verticalSpacing); // vertical position

  if (node.children) {
    node.children.forEach((child) =>
      collectNodesByLevel(child, levels, depth + 1)
    );
  }

  return levels;
}

function assignHorizontalPositions(levels, rootNode, gap = 150) {
  for (const depth in levels) {
    const nodes = levels[depth];
    const count = nodes.length;
    const totalWidth = (count - 1) * gap;

    const startX = -totalWidth / 2; // temporary center at 0
    nodes.forEach((node, i) => {
      node.x = startX + i * gap;
    });
  }

  // --- shift all nodes so root node is at x = 0 ---
  const offset = -rootNode.x;
  for (const depth in levels) {
    levels[depth].forEach((node) => {
      node.x += offset;
    });
  }
}

function draw(data) {
  // layout drevesa
  console.log(draw_args.value);
  if (draw_args.value.tree_type == 0) {
    layoutTree(data);
  } else if (draw_args.value.tree_type == 1) {
    const levels = collectNodesByLevel(data);
    assignHorizontalPositions(levels, data, rectWidth + 40); // pass root node as data
  }

  console.log(data);

  if (draw_args.value.tree_type == 0) layoutTree(data);
  else {
    const levels = collectNodesByLevel(data);
    assignHorizontalPositions(levels, data, rectWidth + 40);
  }

  // Shift so tree starts at visible area
  shiftTreeToVisibleArea(data, 50, 50);

  // izračun SVG dimenzij
  let maxX = 0;
  let maxY = 0;
  function findMax(node) {
    if (node.x > maxX) maxX = node.x;
    if (node.y > maxY) maxY = node.y;
    if (node.children) node.children.forEach(findMax);
  }
  findMax(data);

  const svg = d3.select(svgRef.value);
  svg.selectAll("*").remove();

  svg
    .attr("width", maxX + rectWidth + 100)
    .attr("height", maxY + rectHeight + 100)
    .attr("viewBox", [
      -50,
      -50,
      maxX + rectWidth + 100,
      maxY + rectHeight + 100,
    ])
    .style("font", "12px sans-serif")
    .style("user-select", "none")
    .style("cursor", "grab");

  g = svg.append("g");

  // Zoom/pan
  zoom = d3
    .zoom()
    .scaleExtent([0.05, 100])
    .on("zoom", (event) => g.attr("transform", event.transform));
  svg.call(zoom);

  // Draw lines first
  function drawLinks(node) {
    if (
      draw_args.value.levels_to_draw >= 0 &&
      node.level + 1 > draw_args.value.levels_to_draw
    )
      return;
    if (!node.children) return;
    node.children.forEach((child) => {
      g.append("line")
        .attr("x1", node.x)
        .attr("y1", node.y)
        .attr("x2", child.x)
        .attr("y2", child.y)
        .attr("stroke", "#555")
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 0.6);
      drawLinks(child);
    });
  }
  console.log("drawing links");
  drawLinks(data);

  // Draw nodes on top
  function drawNodes(node) {
    const last_level =
      draw_args.value.levels_to_draw >= 0 &&
      node.level > draw_args.value.levels_to_draw - 1;

    if (node.header) {
      const headerPaddingX = 6;
      const headerPaddingY = 4;
      const headerPadding = 20;

      // temporary text element to measure size
      const tempText = g
        .append("text")
        .attr("x", node.x)
        .attr("y", node.y - rectHeight / 2 - headerPadding)
        .attr("text-anchor", "middle")
        .attr("font-weight", "regular")
        .attr("font-size", "12px")
        .text(node.header);

      const bbox = tempText.node().getBBox(); // get size of text
      tempText.remove(); // remove temporary text

      // background rect
      g.append("rect")
        .attr("x", bbox.x - headerPaddingX)
        .attr("y", bbox.y - headerPaddingY)
        .attr("width", bbox.width + 2 * headerPaddingX)
        .attr("height", bbox.height + 2 * headerPaddingY)
        .attr("fill", "white")
        .attr("stroke", "#333")
        .attr("rx", 4) // optional rounded corners
        .attr("ry", 4);

      // actual text on top
      g.append("text")
        .attr("x", node.x)
        .attr("y", node.y - rectHeight / 2 - headerPadding)
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .attr("font-weight", "regular")
        .attr("font-size", "12px")
        .text(node.header);
    }

    if (node.type === 0) {
      // type 0: matrix in rectangle
      const cellWidth = rectWidth / (node.data[0]?.length || 1);
      const cellHeight = rectHeight / (node.data?.length || 1);

      let cell_color = "#333";

      if (node.flags.dead_end) {
        cell_color = "#FF0000";
      }

      // outer rectangle
      g.append("rect")
        .attr("x", node.x - rectWidth / 2)
        .attr("y", node.y - rectHeight / 2)
        .attr("width", rectWidth)
        .attr("height", rectHeight)
        .attr("fill", "#555")
        .attr("stroke", "#000");

      // draw ID in top-left corner outside matrix
      g.append("text")
        .attr("x", node.x - rectWidth / 2 - 12)
        .attr("y", node.y - rectHeight / 2 - 12)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "hanging")
        .attr("fill", "black")
        .attr("font-size", "12px")
        .text(node.id);

      // draw cells
      node.data.forEach((row, i) => {
        row.forEach((cell, j) => {
          g.append("rect")
            .attr("x", node.x - rectWidth / 2 + j * cellWidth)
            .attr("y", node.y - rectHeight / 2 + i * cellHeight)
            .attr("width", cellWidth)
            .attr("height", cellHeight)
            .attr("fill", cell_color)
            .attr("stroke", "#000");

          let text = "";
          if (cell.type === "stanje") {
            let state = props._pgss_data.pgss.systemGraph.processes[
              i
            ].procesGraph.states.find((s) => s.id == cell.value);
            text = state.label;
          } else if (cell.type === "vrsta") {
            text = cell.value.join(", ");
          }

          g.append("text")
            .attr("x", node.x - rectWidth / 2 + j * cellWidth + cellWidth / 2)
            .attr(
              "y",
              node.y - rectHeight / 2 + i * cellHeight + cellHeight / 2
            )
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", "10px")
            .text(text);
        });
      });

      if (last_level) {
        const radius = 4; // dot radius
        const dotSpacing = 10; // horizontal spacing between dots
        const bottomY = node.y + rectHeight / 2 + 12; // 8px below rectangle

        [-1, 0, 1].forEach((i) => {
          g.append("circle")
            .attr("cx", node.x + i * dotSpacing)
            .attr("cy", bottomY)
            .attr("r", radius)
            .attr("fill", "black");
        });
      }
    } else if (node.type === 1) {
      const radius = rectHeight / 2;
      g.append("circle")
        .attr("cx", node.x)
        .attr("cy", node.y)
        .attr("r", radius)
        .attr("fill", "#555")
        .attr("stroke", "#000");

      g.append("text")
        .attr("x", node.x)
        .attr("y", node.y)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text(node.text || node.header || `Node ${node.id ?? "?"}`);
    } else if (node.type === 2) {
      const size = Math.max(rectWidth / 2, rectHeight / 2);
      g.append("rect")
        .attr("x", node.x - size / 2)
        .attr("y", node.y - size / 2)
        .attr("width", size)
        .attr("height", size)
        .attr("fill", "#555")
        .attr("stroke", "#000");

      g.append("text")
        .attr("x", node.x)
        .attr("y", node.y)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text(node.text);
    }
    if (node.children && !last_level) node.children.forEach(drawNodes);
  }
  console.log("drawing nodes");
  drawNodes(data);
}

function findNodeById(node, targetId) {
  if (node.id === targetId) return node;

  if (node.children) {
    for (const child of node.children) {
      const result = findNodeById(child, targetId);
      console.log("found:", result);
      if (result) return result;
    }
  }

  return null; // not found
}

function shiftTreeToVisibleArea(node, offsetX = 50, offsetY = 50) {
  function recurse(n) {
    n.x += offsetX;
    n.y += offsetY;
    if (n.children) n.children.forEach(recurse);
  }
  recurse(node);
}

function restart() {
  if (!props._pgss_data || !props._pgss_data.pgss?.M) return;

  let pgss_data;

  console.log(props._pgss_data);
  let pgss_copy = JSON.parse(JSON.stringify(props._pgss_data.pgss));

  rectWidth = 50 * pgss_copy.systemGraph.processes.length;
  rectHeight = 25 * pgss_copy.systemGraph.processes.length;

  let data = null;

  if (draw_args.value.root_node == 0) {
    data = pgss_copy.M;
  } else {
    data = findNodeById(pgss_copy.M, draw_args.value.root_node) || pgss_copy.M;
  }

  draw(data);
}

function centerRoot(svg, root) {
  const svgEl = svgRef.value;
  if (!svgEl || !root) return;

  // read SVG client dimensions in pixels
  const svgWidth = svgEl.clientWidth || 800;
  const svgHeight = svgEl.clientHeight || 600;

  // read viewBox values (drawing coordinate space)
  const vb = svgEl.getAttribute("viewBox")?.split(" ").map(Number);
  let vx = 0,
    vy = 0,
    vw = svgWidth,
    vh = svgHeight;
  if (vb && vb.length === 4 && vb.every((v) => !isNaN(v))) {
    [vx, vy, vw, vh] = vb;
  }

  // compute coordinate scale between pixels and viewBox units
  const scaleX = vw / svgWidth;
  const scaleY = vh / svgHeight;

  // convert pixel center to viewBox coordinates
  const centerX = vx + vw / 2;
  const centerY = vy + vh / 2;

  // how much we need to move the root to align with center
  const translateX = (centerX - root.x) / scaleX;
  const translateY = (centerY - root.y) / scaleY;

  if (translateX && translateY) {
    svg
      .transition()
      .duration(500)
      .call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY));
  }
}

// --- handle window resize ---
function handleResize() {
  if (!svgRef.value || !g || !zoom) return;

  // Recompute viewBox to fit the container
  const svgWidth = svgRef.value.clientWidth;
  const svgHeight = svgRef.value.clientHeight;

  d3.select(svgRef.value).attr("width", svgWidth).attr("height", svgHeight);

  // Recenter root node properly
  if (!props._pgss_data?.pgss?.M) return;

  let data =
    draw_args.value.root_node == 0
      ? props._pgss_data.pgss.M
      : findNodeById(props._pgss_data.pgss.M, draw_args.value.root_node) ||
        props._pgss_data.pgss.M;

  // Important: you must recalc layout if rectWidth/Height depend on container
  // Otherwise, just shift the g group
  centerRoot(d3.select(svgRef.value), data);
}

onMounted(() => {
  restart();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
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
        <div class="d-flex flex gap-2">
          <div>
            <label class="fs-7">Tip izrisa drevesa</label>
            <select class="form-select fs-7" v-model="draw_args.tree_type">
              <option :value="t.val" v-for="t in tree_types">
                {{ t.text }}
              </option>
            </select>
          </div>

          <div>
            <label class="fs-7">Globina drevesa</label>
            <input
              type="number"
              class="form-control fs-7"
              v-model="draw_args.levels_to_draw"
              placeholder="Vnesi ime stanja"
            />
          </div>
          <div>
            <label class="fs-7">Koren drevesa</label>
            <input
              type="number"
              class="form-control fs-7"
              v-model="draw_args.root_node"
              placeholder="Vnesi ime stanja"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="d-flex flex-grow-1" style="min-height: 0">
      <div class="flex-grow-1">
        <svg ref="svgRef" style="height: 100%; width: 100%"></svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
svg {
  background: white;
}
</style>
