// =============================================================
//  PENGATURAN GAME — ubah angka di sini untuk menyeimbangkan game
// =============================================================
const GAME = {
  WIDTH: 1024,
  HEIGHT: 640,
  MAP_W: 832,            // lebar area peta (sisanya panel toko di kanan)
  HUD_H: 46,             // tinggi bar atas
  START_COINS: 150,
  START_LIVES: 20,
  MAX_LIVES: 20,
  FIRST_BREAK: 15000,    // waktu bangun sebelum wave pertama tiap bab (ms)
  WAVE_BREAK: 8000,      // jeda antar wave (ms)
  WAVE_BONUS: 30,        // koin bonus tiap wave selesai
  CHAPTER_LIVES: 5,      // nyawa yang dipulihkan saat pindah bab
  SELL_RATE: 0.7,        // jual menara = 70% dari total koin yang dikeluarkan
  MOVE_FEE: 15,          // biaya memindahkan menara saat wave berjalan (gratis saat jeda)
  ULT_CHAPTER: 2         // level 4 (ULTIMATE) terbuka mulai bab ini
};

// -------------------------------------------------------------
//  MENARA. Setiap menara punya 4 level. cost = harga untuk naik ke level itu.
//  unlock = bab ke berapa menara ini bisa dibeli.
// -------------------------------------------------------------
const TOWERS = {
  gun: {
    name: 'Senapan', icon: '🔫', color: 0x4a90d9, unlock: 1, target: 'first',
    desc: 'Murah dan cepat menembak. Andalan di awal.',
    levels: [
      { cost: 50,  damage: 16, range: 130, rate: 480 },
      { cost: 45,  damage: 26, range: 140, rate: 420 },
      { cost: 85,  damage: 40, range: 155, rate: 350 },
      { cost: 180, damage: 55, range: 170, rate: 230, ult: 'Gatling: tembakan super cepat' }
    ]
  },
  cannon: {
    name: 'Meriam', icon: '💣', color: 0xd9534f, unlock: 1, target: 'first',
    desc: 'Peluru meledak dan melukai zombie di sekitarnya.',
    levels: [
      { cost: 90,  damage: 38,  range: 125, rate: 1500, splash: 55 },
      { cost: 70,  damage: 62,  range: 135, rate: 1350, splash: 62 },
      { cost: 125, damage: 98,  range: 145, rate: 1200, splash: 72 },
      { cost: 230, damage: 150, range: 160, rate: 1050, splash: 88, ult: 'Bom cluster: 3 ledakan susulan' }
    ]
  },
  frost: {
    name: 'Menara Es', icon: '❄️', color: 0x4dd0e1, unlock: 1, target: 'first',
    desc: 'Memperlambat zombie. Sangat kuat melawan zombie api.',
    levels: [
      { cost: 70,  damage: 6,  range: 120, rate: 850, slow: 0.35, slowTime: 1500, splash: 40 },
      { cost: 60,  damage: 10, range: 130, rate: 780, slow: 0.45, slowTime: 1800, splash: 46 },
      { cost: 105, damage: 16, range: 142, rate: 700, slow: 0.55, slowTime: 2100, splash: 55 },
      { cost: 190, damage: 26, range: 158, rate: 600, slow: 0.62, slowTime: 2500, splash: 68, ult: 'Beku total: 15% peluang membekukan 1 detik' }
    ]
  },
  sniper: {
    name: 'Penembak Jitu', icon: '🎯', color: 0x8bc34a, unlock: 2, target: 'strong',
    desc: 'Jangkauan sangat jauh, damage besar, tapi lambat.',
    levels: [
      { cost: 120, damage: 95,  range: 250, rate: 1900 },
      { cost: 95,  damage: 155, range: 280, rate: 1800 },
      { cost: 160, damage: 245, range: 310, rate: 1650 },
      { cost: 280, damage: 390, range: 350, rate: 1450, ult: 'Kritis: 25% peluang damage 3x' }
    ]
  },
  flame: {
    name: 'Penyembur Api', icon: '🔥', color: 0xff7043, unlock: 3, target: 'first',
    desc: 'Membakar semua zombie di depannya. Tembus baja, tapi zombie api kebal.',
    levels: [
      { cost: 110, damage: 6,  range: 92,  rate: 120, burn: 10 },
      { cost: 85,  damage: 9,  range: 100, rate: 115, burn: 16 },
      { cost: 135, damage: 14, range: 110, rate: 105, burn: 26 },
      { cost: 240, damage: 21, range: 124, rate: 95,  burn: 40, ult: 'Neraka: semburan jauh lebih lebar' }
    ]
  },
  tesla: {
    name: 'Tesla', icon: '⚡', color: 0xab47bc, unlock: 4, target: 'first',
    desc: 'Petir berantai yang melompat ke beberapa zombie sekaligus.',
    levels: [
      { cost: 150, damage: 32,  range: 130, rate: 950, chains: 3 },
      { cost: 115, damage: 48,  range: 140, rate: 880, chains: 4 },
      { cost: 175, damage: 70,  range: 152, rate: 800, chains: 5 },
      { cost: 310, damage: 100, range: 168, rate: 700, chains: 7, ult: 'Kejut: 20% peluang menyetrum diam 0,6 detik' }
    ]
  }
};
const TOWER_ORDER = ['gun', 'cannon', 'frost', 'sniper', 'flame', 'tesla'];

