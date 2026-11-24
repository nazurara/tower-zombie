class Zombie extends Phaser.GameObjects.Image {
  // start (opsional) = {x, y, wp, dist} untuk zombie yang muncul di tengah jalan (pecahan / panggilan bos)
  constructor(scene, type, hpMult, start) {
    const cfg = ZOMBIES[type];
    const path = scene.path;
    const sx = start ? start.x : path[0].x, sy = start ? start.y : path[0].y;
    super(scene, sx, sy, cfg.tex + '_0');
    scene.add.existing(this);
    this.type = type;
    this.cfg = cfg;
    this.baseScale = cfg.scale;
    this.setScale(cfg.scale);
    this.setOrigin(0.5, 0.82);
    this.hp = Math.round(cfg.hp * hpMult);
    this.maxHp = this.hp;
    this.hpMult = hpMult;
    this.baseSpeed = cfg.speed;
    this.reward = cfg.reward;
    this.damage = cfg.damage;
    this.armor = cfg.armor || 0;
    this.isBoss = !!cfg.boss;
    this.wp = start ? start.wp : 1;
    this.dist = start ? start.dist : 0; // jarak yang sudah ditempuh (untuk target "terdepan")
    this.reachedEnd = false;
    this.dead = false;
    this.phase = Math.random() * 6;
    this.animT = Math.random() * 200;
    this.frame_ = 0;
    // efek status
    this.slowAmt = 0; this.slowUntil = 0;
    this.burnDps = 0; this.burnUntil = 0;
    this.stunUntil = 0;
    this.summonT = cfg.summon ? cfg.summon.every : 0;
    this.hitFlash = 0;
    this.setDepth(10 + sy * 0.01);
    // muncul dari portal
    if (!start) {
      this.setAlpha(0);
      scene.tweens.add({ targets: this, alpha: 1, duration: 300 });
    }
  }

  get speedNow() {
    const now = this.scene.clock;
    let s = this.baseSpeed * this.scene.perks.slow;
    if (now < this.stunUntil) return 0;
    if (now < this.slowUntil) s *= 1 - this.slowAmt * (1 - (this.cfg.slowResist || 0));
    return s;
  }

  applySlow(amount, ms) {
    const now = this.scene.clock;
    if (now > this.slowUntil || amount >= this.slowAmt) this.slowAmt = amount;
    this.slowUntil = Math.max(this.slowUntil, now + ms);
  }

  applyBurn(dps, ms) {
    if (this.cfg.fireImmune) return;
    const now = this.scene.clock;
    this.burnDps = Math.max(dps, now < this.burnUntil ? this.burnDps : 0);
    this.burnUntil = now + ms;
  }

  stun(ms) {
    if (this.isBoss) ms *= 0.4;
    this.stunUntil = Math.max(this.stunUntil, this.scene.clock + ms);
  }

  // hitung damage setelah armor / kekebalan. kind: 'fire', 'frost', 'normal'
  calcDamage(dmg, kind, pierce) {
    if (kind === 'fire' && this.cfg.fireImmune) return 0;
    if (kind === 'frost' && this.cfg.frostWeak) dmg *= 2;
    if (!pierce && this.armor) dmg = Math.max(dmg - this.armor, dmg * 0.25);
    return dmg;
  }

  update(dt) {
    const now = this.scene.clock;
    const path = this.scene.path;

    // bakar
    if (now < this.burnUntil) {
      this.hp -= this.burnDps * dt / 1000;
      if (this.hp <= 0) { this.scene.killZombie(this); return; }
    }
    // pulih
    if (this.cfg.regen && this.hp < this.maxHp && now >= this.burnUntil) {
      this.hp = Math.min(this.maxHp, this.hp + this.cfg.regen * this.hpMult * dt / 1000);
    }
    // bos memanggil anak buah
    if (this.cfg.summon) {
      this.summonT -= dt;
      if (this.summonT <= 0) {
        this.summonT = this.cfg.summon.every;
        this.scene.summonAround(this, this.cfg.summon.type, this.cfg.summon.count);
      }
    }

    // berjalan mengikuti waypoint
    const sp = this.speedNow;
    let step = sp * dt / 1000;
    while (step > 0 && !this.reachedEnd) {
      const t = path[this.wp];
      const dx = t.x - this.x, dy = t.y - this.y;
      const d = Math.hypot(dx, dy);
      if (Math.abs(dx) > 0.5) this.setFlipX(dx < 0);
      if (d <= step) {
        this.x = t.x; this.y = t.y; step -= d; this.dist += d;
        this.wp++;
        if (this.wp >= path.length) this.reachedEnd = true;
      } else {
        this.x += dx / d * step; this.y += dy / d * step; this.dist += step; step = 0;
      }
    }

    // animasi jalan (2 frame) + goyang
    if (sp > 0) {
      this.animT += dt * (sp / 45);
      const f = Math.floor(this.animT / 190) % 2;
      if (f !== this.frame_) { this.frame_ = f; this.setTexture(this.cfg.tex + '_' + f); }
      const w = Math.sin(this.animT * 0.016 + this.phase);
      this.angle = w * (this.isBoss ? 3 : 6);
    }
    this.setDepth(10 + this.y * 0.01);

    // warna status
    if (this.hitFlash > 0) { this.hitFlash -= dt; this.setTintFill(0xffffff); }
    else if (now < this.stunUntil) this.setTint(0xfff59d);
    else if (now < this.slowUntil && this.slowAmt > 0) this.setTint(0x8fd3ff);
    else if (now < this.burnUntil) this.setTint((Math.floor(now / 90) % 2) ? 0xffa36b : 0xff7043);
    else this.clearTint();
  }

  flash() { this.hitFlash = 50; }
}
