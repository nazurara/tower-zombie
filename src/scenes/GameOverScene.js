class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  create(data) {
    data = data || {};
    const W = GAME.WIDTH, H = GAME.HEIGHT, win = !!data.win;
    const b = BIOMES[data.chapter || 0];
    this.add.tileSprite(0, 0, W, H, b.ground).setOrigin(0);
    this.add.rectangle(0, 0, W, H, win ? 0x0b3d2e : 0x2b0a10, 0.78).setOrigin(0);

    if (win) {
      this.add.particles(0, 0, 'p_square', {
        emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(0, -10, W, 5) }, speedY: { min: 80, max: 180 }, speedX: { min: -40, max: 40 },
        lifespan: 5000, frequency: 30, rotate: { min: 0, max: 360 }, scale: { min: 0.8, max: 1.6 },
        tint: [0xffd166, 0xef476f, 0x06d6a0, 0x118ab2, 0xffffff]
      });
      this.add.image(W / 2, 470, 'h_' + b.key).setScale(1.3).setOrigin(0.5, 0.8);
    } else {
      ['z_walker', 'z_brute', 'z_runner'].forEach((k, i) => {
        const z = this.add.image(W / 2 - 120 + i * 120, 480, k + '_0').setScale(2.2).setOrigin(0.5, 0.82);
        this.tweens.add({ targets: z, angle: { from: -8, to: 8 }, duration: 350 + i * 60, yoyo: true, repeat: -1 });
      });
    }

    const title = txt(this, W / 2, 110, win ? 'KAMU MENANG!' : 'RUMAH HANCUR!', 72, win ? '#ffd166' : '#ff4d6d', { fontFamily: FONT_HEAD, strokeThickness: 12 }).setOrigin(0.5);
    this.tweens.add({ targets: title, scale: { from: 0.3, to: 1 }, duration: 600, ease: 'Back.out' });
    txt(this, W / 2, 172, win ? 'Keempat lokasi berhasil dipertahankan. Kamu pahlawan desa!' : 'Zombie menembus pertahananmu di wave ' + data.wave + ' (' + b.name + ')', 20, '#ffffff').setOrigin(0.5);

    panel(this, W / 2 - 230, 210, 460, 160, 0x10112a, 0.85, 1, 0xffd166);
    const rows = [['Skor', data.score || 0], ['Zombie dikalahkan', data.kills || 0], ['Wave tercapai', (data.wave || 1) + ' / ' + totalWaves()], ['Skor tertinggi', data.best || 0]];
    rows.forEach((r, i) => {
      txt(this, W / 2 - 200, 232 + i * 32, r[0], 19, '#bde0fe', { strokeThickness: 0 }).setDepth(2);
      const v = txt(this, W / 2 + 200, 232 + i * 32, String(r[1]), 21, '#ffffff', { fontFamily: FONT_HEAD }).setOrigin(1, 0).setDepth(2);
      if (i === 0) this.countUp(v, r[1]);
    });
    if (data.isBest) {
      const nb = txt(this, W / 2 + 240, 214, 'REKOR BARU!', 18, '#ffd166', { fontFamily: FONT_HEAD }).setOrigin(0.5).setAngle(12).setDepth(3);
      this.tweens.add({ targets: nb, scale: { from: 0.9, to: 1.15 }, duration: 500, yoyo: true, repeat: -1 });
    }

    new Button(this, W / 2 - 110, 560, 200, 56, 'MAIN LAGI', { color: 0xffb703, size: 26, depth: 10, onClick: () => this.scene.start('Game', {}) });
    new Button(this, W / 2 + 110, 560, 200, 56, 'MENU', { color: 0x4cc9f0, size: 26, depth: 10, onClick: () => this.scene.start('Menu') });
    this.cameras.main.fadeIn(500);
  }

  countUp(t, to) {
    const o = { v: 0 };
    this.tweens.add({ targets: o, v: to, duration: 1200, ease: 'Cubic.out', onUpdate: () => t.setText(String(Math.round(o.v))) });
  }
}