const TARGET_MODES = [
  { key: 'first',  label: 'Terdepan' },
  { key: 'strong', label: 'Terkuat' },
  { key: 'near',   label: 'Terdekat' },
  { key: 'last',   label: 'Terakhir' }
];

// -------------------------------------------------------------
//  ZOMBIE. Kemampuan khusus:
//  split = pecah jadi zombie kecil saat mati, regen = pulih HP/detik,
//  armor = mengurangi damage tiap peluru, slowResist = kebal lambat (0-1),
//  fireImmune = kebal api, frostWeak = damage es 2x, summon = memanggil anak buah
// -------------------------------------------------------------
const ZOMBIES = {
  // Desa
  walker:  { name: 'Zombie Desa',    tex: 'z_walker',  hp: 60,  speed: 42, reward: 8,  damage: 1, scale: 1.0 },
  runner:  { name: 'Pelari',         tex: 'z_runner',  hp: 40,  speed: 82, reward: 9,  damage: 1, scale: 0.95 },
  brute:   { name: 'Si Gendut',      tex: 'z_brute',   hp: 280, speed: 28, reward: 25, damage: 3, scale: 1.3 },
  // Pantai
  sailor:  { name: 'Pelaut',         tex: 'z_sailor',  hp: 85,  speed: 44, reward: 9,  damage: 1, scale: 1.0 },
  surfer:  { name: 'Peselancar',     tex: 'z_surfer',  hp: 60,  speed: 96, reward: 10, damage: 1, scale: 0.95 },
  bloater: { name: 'Kembung',        tex: 'z_bloater', hp: 230, speed: 32, reward: 16, damage: 2, scale: 1.15, split: { type: 'blob', count: 3 } },
  blob:    { name: 'Gumpalan',       tex: 'z_blob',    hp: 40,  speed: 70, reward: 3,  damage: 1, scale: 0.8 },
  // Salju
  frosty:  { name: 'Zombie Beku',    tex: 'z_frosty',  hp: 120, speed: 40, reward: 10, damage: 1, scale: 1.0, slowResist: 0.5 },
  skier:   { name: 'Pemain Ski',     tex: 'z_skier',   hp: 85,  speed: 105, reward: 11, damage: 1, scale: 0.95 },
  yeti:    { name: 'Yeti',           tex: 'z_yeti',    hp: 520, speed: 30, reward: 32, damage: 3, scale: 1.3, regen: 14, slowResist: 0.3 },
  // Gunung api
  magma:   { name: 'Zombie Magma',   tex: 'z_magma',   hp: 160, speed: 46, reward: 12, damage: 1, scale: 1.0, fireImmune: true, frostWeak: true },
  knight:  { name: 'Ksatria Baja',   tex: 'z_knight',  hp: 220, speed: 36, reward: 15, damage: 2, scale: 1.05, armor: 12 },
  hound:   { name: 'Pelari Abu',     tex: 'z_hound',   hp: 120, speed: 102, reward: 12, damage: 1, scale: 0.95 },
  // Bos (satu di wave terakhir tiap bab)
  boss1:   { name: 'BOS: Petani Raksasa', tex: 'z_boss1', hp: 1500, speed: 22, reward: 150, damage: 8, scale: 1.0, boss: true },
  boss2:   { name: 'BOS: Kapten Karam',   tex: 'z_boss2', hp: 1900, speed: 22, reward: 200, damage: 8, scale: 1.0, boss: true, summon: { type: 'sailor', count: 2, every: 4500 } },
  boss3:   { name: 'BOS: Raja Yeti',      tex: 'z_boss3', hp: 2600, speed: 20, reward: 260, damage: 10, scale: 1.0, boss: true, regen: 35, slowResist: 0.5 },
  boss4:   { name: 'BOS: Raja Zombie',    tex: 'z_boss4', hp: 3400, speed: 20, reward: 400, damage: 20, scale: 1.0, boss: true, armor: 10, fireImmune: true, summon: { type: 'hound', count: 2, every: 4000 } }
};

