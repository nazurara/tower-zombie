// Tombol kartun dengan efek timbul, hover dan klik
class Button {
  constructor(scene, x, y, w, h, label, opts) {
    opts = opts || {};
    this.scene = scene;
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.color = opts.color !== undefined ? opts.color : 0xffb703;
    this.textColor = opts.textColor || '#1d1b2b';
    this.enabled = true;
    this.hover = false;
    this.down = false;
    this.onClick = opts.onClick;
    const depth = opts.depth || 80;
    this.g = scene.add.graphics().setDepth(depth);
    this.t = scene.add.text(x, y, label, {
      fontFamily: opts.font || FONT_HEAD, fontSize: (opts.size || 18) + 'px', color: this.textColor, align: 'center'
    }).setOrigin(0.5).setDepth(depth + 0.1);
    this.zone = scene.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).setDepth(depth + 0.2);
    this.zone.on('pointerover', () => { this.hover = true; this.draw(); if (opts.onHover) opts.onHover(true); });
    this.zone.on('pointerout', () => { this.hover = false; this.down = false; this.draw(); if (opts.onHover) opts.onHover(false); });
    this.zone.on('pointerdown', (p) => {
      if (!this.enabled) { Snd.play('error'); return; }
      this.down = true; this.draw();
    });
    this.zone.on('pointerup', () => {
      if (!this.down) return;
      this.down = false; this.draw();
      if (this.enabled && this.onClick) { Snd.play('click'); this.onClick(); }
    });
    this.draw();
  }

  draw() {
    const g = this.g, x = this.x - this.w / 2, y = this.y - this.h / 2, w = this.w, h = this.h;
    const base = this.enabled ? this.color : 0x6c757d;
    const c = Phaser.Display.Color.IntegerToColor(base);
    const light = this.hover && this.enabled ? c.clone().lighten(12).color : base;
    const dark = c.clone().darken(25).color;
    const press = this.down ? 3 : 0;
    g.clear();
    g.fillStyle(0x000000, 0.35); g.fillRoundedRect(x, y + 4, w, h, 10);
    g.fillStyle(dark, 1); g.fillRoundedRect(x, y + press, w, h, 10);
    g.fillStyle(light, 1); g.fillRoundedRect(x, y + press, w, h - 4, 10);
    g.fillStyle(0xffffff, 0.22); g.fillRoundedRect(x + 4, y + press + 3, w - 8, (h - 4) * 0.4, 7);
    g.lineStyle(2, 0x1d1b2b, 1); g.strokeRoundedRect(x, y + press, w, h, 10);
    this.t.setY(this.y - 2 + press);
    this.t.setColor(this.enabled ? this.textColor : '#ced4da');
  }

  setLabel(s) { if (this.t.text !== s) this.t.setText(s); return this; }
  setColor(c) { if (this.color !== c) { this.color = c; this.draw(); } return this; }
  setEnabled(v) { if (this.enabled !== v) { this.enabled = v; this.draw(); } return this; }
  setVisible(v) {
    this.g.setVisible(v); this.t.setVisible(v);
    if (v) this.zone.setInteractive(); else { this.zone.disableInteractive(); this.hover = false; this.down = false; }
    this.visible = v;
    if (v) this.draw();
    return this;
  }
  setDepth(d) { this.g.setDepth(d); this.t.setDepth(d + 0.1); this.zone.setDepth(d + 0.2); return this; }
  destroy() { this.g.destroy(); this.t.destroy(); this.zone.destroy(); }
}

// Panel kotak bulat sederhana
function panel(scene, x, y, w, h, color, alpha, depth, border) {
  const g = scene.add.graphics().setDepth(depth || 70);
  g.fillStyle(0x000000, 0.35); g.fillRoundedRect(x + 3, y + 5, w, h, 14);
  g.fillStyle(color, alpha === undefined ? 1 : alpha); g.fillRoundedRect(x, y, w, h, 14);
  g.lineStyle(3, border || 0x1d1b2b, 1); g.strokeRoundedRect(x, y, w, h, 14);
  return g;
}
