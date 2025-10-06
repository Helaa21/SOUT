// --- 1. Configuración Inicial y Canvas ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const messageDisplay = document.getElementById('game-message');
const quizOverlay = document.getElementById('quiz-overlay');
const quizQuestion = document.getElementById('quiz-question');
const quizOptions = document.getElementById('quiz-options');

const TILE_SIZE = 40;
const MAP_WIDTH = canvas.width / TILE_SIZE;
const MAP_HEIGHT = canvas.height / TILE_SIZE;

let score = 0;
let lives = 3;
let gameRunning = true;
let currentQuestion = null;

// --- 2. Elementos del Juego (Pac-Man, Fantasmas) ---

const pacman = {
    x: 9, y: 7, // Posición en cuadrícula
    radius: TILE_SIZE / 2 - 5,
    color: 'yellow',
    dx: 0, dy: 0, // Dirección actual
    nextDx: 0, nextDy: 0 // Dirección deseada
};

// Simplified Fantasmas
const ghosts = [
    { x: 1, y: 1, color: 'red', vulnerable: false },
    { x: 13, y: 8, color: 'pink', vulnerable: false }
];

// --- 3. Contenido SMART (Preguntas) ---

const SMART_QUESTIONS = [
    {
        question: "¿Qué componente SMART te obliga a definir un resultado numérico o cuantificable?",
        options: ["Específico (S)", "Medible (M)", "Alcanzable (A)", "Relevante (R)"],
        answer: "Medible (M)"
    },
    {
        question: "Un objetivo 'Quiero aprender Python para fin de mes' cumple principalmente con la letra:",
        options: ["S (Específico)", "M (Medible)", "T (Tiempo)", "R (Relevante)"],
        answer: "T (Tiempo)"
    },
    {
        question: "¿Qué significa que un objetivo sea 'Relevante' (R)?",
        options: ["Que es fácil de lograr", "Que impacta en tu meta a largo plazo", "Que puedes medirlo en el tiempo", "Que lo describes con detalle"],
        answer: "Que impacta en tu meta a largo plazo"
    }
];

let questionsPool = [...SMART_QUESTIONS];

// --- 4. Mapa (Laberinto y Puntos) ---

// 0: Camino, 1: Muro, 2: Píldora (Acción A), 3: Power Pellet (Pregunta SMART)
const map = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 3, 2, 2, 1, 2, 2, 2, 2, 2, 1, 2, 2, 3, 1],
    [1, 2, 1, 2, 1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 1],
    [1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1, 2, 1, 2, 1],
    [1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 2, 1], // Pacman start (0)
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

// --- 5. Funciones de Dibujo ---

function drawMap() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = map[y][x];
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;

            if (tile === 1) { // Muro
                ctx.fillStyle = 'blue';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            } else if (tile === 2) { // Píldora (Acción Alcanzable)
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 4, 0, Math.PI * 2);
                ctx.fill();
            } else if (tile === 3) { // Power Pellet (Pregunta SMART)
                ctx.fillStyle = 'yellow';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

function drawPacman() {
    ctx.fillStyle = pacman.color;
    ctx.beginPath();
    ctx.arc(
        pacman.x * TILE_SIZE + TILE_SIZE / 2,
        pacman.y * TILE_SIZE + TILE_SIZE / 2,
        pacman.radius,
        0.2 * Math.PI,
        1.8 * Math.PI // Simulación boca abierta
    );
    ctx.lineTo(
        pacman.x * TILE_SIZE + TILE_SIZE / 2,
        pacman.y * TILE_SIZE + TILE_SIZE / 2
    );
    ctx.fill();
}

function drawGhosts() {
    ghosts.forEach(ghost => {
        ctx.fillStyle = ghost.vulnerable ? 'deepskyblue' : ghost.color;
        ctx.beginPath();
        ctx.arc(
            ghost.x * TILE_SIZE + TILE_SIZE / 2,
            ghost.y * TILE_SIZE + TILE_SIZE / 2,
            ghost.radius,
            0, Math.PI * 2
        );
        ctx.fill();
        // Puedes dibujar una forma más elaborada para el fantasma
    });
}

function updateDisplay() {
    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives;
}

// --- 6. Lógica de Movimiento y Colisión ---

function canMove(x, y) {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
        return false;
    }
    // No puedes moverte a un muro (1)
    return map[y][x] !== 1;
}

function movePacman() {
    if (canMove(pacman.x + pacman.dx, pacman.y + pacman.dy)) {
        pacman.x += pacman.dx;
        pacman.y += pacman.dy;
    } 
    // Intenta cambiar de dirección si la deseada es posible
    if (canMove(pacman.x + pacman.nextDx, pacman.y + pacman.nextDy)) {
        pacman.dx = pacman.nextDx;
        pacman.dy = pacman.nextDy;
    }
}

