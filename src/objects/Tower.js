// Menara = alas (diam) + turret (berputar ke arah target)
class Tower {
  constructor(scene, type, x, y, level) {
    this.scene = scene;
    this.type = type;
    this.def = TOWERS[type];
    this.level = level || 1;
    this.x = x; this.y = y;
    this.spent = 0;
    this.kills = 0;
    this.cooldown = 300;
    this.targetMode = this.def.target;
    this.angle = -Math.PI / 2;
    this.barrelSide = 0;
    this.base = scene.add.image(x, y, '').setDepth(10 + y * 0.01);
    this.turret = scene.add.image(x, y - 4, '').setDepth(10 + y * 0.01 + 0.001);
    this.pips = scene.add.graphics().setDepth(10 + y * 0.01 + 0.002);
    this.refreshLook();
  }

  get active() { return !!this.base; }

  stats() { return this.def.levels[this.level - 1]; }
  getDamage() { return this.stats().damage * this.scene.perks.damage; }
  getRange() { return this.stats().range * this.scene.perks.range; }
  getInterval() { return this.stats().rate * this.scene.perks.rate; }
  maxLevel() { return this.scene.chapter + 1 >= GAME.ULT_CHAPTER ? 4 : 3; }
  canUpgrade() { return this.level < this.maxLevel(); }
  lockedUlt() { return this.level === 3 && this.maxLevel() === 3; }
  upgradeCost() { return Math.round(this.def.levels[this.level].cost * this.scene.perks.discount); }
  sellValue() { return Math.floor(this.spent * GAME.SELL_RATE); }

  refreshLook() {
    this.base.setTexture('tb_' + this.type + '_' + this.level);
    this.turret.setTexture('tt_' + this.type + '_' + this.level);
    this.turret.rotation = this.type === 'tesla' ? 0 : this.angle + Math.PI / 2;
    this.drawPips();
  }

  drawPips() {
    const g = this.pips;
    g.clear();
    const n = this.level, x0 = this.x - (n - 1) * 5, y = this.y + 25;
    for (let i = 0; i < n; i++) {
      g.fillStyle(n === 4 ? 0xff4d6d : 0xffd166, 1);
      g.fillCircle(x0 + i * 10, y, 3.5);
      g.lineStyle(1.5, 0x1d1b2b, 1);
      g.strokeCircle(x0 + i * 10, y, 3.5);
    }
  }

  levelUp() {
    this.spent += this.upgradeCost();
    this.level++;
    this.refreshLook();
    this.scene.tweens.add({ targets: [this.base, this.turret], scale: { from: 1.35, to: 1 }, duration: 300, ease: 'Back.out' });
  }

  setPos(x, y) {
    this.x = x; this.y = y;
    this.base.setPosition(x, y).setDepth(10 + y * 0.01);
    this.turret.setPosition(x, y - 4).setDepth(10 + y * 0.01 + 0.001);
    this.pips.setDepth(10 + y * 0.01 + 0.002);
    this.drawPips();
  }

  setAlpha(a) { this.base.setAlpha(a); this.turret.setAlpha(a); this.pips.setAlpha(a); }

  // ---------- memilih target ----------
  findTarget(zombies) {
    const r = this.getRange();
    let best = null, bestScore = -Infinity;
    for (const z of zombies) {
      if (z.dead) continue;
      const d = Phaser.Math.Distance.Between(this.x, this.y, z.x, z.y);
      if (d > r) continue;
      let s;
      switch (this.targetMode) {
        case 'strong': s = z.hp + z.dist * 0.001; break;
        case 'near':   s = -d; break;
        case 'last':   s = -z.dist; break;
        default:       s = z.dist;
      }
      if (this.type === 'flame' && z.cfg.fireImmune) s -= 1e6; // api tidak berguna melawan zombie api
      if (s > bestScore) { bestScore = s; best = z; }
    }
    return best;
  }

  rollCrit() {
    const s = this.stats();
    let mult = 1;
    if (Math.random() < this.scene.perks.crit) mult = 2;
    if (this.type === 'sniper' && this.level === 4 && Math.random() < 0.25) mult = 3;
    return mult;
  }

