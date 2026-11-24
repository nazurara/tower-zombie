# Tower Zombie

Game tower defense 2D: bangun menara, hentikan gerombolan zombie sebelum menghancurkan rumahmu.
Dibuat dengan **JavaScript + Phaser 3**.

## Fitur
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

## Kredit
Font: Lilita One & Fredoka (Google Fonts). Engine: Phaser 3.
