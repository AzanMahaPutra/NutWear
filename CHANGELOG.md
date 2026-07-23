# CHANGELOG — Halaman Inventory Stock Admin

## Ringkasan Perubahan

Menambahkan halaman Admin baru **"Inventory Stock"** (menu baru di Admin
Sidebar, tepat di bawah "Produk" — **bukan** halaman Produk/Edit Produk yang
sudah ada) supaya Admin bisa memantau & mengedit stok **seluruh varian**
produk dari satu tempat, tanpa perlu membuka halaman edit produk satu per
satu.

- Menampilkan tabel **satu baris per varian**: Foto, Nama Produk, Warna,
  Ukuran, SKU, Stok Saat Ini, Status Stok, dan tombol **Edit**.
- **Search** real-time (debounce 300ms) berdasarkan Nama Produk atau SKU,
  diproses di backend/database (bukan di frontend).
- **Filter Status Stok**: Semua Stok / Stok Aman / Stok Menipis / Stok Habis
  — mengikuti Batas Minimum Stok yang sama dengan fitur Notifikasi Stok
  Menipis yang sudah ada sebelumnya (Pengaturan Admin).
- **Pagination server-side** (20 baris/halaman) — tidak pernah memuat seluruh
  data produk/varian ke frontend sekaligus, supaya halaman tetap cepat walau
  produk sudah ribuan dan varian puluhan ribu.
- **Modal Edit Stok**: menampilkan info varian (Nama Produk, Warna, Ukuran,
  Stok Saat Ini) + input **Stok Baru** (manual, hanya angka, tidak boleh
  negatif/kosong) dan tombol **Quick Adjustment** (+5/+10/-5/-10) yang
  mengisi input yang sama sehingga tetap bisa dikoreksi manual.
- Setelah **Simpan**, baris terkait di tabel langsung diperbarui (stok +
  status) **tanpa refresh halaman**.
- **Modal Riwayat Perubahan Stok**: daftar histori tiap varian — Nama Produk,
  Varian, Stok Lama, Stok Baru, Selisih Perubahan, Admin yang mengubah, dan
  Tanggal Perubahan. Data riwayat hanya pernah di-*insert*, tidak pernah
  dihapus/ditimpa.

## Catatan Penting

- **Tidak ada refactor besar** — fitur ini dibangun di atas modul stok yang
  sudah ada sebelumnya (`stockController/Service/Repository/Validator/Routes`,
  awalnya dibuat untuk fitur "Notifikasi Stok Menipis"), bukan modul baru dari
  nol. Endpoint & fungsi lama (`PATCH /stock/:variantId/adjust`,
  `GET /stock/settings`, `GET /stock/low-stock`, dst.) **tidak diubah
  perilakunya** dan tetap kompatibel dengan pemanggil lama (mis.
  `orderService.js` saat checkout).
- Struktur folder project **tidak diubah**. Halaman baru mengikuti pola
  routing Next.js App Router yang sudah ada (`app/admin/<nama-halaman>/page.tsx`
  + view di `features/admin/components/`).
- Produk yang sudah **dinonaktifkan** (`is_active = false`) tidak ikut
  ditampilkan di Inventory Stock — konsisten dengan perilaku widget "Stok
  Menipis" yang sudah ada sebelumnya.
- Tabel `stock_logs` mendapat 3 kolom baru yang **nullable**
  (`admin_id`, `stok_sebelum`, `stok_sesudah`) supaya baris log lama (hasil
  pengurangan stok otomatis saat checkout, yang tidak melibatkan Admin) tetap
  valid tanpa perlu backfill data.

## File yang Diubah / Ditambahkan

### Database
- `backend/src/database/migrations/20260724_add_inventory_stock_management.sql` **(baru)**
  — kolom audit `stock_logs.admin_id/stok_sebelum/stok_sesudah`, index
  trigram untuk search Nama Produk & SKU, index untuk filter Status Stok.
- `backend/src/database/schema.sql` — disinkronkan dengan migration di atas.

### Backend
- `backend/src/repositories/stockRepository.js` — fungsi baru
  `findInventory()` (search + filter status + pagination server-side) dan
  `setVariantStock()` (set stok absolut untuk modal Edit Stok/Quick
  Adjustment); `logStock()`, `decreaseStock()`, `increaseStock()`,
  `findLogsByVariant()` diperluas untuk mencatat/menampilkan admin & snapshot
  stok lama/baru.
