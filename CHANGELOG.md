# CHANGELOG — Perbaikan Filter Tahun (Halaman Pesanan Admin)

## Ringkasan Perubahan

Filter **Tahun** pada halaman Pesanan Admin sebelumnya berupa `<select>` dropdown
dengan daftar tahun yang di-hardcode (6 tahun sekitar tahun berjalan). Ini
diganti dengan komponen **Year Picker** bergaya kalender yang mendukung
navigasi ke tahun berapa pun, tanpa batas, dan tanpa perlu menambah daftar
tahun secara manual di source code saat memasuki tahun baru.

Filter **Bulan** tidak diubah sama sekali — tetap dropdown seperti semula.

## File yang Diubah

| File | Jenis Perubahan | Keterangan |
|---|---|---|
| `frontend/components/ui/YearPicker.tsx` | **Baru** | Komponen Year Picker generik (reusable), dipakai sebagai pengganti dropdown tahun. |
| `frontend/features/admin/components/OrderManagementView.tsx` | Diubah | Import `YearPicker`, hapus konstanta `CURRENT_YEAR`/`YEAR_OPTIONS` (dropdown lama), ganti blok `<select>` filter Tahun dengan `<YearPicker />`. |

Tidak ada file lain yang disentuh. Struktur folder, service (`orderService.ts`),
maupun backend (`orderRepository.js`, `orderController.js`) **tidak diubah** —
backend memang sudah menerima parameter `year` sebagai angka bebas (lihat
`buildDateRange` di `orderRepository.js`), jadi kompatibel langsung tanpa
perubahan apa pun di sisi server.

## Cara Kerja Year Picker

- Field filter menampilkan label **"Tahun"**; setelah Admin memilih tahun,
  field berubah menampilkan tahun tersebut (mis. `2026`), sama seperti pola
  field Bulan yang sudah ada.
- Saat field diklik, muncul popover berisi **grid 12 tahun** (mirip picker
  "tahun lahir" pada aplikasi modern).
- Admin dapat menekan tombol panah **‹** / **›** untuk berpindah 12 tahun ke
  belakang/depan secara berulang — sehingga tahun berapa pun (2024, 2027,
  2035, 2055, dst.) tetap bisa dijangkau tanpa batas atas/bawah.
- Tahun yang sedang berjalan ditandai dengan teks tebal; tahun yang sedang
  aktif sebagai filter ditandai dengan latar gelap.
- Tersedia tombol **"Semua Tahun"** di popover untuk mengosongkan filter
  tahun (setara opsi "Semua Tahun" pada dropdown lama).
- Popover otomatis tertutup saat Admin mengklik area lain (pola yang sama
  seperti dropdown saran pada `OrderSearchBar`).
- Tidak ada daftar tahun yang di-hardcode di mana pun pada komponen ini —
  tahun dihitung murni dari `new Date().getFullYear()` dan aritmetika halaman
  (12 tahun per halaman), sehingga tetap berfungsi normal saat tahun berganti
  tanpa perlu update source code.
- Filtering data tetap sepenuhnya di backend/database (`GET /orders?year=...`)
  — komponen ini hanya mengganti *tampilan* input, tidak mengubah cara data
  diambil/difilter, sehingga tetap efisien walau data pesanan sudah sangat
  banyak.
- Nilai yang dikirim ke `orderService`/backend tetap berupa string angka
  tahun biasa (mis. `"2026"`), persis seperti sebelumnya — jadi kombinasi
  dengan filter Bulan, Status Pesanan, Status Pembayaran, dan Search Order ID
  tetap berjalan seperti semula tanpa perubahan pada `OrderFilterParams` atau
  logic `buildDateRange` di backend.

## Hasil Pengujian Skenario

1. **Filter Bulan tetap bekerja seperti sebelumnya** — ✅ Tidak ada perubahan
   pada kode/markup filter Bulan (`MONTH_OPTIONS`, `<select>`-nya tetap sama
   persis).
2. **Filter Tahun menggunakan Year Picker, bukan dropdown** — ✅ Elemen
   `<select>` untuk Tahun sudah dihapus, digantikan `<YearPicker />` dengan
   tampilan kalender/grid tahun.
3. **Admin dapat memilih tahun berapa pun tanpa perlu menambah data tahun
   secara manual** — ✅ Tidak ada array/daftar tahun tetap; navigasi ‹ ›
   memungkinkan berpindah ke tahun mana pun tanpa batas.
4. **Filter Tahun tetap bekerja dengan seluruh filter lain** — ✅
   `onChange={setYearFilter}` tetap mengisi state `yearFilter` yang sama
   persis dipakai pada objek `filters` (dikirim ke `orderService.getAllOrders`
   dan `deleteOrdersByFilter`), sehingga kombinasi dengan Bulan, Status
   Pesanan, Status Pembayaran (di dalam Detail Pesanan), dan Search Order ID
   tidak berubah.
5. **Saat memasuki tahun baru, sistem tetap dapat digunakan tanpa perlu
   mengubah source code** — ✅ Tahun berjalan (`currentYear`) dan halaman
   grid dihitung secara dinamis dari `new Date().getFullYear()`, tidak
   pernah di-hardcode.
6. **Tidak ada perubahan pada fitur filter lainnya** — ✅ Filter Tanggal,
   Status Pesanan, Search Order ID, tombol Reset Filter, dan Hapus Semua
   tidak disentuh sama sekali; hanya blok Tahun yang diganti.
