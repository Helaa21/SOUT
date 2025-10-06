const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let pacman = { x: 50, y: 50, size: 30, dx: 5, dy: 0 };
let goals = [
  { x: 200, y: 200, question: "¿Qué significa la S en SMART?", options: ["Sencillo", "Simple", "Específico"], correct: "Específico" },
  { x: 400, y: 300, question: "¿Qué representa la M?", options: ["Medible", "Mucho", "Motivador"], correct: "Medible" },
  { x: 600, y: 150, question: "¿Qué significa la T?", options: ["Tiempo", "Trabajo", "Tarea"], correct: "Tiempo" },
];

let currentQuestion = null;
let keys = {};

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

function movePacman() {
  if (keys["ArrowUp"]) { pacman.dy = -5; pacman.dx = 0; }
  if (keys["ArrowDown"]) { pacman.dy = 5; pacman.dx = 0; }
  if (keys["ArrowLeft"]) { pacman.dx = -5; pacman.dy = 0; }
  if (keys["ArrowRight"]) { pacman.dx = 5; pacman.dy = 0; }

  pacman.x += pacman.dx;
  pacman.y += pacman.dy;

  if (pacman.x < 0) pacman.x = 0;
  if (pacman.y < 0) pacman.y = 0;
  if (pacman.x > canvas.width - pacman.size) pacman.x = canvas.width - pacman.size;
  if (pacman.y > canvas.height - pacman.size) pacman.y = canvas.height - pacman.size;
}

function drawPacman() {
  ctx.beginPath();
  ctx.arc(pacman.x, pacman.y, pacman.size, 0.2 * Math.PI, 1.8 * Math.PI);
  ctx.lineTo(pacman.x, pacman.y);
  ctx.fillStyle = "yellow";
  ctx.fill();
}

function drawGoals() {
  ctx.fillStyle = "lightgreen";
  goals.forEach(goal => {
    ctx.beginPath();
    ctx.arc(goal.x, goal.y, 20, 0, Math.PI * 2);
    ctx.fill();
  });
}

function checkCollisions() {
  for (let i = 0; i < goals.length; i++) {
    let g = goals[i];
    let dist = Math.hypot(pacman.x - g.x, pacman.y - g.y);
    if (dist < pacman.size + 20) {
      showQuestion(g);
      goals.splice(i, 1);
      break;
    }
  }
}

function showQuestion(goal) {
  document.getElementById("gameCanvas").classList.add("hidden");
  const box = document.getElementById("questionBox");
  box.classList.remove("hidden");
  document.getElementById("questionText").textContent = goal.question;
  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  goal.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.onclick = () => {
      if (opt === goal.correct) {
        alert("✅ ¡Correcto!");
      } else {
        alert("❌ Intenta de nuevo.");
      }
      box.classList.add("hidden");
      document.getElementById("gameCanvas").classList.remove("hidden");
    };
    optionsDiv.appendChild(btn);
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPacman();
  drawGoals();
  movePacman();
  checkCollisions();
  requestAnimationFrame(draw);
}

draw();

