class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const W = GAME.WIDTH, H = GAME.HEIGHT;
    Snd.init(this);
    Music.start('menu');

    // latar: empat bioma bersambung
    BIOMES.forEach((b, i) => this.add.tileSprite(i * W / 4, 0, W / 4 + 1, H, b.ground).setOrigin(0));
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.18); g.fillRect(0, 448, W, 66);
    g.fillStyle(0x5d3a1a, 1); g.fillRect(0, 452, W, 56);
    g.fillStyle(0xa47148, 1); g.fillRect(0, 457, W, 46);
    g.fillStyle(0xc8975f, 0.5); g.fillRect(0, 470, W, 20);
    this.add.image(0, 0, 'p_glow').setOrigin(0).setDisplaySize(W, H).setTint(0x000000).setAlpha(0.25);

    // dekorasi tiap bioma
    const deco = [['d_tree', 60, 380], ['d_bush', 180, 400], ['d_palm', 320, 390], ['d_umbrella', 440, 410], ['d_pine', 580, 385], ['d_snowman', 690, 405], ['d_deadtree', 840, 385], ['d_crystal', 960, 410],
      ['d_tree', 210, 590], ['d_palm', 470, 600], ['d_pine', 700, 595], ['d_basalt', 900, 590], ['d_flower', 120, 560], ['d_shell', 380, 560], ['d_icerock', 620, 570], ['d_skull', 820, 560]];
    deco.forEach((d) => this.add.image(d[1], d[2], d[0]).setOrigin(0.5, 0.85).setDepth(d[2] * 0.01));
    this.add.image(W - 70, 476, 'h_grass').setOrigin(0.5, 0.8).setDepth(5);

    // parade zombie berjalan di jalan
    this.parade = [];
    const types = ['walker', 'runner', 'sailor', 'surfer', 'frosty', 'skier', 'yeti', 'magma', 'knight', 'bloater', 'hound', 'brute'];
    types.forEach((t, i) => {
      const cfg = ZOMBIES[t];
      const z = this.add.image(-60 - i * 90, 488, cfg.tex + '_0').setScale(cfg.scale * 1.1).setOrigin(0.5, 0.82).setDepth(6);
      z.cfg = cfg; z.anim = Math.random() * 300;
      this.parade.push(z);
    });
    // dua menara penjaga
    [['gun', 230, 420], ['frost', 620, 420], ['cannon', 420, 548], ['tesla', 820, 548]].forEach((t) => {
      this.add.image(t[1], t[2], 'tb_' + t[0] + '_3').setDepth(7);
      const top = this.add.image(t[1], t[2] - 4, 'tt_' + t[0] + '_3').setDepth(7.1);
      this.tweens.add({ targets: top, angle: { from: 60, to: 140 }, duration: 1400 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    });
    this.add.particles(0, 0, 'p_flake', { emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(512, -10, 256, 5) }, speedY: { min: 30, max: 60 }, lifespan: 9000, frequency: 120, scale: { min: 0.4, max: 0.9 } }).setDepth(8);
    this.add.particles(0, 0, 'p_soft', { emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(768, H, 256, 5) }, speedY: { min: -50, max: -25 }, lifespan: 9000, frequency: 150, scale: { min: 0.08, max: 0.2 }, tint: [0xff9100, 0xffea00], blendMode: 'ADD' }).setDepth(8);

    // judul
    const plate = panel(this, W / 2 - 330, 46, 660, 210, 0x1b1f45, 0.88, 20, 0xffd166);
    const title = txt(this, W / 2, 118, 'TOWER ZOMBIE', 84, '#ffd166', { fontFamily: FONT_HEAD, stroke: '#3a0d0d', strokeThickness: 12 }).setOrigin(0.5).setDepth(21);
    title.setShadow(0, 6, '#000000', 0, true, true);
    this.tweens.add({ targets: title, scale: { from: 0.97, to: 1.03 }, angle: { from: -1.5, to: 1.5 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    txt(this, W / 2, 182, '', 20, '#80ed99', { fontFamily: FONT_HEAD, letterSpacing: 6 }).setOrigin(0.5).setDepth(21);
    txt(this, W / 2, 218, 'Desa · Pantai · Salju · Gunung Api — 16 wave, 6 menara, 4 bos', 17, '#e0e1ff').setOrigin(0.5).setDepth(21);

    new Button(this, W / 2 - 110, 318, 200, 58, '▶  MAIN', { color: 0xffb703, size: 30, depth: 30, onClick: () => this.startGame() });
    new Button(this, W / 2 + 110, 318, 200, 58, 'CARA MAIN', { color: 0x4cc9f0, size: 24, depth: 30, onClick: () => this.toggleHelp() });
    const best = Store.get('best', 0);
    txt(this, W / 2, 372, best ? '🏆 Skor tertinggi: ' + best : 'Belum ada skor. Ayo main!', 17, '#ffffff').setOrigin(0.5).setDepth(30);

    const mute = new Button(this, W - 44, 30, 56, 34, Snd.muted ? '🔇' : '🔊', { color: 0xadb5bd, size: 18, font: FONT_BODY, depth: 30, onClick: () => mute.setLabel(Snd.toggleMute() ? '🔇' : '🔊') });
    txt(this, 14, H - 22, '', 12, '#ffffff', { strokeThickness: 3 }).setDepth(30);

    this.input.keyboard && this.input.keyboard.once('keydown-ENTER', () => this.startGame());
    this.cameras.main.fadeIn(400);
  }

  startGame() {
    if (this.starting) return;
    this.starting = true;
    Snd.init(this);
    Snd.play('wave');
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Game', {}));
  }

  toggleHelp() {
    if (this.help) { this.help.forEach((o) => o.destroy()); this.help = null; return; }
    const W = GAME.WIDTH, H = GAME.HEIGHT, O = this.help = [];
    O.push(this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0).setDepth(50).setInteractive());
    O.push(panel(this, W / 2 - 380, 60, 760, 520, 0x1b1f45, 0.97, 50, 0x4cc9f0));
    O.push(txt(this, W / 2, 100, 'CARA MAIN', 34, '#4cc9f0', { fontFamily: FONT_HEAD }).setOrigin(0.5).setDepth(51));
    const lines = [
      '🏠  Zombie berjalan di jalur menuju rumahmu. Jangan biarkan nyawa rumah habis!',
      '🗼  Pilih menara di panel kanan lalu klik area kosong di peta.',
      '⬆️  Klik menara untuk UPGRADE (sampai Lv3, Lv4 ULTIMATE mulai Bab 2),',
      '      ganti TARGET, PINDAH (gratis saat jeda) atau JUAL (uang kembali 70%).',
      '✨  Setiap wave selesai pilih 1 skill untuk memperkuat pertahanan.',
      '🗺️  Setiap 4 wave kamu pindah ke lokasi baru dengan zombie berbeda.',
      '      Menaramu ikut dibawa dan dipasang otomatis.',
      '🆕  Menara baru terbuka: Penembak Jitu (Bab 2), Api (Bab 3), Tesla (Bab 4).',
      '⚔️  Kenali musuh: zombie api kebal api, ksatria berbaju baja,',
      '      yeti memulihkan HP, si kembung pecah jadi 3.',
      '',
      'Tombol cepat:  1-6 menara · U upgrade · G pindah · X jual · T target',
      'N mulai wave · F kecepatan · Spasi jeda · M suara · Esc batal'
    ];
    O.push(txt(this, W / 2 - 340, 140, lines.join('\n'), 17, '#ffffff', { strokeThickness: 0, lineSpacing: 7 }).setDepth(51));
    O.push(new Button(this, W / 2, 540, 180, 46, 'OKE!', { color: 0xffb703, size: 22, depth: 52, onClick: () => this.toggleHelp() }));
  }

  update(time, delta) {
    Music.update();
    for (const z of this.parade) {
      z.x += z.cfg.speed * 0.9 * delta / 1000;
      z.anim += delta * z.cfg.speed / 45;
      z.setTexture(z.cfg.tex + '_' + (Math.floor(z.anim / 190) % 2));
      z.angle = Math.sin(z.anim * 0.016) * 6;
      if (z.x > GAME.WIDTH - 120) { z.x = -60 - Math.random() * 300; }
    }
  }
}
