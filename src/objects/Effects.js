// Kumpulan efek visual: ledakan, percikan, petir, teks melayang, dll.
class Effects {
  constructor(scene) {
    this.s = scene;
    const P = (tex, cfg, depth) => {
      const e = scene.add.particles(0, 0, tex, Object.assign({ emitting: false }, cfg));
      e.setDepth(depth || 45);
      return e;
    };
    this.spark = P('p_spark', { speed: { min: 60, max: 200 }, lifespan: 300, scale: { start: 0.9, end: 0 }, blendMode: 'ADD' });
    this.gore = P('p_square', { speed: { min: 40, max: 160 }, lifespan: 450, scale: { start: 1, end: 0.3 }, gravityY: 300, rotate: { min: 0, max: 360 } });
    this.fire = P('p_soft', { lifespan: { min: 280, max: 420 }, scale: { start: 0.35, end: 1.3 }, alpha: { start: 0.9, end: 0 }, blendMode: 'ADD', tint: [0xffea00, 0xff9100, 0xff3d00] });
    this.boom = P('p_soft', { speed: { min: 30, max: 220 }, lifespan: { min: 250, max: 500 }, scale: { start: 1.2, end: 0 }, alpha: { start: 1, end: 0 }, blendMode: 'ADD', tint: [0xffea00, 0xff9100, 0xff3d00, 0xffffff] });
    this.smokeE = P('p_soft', { speed: { min: 10, max: 50 }, lifespan: { min: 500, max: 900 }, scale: { start: 0.6, end: 1.8 }, alpha: { start: 0.45, end: 0 }, tint: 0x555555 }, 44);
    this.ice = P('p_flake', { speed: { min: 30, max: 130 }, lifespan: 500, scale: { start: 1.2, end: 0 }, rotate: { min: 0, max: 360 }, tint: 0xb2ebf2 });
    this.trailE = P('p_soft', { lifespan: 220, scale: { start: 0.35, end: 0 }, alpha: { start: 0.7, end: 0 }, blendMode: 'ADD' }, 39);
    this.coinE = P('i_coin', { speed: { min: 60, max: 140 }, angle: { min: 230, max: 310 }, gravityY: 400, lifespan: 500, scale: { start: 0.6, end: 0.3 }, alpha: { start: 1, end: 0 } }, 46);
  }

  flash(x, y, color, scale) {
    const g = this.s.add.image(x, y, 'p_glow').setDepth(46).setBlendMode('ADD').setTint(color).setScale(0.35 * (scale || 1));
    this.s.tweens.add({ targets: g, alpha: 0, scale: g.scale * 1.4, duration: 110, onComplete: () => g.destroy() });
  }

  hit(x, y, color) {
    this.spark.setParticleTint(color || 0xffe08a);
    this.spark.explode(4, x, y);
  }

  trail(x, y, color) {
    this.trailE.setParticleTint(color);
    this.trailE.emitParticleAt(x, y, 1);
  }

  smoke(x, y, n) { this.smokeE.explode(n || 4, x, y); }

  explosion(x, y, r) {
    const s = this.s;
    this.boom.explode(Math.round(10 + r / 6), x, y);
    this.smokeE.explode(5, x, y);
    const ring = s.add.circle(x, y, r, 0xffb703, 0.25).setStrokeStyle(3, 0xffea00, 0.9).setDepth(44).setScale(0.2);
    s.tweens.add({ targets: ring, scale: 1, alpha: 0, duration: 280, ease: 'Cubic.out', onComplete: () => ring.destroy() });
    const scorch = s.add.image(x, y, 'p_soft').setTint(0x000000).setAlpha(0.35).setScale(r / 18, r / 30).setDepth(-3);
    s.tweens.add({ targets: scorch, alpha: 0, duration: 4000, onComplete: () => scorch.destroy() });
  }

  frostBurst(x, y, r) {
    this.ice.explode(8, x, y);
    const ring = this.s.add.circle(x, y, r, 0x80deea, 0.2).setStrokeStyle(2, 0xe0f7fa, 0.9).setDepth(44).setScale(0.3);
    this.s.tweens.add({ targets: ring, scale: 1, alpha: 0, duration: 260, onComplete: () => ring.destroy() });
  }

