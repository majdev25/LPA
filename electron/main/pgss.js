// PGSS

// graf sistema
var systemGraph = {
  processes: [
    {
      id: "p0",
      label: "p0",
      header: "",
      procesGraph: {
        states: [
          {
            id: "s0",
            label: "s0",
            isStart: true,
            parent_proces: "p0",
          },
          {
            id: "s1",
            label: "s1",
            isStart: false,
            parent_proces: "p0",
          },
        ],
        events: [
          {
            id: "d0",
            label: "p",
            type: "spr",
            from: "s0",
            to: "s1",
            from_proces: "p1",
            to_proces: "p0",
            channel_id: "c0",
          },
          {
            id: "d1",
            label: "p",
            type: "odd",
            from: "s0",
            to: "s1",
            from_proces: "p0",
            to_proces: "p1",
            channel_id: "c0",
          },
          {
            id: "d2",
            label: "r",
            type: "odd",
            from: "s1",
            to: "s0",
            from_proces: "p0",
            to_proces: "p1",
            channel_id: "c0",
          },
        ],
      },
    },
    {
      id: "p1",
      label: "p1",
      procesGraph: {
        states: [
          {
            id: "s0",
            label: "s0",
            isStart: true,
            parent_proces: "p1",
          },
          {
            id: "s1",
            label: "s1",
            isStart: false,
            parent_proces: "p1",
          },
        ],
        events: [
          {
            id: "d0",
            label: "p",
            type: "spr",
            from: "s0",
            to: "s1",
            from_proces: "p0",
            to_proces: "p1",
            channel_id: "c0",
          },
          {
            id: "d1",
            label: "p",
            type: "odd",
            from: "s0",
            to: "s1",
            from_proces: "p1",
            to_proces: "p0",
            channel_id: "c0",
          },
          {
            id: "d2",
            label: "r",
            type: "spr",
            from: "s1",
            to: "s0",
            from_proces: "p0",
            to_proces: "p1",
            channel_id: "c0",
          },
        ],
      },
    },
  ],
  channels: [
    {
      id: "c0",
      proces1: {
        id: "p0",
        q_length: 2,
      },
      proces2: {
        id: "p1",
        q_length: 2,
      },
    },
  ],
  _updateId: "zxy6e8g28z",
};

class MatrixCell {
  type = null;
  value = null;
  constructor(type) {
    this.type = type;
    if (this.type === "vrsta") {
      this.value = [];
    } else if (this.type === "stanje") {
      this.value = "";
    }
  }

  clone() {
    const c = new MatrixCell(this.type);
    c.value = structuredClone(this.value);
    return c;
  }

  equals(other) {
    if (!(other instanceof MatrixCell)) return false;
    if (this.type !== other.type) return false;

    if (this.type === "vrsta") {
      if (this.value.length !== other.value.length) return false;
      for (let i = 0; i < this.value.length; i++) {
        if (this.value[i] !== other.value[i]) return false;
      }
      return true;
    } else if (this.type === "stanje") {
      return this.value === other.value;
    }
    return false; // fallback for unknown types
  }
}

let MATRIX_ID_COUNTER = 0;

class Matrix {
  constructor(rows) {
    // Ustvari prazno matriko
    this.id = null;
    this.rows = rows;
    this.data = [];
    this.children = [];

    this.data = [];
    for (let i = 0; i < this.rows; i++) {
      this.data[i] = [];
      for (let j = 0; j < this.rows; j++) {
        if (j == i) {
          this.data[i][j] = new MatrixCell("stanje");
        } else {
          this.data[i][j] = new MatrixCell("vrsta");
        }
      }
    }
  }

  createId() {
    this.id = MATRIX_ID_COUNTER++;
  }

  // Dodaj otroka
  addChild(childMatrix) {
    if (!(childMatrix instanceof Matrix)) {
      console.error("Child must be an instance of Matrix");
      return;
    }
    this.children.push(childMatrix);
  }

  // Nastavi "stanje" celico
  setStanje(row, col, value) {
    const cell = new MatrixCell("stanje");
    cell.value = value;
    this.data[row][col] = cell;
  }

  // dodaj element v queue
  push(row, col, val) {
    const cell = this.data[row][col];
    if (!cell) return console.error("Cell is null");
    if (cell.type === "vrsta") {
      cell.value.push(val); // FIFO: dodaj na konec
    } else {
      console.error("Cell type is not 'vrsta'");
    }
  }

  // odstrani in vrne prvi element (FIFO)
  pop(row, col) {
    const cell = this.data[row][col];
    if (!cell) return console.error("Cell is null");
    if (cell.type === "vrsta") {
      return cell.value.shift();
    } else {
      console.error("Cell type is not 'vrsta'");
      return null;
    }
  }

  // vrne prvi element brez odstranitve
  peek(row, col) {
    const cell = this.data[row][col];
    if (!cell) return console.error("Cell is null");
    if (cell.type === "vrsta") {
      return cell.value[0] ?? null;
    } else {
      return cell.value ?? null;
    }
  }

  getLen(row, col) {
    const cell = this.data[row][col];
    if (!cell) return console.error("Cell is null");
    if (cell.type === "vrsta") {
      return cell.value.length;
    } else {
      console.error("Cell type is not 'vrsta'");
    }
  }

