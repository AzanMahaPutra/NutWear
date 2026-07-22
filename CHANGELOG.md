# CHANGELOG — Halaman Laporan Transaksi & Export Excel

## Ringkasan Perubahan

Menambahkan halaman Admin baru **"Laporan Transaksi"** (menu baru di Admin
Sidebar, terpisah dari halaman **Pesanan** yang sudah ada) yang:

- Hanya menampilkan transaksi yang **pembayarannya sudah benar-benar
  berhasil** (status pesanan `sudah_dibayar`, `diproses`, `dikemas`,
  `dikirim`, `selesai`) — memakai daftar status yang **sama persis** dengan
  yang sudah dipakai kartu Pendapatan di Dashboard Admin, bukan
  mendefinisikan ulang aturan "sudah dibayar" secara terpisah.
- Menampilkan tabel: Order ID, Nama Customer, Email Customer, Nomor Telepon,
  Tanggal Transaksi, Metode Pembayaran, Status Pembayaran, Total Item, Total
  Belanja, dan tombol Detail.
- Kartu ringkasan (Total Transaksi, Total Pendapatan, Total Produk Terjual,
  Rata-rata Nilai Transaksi) yang mengikuti filter aktif.
- Detail Transaksi (modal): info customer + alamat lengkap, info order
  (termasuk Metode & Status Pembayaran), daftar produk (foto, nama, warna,
  ukuran, jumlah, harga satuan, subtotal), ongkos kirim, dan grand total.
- 8 opsi filter: Hari Ini, Kemarin, Minggu Ini, Bulan Ini, Tahun Ini, Rentang
  Tanggal, Pilih Bulan, Pilih Tahun.
- Export Excel (data sesuai filter aktif, atau seluruh transaksi berhasil
  dibayar), termasuk baris ringkasan di akhir file.
- Seluruhnya server-side pagination + query backend (tidak memuat seluruh
  transaksi ke frontend), dan export di-stream langsung dari backend supaya
  tetap cepat walau data sudah ribuan.

## Catatan Penting

**Migration database:** **tidak ada** migration baru. Fitur ini murni
query/laporan di atas tabel `orders`, `order_items`, `payments`, `users`, dan
`user_addresses` yang sudah ada — tidak menambah kolom/tabel apa pun.

**Kolom "Diskon" & "Voucher":** skema database project ini
(`backend/src/database/schema.sql`) **belum punya sistem diskon/voucher sama
sekali** — tidak ada kolom terkait di `orders` maupun `order_items`. Mengikuti
aturan "jangan melakukan refactor besar" & "gunakan struktur database yang
sudah ada", kolom "Diskon" tetap disertakan di file Excel (sesuai daftar
kolom yang diminta) tapi selalu berisi `Rp0` — **bukan** data yang dikarang.
Kolom "Voucher" tidak dibuatkan kolom Excel terpisah karena tidak ada data
sumbernya sama sekali; pada tampilan Detail Transaksi di halaman (bukan
Excel), baris Diskon/Voucher sengaja **tidak ditampilkan** dibanding
mengarang nilai. Kalau fitur diskon/voucher memang perlu dibangun, itu
perubahan skema (migration + alur checkout) di luar cakupan permintaan ini —
beri tahu saya kalau itu yang dimaksud.

**Lint:** project ini **tidak punya file konfigurasi ESLint sama sekali**
(sudah begitu sebelum perubahan ini — dicek, tidak ada `.eslintrc*` maupun
`eslint.config.*`, dan `next lint`/`npx eslint` gagal jalan karena tidak
menemukan konfigurasi), jadi tidak ada "lint" yang bisa dijalankan untuk
diverifikasi. Yang sudah diverifikasi dan **lolos tanpa error**: `npx tsc
--noEmit` (seluruh project, termasuk file baru) dan `npx next build`
(compile & bundling seluruh halaman berhasil — termasuk halaman Laporan
Transaksi baru; satu-satunya kegagalan build di sandbox pengujian adalah
proses *prerendering* halaman Beranda `(shop)/page.tsx` yang butuh koneksi
ke backend hidup untuk mengambil data produk saat build, sudah begitu
sebelum perubahan ini dan tidak berhubungan dengan fitur ini).

## File yang Diubah / Ditambahkan

### Backend

