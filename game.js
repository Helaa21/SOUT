/* Pac-SMART: Phaser 3 simple platform-like maze with pellets that trigger SMART questions.
   No assets needed: graphics drawn with Phaser geometry.
*/

const QUESTIONS_BY_LEVEL = [
  { // Level S
    letter: 'S - Específico',
    questions: [
      { q: "¿Cuál meta es más específica?", opts:["Quiero ser mejor","Leer 1 libro de autoayuda al mes"], a:1 }
    ]
  },
  { // Level M
    letter: 'M - Medible',
    questions: [
      { q: "¿Cuál meta es medible?", opts:["Mejorar mis notas","Subir promedio de 14 a 17"], a:1 }
    ]
  },
  { // Level A
    letter: 'A - Alcanzable',
    questions: [
      { q: "¿Cuál meta es alcanzable?", opts:["Ser presidente el mes que viene","Liderar un grupo de estudio este semestre"], a:1 }
    ]
  },
  { // Level R
    letter: 'R - Relevante',
    questions: [
      { q: "¿Cuál meta es relevante?", opts:["Jugar videojuegos todo el día","Desarrollar habilidades para la universidad"], a:1 }
    ]
  },
  { // Level T
    letter: 'T - Tiempo',
    questions: [
      { q: "¿Cuál meta tiene tiempo definido?", opts:["Hacer más ejercicio","Entrenar 3 veces/sem por 3 meses"], a:1 }
    ]
  }
];

let config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 720,
  height: 480,
  backgroundColor: '#000000',
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: { preload, create, update }
};

const game = new Phaser.Game(config);

function preload() {
  // no external assets - generate audio patterns later
}

function create() {
  const scene = this;
  // state
  scene.levelIndex = 0;
  scene.score = 0;
  scene.lives = 3;
  scene.isQuestionOpen = false;
  scene.collectedThisLevel = 0;
  scene.requiredPellets = 5; // pellets per level before triggering level completion

  // simple maze grid: generate walls as rectangles
  scene.walls = scene.physics.add.staticGroup();
  // create a border
  scene.walls.create(360, 0, null).setDisplaySize(720, 8).refreshBody();
  scene.walls.create(360, 480, null).setDisplaySize(720, 8).refreshBody();
  scene.walls.create(0, 240, null).setDisplaySize(8, 480).refreshBody();
  scene.walls.create(720, 240, null).setDisplaySize(8, 480).refreshBody();

  // add some internal walls (simple)
  const wallRects = [
    {x:360,y:120,w:520,h:10},{x:360,y:360,w:520,h:10},
    {x:180,y:240,w:10,h:240},{x:540,y:240,w:10,h:240}
  ];
  wallRects.forEach(w => {
    const r = scene.add.rectangle(w.x,w.y,w.w,w.h,0x222222).setOrigin(0.5);
    scene.walls.add(r);
    r.refreshBody && r.refreshBody();
  });

  // pellets (regular dots)
  scene.pellets = scene.physics.add.group();
  for (let i=1;i<=9;i++){
    for (let j=1;j<=5;j++){
      const x = 60 + i*60;
      const y = 40 + j*70;
      // avoid wall center area
      if ((x>250 && x<470) && (y>150 && y<330)) continue;
      const p = scene.add.circle(x,y,6,0xFFFFFF);
      scene.physics.add.existing(p, false);
      p.body.setImmovable(true);
      p.isSpecial = false;
      scene.pellets.add(p);
    }
  }

  // special pellets (trigger question)
  scene.specials = scene.physics.add.group();
  const specialPositions = [
    {x:120,y:80},{x:600,y:80},{x:120,y:400},{x:600,y:400},{x:360,y:240}
  ];
  specialPositions.forEach((pos,i) => {
    const s = scene.add.circle(pos.x,pos.y,10,0xffd166);
    scene.physics.add.existing(s,false);
    s.isSpecial = true;
    s.levelFor = i; // which level triggers this (0..4)
    scene.specials.add(s);
  });

  // Pac-Man: yellow circle
  scene.pac = scene.add.circle(60,60,14,0xffd166);
  scene.physics.add.existing(scene.pac);
  scene.pac.body.setCollideWorldBounds(true);
  scene.pac.body.setBounce(0.2);

  // ghosts: simple moving rectangles
  scene.ghosts = scene.physics.add.group();
  const ghostColors = [0xff6b6b,0x845ef7,0x4cc9f0];
  const ghostStart = [{x:360,y:60},{x:360,y:420},{x:60,y:240}];
  ghostStart.forEach((g,i) => {
    const gSprite = scene.add.rectangle(g.x,g.y,20,20,ghostColors[i%ghostColors.length]);
    scene.physics.add.existing(gSprite);
    gSprite.speed = 60 + i*10;
    gSprite.dir = new Phaser.Math.Vector2(Phaser.Math.Between(-1,1),Phaser.Math.Between(-1,1)).normalize();
    scene.ghosts.add(gSprite);
  });

  // collide with walls
  scene.physics.add.collider(scene.pac, scene.walls);
  scene.physics.add.collider(scene.ghosts, scene.walls, (g) => {
    // bounce: pick random new direction
    g.body.setVelocity(Phaser.Math.Between(-80,80),Phaser.Math.Between(-80,80));
  });

  // overlap pellets
  scene.physics.add.overlap(scene.pac, scene.pellets, (pacl, pellet) => {
    pellet.destroy();
    scene.score += 1;
    // waka sound
    playWaka();
  });

  // overlap specials -> open question modal
  scene.physics.add.overlap(scene.pac, scene.specials, (pacl, special) => {
    if (scene.isQuestionOpen) return;
    // check if special already eaten
    if (!special.active) return;
    // only open if special.levelFor equals current level
    if (special.levelFor === scene.levelIndex) {
      special.destroy();
      scene.isQuestionOpen = true;
      openQuestionModal(scene, scene.levelIndex); // show modal and pause
    }
  });

  // overlap ghosts
  scene.physics.add.overlap(scene.pac, scene.ghosts, (p, g) => {
    // lose life and reset pac position
    scene.lives--;
    flashEffect(scene);
    resetPac(scene);
    if (scene.lives <= 0) {
      gameOver(scene);
    } else {
      playFailureTone();
    }
  });

  // controls
  scene.cursors = scene.input.keyboard.createCursorKeys();

  // HUD
  const hud = scene.add.dom(0,0).createFromHTML(`<div class="scoreboard">Nivel: <span id="levelnum">1</span> &nbsp; Puntos: <span id="scoreval">${scene.score}</span> &nbsp; Vidas: <span id="lives">${scene.lives}</span>
  <div class="hint">Usa flechas para mover. Come las pelotas blancas y las amarillas para responder preguntas SMART.</div></div>`);
  hud.setOrigin(0,0);
  // store HUD elements for update
  scene.hud = { levelnum: hud.node.querySelector('#levelnum'), scoreval: hud.node.querySelector('#scoreval'), lives: hud.node.querySelector('#lives') };

  // start background minimal loop for ghosts
  scene.time.addEvent({ delay: 1200, callback: () => moveGhosts(scene), loop: true });

  // Prepare modal DOM handlers (modal in index.html)
  setupModal();
}

