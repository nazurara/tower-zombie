// Proyektil yang terbang: peluru (mengejar), es (mengejar), dan bom meriam (melengkung ke satu titik)
class Projectile extends Phaser.GameObjects.Image {
  constructor(scene, kind, x, y, target, damage, tower) {
    super(scene, x, y, kind === 'shell' ? 'pr_shell' : kind === 'ice' ? 'pr_ice' : 'pr_bullet');
    scene.add.existing(this);
    this.kind = kind;
    this.target = target;
    this.damage = damage;
    this.tower = tower;
    this.done = false;
    this.setDepth(40);
    if (kind === 'shell') {
      this.sx = x; this.sy = y;
      this.tx = target.x; this.ty = target.y;
      const d = Math.hypot(this.tx - x, this.ty - y);
      this.total = Math.max(260, d / 0.38);
      this.t = 0;
      this.shadow = scene.add.ellipse(x, y, 12, 5, 0x000000, 0.3).setDepth(9);
    } else {
      this.speed = kind === 'ice' ? 420 : 620;
      this.lastX = target.x; this.lastY = target.y - 16;
    }
  }

  update(dt) {
    const s = this.scene;
    if (this.kind === 'shell') {
      this.t += dt;
      const p = Math.min(this.t / this.total, 1);
      const x = Phaser.Math.Linear(this.sx, this.tx, p);
      const y = Phaser.Math.Linear(this.sy, this.ty, p);
      const h = Math.sin(p * Math.PI) * Math.min(90, this.total * 0.12);
      this.setPosition(x, y - h);
      this.setScale(1 + h / 110);
      this.rotation += dt * 0.01;
      this.shadow.setPosition(x, y + 8);
      if (p >= 1) {
        const st = this.tower.stats();
        s.explode(this.tx, this.ty, st.splash * (this.tower.level === 4 ? 1 : 1), this.damage, this.tower);
        if (this.tower.level === 4) { // bom cluster
          for (let i = 0; i < 3; i++) {
            const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 25;
            s.time.delayedCall(140 + i * 90, () => {
              if (s.ended) return;
              s.explode(this.tx + Math.cos(a) * r, this.ty + Math.sin(a) * r, st.splash * 0.55, this.damage * 0.4, this.tower, true);
            });
          }
        }
        this.done = true;
      }
      return;
    }

    // peluru mengejar target; kalau target sudah mati, terbang ke posisi terakhir
    const alive = this.target && !this.target.dead && this.target.active;
    if (alive) { this.lastX = this.target.x; this.lastY = this.target.y - 16; }
    const dx = this.lastX - this.x, dy = this.lastY - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt / 1000;
    this.rotation = Math.atan2(dy, dx);
    if (dist <= step + 6) {
      if (alive) {
        if (this.kind === 'ice') s.frostHit(this.target, this.damage, this.tower);
        else s.hitZombie(this.target, this.damage, 'normal', this.tower, { splash: s.perks.splash > 0 ? 40 : 0 });
      }
      this.done = true;
    } else {
      this.x += dx / dist * step;
      this.y += dy / dist * step;
      if (this.kind === 'ice' && Math.random() < 0.5) s.fx.trail(this.x, this.y, 0xb2ebf2);
    }
  }

  destroy(fromScene) {
    if (this.shadow) this.shadow.destroy();
    super.destroy(fromScene);
  }
}
