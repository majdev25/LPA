// PGSS

// graf sistema
var systemGraph = null;

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
let MATRIX_RENDER_COUNTER = 0;

class Matrix {
  constructor(rows, type = 0) {
    // Ustvari prazno matriko
    this.id = null;
    this._id = "A" + MATRIX_RENDER_COUNTER++;
    this.rows = rows;
    this.data = [];
    this.children = [];
    this.header = "";
    this.type = type;
    this.text = ""; //if type is 1
    this.level = null;

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
  // za lažje branje iz procesa(row) v proces(col)
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
  // Vsaka matrika
  for (let i = 0; i < matrixs.length; i++) {
    console.log(
      "--------- MATRIX: " + i + "/" + matrixs.length + " -----------"
    );
    matrixs[i].print();
    if (matrixs[i] instanceof Matrix) {
      // Vsak proces
      for (let p = 0; p < M.rows; p++) {
        triggerProces(p, matrixs[i]);
      }
    }
  }
}

/**
 * Rekurzivna funkcija, ki sproži vse možne dogodke v procesu in generira nove matrike
 * @param {number} p - proces index
 * @param {Matrix} m - matrika
 */
function triggerProces(p, m) {
  // vsi sprejemi
  simulateSprejemniDogodki(p, m);
  // vse oddaje
  simulateOddajniDogodki(p, m);
  // lokalni dodgodek
  simulateLokalniDogodki(p, m);
}

/**
 * Vrne vse možne oddajne dogodke za proces p v stanju s
 * @param {number} p - proces index
 * @param {string} s - proces current status
 */
function getOddajniDogodkiZaProcesVStanju(p, s) {
  return systemGraph.processes[p].procesGraph.events.filter((e) => {
    if (e.type == "odd" && e.from == s) {
      return true;
    }
    return false;
  });
}

/**
 * Vrne vse možne sprejemne dogodke za proces p v stanju s
 * @param {number} p - proces index
 * @param {string} s - proces current status
 */
function getSprejemniDogodkiZaProcesVStanju(p, s) {
  return systemGraph.processes[p].procesGraph.events.filter((e) => {
    if (e.type == "spr" && e.from == s) {
      return true;
    }
    return false;
  });
}

/**
 * Vrne vse možne sprejemne dogodke za proces p v stanju s
 * @param {number} p - proces index
 * @param {string} s - proces current status
 */
function getLokalniDogodkiZaProcesVStanju(p, s) {
  return systemGraph.processes[p].procesGraph.events.filter((e) => {
    if (e.type == "lok" && e.from == s) {
      return true;
    }
    return false;
  });
}

/**
 * Vrne vse možne sprejemne dogodke za proces p v stanju s
 * @param {number} p_index - proces index
 * @param {string} s - proces current status
 * @param {string} p_id - proces id (kdo sprejema)
 * @param {string} event - event label
 */
function getSprejemniDogodki(p_index, s, p_id, event) {
  return systemGraph.processes[p_index].procesGraph.events.filter((e) => {
    if (
      /*e.type == "spr" &&*/ // morda ni potrebno
      e.from == s &&
      e.label == event &&
      e.from_proces == p_id
    ) {
      return true;
    }
    return false;
  });
}

/**
 * Vrne index procesa
 * @param {string} p_id - proces id
 */
function getProcesIndex(p_id) {
  return systemGraph.processes.findIndex((p) => p.id === p_id);
}

/**
 * Vrne id procesa
 * @param {string} p_index - proces id
 */
function getProcesId(p_index) {
  return systemGraph.processes[p_index].id;
}

/**
 * Vrne naziv procesa
 * @param {string} p_id - proces id
 */
function getProcesLabel(p_id) {
  return systemGraph.processes.find((p) => p.id === p_id).label;
}

/**
 * Vrne naziv stanja
 * @param {string} s_id - proces id
 * @param {string} s_id - proces id
 */
function getStateLabel(p_id, s_id) {
  return systemGraph.processes
    .find((p) => p.id === p_id)
    .states.find((s) => s.id === s_id).label;
}

/**
 * Vrne kanal
 * @param {string} c_id - channel id
 * @param {string} p_id - process id
 */
function getChannelLenght(c_id, p_id) {
  const channel = systemGraph.channels.find((c) => c.id === c_id);
  if (channel.proces1.id == p_id) {
    return channel.proces1.q_length;
  }
  if (channel.proces2.id == p_id) {
    return channel.proces2.q_length;
  }
  return 0;
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

/**
 * @param {number} p - proces index
 * @param {Matrix} m - matrika
 */
function simulateOddajniDogodki(p, m) {
  let oddajniDogodki = getOddajniDogodkiZaProcesVStanju(p, m.peek(p, p));

  // Simuliraj vsak možen oddajni dogodek
  oddajniDogodki.forEach((e) => {
    console.log("-----ODD------");
    console.log(p + "(" + e.id + ")");

    // Ustvari klon matrike
    let new_m = m.clone();
    // Pripravi možen nastanek matrike
    let header =
      getProcesLabel(e.from_proces) +
      ":" +
      " -" +
      e.label +
      "(" +
      getProcesLabel(e.to_proces) +
      ")";

    let row = getProcesIndex(e.from_proces);
    let col = getProcesIndex(e.to_proces);

    // todo: check if possible to transmit - polna vrsta (ali obstaja kanal?)
    if (m.getLen(col, row) >= getChannelLenght(e.channel_id, e.to_proces)) {
      new_m = new Matrix();
      new_m.type = 1;
      new_m.text = "PV";
      new_m.header = header;
      new_m.level = m.level + 1;
      m.children.push(new_m);
      console.log("PV");
      return;
    }

    // dodaj dogodek v vrsto
    new_m.push(col, row, e.label);

    // popravi stanje procesa
    new_m.setStanje(row, row, e.to);

    // Preveri ali že obstaja enaka matrika
    let obstaja = M.contains(new_m);

    if (obstaja != null) {
      // Matrika že obstaja
      new_m = new Matrix();
      new_m.type = 2;
      new_m.text = obstaja;
      new_m.header = header;
      new_m.level = m.level + 1;
      m.children.push(new_m);
    } else {
      // Nova matrika
      new_m.createId();
      new_m.header = header;
      new_m.level = m.level + 1;
      m.children.push(new_m);
      matrixs.push(new_m);
    }
  });
}

/**
 * @param {number} p - proces index
 * @param {Matrix} m - matrika
 */
function simulateSprejemniDogodki(p, m) {
  let sprejemniDogodki = getSprejemniDogodkiZaProcesVStanju(p, m.peek(p, p));

  // Simuliraj vsak možen sprejemni dogodek
  sprejemniDogodki.forEach((e) => {
    console.log("-----SPR------");
    console.log(p + "(" + e.id + ")");

    // Ustvari klon matrike
    let new_m = m.clone();
    // Pripravi možen nastanek matrike
    let header =
      getProcesLabel(e.from_proces) +
      ":" +
      " +" +
      e.label +
      "(" +
      getProcesLabel(e.to_proces) +
      ")";

    let col = getProcesIndex(e.from_proces);
    let row = getProcesIndex(e.to_proces);

    if (m.peek(row, col) == e.label) {
      // v vrsti je pravi dogodek
      // odstrani dodgodek iz vrste
      new_m.pop(row, col);
      // popravi stanje procesa
      new_m.setStanje(row, row, e.to);
    } else {
      // preskoči če v vrsti ni pravi dogodek
      return;
    }

    // Preveri ali že obstaja enaka matrika
    let obstaja = M.contains(new_m);

    if (obstaja != null) {
      // Matrika že obstaja
      new_m = new Matrix();
      new_m.type = 2;
      new_m.text = obstaja;
      new_m.header = header;
      new_m.level = m.level + 1;
      m.children.push(new_m);
    } else {
      // Nova matrika
      new_m.createId();
      new_m.header = header;
      new_m.level = m.level + 1;
      m.children.push(new_m);
      matrixs.push(new_m);
    }
  });

  // Preveri nedefinirana stanja

  // Preveri za vsak proces
  systemGraph.processes.forEach((proces2, p2_index) => {
    let row = p;
    let col = p2_index;

    // preskoči sam sebe in če prazna vrsta
    if (proces2.id == systemGraph.processes[p].id || m.peek(row, col) == null) {
      return;
    }

    // Dodaj NS če proces ne zna sprejeti vhodni dogodek
    if (
      getSprejemniDogodki(p, m.peek(p, p), proces2.id, m.peek(row, col))
        ?.length < 1
    ) {
      let header =
        getProcesLabel(getProcesId(p)) +
        ":" +
        " +(" +
        getProcesLabel(getProcesId(p2_index)) +
        ")";
      new_m = new Matrix();
      new_m.type = 1;
      new_m.text = "NS";
      new_m.header = header;
      new_m.level = m.level + 1;
      m.children.push(new_m);
    }
  });
}

/**
 * @param {number} p - proces index
 * @param {Matrix} m - matrika
 */
function simulateLokalniDogodki(p, m) {
  let oddajniDogodki = getLokalniDogodkiZaProcesVStanju(p, m.peek(p, p));

  // Simuliraj vsak možen oddajni dogodek
  oddajniDogodki.forEach((e) => {
    console.log("-----LOK------");
    console.log(p + "(" + e.id + ")");

    // Ustvari klon matrike
    let new_m = m.clone();
    // Pripravi možen nastanek matrike
    let header = getProcesLabel(e.from_proces) + ":" + " #" + e.label;

    let row = getProcesIndex(e.from_proces);
    let col = getProcesIndex(e.to_proces);

    // popravi stanje procesa
    new_m.setStanje(row, row, e.to);

    // Preveri ali že obstaja enaka matrika
    let obstaja = M.contains(new_m);

    if (obstaja != null) {
      // Matrika že obstaja
      new_m = new Matrix();
      new_m.type = 2;
      new_m.text = obstaja;
      new_m.header = header;
      new_m.level = m.level + 1;
      m.children.push(new_m);
    } else {
      // Nova matrika
      new_m.createId();
      new_m.header = header;
      new_m.level = m.level + 1;
      m.children.push(new_m);
      matrixs.push(new_m);
    }
  });
}

// Vstopna točka
function simulate(sg) {
  //init
  systemGraph = sg;
  matrixs = [];
  MATRIX_ID_COUNTER = 0;
  MATRIX_RENDER_COUNTER = 0;

  // Pripravi začetno matriko
  M = new Matrix(systemGraph.processes.length);

  // Nastavi začetna stanja v matriki
  systemGraph.processes.forEach((p, i) => {
    const startState = p.procesGraph.states.find((s) => s.isStart).id;
    M.setStanje(i, i, startState);
  });

  M.createId();
  M.header = "Začetek";
  M.level = 0;
  matrixs.push(M);

  matrixRek();

  // Izpiši matriko
  let tree = matrixTreeToDot(M);
  console.log(tree);
  return tree;
}

function matrixTreeToDot(matrix) {
  let dot = "digraph G {\n";

  function traverse(m) {
    if (!m) return;

    // Use type-1 text for PV, otherwise header
    const label =
      m.type > 0
        ? `${m.text}\\n${m.header}\\n${m.level}`
        : `Matrix ${m.id}\\n${m.header}\\n${m.level}`;
    if (m.type > 0) {
      dot += `  ${m._id} [label="${label}"];\n`;
    } else {
      dot += `  ${m.id} [label="${label}"];\n`;
    }

    // Ensure children is always an array
    if (Array.isArray(m.children)) {
      m.children.forEach((c) => {
        if (c && typeof c.id !== "undefined") {
          if (c.type > 0) {
            dot += `  ${m.id} -> ${c._id};\n`;
          } else {
            dot += `  ${m.id} -> ${c.id};\n`;
          }
          traverse(c);
        }
      });
    }
  }

  traverse(matrix);
  dot += "}";
  return dot;
}

module.exports = { simulate };