- `backend/src/services/stockService.js` — fungsi baru `getInventory()` dan
  `setInventoryStock()`; `getStockLogs()` sekarang mengembalikan data
  camelCase yang sudah diperkaya (nama produk, varian, nama admin, selisih);
  `adjustStock()` menerima `adminId` opsional.
- `backend/src/controllers/stockController.js` — endpoint baru `getInventory`
  dan `setStock`; endpoint `adjust` sekarang meneruskan `req.user.id`.
- `backend/src/routes/stockRoutes.js` — route baru `GET /stock/inventory` dan
  `PATCH /stock/:variantId/set`.
- `backend/src/validators/stockValidator.js` — validator baru
  `inventoryQueryValidator` (query search/status/page/pageSize) dan
  `setStockValidator` (stok wajib angka bulat ≥ 0).

### Frontend
- `frontend/app/admin/inventory-stok/page.tsx` **(baru)** — halaman Inventory
  Stock Admin.
- `frontend/features/admin/components/InventoryStockView.tsx` **(baru)** —
  komponen utama: search bar, filter status, tabel, pagination.
- `frontend/features/admin/components/InventoryEditStockModal.tsx` **(baru)**
  — modal Edit Stok + Quick Adjustment.
- `frontend/features/admin/components/InventoryStockHistoryModal.tsx`
  **(baru)** — modal Riwayat Perubahan Stok.
- `frontend/features/admin/components/AdminSidebar.tsx` — menu baru
  "Inventory Stock".
- `frontend/constants/routes.ts` — route baru `ROUTES.admin.inventoryStok`.
- `frontend/services/stockService.ts` — tipe (`InventoryItem`,
  `StockLogEntry`, dll.) dan fungsi API baru (`getInventory`, `setStock`,
  `getLogs`).
- `frontend/utils/formatDate.ts` — tambah `formatDateTime()` untuk kolom
  "Tanggal Perubahan" di Riwayat Stok.

## Cara Kerja Inventory Stock

1. Admin membuka menu **Inventory Stock** di Sidebar
   (`/admin/inventory-stok`).
2. Frontend memanggil `GET /stock/inventory?search=&status=&page=&pageSize=`.
3. Backend (`stockRepository.findInventory`) melakukan **satu query** ke
   `product_variants` yang di-*join* ke `products` (`!inner`) untuk:
   - mencocokkan `search` terhadap `sku` **atau** `products.nama_produk`
     (`ILIKE`, case-insensitive) — dipercepat index trigram (`pg_trgm`);
   - hanya menampilkan produk yang `is_active = true`;
   - memfilter `status` (aman/menipis/habis) berdasarkan `stok` vs Batas
     Minimum Stok yang berlaku;
   - mengambil hanya satu halaman data lewat `.range()` (server-side
     pagination), diurutkan per Nama Produk → Warna → Ukuran.
4. Setiap varian diperkaya dengan status stok dan satu foto paling relevan
   (foto yang warnanya cocok dengan warna varian, atau foto pertama produk
   bila tidak ada foto khusus warna tersebut).
5. Saat Admin menekan **Edit**, modal menampilkan Stok Saat Ini. Admin bisa
   mengetik **Stok Baru** langsung, atau menekan tombol Quick Adjustment
   (+5/+10/-5/-10) yang menghitung ulang nilai di input yang sama (tidak
   pernah kurang dari 0).
6. Saat **Simpan**, frontend memanggil `PATCH /stock/:variantId/set` dengan
   `{ stokBaru }`. Backend menghitung selisih terhadap stok saat ini,
   memperbarui `product_variants.stok`, dan mencatat satu baris di
   `stock_logs` (kecuali kalau stok tidak berubah sama sekali).
7. Setelah tersimpan, baris terkait di tabel Inventory Stock diperbarui
   langsung di state React (stok & badge status) — **tanpa reload halaman**.
   Karena widget "Stok Menipis" di Dashboard & Pengaturan Batas Minimum Stok
   selalu membaca `product_variants.stok` terbaru dari database, keduanya
   otomatis konsisten begitu dibuka/direfresh berikutnya.

