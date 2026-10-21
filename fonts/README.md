# Font offline (opsional)

Pesanin memakai Plus Jakarta Sans dari Google Fonts, jadi butuh internet. Tanpa internet halaman tetap jalan dengan font bawaan sistem.
Supaya tampilan sama persis tanpa internet:

1. Unduh **Plus Jakarta Sans** (file variabel, format `.woff2`) dari fonts.google.com atau google-webfonts-helper.
2. Simpan sebagai `fonts/PlusJakartaSans.woff2` (nama file harus persis ini).

Selesai. `style.css` sudah memiliki aturan `@font-face` (famili "Jakarta Offline") yang akan memakai file itu saat Google Fonts tidak bisa dimuat.