| File | Perubahan |
|---|---|
| `backend/src/repositories/transactionReportRepository.js` | **Baru.** `buildReportDateRange()` (8 opsi filter, UTC), `findPaidOrders()` (list + pagination `.range()`), `getSummary()` (agregat ringan: query `grand_total` untuk Total Transaksi/Pendapatan, query `order_items` join `orders!inner` untuk Total Produk Terjual), `findPaidOrdersBatch()` (batch untuk export). |
| `backend/src/services/transactionReportService.js` | **Baru.** `getReport()` (orkestrasi list + summary, memakai ulang `orderService.toResponse`). `exportToExcel()` — streaming Excel (`ExcelJS.stream.xlsx.WorkbookWriter`) per batch 200 baris, tanpa menahan seluruh transaksi di memori. |
| `backend/src/controllers/transactionReportController.js` | **Baru.** `getReport` (GET list+summary), `exportExcel` (set header `Content-Disposition` lalu stream file). |
| `backend/src/validators/transactionReportValidator.js` | **Baru.** Validasi `filterType` (8 opsi) + field pendukungnya (`startDate`/`endDate` untuk Rentang Tanggal, `month`/`year` untuk Pilih Bulan, `year` untuk Pilih Tahun), `page`/`limit`, dan `scope` untuk export. |
| `backend/src/routes/transactionReportRoutes.js` | **Baru.** `GET /transaction-reports` dan `GET /transaction-reports/export`, khusus admin (`requireAuth` + `requireRole("admin")`). |
| `backend/src/constants/paymentLabels.js` | **Baru.** Label Metode/Status Pembayaran (disalin dari `frontend/constants/order.ts` supaya konsisten) — dipakai `transactionReportService` untuk kolom Excel. |
| `backend/src/routes/index.js` | Daftarkan route baru `/transaction-reports`. |
| `backend/src/repositories/orderRepository.js` | **Hanya tambah export** `ORDER_SELECT` ke `module.exports` (nilainya tidak diubah) — dipakai ulang `transactionReportRepository` supaya bentuk query order+items+payments+customer+alamat identik dengan halaman Pesanan. Tidak mengubah perilaku halaman Pesanan. |
| `backend/src/repositories/dashboardRepository.js` | **Hanya tambah export** `PAID_ORDER_STATUSES` ke `module.exports` (nilainya tidak diubah) — dipakai ulang `transactionReportRepository` supaya definisi "sudah dibayar" identik dengan Dashboard. Tidak mengubah perilaku Dashboard. |
| `backend/package.json` / `backend/package-lock.json` | Tambah dependency `exceljs` (`^4.4.0`) untuk Export Excel. |

### Frontend

| File | Perubahan |
|---|---|
| `frontend/app/admin/laporan-transaksi/page.tsx` | **Baru.** Route halaman `/admin/laporan-transaksi`. |
| `frontend/features/admin/components/TransactionReportView.tsx` | **Baru.** Halaman utama: kartu ringkasan, filter (8 opsi + input pendukungnya), tabel (`DataTable`), pagination server-side (`Pagination`), modal Detail Transaksi, dan modal pilihan Export Excel (Data Sesuai Filter / Seluruh Transaksi). |
| `frontend/features/admin/components/TransactionDetailView.tsx` | **Baru.** Konten modal Detail Transaksi (info customer + alamat, info order + metode/status pembayaran, daftar produk, ongkir, grand total). |
| `frontend/services/transactionReportService.ts` | **Baru.** `getReport()` (memanggil `GET /transaction-reports`, memakai ulang `toOrder` dari `orderService.ts`) dan `exportExcel()` (memanggil `GET /transaction-reports/export` sebagai blob lalu memicu download). |
| `frontend/constants/routes.ts` | Tambah `ROUTES.admin.laporanTransaksi`. |
| `frontend/features/admin/components/AdminSidebar.tsx` | Tambah menu "Laporan Transaksi" (ikon `FileSpreadsheet`) tepat di bawah menu "Pesanan". |
| `frontend/services/orderService.ts` | **Hanya tambah `export`** pada `interface OrderApiResponse` dan `function toOrder` (isinya tidak diubah) — dipakai ulang `transactionReportService.ts` supaya satu baris transaksi tetap berbentuk tipe `Order` yang sama dengan halaman Pesanan. Tidak mengubah perilaku halaman Pesanan. |

Tidak ada file lain yang diubah — fitur/halaman lain (Produk, Kategori,
Banner, Pelanggan, Review, Pesanan, Dashboard) tidak tersentuh.

## Cara Kerja Halaman Laporan Transaksi

1. Admin membuka menu **"Laporan Transaksi"** di sidebar (di bawah "Pesanan").
2. Halaman memanggil `GET /transaction-reports` yang HANYA mengembalikan
   pesanan dengan status `sudah_dibayar`/`diproses`/`dikemas`/`dikirim`/
   `selesai` (status ini diperbarui backend lewat callback/webhook Midtrans —
   lihat `paymentService.handleMidtransNotification`) — pesanan
   `menunggu_pembayaran`, `dibatalkan`, dan `expired` tidak pernah ikut.
