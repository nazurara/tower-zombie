// Panel kanan: toko menara, info menara terpilih, dan tombol kontrol
class Sidebar {
  constructor(scene) {
    this.s = scene;
    const X = GAME.MAP_W, W = GAME.WIDTH - GAME.MAP_W, H = GAME.HEIGHT;
    this.X = X; this.W = W; this.cx = X + W / 2;
    const D = 70;

    // latar panel kayu-logam
    const bg = scene.add.graphics().setDepth(D);
    bg.fillGradientStyle(0x2b2d55, 0x2b2d55, 0x161730, 0x161730, 1);
    bg.fillRect(X, 0, W, H);
    bg.fillStyle(0x000000, 0.35); bg.fillRect(X, 0, 5, H);
    bg.lineStyle(3, 0x1d1b2b, 1); bg.lineBetween(X + 1, 0, X + 1, H);

    txt(scene, this.cx, 20, 'MENARA', 22, '#ffd166', { fontFamily: FONT_HEAD }).setOrigin(0.5).setDepth(D + 1);

    // kartu menara
    this.cards = [];
    TOWER_ORDER.forEach((type, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const cx = X + 50 + col * 92, cy = 86 + row * 88;
      this.cards.push(this.makeCard(type, cx, cy, i + 1));
    });

    // area info
    this.infoBg = panel(scene, X + 8, 318, W - 16, 248, 0x0f1027, 0.75, D, 0x3d3f7a);
    this.infoObjs = [];

    this.targetBtn = new Button(scene, this.cx, 456, W - 34, 30, '', { color: 0x5c6bc0, textColor: '#ffffff', size: 15, onClick: () => scene.cycleTarget(), depth: D + 2 });
    this.upBtn = new Button(scene, this.cx, 494, W - 34, 36, '', { color: 0x52b788, size: 17, onClick: () => scene.upgradeSelected(), depth: D + 2 });
    this.moveBtn = new Button(scene, X + 52, 538, 74, 32, 'PINDAH', { color: 0x4cc9f0, size: 15, onClick: () => scene.startMove(), depth: D + 2 });
    this.sellBtn = new Button(scene, X + 140, 538, 86, 32, 'JUAL', { color: 0xef476f, textColor: '#ffffff', size: 15, onClick: () => scene.sellSelected(), depth: D + 2 });

    // tombol kontrol bawah
    this.waveBtn = new Button(scene, this.cx, 592, W - 20, 36, '', { color: 0xff4d6d, textColor: '#ffffff', size: 17, onClick: () => scene.callWave(), depth: D + 2 });
    this.speedBtn = new Button(scene, X + 36, 624, 56, 24, '1x', { color: 0xffd166, size: 14, onClick: () => scene.toggleSpeed(), depth: D + 2 });
    this.pauseBtn = new Button(scene, X + 96, 624, 56, 24, 'JEDA', { color: 0xadb5bd, size: 14, onClick: () => scene.togglePause(), depth: D + 2 });
    this.muteBtn = new Button(scene, X + 156, 624, 56, 24, Snd.muted ? '🔇' : '🔊', { color: 0xadb5bd, size: 14, font: FONT_BODY, onClick: () => { this.muteBtn.setLabel(Snd.toggleMute() ? '🔇' : '🔊'); }, depth: D + 2 });

    this.hoverType = null;
    this.lastKey = '';
  }

  makeCard(type, cx, cy, hotkey) {
    const s = this.s, D = 71, def = TOWERS[type];
    const c = { type, cx, cy };
    c.g = s.add.graphics().setDepth(D);
    c.base = s.add.image(cx, cy - 8, 'tb_' + type + '_1').setScale(0.8).setDepth(D + 1);
    c.top = s.add.image(cx, cy - 11, 'tt_' + type + '_1').setScale(0.8).setDepth(D + 1.1);
    c.coin = s.add.image(cx - 22, cy + 27, 'i_coin').setScale(0.6).setDepth(D + 1);
    c.price = txt(s, cx - 13, cy + 27, '', 14, '#ffd166', { fontFamily: FONT_HEAD }).setOrigin(0, 0.5).setDepth(D + 1);
    c.key = txt(s, cx - 34, cy - 32, String(hotkey), 11, '#adb5bd').setOrigin(0.5).setDepth(D + 1);
    c.lock = s.add.image(cx, cy - 10, 'i_lock').setDepth(D + 2);
    c.lockTxt = txt(s, cx, cy + 27, 'Bab ' + def.unlock, 13, '#adb5bd', { fontFamily: FONT_HEAD }).setOrigin(0.5).setDepth(D + 2);
    c.zone = s.add.zone(cx, cy, 84, 80).setInteractive({ useHandCursor: true }).setDepth(D + 3);
    c.zone.on('pointerover', () => { this.hoverType = type; c.hover = true; this.drawCard(c); this.refresh(true); });
    c.zone.on('pointerout', () => { if (this.hoverType === type) this.hoverType = null; c.hover = false; this.drawCard(c); this.refresh(true); });
    c.zone.on('pointerdown', () => s.chooseBuild(type));
    return c;
  }