// -------------------------------------------------------------
//  BIOMA / BAB. Tiap bab punya peta, jalur, rumah, dekorasi, zombie dan wave sendiri.
//  Wave: [jenis, jumlah, jeda ms]. Bos selalu muncul paling akhir.
// -------------------------------------------------------------
const BIOMES = [
  {
    key: 'grass', name: 'Desa Hijau', sub: 'Bab 1', ground: 'g_grass',
    path: { edge: 0x5d3a1a, mid: 0xa47148, top: 0xc8975f, pebble: 0x8a5a33 },
    house: 'h_grass', houseAt: { x: 748, y: 510 },
    PATH: [ { x: -30, y: 140 }, { x: 680, y: 140 }, { x: 680, y: 320 }, { x: 150, y: 320 }, { x: 150, y: 520 }, { x: 700, y: 520 } ],
    decor: [ ['d_tree', 16, 60, 60, 26], ['d_bush', 10, 40, 34, 16], ['d_rock', 7, 40, 40, 16], ['d_flower', 40, 30, 20, 0], ['d_mushroom', 10, 30, 24, 0] ],
    weather: 'leaves', overlay: null, music: 'grass',
    waves: [
      { hp: 1.0, groups: [['walker', 8, 1300]] },
      { hp: 1.2, groups: [['walker', 10, 1100], ['runner', 5, 1100]] },
      { hp: 1.45, groups: [['walker', 12, 950], ['runner', 8, 950], ['brute', 2, 2500]] },
      { hp: 1.7, groups: [['walker', 14, 850], ['runner', 10, 850], ['brute', 4, 2200]], boss: 'boss1' }
    ]
  },
  {
    key: 'beach', name: 'Pantai Berkabut', sub: 'Bab 2', ground: 'g_sand',
    path: { edge: 0x8d6e4a, mid: 0xc9a77a, top: 0xdcc093, pebble: 0xf5f0e1 },
    house: 'h_beach', houseAt: { x: 748, y: 206 },
    sea: true,
    PATH: [ { x: -30, y: 480 }, { x: 180, y: 480 }, { x: 180, y: 150 }, { x: 410, y: 150 }, { x: 410, y: 450 }, { x: 620, y: 450 }, { x: 620, y: 216 }, { x: 700, y: 216 } ],
    decor: [ ['d_palm', 13, 60, 62, 24], ['d_umbrella', 4, 50, 70, 20], ['d_beachrock', 7, 40, 40, 16], ['d_shell', 26, 28, 20, 0], ['d_star', 14, 28, 22, 0] ],
    weather: 'mist', overlay: null, music: 'beach',
    waves: [
      { hp: 4.2, groups: [['sailor', 12, 1000], ['surfer', 4, 1000]] },
      { hp: 4.9, groups: [['sailor', 12, 900], ['surfer', 10, 900], ['bloater', 2, 2500]] },
      { hp: 5.6, groups: [['sailor', 14, 800], ['surfer', 10, 800], ['bloater', 5, 2000]] },
      { hp: 6.4, groups: [['sailor', 16, 750], ['surfer', 14, 750], ['bloater', 6, 1800]], boss: 'boss2' }
    ]
  },
  {
    key: 'snow', name: 'Puncak Salju', sub: 'Bab 3', ground: 'g_snow',
    path: { edge: 0x6f8aa6, mid: 0xb8cde0, top: 0xdbe8f3, pebble: 0x9fb6cc },
    house: 'h_snow', houseAt: { x: 748, y: 548 },
    PATH: [ { x: 130, y: -30 }, { x: 130, y: 260 }, { x: 360, y: 260 }, { x: 360, y: 120 }, { x: 600, y: 120 }, { x: 600, y: 420 }, { x: 270, y: 420 }, { x: 270, y: 560 }, { x: 700, y: 560 } ],
    decor: [ ['d_pine', 18, 56, 56, 24], ['d_snowman', 4, 50, 60, 18], ['d_icerock', 8, 40, 40, 16], ['d_snowbush', 12, 34, 30, 0] ],
    weather: 'snow', overlay: [0x9ad0ff, 0.07], music: 'snow',
    waves: [
      { hp: 13, groups: [['frosty', 12, 1000], ['skier', 6, 1000]] },
      { hp: 15, groups: [['frosty', 14, 900], ['skier', 10, 900], ['yeti', 2, 2800]] },
      { hp: 17, groups: [['frosty', 16, 800], ['skier', 12, 800], ['yeti', 4, 2400]] },
      { hp: 19.5, groups: [['frosty', 18, 750], ['skier', 14, 700], ['yeti', 5, 2200]], boss: 'boss3' }
    ]
  },
  {
    key: 'volcano', name: 'Gunung Api', sub: 'Bab 4', ground: 'g_ash',
    path: { edge: 0x1a1210, mid: 0x3b2a24, top: 0x4e3a31, pebble: 0xff6d00 },
    house: 'h_volcano', houseAt: { x: 748, y: 226 },
    PATH: [ { x: -30, y: 570 }, { x: 210, y: 570 }, { x: 210, y: 340 }, { x: 80, y: 340 }, { x: 80, y: 140 }, { x: 430, y: 140 }, { x: 430, y: 470 }, { x: 640, y: 470 }, { x: 640, y: 236 }, { x: 700, y: 236 } ],
    decor: [ ['d_lava', 5, 70, 90, 34], ['d_deadtree', 12, 56, 56, 22], ['d_basalt', 10, 40, 40, 16], ['d_skull', 10, 30, 30, 0], ['d_crystal', 8, 34, 34, 0] ],
    weather: 'embers', overlay: [0xff3d00, 0.08], music: 'volcano',
    waves: [
      { hp: 28, groups: [['magma', 14, 950], ['hound', 6, 950]] },
      { hp: 32, groups: [['magma', 14, 850], ['knight', 6, 1600], ['hound', 10, 850]] },
      { hp: 36, groups: [['magma', 16, 750], ['knight', 10, 1300], ['hound', 14, 750]] },
      { hp: 41, groups: [['magma', 18, 700], ['knight', 12, 1200], ['hound', 16, 650]], boss: 'boss4' }
    ]
  }
];