3. Data diambil dengan pagination backend (`.range()`, 10 baris/halaman) —
   frontend tidak pernah memuat seluruh transaksi sekaligus, walau jumlahnya
   sudah ribuan.
4. Klik baris/tombol "Detail" pada tabel membuka modal Detail Transaksi
   (`TransactionDetailView`) memakai data yang sudah ada di baris tabel
   (tidak perlu request tambahan) — bentuknya persis sama dengan tipe
   `Order` yang dipakai halaman Pesanan (customer, items, alamat,
   pembayaran), jadi field foto produk/warna/ukuran/harga/subtotal otomatis
   ikut lengkap.

## Cara Kerja Filter Laporan

Semua 8 opsi filter dihitung di backend
(`transactionReportRepository.buildReportDateRange`), berbasis UTC (konsisten
dengan filter tanggal yang sudah ada di halaman Pesanan):

| Opsi | Rentang yang dipakai |
|---|---|
| Hari Ini | 00:00 hari ini s.d. 00:00 besok (UTC) |
| Kemarin | 00:00 kemarin s.d. 00:00 hari ini (UTC) |
| Minggu Ini | Senin (00:00) minggu berjalan s.d. Senin minggu depan |
| Bulan Ini | Tanggal 1 bulan berjalan s.d. tanggal 1 bulan depan |
| Tahun Ini | 1 Januari tahun berjalan s.d. 1 Januari tahun depan |
| Rentang Tanggal | `startDate` (00:00) s.d. `endDate` + 1 hari (inklusif) |
| Pilih Bulan | Tanggal 1 bulan+tahun terpilih s.d. tanggal 1 bulan berikutnya |
| Pilih Tahun | 1 Januari tahun terpilih s.d. 1 Januari tahun berikutnya |

Tidak memilih filter apa pun (kondisi awal halaman) = "Semua Transaksi",
tanpa batas tanggal. Kartu ringkasan (`getSummary`) dan tabel memakai filter
yang **sama persis**, jadi Total Pendapatan pada kartu selalu sesuai dengan
transaksi yang tampil di tabel/Excel.

## Cara Kerja Export Excel

1. Tombol "Export Excel" membuka modal pilihan: **"Data Sesuai Filter
   Aktif"** atau **"Seluruh Transaksi Berhasil Dibayar"** (mengabaikan
   filter).
2. Frontend memanggil `GET /transaction-reports/export?...&scope=filtered|all`
   dengan `responseType: "blob"`, backend membalas file `.xlsx` yang
   di-*stream* langsung ke response (`ExcelJS.stream.xlsx.WorkbookWriter`) —
   bukan dibuat penuh di memori dulu baru dikirim.
3. Backend mengambil data per **batch 200 transaksi** (`findPaidOrdersBatch`,
   query `.range()` yang sama dengan tabel) dan langsung menuliskan baris
   Excel-nya sebelum mengambil batch berikutnya — memori yang dipakai tetap
   terbatas walau transaksinya sudah ribuan.
4. Setiap **produk** dalam satu transaksi ditulis sebagai satu baris
   (Order ID, Tanggal, Nama Customer, Email, No HP, Produk, Warna, Ukuran,
   Jumlah, Harga, Subtotal, Ongkos Kirim, Diskon, Grand Total, Metode
   Pembayaran, Status Pembayaran) — data order/ongkir/grand total/pembayaran
   diulang di tiap baris produknya supaya tiap baris tetap bisa
   difilter/dijumlah sendiri di Excel oleh Admin.
5. Di baris terakhir ditambahkan ringkasan: **Total Transaksi**, **Total
   Pendapatan**, **Total Produk Terjual** — dihitung berjalan (akumulasi)
   selagi setiap batch diproses, bukan query terpisah, supaya jumlahnya
   dijamin sama dengan baris-baris di atasnya.
6. File otomatis terunduh di browser Admin dengan nama
   `laporan-transaksi-YYYY-MM-DD.xlsx`.

## Hasil Pengujian Seluruh Skenario

Karena project ini butuh Supabase + Midtrans yang hidup untuk pengujian
end-to-end penuh (di luar sandbox pengerjaan), pengujian berikut dilakukan
dengan **menjalankan langsung fungsi backend yang sesungguhnya** (bukan
mock logic-nya, hanya data Supabase yang distub) — lihat detail per
skenario:

1. **Halaman hanya menampilkan transaksi yang sudah berhasil dibayar** — ✅
   `applyPaidFilters` selalu menambahkan `.in("status", PAID_ORDER_STATUSES)`
   (`sudah_dibayar`/`diproses`/`dikemas`/`dikirim`/`selesai`) ke setiap query
   (list, summary, maupun export) — status `menunggu_pembayaran`,
   `dibatalkan`, `expired` tidak pernah masuk daftar tersebut, diverifikasi
   lewat pembacaan kode dan daftar status di `dashboardRepository.js`.
