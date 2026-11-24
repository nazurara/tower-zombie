// Membuat semua gambar lewat kode lalu masuk ke menu
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  // Kalau sudah punya gambar/suara asli, muat di sini. Contoh:
  // preload() { this.load.image('d_tree', 'assets/images/tree.png'); }

  create() {
    Art.build(this);
    const el = document.getElementById('loading');
    if (el) el.remove();
    this.scene.start('Menu');
  }
}