## Cara Kerja Riwayat Stok

1. Setiap kali stok sebuah varian berubah — baik lewat Inventory Stock
   (`setVariantStock`) maupun lewat alur lama `adjust`/checkout
   (`increaseStock`/`decreaseStock`) — satu baris baru **selalu di-INSERT**
   ke `stock_logs` (Nama Produk & Varian diturunkan lewat relasi
   `variant_id`, bukan disalin manual): `quantity` (selisih), `type`
   (`in`/`out`), `stok_sebelum`, `stok_sesudah`, `admin_id` (kalau perubahan
   dilakukan Admin lewat Inventory Stock/adjust), dan `created_at`.
2. Tidak ada operasi `UPDATE`/`DELETE` terhadap baris `stock_logs` di mana
   pun pada codebase — riwayat tidak pernah hilang atau tertimpa.
3. Saat Admin menekan **"Lihat Riwayat Perubahan Stok"** dari modal Edit
   Stok, frontend memanggil `GET /stock/:variantId/logs`, yang mengembalikan
   seluruh baris `stock_logs` milik varian tersebut (terbaru lebih dulu),
   sudah di-*join* ke `product_variants`/`products` (Nama Produk, Warna,
   Ukuran, SKU) dan `users` (nama Admin yang mengubah — kosong/"Sistem" untuk
   log lama seperti hasil checkout otomatis).

## Hasil Pengujian Skenario

| # | Skenario | Hasil |
|---|----------|-------|
| 1 | Search produk (nama) berjalan dengan benar | ✅ `ILIKE` pada `products.nama_produk` lewat embedded filter `!inner`, diverifikasi lewat pembacaan query & pola yang sama persis dengan `transactionReportRepository.getSummary` yang sudah berjalan di production |
| 2 | Search SKU berjalan dengan benar | ✅ `ILIKE` pada `product_variants.sku`, digabung dengan pencarian nama produk lewat `.or()` |
| 3 | Admin dapat mengedit stok | ✅ `PATCH /stock/:variantId/set` (input manual) |
| 4 | Stok langsung berubah tanpa refresh | ✅ `handleStockSaved` memperbarui state React setelah request sukses |
| 5 | Status stok langsung berubah | ✅ status dihitung ulang dari stok baru (`getStockStatus`) begitu state diperbarui |
| 6 | Notifikasi/widget stok menipis ikut berubah | ✅ widget & laporan stok menipis selalu membaca `product_variants.stok` terkini dari database, otomatis konsisten |
| 7 | Quick Adjustment (+5/+10/-5/-10) bekerja dengan benar | ✅ menghitung ulang nilai di input Stok Baru (tidak pernah di bawah 0), tetap memakai endpoint `set` yang sama |
| 8 | Riwayat stok tersimpan | ✅ setiap perubahan stok (manual/otomatis) selalu di-INSERT ke `stock_logs`, tidak pernah dihapus |
| 9 | Stok tidak bisa bernilai negatif | ✅ divalidasi berlapis: input hanya menerima digit di frontend, `setStockValidator` (`isInt({min:0})`) di backend, dan pengecekan ulang di `stockService.setInventoryStock` |
| 10 | Halaman tetap responsif walau data sangat banyak | ✅ search, filter status, dan pagination seluruhnya diproses database (`.range()`, index trigram + b-tree), frontend hanya memuat maksimal 20 baris per request |

> Catatan: pengujian di atas dilakukan lewat **code review & code tracing**
> menyeluruh terhadap alur request-response backend↔frontend (menyesuaikan
> pola-pola yang sudah terbukti berjalan di fitur lain pada codebase yang
> sama, mis. `TransactionReportView`/`transactionReportRepository`), **bukan**
> eksekusi otomatis end-to-end, karena sandbox pengerjaan ini tidak memiliki
> akses ke instance Supabase/Midtrans project maupun `node_modules` frontend
> (tidak ada koneksi jaringan untuk `npm install`). Backend JavaScript sudah
> lolos `node --check` (validasi sintaks) untuk seluruh file yang diubah.
> Disarankan menjalankan `npm run build` di frontend dan smoke test manual di
> environment Anda sebelum deploy ke production.
