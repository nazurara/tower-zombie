// =============================================================
//  SUARA — semua dibuat langsung dengan Web Audio (tanpa file).
//  Kalau nanti punya file mp3/ogg, muat di BootScene dan ganti
//  Snd.play('nama') dengan scene.sound.play('nama').
// =============================================================
const Snd = {
  ctx: null,
  master: null,
  sfxGain: null,
  musicGain: null,
  noise: null,
  muted: Store.get('muted', false),
  last: {},

  init(scene) {
    if (this.ctx) return true;
    const ctx = scene.sound && scene.sound.context;
    if (!ctx) return false;
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(ctx.destination);
    this.sfxGain = ctx.createGain(); this.sfxGain.gain.value = 0.55; this.sfxGain.connect(this.master);
    this.musicGain = ctx.createGain(); this.musicGain.gain.value = 0.32; this.musicGain.connect(this.master);
    // buffer noise untuk ledakan / api
    const len = ctx.sampleRate * 0.6;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return true;
  },

  toggleMute() {
    this.muted = !this.muted;
    Store.set('muted', this.muted);
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : 1, this.ctx.currentTime, 0.05);
    return this.muted;
  },

  ready() { return this.ctx && this.ctx.state === 'running'; },

  // nada sederhana dengan amplop
  tone(freq, dur, type, vol, slideTo, delay, dest) {
    const c = this.ctx, t = c.currentTime + (delay || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(slideTo, 20), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  },

  noiseHit(dur, vol, filterFreq, filterType, delay) {
    const c = this.ctx, t = c.currentTime + (delay || 0);
    const s = c.createBufferSource(); s.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = filterType || 'lowpass'; f.frequency.value = filterFreq || 1200;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.sfxGain);
    s.start(t); s.stop(t + dur + 0.02);
  },

  // gap = jarak minimum (ms) antar bunyi yang sama, supaya tidak berisik
  play(name) {
    if (!this.ready() || this.muted) return;
    const now = performance.now();
    const gaps = { gun: 60, cannon: 90, frost: 90, flame: 140, tesla: 90, sniper: 60, die: 45, coin: 50, hitHouse: 120 };
    if (gaps[name] && now - (this.last[name] || 0) < gaps[name]) return;
    this.last[name] = now;
    switch (name) {
      case 'gun':     this.tone(900, 0.05, 'square', 0.05, 500); break;
      case 'sniper':  this.tone(1400, 0.12, 'sawtooth', 0.07, 200); this.noiseHit(0.08, 0.12, 3000, 'highpass'); break;
      case 'cannon':  this.tone(160, 0.25, 'sine', 0.25, 50); this.noiseHit(0.2, 0.15, 600); break;
      case 'boom':    this.noiseHit(0.35, 0.22, 500); this.tone(90, 0.3, 'sine', 0.22, 35); break;
      case 'frost':   this.tone(1800, 0.15, 'sine', 0.05, 2600); this.tone(2400, 0.1, 'sine', 0.03, 3000, 0.04); break;
      case 'flame':   this.noiseHit(0.16, 0.06, 900, 'bandpass'); break;
      case 'tesla':   this.tone(120, 0.14, 'sawtooth', 0.06, 900); this.noiseHit(0.08, 0.06, 4000, 'highpass'); break;
      case 'die':     this.tone(220, 0.18, 'square', 0.04, 70); break;
      case 'split':   this.tone(300, 0.12, 'sine', 0.08, 120); this.noiseHit(0.1, 0.08, 800); break;
      case 'coin':    this.tone(1320, 0.06, 'square', 0.03); this.tone(1760, 0.08, 'square', 0.03, null, 0.05); break;
      case 'place':   this.tone(300, 0.08, 'triangle', 0.15, 600); this.noiseHit(0.1, 0.1, 700); break;
      case 'upgrade': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.12, null, i * 0.06)); break;
      case 'sell':    [784, 523].forEach((f, i) => this.tone(f, 0.1, 'triangle', 0.1, null, i * 0.07)); break;
      case 'error':   this.tone(160, 0.15, 'square', 0.06, 120); break;
      case 'click':   this.tone(700, 0.04, 'triangle', 0.08); break;
      case 'hitHouse':this.tone(110, 0.3, 'sawtooth', 0.12, 50); this.noiseHit(0.25, 0.15, 400); break;
      case 'wave':    this.tone(220, 0.35, 'sawtooth', 0.07, 330); this.tone(330, 0.5, 'sawtooth', 0.06, 440, 0.2); break;
      case 'boss':    this.tone(70, 0.9, 'sawtooth', 0.12, 45); this.noiseHit(0.8, 0.12, 300); break;
      case 'perk':    [659, 784, 988, 1318].forEach((f, i) => this.tone(f, 0.15, 'sine', 0.12, null, i * 0.07)); break;
      case 'win':     [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.14, null, i * 0.12)); break;
      case 'lose':    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.4, 'sawtooth', 0.08, null, i * 0.2)); break;
    }
  }
};

