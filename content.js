const courseCoefficients = {
  Algorithmique: 3,
  "Bases de données": 3,
  "Gestion de Bases de Données": 2,
  Communication: 2,
  "Programmation Java": 4,
  UML: 3,
  GIT: 1,
  scripting: 2,
  "Technologies Web": 2,
  "Fondements des réseaux": 3,
  "Projet d'Intégration Java/mobile": 6,
  "Calcul scientifique": 2,
  "Analyse numérique": 3,
  "Projet programmation procédurale": 2,
};

// Default fallback coefficient
const defaultCoef = 1;

const defaultNoteCoefs = {
  exam_cc: { exam: 0.6, cc: 0.4 },
  exam_tp: { exam: 0.8, tp: 0.2 },
  exam_cc_tp: { exam: 0.5, cc: 0.3, tp: 0.2 },
};

let currentData = [];
function tableToJson(table) {
  const data = [];

  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    const cells = row.getElementsByTagName("td");

    if (!cells.length) continue;

    const designation = cells[0]?.textContent.trim();
    const note_cc = parseFloat(
      cells[2]?.textContent.trim().replace(",", ".") || NaN
    );
    const note_tp = parseFloat(
      cells[3]?.textContent.trim().replace(",", ".") || NaN
    );
    const note_exam = parseFloat(
      cells[4]?.textContent.trim().replace(",", ".") || NaN
    );
    let coef = parseFloat(cells[5]?.textContent.trim());

    if (isNaN(coef)) {
      // Try exact match first
      if (courseCoefficients[designation] !== undefined) {
        coef = courseCoefficients[designation];
      } else {
        // If no exact match, try partial match with longest match first
        coef = defaultCoef; // Default value
        let bestMatchLength = 0;

        for (const [courseName, coefficient] of Object.entries(
          courseCoefficients
        )) {
          // Check if courseName is contained in designation
          if (designation.toLowerCase().includes(courseName.toLowerCase())) {
            // Only update if this match is longer than previous matches
            if (courseName.length > bestMatchLength) {
              coef = coefficient;
              bestMatchLength = courseName.length;
            }
          }
        }
      }
    }

    data.push({
      designation,
      nom_ens: cells[1]?.textContent.trim(),
      note_cc,
      note_tp,
      note_exam,
      coef,
    });
  }

  return data;
}

function calculMoyenne(data) {
  let total = 0;
  let totalCoef = 0;

  data.forEach((item) => {
    let moyenne;

    if (isNaN(item.note_tp)) {
      if (isNaN(item.note_cc)) {
        moyenne = item.note_exam;
      } else {
        moyenne =
          item.note_exam *
            (item.exam_cc_coef || defaultNoteCoefs.exam_cc.exam) +
          item.note_cc * (item.cc_coef || defaultNoteCoefs.exam_cc.cc);
      }
    } else if (isNaN(item.note_cc)) {
      moyenne =
        item.note_exam * (item.exam_tp_coef || defaultNoteCoefs.exam_tp.exam) +
        item.note_tp * (item.tp_coef || defaultNoteCoefs.exam_tp.tp);
    } else {
      moyenne =
        item.note_exam * (item.exam_coef || defaultNoteCoefs.exam_cc_tp.exam) +
        item.note_cc * (item.cc_coef || defaultNoteCoefs.exam_cc_tp.cc) +
        item.note_tp * (item.tp_coef || defaultNoteCoefs.exam_cc_tp.tp);
    }

    item.moyenne = moyenne;
    total += moyenne * item.coef;
    totalCoef += item.coef;
  });

  const generalMoy = total / totalCoef;

  data.push({
    designation: "Moyenne Générale",
    nom_ens: "",
    note_cc: "",
    note_tp: "",
    note_exam: "",
    coef: totalCoef,
    moyenne: generalMoy,
  });

  return data;
}

