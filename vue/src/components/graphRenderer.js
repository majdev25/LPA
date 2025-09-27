export class GraphRenderer {
  constructor() {
    this.svg = null;
    this.graph = null;
    (this.d3 = null), (this.selectedCircleId = null);
    this.selectedArrowId = null;
    this.handleCircleClick = null;
    this.handleArrowClick = null;
  }

  init({
    svg,
    graph,
    d3,
    selectedCircleId,
    selectedArrowId,
    handleCircleClick,
    handleArrowClick,
  }) {
    this.svg = svg;
    this.graph = graph;
    this.d3 = d3;
    this.selectedCircleId = selectedCircleId;
    this.selectedArrowId = selectedArrowId;
    this.handleCircleClick = handleCircleClick;
    this.handleArrowClick = handleArrowClick;

    this.svg
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", "10")
      .attr("refY", "5")
      .attr("markerWidth", "6")
      .attr("markerHeight", "6")
      .attr("orient", "auto-start-reverse")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 z")
      .attr("fill", "black");
  }

  render() {
    const svg = this.svg;
    const graph = this.graph;
    const selectedCircleId = this.selectedCircleId.value;
    const selectedArrowId = this.selectedArrowId.value;
    const handleCircleClick = this.handleCircleClick;

    const defs = {
      svg,
      graph,
      selectedArrowId,
      selectedCircleId,
      handleCircleClick,
    };

    this.drawEdges(defs);
    this.drawNodes(defs);
  }

  // =======================
  // DRAW NODES
  // =======================

  drawNodes(defs) {
    const { svg, graph, selectedCircleId, handleCircleClick } = defs;
    const drag = this.d3.drag().on("drag", (event, d) => {
      d.x = event.x;
      d.y = event.y;
      this.render();
    });

    const groups = svg
      .selectAll("g.node")
      .data(graph.nodes, (d) => d.id)
      .join("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
      .call(drag)
      .on("click", handleCircleClick);

    // outer circle (bigger red border)
    groups
      .selectAll("circle.outer")
      .data((d) => [d])
      .join("circle")
      .attr("class", "outer")
      .attr("r", (d) => (d.isStart ? d.r : 0))
      .attr("fill", "red")
      .attr("stroke", "black")
      .attr("stroke-width", 2);

    // inner circle (main)
    groups
      .selectAll("circle.inner")
      .data((d) => [d])
      .join("circle")
      .attr("class", "inner")
      .attr("r", (d) => (d.isStart ? d.r - 5 : d.r))
      .attr("fill", (d) => (d.id === selectedCircleId ? "orange" : "white"))
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .style("cursor", "pointer");

    svg.selectAll("text.node-label").remove();

    svg
      .selectAll("rect.node-label-bg")
      .data(graph.nodes)
      .join("rect")
      .attr("class", "node-label-bg")
      .attr("x", (d) => d.x - (d.label.length * 8 + 10) / 2) // center behind text
      .attr("y", (d) => d.y + d.r + 18 - 16) // align with text vertically
      .attr("width", (d) => d.label.length * 8 + 10) // dynamic width
      .attr("height", 20) // fixed height
      .attr("fill", "white")
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("rx", 4) // rounded corners
      .raise();

    // Node labels
    svg
      .selectAll("text.node-label")
      .data(graph.nodes)
      .join("text")
      .attr("class", "node-label")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y + d.r + 18)
      .attr("text-anchor", "middle")
      .attr("font-size", 16)
      .attr("fill", "black")
      .style("pointer-events", "none") // allow dragging background later
      .text((d) => d.label);
  }

  // =======================
  // DRAW EDGES
  // =======================

  drawEdges(defs) {
    const { svg, graph, selectedArrowId } = defs;
    svg.selectAll("path.arrow").remove();
    svg.selectAll("circle.ctrl").remove();
    svg.selectAll("rect.arrow-label-bg").remove();
    svg.selectAll("text.arrow-label").remove();

    graph.edges.forEach((edge) => {
      const c1 = graph.nodes.find((n) => n.id === edge.from);
      const c2 = graph.nodes.find((n) => n.id === edge.to);
      if (!c1 || !c2 || !edge.ctrl) return;

      let d;

      if (edge.from === edge.to) {
        // --- self-loop ---
        const dx = edge.ctrl.x - c1.x;
        const dy = edge.ctrl.y - c1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const angleOffset = Math.PI / 4; // ±45°

        // compute loop control points
        edge._ctrl1 = {
          x: c1.x + dist * Math.cos(angle - angleOffset),
          y: c1.y + dist * Math.sin(angle - angleOffset),
        };
        edge._ctrl2 = {
          x: c1.x + dist * Math.cos(angle + angleOffset),
          y: c1.y + dist * Math.sin(angle + angleOffset),
        };

        edge._start = this.getBorderPoint(c1, edge._ctrl1, c1.r);
        edge._end = this.getBorderPoint(c1, edge._ctrl2, c1.r);
        edge._mid = this.getCubicBezierMidpoint(
          edge._start,
          edge._ctrl1,
          edge._ctrl2,
          edge._end,
          0.5
        );

        d = `M${edge._start.x},${edge._start.y} C${edge._ctrl1.x},${edge._ctrl1.y} ${edge._ctrl2.x},${edge._ctrl2.y} ${edge._end.x},${edge._end.y}`;
      } else {
        // --- normal edge ---
        edge._start = this.getBorderPoint(c1, edge.ctrl, c1.r);
        edge._end = this.getBorderPoint(c2, edge.ctrl, c2.r);
        edge._ctrl = this.getStretchedCtrl(c1, c2, edge.ctrl);
        edge._mid = this.getQuadraticBezierMidpoint(
          edge._start,
          edge._ctrl,
          edge._end,
          0.5
        );

        d = `M${edge._start.x},${edge._start.y} Q${edge._ctrl.x},${edge._ctrl.y} ${edge._end.x},${edge._end.y}`;
      }

      svg
        .append("path")
        .attr("class", "arrow")
        .attr("d", d)
        .attr("stroke", edge.id === selectedArrowId ? "orange" : "black")
        .attr("stroke-width", 1)
        .attr("fill", "none")
        .attr("marker-end", "url(#arrow)")
        .style("cursor", "pointer")
        .on("click", (event) => {
          this.handleArrowClick(event, edge.id);
        });
    });

    svg
      .selectAll("rect.arrow-label-bg")
      .data(graph.edges)
      .join("rect")
      .attr("class", "arrow-label-bg")
      .attr("x", (d) => {
        if (!d._mid) return 0;
        const width = d.renderArrowName(d).length * 8 + 10;
        return d._mid.x - width / 2; // center rect on curve midpoint
      })
      .attr("y", (d) => {
        if (!d._mid) return 0;
        return d._mid.y - 12; // vertical offset
      })
      .attr("width", (d) => d.renderArrowName(d).length * 8 + 10)
      .attr("height", 20)
      .attr("fill", "white")
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("rx", 4)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        this.handleArrowClick(event, d.id);
      });

    svg
      .selectAll("text.arrow-label")
      .data(graph.edges)
      .join("text")
      .attr("class", "arrow-label")
      .attr("x", (d) => (d._mid ? d._mid.x : 0))
      .attr("y", (d) => (d._mid ? d._mid.y + 4 : 0)) // vertical offset for visual centering
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .attr("fill", "black")
      .text((d) => d.renderArrowName(d))
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        this.handleArrowClick(event, d.id);
      });

    graph.edges.forEach(({ ctrl, id }, i) => {
      if (id === selectedArrowId) {
        svg
          .append("circle")
          .attr("class", "ctrl")
          .attr("cx", ctrl.x)
          .attr("cy", ctrl.y)
          .attr("r", 8)
          .attr("fill", "orange")
          .call(
            this.d3.drag().on("drag", (event) => {
              ctrl.x = event.x;
              ctrl.y = event.y;
              this.render();
            })
          );
      }
    });
  }

  getBorderPoint(from, to, r) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return { x: from.x, y: from.y };
    return {
      x: from.x + (dx * r) / len,
      y: from.y + (dy * r) / len,
    };
  }

  getQuadraticBezierMidpoint(P0, P1, P2) {
    return {
      x: (P0.x + 2 * P1.x + P2.x) / 4,
      y: (P0.y + 2 * P1.y + P2.y) / 4,
    };
  }
  getCubicBezierMidpoint(p0, p1, p2, p3) {
    const t = 0.5;
    const x =
      Math.pow(1 - t, 3) * p0.x +
      3 * Math.pow(1 - t, 2) * t * p1.x +
      3 * (1 - t) * t * t * p2.x +
      t * t * t * p3.x;
    const y =
      Math.pow(1 - t, 3) * p0.y +
      3 * Math.pow(1 - t, 2) * t * p1.y +
      3 * (1 - t) * t * t * p2.y +
      t * t * t * p3.y;
    return { x, y };
  }

  getLoopCtrl(c1, c2, ctrl) {
    // Midpoint between nodes
    const mid = { x: (c1.x + c2.x) / 2, y: (c1.y + c2.y) / 2 };

    // Vector defined by ctrl relative to center (size + direction)
    const dx = ctrl.x - c1.x;
    const dy = ctrl.y - c1.y;

    // Length of vector = size of curve
    const len = Math.sqrt(dx * dx + dy * dy);

    // Direction = angle of vector
    const angle = Math.atan2(dy, dx);

    // Scale how "strong" the bend should be
    const strength = 1.0;

    return {
      x: mid.x + Math.cos(angle) * len * strength,
      y: mid.y + Math.sin(angle) * len * strength,
    };
  }

  getStretchedCtrl(c1, c2, ctrl) {
    const mid = { x: (c1.x + c2.x) / 2, y: (c1.y + c2.y) / 2 };

    const dx = ctrl.x - mid.x;
    const dy = ctrl.y - mid.y;

    const factor = 1.0; // adjust bend strength

    return {
      x: mid.x + dx * factor, // horizontal movement → horizontal bend
      y: mid.y + dy * factor, // vertical movement → vertical bend
    };
  }
}