  flame(tower, r, half) {
    this.fire.setEmitterAngle({ min: Phaser.Math.RadToDeg(tower.angle - half * 0.8), max: Phaser.Math.RadToDeg(tower.angle + half * 0.8) });
    this.fire.setParticleSpeed(r * 2.2, r * 2.8);
    const m = tower.muzzle(22);
    this.fire.emitParticleAt(m.x, m.y, tower.level === 4 ? 5 : 3);
  }

  tracer(x1, y1, x2, y2, color) {
    const g = this.s.add.graphics().setDepth(45).setBlendMode('ADD');
    g.lineStyle(4, color, 0.35); g.lineBetween(x1, y1, x2, y2);
    g.lineStyle(1.5, 0xffffff, 1); g.lineBetween(x1, y1, x2, y2);
    this.s.tweens.add({ targets: g, alpha: 0, duration: 180, onComplete: () => g.destroy() });
    this.hit(x2, y2, 0xffffff);
  }

  lightning(pts) {
    const g = this.s.add.graphics().setDepth(45).setBlendMode('ADD');
    const draw = (w, color, alpha, jitter) => {
      g.lineStyle(w, color, alpha);
      g.beginPath();
      g.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const segs = 5;
        for (let k = 1; k <= segs; k++) {
          const t = k / segs;
          const j = k === segs ? 0 : (Math.random() - 0.5) * jitter;
          g.lineTo(a.x + (b.x - a.x) * t + j, a.y + (b.y - a.y) * t + j);
        }
      }
      g.strokePath();
    };
    draw(7, 0xd500f9, 0.35, 14);
    draw(2.5, 0xf3e5f5, 1, 12);
    for (let i = 1; i < pts.length; i++) { this.spark.setParticleTint(0xea80fc); this.spark.explode(3, pts[i].x, pts[i].y); }
    this.s.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
  }

  death(z) {
    const s = this.s;
    const v = Math.floor(Math.random() * 3);
    const sp = s.add.image(z.x, z.y - 4, 'splat' + v).setDepth(-3).setScale(z.baseScale * (z.isBoss ? 2.2 : 1)).setRotation(Math.random() * 6);
    s.tweens.add({ targets: sp, alpha: 0, delay: 5000, duration: 3000, onComplete: () => sp.destroy() });
    this.gore.setParticleTint(z.type === 'magma' ? 0xff6d00 : (z.type === 'frosty' || z.type === 'yeti') ? 0x9ec9d9 : 0x6a994e);
    this.gore.explode(z.isBoss ? 30 : 8, z.x, z.y - 16);
    // tubuh jatuh dan memudar
    const body = s.add.image(z.x, z.y, z.texture.key).setOrigin(0.5, 0.82).setScale(z.scaleX, z.scaleY).setFlipX(z.flipX).setDepth(z.depth).setTint(0x556655);
    s.tweens.add({ targets: body, angle: z.flipX ? -90 : 90, alpha: 0, y: z.y + 6, duration: 420, ease: 'Quad.in', onComplete: () => body.destroy() });
  }

  coins(x, y, amount) {
    this.coinE.explode(Math.min(1 + Math.floor(amount / 10), 4), x, y);
    this.floatText(x, y - 30, '+' + amount, '#ffd166', 15);
  }

  floatText(x, y, str, color, size) {
    const t = txt(this.s, x, y, str, size || 16, color || '#ffffff', { fontFamily: FONT_HEAD }).setOrigin(0.5).setDepth(48);
    this.s.tweens.add({ targets: t, y: y - 32, alpha: { from: 1, to: 0 }, duration: 800, ease: 'Cubic.out', onComplete: () => t.destroy() });
  }

  ring(x, y, r, color) {
    const c = this.s.add.circle(x, y, r, color, 0).setStrokeStyle(3, color, 1).setDepth(44).setScale(0.3);
    this.s.tweens.add({ targets: c, scale: 1, alpha: 0, duration: 400, onComplete: () => c.destroy() });
  }

  dust(x, y) {
    this.smokeE.setParticleTint(0xc9b18c);
    this.smokeE.explode(10, x, y);
    this.smokeE.setParticleTint(0x555555);
  }
}