function populateTable(data) {
  const table = document.getElementById("ContentPlaceHolder1_GridView1");
  const tbody = table.querySelector("tbody");
  const existingWarning = table.parentElement.querySelector("#coef-warning");
  if (!existingWarning) {
    const warningDiv = document.createElement("div");
    warningDiv.id = "coef-warning";
    warningDiv.style.padding = "10px";
    warningDiv.style.marginBottom = "10px";
    warningDiv.style.backgroundColor = "#fff3cd";
    warningDiv.style.border = "1px solid #ffeeba";
    warningDiv.style.borderRadius = "4px";
    warningDiv.style.fontWeight = "bold";
    warningDiv.style.color = "#856404";
    warningDiv.textContent =
      "The coefficients are not accurate, adjust them as needed";
    table.parentElement.insertBefore(warningDiv, table);
  }
  let html = `
        <tr style="color:White;background-color:#A80000;font-weight:bold;">
            <th scope="col">DESIGNATION</th>
            <th scope="col">NOM ENSEIGNANT</th>
            <th scope="col">NOTE CC</th>
            <th scope="col">NOTE TP</th>
            <th scope="col">NOTE EXAM</th>
            <th scope="col">COEF</th>
            <th scope="col">MOYENNE</th>
            <th scope="col">COEF EXAM</th>
            <th scope="col">COEF CC</th>
            <th scope="col">COEF TP</th>
        </tr>
    `;

  data.forEach((x, i) => {
    html += "<tr>";
    html += `<td>${x.designation}</td>`;
    html += `<td>${x.nom_ens}</td>`;
    html += `<td contenteditable="true" data-type="note_cc" data-index="${i}" style="background-color:#f7f7f7">${
      isNaN(x.note_cc) ? "" : x.note_cc
    }</td>`;
    html += `<td contenteditable="true" data-type="note_tp" data-index="${i}" style="background-color:#f7f7f7">${
      isNaN(x.note_tp) ? "" : x.note_tp
    }</td>`;
    html += `<td contenteditable="true" data-type="note_exam" data-index="${i}" style="background-color:#f7f7f7">${
      isNaN(x.note_exam) ? "" : x.note_exam
    }</td>`;
    if (x.designation === "Moyenne Générale") {
      html += `<td>${x.coef}</td>`;
      html += `<td style="background-color:${
        x.moyenne >= 8 ? "green" : "red"
      };color:white">${x.moyenne.toFixed(2)}</td>`;
      html += `<td></td><td></td><td></td>`;
    } else {
      const placeholder = courseCoefficients[x.designation] || defaultCoef;
      html += `<td contenteditable="true" data-type="coef" data-index="${i}" style="background-color:#f7f7f7" title="Placeholder: ${placeholder}">${x.coef}</td>`;
      html += `<td style="background-color:${
        x.moyenne >= 8 ? "green" : "red"
      };color:white">${x.moyenne.toFixed(2)}</td>`;

      let examCoef, ccCoef, tpCoef;

      if (isNaN(x.note_tp)) {
        if (isNaN(x.note_cc)) {
          examCoef = 1;
          ccCoef = "";
          tpCoef = "";
        } else {
          examCoef = x.exam_cc_coef || defaultNoteCoefs.exam_cc.exam;
          ccCoef = x.cc_coef || defaultNoteCoefs.exam_cc.cc;
          tpCoef = "";
        }
      } else if (isNaN(x.note_cc)) {
        examCoef = x.exam_tp_coef || defaultNoteCoefs.exam_tp.exam;
        ccCoef = "";
        tpCoef = x.tp_coef || defaultNoteCoefs.exam_tp.tp;
      } else {
        examCoef = x.exam_coef || defaultNoteCoefs.exam_cc_tp.exam;
        ccCoef = x.cc_coef || defaultNoteCoefs.exam_cc_tp.cc;
        tpCoef = x.tp_coef || defaultNoteCoefs.exam_cc_tp.tp;
      }

      html += `<td contenteditable="true" data-type="exam" data-index="${i}" style="background-color:#f0f0f0" title="Default: ${examCoef}">${
        examCoef === "" ? "" : examCoef
      }</td>`;
      html += `<td contenteditable="true" data-type="cc" data-index="${i}" style="background-color:#f0f0f0" title="Default: ${ccCoef}">${
        ccCoef === "" ? "" : ccCoef
      }</td>`;
      html += `<td contenteditable="true" data-type="tp" data-index="${i}" style="background-color:#f0f0f0" title="Default: ${tpCoef}">${
        tpCoef === "" ? "" : tpCoef
      }</td>`;
    }

    html += "</tr>";
  });

  tbody.innerHTML = html;

  addEventListenersToCoefFields();
  addEventListenersToNoteFields();
}

function addEventListenersToNoteFields() {
  const noteCells = document.querySelectorAll(
    '[data-type="note_cc"], [data-type="note_tp"], [data-type="note_exam"]'
  );

  noteCells.forEach((cell) => {
    cell.removeEventListener("blur", handleNoteChange);
    cell.addEventListener("blur", () => {
      const index = parseInt(cell.getAttribute("data-index"));
      const type = cell.getAttribute("data-type");
      handleNoteChange(cell, index, type);
    });

    cell.addEventListener("keydown", function (e) {
      if (
        e.key === "Backspace" ||
        e.key === "Delete" ||
        e.key === "Tab" ||
        e.key === "Escape" ||
        e.key === "Enter" ||
        e.key === "." ||
        e.key === "," ||
        (e.key >= "0" && e.key <= "9")
      ) {
        if (e.key === "Enter") {
          e.preventDefault();
          cell.blur();
        }
        return;
      }
      e.preventDefault();
    });
  });
}

