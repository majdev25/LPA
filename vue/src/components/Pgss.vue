<script setup>
import { onMounted, ref } from "vue";
import * as d3 from "d3";

const props = defineProps({
  _pgss_data: {
    type: Object,
    required: true,
  },
});

const svgRef = ref(null);

// nastavitve kvadratov in razmikov
let rectWidth = 100;
let rectHeight = 50;
const verticalSpacing = 80;
const horizontalSpacing = 20;

// Rekurzivna funkcija za layout
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

onMounted(() => {
  if (!props._pgss_data || !props._pgss_data.pgss?.M) return;

  rectWidth = 50 * props._pgss_data.pgss.systemGraph.processes.length;
  rectHeight = 25 * props._pgss_data.pgss.systemGraph.processes.length;

  const data = props._pgss_data.pgss.M;

  // layout drevesa
  layoutTree(data);

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

  const g = svg.append("g");

  // Zoom/pan
  const zoom = d3
    .zoom()
    .scaleExtent([0.2, 3])
    .on("zoom", (event) => g.attr("transform", event.transform));
  svg.call(zoom);

  // Center root node
  const initialTransform = d3.zoomIdentity.translate(
    ((maxX + rectWidth) / 2) * -1 + 500,
    50
  );
  svg.call(zoom.transform, initialTransform);

  // Draw lines first
  function drawLinks(node) {
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
  drawLinks(data);

  // Draw nodes on top
  function drawNodes(node) {
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
            .attr("fill", "#333")
            .attr("stroke", "#000");

          const text =
            cell.type === "stanje"
              ? cell.value
              : cell.type === "vrsta"
              ? cell.value.join(", ")
              : "";

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

    if (node.children) node.children.forEach(drawNodes);
  }

  drawNodes(data);
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
          Proces
          {{ procesName }}
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
