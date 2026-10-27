# Pesanin: Web Tiketing (Struktur Data)

Aplikasi tiket perjalanan sederhana mirip Traveloka. **1176 tiket** dari 8 kategori (pesawat, kereta, bus, kapal, hotel, hiburan, sewa mobil, paket wisata), masing-masing dibagi nasional dan internasional.

> Data bersifat **simulasi** untuk keperluan tugas. Nama destinasi dan operator ada yang nyata, tetapi harga, durasi, rating, dan nama hotel hanya contoh. Durasi dan harga pesawat, kereta, dan bus dihitung dari jarak antarkota, bukan data resmi.

## Berkas
| Berkas | Isi |
|---|---|
| `index.html`, `style.css`, `app.js` | Aplikasi web |
| `buat_data.py` | Pembuat data. `python3 buat_data.py` membuat ulang `data.json` dan `data.js`. Hasilnya selalu sama (seed tetap). |
| `data_manual.json` | Data tulisan tangan (kapal, hiburan, kereta dan bus internasional) yang dibaca `buat_data.py`. |
| `data.json` | Data tiket (hasil `buat_data.py`) |
| `data.js` | Salinan identik `data.json` agar halaman bisa dibuka dengan klik dua kali. Dibuat otomatis oleh `buat_data.py`, jangan diedit tangan. |
| `lab.html` | Panggung Algoritma: visualisasi sorting dan searching beserta log yang tersinkron |
| `tiket.c` | Versi C: struct, array, pointer, linked list, sorting, searching |

## Struktur repo
```
pesanin-tiketing/
├── index.html         halaman utama
├── style.css          gaya
├── app.js             logika aplikasi
├── data.json          data tiket (hasil buat_data.py)
├── data.js            salinan data.json agar bisa dibuka lewat klik dua kali
├── data_manual.json   data tulisan tangan yang dibaca buat_data.py
├── buat_data.py       pembuat data (python3 buat_data.py)
├── tiket.c            versi C: struct, array, pointer, linked list, sorting, searching
└── README.md
```

## Demo online (GitHub Pages)
Setelah di-push: **Settings → Pages → Source: Deploy from a branch → Branch: main, folder: / (root)**. Halaman tersedia di `https://<username>.github.io/<nama-repo>/`.

## Menjalankan
- Web: klik dua kali `index.html`. Untuk memuat `data.json` lewat `fetch`, buka folder dengan Live Server (VS Code).
- C: `gcc tiket.c -o tiket && ./tiket`

