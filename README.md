# Tower Zombie

Game tower defense 2D: bangun menara, hentikan gerombolan zombie sebelum menghancurkan rumahmu.
Dibuat dengan **JavaScript + Phaser 3**. Semua gambar dan suara dibuat lewat kode, jadi game langsung jalan tanpa file aset.

## Fitur (versi 3)
- **4 lokasi / bab** yang berganti otomatis tiap 4 wave: Desa Hijau → Pantai Berkabut → Puncak Salju → Gunung Api (total 16 wave).
  Tiap lokasi punya peta, jalur, rumah, cuaca, musik, dan **zombie khusus** sendiri, plus **bos** di wave terakhirnya.
- **Menaramu ikut pindah**: saat ganti lokasi, menara dikemas lalu dipasang otomatis di titik terbaik peta baru.
- **6 jenis menara**, masing-masing 4 level:

  | Menara | Keahlian | Terbuka |
  |---|---|---|
  | Senapan | murah, cepat | Bab 1 |
  | Meriam | ledakan area | Bab 1 |
  | Menara Es | memperlambat, kuat lawan zombie api | Bab 1 |
  | Penembak Jitu | jangkauan sangat jauh, damage besar | Bab 2 |
  | Penyembur Api | membakar semua di depannya, tembus baja | Bab 3 |
  | Tesla | petir berantai ke banyak zombie | Bab 4 |

- **Upgrade bertahap**: Lv1–3 bisa kapan saja, **Lv4 ULTIMATE terbuka mulai Bab 2** dengan kemampuan khusus
  (Gatling, bom cluster, beku total, kritis 3x, semburan lebar, kejut listrik).
- **Kelola menara**: upgrade, **pindah** (gratis saat jeda, 15 koin saat wave), **jual** (uang kembali 70%), dan pilih **mode target**
  (Terdepan / Terkuat / Terdekat / Terakhir).
- **Zombie dengan kemampuan unik**: pecah jadi 3 (Kembung), pulih HP (Yeti), berbaju baja (Ksatria), kebal api (Magma),
  bos yang memanggil anak buah.
- **Skill tiap wave**: pilih 1 dari 3 (damage, kecepatan, diskon, bunga bank, kritis, dll).
- Kecepatan 1x/2x/3x, jeda, mulai wave lebih cepat untuk bonus koin, skor tertinggi tersimpan di browser.

## Cara main
- Klik **MAIN**.
- Klik kartu menara di panel kanan, lalu klik area kosong di peta. Tahan **Shift** untuk menaruh beberapa sekaligus.
- Klik menara untuk membuka info: **UPGRADE**, **Target**, **PINDAH**, **JUAL**.
- Zombie yang sampai di rumah mengurangi nyawa. Nyawa 0 = game over. Selesaikan wave 16 untuk menang.

### Tombol keyboard
| Tombol | Fungsi |
|---|---|
| 1–6 | pilih menara untuk dibangun |
| U | upgrade menara terpilih |
| G | pindahkan menara terpilih |
| X / Delete | jual menara terpilih |
| T | ganti mode target |
| N | mulai wave sekarang (bonus koin) |
| F | ganti kecepatan 1x/2x/3x |
| Spasi | jeda |
| M | suara on/off |
| Esc / klik kanan | batal |

## Menjalankan di komputer
Paling aman pakai server lokal (dari folder proyek):
```
python -m http.server 8000
```
lalu buka http://localhost:8000

Atau di VS Code pakai ekstensi **Live Server** (klik kanan `index.html` → Open with Live Server).
Phaser dimuat dari CDN; kalau offline otomatis memakai salinan di `lib/phaser.min.js`.

## Upload ke GitHub Pages
```
git add .
git commit -m "versi 3: 4 lokasi, 6 menara, upgrade Lv4, pindah menara"
git push
```
Di repo GitHub: **Settings > Pages**, pilih branch `main` dan folder `/ (root)`, lalu Save.
Link game: `https://USERNAME.github.io/NAMA-REPO/`

## Struktur
```
index.html
lib/phaser.min.js      cadangan Phaser untuk mode offline
src/
  config.js            SEMUA angka game: menara, zombie, bioma, jalur, wave
  perks.js             daftar skill tiap wave
  audio.js             efek suara + musik latar (Web Audio)
  art.js               semua gambar dibuat dengan Canvas
  main.js              start game
  ui/                  Button, Sidebar (toko & info menara)
  objects/             Zombie, Tower, Projectile, WaveManager, Effects
  scenes/              Boot, Menu, Game, GameOver
assets/                tempat gambar & suara asli kalau mau dipakai
```

## Mengubah game
- **Keseimbangan**: ubah angka di `src/config.js` (`TOWERS`, `ZOMBIES`, `hp` tiap wave, `GAME.START_COINS`, dll).
- **Lokasi baru**: tambah satu objek di `BIOMES` (jalur `PATH`, posisi rumah, dekorasi, wave).
- **Skill baru**: tambah satu objek di `src/perks.js`.

## Mengganti gambar dan suara
1. Taruh file di `assets/images/` dan `assets/audio/`.
2. Di `BootScene.js` tambahkan `preload()`, misalnya `this.load.image('d_tree', 'assets/images/tree.png')`.
3. Di `art.js` hapus baris yang membuat tekstur dengan nama sama.
4. Untuk suara, ganti `Snd.play('nama')` dengan `this.sound.play('nama')`.

## Rencana pengembangan
- [x] Rumah, upgrade, jual, skill tiap wave
- [x] 6 jenis menara + Lv4 ULTIMATE
- [x] 4 lokasi dengan zombie & bos berbeda
- [x] Pindah menara & mode target
- [x] Skor tertinggi (localStorage)
- [ ] Gambar & suara asli (Kenney.nl)
- [ ] Mode tanpa akhir (endless)
- [ ] GIF gameplay di README

## Kredit
Font: Lilita One & Fredoka (Google Fonts). Engine: Phaser 3.
