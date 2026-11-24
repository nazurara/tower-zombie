class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  // data dibawa antar bab: koin, nyawa, skill, menara yang disimpan, skor
  create(data) {
    data = data || {};
    this.chapter = data.chapter || 0;
    this.biome = BIOMES[this.chapter];
    this.path = this.biome.PATH;
    this.coins = data.coins !== undefined ? data.coins : GAME.START_COINS;
    this.lives = data.lives !== undefined ? data.lives : GAME.START_LIVES;
    this.score = data.score || 0;
    this.kills = data.kills || 0;
    this.perks = data.perks || { damage: 1, rate: 1, range: 1, coin: 1, slow: 1, splash: 0, discount: 1, interest: 0, frost: 1, burn: 1, chains: 0, crit: 0 };
    this.speed = data.speed || 1;
    this.stored = data.stored || [];

    this.clock = 0;
    this.waveInChapter = -1;
    this.state = 'intro';   // intro | build | wave | perk | moving-chapter | ended
    this.paused = false;
    this.ended = false;
    this.countdown = GAME.FIRST_BREAK;
    this.mode = 'none';     // none | build | move
    this.buildType = null;
    this.selected = null;
    this.zombies = [];
    this.towers = [];
    this.projectiles = [];
    this.obstacles = [];
    this.overlay = [];
    this.bossBanner = null;

    this.buildMap();
    this.fx = new Effects(this);
    this.waves = new WaveManager(this);

    this.bars = this.add.graphics().setDepth(47);
    this.selGfx = this.add.graphics().setDepth(9);
    this.ghostGfx = this.add.graphics().setDepth(49);
    this.ghostBase = this.add.image(0, 0, 'tb_gun_1').setDepth(49.1).setAlpha(0.65).setVisible(false);
    this.ghostTop = this.add.image(0, 0, 'tt_gun_1').setDepth(49.2).setAlpha(0.65).setVisible(false);

    this.buildHud();
    this.sidebar = new Sidebar(this);
    this.setupInput();

    Snd.init(this);
    Music.start(this.biome.music);
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.showIntro();
    this.updateHud();
    this.sidebar.refresh(true);
  }

  // =========================================================
  //  PETA
  // =========================================================
  buildMap() {
    const B = this.biome, W = GAME.MAP_W, H = GAME.HEIGHT;
    this.add.tileSprite(0, 0, W, H, B.ground).setOrigin(0).setDepth(-10);
    // variasi warna tanah
    const rng = makeRng(100 + this.chapter * 17);
    for (let i = 0; i < 14; i++) {
      this.add.image(rng() * W, rng() * H, 'p_glow').setScale(1.5 + rng() * 2, 1 + rng() * 1.5)
        .setTint(rng() > 0.5 ? 0x000000 : 0xffffff).setAlpha(0.05 + rng() * 0.05).setDepth(-9);
    }
    if (B.sea) this.buildSea();
    this.drawPath();
    this.buildDecor(rng);

    // rumah
    const h = B.houseAt;
    this.house = this.add.image(h.x, h.y, B.house).setOrigin(0.5, 0.8).setDepth(10 + h.y * 0.01);
    if (B.key === 'grass' || B.key === 'snow') {
      this.add.particles(h.x + 24, h.y - 82, 'p_soft', {
        speedY: { min: -30, max: -18 }, speedX: { min: -6, max: 10 }, lifespan: 2200, frequency: 260,
        scale: { start: 0.4, end: 1.6 }, alpha: { start: 0.45, end: 0 }, tint: 0xdddddd
      }).setDepth(30);
    }
    // portal zombie
    const p0 = this.path[0], p1 = this.path[1];
    const px = Phaser.Math.Clamp(p0.x, 34, W - 34), py = Phaser.Math.Clamp(p0.y, GAME.HUD_H + 34, H - 34);
    this.portalAt = { x: px, y: py };
    const portal = this.add.image(px, py, 'portal').setDepth(-4).setScale(0.9);
    this.tweens.add({ targets: portal, angle: 360, duration: 3000, repeat: -1 });
    this.tweens.add({ targets: portal, scale: 1.05, duration: 900, yoyo: true, repeat: -1 });
    this.obstacles.push({ x: px, y: py, r: 30 });
    // arah masuk
    const arr = this.add.image(px + Math.sign(p1.x - p0.x) * 44, py + Math.sign(p1.y - p0.y) * 44, 'i_arrow').setDepth(-4).setAlpha(0.8);
    arr.rotation = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    this.tweens.add({ targets: arr, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

    this.buildWeather();
    if (B.overlay) this.add.rectangle(0, 0, W, H, B.overlay[0], B.overlay[1]).setOrigin(0).setDepth(52).setBlendMode('MULTIPLY');
    this.add.image(0, 0, 'vignette').setOrigin(0).setDepth(53);
  }

  buildSea() {
    const W = GAME.MAP_W, H = GAME.HEIGHT;
    const g = this.add.graphics().setDepth(-8);
    g.fillStyle(0xd9bf85, 1); g.fillRect(0, 576, W, 30);
    g.fillGradientStyle(0x48cae4, 0x48cae4, 0x0077b6, 0x0077b6, 1);
    g.fillRect(0, 596, W, H - 596);
    this.foam = this.add.graphics().setDepth(-7);
    this.obstacles.push({ rect: [0, 584, W, 100] });
  }

  drawFoam() {
    if (!this.foam) return;
    const g = this.foam, W = GAME.MAP_W, t = this.time.now / 1000;
    g.clear();
    g.fillStyle(0x90e0ef, 0.6);
    g.beginPath(); g.moveTo(0, 640);
    for (let x = 0; x <= W; x += 16) g.lineTo(x, 594 + Math.sin(x * 0.03 + t * 1.6) * 4 + Math.sin(t * 0.8) * 3);
    g.lineTo(W, 640); g.closePath(); g.fillPath();
    g.lineStyle(3, 0xffffff, 0.85);
    g.beginPath();
    for (let x = 0; x <= W; x += 16) {
      const y = 592 + Math.sin(x * 0.03 + t * 1.6) * 4 + Math.sin(t * 0.8) * 3;
      if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.strokePath();
  }

  drawPath() {
    const g = this.add.graphics().setDepth(-6), P = this.biome.path, pts = this.path;
    const stroke = (w, color, alpha) => {
      g.lineStyle(w, color, alpha);
      g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
      g.strokePath();
      g.fillStyle(color, alpha);
      for (let i = 1; i < pts.length - 1; i++) g.fillCircle(pts[i].x, pts[i].y, w / 2);
    };
    stroke(62, 0x000000, 0.18);
    stroke(56, P.edge, 1);
    stroke(46, P.mid, 1);
    stroke(26, P.top, 0.55);
    // kerikil di jalan
    const rng = makeRng(77 + this.chapter);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], len = Math.hypot(b.x - a.x, b.y - a.y);
      for (let d = 0; d < len; d += 14) {
        if (rng() > 0.55) continue;
        const t = d / len, off = (rng() - 0.5) * 38;
        const nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
        g.fillStyle(P.pebble, this.biome.key === 'volcano' ? 0.5 + rng() * 0.4 : 0.55);
        g.fillCircle(a.x + (b.x - a.x) * t + nx * off, a.y + (b.y - a.y) * t + ny * off, 1.2 + rng() * 2);
      }
    }
    // jejak kaki/garis tengah putus-putus
    g.lineStyle(2, 0x000000, 0.08);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], len = Math.hypot(b.x - a.x, b.y - a.y);
      for (let d = 10; d < len - 10; d += 26) {
        const t1 = d / len, t2 = Math.min((d + 10) / len, 1);
        g.lineBetween(a.x + (b.x - a.x) * t1, a.y + (b.y - a.y) * t1, a.x + (b.x - a.x) * t2, a.y + (b.y - a.y) * t2);
      }
    }
    // sampel titik jalur (dipakai untuk auto-penempatan menara)
    this.pathSamples = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], len = Math.hypot(b.x - a.x, b.y - a.y);
      for (let d = 0; d < len; d += 12) {
        const x = a.x + (b.x - a.x) * d / len, y = a.y + (b.y - a.y) * d / len;
        if (x >= 0 && x <= GAME.MAP_W && y >= 0 && y <= GAME.HEIGHT) this.pathSamples.push({ x, y });
      }
    }
  }

  buildDecor(rng) {
    const B = this.biome, placed = [], h = B.houseAt;
    for (const d of B.decor) {
      const [key, count, minPath, gap, obsR] = d;
      let variants = 1; while (this.textures.exists(key + '_' + variants)) variants++;
      let n = 0, tries = 0;
      while (n < count && tries < 1500) {
        tries++;
        const x = 20 + rng() * (GAME.MAP_W - 40), y = GAME.HUD_H + 16 + rng() * (GAME.HEIGHT - GAME.HUD_H - 30);
        if (this.nearPath(x, y) < minPath) continue;
        if (Math.abs(x - h.x) < 75 && y > h.y - 110 && y < h.y + 40) continue;
        if (B.sea && y > 560) continue;
        if (Math.hypot(x - this.portalAtGuess().x, y - this.portalAtGuess().y) < 60) continue;
        if (placed.some((p) => Math.hypot(p.x - x, p.y - y) < Math.max(gap, p.gap))) continue;
        placed.push({ x, y, gap: obsR ? gap : 14 });
        const v = Math.floor(rng() * variants);
        const img = this.add.image(x, y, v ? key + '_' + v : key).setOrigin(0.5, obsR ? 0.85 : 0.5).setDepth(obsR ? 10 + y * 0.01 : -5);
        if (rng() > 0.5 && key !== 'd_umbrella') img.setFlipX(true);
        if (obsR) {
          this.obstacles.push({ x, y: y - 8, r: obsR });
          // pohon/payung tinggi: tutup juga area daun supaya menara tidak tertutup
          if (img.displayHeight > 50) this.obstacles.push({ x, y: y - img.displayHeight * 0.55, r: obsR + 4 });
        }
        if (key === 'd_lava') {
          img.setDepth(-5).setOrigin(0.5);
          const glow = this.add.image(x, y, 'p_glow').setTint(0xff6d00).setBlendMode('ADD').setScale(1.3, 0.9).setAlpha(0.5).setDepth(-4);
          this.tweens.add({ targets: glow, alpha: 0.2, duration: 900 + rng() * 600, yoyo: true, repeat: -1 });
          this.add.particles(x, y, 'p_soft', { speedY: { min: -40, max: -15 }, speedX: { min: -8, max: 8 }, lifespan: 900, frequency: 350,
            scale: { start: 0.25, end: 0 }, alpha: { start: 0.9, end: 0 }, tint: [0xffea00, 0xff6d00], blendMode: 'ADD',
            emitZone: { type: 'random', source: new Phaser.Geom.Ellipse(0, 0, 50, 24) } }).setDepth(-3);
        }
        if (key === 'd_crystal') {
          const glow = this.add.image(x, y, 'p_glow').setTint(0xff1744).setBlendMode('ADD').setScale(0.4).setAlpha(0.6).setDepth(-4);
          this.tweens.add({ targets: glow, alpha: 0.2, duration: 1200, yoyo: true, repeat: -1 });
        }
        if (key === 'd_tree' || key === 'd_palm' || key === 'd_pine') {
          this.tweens.add({ targets: img, angle: { from: -1.5, to: 1.5 }, duration: 1800 + rng() * 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        }
        n++;
      }
    }
  }

  portalAtGuess() {
    const p0 = this.path[0];
    return { x: Phaser.Math.Clamp(p0.x, 34, GAME.MAP_W - 34), y: Phaser.Math.Clamp(p0.y, GAME.HUD_H + 34, GAME.HEIGHT - 34) };
  }

  buildWeather() {
    const W = GAME.MAP_W, type = this.biome.weather;
    const top = new Phaser.Geom.Rectangle(-50, -20, W + 100, 10);
    if (type === 'snow') {
      this.add.particles(0, 0, 'p_flake', { emitZone: { type: 'random', source: top }, speedY: { min: 30, max: 70 }, speedX: { min: -25, max: 10 },
        lifespan: 12000, frequency: 70, scale: { min: 0.4, max: 1 }, alpha: { min: 0.5, max: 0.95 }, rotate: { min: 0, max: 360 } }).setDepth(50);
    } else if (type === 'embers') {
      this.add.particles(0, 0, 'p_soft', { emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(0, GAME.HEIGHT, W, 10) },
        speedY: { min: -60, max: -25 }, speedX: { min: -15, max: 15 }, lifespan: 9000, frequency: 120, scale: { min: 0.08, max: 0.22 },
        alpha: { start: 1, end: 0 }, tint: [0xffea00, 0xff9100, 0xff3d00], blendMode: 'ADD' }).setDepth(50);
    } else if (type === 'leaves') {
      this.add.particles(0, 0, 'p_leaf', { emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-30, 0, 10, GAME.HEIGHT) },
        speedX: { min: 25, max: 60 }, speedY: { min: 5, max: 25 }, lifespan: 20000, frequency: 900, rotate: { start: 0, end: 720 },
        tint: [0x95d5b2, 0xffd166, 0xf4a261], alpha: 0.85 }).setDepth(50);
    } else if (type === 'mist') {
      this.add.particles(0, 0, 'p_glow', { emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-120, 0, 10, GAME.HEIGHT) },
        speedX: { min: 12, max: 28 }, lifespan: 50000, frequency: 2500, scale: { min: 1.5, max: 3 }, alpha: { min: 0.05, max: 0.12 } }).setDepth(50);
    }
  }

  nearPath(x, y) {
    let m = Infinity;
    for (let i = 0; i < this.path.length - 1; i++) m = Math.min(m, distToSegment(x, y, this.path[i], this.path[i + 1]));
    return m;
  }

  // =========================================================
  //  HUD (bar atas)
  // =========================================================
  buildHud() {
    const W = GAME.MAP_W, D = 60;
    const g = this.add.graphics().setDepth(D);
    g.fillStyle(0x10112a, 0.82); g.fillRect(0, 0, W, GAME.HUD_H);
    g.fillStyle(0x000000, 0.3); g.fillRect(0, GAME.HUD_H, W, 3);
    g.lineStyle(2, 0x3d3f7a, 1); g.lineBetween(0, GAME.HUD_H, W, GAME.HUD_H);
    const pill = (x, w) => { g.fillStyle(0x000000, 0.35); g.fillRoundedRect(x, 8, w, 30, 15); };
    pill(10, 108); pill(126, 86); pill(220, 132);
    this.add.image(28, 23, 'i_coin').setDepth(D + 1);
    this.coinTxt = txt(this, 46, 23, '', 20, '#ffd166', { fontFamily: FONT_HEAD }).setOrigin(0, 0.5).setDepth(D + 1);
    this.heartImg = this.add.image(144, 23, 'i_heart').setDepth(D + 1);
    this.livesTxt = txt(this, 162, 23, '', 20, '#ff8fa3', { fontFamily: FONT_HEAD }).setOrigin(0, 0.5).setDepth(D + 1);
    this.add.image(238, 23, 'i_skull').setDepth(D + 1);
    this.waveTxt = txt(this, 256, 23, '', 18, '#ffffff', { fontFamily: FONT_HEAD }).setOrigin(0, 0.5).setDepth(D + 1);
    this.chapterTxt = txt(this, 370, 23, this.biome.sub + ' · ' + this.biome.name, 17, '#bde0fe', { fontFamily: FONT_HEAD }).setOrigin(0, 0.5).setDepth(D + 1);
    this.statusTxt = txt(this, W - 14, 23, '', 16, '#ffffff', { fontFamily: FONT_HEAD }).setOrigin(1, 0.5).setDepth(D + 1);
    this.bossName = txt(this, W / 2, GAME.HUD_H + 16, '', 15, '#ffffff', { fontFamily: FONT_HEAD }).setOrigin(0.5).setDepth(D + 1).setVisible(false);
    this.bossGfx = this.add.graphics().setDepth(D);
  }

  updateHud() {
    this.coinTxt.setText(String(this.coins));
    this.livesTxt.setText(String(this.lives));
    this.waveTxt.setText('Wave ' + Math.max(this.globalWave(), 1) + '/' + totalWaves());
    if (this.state === 'build') {
      this.statusTxt.setText('Wave berikutnya ' + Math.max(Math.ceil(this.countdown / 1000), 0) + ' dtk').setColor(this.countdown < 4000 ? '#ff8fa3' : '#ffffff');
    } else if (this.state === 'wave') {
      this.statusTxt.setText('Sisa zombie: ' + this.waves.remaining()).setColor('#ffffff');
    } else this.statusTxt.setText('');
    this.sidebar.updateControls();
    this.sidebar.refresh();
  }

  globalWave() {
    let n = 0;
    for (let i = 0; i < this.chapter; i++) n += BIOMES[i].waves.length;
    return n + this.waveInChapter + 1;
  }

  // =========================================================
  //  INPUT
  // =========================================================
  setupInput() {
    this.input.mouse && this.input.mouse.disableContextMenu();
    this.input.on('pointerdown', (p, over) => {
      if (this.state === 'intro' || this.state === 'perk' || this.state === 'moving-chapter' || this.ended || this.paused) return;
      if (over && over.length) return;
      if (p.x >= GAME.MAP_W) return;
      if (p.rightButtonDown()) { this.cancelMode(); this.selectTower(null); return; }
      const x = p.worldX, y = p.worldY;
      if (this.mode === 'build') {
        const hitT = this.towerAt(x, y);
        if (hitT) { this.cancelMode(); this.selectTower(hitT); return; }
        this.tryBuild(x, y, p.event && p.event.shiftKey);
        return;
      }
      if (this.mode === 'move') { this.tryMove(x, y); return; }
      const t = this.towerAt(x, y);
      this.selectTower(t);
    });

    const K = this.input.keyboard;
    if (!K) return;
    TOWER_ORDER.forEach((type, i) => K.on('keydown-' + ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX'][i], () => this.chooseBuild(type)));
    K.on('keydown-U', () => this.upgradeSelected());
    K.on('keydown-X', () => this.sellSelected());
    K.on('keydown-DELETE', () => this.sellSelected());
    K.on('keydown-G', () => this.startMove());
    K.on('keydown-T', () => this.cycleTarget());
    K.on('keydown-N', () => this.callWave());
    K.on('keydown-F', () => this.toggleSpeed());
    K.on('keydown-SPACE', () => this.togglePause());
    K.on('keydown-M', () => this.sidebar.muteBtn.setLabel(Snd.toggleMute() ? '🔇' : '🔊'));
    K.on('keydown-ESC', () => { if (this.mode !== 'none') this.cancelMode(); else this.selectTower(null); });
  }

  canInteract() { return !this.ended && !this.paused && (this.state === 'build' || this.state === 'wave'); }

  towerAt(x, y) {
    return this.towers.find((t) => Phaser.Math.Distance.Between(x, y, t.x, t.y) < 24) || null;
  }

  // =========================================================
  //  MENARA: beli, upgrade, pindah, jual
  // =========================================================
  isUnlocked(type) { return TOWERS[type].unlock <= this.chapter + 1; }
  towerCost(type) { return Math.round(TOWERS[type].levels[0].cost * this.perks.discount); }

  canPlace(x, y, ignore) {
    if (x < 24 || x > GAME.MAP_W - 24 || y < GAME.HUD_H + 22 || y > GAME.HEIGHT - 20) return false;
    if (this.nearPath(x, y) < 40) return false;
    const h = this.biome.houseAt;
    if (Math.abs(x - h.x) < 62 && y > h.y - 100 && y < h.y + 30) return false;
    for (const o of this.obstacles) {
      if (o.rect) { if (x > o.rect[0] && x < o.rect[0] + o.rect[2] && y > o.rect[1] && y < o.rect[1] + o.rect[3]) return false; continue; }
      if (Math.hypot(x - o.x, y - o.y) < o.r + 20) return false;
    }
    for (const t of this.towers) {
      if (t === ignore) continue;
      if (Phaser.Math.Distance.Between(x, y, t.x, t.y) < 44) return false;
    }
    return true;
  }

  chooseBuild(type) {
    if (!this.canInteract()) return;
    if (!this.isUnlocked(type)) { Snd.play('error'); this.toast('🔒 ' + TOWERS[type].name + ' terbuka di Bab ' + TOWERS[type].unlock); return; }
    if (this.mode === 'build' && this.buildType === type) { this.cancelMode(); return; }
    this.cancelMode();
    this.selectTower(null);
    this.mode = 'build';
    this.buildType = type;
    Snd.play('click');
    this.sidebar.refresh(true);
  }

  cancelMode() {
    if (this.mode === 'move' && this.selected) this.selected.setAlpha(1);
    this.mode = 'none';
    this.buildType = null;
    this.ghostGfx.clear();
    this.ghostBase.setVisible(false); this.ghostTop.setVisible(false);
    this.sidebar && this.sidebar.refresh(true);
  }

  tryBuild(x, y, keep) {
    const type = this.buildType, cost = this.towerCost(type);
    if (this.coins < cost) { Snd.play('error'); this.fx.floatText(x, y - 20, 'Koin kurang!', '#ff6b6b'); return; }
    if (!this.canPlace(x, y)) { Snd.play('error'); this.fx.floatText(x, y - 20, 'Tidak bisa di sini', '#ff6b6b', 13); return; }
    this.coins -= cost;
    const t = this.addTower(type, x, y, 1, true);
    t.spent = cost;
    if (!keep || this.coins < cost) this.cancelMode();
    this.updateHud();
  }

  addTower(type, x, y, level, animate) {
    const t = new Tower(this, type, x, y, level);
    this.towers.push(t);
    if (animate) {
      [t.base, t.turret].forEach((o) => { const oy = o.y; o.y -= 40; o.setAlpha(0); this.tweens.add({ targets: o, y: oy, alpha: 1, duration: 260, ease: 'Bounce.out' }); });
      this.time.delayedCall(200, () => { this.fx.dust(x, y + 8); Snd.play('place'); });
    }
    return t;
  }

  selectTower(t) {
    if (this.mode === 'move') return;
    this.selected = t;
    if (t) {
      Snd.play('click');
      this.tweens.add({ targets: [t.base, t.turret], scale: { from: 1.12, to: 1 }, duration: 160 });
    }
    this.sidebar.refresh(true);
  }

  upgradeSelected() {
    const t = this.selected;
    if (!t || !this.canInteract() || this.mode === 'move') return;
    if (!t.canUpgrade()) { Snd.play('error'); if (t.lockedUlt()) this.toast('Level 4 (ULTIMATE) terbuka di Bab ' + GAME.ULT_CHAPTER); return; }
    const cost = t.upgradeCost();
    if (this.coins < cost) { Snd.play('error'); this.fx.floatText(t.x, t.y - 34, 'Koin kurang!', '#ff6b6b'); return; }
    this.coins -= cost;
    t.levelUp();
    Snd.play('upgrade');
    this.fx.ring(t.x, t.y, 40, t.level === 4 ? 0xff4d6d : 0xffd166);
    this.fx.hit(t.x, t.y, 0xffd166); this.fx.hit(t.x, t.y, 0xffffff);
    this.fx.floatText(t.x, t.y - 36, t.level === 4 ? 'ULTIMATE!' : 'Level ' + t.level + '!', t.level === 4 ? '#ff4d6d' : '#ffd166', 16);
    this.updateHud();
    this.sidebar.refresh(true);
  }

  sellSelected() {
    const t = this.selected;
    if (!t || !this.canInteract() || this.mode === 'move') return;
    const v = t.sellValue();
    this.coins += v;
    this.fx.coins(t.x, t.y - 10, v);
    this.fx.dust(t.x, t.y + 6);
    Snd.play('sell');
    this.towers = this.towers.filter((o) => o !== t);
    t.destroy();
    this.selected = null;
    this.updateHud();
    this.sidebar.refresh(true);
  }

  startMove() {
    const t = this.selected;
    if (!t || !this.canInteract()) return;
    if (this.mode === 'move') { this.cancelMode(); return; }
    const fee = this.state === 'wave' ? GAME.MOVE_FEE : 0;
    if (this.coins < fee) { Snd.play('error'); this.toast('Butuh ' + fee + ' koin untuk pindah saat wave'); return; }
    this.mode = 'move';
    t.setAlpha(0.35);
    this.ghostBase.setTexture(t.base.texture.key); this.ghostTop.setTexture(t.turret.texture.key);
    Snd.play('click');
    this.toast('Klik tempat baru' + (fee ? ' (' + fee + ' koin)' : ' (gratis saat jeda)') + ' · Esc batal');
  }

  tryMove(x, y) {
    const t = this.selected;
    if (!t) { this.cancelMode(); return; }
    if (this.towerAt(x, y) === t) { this.cancelMode(); return; }
    if (!this.canPlace(x, y, t)) { Snd.play('error'); this.fx.floatText(x, y - 20, 'Tidak bisa di sini', '#ff6b6b', 13); return; }
    const fee = this.state === 'wave' ? GAME.MOVE_FEE : 0;
    if (this.coins < fee) { Snd.play('error'); this.cancelMode(); return; }
    this.coins -= fee;
    this.fx.dust(t.x, t.y + 6);
    t.setPos(x, y);
    this.mode = 'none';
    t.setAlpha(1);
    [t.base, t.turret].forEach((o) => { const oy = o.y; o.y -= 30; this.tweens.add({ targets: o, y: oy, duration: 220, ease: 'Bounce.out' }); });
    this.fx.dust(x, y + 8);
    Snd.play('place');
    this.ghostGfx.clear(); this.ghostBase.setVisible(false); this.ghostTop.setVisible(false);
    this.updateHud();
    this.sidebar.refresh(true);
  }

  cycleTarget() {
    const t = this.selected;
    if (!t) return;
    const i = TARGET_MODES.findIndex((m) => m.key === t.targetMode);
    t.targetMode = TARGET_MODES[(i + 1) % TARGET_MODES.length].key;
    Snd.play('click');
    this.sidebar.refresh(true);
  }

  // Penempatan otomatis menara bawaan dari bab sebelumnya: cari titik yang paling banyak menjangkau jalur
  autoPlace(list) {
    const sorted = list.slice().sort((a, b) => b.level - a.level || (a.type === 'sniper') - (b.type === 'sniper'));
    const cands = [];
    for (let x = 30; x < GAME.MAP_W - 24; x += 18) for (let y = GAME.HUD_H + 26; y < GAME.HEIGHT - 20; y += 18) {
      if (this.canPlace(x, y)) cands.push({ x, y });
    }
    let i = 0;
    for (const st of sorted) {
      const r = TOWERS[st.type].levels[st.level - 1].range * this.perks.range * (st.type === 'sniper' ? 0.6 : 0.9);
      let best = null, bestScore = -1;
      for (const c of cands) {
        if (!this.canPlace(c.x, c.y)) continue;
        let score = 0;
        for (const p of this.pathSamples) {
          const d = Math.hypot(p.x - c.x, p.y - c.y);
          if (d < r) score += 1 + (st.type === 'flame' ? (r - d) / r : 0);
        }
        // sedikit condong ke rumah supaya pertahanan akhir kuat
        score += (1 - Math.hypot(c.x - this.biome.houseAt.x, c.y - this.biome.houseAt.y) / 1200) * 2;
        if (score > bestScore) { bestScore = score; best = c; }
      }
      if (!best) { this.coins += Math.floor(st.spent * GAME.SELL_RATE); continue; }
      const t = this.addTower(st.type, best.x, best.y, st.level, false);
      t.spent = st.spent; t.kills = st.kills; t.targetMode = st.targetMode;
      // animasi jatuh dari langit
      [t.base, t.turret, t.pips].forEach((o) => {
        const oy = o.y; o.y -= 500; o.setAlpha(1);
        this.tweens.add({ targets: o, y: oy, duration: 600, delay: i * 120, ease: 'Bounce.out' });
      });
      const tx = best.x, ty = best.y;
      this.time.delayedCall(i * 120 + 420, () => { this.fx.dust(tx, ty + 8); Snd.play('place'); });
      i++;
    }
  }

  // =========================================================
  //  ZOMBIE & DAMAGE
  // =========================================================
  spawnZombie(type, hpMult, start) {
    const z = new Zombie(this, type, hpMult, start);
    this.zombies.push(z);
    if (z.isBoss) { this.cameras.main.shake(400, 0.008); Snd.play('boss'); }
    return z;
  }

  summonAround(boss, type, count) {
    if (boss.dead) return;
    this.fx.ring(boss.x, boss.y - 20, 60, 0x9d4edd);
    for (let i = 0; i < count; i++) {
      const z = this.spawnZombie(type, this.waves.hpMult * 0.8, { x: boss.x + (Math.random() - 0.5) * 20, y: boss.y + (Math.random() - 0.5) * 12, wp: boss.wp, dist: boss.dist - 5 });
      z.setScale(0.1); this.tweens.add({ targets: z, scale: z.baseScale, duration: 300, ease: 'Back.out' });
    }
  }

  addProjectile(p) { this.projectiles.push(p); }

  hitZombie(z, dmg, kind, tower, opts) {
    if (!z || z.dead) return;
    opts = opts || {};
    const d = z.calcDamage(dmg * (z.isBoss && kind === 'frost' ? 1 : 1), kind, opts.pierce);
    if (d <= 0) {
      if (!z.immuneT || this.clock - z.immuneT > 900) { z.immuneT = this.clock; this.fx.floatText(z.x, z.y - 48, 'KEBAL', '#ffb703', 12); }
      return;
    }
    z.hp -= d;
    z.flash();
    if (kind !== 'fire') this.fx.hit(z.x, z.y - 16);
    if (z.hp <= 0) this.killZombie(z, tower);
    if (opts.splash) {
      for (const o of [...this.zombies]) {
        if (o === z || o.dead) continue;
        if (Phaser.Math.Distance.Between(z.x, z.y, o.x, o.y) < opts.splash) this.hitZombie(o, dmg * 0.35, kind, tower);
      }
    }
  }

  frostHit(target, dmg, tower) {
    const st = tower.stats(), r = st.splash;
    const cx = target.x, cy = target.y;
    this.fx.frostBurst(cx, cy - 14, r);
    for (const z of [...this.zombies]) {
      if (z.dead) continue;
      if (Phaser.Math.Distance.Between(cx, cy, z.x, z.y) > r) continue;
      z.applySlow(st.slow, st.slowTime * this.perks.frost);
      if (tower.level === 4 && Math.random() < 0.15) { z.stun(1000); }
      this.hitZombie(z, dmg, 'frost', tower);
    }
  }

  explode(x, y, r, dmg, tower, small) {
    this.fx.explosion(x, y, r);
    if (!small) { Snd.play('boom'); this.cameras.main.shake(90, 0.0025); }
    for (const z of [...this.zombies]) {
      if (z.dead) continue;
      const d = Phaser.Math.Distance.Between(x, y, z.x, z.y - 14);
      if (d > r + 10) continue;
      this.hitZombie(z, d < r * 0.5 ? dmg : dmg * 0.6, 'normal', tower);
    }
  }

  killZombie(z, tower) {
    if (z.dead) return;
    z.dead = true;
    const gain = Math.round(z.reward * this.perks.coin);
    this.coins += gain;
    this.score += z.reward * 10;
    this.kills++;
    if (tower && tower.active) tower.kills++;
    this.fx.death(z);
    this.fx.coins(z.x, z.y - 20, gain);
    Snd.play('die'); Snd.play('coin');
    if (z.cfg.split) {
      Snd.play('split');
      for (let i = 0; i < z.cfg.split.count; i++) {
        const b = this.spawnZombie(z.cfg.split.type, z.hpMult, { x: z.x + (Math.random() - 0.5) * 22, y: z.y + (Math.random() - 0.5) * 14, wp: z.wp, dist: z.dist - i * 6 });
        b.setScale(0.2); this.tweens.add({ targets: b, scale: b.baseScale, duration: 250, ease: 'Back.out' });
      }
    }
    if (z.isBoss) {
      this.cameras.main.shake(500, 0.012);
      this.cameras.main.flash(300, 255, 255, 255);
      this.banner('BOS KALAH!', '+' + gain + ' koin', '#ffd166');
    }
    this.removeZombie(z);
  }

  removeZombie(z) {
    z.dead = true;
    this.zombies = this.zombies.filter((o) => o !== z);
    z.destroy();
  }

  hitHouse(z) {
    this.lives = Math.max(0, this.lives - z.damage);
    this.cameras.main.shake(220, 0.008);
    this.cameras.main.flash(150, 180, 0, 0);
    this.house.setTint(0xff6666);
    this.time.delayedCall(180, () => this.house.clearTint());
    this.tweens.add({ targets: this.heartImg, scale: { from: 1.6, to: 1 }, duration: 300 });
    this.fx.floatText(this.biome.houseAt.x, this.biome.houseAt.y - 90, '-' + z.damage + ' ♥', '#ff4d6d', 22);
    Snd.play('hitHouse');
    this.removeZombie(z);
    if (this.lives <= 0) this.gameOver(false);
  }

  // =========================================================
  //  ALUR WAVE
  // =========================================================
  earlyBonus() { return this.state === 'build' ? Math.floor(Math.max(this.countdown, 0) / 1000) * 2 : 0; }

  callWave() {
    if (this.state !== 'build' || this.paused || this.ended) return;
    const b = this.earlyBonus();
    if (b > 0) { this.coins += b; this.fx.floatText(GAME.MAP_W / 2, 90, '+' + b + ' koin (mulai cepat)', '#ffd166', 16); }
    this.startWave();
  }

  startWave() {
    this.waveInChapter++;
    this.state = 'wave';
    const cfg = this.biome.waves[this.waveInChapter];
    this.waves.start(cfg);
    Snd.play('wave');
    const last = this.waveInChapter === this.biome.waves.length - 1;
    this.banner('WAVE ' + this.globalWave(), last ? '⚠ Bos datang di akhir wave!' : this.biome.name, last ? '#ff4d6d' : '#ffffff');
    this.updateHud();
  }

  waveCleared() {
    const isLastInChapter = this.waveInChapter >= this.biome.waves.length - 1;
    const isFinal = isLastInChapter && this.chapter >= BIOMES.length - 1;
    const interest = Math.min(Math.floor(this.coins * this.perks.interest), 80);
    const bonus = GAME.WAVE_BONUS + this.chapter * 10;
    this.coins += bonus + interest;
    this.score += 100 * this.globalWave();
    this.cancelMode();
    if (isFinal) { this.gameOver(true); return; }
    this.state = 'perk';
    this.time.delayedCall(700, () => this.showPerks(bonus, interest, isLastInChapter));
    this.updateHud();
  }

  // =========================================================
  //  LAYAR PILIH SKILL
  // =========================================================
  showPerks(bonus, interest, chapterEnd) {
    this.selectTower(null);
    const O = this.overlay = [], cx = GAME.MAP_W / 2;
    O.push(this.add.rectangle(0, 0, GAME.WIDTH, GAME.HEIGHT, 0x000000, 0.7).setOrigin(0).setDepth(100).setInteractive());
    const title = txt(this, cx, 100, chapterEnd ? this.biome.name.toUpperCase() + ' AMAN!' : 'WAVE ' + this.globalWave() + ' SELESAI!', 40, '#ffffff', { fontFamily: FONT_HEAD, strokeThickness: 8 }).setOrigin(0.5).setDepth(101);
    O.push(title);
    this.tweens.add({ targets: title, scale: { from: 0.5, to: 1 }, duration: 400, ease: 'Back.out' });
    O.push(txt(this, cx, 148, '+' + bonus + ' koin bonus' + (interest ? '  ·  +' + interest + ' bunga bank' : '') + '   —   pilih 1 skill:', 18, '#ffd166').setOrigin(0.5).setDepth(101));

    const pool = PERKS.filter((p) => !p.ok || p.ok(this));
    const choices = Phaser.Utils.Array.Shuffle(pool.slice()).slice(0, 3);
    this.perkChoices = { choices, chapterEnd };
    choices.forEach((perk, i) => {
      const x = cx - 250 + i * 250, y = 330;
      const g = this.add.graphics().setDepth(101);
      const draw = (hover) => {
        g.clear();
        g.fillStyle(0x000000, 0.4); g.fillRoundedRect(x - 105, y - 120 + 6, 210, 240, 18);
        g.fillStyle(hover ? 0x3a4ba0 : 0x26306b, 1); g.fillRoundedRect(x - 105, y - 120, 210, 240, 18);
        g.fillStyle(0xffffff, 0.08); g.fillRoundedRect(x - 97, y - 112, 194, 96, 12);
        g.lineStyle(4, hover ? 0xffd166 : 0x6c72c9, 1); g.strokeRoundedRect(x - 105, y - 120, 210, 240, 18);
      };
      draw(false);
      const icon = txt(this, x, y - 64, perk.icon, 50, '#ffffff', { fontFamily: FONT_BODY, strokeThickness: 0 }).setOrigin(0.5).setDepth(102);
      const name = txt(this, x, y + 4, perk.name, 22, '#ffffff', { fontFamily: FONT_HEAD }).setOrigin(0.5).setDepth(102);
      const desc = txt(this, x, y + 58, perk.desc, 15, '#d7dcff', { align: 'center', wordWrap: { width: 180 }, strokeThickness: 0 }).setOrigin(0.5).setDepth(102);
      const zone = this.add.zone(x, y, 210, 240).setInteractive({ useHandCursor: true }).setDepth(103);
      zone.on('pointerover', () => { draw(true); icon.setScale(1.15); });
      zone.on('pointerout', () => { draw(false); icon.setScale(1); });
      zone.on('pointerdown', () => this.pickPerk(perk, chapterEnd));
      [g, icon, name, desc].forEach((o, k) => { o.setAlpha(0); this.tweens.add({ targets: o, alpha: 1, duration: 250, delay: 150 + i * 120 }); });
      O.push(g, icon, name, desc, zone);
    });
    Snd.play('perk');
  }

  clearOverlay() {
    this.overlay.forEach((o) => o.destroy());
    this.overlay = [];
  }

  pickPerk(perk, chapterEnd) {
    perk.apply(this);
    Snd.play('upgrade');
    this.clearOverlay();
    this.toast(perk.icon + ' ' + perk.name + ' aktif!');
    if (chapterEnd) { this.nextChapter(); return; }
    this.state = 'build';
    this.countdown = GAME.WAVE_BREAK;
    this.updateHud();
  }

  // =========================================================
  //  PINDAH BAB / LOKASI
  // =========================================================
  nextChapter() {
    this.state = 'moving-chapter';
    const stored = this.towers.map((t) => ({ type: t.type, level: t.level, spent: t.spent, kills: t.kills, targetMode: t.targetMode }));
    const next = BIOMES[this.chapter + 1];
    this.banner('PINDAH LOKASI!', 'Menuju ' + next.name + '... menaramu ikut dikemas', '#80ed99', 2200);
    // menara terbang ke atas
    this.towers.forEach((t, i) => {
      this.tweens.add({ targets: [t.base, t.turret, t.pips], y: '-=600', duration: 700, delay: 300 + i * 60, ease: 'Back.in' });
    });
    this.time.delayedCall(1700, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.restart({
          chapter: this.chapter + 1, coins: this.coins, lives: Math.min(this.lives + GAME.CHAPTER_LIVES, GAME.MAX_LIVES),
          perks: this.perks, stored, score: this.score, kills: this.kills, speed: this.speed
        });
      });
    });
  }

  showIntro() {
    const O = this.overlay = [], cx = GAME.MAP_W / 2, B = this.biome;
    O.push(this.add.rectangle(0, 0, GAME.WIDTH, GAME.HEIGHT, 0x000000, 0.55).setOrigin(0).setDepth(100).setInteractive());
    O.push(panel(this, cx - 300, 96, 600, 440, 0x1b1f45, 0.96, 100, 0xffd166));
    O.push(txt(this, cx, 150, B.sub.toUpperCase(), 20, '#ffd166', { fontFamily: FONT_HEAD }).setOrigin(0.5).setDepth(101));
    const t = txt(this, cx, 192, B.name.toUpperCase(), 46, '#ffffff', { fontFamily: FONT_HEAD, strokeThickness: 8 }).setOrigin(0.5).setDepth(101);
    O.push(t);
    this.tweens.add({ targets: t, scale: { from: 0.6, to: 1 }, duration: 450, ease: 'Back.out' });

    // zombie yang akan muncul di bab ini
    const types = [];
    B.waves.forEach((w) => { w.groups.forEach((g) => { if (!types.includes(g[0])) types.push(g[0]); }); if (w.boss) types.push(w.boss); });
    O.push(txt(this, cx, 240, 'Musuh di sini:', 15, '#adb5bd', { strokeThickness: 0 }).setOrigin(0.5).setDepth(101));
    types.forEach((type, i) => {
      const x = cx - (types.length - 1) * 60 + i * 120, cfg = ZOMBIES[type];
      const img = this.add.image(x, 300, cfg.tex + '_0').setScale(cfg.boss ? 0.62 : 1.15).setDepth(101).setOrigin(0.5, 0.75);
      this.tweens.add({ targets: img, angle: { from: -5, to: 5 }, duration: 400 + i * 50, yoyo: true, repeat: -1 });
      O.push(img);
      O.push(txt(this, x, 336, cfg.name.replace('BOS: ', ''), 13, cfg.boss ? '#ff4d6d' : '#ffffff', { fontFamily: FONT_HEAD, align: 'center', wordWrap: { width: 110 } }).setOrigin(0.5, 0).setDepth(101));
      const tip = this.zombieTip(cfg);
      if (tip) O.push(txt(this, x, 370, tip, 11, '#ffd166', { strokeThickness: 0, align: 'center', wordWrap: { width: 112 } }).setOrigin(0.5, 0).setDepth(101));
    });

    // hal baru di bab ini
    const news = [];
    TOWER_ORDER.forEach((k) => { if (TOWERS[k].unlock === this.chapter + 1 && this.chapter > 0) news.push('Menara baru: ' + TOWERS[k].icon + ' ' + TOWERS[k].name); });
    if (this.chapter + 1 === GAME.ULT_CHAPTER) news.push('Upgrade Level 4 ULTIMATE terbuka!');
    if (this.stored.length) news.push(this.stored.length + ' menaramu ikut pindah & dipasang otomatis');
    if (this.chapter === 0) news.push('Lindungi rumah dari 16 wave di 4 lokasi berbeda!');
    O.push(txt(this, cx, 402, news.join('\n'), 15, '#80ed99', { fontFamily: FONT_HEAD, align: 'center', lineSpacing: 4 }).setOrigin(0.5, 0).setDepth(101));

    const btn = this.introBtn = new Button(this, cx, 500, 220, 46, 'AYO BERTAHAN!', { color: 0xffb703, size: 22, depth: 102, onClick: () => {
      btn.destroy();
      this.clearOverlay();
      this.state = 'build';
      this.countdown = GAME.FIRST_BREAK;
      if (this.stored.length) { this.autoPlace(this.stored); this.toast('Menara dipasang otomatis. Klik menara → PINDAH untuk mengatur ulang (gratis saat jeda)'); }
      this.stored = [];
      this.updateHud();
    } });
  }

  zombieTip(cfg) {
    if (cfg.split) return 'Pecah jadi 3 saat mati';
    if (cfg.regen) return 'Memulihkan HP';
    if (cfg.armor) return 'Berbaju baja';
    if (cfg.fireImmune) return 'Kebal api, lemah es';
    if (cfg.summon) return 'Memanggil anak buah';
    if (cfg.slowResist) return 'Tahan efek lambat';
    if (cfg.speed >= 80) return 'Sangat cepat';
    if (cfg.hp >= 250) return 'HP tebal';
    return '';
  }

  announceBoss(type) {
    this.banner('⚠ ' + ZOMBIES[type].name + ' ⚠', 'Pertahankan rumah!', '#ff4d6d', 2000);
  }

  // =========================================================
  //  PESAN DI LAYAR
  // =========================================================
  banner(title, sub, color, ms) {
    if (this.bannerObjs) this.bannerObjs.forEach((o) => o.destroy());
    const cx = GAME.MAP_W / 2, y = 250;
    const bg = this.add.rectangle(cx, y, GAME.MAP_W, 96, 0x000000, 0.55).setDepth(90);
    const t = txt(this, cx, y - 14, title, 42, color || '#ffffff', { fontFamily: FONT_HEAD, strokeThickness: 8 }).setOrigin(0.5).setDepth(91);
    const s = txt(this, cx, y + 28, sub || '', 17, '#e0e1ff').setOrigin(0.5).setDepth(91);
    const objs = this.bannerObjs = [bg, t, s];
    bg.scaleY = 0;
    this.tweens.add({ targets: bg, scaleY: 1, duration: 200 });
    this.tweens.add({ targets: t, x: { from: cx - 300, to: cx }, alpha: { from: 0, to: 1 }, duration: 350, ease: 'Back.out' });
    this.time.delayedCall(ms || 1500, () => {
      this.tweens.add({ targets: objs, alpha: 0, duration: 300, onComplete: () => objs.forEach((o) => o.destroy()) });
    });
  }

  toast(msg) {
    if (this.toastObj) this.toastObj.destroy();
    const t = txt(this, GAME.MAP_W / 2, GAME.HEIGHT - 30, msg, 15, '#ffffff', { backgroundColor: '#10112acc', padding: { x: 12, y: 6 }, strokeThickness: 0 }).setOrigin(0.5).setDepth(95);
    this.toastObj = t;
    this.tweens.add({ targets: t, y: { from: GAME.HEIGHT, to: GAME.HEIGHT - 30 }, duration: 250, ease: 'Back.out' });
    this.time.delayedCall(2600, () => { if (t.active) this.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() }); });
  }

  // =========================================================
  //  JEDA, KECEPATAN, GAME OVER
  // =========================================================
  toggleSpeed() {
    this.speed = this.speed >= 3 ? 1 : this.speed + 1;
    this.updateHud();
  }

  togglePause() {
    if (this.ended || this.state === 'intro' || this.state === 'perk' || this.state === 'moving-chapter') return;
    this.paused = !this.paused;
    if (this.paused) {
      const cx = GAME.MAP_W / 2;
      const objs = this.pauseObjs = [];
      objs.push(this.add.rectangle(0, 0, GAME.MAP_W, GAME.HEIGHT, 0x000000, 0.6).setOrigin(0).setDepth(100).setInteractive());
      objs.push(txt(this, cx, 220, 'JEDA', 64, '#ffffff', { fontFamily: FONT_HEAD, strokeThickness: 10 }).setOrigin(0.5).setDepth(101));
      objs.push(new Button(this, cx, 320, 240, 50, 'LANJUTKAN', { color: 0x52b788, size: 22, depth: 102, onClick: () => this.togglePause() }));
      objs.push(new Button(this, cx, 384, 240, 50, 'MENU UTAMA', { color: 0xef476f, textColor: '#ffffff', size: 22, depth: 102, onClick: () => { Music.stop(); this.scene.start('Menu'); } }));
      this.tweens.pauseAll();
      this.anims && this.anims.pauseAll();
    } else {
      (this.pauseObjs || []).forEach((o) => o.destroy());
      this.pauseObjs = null;
      this.tweens.resumeAll();
    }
    this.updateHud();
  }

  gameOver(win) {
    if (this.ended) return;
    this.ended = true;
    this.state = 'ended';
    if (win) this.score += this.lives * 200;
    const best = Store.get('best', 0);
    const isBest = this.score > best;
    if (isBest) Store.set('best', this.score);
    Snd.play(win ? 'win' : 'lose');
    Music.stop();
    this.cameras.main.shake(win ? 0 : 600, 0.01);
    this.time.delayedCall(win ? 400 : 900, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameOver', { win, wave: this.globalWave(), score: this.score, kills: this.kills, chapter: this.chapter, best: Math.max(best, this.score), isBest });
      });
    });
  }

  // =========================================================
  //  LOOP UTAMA
  // =========================================================
  update(time, delta) {
    Music.update();
    this.drawFoam();
    if (this.ended) return;
    this.drawGhost();
    this.drawSelection();
    if (this.paused || this.state === 'intro' || this.state === 'perk' || this.state === 'moving-chapter') { this.drawBars(); return; }

    const dt = Math.min(delta, 50) * this.speed;
    this.clock += dt;

    if (this.state === 'build') {
      this.countdown -= dt;
      if (this.countdown <= 0) this.startWave();
    } else if (this.state === 'wave') {
      this.waves.update(dt);
    }

    for (const z of [...this.zombies]) {
      if (z.dead) continue;
      z.update(dt);
      if (!z.dead && z.reachedEnd) { this.hitHouse(z); if (this.ended) return; }
    }
    for (const t of this.towers) t.update(dt, this.zombies);
    for (const p of [...this.projectiles]) {
      p.update(dt);
      if (p.done) { this.projectiles = this.projectiles.filter((o) => o !== p); p.destroy(); }
    }

    if (this.state === 'wave' && this.waves.isDone()) this.waveCleared();

    this.drawBars();
    this.updateHud();
  }

  drawBars() {
    const g = this.bars;
    g.clear();
    let boss = null;
    for (const z of this.zombies) {
      if (z.isBoss) { boss = z; continue; }
      if (z.hp >= z.maxHp) continue;
      const w = 30 * z.baseScale, x = z.x - w / 2, y = z.y - z.displayHeight * 0.82 - 4;
      const p = Math.max(z.hp, 0) / z.maxHp;
      g.fillStyle(0x000000, 0.7); g.fillRoundedRect(x - 1.5, y - 1.5, w + 3, 7, 3);
      g.fillStyle(p > 0.5 ? 0x80ed99 : p > 0.25 ? 0xffd166 : 0xef476f, 1); g.fillRoundedRect(x, y, Math.max(w * p, 2), 4, 2);
      if (z.armor) { g.fillStyle(0xadb5bd, 1); g.fillRect(x, y + 4, w, 1.5); }
    }
    // bar HP bos di atas layar
    const bg = this.bossGfx;
    bg.clear();
    if (boss) {
      const W = 360, x = GAME.MAP_W / 2 - W / 2, y = GAME.HUD_H + 28, p = Math.max(boss.hp, 0) / boss.maxHp;
      bg.fillStyle(0x000000, 0.7); bg.fillRoundedRect(x - 4, y - 4, W + 8, 20, 8);
      bg.fillStyle(0x590d22, 1); bg.fillRoundedRect(x, y, W, 12, 5);
      bg.fillStyle(0xff4d6d, 1); bg.fillRoundedRect(x, y, Math.max(W * p, 4), 12, 5);
      bg.fillStyle(0xffffff, 0.3); bg.fillRoundedRect(x, y, Math.max(W * p, 4), 4, 2);
      this.bossName.setVisible(true).setText(boss.cfg.name + '  ' + Math.ceil(Math.max(boss.hp, 0)).toLocaleString('id-ID') + ' / ' + boss.maxHp.toLocaleString('id-ID'));
    } else this.bossName.setVisible(false);
  }

  drawSelection() {
    const g = this.selGfx;
    g.clear();
    const t = this.selected;
    if (!t || !t.active || this.mode === 'move') return;
    const r = t.getRange(), pulse = 1 + Math.sin(this.time.now / 200) * 0.05;
    g.fillStyle(0xffffff, 0.07); g.fillCircle(t.x, t.y, r);
    g.lineStyle(2, 0xffd166, 0.9); g.strokeCircle(t.x, t.y, r);
    g.lineStyle(3, 0xffd166, 0.9); g.strokeEllipse(t.x, t.y + 6, 56 * pulse, 30 * pulse);
  }

  drawGhost() {
    const g = this.ghostGfx;
    g.clear();
    if (this.mode === 'none' || !this.canInteract()) { this.ghostBase.setVisible(false); this.ghostTop.setVisible(false); return; }
    const p = this.input.activePointer;
    if (p.x >= GAME.MAP_W) { this.ghostBase.setVisible(false); this.ghostTop.setVisible(false); return; }
    let type, level, ok;
    if (this.mode === 'build') {
      type = this.buildType; level = 1;
      ok = this.canPlace(p.worldX, p.worldY) && this.coins >= this.towerCost(type);
      this.ghostBase.setTexture('tb_' + type + '_1'); this.ghostTop.setTexture('tt_' + type + '_1');
    } else {
      const t = this.selected; if (!t) return;
      type = t.type; level = t.level;
      ok = this.canPlace(p.worldX, p.worldY, t);
      g.lineStyle(2, 0xffffff, 0.5); g.lineBetween(t.x, t.y, p.worldX, p.worldY);
    }
    const r = TOWERS[type].levels[level - 1].range * this.perks.range;
    g.fillStyle(ok ? 0x80ed99 : 0xef476f, 0.12); g.fillCircle(p.worldX, p.worldY, r);
    g.lineStyle(2, ok ? 0x80ed99 : 0xef476f, 0.9); g.strokeCircle(p.worldX, p.worldY, r);
    this.ghostBase.setVisible(true).setPosition(p.worldX, p.worldY).setTint(ok ? 0xffffff : 0xff8080);
    this.ghostTop.setVisible(true).setPosition(p.worldX, p.worldY - 4).setTint(ok ? 0xffffff : 0xff8080);
  }
}
