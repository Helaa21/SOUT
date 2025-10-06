const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 320,
  backgroundColor: '#000000',
  parent: 'game',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 } }
  },
  scene: { preload, create, update }
};

const game = new Phaser.Game(config);

let player, cursors, metas, textoPregunta, botonContinuar, juegoPausado = false, score = 0;
let preguntas = [
  { texto: "S = ¿Qué significa la 'S' en SMART?", correcta: "Específico" },
  { texto: "M = ¿Qué representa la 'M'?", correcta: "Medible" },
  { texto: "A = ¿Qué significa la 'A'?", correcta: "Alcanzable" },
  { texto: "R = ¿Qué significa la 'R'?", correcta: "Relevante" },
  { texto: "T = ¿Qué representa la 'T'?", correcta: "Limitado en el tiempo" }
];
let preguntaActual = 0;

function preload() {
  this.load.image('pacman', 'https://i.ibb.co/RT5QwYz/pacman.png');
  this.load.image('meta', 'https://i.ibb.co/0QxkgHn/goal.png');
}

function create() {
  player = this.physics.add.sprite(240, 160, 'pacman').setScale(0.15);
  metas = this.physics.add.group();
  for (let i = 0; i < 5; i++) {
    metas.create(80 + i * 80, Phaser.Math.Between(50, 270), 'meta').setScale(0.07);
  }

  cursors = this.input.keyboard.createCursorKeys();
  this.physics.add.overlap(player, metas, mostrarPregunta, null, this);
  textoPregunta = this.add.text(20, 140, '', { fontSize: '16px', fill: '#fff', wordWrap: { width: 440 } });
}

function update() {
  if (juegoPausado) return;
  player.setVelocity(0);
  if (cursors.left.isDown) player.setVelocityX(-160);
  else if (cursors.right.isDown) player.setVelocityX(160);
  else if (cursors.up.isDown) player.setVelocityY(-160);
  else if (cursors.down.isDown) player.setVelocityY(160);
}

function mostrarPregunta(player, meta) {
  if (juegoPausado) return;
  meta.disableBody(true, true);
  juegoPausado = true;
  let p = preguntas[preguntaActual];
  textoPregunta.setText(p.texto + "\n\nRespuesta: " + p.correcta);
  botonContinuar = this.add.text(190, 220, "Continuar ▶", { fontSize: '18px', fill: '#ff0', backgroundColor: '#333', padding: 6 })
    .setInteractive()
    .on('pointerdown', () => continuarJuego.call(this));
  preguntaActual++;
  if (preguntaActual >= preguntas.length) preguntaActual = 0;
}

function continuarJuego() {
  textoPregunta.setText('');
  botonContinuar.destroy();
  juegoPausado = false;
}