2. **Ringkasan Pendapatan sesuai dengan transaksi yang tampil** — ✅ diuji
   dengan menjalankan `transactionReportService.getReport()` memakai
   repository yang di-stub: `meta.total` dan `summary.totalTransaksi`
   konsisten, `totalPages` terhitung benar (`45` data, `limit 20` →
   `totalPages 3`).
3. **Filter Hari, Bulan, Tahun, dan Rentang Tanggal bekerja dengan benar**
   — ✅ `buildReportDateRange()` diuji langsung untuk **kedelapan** opsi
   filter (termasuk kombinasi Pilih Bulan Juli 2026 dan Pilih Tahun 2026)
   dengan tanggal berjalan **22 Juli 2026** — seluruh rentang tanggal yang
   dihasilkan benar (mis. Minggu Ini dimulai Senin 20 Juli 2026, Rentang
   Tanggal 1–10 Juli 2026 menghasilkan batas akhir eksklusif 11 Juli 2026
   supaya tanggal 10 Juli ikut terhitung).
4. **Detail transaksi menampilkan seluruh informasi order** — ✅
   `TransactionDetailView` memakai tipe `Order` (customer, items, alamat,
   payment) yang sama dengan halaman Pesanan yang sudah teruji, ditambah
   Metode/Status Pembayaran; diverifikasi lewat `npx tsc --noEmit` (tidak
   ada type error pada seluruh field yang dipakai).
5. **Export Excel mengikuti filter yang sedang dipilih** — ✅ `scope:
   "filtered"` meneruskan `filterType`/`startDate`/`endDate`/`month`/`year`
   yang sedang aktif ke `GET /transaction-reports/export`; `scope: "all"`
   mengirim objek filter kosong (`{}`) sehingga `buildReportDateRange`
   mengembalikan `null` (tanpa batas tanggal, status tetap dibatasi ke yang
   sudah dibayar) — diverifikasi lewat pembacaan kode `readFilters()` di
   `transactionReportController.js`.
6. **Data pada Excel sama dengan data yang tampil di halaman** — ✅
   `writeOrderRows()` dan `TransactionReportView`/`TransactionDetailView`
   sama-sama membaca field yang sama dari objek `order` yang berasal dari
   `ORDER_SELECT` (dipakai ulang dari `orderRepository.js`) — dijalankan
   dengan data stub (2 order, 2 produk) lewat `ExcelJS` (write **dan**
   read-back file `.xlsx` sungguhan): seluruh nilai (Order ID, Tanggal,
   Nama, Email, Produk, Warna, Ukuran, Jumlah, Harga, Subtotal, Ongkir,
   Grand Total, Metode & Status Pembayaran) sesuai data input, dan baris
   ringkasan akhir (Total Transaksi `2`, Total Pendapatan `450000`, Total
   Produk Terjual `3`) sesuai perhitungan manual.
7. **Tidak ada transaksi Pending, Expired, maupun Dibatalkan yang ikut
   masuk ke laporan** — ✅ sama seperti poin 1: satu-satunya sumber data
   (`applyPaidFilters`) selalu memfilter status, dipakai konsisten oleh
   `findPaidOrders`, `getSummary`, dan `findPaidOrdersBatch` (export) — tidak
   ada jalur kode yang melewati filter ini.

**Tambahan (verifikasi teknis, di luar 7 skenario di atas):**
- `GET /transaction-reports` dan `GET /transaction-reports/export` diuji
  lewat HTTP sungguhan (Express + `express-validator`, bukan simulasi):
  seluruh kombinasi valid/tidak valid dari 8 filter (termasuk field wajib
  yang hilang untuk Rentang Tanggal/Pilih Bulan/Pilih Tahun, `filterType`
  tidak dikenal, `page`/`scope` tidak valid) menghasilkan status HTTP yang
  benar (`200` untuk valid, `422` beserta pesan per-field untuk tidak
  valid).
- `node -c` pada seluruh file backend baru: tidak ada syntax error.
- Seluruh backend (`src/app.js`, `src/routes/index.js`) berhasil
  di-*require* tanpa error setelah route baru didaftarkan (tidak ada
  kesalahan wiring/circular dependency).
- `npx tsc --noEmit` di frontend: **0 error** (seluruh project, termasuk
  file baru).
- `npx next build`: **compile & bundling berhasil** untuk seluruh halaman
  termasuk `/admin/laporan-transaksi` (kegagalan build hanya terjadi di
  tahap *prerendering* halaman Beranda yang butuh backend hidup — sudah
  disebutkan di bagian "Catatan Penting" di atas, tidak berkaitan dengan
  fitur ini).