  clone() {
    const m = new Matrix(this.rows);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.rows; j++) {
        const cell = this.data[i][j];
        m.data[i][j] = cell ? cell.clone() : null;
      }
    }
    // children intentionally not cloned
    return m;
  }

  equals(other) {
    if (!(other instanceof Matrix)) return false;
    if (this.rows !== other.rows) return false;

    for (let i = 0; i < this.rows; i++) {
      if (this.data[i].length !== other.data[i].length) return false;

      for (let j = 0; j < this.data[i].length; j++) {
        const cellA = this.data[i][j];
        const cellB = other.data[i][j];

        // Both null?
        if (!cellA && !cellB) continue;
        if (!cellA || !cellB) return false;

        if (!cellA.equals(cellB)) return false;
      }
    }

    return true;
  }

  contains(target) {
    if (this.equals(target)) return this.id;

    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      if (child instanceof Matrix) {
        const foundId = child.contains(target);
        if (foundId !== null) return foundId;
      }
    }

    return null; // not found
  }

  print() {
    console.log("Matrix:");
    this.data.forEach((row, i) => {
      const rowStr = row
        .map((cell) => {
          if (!cell) return "null";
          if (cell.type === "vrsta") return `[${cell.value.join(", ")}]`;
          return cell.value;
        })
        .join(" | ");
      console.log(rowStr);
    });
  }
}

// root
let M = null;

let matrixs = [];

// Rekurzivna funkcija, ki iterira po seznamu arrayov
function matrixRek() {
  for (let i = 0; i < matrixs.length; i++) {
    console.log("new matrix: " + i + "/" + matrixs.length);
    if (matrixs[i] instanceof Matrix) {
      for (let p = 0; p < M.rows; p++) {
        triggerProces(p, matrixs[i]);
      }
    }
  }
}

// Rekurzivna funkcija, ki sproži vse možne dogodke v procesu in generira nove matrike
function triggerProces(p, m) {
  // vsi sprejemi
  simulateSprejemniDogodki(p, m);
  // vse oddaje
  simulateOddajniDogodki(p, m);
}

function getOddajniDogodkiZaProcesVStanju(p, s) {
  return systemGraph.processes[p].procesGraph.events.filter((e) => {
    if (e.type == "odd" && e.from == s) {
      return true;
    }
    return false;
  });
}

function getSprejemniDogodkiZaProcesVStanju(p, s) {
  return systemGraph.processes[p].procesGraph.events.filter((e) => {
    if (e.type == "spr" && e.from == s) {
      return true;
    }
    return false;
  });
}

function getProcesIndex(p_id) {
  return systemGraph.processes.findIndex((p) => p.id === p_id);
}

function checkIfMatixEits(target) {
  // First, check self
  if (this.equals(target)) return true;

  // Then, check children recursively
  for (let i = 0; i < this.children.length; i++) {
    const child = this.children[i];
    if (child instanceof Matrix && child.contains(target)) return true;
  }
}

function simulateOddajniDogodki(p, m) {
  let oddajniDogodki = getOddajniDogodkiZaProcesVStanju(p, m.peek(p, p));

  oddajniDogodki.forEach((e) => {
    console.log("-----ODD------");
    console.log(p + "(" + e.id + ")");
    let new_m = m.clone();
    new_m.header =
      e.from_proces + ":" + " -" + e.label + "(" + e.to_proces + ")";

    let fromProcesIndex = getProcesIndex(e.from_proces);
    let toProcesIndex = getProcesIndex(e.to_proces);

    // todo: check if possible to transmit - polna vrsta (ali obstaja kanal?)
    if (m.getLen(toProcesIndex, fromProcesIndex) >= 2) {
      console.log("PV");
      return;
    }

    // dodaj dogodek v vrsto
    new_m.push(toProcesIndex, fromProcesIndex, e.label);

    // popravi stanje procesa
    new_m.setStanje(fromProcesIndex, fromProcesIndex, e.to);

    let obstaja = M.contains(new_m);

    // dodaj vejo
    if (obstaja != null) {
      console.log(m.id + "->" + obstaja);
      console.log(m.id + " obstaja");
    } else {
      new_m.createId();
      m.children.push(new_m);
      console.log(m.id + "->" + new_m.id);
      new_m.print();
      matrixs.push(new_m);
    }
  });
}

function simulateSprejemniDogodki(p, m) {
  let oddajniDogodki = getSprejemniDogodkiZaProcesVStanju(p, m.peek(p, p));

  oddajniDogodki.forEach((e) => {
    console.log("-----SPR------");
    console.log(p + "(" + e.id + ")");
    let new_m = m.clone();
    new_m.header =
      e.from_proces + ":" + " +" + e.label + "(" + e.to_proces + ")";

    let fromProcesIndex = getProcesIndex(e.from_proces);
    let toProcesIndex = getProcesIndex(e.to_proces);

    if (m.peek(toProcesIndex, fromProcesIndex) == e.label) {
      // odstrani dodgodek iz vrste
      new_m.pop(toProcesIndex, fromProcesIndex);
      // popravi stanje procesa
      new_m.setStanje(toProcesIndex, toProcesIndex, e.to);
    } else {
      console.log(m.peek(toProcesIndex, fromProcesIndex), e.label);
      m.print();
      console.log("not valid");
      return;
    }

    let obstaja = M.contains(new_m);

    // dodaj vejo
    if (obstaja != null) {
      console.log(m.id + "->" + obstaja);
      console.log(m.id + " obstaja");
      m.children.push(obstaja);
    } else {
      new_m.createId();
      m.children.push(new_m);
      console.log(m.id + "->" + new_m.id);
      new_m.print();
      matrixs.push(new_m);
    }
  });
}

// vstopna točka
function main(systemGraph) {
  // Pripravi začetno matriko
  M = new Matrix(systemGraph.processes.length);

  systemGraph.processes.forEach((p, i) => {
    const startState = p.procesGraph.states.find((s) => s.isStart).id;
    M.setStanje(i, i, startState);
  });

  M.createId();
  M.header = "Root";
  M.print();

  matrixs.push(M);
  matrixRek();

  console.log(JSON.stringify(M));
}

main(systemGraph);