// =============================================================
//  MUSIK LATAR — sequencer kecil, tiap bioma punya nada sendiri
// =============================================================
const SONGS = {
  menu:    { bpm: 96,  root: 57, scale: [0, 3, 5, 7, 10], prog: [0, 5, 3, 4], lead: 'triangle', bass: 'triangle', bell: false },
  grass:   { bpm: 112, root: 55, scale: [0, 2, 4, 7, 9],  prog: [0, 5, 3, 4], lead: 'square',   bass: 'triangle', bell: false },
  beach:   { bpm: 104, root: 60, scale: [0, 2, 4, 7, 9],  prog: [0, 3, 5, 4], lead: 'triangle', bass: 'sine',     bell: true },
  snow:    { bpm: 92,  root: 52, scale: [0, 2, 3, 7, 8],  prog: [0, 5, 3, 6], lead: 'sine',     bass: 'triangle', bell: true },
  volcano: { bpm: 132, root: 50, scale: [0, 1, 3, 7, 8],  prog: [0, 1, 0, 6], lead: 'sawtooth', bass: 'sawtooth', bell: false }
};

const Music = {
  song: null, step: 0, nextTime: 0, playing: false,

  start(name) {
    this.song = SONGS[name] || SONGS.menu;
    this.step = 0;
    this.playing = true;
    if (Snd.ctx) this.nextTime = Snd.ctx.currentTime + 0.1;
  },

  stop() { this.playing = false; },

  midi(n) { return 440 * Math.pow(2, (n - 69) / 12); },

  // dipanggil tiap frame; menjadwalkan nada sedikit ke depan
  update() {
    if (!this.playing || !Snd.ready()) return;
    const ctx = Snd.ctx, s = this.song;
    const stepDur = 60 / s.bpm / 2; // seperdelapan ketukan
    if (this.nextTime < ctx.currentTime - 0.5) this.nextTime = ctx.currentTime + 0.05;
    while (this.nextTime < ctx.currentTime + 0.15) {
      this.playStep(this.step, this.nextTime - ctx.currentTime, stepDur);
      this.step++;
      this.nextTime += stepDur;
    }
  },

  playStep(i, delay, dur) {
    const s = this.song;
    const bar = Math.floor(i / 8) % s.prog.length;
    const chordDeg = s.prog[bar];
    const deg = (d) => {
      const len = s.scale.length;
      const o = Math.floor(d / len);
      return s.root + s.scale[((d % len) + len) % len] + o * 12;
    };
    const pos = i % 8;
    // bass: ketukan 0, 3, 4, 6
    if (pos === 0 || pos === 3 || pos === 4 || pos === 6) {
      Snd.tone(this.midi(deg(chordDeg) - 12), dur * 1.6, s.bass, 0.16, null, delay, Snd.musicGain);
    }
    // arpeggio lead
    const pattern = [0, 2, 4, 2, 5, 4, 2, 4];
    if (i % 32 < 28 || pos % 2 === 0) {
      const n = deg(chordDeg + pattern[pos]) + 12;
      Snd.tone(this.midi(n), dur * 0.9, s.lead, s.lead === 'sawtooth' ? 0.025 : 0.045, null, delay, Snd.musicGain);
    }
    // lonceng sesekali
    if (s.bell && pos === 0 && bar % 2 === 0) {
      Snd.tone(this.midi(deg(chordDeg + 7) + 12), dur * 6, 'sine', 0.05, null, delay, Snd.musicGain);
    }
    // hi-hat dari noise
    if (pos % 2 === 1 && Snd.noise) {
      const c = Snd.ctx, t = c.currentTime + delay;
      const src = c.createBufferSource(); src.buffer = Snd.noise;
      const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
      const g = c.createGain(); g.gain.setValueAtTime(0.025, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      src.connect(f); f.connect(g); g.connect(Snd.musicGain); src.start(t); src.stop(t + 0.06);
    }
  }
};