function handleNoteChange(cell, index, type) {
  if (index >= currentData.length - 1) return;

  const inputValue = cell.textContent.trim().replace(",", ".");
  const newNote = parseFloat(inputValue);

  if (!isNaN(newNote) && newNote >= 0 && newNote <= 20) {
    currentData[index][type] = newNote;
    const withAverage = calculMoyenne(currentData.slice(0, -1));
    currentData = withAverage;
    populateTable(currentData);
  } else {
    cell.textContent = isNaN(currentData[index][type])
      ? ""
      : currentData[index][type];
    // If clearing a note, reset corresponding coefficient
    if (type === "note_cc" && isNaN(newNote)) {
      currentData[index].cc_coef = undefined;
    } else if (type === "note_tp" && isNaN(newNote)) {
      currentData[index].tp_coef = undefined;
    }
    const withAverage = calculMoyenne(currentData.slice(0, -1));
    currentData = withAverage;
    populateTable(currentData);
  }
}

function addEventListenersToCoefFields() {
  const coefCells = document.querySelectorAll(
    '[data-type="coef"], [data-type="exam"], [data-type="cc"], [data-type="tp"]'
  );

  coefCells.forEach((cell) => {
    cell.addEventListener("keydown", function (e) {
      if (
        e.key === "Backspace" ||
        e.key === "Delete" ||
        e.key === "Tab" ||
        e.key === "Escape" ||
        e.key === "Enter" ||
        e.key === "." ||
        e.key === "," ||
        (e.key >= "0" && e.key <= "9")
      ) {
        if (e.key === "Enter") {
          e.preventDefault();
          cell.blur();
        }
        return;
      }
      e.preventDefault();
    });

    cell.removeEventListener("blur", handleCoefChange);
    cell.removeEventListener("blur", handleNoteCoefChange);
    cell.addEventListener("blur", () => {
      const index = parseInt(cell.getAttribute("data-index"));
      const type = cell.getAttribute("data-type");
      if (type === "coef") {
        handleCoefChange(cell, index);
      } else {
        handleNoteCoefChange(cell, index, type);
      }
    });
  });
}

function handleCoefChange(cell, index) {
  const inputValue = cell.textContent.trim().replace(",", ".");
  const newCoef = parseFloat(inputValue);
  if (!isNaN(newCoef)) {
    currentData[index].coef = newCoef;
    const withAverage = calculMoyenne(currentData.slice(0, -1));
    currentData = withAverage;
    populateTable(currentData);
  } else {
    cell.textContent = currentData[index].coef;
  }
}

function handleNoteCoefChange(cell, index, type) {
  const inputValue = cell.textContent.trim().replace(",", ".");
  const newCoef = inputValue === "" ? undefined : parseFloat(inputValue);

  if (newCoef === undefined || (!isNaN(newCoef) && newCoef >= 0)) {
    if (type === "exam") {
      if (
        !isNaN(currentData[index].note_tp) &&
        !isNaN(currentData[index].note_cc)
      ) {
        currentData[index].exam_coef = newCoef;
      } else if (!isNaN(currentData[index].note_cc)) {
        currentData[index].exam_cc_coef = newCoef;
      } else if (!isNaN(currentData[index].note_tp)) {
        currentData[index].exam_tp_coef = newCoef;
      } else {
        currentData[index].exam_cc_coef = undefined;
        currentData[index].exam_tp_coef = undefined;
        currentData[index].exam_coef = undefined;
      }
    } else if (type === "cc") {
      currentData[index].cc_coef = newCoef;
    } else if (type === "tp") {
      currentData[index].tp_coef = newCoef;
    }

    const withAverage = calculMoyenne(currentData.slice(0, -1));
    currentData = withAverage;
    populateTable(currentData);
  } else {
    cell.textContent = currentData[index][`${type}_coef`] || "";
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "calculateGrades") {
    const table = document.getElementById("ContentPlaceHolder1_GridView1");
    if (table) {
      currentData = calculMoyenne(tableToJson(table));
      populateTable(currentData);
    } else {
      console.error("Table with ID 'ContentPlaceHolder1_GridView1' not found.");
    }
  }
});
