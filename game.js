const quiz = [
  {
    question: "S - Específico: ¿Cuál meta está mejor definida?",
    options: [
      "Quiero ser mejor persona.",
      "Quiero leer un libro de autoayuda cada mes."
    ],
    answer: 1
  },
  {
    question: "M - Medible: ¿Cuál meta puedes medir?",
    options: [
      "Quiero mejorar mis notas.",
      "Quiero subir mi promedio de 14 a 17."
    ],
    answer: 1
  },
  {
    question: "A - Alcanzable: ¿Cuál meta parece más realista?",
    options: [
      "Quiero ser presidente el próximo mes.",
      "Quiero liderar un grupo de estudio este semestre."
    ],
    answer: 1
  },
  {
    question: "R - Relevante: ¿Cuál meta tiene sentido con tus valores?",
    options: [
      "Quiero jugar videojuegos todo el día.",
      "Quiero desarrollar habilidades para ingresar a la universidad."
    ],
    answer: 1
  },
  {
    question: "T - Tiempo: ¿Cuál meta tiene un plazo definido?",
    options: [
      "Quiero hacer más ejercicio.",
      "Quiero entrenar 3 veces por semana durante 3 meses."
    ],
    answer: 1
  }
];

let current = 0;
let score = 0;

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const resultEl = document.getElementById("result");
const nextBtn = document.getElementById("next-btn");

function loadQuestion() {
  resultEl.textContent = "";
  nextBtn.style.display = "none";
  const q = quiz[current];
  questionEl.textContent = q.question;
  optionsEl.innerHTML = "";
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.classList.add("option");
    btn.onclick = () => checkAnswer(i);
    optionsEl.appendChild(btn);
  });
}

function checkAnswer(selected) {
  const q = quiz[current];
  const buttons = document.querySelectorAll(".option");
  buttons.forEach(btn => btn.disabled = true);

  if (selected === q.answer) {
    resultEl.textContent = "✅ ¡Correcto!";
    score++;
  } else {
    resultEl.textContent = "❌ Incorrecto. La respuesta correcta era: " + q.options[q.answer];
  }
  nextBtn.style.display = "inline-block";
}

nextBtn.addEventListener("click", () => {
  current++;
  if (current < quiz.length) {
    loadQuestion();
  } else {
    showFinal();
  }
});

function showFinal() {
  questionEl.textContent = "🎉 ¡Has completado la Misión SMART! 🎉";
  optionsEl.innerHTML = "";
  resultEl.innerHTML = `Tu puntuación: <b>${score}/${quiz.length}</b><br>
  <br>Has aprendido a definir metas <b>Específicas, Medibles, Alcanzables, Relevantes y con Tiempo</b>. 💪`;
  nextBtn.style.display = "none";
}

loadQuestion();