function totalWaves() {
  return BIOMES.reduce((n, b) => n + b.waves.length, 0);
}

// ---------------- fungsi bantu ----------------

// Jarak titik (px,py) ke ruas garis a-b
function distToSegment(px, py, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - a.x) * dx + (py - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
}

// Angka acak yang selalu sama untuk seed yang sama (dekorasi peta tidak berubah-ubah)
function makeRng(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FONT_HEAD = '"Lilita One", "Arial Black", sans-serif';
const FONT_BODY = '"Fredoka", "Trebuchet MS", sans-serif';

// Teks dengan gaya standar game
function txt(scene, x, y, str, size, color, extra) {
  const style = Object.assign({
    fontFamily: FONT_BODY, fontSize: size + 'px', color: color || '#ffffff',
    stroke: '#1a1a2e', strokeThickness: Math.max(2, Math.round(size / 6))
  }, extra || {});
  return scene.add.text(x, y, str, style);
}

// Simpan/baca data kecil (skor tertinggi, mute) dengan aman
const Store = {
  get(key, def) {
    try { const v = localStorage.getItem('tz_' + key); return v === null ? def : JSON.parse(v); } catch (e) { return def; }
  },
  set(key, val) {
    try { localStorage.setItem('tz_' + key, JSON.stringify(val)); } catch (e) { /* abaikan */ }
  }
};