function moveGhosts() {
    // Lógica muy simple: movimiento aleatorio
    ghosts.forEach(ghost => {
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        const validDirections = directions.filter(([dx, dy]) => canMove(ghost.x + dx, ghost.y + dy));
        
        if (validDirections.length > 0) {
            const [dx, dy] = validDirections[Math.floor(Math.random() * validDirections.length)];
            ghost.x += dx;
            ghost.y += dy;
        }
    });
}

function checkCollisions() {
    const tile = map[pacman.y][pacman.x];

    // Colisión con Píldora (2) - Acción Alcanzable
    if (tile === 2) {
        map[pacman.y][pacman.x] = 0; // Quitar píldora
        score += 10;
        messageDisplay.textContent = "¡Acción Alcanzable completada! +10 Pts.";
    }

    // Colisión con Power Pellet (3) - Pregunta SMART
    if (tile === 3) {
        map[pacman.y][pacman.x] = 0; // Quitar Power Pellet
        if (questionsPool.length > 0) {
            startQuiz(questionsPool.pop());
        }
    }
    
    // Colisión con Fantasmas (Obstáculos/Errores)
    ghosts.forEach(ghost => {
        if (pacman.x === ghost.x && pacman.y === ghost.y) {
            if (ghost.vulnerable) {
                score += 100;
                messageDisplay.textContent = "¡Superaste el obstáculo! +100 Pts.";
                // Respawnear fantasma
                ghost.x = 7; ghost.y = 4;
                ghost.vulnerable = false;
            } else {
                lives--;
                messageDisplay.textContent = "¡Cuidado! Obstáculo no superado. -1 Vida.";
                if (lives <= 0) {
                    gameOver();
                } else {
                    // Reiniciar posición Pac-Man
                    pacman.x = 7; pacman.y = 7;
                }
            }
        }
    });
    
    updateDisplay();
}

// --- 7. Lógica del Quiz SMART ---

function startQuiz(questionObj) {
    gameRunning = false;
    currentQuestion = questionObj;

    quizQuestion.textContent = questionObj.question;
    quizOptions.innerHTML = '';
    
    questionObj.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = `${index + 1}. ${option}`;
        button.onclick = () => submitAnswer(option);
        quizOptions.appendChild(button);
    });
    
    quizOverlay.classList.remove('hidden');
}

window.submitAnswer = (selectedOption) => {
    quizOverlay.classList.add('hidden');
    gameRunning = true;
    
    if (selectedOption === currentQuestion.answer) {
        score += 200;
        messageDisplay.textContent = `✅ ¡Respuesta Correcta! Refuerzo SMART de ${currentQuestion.answer}. +200 Pts.`;
        // Recompensa: hacer a los fantasmas vulnerables
        ghosts.forEach(g => g.vulnerable = true);
        setTimeout(() => ghosts.forEach(g => g.vulnerable = false), 5000); // 5 segundos de vulnerabilidad
    } else {
        score = Math.max(0, score - 50);
        messageDisplay.textContent = `❌ Respuesta Incorrecta. Repasa el concepto. -50 Pts.`;
    }
    
    currentQuestion = null;
    updateDisplay();
}

// --- 8. Controles y Bucle Principal ---

document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;

    // Establece la dirección deseada (nextDx/nextDy)
    if (e.key === 'ArrowUp') {
        pacman.nextDx = 0; pacman.nextDy = -1;
    } else if (e.key === 'ArrowDown') {
        pacman.nextDx = 0; pacman.nextDy = 1;
    } else if (e.key === 'ArrowLeft') {
        pacman.nextDx = -1; pacman.nextDy = 0;
    } else if (e.key === 'ArrowRight') {
        pacman.nextDx = 1; pacman.nextDy = 0;
    }
});

function gameLoop() {
    if (!gameRunning) return;

    // Limpiar pantalla
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Actualizar lógica
    movePacman();
    moveGhosts();
    checkCollisions();

    // Dibujar
    drawMap();
    drawPacman();
    drawGhosts();
    
    // Comprobar victoria
    if (map.flat().every(tile => tile === 0 || tile === 1)) {
        gameWin();
    }

    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;
    messageDisplay.textContent = `¡FIN DEL JUEGO! Puntuación final: ${score}`;
}

function gameWin() {
    gameRunning = false;
    messageDisplay.textContent = `¡OBJETIVO SMART LOGRADO con ${score} Puntos! ¡Felicitaciones!`;
    messageDisplay.style.color = 'lime';
}

// Iniciar el juego
updateDisplay();
gameLoop();