  update(dt, zombies) {
    this.cooldown -= dt;
    const target = this.findTarget(zombies);
    if (!target) return;
    const want = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y - 14);
    if (this.type !== 'tesla') {
      this.angle = Phaser.Math.Angle.RotateTo(this.angle, want, 0.012 * dt);
      this.turret.rotation = this.angle + Math.PI / 2;
    }
    if (this.cooldown <= 0) {
      this.cooldown = this.getInterval();
      this.fire(target, want);
    }
  }

  muzzle(dist) {
    return { x: this.x + Math.cos(this.angle) * dist, y: this.y - 4 + Math.sin(this.angle) * dist };
  }

  recoil() {
    const s = this.scene;
    s.tweens.add({
      targets: this.turret,
      x: this.x - Math.cos(this.angle) * 3, y: this.y - 4 - Math.sin(this.angle) * 3,
      duration: 50, yoyo: true
    });
  }

  fire(target, ang) {
    const s = this.scene, st = this.stats(), dmg = this.getDamage();
    switch (this.type) {
      case 'gun': {
        const side = this.level >= 3 ? (this.barrelSide = (this.barrelSide + 1) % (this.level === 4 ? 3 : 2)) : 0;
        const off = this.level === 4 ? (side - 1) * 8 : (this.level === 3 ? (side ? 6 : -6) : 0);
        const m = this.muzzle(24);
        const px = -Math.sin(this.angle) * off, py = Math.cos(this.angle) * off;
        s.addProjectile(new Projectile(s, 'bullet', m.x + px, m.y + py, target, dmg * this.rollCrit(), this));
        s.fx.flash(m.x + px, m.y + py, 0xffd166, 0.5);
        Snd.play('gun');
        this.recoil();
        break;
      }
      case 'cannon': {
        const m = this.muzzle(24);
        // tembak sedikit ke depan zombie supaya kena
        const lead = target.speedNow * 0.45;
        const nxt = s.path[Math.min(target.wp, s.path.length - 1)];
        const dd = Math.hypot(nxt.x - target.x, nxt.y - target.y) || 1;
        const lx = target.x + (nxt.x - target.x) / dd * Math.min(lead, dd);
        const ly = target.y + (nxt.y - target.y) / dd * Math.min(lead, dd);
        s.addProjectile(new Projectile(s, 'shell', m.x, m.y, { x: lx, y: ly - 10 }, dmg * this.rollCrit(), this));
        s.fx.flash(m.x, m.y, 0xff9100, 1);
        s.fx.smoke(m.x, m.y, 3);
        Snd.play('cannon');
        this.recoil();
        break;
      }
      case 'frost': {
        const m = this.muzzle(18);
        s.addProjectile(new Projectile(s, 'ice', m.x, m.y, target, dmg, this));
        Snd.play('frost');
        break;
      }
      case 'sniper': {
        const m = this.muzzle(30);
        const crit = this.rollCrit();
        s.fx.tracer(m.x, m.y, target.x, target.y - 16, crit > 1 ? 0xff4d6d : 0xffffff);
        s.fx.flash(m.x, m.y, 0xffffff, 0.9);
        s.hitZombie(target, dmg * crit, 'normal', this, { splash: s.perks.splash > 0 ? 45 : 0 });
        if (crit > 1) s.fx.floatText(target.x, target.y - 50, 'KRITIS!', '#ff4d6d', 14);
        Snd.play('sniper');
        this.recoil();
        break;
      }
      case 'flame': {
        const half = this.level === 4 ? 0.75 : 0.42;
        const r = this.getRange();
        for (const z of [...s.zombies]) {
          if (z.dead) continue;
          const d = Phaser.Math.Distance.Between(this.x, this.y, z.x, z.y - 14);
          if (d > r + 8) continue;
          const a = Phaser.Math.Angle.Between(this.x, this.y, z.x, z.y - 14);
          if (Math.abs(Phaser.Math.Angle.Wrap(a - this.angle)) > half) continue;
          s.hitZombie(z, dmg, 'fire', this, { pierce: true });
          if (!z.dead) z.applyBurn(st.burn * s.perks.burn, 1600);
        }
        s.fx.flame(this, r, half);
        Snd.play('flame');
        break;
      }
      case 'tesla': {
        const chains = st.chains + s.perks.chains;
        const hit = [target];
        let cur = target;
        while (hit.length < chains) {
          let nxt = null, nd = 95;
          for (const z of s.zombies) {
            if (z.dead || hit.includes(z)) continue;
            const d = Phaser.Math.Distance.Between(cur.x, cur.y, z.x, z.y);
            if (d < nd) { nd = d; nxt = z; }
          }
          if (!nxt) break;
          hit.push(nxt); cur = nxt;
        }
        const pts = [{ x: this.x, y: this.y - 10 }].concat(hit.map((z) => ({ x: z.x, y: z.y - 16 })));
        s.fx.lightning(pts);
        let d = dmg * this.rollCrit();
        for (const z of hit) {
          const alive = !z.dead;
          s.hitZombie(z, d, 'normal', this);
          if (alive && !z.dead && this.level === 4 && Math.random() < 0.2) z.stun(600);
          d *= 0.85;
        }
        Snd.play('tesla');
        break;
      }
    }
  }

  destroy() {
    this.base.destroy(); this.turret.destroy(); this.pips.destroy();
    this.base = null;
  }
}