  drawCard(c) {
    const s = this.s, g = c.g;
    const unlocked = s.isUnlocked(c.type);
    const cost = s.towerCost(c.type);
    const afford = s.coins >= cost;
    const sel = s.mode === 'build' && s.buildType === c.type;
    const x = c.cx - 42, y = c.cy - 40;
    g.clear();
    g.fillStyle(0x000000, 0.35); g.fillRoundedRect(x + 2, y + 4, 84, 80, 12);
    const fill = !unlocked ? 0x2a2a3a : sel ? 0x3a6ea5 : c.hover ? 0x3d4280 : 0x2f3266;
    g.fillStyle(fill, 1); g.fillRoundedRect(x, y, 84, 80, 12);
    g.fillStyle(TOWERS[c.type].color, unlocked ? 0.25 : 0.08); g.fillRoundedRect(x + 4, y + 4, 76, 52, 9);
    g.lineStyle(sel ? 3 : 2, sel ? 0xffd166 : (unlocked && afford ? 0x6c72c9 : 0x1d1b2b), 1);
    g.strokeRoundedRect(x, y, 84, 80, 12);
    c.base.setVisible(unlocked); c.top.setVisible(unlocked);
    c.base.setAlpha(afford ? 1 : 0.45); c.top.setAlpha(afford ? 1 : 0.45);
    c.coin.setVisible(unlocked); c.price.setVisible(unlocked);
    c.lock.setVisible(!unlocked); c.lockTxt.setVisible(!unlocked);
    c.price.setText(String(cost)).setColor(afford ? '#ffd166' : '#ff6b6b');
  }

  clearInfo() {
    this.infoObjs.forEach((o) => o.destroy());
    this.infoObjs = [];
  }

  addInfo(obj) { this.infoObjs.push(obj.setDepth(72)); return obj; }

  statLine(y, label, now, next) {
    const s = this.s, X = this.X;
    this.addInfo(txt(s, X + 18, y, label, 13, '#adb5bd', { strokeThickness: 0 }));
    const v = this.addInfo(txt(s, X + 104, y, String(now), 14, '#ffffff', { fontFamily: FONT_HEAD, strokeThickness: 0 }));
    if (next !== undefined && next !== null && String(next) !== String(now)) {
      this.addInfo(txt(s, v.x + v.width + 4, y, '→ ' + next, 14, '#80ed99', { fontFamily: FONT_HEAD, strokeThickness: 0 }));
    }
  }

  fmtRate(ms) { return (1000 / ms).toFixed(1); }

  special(type, st, perks) {
    switch (type) {
      case 'cannon': return ['Ledakan', Math.round(st.splash)];
      case 'frost': return ['Lambat', Math.round(st.slow * 100) + '%'];
      case 'flame': return ['Bakar/dtk', Math.round(st.burn * perks.burn)];
      case 'tesla': return ['Rantai', st.chains + perks.chains];
      case 'sniper': return ['Target', 'Terkuat'];
      default: return null;
    }
  }