## Pemetaan poin tugas ke `app.js`
| Poin | Lokasi | Keterangan |
|---|---|---|
| **Struct** | baris 13 | `class Tiket` berisi 9 field. Satu baris JSON menjadi satu record. |
| **Array** | baris 15 | `tiket[]` adalah array of struct. Indeks sama dengan `id`. |
| **Pointer (nyata)** | baris 245 | `LL` adalah linked list pesanan. Node `{data, next}`. `LL.remove` memakai pointer `p` (prev) dan `c` (curr). |
| **Pointer (simulasi)** | fungsi `memo` (baris 410) | `ptr` menyimpan indeks. Alamat = 0x7A00 + indeks x 128. Tabel `ptr->field` memakai offset byte. |
| **Algoritma sorting** | objek `SORT` (baris 104) | Lima algoritma, masing-masing ditulis **sekali** dan dipakai oleh `sortRun` (mode log) dan `bench` (mode senyap) lewat objek `hooks`. |
| **Sorting** | fungsi `sortRun` (baris 131) | Bubble, Selection, Insertion, Merge, Quick. Log per langkah, ringkasan, animasi batang. |
| **Perbandingan sorting** | fungsi `bench` (baris 348) | Menjalankan ketiganya pada data yang sama dan menampilkan tabel. |
| **Searching** | fungsi `searchRun` (baris 170) | Linear Search (teks), Binary Search harga (batas bawah), Binary Search nama (awalan). Form Dari/Ke (`runForm`) memakai Linear Search. Pemindaian dan batas bawah dipakai bersama lewat fungsi bantu `linearScan` dan `lowerBound`. |
| **Log** | fungsi `pushLog` (baris 77) dan `aLog` (baris 383) | Setiap tindakan menulis log baru yang menggantikan yang lama. |
| **Animasi** | fungsi `anim` (baris 385) | Pemutar frame untuk sorting dan searching. |
| **Panggung Algoritma** | `lab.html` | Halaman khusus untuk melihat sorting (Bubble, Selection, Insertion, Quick) dan searching (Linear, Binary) pada tiket asli. Batang bergeser mulus, baris log muncul sinkron dengan animasi, ada kontrol putar, jeda, langkah, dan kecepatan, serta inspektur `*ptr[a]` dan `*ptr[b]` yang menunjukkan struct dan alamatnya. Dibuka lewat tombol *Panggung* di header. |
| **Total harga** | fungsi `calc` (baris 363) | Tarif x penumpang x (2 bila pulang-pergi). Hotel: tarif x malam x kamar. |
| **Denah kursi** | `LAY` dan fungsi `seatMap` (baris 372) | Pesawat 3-3, kereta 2-2, bus 2-1. Kursi pergi dan pulang terpisah. |
| **E-tiket** | fungsi `showTicket` (baris 459) | Tiket per pesanan dengan barcode dari kode booking dan tombol cetak. |
| **Kartu per rute** | fungsi `groups` (baris 38) | Tiket dengan jenis, asal, dan tujuan sama digabung dalam satu kartu memakai `Map`. Tiket pertama menurut urutan view jadi kartu utama, sisanya di jendela *pilihan lain* (`showOptions`). |

## Kompleksitas
| Algoritma | Waktu | Catatan |
|---|---|---|
| Bubble Sort | O(n^2) | Berhenti lebih awal bila satu pass tanpa pertukaran. |
| Selection Sort | O(n^2) | Pertukaran paling sedikit (maks n-1). |
| Insertion Sort | O(n^2) | Mendekati O(n) pada data hampir terurut. |
| Merge Sort | O(n log n) | Memori tambahan O(n). Stabil. Jumlah "pertukaran" dihitung sebagai penulisan elemen. |
| Quick Sort | O(n log n) rata-rata, O(n^2) terburuk | Pivot elemen terakhir. Pada data yang sudah terurut terjadi kasus terburuk, dan ini terlihat jelas di tombol *Bandingkan semua* pada panel Log. |
| Linear Search | O(n) | Tidak butuh data terurut. |
| Binary Search | O(log n) | Data harus terurut. Program mengurutkan dulu otomatis dan mencatatnya di log. |

## Alur pengguna
Jelajah (kategori, filter, form Dari/Ke/Tanggal) -> Detail (sekali jalan atau pulang-pergi, tanggal, jumlah, pilih kursi) -> Pembayaran -> Kode booking -> Tab *Pesanan* (tersimpan di `localStorage`).

## Lingkup nasional dan internasional
- **Semua:** hasil dibagi dua bagian (Nasional, lalu Internasional), masing-masing dengan judul dan jumlah. Pengurutan tetap bekerja pada seluruh data, lalu tampilan memisahkannya per kelompok tanpa mengubah urutan relatif.
- **Nasional / Internasional:** hanya satu daftar. Saran kota di kolom Dari dan Ke menyempit mengikuti lingkup dan kategori.
- **Hasil kosong:** jika ada tiket di lingkup lain dengan filter yang sama, muncul petunjuk beserta tombol untuk pindah.
- Angka di samping tombol lingkup selalu mengikuti kategori dan filter yang aktif.

