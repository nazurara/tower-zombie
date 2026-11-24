// Tunggu font selesai dimuat (maks 2,5 detik) supaya teks tidak berubah-ubah, lalu mulai game
function startGame() {
  if (window.__tzGame) return;
  window.__tzGame = new Phaser.Game({
    type: Phaser.AUTO,
    width: GAME.WIDTH,
    height: GAME.HEIGHT,
    parent: 'game',
    backgroundColor: '#10112a',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, MenuScene, GameScene, GameOverScene]
  });
}

if (document.fonts && document.fonts.load) {
  Promise.race([
    Promise.all([document.fonts.load('20px "Lilita One"'), document.fonts.load('20px "Fredoka"')]),
    new Promise((r) => setTimeout(r, 2500))
  ]).then(startGame, startGame);
} else {
  startGame();
}