  // force = gambar ulang walaupun tidak ada yang berubah
  refresh(force) {
    const s = this.s, X = this.X, W = this.W;
    this.cards.forEach((c) => this.drawCard(c));

    const t = s.selected;
    const showType = !t ? (this.hoverType || (s.mode === 'build' ? s.buildType : null)) : null;
    const key = [t ? t.type + t.level + t.targetMode + t.kills + (t.canUpgrade() && s.coins >= t.upgradeCost()) + s.state : '', showType, s.mode, s.chapter, Math.round(s.perks.damage * 100), Math.round(s.perks.range * 100), Math.round(s.perks.rate * 100), s.perks.chains].join('|');
    const tower = !!t;
    this.targetBtn.setVisible(tower); this.upBtn.setVisible(tower); this.moveBtn.setVisible(tower); this.sellBtn.setVisible(tower);
    if (tower) {
      const mode = TARGET_MODES.find((m) => m.key === t.targetMode);
      this.targetBtn.setLabel('🎯 Target: ' + mode.label).setVisible(t.type !== 'flame' || true);
      if (t.canUpgrade()) {
        const c = t.upgradeCost();
        this.upBtn.setLabel((t.level === 3 ? 'ULTIMATE  ' : 'UPGRADE  ') + c + ' 🪙').setEnabled(s.coins >= c).setColor(t.level === 3 ? 0xff4d6d : 0x52b788);
      } else if (t.lockedUlt()) {
        this.upBtn.setLabel('Lv4 di Bab ' + GAME.ULT_CHAPTER).setEnabled(false);
      } else {
        this.upBtn.setLabel('LEVEL MAKS ★').setEnabled(false);
      }
      this.sellBtn.setLabel('JUAL +' + t.sellValue());
      this.moveBtn.setLabel(s.state === 'wave' ? 'PINDAH ' + GAME.MOVE_FEE : 'PINDAH');
    }
    if (!force && key === this.lastKey) return;
    this.lastKey = key;
    this.clearInfo();

    if (t) {
      const st = t.stats(), nx = t.canUpgrade() ? t.def.levels[t.level] : null, P = s.perks;
      this.addInfo(txt(s, X + 18, 328, t.def.name, 19, '#ffffff', { fontFamily: FONT_HEAD }));
      for (let i = 0; i < 4; i++) this.addInfo(s.add.image(X + 24 + i * 18, 362, i < t.level ? 'i_star' : 'i_star_off').setScale(0.85));
      this.addInfo(txt(s, X + W - 18, 362, '💀 ' + t.kills, 13, '#ffffff', { strokeThickness: 0 }).setOrigin(1, 0.5));
      this.statLine(376, 'Damage', Math.round(st.damage * P.damage), nx ? Math.round(nx.damage * P.damage) : null);
      this.statLine(394, 'Jangkauan', Math.round(st.range * P.range), nx ? Math.round(nx.range * P.range) : null);
      this.statLine(412, 'Tembak/dtk', this.fmtRate(st.rate * P.rate), nx ? this.fmtRate(nx.rate * P.rate) : null);
      const sp = this.special(t.type, st, P);
      if (sp) {
        const spn = nx ? this.special(t.type, nx, P) : null;
        this.statLine(430, sp[0], sp[1], spn ? spn[1] : null);
      }
      const ult = t.level === 4 ? st.ult : (t.level === 3 ? t.def.levels[3].ult : null);
      if (ult && !sp) this.addInfo(txt(s, X + 18, 430, '★ ' + ult, 11, '#ff8fab', { strokeThickness: 0, wordWrap: { width: W - 36 } }));
      return;
    }

    if (showType) {
      const def = TOWERS[showType], st = def.levels[0];
      const unlocked = s.isUnlocked(showType);
      this.addInfo(txt(s, X + 18, 328, def.icon + ' ' + def.name, 18, '#ffffff', { fontFamily: FONT_HEAD }));
      this.addInfo(txt(s, X + 18, 356, def.desc, 13, '#cfd2ff', { strokeThickness: 0, wordWrap: { width: W - 36 } }));
      this.statLine(412, 'Damage', Math.round(st.damage * s.perks.damage));
      this.statLine(430, 'Jangkauan', Math.round(st.range * s.perks.range));
      this.statLine(448, 'Tembak/dtk', this.fmtRate(st.rate * s.perks.rate));
      const sp = this.special(showType, st, s.perks);
      if (sp) this.statLine(466, sp[0], sp[1]);
      this.addInfo(txt(s, X + 18, 492, '★ Lv4: ' + def.levels[3].ult, 12, '#ff8fab', { strokeThickness: 0, wordWrap: { width: W - 36 } }));
      if (!unlocked) this.addInfo(txt(s, this.cx, 540, '🔒 Terbuka di Bab ' + def.unlock, 15, '#ffd166', { fontFamily: FONT_HEAD }).setOrigin(0.5));
      else if (s.mode === 'build') this.addInfo(txt(s, this.cx, 540, 'Klik di peta untuk menaruh\nKlik kanan / Esc batal', 12, '#80ed99', { align: 'center', strokeThickness: 0 }).setOrigin(0.5));
      return;
    }

    // petunjuk umum
    this.addInfo(txt(s, X + 18, 330, 'CARA MAIN', 17, '#ffd166', { fontFamily: FONT_HEAD }));
    const tips = [
      '• Pilih kartu, klik peta untuk membangun.',
      '• Klik menara: upgrade, target, pindah, jual.',
      '• Tiap 4 wave pindah lokasi, menara ikut!',
      '• Mulai wave lebih cepat = bonus koin.'
    ];
    this.addInfo(txt(s, X + 18, 356, tips.join('\n'), 12, '#e0e1ff', { strokeThickness: 0, wordWrap: { width: W - 34 }, lineSpacing: 4 }));
    this.addInfo(txt(s, X + 18, 508, 'Tombol: 1-6 menara · U upgrade\nG pindah · X jual · T target\nN wave · F cepat · Spasi jeda', 11, '#8d91c7', { strokeThickness: 0, lineSpacing: 3 }));
  }

  updateControls() {
    const s = this.s;
    if (s.state === 'build') {
      const bonus = s.earlyBonus();
      this.waveBtn.setLabel('▶ WAVE ' + (s.globalWave() + 1) + (bonus > 0 ? '  +' + bonus + '🪙' : '')).setEnabled(true);
    } else if (s.state === 'wave') {
      this.waveBtn.setLabel('WAVE BERJALAN...').setEnabled(false);
    } else {
      this.waveBtn.setLabel('...').setEnabled(false);
    }
    this.speedBtn.setLabel(s.speed + 'x').setColor(s.speed === 1 ? 0xffd166 : s.speed === 2 ? 0xff9f1c : 0xff4d6d);
    this.pauseBtn.setLabel(s.paused ? 'LANJUT' : 'JEDA');
  }
}
