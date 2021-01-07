const timeFunc = (f, n, ...args) => {
  const stime = performance.now();
  f.apply({}, args);
  console.log(`Function ${n} took ${performance.now() - stime}`);
};
const cols = 26,
  rows = 100;
let focusedCell = null;
let spreadsheet, input;
const initSheet = () => {
  spreadsheet = document.getElementById("spreadsheet-cells");
  for (let r = 0; r < rows; r++) {
    const row = document.createElement("div");
    row.row = r;
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement("div");
      cell.col = c;
      row.appendChild(cell);
    }
    spreadsheet.appendChild(row);
  }

  input = document.createElement("input");
  input.id = "spreadsheet-input";
  input.addEventListener("mousedown", (e) => {
    e.stopPropagation();
  });

  spreadsheet.addEventListener("mousedown", (event) => {
    focusCell(event.target.parentElement.row, event.target.col);
  });

  input.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "Enter":
      case "ArrowDown":
        if (focusedCell.row < rows - 1) {
          if (event.key == "Enter" && event.shiftKey) {
            focusCell(focusedCell.row - 1, focusedCell.col);
          } else {
            focusCell(focusedCell.row + 1, focusedCell.col);
          }
        }
        break;
      case "Tab":
        if (focusedCell.col < cols - 1) {
          event.preventDefault();
          if (event.shiftKey) {
            focusCell(focusedCell.row, focusedCell.col - 1);
          } else {
            focusCell(focusedCell.row, focusedCell.col + 1);
          }
        }
      case "ArrowRight":
        if (
          focusedCell.col < cols - 1 &&
          event.target.selectionStart >= event.target.value.length
        ) {
          focusCell(focusedCell.row, focusedCell.col + 1);
        }
        break;
      case "ArrowLeft":
        if (focusedCell.col > 0 && event.target.selectionStart == 0) {
          focusCell(focusedCell.row, focusedCell.col - 1);
        }
        break;
      case "ArrowUp":
        if (focusedCell.row > 0) {
          focusCell(focusedCell.row - 1, focusedCell.col);
        }
        break;
    }
  });

  const pasteCSVManual = (raw) => {
    let c0 = focusedCell.col,
      r = focusedCell.row,
      c = focusedCell.col; // row and col pasting data into
    let cellStart = 0;
    for (let i = 0; i < raw.length; i++) {
      switch (raw[i]) {
        case ",":
          getCell(r, c).innerText = raw.substring(cellStart, i);
          cellStart = i + 1;
          c += 1;
          break;
        case "\n":
          getCell(r, c).innerText = raw.substring(cellStart, i);
          cellStart[i] += 1;
          r += 1;
          c = c0;
      }
    }
    if (i < raw.length - 1) {
      getCell(r, c).innerText = raw.substring(cellStart, i + 1);
    }
  };

  input.addEventListener("paste", (event) => {
    // paste csv into cells
    event.preventDefault();
    timeFunc(
      pasteCSVManual,
      "pasteCSVManual",
      event.clipboardData.getData("text")
    );
  });
};
const getCell = (r, c) => spreadsheet.children[r].children[c];

const focusCell = (row, col) => {
  focusedCell = { row, col };
  getCell(row, col).appendChild(input);
  setTimeout(() => input.focus(), 0);
};

timeFunc(initSheet, "initSheet");