function update() {
  const s = this;
  if (!s.cursors) return;
  let vx = 0, vy = 0;
  if (s.cursors.left.isDown) vx = -140;
  else if (s.cursors.right.isDown) vx = 140;
  if (s.cursors.up.isDown) vy = -140;
  else if (s.cursors.down.isDown) vy = 140;
  s.pac.body.setVelocity(vx, vy);
  // update HUD
  s.hud.scoreval.textContent = s.score;
  s.hud.lives.textContent = s.lives;
  s.hud.levelnum.textContent = s.levelIndex + 1;
}

// helper: move ghosts with slight randomness toward pac-man
function moveGhosts(scene) {
  scene.ghosts.getChildren().forEach(g => {
    if (!g.body) return;
    // vector toward pac
    const dx = scene.pac.x - g.x;
    const dy = scene.pac.y - g.y;
    const vec = new Phaser.Math.Vector2(dx,dy).normalize().scale(g.speed);
    // add small random jitter
    vec.x += Phaser.Math.Between(-40,40);
    vec.y += Phaser.Math.Between(-40,40);
    g.body.setVelocity(vec.x, vec.y);
  });
}

function resetPac(scene) {
  scene.pac.x = 60; scene.pac.y = 60;
  scene.pac.body.setVelocity(0,0);
}

function flashEffect(scene) {
  const cam = scene.cameras.main;
  cam.flash(300,255,100,100);
}

// Game over
function gameOver(scene) {
  // stop movement
  scene.scene.pause();
  // show overlay
  scene.add.text(360,240, `GAME OVER\nPuntos: ${scene.score}`, { fontSize:'32px', color:'#ffd166', align:'center' }).setOrigin(0.5);
}

// Modal & questions UI handling (uses DOM modal in index.html)
function setupModal(){
  const modal = document.getElementById('question-modal');
  const titleEl = document.getElementById('modal-title');
  const qEl = document.getElementById('modal-question');
  const optsEl = document.getElementById('modal-options');
  const feedEl = document.getElementById('modal-feedback');
  const closeBtn = document.getElementById('modal-close');

  closeBtn.onclick = () => {
    modal.classList.add('hidden');
    // resume game scene
    const sc = game.scene.scenes[0];
    sc.isQuestionOpen = false;
    // if level finished (collected all specials for that level), advance
    checkLevelProgress(sc);
  };

  // store refs
  window.__pacsmart_modal = { modal, titleEl, qEl, optsEl, feedEl, closeBtn };
}

function openQuestionModal(scene, levelIdx){
  const modal = window.__pacsmart_modal;
  if (!modal) return;
  const level = QUESTIONS_BY_LEVEL[levelIdx];
  const Q = level.questions[Phaser.Math.Between(0, level.questions.length-1)];
  modal.titleEl.textContent = `Nivel ${levelIdx+1} — ${level.letter}`;
  modal.qEl.textContent = Q.q;
  modal.optsEl.innerHTML = '';
  modal.feedEl.textContent = '';
  Q.opts.forEach((opt, i) => {
    const b = document.createElement('button');
    b.className = 'option-btn';
    b.textContent = opt;
    b.onclick = () => {
      // disable buttons
      Array.from(modal.optsEl.children).forEach(x=> x.disabled=true);
      if (i === Q.a) {
        modal.feedEl.textContent = '✅ ¡Correcto! Has ganado una gema SMART.';
        scene.score += 5;
        playSuccessTone();
        // mark progress
        scene.collectedThisLevel++;
      } else {
        modal.feedEl.textContent = `❌ Incorrecto. Respuesta: ${Q.opts[Q.a]}`;
        playFailureTone();
      }
      // show continue button
      modal.closeBtn.textContent = 'Continuar';
    };
    modal.optsEl.appendChild(b);
  });

  modal.modal.classList.remove('hidden');
  // pause physics updates while modal open
  scene.isQuestionOpen = true;
}

function checkLevelProgress(scene){
  // If collected special for this level (we used special pellet per lev

