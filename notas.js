const STUDENT_COUNT = 10;
const EXAM_COUNT = 3;
const PASSING_GRADE = 55;

const studentNames = Array(STUDENT_COUNT).fill("");
const grades = Array.from({ length: STUDENT_COUNT }, () => Array(EXAM_COUNT).fill(null));
let registeredCount = 0;

const form = document.getElementById("student-form");
const nameInput = document.getElementById("student-name");
const gradeInputs = [
  document.getElementById("exam-one"),
  document.getElementById("exam-two"),
  document.getElementById("exam-three")
];
const formMessage = document.getElementById("form-message");
const progressText = document.getElementById("progress-text");
const progressTrack = document.querySelector(".progress-track");
const progressFill = document.getElementById("progress-fill");
const addButton = document.getElementById("add-button");
const reportSection = document.getElementById("report-section");

function formatGrade(value) {
  return new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function average(values) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function getStudents() {
  return studentNames.slice(0, registeredCount).map((name, index) => ({
    name,
    grades: grades[index],
    average: average(grades[index])
  }));
}

function updateProgress() {
  const courseIsFull = registeredCount === STUDENT_COUNT;

  progressTrack.setAttribute("aria-valuenow", String(registeredCount));
  progressFill.style.width = `${registeredCount / STUDENT_COUNT * 100}%`;
  progressText.textContent = courseIsFull
    ? "Curso completo · 10 estudiantes"
    : `Estudiante ${registeredCount + 1} de ${STUDENT_COUNT}`;

  nameInput.disabled = courseIsFull;
  gradeInputs.forEach((input) => {
    input.disabled = courseIsFull;
  });

  addButton.disabled = courseIsFull;
  addButton.textContent = courseIsFull ? "Curso completo" : "Agregar estudiante";
}

function getGroupAverage(students) {
  if (students.length === 0) return 0;

  const allGrades = students.flatMap((student) => student.grades);
  return average(allGrades);
}

function getExamAverage(students, examIndex) {
  if (students.length === 0) return 0;

  const examGrades = students.map((student) => student.grades[examIndex]);
  return average(examGrades);
}

function getStatusSummary(students) {
  const passed = students.filter((student) => student.average >= PASSING_GRADE).length;
  const failed = students.length - passed;

  return { passed, failed };
}

function renderStudentResults(students) {
  const container = document.getElementById("student-results");
  const cards = students.map((student, index) => {
    const card = createElement("article", "student-result");
    card.append(createElement("h3", "", `Nombre ${index + 1}: ${student.name}`));

    student.grades.forEach((grade, index) => {
      const line = createElement("div", "result-line");
      line.append(
        createElement("span", "", `C${index + 1}`),
        createElement("strong", "", formatGrade(grade))
      );
      card.append(line);
    });

    const bottom = createElement("div", "result-bottom");
    bottom.append(
      createElement("span", "result-average", `Promedio final: ${formatGrade(student.average)}`),
      createElement("span", `status ${student.average >= PASSING_GRADE ? "pass" : "fail"}`, student.average >= PASSING_GRADE ? "Aprobado" : "Reprobado")
    );
    card.append(bottom);
    return card;
  });
  container.replaceChildren(...cards);
}

function renderReport() {
  const students = getStudents().sort((a, b) => a.average - b.average);
  const groupAverage = getGroupAverage(students);
  const examAverages = [
    getExamAverage(students, 0),
    getExamAverage(students, 1),
    getExamAverage(students, 2)
  ];
  const { passed, failed } = getStatusSummary(students);

  document.getElementById("report-title").textContent = registeredCount === STUDENT_COUNT
    ? "Resultados del curso"
    : "Resultados parciales";
  document.querySelector(".complete-label").textContent = `${registeredCount} de ${STUDENT_COUNT} registrados`;

  const summaryOutput = document.getElementById("summary-output");
  summaryOutput.innerHTML = `
    <div class="summary-metrics">
      <p>Promedio del curso C1: <strong>${formatGrade(examAverages[0])}</strong></p>
      <p>Promedio del curso C2: <strong>${formatGrade(examAverages[1])}</strong></p>
      <p>Promedio del curso C3: <strong>${formatGrade(examAverages[2])}</strong></p>
      <p>Promedio Final Curso: <strong>${formatGrade(groupAverage)}</strong></p>
    </div>
  `;
  document.querySelector(".summary-statuses").innerHTML = `
    <p>Aprobados: <strong>${passed}</strong></p>
    <p>Desaprobados: <strong>${failed}</strong></p>
  `;

  renderStudentResults(students);
  reportSection.hidden = false;
}

function showValidationError(message, input) {
  formMessage.textContent = message;
  input.setAttribute("aria-invalid", "true");
  input.focus();
}

function validateForm() {
  const name = nameInput.value.trim();
  if (!name) {
    showValidationError("Escribe el nombre del estudiante.", nameInput);
    return null;
  }

  const validNamePattern = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ ]+$/;
  if (!validNamePattern.test(name)) {
    showValidationError("El nombre solo debe contener letras y espacios.", nameInput);
    return null;
  }

  const values = [];
  for (const input of gradeInputs) {
    const valueText = input.value.trim();
    if (valueText === "") {
      showValidationError("Ingresa una nota válida entre 0 y 100 en cada certamen.", input);
      return null;
    }

    const value = Number(valueText);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      showValidationError("Ingresa una nota válida entre 0 y 100 en cada certamen.", input);
      return null;
    }
    values.push(value);
  }

  return { name, values };
}

nameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    setTimeout(() => gradeInputs[0].focus(), 0);
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (registeredCount >= STUDENT_COUNT) {
    return;
  }

  formMessage.textContent = "";

  const student = validateForm();
  if (!student) return;

  studentNames[registeredCount] = student.name;
  grades[registeredCount] = student.values;
  registeredCount += 1;

  form.reset();
  [...form.elements].forEach((element) => element.removeAttribute("aria-invalid"));
  updateProgress();
  renderReport();
  nameInput.focus();
});

form.addEventListener("input", (event) => {
  event.target.removeAttribute("aria-invalid");
  formMessage.textContent = "";
});

updateProgress();