## Keamanan
- **Teks pengguna selalu di-escape** (`esc`) sebelum masuk `innerHTML`: kolom cari, form Dari/Ke, dan nama pemesan. Diuji dengan string seperti `<img onerror=...>`: tampil sebagai teks, tidak dijalankan.
- **Data `localStorage` divalidasi** saat dipulihkan (`restoreOrders`): kode harus berformat `PSN-XXXXXX`, id tiket harus ada, tanggal dan angka harus valid. Entri yang rusak atau diubah manual dibuang, dan JSON yang rusak tidak membuat halaman gagal.
- **Kode booking** dibuat dengan `crypto.getRandomValues` (bukan `Math.random`).
- **`index.html` memakai Content-Security-Policy**: skrip hanya dari berkas sendiri, tanpa koneksi jaringan selain font, tanpa `<form>` atau event inline. Panjang input dibatasi (`maxlength`).
- Data pesanan (termasuk nama pemesan) disimpan di perangkat pengguna dalam teks biasa. Itu wajar untuk tugas ini, tetapi bukan penyimpanan untuk data sungguhan.

## Performa
- Log pengurutan hanya menyimpan 150 baris pertama (sisanya cukup dihitung), dan teks baris dibuat hanya bila benar-benar disimpan. Memori JS setelah beberapa pengurutan turun dari sekitar 130 MB menjadi sekitar 13 MB.
- Frame animasi dibuat saat diputar (lazy), bukan semuanya di awal.
- Pembanding teks memakai satu `Intl.Collator` (jauh lebih cepat dari `localeCompare` di dalam perulangan), dan satu `Intl.NumberFormat` dipakai ulang.
- Efek blur pada header yang menempel dihapus karena menggambar ulang setiap kali halaman digulir. Animasi hanya memakai `transform` dan `opacity`, kecuali titik di garis rute (hanya saat di-hover).
- Daftar kartu dibatasi 24 per kelompok dengan tombol *Tampilkan lebih banyak*.

## Struktur kode (clean code)
- Konstanta ada di satu tempat (`CFG`), tidak ada angka "ajaib" yang tersebar.
- Satu implementasi per algoritma (`SORT`), dipakai untuk mode log maupun perbandingan lewat `hooks`.
- Pemindaian linear dan batas bawah binary dipakai bersama (`linearScan`, `lowerBound`), jadi form rute dan kolom cari tidak menulis ulang logika yang sama.
- Fungsi utama punya komentar JSDoc, dan kode mati (variabel, elemen, dan sekitar 20 aturan CSS yang tidak dipakai) sudah dihapus.
- **Batasan yang diketahui:** status aplikasi (`view`, `cat`, `scope`, `cur`, `qty`, dan lainnya) masih berupa variabel global dalam satu berkas. Untuk tugas ini cukup, tetapi pada aplikasi yang lebih besar sebaiknya dikelompokkan dalam satu objek status atau dipecah menjadi modul.

