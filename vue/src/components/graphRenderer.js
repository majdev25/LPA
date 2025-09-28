export class GraphRenderer {
  constructor() {
    this.svg = null;
    this.graph = null;
    (this.d3 = null), (this.selectedStateId = null);
    this.selectedEventId = null;
    this.handleStateClick = null;
    this.handleEventClick = null;
  }

  init({
    svg,
    graph,
    d3,
    selectedStateId,
    selectedEventId,
    handleStateClick,
    handleEventClick,
  }) {
    this.svg = svg;
    this.graph = graph;
    this.d3 = d3;
    this.selectedStateId = selectedStateId;
    this.selectedEventId = selectedEventId;
    this.handleStateClick = handleStateClick;
    this.handleEventClick = handleEventClick;

    this.svg
      .append("defs")
      .append("marker")
      .attr("id", "event")
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
    const selectedStateId = this.selectedStateId.value;
    const selectedEventId = this.selectedEventId.value;
    const handleStateClick = this.handleStateClick;

    const defs = {
      svg,
      graph,
      selectedEventId,
      selectedStateId,
      handleStateClick,
    };

    this.drawEvents(defs);
    this.drawStates(defs);
  }

  // =======================
  // DRAW states
  // =======================

  drawStates(defs) {
    const { svg, graph, selectedStateId, handleStateClick } = defs;
    const drag = this.d3.drag().on("drag", (event, d) => {
      d.x = event.x;
      d.y = event.y;
      this.render();
    });

    const groups = svg
      .selectAll("g.state")
      .data(graph.states, (d) => d.id)
      .join("g")
      .attr("class", "state")
      .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
      .call(drag)
      .on("click", handleStateClick);

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
      .attr("fill", (d) => (d.id === selectedStateId ? "orange" : "white"))
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .style("cursor", "pointer");

    svg.selectAll("text.state-label").remove();

    svg
      .selectAll("rect.state-label-bg")
      .data(graph.states)
      .join("rect")
      .attr("class", "state-label-bg")
      .attr("x", (d) => d.x - (d.label.length * 8 + 10) / 2) // center behind text
      .attr("y", (d) => d.y + d.r + 18 - 16) // align with text vertically
      .attr("width", (d) => d.label.length * 8 + 10) // dynamic width
      .attr("height", 20) // fixed height
      .attr("fill", "white")
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("rx", 4) // rounded corners
      .raise();

    // state labels
    svg
      .selectAll("text.state-label")
      .data(graph.states)
      .join("text")
      .attr("class", "state-label")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y + d.r + 18)
      .attr("text-anchor", "middle")
      .attr("font-size", 16)
      .attr("fill", "black")
      .style("pointer-events", "none") // allow dragging background later
      .text((d) => d.label);
  }

  // =======================
  // DRAW events
  // =======================

  drawEvents(defs) {
    const { svg, graph, selectedEventId } = defs;
    svg.selectAll("path.event").remove();
    svg.selectAll("circle.ctrl").remove();
    svg.selectAll("rect.event-label-bg").remove();
    svg.selectAll("text.event-label").remove();

    graph.events.forEach((event) => {
      const c1 = graph.states.find((n) => n.id === event.from);
      const c2 = graph.states.find((n) => n.id === event.to);
      if (!c1 || !c2 || !event.ctrl) return;

      let d;

      if (event.from === event.to) {
        // --- self-loop ---
        const dx = event.ctrl.x - c1.x;
        const dy = event.ctrl.y - c1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const angleOffset = Math.PI / 4; // ±45°

        // compute loop control points
        event._ctrl1 = {
          x: c1.x + dist * Math.cos(angle - angleOffset),
          y: c1.y + dist * Math.sin(angle - angleOffset),
        };
        event._ctrl2 = {
          x: c1.x + dist * Math.cos(angle + angleOffset),
          y: c1.y + dist * Math.sin(angle + angleOffset),
        };

        event._start = this.getBorderPoint(c1, event._ctrl1, c1.r);
        event._end = this.getBorderPoint(c1, event._ctrl2, c1.r);
        event._mid = this.getCubicBezierMidpoint(
          event._start,
          event._ctrl1,
          event._ctrl2,
          event._end,
          0.5
        );

        d = `M${event._start.x},${event._start.y} C${event._ctrl1.x},${event._ctrl1.y} ${event._ctrl2.x},${event._ctrl2.y} ${event._end.x},${event._end.y}`;
      } else {
        // --- normal event ---
        event._start = this.getBorderPoint(c1, event.ctrl, c1.r);
        event._end = this.getBorderPoint(c2, event.ctrl, c2.r);
        event._ctrl = this.getStretchedCtrl(c1, c2, event.ctrl);
        event._mid = this.getQuadraticBezierMidpoint(
          event._start,
          event._ctrl,
          event._end,
          0.5
        );

        d = `M${event._start.x},${event._start.y} Q${event._ctrl.x},${event._ctrl.y} ${event._end.x},${event._end.y}`;
      }

      svg
        .append("path")
        .attr("class", "event")
        .attr("d", d)
        .attr("stroke", event.id === selectedEventId ? "orange" : "black")
        .attr("stroke-width", 1)
        .attr("fill", "none")
        .attr("marker-end", "url(#event)")
        .style("cursor", "pointer")
        .on("click", (domEvent) => {
          this.handleEventClick(domEvent, event.id);
        });
    });

    svg
      .selectAll("rect.event-label-bg")
      .data(graph.events)
      .join("rect")
      .attr("class", "event-label-bg")
      .attr("x", (d) => {
        if (!d._mid) return 0;
        const width = d.renderEventName(d).length * 8 + 10;
        return d._mid.x - width / 2; // center rect on curve midpoint
      })
      .attr("y", (d) => {
        if (!d._mid) return 0;
        return d._mid.y - 12; // vertical offset
      })
      .attr("width", (d) => d.renderEventName(d).length * 8 + 10)
      .attr("height", 20)
      .attr("fill", "white")
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("rx", 4)
      .style("cursor", "pointer")
      .on("click", (domEvent, d) => {
        this.handleEventClick(domEvent, d.id);
      });

    svg
      .selectAll("text.event-label")
      .data(graph.events)
      .join("text")
      .attr("class", "event-label")
      .attr("x", (d) => (d._mid ? d._mid.x : 0))
      .attr("y", (d) => (d._mid ? d._mid.y + 4 : 0)) // vertical offset for visual centering
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .attr("fill", "black")
      .text((d) => d.renderEventName(d))
      .style("cursor", "pointer")
      .on("click", (domEvent, d) => {
        this.handleEventClick(domEvent, d.id);
      });

    graph.events.forEach(({ ctrl, id }, i) => {
      if (id === selectedEventId) {
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
    // Midpoint between states
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
