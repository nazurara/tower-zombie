// Mengatur urutan kemunculan zombie dalam satu wave
class WaveManager {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.queue = [];
    this.timer = 0;
    this.hpMult = 1;
    this.total = 0;
  }

  start(cfg) {
    // campur semua grup secara acak tapi tetap rapi: tiap grup tersebar merata
    const items = [];
    for (const g of cfg.groups) {
      const [type, count, interval] = g;
      for (let i = 0; i < count; i++) items.push({ type, interval, order: (i + Math.random() * 0.8) / count });
    }
    items.sort((a, b) => a.order - b.order);
    if (cfg.boss) items.push({ type: cfg.boss, interval: 2500, boss: true });
    this.queue = items;
    this.total = items.length;
    this.hpMult = cfg.hp;
    this.timer = 400;
    this.active = true;
  }

  remaining() { return this.queue.length + this.scene.zombies.length; }

  update(dt) {
    if (this.queue.length === 0) return;
    this.timer -= dt;
    if (this.timer <= 0) {
      const e = this.queue.shift();
      if (e.boss) this.scene.announceBoss(e.type);
      this.scene.spawnZombie(e.type, this.hpMult);
      this.timer = this.queue.length ? this.queue[0].interval : 0;
      // jeda lebih panjang sebelum bos muncul
      if (this.queue.length === 1 && this.queue[0].boss) this.timer = 3000;
    }
  }

  isDone() {
    return this.queue.length === 0 && this.scene.zombies.length === 0;
  }
}