## Catatan
- **Efek gerak** (semuanya mati otomatis bila sistem meminta "kurangi gerakan"): perpindahan tab memudar naik, angka di hero menghitung naik, kartu terangkat saat di-hover dengan titik kecil yang berjalan di garis rute, tanda centang digambar lalu konfeti saat pesanan berhasil, kartu log muncul berurutan, dan baris tabel pointer mengalir masuk saat `ptr` bergeser.
- **Peta memori struct** (tab Konsep Data): satu batang berisi sepuluh segmen (sembilan field dan 2 byte isi penyelaras), panjangnya sebanding dengan ukuran field. Arahkan kursor ke baris tabel untuk menyorot segmennya.
- **Halaman utama dibuat seperti web tiket biasa** (urutkan "Harga termurah", kolom cari, filter) tanpa istilah algoritma. Nama algoritma yang dipakai, alasannya dalam bahasa sederhana, dan statistiknya muncul di **panel Log**. Di layar lebar (1280 px ke atas) panel Log terbuka sendiri di samping; di layar lebih sempit ia dibuka lewat tautan *Lihat prosesnya di Log* atau tombol Log di header. Metode dipilih lewat bagian *Atur metode* di panel Log, dan pengurutan atau pencarian terakhir otomatis diulang dengan metode baru.
- **Pemetaan fitur ke algoritma:** pilihan *Urutkan* memakai metode pengurutan terpilih (Bubble, Selection, Insertion, Merge, atau Quick). Form Dari/Ke memakai Linear Search. Kolom cari memakai Linear Search (teks) atau Binary Search (awalan nama), dan bila yang diketik berupa angka, ia dibaca sebagai harga mulai dari dan memakai Binary Search.
- **Kartu per rute:** jumlah tiket (misalnya 214) lebih besar dari jumlah kartu (113) karena tiket berrute sama digabung. Setelah memilih *Harga termurah*, kartu utama tiap rute adalah yang termurah.
- **Urutan awal** daftar adalah "rekomendasi" (rating tertinggi, selang-seling antar jenis pada kategori Semua). Ini hanya untuk tampilan awal dan memakai sort bawaan JavaScript, bukan bagian algoritma tugas. Pengurutan oleh tombol *Urutkan* memakai algoritma buatan sendiri (`SORT`).
- **Tombol Log** ada di header. Kompleksitas tiap algoritma tampil sebagai tooltip pada pilihan metode dan sebagai baris pertama log.
- **Sewa mobil** dihitung per hari (seperti hotel per malam), dan **paket wisata** per orang. Untuk kategori berbasis lokasi (hotel, hiburan, mobil, wisata) kolom form berubah menjadi *Lokasi* dan *Nama (opsional)*.
- **Log:** setiap tindakan menulis log baru yang menggantikan sebelumnya. Panel terbuka otomatis hanya untuk sorting dan searching. Di layar lebar, konten bergeser saat panel terbuka agar tidak tertutup.
- **Animasi sorting** menampilkan maksimal sekitar 140 tahap yang dipilih merata dari seluruh proses. Pada data besar satu tahap mewakili banyak pertukaran. Jumlah pertukaran sebenarnya ada di ringkasan log.
- **Mengurutkan menurut durasi** mengeluarkan hotel dan hiburan (durasi 0) dari hasil, dan hal itu dicatat di log.
- **Harga lintas kategori** (kategori "Semua"): harga hotel per malam, tiket lain per orang, jadi urutannya hanya indikatif.
- **Pointer di JavaScript** berupa referensi objek. Konsep yang sama dengan pointer C ada di `tiket.c`.
- **Pulang-pergi:** kursi pergi dan kursi pulang dipilih terpisah (dua denah, dua tab).
- **Insertion Sort** menghitung "penggeseran" elemen, Merge Sort menghitung "penulisan", sisanya "pertukaran".
- **Kompatibilitas:** diuji di Chromium (desktop, HP, tablet, mode gelap). Firefox dan Safari belum diuji. Fitur CSS baru (`color-mix`) punya warna cadangan untuk browser lama, dan pergeseran konten saat panel log terbuka memakai JavaScript, bukan `:has()`.
- **Aksesibilitas:** panel log diumumkan ke pembaca layar (`role=log`), fokus keyboard terkunci di dalam modal, dan animasi disembunyikan dari pembaca layar.

## Gambar sampul kartu

Folder `img/` berisi 25 gambar JPG, sudah di-crop ke rasio 16:7 dan dikompres (total sekitar 830 KB). Tiap jenis punya beberapa variasi yang dipilih dari id tiket, supaya kartu tidak monoton. Tiket merek tertentu memakai gambar yang cocok (Garuda, Whoosh, KRL Commuter).

Menambah gambar: simpan dengan pola `jenis-nomor.jpg` (mis. `bus-4.jpg`), lalu naikkan angkanya di `IMGN` pada `app.js`. Sebutkan sumber gambar di laporan.

## Tiket tersimpan

Tombol ♥ pada kartu menyimpan id tiket ke array `FAV[]` (disimpan di `localStorage`). Tab **Tersimpan** menampilkan isinya, dan setiap tindakan tercatat di panel Log.
