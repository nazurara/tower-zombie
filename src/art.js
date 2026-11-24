// =============================================================
//  GRAFIS — semua gambar dibuat lewat kode (Canvas 2D), jadi game
//  langsung jalan tanpa file gambar. Untuk memakai gambar asli,
//  muat di BootScene.preload() dengan key yang sama, lalu hapus
//  baris pembuat tekstur yang sesuai di Art.build().
// =============================================================
const OUT = '#1d1b2b'; // warna garis tepi

function hex(c) { return '#' + c.toString(16).padStart(6, '0'); }
function shade(c, amt) { // amt -1..1 (gelap..terang)
  let r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

const Art = {
  scene: null,

  canvas(key, w, h, draw) {
    if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
    const t = this.scene.textures.createCanvas(key, w, h);
    const ctx = t.getContext();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    draw(ctx, w, h);
    t.refresh();
  },

  // ---------- bentuk dasar ----------
  circ(ctx, x, y, r, fill, stroke, lw) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
  },
  ell(ctx, x, y, rx, ry, fill, stroke, lw, rot) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
  },
  rr(ctx, x, y, w, h, r, fill, stroke, lw) {
    ctx.beginPath();
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
  },
  poly(ctx, pts, fill, stroke, lw) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
  },
  line(ctx, x1, y1, x2, y2, color, lw) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = color; ctx.lineWidth = lw || 2; ctx.stroke();
  },
  radial(ctx, x, y, r, stops) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    stops.forEach((s) => g.addColorStop(s[0], s[1]));
    return g;
  },

  build(scene) {
    this.scene = scene;
    this.particles();
    this.grounds();
    this.zombies();
    this.towers();
    this.houses();
    this.decor();
    this.ui();
  },

  // =========================================================
  //  PARTIKEL & PROYEKTIL
  // =========================================================
  particles() {
    this.canvas('p_soft', 32, 32, (c) => {
      c.fillStyle = this.radial(c, 16, 16, 16, [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,0.6)'], [1, 'rgba(255,255,255,0)']]);
      c.fillRect(0, 0, 32, 32);
    });
    this.canvas('p_glow', 128, 128, (c) => {
      c.fillStyle = this.radial(c, 64, 64, 64, [[0, 'rgba(255,255,255,0.9)'], [0.3, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]);
      c.fillRect(0, 0, 128, 128);
    });
    this.canvas('p_spark', 8, 8, (c) => { this.circ(c, 4, 4, 3, '#ffffff'); });
    this.canvas('p_square', 6, 6, (c) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, 6, 6); });
    this.canvas('p_flake', 12, 12, (c) => {
      for (let i = 0; i < 3; i++) {
        const a = i * Math.PI / 3;
        this.line(c, 6 - Math.cos(a) * 5, 6 - Math.sin(a) * 5, 6 + Math.cos(a) * 5, 6 + Math.sin(a) * 5, '#ffffff', 1.6);
      }
    });
    this.canvas('p_leaf', 12, 8, (c) => { this.ell(c, 6, 4, 5, 2.6, '#ffffff', null, 0, 0.3); });

    this.canvas('pr_bullet', 12, 12, (c) => {
      this.circ(c, 6, 6, 5, '#ffb703', OUT, 1.5); this.circ(c, 5, 5, 2, '#fff3b0');
    });
    this.canvas('pr_shell', 18, 18, (c) => {
      this.circ(c, 9, 9, 7, '#2b2d42', OUT, 2); this.circ(c, 6.5, 6.5, 2.5, '#8d99ae');
      this.line(c, 9, 2, 11, -1, '#ffb703', 2);
    });
    this.canvas('pr_ice', 16, 16, (c) => {
      this.poly(c, [8, 0, 15, 8, 8, 16, 1, 8], '#80deea', '#006064', 1.5);
      this.poly(c, [8, 3, 11, 8, 8, 12, 5, 8], '#e0f7fa');
    });

    // bercak sisa zombie (memudar perlahan)
    for (let v = 0; v < 3; v++) {
      this.canvas('splat' + v, 48, 34, (c) => {
        const rng = makeRng(40 + v);
        c.fillStyle = 'rgba(46,72,30,0.75)';
        for (let i = 0; i < 9; i++) {
          c.beginPath(); c.ellipse(24 + (rng() - 0.5) * 26, 17 + (rng() - 0.5) * 14, 4 + rng() * 9, 3 + rng() * 6, 0, 0, Math.PI * 2); c.fill();
        }
        c.fillStyle = 'rgba(110,20,20,0.5)';
        for (let i = 0; i < 4; i++) {
          c.beginPath(); c.arc(24 + (rng() - 0.5) * 30, 17 + (rng() - 0.5) * 18, 1.5 + rng() * 3, 0, Math.PI * 2); c.fill();
        }
      });
    }

    // portal tempat zombie muncul
    this.canvas('portal', 84, 84, (c) => {
      c.fillStyle = this.radial(c, 42, 42, 42, [[0, 'rgba(20,0,30,1)'], [0.45, 'rgba(110,30,160,0.95)'], [0.75, 'rgba(120,255,120,0.5)'], [1, 'rgba(120,255,120,0)']]);
      c.fillRect(0, 0, 84, 84);
      c.strokeStyle = 'rgba(200,255,180,0.8)'; c.lineWidth = 2.5;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        for (let t = 0; t < 1; t += 0.02) {
          const a = i * Math.PI / 2 + t * 4.5, r = 6 + t * 28;
          const x = 42 + Math.cos(a) * r, y = 42 + Math.sin(a) * r;
          if (t === 0) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke();
      }
    });

    this.canvas('vignette', GAME.MAP_W, GAME.HEIGHT, (c, w, h) => {
      const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    });
  },

  // =========================================================
  //  TANAH tiap bioma
  // =========================================================
  grounds() {
    const tile = (key, base, spots, extra) => {
      this.canvas(key, 128, 128, (c) => {
        c.fillStyle = base; c.fillRect(0, 0, 128, 128);
        const rng = makeRng(key.length * 7 + 3);
        spots.forEach((s) => {
          for (let i = 0; i < s.n; i++) {
            const x = rng() * 128, y = rng() * 128;
            c.fillStyle = s.color;
            if (s.shape === 'blade') { c.fillRect(x, y, 1.6, 3 + rng() * 4); }
            else if (s.shape === 'blob') { c.beginPath(); c.ellipse(x, y, s.r * (0.6 + rng()), s.r * (0.4 + rng() * 0.6), rng() * 3, 0, Math.PI * 2); c.fill(); }
            else { c.beginPath(); c.arc(x, y, s.r * (0.5 + rng() * 0.7), 0, Math.PI * 2); c.fill(); }
          }
        });
        if (extra) extra(c, rng);
      });
    };
    tile('g_grass', '#5aa64b', [
      { n: 14, color: 'rgba(80,160,70,0.6)', shape: 'blob', r: 12 },
      { n: 10, color: 'rgba(70,140,60,0.5)', shape: 'blob', r: 10 },
      { n: 160, color: '#6fbf5a', shape: 'blade' }, { n: 120, color: '#4a9140', shape: 'blade' },
      { n: 20, color: '#86d16f', shape: 'dot', r: 1.5 }
    ]);
    tile('g_sand', '#efd59a', [
      { n: 12, color: 'rgba(230,200,140,0.7)', shape: 'blob', r: 14 },
      { n: 10, color: 'rgba(255,236,190,0.6)', shape: 'blob', r: 12 },
      { n: 140, color: '#dcbf82', shape: 'dot', r: 1.2 }, { n: 70, color: '#fff4d6', shape: 'dot', r: 1 }
    ]);
    tile('g_snow', '#eaf3fb', [
      { n: 12, color: 'rgba(205,224,242,0.7)', shape: 'blob', r: 16 },
      { n: 8, color: 'rgba(255,255,255,0.9)', shape: 'blob', r: 12 },
      { n: 70, color: '#d3e3f2', shape: 'dot', r: 1.4 }, { n: 40, color: '#ffffff', shape: 'dot', r: 1.2 }
    ]);
    tile('g_ash', '#3b302b', [
      { n: 14, color: 'rgba(55,44,40,0.8)', shape: 'blob', r: 14 },
      { n: 10, color: 'rgba(30,24,22,0.6)', shape: 'blob', r: 10 },
      { n: 120, color: '#4b3e38', shape: 'dot', r: 1.4 }, { n: 16, color: 'rgba(255,110,0,0.55)', shape: 'dot', r: 1.1 }
    ], (c, rng) => {
      c.strokeStyle = 'rgba(255,90,0,0.35)'; c.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) {
        let x = rng() * 128, y = rng() * 128;
        c.beginPath(); c.moveTo(x, y);
        for (let j = 0; j < 4; j++) { x += (rng() - 0.5) * 24; y += (rng() - 0.5) * 24; c.lineTo(x, y); }
        c.stroke();
      }
    });
  },

  // =========================================================
  //  ZOMBIE (2 frame jalan: _0 dan _1)
  // =========================================================
  humanoid(c, p, f) {
    const A = this;
    A.ell(c, 24, 54, 15, 4, 'rgba(0,0,0,0.3)');
    if (p.board) { // papan selancar di punggung
      c.save(); c.translate(9, 30); c.rotate(-0.25);
      A.ell(c, 0, 0, 5.5, 21, p.board, OUT, 2); A.line(c, 0, -18, 0, 18, '#ffffff', 1.5);
      c.restore();
    }
    if (p.cape) A.poly(c, [12, 20, 36, 20, 40, 50, 8, 50], p.cape, OUT, 2);
    // kaki
    const lx = f ? 16.5 : 13, rx = f ? 24.5 : 28, lift = f ? -1 : 0;
    A.rr(c, lx, 37, 7, 14 + lift, 2, p.pants, OUT, 1.6);
    A.rr(c, rx, 37 + (f ? 0 : -1), 7, 14, 2, shade(parseInt(p.pants.slice(1), 16), -0.15), OUT, 1.6);
    A.rr(c, lx - 1, 48 + lift, 9, 4, 1.5, p.shoe || '#2b2118');
    A.rr(c, rx - 1, 48 + (f ? 0 : -1), 9, 4, 1.5, p.shoe || '#2b2118');
    if (p.ski) { A.rr(c, lx - 6, 51 + lift, 19, 2.5, 1, '#e63946'); A.rr(c, rx - 4, 51, 19, 2.5, 1, '#e63946'); }
    // badan
    const bw = p.fat ? 30 : 24, bx = 24 - bw / 2;
    A.rr(c, bx, 19, bw, 21, 5, p.shirt, OUT, 2);
    if (p.fat) A.ell(c, 25, 32, 9, 7, p.skin, 'rgba(0,0,0,0.25)', 1);
    if (p.stripe) { c.fillStyle = p.stripe; for (let y = 23; y < 38; y += 5) c.fillRect(bx + 2, y, bw - 4, 2); }
    if (p.overall) { A.rr(c, bx + 4, 27, bw - 8, 13, 2, p.overall, OUT, 1.5); A.line(c, bx + 6, 20, bx + 6, 28, p.overall, 3); A.line(c, bx + bw - 6, 20, bx + bw - 6, 28, p.overall, 3); }
    if (p.armor) {
      A.rr(c, bx + 1, 20, bw - 2, 19, 4, '#9aa5b1', OUT, 1.8);
      A.rr(c, bx + 3, 22, bw - 12, 5, 2, '#cfd8dc');
      [[bx + 4, 35], [bx + bw - 4, 35], [24, 30]].forEach((q) => A.circ(c, q[0], q[1], 1.3, '#5c6770'));
    }
    if (p.buttons) { [24, 29, 34].forEach((y) => A.circ(c, 24, y, 1.4, p.buttons)); }
    // ujung baju robek
    c.fillStyle = p.overall || p.shirt;
    if (!p.armor) for (let i = 0; i < 3; i++) A.poly(c, [bx + 2 + i * (bw / 3), 39, bx + 6 + i * (bw / 3), 39, bx + 4 + i * (bw / 3), 44], p.shirt);
    if (p.cracks) {
      c.save(); c.shadowColor = p.cracks; c.shadowBlur = 6;
      A.line(c, 16, 23, 21, 29, p.cracks, 1.6); A.line(c, 21, 29, 18, 35, p.cracks, 1.6); A.line(c, 29, 22, 27, 31, p.cracks, 1.6);
      c.restore();
    }
    if (p.wound !== false && !p.armor) { A.rr(c, bx + 3, 25, 5, 3, 1, '#8b1a1a'); A.rr(c, bx + bw - 9, 32, 4, 3, 1, '#8b1a1a'); }
    if (p.scarf) { A.rr(c, 14, 18.5, 20, 4.5, 2, p.scarf, OUT, 1.2); A.rr(c, 15, 21, 4.5, 10, 2, p.scarf, OUT, 1.2); }
    // tangan menjulur ke depan
    const a1 = f ? 21.5 : 23.5, a2 = f ? 29.5 : 27.5;
    const armC = p.sleeve || p.skin;
    A.rr(c, 30, a1, 15, 6, 3, armC, OUT, 1.6); A.circ(c, 45, a1 + 3, 3.4, p.skin, OUT, 1.4);
    A.rr(c, 28, a2, 14, 6, 3, armC, OUT, 1.6); A.circ(c, 42.5, a2 + 3, 3.4, p.skin, OUT, 1.4);
    // kepala
    A.circ(c, 24, 13, 11, p.skin, OUT, 2.2);
    A.ell(c, 19, 9, 3.5, 2.2, 'rgba(255,255,255,0.18)');
    if (!p.hat && p.hair) { A.rr(c, 14, 2, 19, 6, 3, p.hair); A.poly(c, [14, 6, 17, 6, 15, 10], p.hair); A.poly(c, [29, 6, 33, 6, 32, 10], p.hair); }
    // mata
    const ey = 12, eye = p.eye || '#d00000';
    if (p.goggles) {
      A.rr(c, 13, 5, 22, 3, 1, '#222');
      A.circ(c, 19.5, 6.5, 3.2, '#4cc9f0', OUT, 1.2); A.circ(c, 28.5, 6.5, 3.2, '#4cc9f0', OUT, 1.2);
    }
    A.circ(c, 19.5, ey, 3.8, '#fff8e1', OUT, 1); A.circ(c, 28.5, ey, 3.8, '#fff8e1', OUT, 1);
    if (p.glowEye) { c.save(); c.shadowColor = eye; c.shadowBlur = 6; }
    A.circ(c, 20.6, ey, 1.9, eye); A.circ(c, 29.6, ey, 1.9, eye);
    if (p.glowEye) c.restore();
    // mulut
    A.rr(c, 19, 17.5, 11, 4, 1.5, '#3a0d0d');
    c.fillStyle = '#ffffff'; c.fillRect(20, 17.5, 2, 2); c.fillRect(23.5, 17.5, 2, 2); c.fillRect(27, 17.5, 2, 2);
    if (p.beard) A.poly(c, [16, 18, 32, 18, 30, 25, 24, 28, 18, 25], p.beard, OUT, 1.4);
    // topi
    if (p.hat === 'sailor') { A.rr(c, 13, 0, 22, 7, 3, '#ffffff', OUT, 1.6); A.rr(c, 13, 5, 22, 2.5, 1, '#1d3557'); }
    if (p.hat === 'captain') { A.rr(c, 11, 0, 26, 6, 2, '#1d3557', OUT, 1.6); A.rr(c, 9, 5, 30, 3, 1.5, '#0b1a30', OUT, 1.2); A.circ(c, 24, 3, 2, '#ffd166'); }
    if (p.hat === 'beanie') { A.rr(c, 13, 1, 22, 8, 4, '#e63946', OUT, 1.6); A.rr(c, 13, 6, 22, 3, 1, '#ffffff'); A.circ(c, 24, 0.5, 3, '#ffffff', OUT, 1); }
    if (p.hat === 'straw') { A.ell(c, 24, 4, 17, 4, '#f4d35e', OUT, 1.6); A.rr(c, 16, -2, 16, 6, 3, '#f4d35e', OUT, 1.6); A.rr(c, 16, 1, 16, 2, 1, '#bc4749'); }
    if (p.hat === 'helmet') {
      c.beginPath(); c.arc(24, 12, 12, Math.PI, 0); c.lineTo(36, 15); c.lineTo(12, 15); c.closePath();
      c.fillStyle = '#9aa5b1'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 2; c.stroke();
      A.rr(c, 26, 9, 9, 2.5, 1, '#1d1b2b'); A.line(c, 24, 0, 24, 6, '#e63946', 3);
    }
    if (p.hat === 'crown') {
      A.poly(c, [13, 6, 13, -2, 17.5, 3, 21, -4, 24, 3, 27, -4, 30.5, 3, 35, -2, 35, 6], '#ffd166', OUT, 1.6);
      A.circ(c, 24, 3, 1.8, '#e63946'); A.circ(c, 17, 4, 1.3, '#4cc9f0'); A.circ(c, 31, 4, 1.3, '#4cc9f0');
    }
  },

  yeti(c, p, f) {
    const A = this;
    A.ell(c, 24, 54, 17, 4.5, 'rgba(0,0,0,0.3)');
    const lx = f ? 15 : 12, rx = f ? 26 : 29;
    A.rr(c, lx, 38, 9, 14, 4, p.fur2, OUT, 1.6); A.rr(c, rx, 37, 9, 14, 4, p.fur2, OUT, 1.6);
    A.ell(c, 24, 30, 16, 15, p.fur, OUT, 2.2);
    c.fillStyle = p.fur2;
    for (let i = 0; i < 10; i++) { const a = i * 0.63; A.circ(c, 24 + Math.cos(a) * 13, 30 + Math.sin(a) * 12, 3.5, p.fur); }
    A.ell(c, 24, 33, 9, 9, p.belly);
    const a1 = f ? 22 : 25, a2 = f ? 31 : 28;
    A.rr(c, 32, a1, 15, 8, 4, p.fur, OUT, 1.6); A.rr(c, 30, a2, 14, 8, 4, p.fur, OUT, 1.6);
    A.circ(c, 46, a1 + 4, 3.5, p.skin, OUT, 1.2); A.circ(c, 43, a2 + 4, 3.5, p.skin, OUT, 1.2);
    A.circ(c, 24, 13, 11, p.fur, OUT, 2.2);
    A.ell(c, 25, 15, 8, 7, p.skin, OUT, 1.4);
    A.circ(c, 21.5, 13, 2.6, '#fff'); A.circ(c, 28, 13, 2.6, '#fff');
    A.circ(c, 22.3, 13, 1.4, p.eye); A.circ(c, 28.8, 13, 1.4, p.eye);
    A.rr(c, 20, 18, 10, 3, 1, '#3a0d0d');
    c.fillStyle = '#fff'; c.fillRect(21, 18, 2, 2.5); c.fillRect(27, 18, 2, 2.5);
    if (p.crown) {
      A.poly(c, [14, 5, 16, -3, 19, 3, 24, -5, 29, 3, 32, -3, 34, 5], '#b3e5fc', '#0277bd', 1.5);
    } else {
      A.poly(c, [13, 6, 10, -2, 17, 3], '#e0e0e0', OUT, 1.4); A.poly(c, [35, 6, 38, -2, 31, 3], '#e0e0e0', OUT, 1.4);
    }
  },

  bloater(c, p, f) {
    const A = this;
    A.ell(c, 24, 54, 17, 4.5, 'rgba(0,0,0,0.3)');
    A.rr(c, f ? 16 : 13, 42, 7, 10, 3, p.pants, OUT, 1.5); A.rr(c, f ? 25 : 28, 41, 7, 10, 3, p.pants, OUT, 1.5);
    A.circ(c, 24, 31, 17, p.skin, OUT, 2.2);
    c.fillStyle = this.radial(c, 19, 26, 18, [[0, 'rgba(255,255,255,0.3)'], [1, 'rgba(255,255,255,0)']]);
    c.beginPath(); c.arc(24, 31, 16, 0, Math.PI * 2); c.fill();
    [[16, 33, 3.5], [30, 25, 3], [28, 38, 4], [20, 22, 2.5]].forEach((q) => { A.circ(c, q[0], q[1], q[2], p.boil, OUT, 1); A.circ(c, q[0] - 1, q[1] - 1, 1, '#fffde7'); });
    A.rr(c, 12, 32, 24, 3, 1, p.stripe || '#1d3557');
    A.rr(c, 38, f ? 25 : 28, 9, 5, 2.5, p.skin, OUT, 1.4);
    A.circ(c, 25, 10, 8, p.skin, OUT, 2);
    A.circ(c, 22, 9, 2.6, '#fff'); A.circ(c, 28.5, 9, 2.6, '#fff');
    A.circ(c, 23, 9, 1.3, '#d00000'); A.circ(c, 29.3, 9, 1.3, '#d00000');
    A.rr(c, 21, 13, 8, 3, 1, '#3a0d0d');
  },

  blob(c, p, f) {
    const A = this;
    A.ell(c, 24, 50, 12, 3.5, 'rgba(0,0,0,0.3)');
    const sq = f ? 1 : 0;
    A.ell(c, 24, 38 + sq, 14 + sq, 12 - sq, p.skin, OUT, 2);
    A.ell(c, 20, 33, 4, 2.5, 'rgba(255,255,255,0.35)');
    A.circ(c, 20, 37, 3, '#fff'); A.circ(c, 28, 37, 3, '#fff');
    A.circ(c, 21, 37, 1.5, '#d00000'); A.circ(c, 29, 37, 1.5, '#d00000');
    A.rr(c, 20, 42, 9, 3, 1, '#3a0d0d');
  },

  zombieTex(key, drawFn, p, w, h, k) {
    for (let f = 0; f < 2; f++) {
      this.canvas(key + '_' + f, w, h, (c) => {
        c.save(); c.translate((w - 48 * k) / 2, h - 58 * k); c.scale(k, k);
        drawFn.call(this, c, p, f);
        c.restore();
      });
    }
  },

  zombies() {
    const H = this.humanoid, N = 48, M = 58;
    this.zombieTex('z_walker', H, { skin: '#86c06c', shirt: '#6d597a', pants: '#3d405b', hair: '#3b5b2a' }, N, M, 1);
    this.zombieTex('z_runner', H, { skin: '#b5e48c', shirt: '#d62828', pants: '#264653', hair: '#7f5539', sleeve: '#d62828' }, N, M, 1);
    this.zombieTex('z_brute',  H, { skin: '#5f8d3e', shirt: '#495057', pants: '#212529', hair: '#1b1b1b', fat: true }, N, M, 1);
    this.zombieTex('z_sailor', H, { skin: '#8fbf9f', shirt: '#ffffff', stripe: '#1d3557', pants: '#1d3557', hat: 'sailor' }, N, M, 1);
    this.zombieTex('z_surfer', H, { skin: '#a7c957', shirt: '#ff9f1c', pants: '#2ec4b6', hair: '#ffd166', board: '#ff006e', wound: false }, N, M, 1);
    this.zombieTex('z_bloater', this.bloater, { skin: '#9bbf5a', pants: '#1d3557', boil: '#e9c46a', stripe: '#ffffff' }, N, M, 1);
    this.zombieTex('z_blob', this.blob, { skin: '#b5d36b' }, N, M, 1);
    this.zombieTex('z_frosty', H, { skin: '#9ec9d9', shirt: '#457b9d', pants: '#1d3557', hair: '#e0f7fa', scarf: '#e63946', eye: '#00b4d8', glowEye: true }, N, M, 1);
    this.zombieTex('z_skier', H, { skin: '#a8dadc', shirt: '#ffb703', pants: '#023047', hat: 'beanie', goggles: true, ski: true }, N, M, 1);
    this.zombieTex('z_yeti', this.yeti, { fur: '#f1f5f9', fur2: '#cbd5e1', belly: '#dbeafe', skin: '#5b7fa3', eye: '#d00000' }, N, M, 1);
    this.zombieTex('z_magma', H, { skin: '#5a3a2e', shirt: '#2b1d18', pants: '#1a120f', hair: '#ff6d00', cracks: '#ffb703', eye: '#ffea00', glowEye: true, wound: false }, N, M, 1);
    this.zombieTex('z_knight', H, { skin: '#7a9a6a', shirt: '#6c757d', pants: '#495057', hat: 'helmet', armor: true }, N, M, 1);
    this.zombieTex('z_hound', H, { skin: '#6b6b6b', shirt: '#2f2f2f', pants: '#1a1a1a', hair: '#3d3d3d', eye: '#ff6d00', glowEye: true, sleeve: '#2f2f2f' }, N, M, 1);
    // bos (dua kali lebih besar)
    this.zombieTex('z_boss1', H, { skin: '#7cae5c', shirt: '#e9c46a', overall: '#3a6ea5', pants: '#3a6ea5', hat: 'straw', fat: true }, 100, 116, 2);
    this.zombieTex('z_boss2', H, { skin: '#8fbf9f', shirt: '#1d3557', pants: '#0b1a30', hat: 'captain', beard: '#5c4033', buttons: '#ffd166', fat: true, sleeve: '#1d3557' }, 100, 116, 2);
    this.zombieTex('z_boss3', this.yeti, { fur: '#e3f2fd', fur2: '#90caf9', belly: '#bbdefb', skin: '#1e3a5f', eye: '#ff1744', crown: true }, 100, 116, 2);
    this.zombieTex('z_boss4', H, { skin: '#4e6b3a', shirt: '#3c0d0d', pants: '#1a0505', hat: 'crown', cape: '#9d0208', armor: true, eye: '#ffea00', glowEye: true }, 100, 116, 2);
  },

  // =========================================================
  //  MENARA: alas (tidak berputar) + turret (berputar ke target)
  // =========================================================
  towers() {
    for (const type of TOWER_ORDER) {
      const col = TOWERS[type].color;
      for (let lv = 1; lv <= 4; lv++) {
        this.canvas('tb_' + type + '_' + lv, 60, 60, (c) => this.towerBase(c, col, lv));
        this.canvas('tt_' + type + '_' + lv, 60, 60, (c) => this.towerTurret(c, type, col, lv));
      }
    }
  },

  towerBase(c, col, lv) {
    const A = this, cx = 30, cy = 30;
    A.ell(c, cx, cy + 6, 25, 14, 'rgba(0,0,0,0.3)');
    // alas batu segi delapan
    const pts = [];
    for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; pts.push(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24); }
    c.save();
    c.fillStyle = this.radial(c, cx - 6, cy - 8, 34, [[0, lv >= 3 ? '#a3aab3' : '#8d949c'], [1, lv >= 3 ? '#5c636b' : '#4d535a']]);
    A.poly(c, pts, null); c.fill(); c.strokeStyle = OUT; c.lineWidth = 2.4; c.stroke();
    c.restore();
    c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 1;
    for (let i = 0; i < 8; i += 2) A.line(c, cx + Math.cos(i * Math.PI / 4) * 17, cy + Math.sin(i * Math.PI / 4) * 17, cx + Math.cos(i * Math.PI / 4) * 23, cy + Math.sin(i * Math.PI / 4) * 23, 'rgba(0,0,0,0.3)', 1.2);
    // cincin warna menara
    A.circ(c, cx, cy, 17, shade(col, -0.35), OUT, 2);
    A.circ(c, cx, cy, 13.5, shade(col, -0.55));
    if (lv >= 2) for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; A.circ(c, cx + Math.cos(a) * 20.5, cy + Math.sin(a) * 20.5, 2, '#dee2e6', OUT, 1); }
    if (lv >= 3) { c.beginPath(); c.arc(cx, cy, 17, 0, Math.PI * 2); c.strokeStyle = '#ffd166'; c.lineWidth = 2.5; c.stroke(); }
    if (lv >= 4) {
      c.save(); c.shadowColor = hex(col); c.shadowBlur = 10;
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; A.poly(c, [cx + Math.cos(a) * 25, cy + Math.sin(a) * 25, cx + Math.cos(a + 0.18) * 20, cy + Math.sin(a + 0.18) * 20, cx + Math.cos(a - 0.18) * 20, cy + Math.sin(a - 0.18) * 20], shade(col, 0.4), OUT, 1.2); }
      c.restore();
    }
  },

  towerTurret(c, type, col, lv) {
    const A = this, cx = 30, cy = 30;
    const main = hex(col), light = shade(col, 0.35), dark = shade(col, -0.35);
    const gold = '#ffd166', metal = '#ced4da', metalD = '#6c757d';
    const barrel = (x, y, w, h, color) => { A.rr(c, x, y, w, h, 2, color || metal, OUT, 1.8); A.rr(c, x - 0.5, y, w + 1, 4, 1.5, lv >= 3 ? gold : metalD, OUT, 1.2); };
    c.save(); c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowOffsetY = 3; c.shadowBlur = 3;
    if (type === 'gun') {
      if (lv === 1) barrel(27, 6, 6, 22);
      if (lv === 2) barrel(26, 4, 8, 24);
      if (lv === 3) { barrel(21, 5, 6, 23); barrel(33, 5, 6, 23); }
      if (lv === 4) { barrel(19, 4, 6, 24); barrel(27, 1, 6, 27); barrel(35, 4, 6, 24); A.rr(c, 18, 16, 24, 4, 1, gold, OUT, 1.2); }
      A.circ(c, cx, cy, 11 + lv * 0.6, main, OUT, 2.2);
      A.circ(c, cx - 3, cy - 3, 4, light);
      A.circ(c, cx, cy, 3.5, dark);
    }
    if (type === 'cannon') {
      const w = 12 + lv * 1.5;
      if (lv < 4) { A.rr(c, cx - w / 2, 4, w, 22, 4, '#37474f', OUT, 2); A.rr(c, cx - w / 2 - 1.5, 3, w + 3, 6, 3, lv >= 3 ? gold : '#263238', OUT, 1.6); }
      else { [-8, 8].forEach((dx) => { A.rr(c, cx + dx - 7, 4, 14, 22, 4, '#37474f', OUT, 2); A.rr(c, cx + dx - 8.5, 3, 17, 6, 3, gold, OUT, 1.6); }); }
      A.circ(c, cx, cy + 2, 13 + lv * 0.7, '#455a64', OUT, 2.2);
      A.circ(c, cx, cy + 2, 9 + lv * 0.5, main, OUT, 1.6);
      A.circ(c, cx - 3, cy - 1, 3.5, light);
    }
    if (type === 'frost') {
      const n = lv + 1;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.7;
        const tx = cx + Math.cos(a) * (18 + lv), ty = cy + Math.sin(a) * (18 + lv);
        const bx = cx + Math.cos(a) * 6, by = cy + Math.sin(a) * 6;
        const px = Math.cos(a + Math.PI / 2) * 4.5, py = Math.sin(a + Math.PI / 2) * 4.5;
        A.poly(c, [tx, ty, bx + px, by + py, bx - px, by - py], '#b2ebf2', '#006064', 1.6);
      }
      A.circ(c, cx, cy, 10 + lv, main, '#006064', 2);
      c.shadowColor = '#e0f7fa'; c.shadowBlur = lv >= 4 ? 12 : 4; c.shadowOffsetY = 0;
      A.poly(c, [cx, cy - 8, cx + 6, cy, cx, cy + 8, cx - 6, cy], '#e0f7fa', '#00838f', 1.2);
    }
    if (type === 'sniper') {
      A.rr(c, cx - 2.5, 0, 5, 28, 1.5, '#37474f', OUT, 1.6);
      if (lv >= 3) A.rr(c, cx - 4, 0, 8, 5, 1.5, gold, OUT, 1.2);
      A.rr(c, cx + 4, 12, 5, 12, 2, '#263238', OUT, 1.4); A.circ(c, cx + 6.5, 12, 2, '#4cc9f0');
      A.rr(c, cx - 10, cy - 8, 20, 18, 5, main, OUT, 2);
      if (lv >= 4) { [[-6, -3], [4, 2], [-2, 5]].forEach((q) => A.circ(c, cx + q[0], cy + q[1], 2.6, dark)); }
      A.rr(c, cx - 7, cy - 5, 8, 5, 2, light);
    }
    if (type === 'flame') {
      const nozzle = (dx) => { A.rr(c, cx + dx - 4, 5, 8, 20, 2, '#455a64', OUT, 1.8); A.rr(c, cx + dx - 5, 3, 10, 5, 2, '#ff9100', OUT, 1.4); };
      if (lv < 4) nozzle(0); else { nozzle(-7); nozzle(7); }
      A.circ(c, cx - 7, cy + 4, 7 + lv * 0.5, '#d84315', OUT, 1.8);
      A.circ(c, cx + 7, cy + 4, 7 + lv * 0.5, '#d84315', OUT, 1.8);
      A.circ(c, cx, cy, 9 + lv * 0.6, main, OUT, 2);
      A.circ(c, cx - 2, cy - 2, 3, '#ffe0b2');
      if (lv >= 3) A.rr(c, cx - 12, cy + 2, 24, 3, 1, gold, OUT, 1);
    }
    if (type === 'tesla') {
      for (let i = 0; i < lv + 1; i++) { A.circ(c, cx, cy, 19 - i * 3, null, i % 2 ? '#b87333' : '#e09f5a', 2.4); }
      if (lv >= 3) for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; A.line(c, cx + Math.cos(a) * 19, cy + Math.sin(a) * 19, cx + Math.cos(a) * 24, cy + Math.sin(a) * 24, metal, 2); }
      c.shadowColor = '#e040fb'; c.shadowBlur = 8 + lv * 3; c.shadowOffsetY = 0;
      A.circ(c, cx, cy, 7 + lv, main, OUT, 1.8);
      A.circ(c, cx - 2, cy - 2, 2.5 + lv * 0.4, '#f3e5f5');
    }
    c.restore();
  },

  // =========================================================
  //  RUMAH (garis akhir) tiap bioma
  // =========================================================
  houses() {
    const A = this;
    this.canvas('h_grass', 120, 120, (c) => {
      A.ell(c, 60, 108, 50, 9, 'rgba(0,0,0,0.3)');
      A.rr(c, 76, 18, 13, 28, 2, '#8d6e63', OUT, 2);
      A.rr(c, 16, 52, 88, 54, 3, '#f6e7c8', OUT, 2.5);
      c.fillStyle = 'rgba(0,0,0,0.06)'; for (let y = 60; y < 104; y += 8) c.fillRect(18, y, 84, 2);
      A.poly(c, [4, 56, 60, 10, 116, 56], '#c1121f', OUT, 2.5);
      c.strokeStyle = 'rgba(0,0,0,0.2)'; c.lineWidth = 2;
      for (let i = 1; i < 5; i++) A.line(c, 4 + i * 11, 56 - i * 9.2, 116 - i * 11, 56 - i * 9.2, 'rgba(0,0,0,0.18)', 2);
      A.rr(c, 50, 74, 20, 32, 2, '#6f4518', OUT, 2); A.circ(c, 65, 90, 2, '#ffd166');
      [[24, 66], [80, 66]].forEach((q) => { A.rr(c, q[0], q[1], 17, 16, 2, '#8ecae6', OUT, 2); A.line(c, q[0] + 8.5, q[1], q[0] + 8.5, q[1] + 16, OUT, 1.5); A.line(c, q[0], q[1] + 8, q[0] + 17, q[1] + 8, OUT, 1.5); });
      A.rr(c, 20, 82, 25, 5, 2, '#a7c957', OUT, 1.5); A.rr(c, 76, 82, 25, 5, 2, '#a7c957', OUT, 1.5);
      [[25, 82, '#ff6b6b'], [33, 81, '#ffd166'], [40, 82, '#ff6b6b'], [82, 82, '#ffd166'], [90, 81, '#ff6b6b'], [97, 82, '#ffd166']].forEach((q) => A.circ(c, q[0], q[1], 2.4, q[2]));
    });
    this.canvas('h_beach', 120, 120, (c) => {
      A.ell(c, 60, 110, 50, 8, 'rgba(0,0,0,0.25)');
      [22, 46, 74, 98].forEach((x) => A.rr(c, x - 3, 76, 6, 34, 2, '#7f5539', OUT, 1.8));
      A.rr(c, 12, 70, 96, 8, 2, '#a47148', OUT, 2);
      A.rr(c, 20, 42, 80, 32, 2, '#d4a373', OUT, 2.5);
      c.strokeStyle = 'rgba(0,0,0,0.15)'; for (let x = 28; x < 100; x += 8) A.line(c, x, 44, x, 72, 'rgba(0,0,0,0.15)', 1.5);
      A.poly(c, [6, 48, 60, 8, 114, 48], '#e9c46a', OUT, 2.5);
      for (let i = 0; i < 10; i++) A.line(c, 12 + i * 10.5, 48, 60, 10, 'rgba(160,110,40,0.5)', 1.5);
      c.fillStyle = '#e9c46a'; for (let x = 8; x < 112; x += 7) A.poly(c, [x, 47, x + 7, 47, x + 3.5, 54], '#e9c46a');
      A.rr(c, 52, 52, 16, 22, 2, '#3a2a1a', OUT, 2);
      A.rr(c, 28, 52, 14, 12, 2, '#4cc9f0', OUT, 2); A.rr(c, 78, 52, 14, 12, 2, '#4cc9f0', OUT, 2);
      A.line(c, 60, 10, 60, -2, '#5c4033', 2); A.poly(c, [60, -2, 74, 2, 60, 6], '#ff006e');
      A.circ(c, 104, 92, 8, '#ff6b6b', OUT, 1.8); A.line(c, 96, 92, 112, 92, '#ffffff', 2);
    });
    this.canvas('h_snow', 120, 120, (c) => {
      A.ell(c, 60, 108, 52, 9, 'rgba(60,90,130,0.3)');
      A.rr(c, 78, 14, 13, 30, 2, '#6d4c41', OUT, 2); A.rr(c, 76, 12, 17, 6, 3, '#ffffff', OUT, 1.5);
      A.rr(c, 14, 52, 92, 54, 3, '#8d5524', OUT, 2.5);
      for (let y = 56; y < 104; y += 9) { A.rr(c, 14, y, 92, 7, 3.5, '#a0662f', 'rgba(0,0,0,0.3)', 1); }
      A.poly(c, [2, 58, 60, 10, 118, 58], '#5d4037', OUT, 2.5);
      A.poly(c, [0, 56, 60, 6, 120, 56, 112, 62, 98, 56, 84, 62, 70, 55, 56, 62, 40, 55, 26, 62, 10, 56], '#ffffff', '#90a4ae', 2);
      A.rr(c, 50, 74, 20, 32, 2, '#3e2723', OUT, 2); A.circ(c, 65, 90, 2, '#ffd166');
      c.save(); c.shadowColor = '#ffd166'; c.shadowBlur = 12;
      [[22, 68], [82, 68]].forEach((q) => { A.rr(c, q[0], q[1], 17, 15, 2, '#ffe08a', OUT, 2); });
      c.restore();
      [[22, 68], [82, 68]].forEach((q) => { A.line(c, q[0] + 8.5, q[1], q[0] + 8.5, q[1] + 15, OUT, 1.5); A.line(c, q[0], q[1] + 7.5, q[0] + 17, q[1] + 7.5, OUT, 1.5); });
      A.ell(c, 60, 106, 46, 5, '#ffffff');
    });
    this.canvas('h_volcano', 120, 120, (c) => {
      A.ell(c, 60, 110, 54, 9, 'rgba(0,0,0,0.4)');
      A.rr(c, 14, 40, 92, 68, 3, '#6b6e73', OUT, 2.5);
      c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 1.5;
      for (let y = 48; y < 106; y += 10) { A.line(c, 15, y, 105, y, 'rgba(0,0,0,0.3)', 1.5); for (let x = 20 + ((y / 10) % 2) * 9; x < 104; x += 18) A.line(c, x, y - 10, x, y, 'rgba(0,0,0,0.3)', 1.5); }
      for (let x = 14; x < 106; x += 18) A.rr(c, x, 30, 12, 12, 1, '#7d8086', OUT, 2);
      [[8, 20], [96, 20]].forEach((q) => { A.rr(c, q[0], q[1], 16, 88, 2, '#5a5d62', OUT, 2.5); A.poly(c, [q[0] - 2, q[1] + 2, q[0] + 8, q[1] - 14, q[0] + 18, q[1] + 2], '#9d0208', OUT, 2); });
      A.rr(c, 46, 70, 28, 38, 12, '#2b1d18', OUT, 2.5);
      for (let x = 50; x < 72; x += 6) A.line(c, x, 74, x, 106, '#5c4033', 2);
      A.line(c, 60, 30, 60, 6, '#3e2723', 2); A.poly(c, [60, 6, 80, 12, 60, 20], '#ffd166', OUT, 1.5);
      c.save(); c.shadowColor = '#ff9100'; c.shadowBlur = 10;
      [[34, 66], [86, 66]].forEach((q) => { A.rr(c, q[0] - 2, q[1], 4, 10, 1, '#5c4033'); A.circ(c, q[0], q[1] - 3, 4, '#ff9100'); A.circ(c, q[0], q[1] - 4, 2, '#ffea00'); });
      c.restore();
    });
  },

  // =========================================================
  //  DEKORASI peta
  // =========================================================
  decor() {
    const A = this;
    this.canvas('d_tree', 56, 70, (c) => {
      A.ell(c, 28, 63, 20, 6, 'rgba(0,0,0,0.3)');
      A.rr(c, 23, 40, 10, 24, 3, '#6f4518', OUT, 2);
      A.circ(c, 28, 28, 22, '#2d6a4f', OUT, 2.4);
      A.circ(c, 19, 23, 13, '#40916c'); A.circ(c, 35, 21, 12, '#40916c'); A.circ(c, 26, 14, 9, '#52b788');
      A.circ(c, 22, 12, 3, '#74c69d');
      [[16, 32], [36, 30], [28, 38]].forEach((q) => A.circ(c, q[0], q[1], 2.2, '#e63946', OUT, 1));
    });
    this.canvas('d_bush', 38, 30, (c) => {
      A.ell(c, 19, 25, 16, 4, 'rgba(0,0,0,0.25)');
      A.circ(c, 11, 18, 8, '#2d6a4f', OUT, 2); A.circ(c, 27, 18, 8, '#2d6a4f', OUT, 2); A.circ(c, 19, 13, 9, '#40916c', OUT, 2);
      A.circ(c, 16, 10, 3, '#74c69d');
    });
    this.canvas('d_rock', 32, 26, (c) => {
      A.ell(c, 16, 21, 14, 4, 'rgba(0,0,0,0.25)');
      A.poly(c, [3, 19, 6, 8, 14, 3, 25, 5, 30, 14, 27, 21, 8, 22], '#8d99ae', OUT, 2);
      A.poly(c, [8, 9, 14, 5, 21, 7, 15, 11], '#b8c1cf');
    });
    ['#ffffff', '#ffd166', '#ff8fab'].forEach((col, i) => {
      this.canvas('d_flower' + (i ? '_' + i : ''), 14, 14, (c) => {
        A.line(c, 7, 8, 7, 13, '#2d6a4f', 1.6);
        [[4, 5], [10, 5], [7, 2], [7, 8]].forEach((q) => A.circ(c, q[0], q[1], 2.4, col));
        A.circ(c, 7, 5, 1.6, i === 1 ? '#e76f51' : '#ffd166');
      });
    });
    this.canvas('d_mushroom', 16, 16, (c) => {
      A.rr(c, 6, 8, 4, 7, 1.5, '#fff1e6', OUT, 1.2);
      c.beginPath(); c.arc(8, 8, 6.5, Math.PI, 0); c.closePath(); c.fillStyle = '#e63946'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.2; c.stroke();
      A.circ(c, 6, 5, 1.2, '#fff'); A.circ(c, 10, 6, 1, '#fff');
    });
    // pantai
    this.canvas('d_palm', 76, 84, (c) => {
      A.ell(c, 34, 78, 22, 5, 'rgba(0,0,0,0.25)');
      for (let i = 0; i < 7; i++) { const t = i / 7; A.rr(c, 30 + Math.sin(t * 2) * 8 - 4, 76 - i * 7 - 8, 9, 9, 3, i % 2 ? '#a47148' : '#8d5b34', OUT, 1.5); }
      const top = { x: 40, y: 24 };
      [[-1, 0.2], [1, 0.2], [-0.7, -0.6], [0.7, -0.6], [0, -1], [-1, 0.8], [1, 0.8]].forEach((d) => {
        c.save(); c.translate(top.x, top.y); c.rotate(Math.atan2(d[1], d[0]));
        A.ell(c, 16, 0, 18, 5.5, '#2a9d8f', OUT, 1.8); A.line(c, 2, 0, 32, 0, '#1d6f66', 1.2);
        c.restore();
      });
      [[36, 28], [43, 29], [40, 33]].forEach((q) => A.circ(c, q[0], q[1], 3.5, '#6f4518', OUT, 1.2));
    });
    this.canvas('d_umbrella', 60, 60, (c) => {
      A.ell(c, 34, 36, 24, 18, 'rgba(0,0,0,0.2)');
      A.rr(c, 10, 34, 22, 18, 2, '#4cc9f0', OUT, 1.5); A.rr(c, 10, 40, 22, 4, 0, '#ffffff');
      const cols = ['#ff006e', '#ffffff'];
      for (let i = 0; i < 8; i++) {
        c.beginPath(); c.moveTo(30, 26); c.arc(30, 26, 22, i * Math.PI / 4, (i + 1) * Math.PI / 4); c.closePath();
        c.fillStyle = cols[i % 2]; c.fill();
      }
      A.circ(c, 30, 26, 22, null, OUT, 2); A.circ(c, 30, 26, 3, '#ffd166', OUT, 1.2);
    });
    this.canvas('d_beachrock', 34, 26, (c) => {
      A.ell(c, 17, 22, 15, 3.5, 'rgba(0,0,0,0.2)');
      A.poly(c, [3, 20, 5, 10, 14, 4, 26, 6, 31, 15, 27, 22, 9, 23], '#a68a64', OUT, 2);
      A.poly(c, [8, 10, 14, 6, 21, 8, 14, 12], '#c9b18c');
      A.circ(c, 23, 17, 2, '#52b788');
    });
    ['#ffcdb2', '#ffb4a2', '#f8edeb'].forEach((col, i) => {
      this.canvas('d_shell' + (i ? '_' + i : ''), 14, 12, (c) => {
        c.beginPath(); c.moveTo(7, 11); c.arc(7, 8, 6, Math.PI * 1.05, Math.PI * 1.95); c.closePath();
        c.fillStyle = col; c.fill(); c.strokeStyle = '#9d6b53'; c.lineWidth = 1; c.stroke();
        for (let k = -2; k <= 2; k++) A.line(c, 7, 11, 7 + k * 2.4, 3.5, 'rgba(157,107,83,0.6)', 0.8);
      });
    });
    this.canvas('d_star', 16, 16, (c) => {
      const pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 3 : 7, a = -Math.PI / 2 + i * Math.PI / 5; pts.push(8 + Math.cos(a) * r, 8 + Math.sin(a) * r); }
      A.poly(c, pts, '#f4845f', '#9d4edd', 1);
      A.circ(c, 8, 8, 1, '#fff');
    });
    // salju
    this.canvas('d_pine', 52, 72, (c) => {
      A.ell(c, 26, 66, 18, 5, 'rgba(60,90,130,0.3)');
      A.rr(c, 22, 54, 8, 13, 2, '#5d4037', OUT, 1.8);
      [[58, 22], [44, 18], [30, 14]].forEach((t, i) => {
        A.poly(c, [26, t[0] - 26, 26 + t[1], t[0], 26 - t[1], t[0]], '#1b4332', OUT, 2);
        A.poly(c, [26, t[0] - 26, 26 + t[1] * 0.55, t[0] - 12, 26 + 3, t[0] - 9, 26 - 3, t[0] - 12, 26 - t[1] * 0.55, t[0] - 12], '#ffffff');
        A.poly(c, [26 + t[1] - 6, t[0] - 2, 26 + t[1], t[0], 26 + t[1] - 8, t[0]], '#ffffff');
      });
    });
    this.canvas('d_snowman', 36, 48, (c) => {
      A.ell(c, 18, 44, 13, 3.5, 'rgba(60,90,130,0.3)');
      A.circ(c, 18, 33, 11, '#ffffff', '#90a4ae', 2); A.circ(c, 18, 16, 8, '#ffffff', '#90a4ae', 2);
      A.rr(c, 11, 2, 14, 8, 1, '#263238'); A.rr(c, 8, 9, 20, 3, 1, '#263238');
      A.circ(c, 15, 15, 1.4, '#263238'); A.circ(c, 21, 15, 1.4, '#263238');
      A.poly(c, [18, 17, 27, 19, 18, 20], '#ff9100');
      A.rr(c, 10, 22, 16, 4, 2, '#e63946'); A.rr(c, 20, 23, 4, 9, 2, '#e63946');
      [29, 34].forEach((y) => A.circ(c, 18, y, 1.3, '#263238'));
      A.line(c, 7, 30, -1, 24, '#5d4037', 2); A.line(c, 29, 30, 36, 23, '#5d4037', 2);
    });
    this.canvas('d_icerock', 32, 28, (c) => {
      A.ell(c, 16, 24, 14, 3.5, 'rgba(60,90,130,0.3)');
      A.poly(c, [4, 22, 6, 10, 12, 4, 18, 9, 22, 2, 29, 12, 28, 23], '#a5d8ff', '#1971c2', 2);
      A.poly(c, [12, 6, 16, 10, 12, 18, 9, 11], '#e7f5ff');
      A.poly(c, [22, 5, 26, 12, 22, 16], '#d0ebff');
    });
    this.canvas('d_snowbush', 34, 24, (c) => {
      A.ell(c, 17, 20, 15, 3, 'rgba(60,90,130,0.3)');
      A.circ(c, 10, 14, 7, '#2d6a4f', OUT, 1.6); A.circ(c, 24, 14, 7, '#2d6a4f', OUT, 1.6); A.circ(c, 17, 10, 8, '#40916c', OUT, 1.6);
      A.ell(c, 17, 6, 9, 3.5, '#ffffff'); A.ell(c, 8, 10, 5, 2.5, '#ffffff'); A.ell(c, 26, 10, 5, 2.5, '#ffffff');
    });
    // gunung api
    this.canvas('d_lava', 92, 60, (c) => {
      A.ell(c, 46, 32, 44, 26, '#1a1210', OUT, 2.5);
      c.fillStyle = this.radial(c, 46, 32, 40, [[0, '#ffea00'], [0.35, '#ff9100'], [0.75, '#ff3d00'], [1, '#9d0208']]);
      c.beginPath(); c.ellipse(46, 32, 38, 21, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(80,10,0,0.6)'; c.lineWidth = 2;
      [[24, 26, 40, 30], [52, 22, 68, 28], [34, 40, 56, 40]].forEach((l) => A.line(c, l[0], l[1], l[2], l[3], 'rgba(120,20,0,0.5)', 2.5));
      [[30, 28], [60, 36], [48, 24]].forEach((q) => A.circ(c, q[0], q[1], 2.5, '#fff59d'));
    });
    this.canvas('d_deadtree', 52, 66, (c) => {
      A.ell(c, 26, 61, 16, 4, 'rgba(0,0,0,0.35)');
      c.strokeStyle = OUT; c.lineWidth = 8; c.lineCap = 'round';
      const br = [[26, 62, 26, 30], [26, 40, 12, 24], [26, 34, 40, 18], [12, 24, 6, 14], [40, 18, 46, 10], [26, 30, 24, 10]];
      br.forEach((b) => A.line(c, b[0], b[1], b[2], b[3], OUT, 8));
      br.forEach((b, i) => A.line(c, b[0], b[1], b[2], b[3], i ? '#3e2b24' : '#4a3329', i ? 4 : 6));
      [[6, 14], [46, 10], [24, 10]].forEach((q) => A.circ(c, q[0], q[1], 2, 'rgba(255,109,0,0.8)'));
    });
    this.canvas('d_basalt', 34, 28, (c) => {
      A.ell(c, 17, 24, 15, 3.5, 'rgba(0,0,0,0.35)');
      A.poly(c, [3, 22, 4, 12, 10, 6, 18, 8, 26, 4, 31, 14, 28, 24], '#2b2422', OUT, 2);
      A.poly(c, [10, 8, 18, 10, 14, 15], '#4a3f3b');
      A.line(c, 18, 14, 24, 20, 'rgba(255,109,0,0.7)', 1.5);
    });
    this.canvas('d_skull', 16, 14, (c) => {
      A.circ(c, 8, 6, 5.5, '#e9e4d8', OUT, 1.2); A.rr(c, 5, 9, 6, 4, 1, '#e9e4d8', OUT, 1);
      A.circ(c, 6, 6, 1.5, OUT); A.circ(c, 10, 6, 1.5, OUT);
    });
    this.canvas('d_crystal', 20, 26, (c) => {
      c.save(); c.shadowColor = '#ff1744'; c.shadowBlur = 8;
      A.poly(c, [10, 1, 15, 10, 12, 24, 7, 24, 5, 10], '#ff5252', '#7f0000', 1.4);
      A.poly(c, [16, 9, 19, 15, 17, 24, 13, 24], '#ff8a80', '#7f0000', 1.2);
      c.restore();
      A.poly(c, [10, 3, 12, 10, 9, 14], '#ffcdd2');
    });
  },

  // =========================================================
  //  IKON antarmuka
  // =========================================================
  ui() {
    const A = this;
    this.canvas('i_coin', 24, 24, (c) => {
      A.circ(c, 12, 12, 10, '#ffb703', OUT, 2); A.circ(c, 12, 12, 6.5, null, '#fb8500', 1.5);
      c.fillStyle = '#fff3b0'; c.font = 'bold 10px Arial'; c.textAlign = 'center'; c.fillText('$', 12, 16);
    });
    this.canvas('i_heart', 24, 22, (c) => {
      c.beginPath(); c.moveTo(12, 20); c.bezierCurveTo(-2, 10, 3, -1, 12, 6); c.bezierCurveTo(21, -1, 26, 10, 12, 20);
      c.fillStyle = '#ef233c'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 2; c.stroke();
      A.ell(c, 7.5, 7, 2.5, 1.6, 'rgba(255,255,255,0.6)');
    });
    this.canvas('i_skull', 24, 24, (c) => {
      A.circ(c, 12, 10, 8.5, '#e9ecef', OUT, 2); A.rr(c, 7, 15, 10, 6, 2, '#e9ecef', OUT, 1.6);
      A.circ(c, 8.5, 10, 2.5, OUT); A.circ(c, 15.5, 10, 2.5, OUT);
      A.line(c, 10, 18, 10, 21, OUT, 1); A.line(c, 14, 18, 14, 21, OUT, 1);
    });
    this.canvas('i_lock', 22, 26, (c) => {
      c.beginPath(); c.arc(11, 10, 6, Math.PI, 0); c.strokeStyle = '#adb5bd'; c.lineWidth = 3.5; c.stroke();
      A.rr(c, 3, 10, 16, 13, 3, '#ffd166', OUT, 2); A.circ(c, 11, 15.5, 2, OUT); A.rr(c, 10, 16, 2, 4, 1, OUT);
    });
    this.canvas('i_star', 18, 18, (c) => {
      const pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 3.6 : 8, a = -Math.PI / 2 + i * Math.PI / 5; pts.push(9 + Math.cos(a) * r, 9.5 + Math.sin(a) * r); }
      A.poly(c, pts, '#ffd166', OUT, 1.5);
    });
    this.canvas('i_star_off', 18, 18, (c) => {
      const pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 3.6 : 8, a = -Math.PI / 2 + i * Math.PI / 5; pts.push(9 + Math.cos(a) * r, 9.5 + Math.sin(a) * r); }
      A.poly(c, pts, 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0.3)', 1.2);
    });
    this.canvas('i_arrow', 24, 24, (c) => {
      A.poly(c, [4, 8, 14, 8, 14, 3, 22, 12, 14, 21, 14, 16, 4, 16], '#ff4d6d', OUT, 2);
    });
  }
};
