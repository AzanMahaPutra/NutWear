# CHANGELOG — Notifikasi Stok Menipis untuk Admin

## Ringkasan

Menambahkan sistem notifikasi stok menipis di Dashboard Admin dan Manajemen
Produk, dengan Batas Minimum Stok (default **15**) yang bisa diubah Admin
kapan saja lewat halaman Pengaturan. Tidak ada refactor besar, struktur folder,
atau fitur lain yang diubah — seluruh perubahan menambah kode baru di atas
komponen/service/struktur database yang sudah ada.

## File yang Diubah/Ditambahkan

### Backend

| File | Status | Keterangan |
|---|---|---|
| `backend/src/database/migrations/20260722_add_stock_settings_and_low_stock.sql` | Baru | Migration tabel `stock_settings` (single-row, id selalu 1) untuk menyimpan Batas Minimum Stok. |
| `backend/src/database/schema.sql` | Diubah | Menambahkan tabel `stock_settings` beserta baris default (`minimum_stock = 15`). |
| `backend/src/repositories/stockRepository.js` | Diubah | Tambah `getMinimumStock`, `updateMinimumStock`, `findLowStockVariants(threshold)`. |
| `backend/src/services/stockService.js` | Diubah | Tambah `getMinimumStock`, `updateMinimumStock` (validasi angka bulat > 0), `getLowStockReport()` (mengelompokkan varian stok menipis/habis per produk). |
| `backend/src/controllers/stockController.js` | Diubah | Tambah endpoint `getSettings`, `updateSettings`, `getLowStock`. |
| `backend/src/validators/stockValidator.js` | Diubah | Tambah `updateMinimumStockValidator` (memvalidasi `minimumStock` sebagai integer ≥ 1). |
| `backend/src/routes/stockRoutes.js` | Diubah | Tambah route: `GET /stock/settings`, `PUT /stock/settings`, `GET /stock/low-stock` (khusus Admin, mengikuti middleware `requireAuth` + `requireRole("admin")` yang sudah ada). |

### Frontend

| File | Status | Keterangan |
|---|---|---|
| `frontend/services/stockService.ts` | Baru | Client untuk `GET /stock/low-stock`, `GET /stock/settings`, `PUT /stock/settings`. |
| `frontend/components/shared/StockStatusBadge.tsx` | Baru | Komponen badge status stok (`Stok Aman` / `Stok Menipis` / `Stok Habis`) + helper `getStockStatus(stok, minimumStock)`. |
| `frontend/features/admin/components/LowStockWidget.tsx` | Baru | Widget "Stok Menipis" untuk Dashboard Admin. |
| `frontend/features/admin/components/StockSettingsForm.tsx` | Baru | Form "Batas Minimum Stok" untuk halaman Pengaturan. |
| `frontend/features/admin/components/DashboardView.tsx` | Diubah | Menyisipkan `LowStockWidget` di samping Grafik Penjualan. |
| `frontend/features/admin/components/ProductManagementView.tsx` | Diubah | Tambah kolom "Stok" (badge status), filter "Tampilkan hanya stok menipis", dan pembacaan `?edit=productId` dari URL untuk auto-buka modal Edit Produk. |
| `frontend/features/admin/components/VariantManager.tsx` | Diubah | Tambah badge status stok di setiap baris varian pada form Produk. |
| `frontend/app/admin/pengaturan/page.tsx` | Diubah | Menyisipkan `StockSettingsForm` (field lain di halaman ini tetap dummy seperti sebelumnya, tidak diubah). |

## Cara Kerja Sistem Notifikasi Stok

1. **Tidak ada tabel notifikasi baru yang di-fan-out per baris.** Daftar stok
   menipis dihitung *real-time* langsung dari `product_variants.stok` setiap
   kali Admin membuka Dashboard atau Manajemen Produk (`GET /stock/low-stock`),
   sehingga selalu akurat dan otomatis ikut berubah begitu stok atau Batas
   Minimum Stok diperbarui — tidak perlu proses background/cron terpisah.
2. Backend (`stockService.getLowStockReport`) mengambil seluruh varian dengan
   `stok <= batas minimum`, mengecualikan produk yang sudah dinonaktifkan
   (`is_active = false`), lalu mengelompokkannya per produk. Setiap varian
   diberi status:
   - `stok = 0` → **Stok Habis**
   - `0 < stok <= batas minimum` → **Stok Menipis**
   - `stok > batas minimum` → **Stok Aman**
3. **Widget "Stok Menipis" di Dashboard Admin** menampilkan Nama Produk,
   Warna, Ukuran, Sisa Stok, dan badge "Segera Restock" untuk setiap varian
   yang stoknya menipis/habis. Klik salah satu item mengarahkan ke
   `/admin/produk?edit=<productId>` — begitu daftar produk termuat,
   `ProductManagementView` membaca parameter `edit` tersebut, membuka modal
   Edit Produk untuk produk terkait, lalu membersihkan parameter dari URL.
4. **Halaman Manajemen Produk** (halaman yang mengelola stok produk & varian)
   menambahkan:
   - Kolom **Stok** pada tabel produk — menampilkan badge status stok
     terburuk di antara seluruh varian produk tersebut.
   - Filter **"Tampilkan hanya stok menipis"** (checkbox) — bisa dipakai
     bersamaan dengan Search dan Filter Kategori yang sudah ada (semuanya
     AND, bukan OR). Saat aktif, hanya produk dengan minimal satu varian
     berstatus Stok Menipis/Stok Habis yang ditampilkan.
   - Badge status stok per varian juga ditambahkan di form Edit Produk
     (`VariantManager`), di sebelah nilai stok masing-masing varian.

## Cara Kerja Batas Minimum Stok

1. Disimpan di tabel `stock_settings` (baris tunggal, `id = 1`), default
   **15**. Admin dapat mengubahnya kapan saja lewat halaman **Pengaturan**
   (bagian baru "Batas Minimum Stok", di bawah field pengaturan toko yang
   sudah ada/dummy — field lain tidak diubah).
2. Backend memvalidasi nilai baru harus berupa angka bulat ≥ 1
   (`PUT /stock/settings`, body `{ minimumStock }`).
3. Nilai ini adalah **satu sumber kebenaran** yang dipakai di seluruh sistem:
   widget Stok Menipis di Dashboard, filter & kolom Stok di Manajemen Produk,
   serta badge status stok di tabel varian form Produk — begitu Admin
   menyimpan nilai baru, seluruh pengecekan stok (di semua tempat tersebut)
   otomatis mengikuti nilai terbaru pada request berikutnya (masing-masing
   komponen mengambil nilai ini lewat `GET /stock/settings` saat dimuat).

## Hasil Pengujian Seluruh Skenario

1. **Stok varian menjadi 15 (= batas minimum default).**
   ✅ `statusForStock(15, 15)` menghasilkan `"menipis"` (kondisi `stok <=
   minimumStock`), sehingga varian tersebut masuk ke `GET /stock/low-stock`
   dan muncul di daftar stok menipis pada widget Dashboard maupun filter
   Manajemen Produk.
2. **Stok menjadi 8.**
   ✅ Tetap menghasilkan status `"menipis"` (8 ≤ 15), tetap muncul di widget
   Dashboard maupun tabel Manajemen Produk.
3. **Stok menjadi 0.**
   ✅ `statusForStock(0, 15)` menghasilkan `"habis"` — badge berubah menjadi
   "Stok Habis" (merah) di tabel produk, tabel varian, dan tetap termasuk
   dalam daftar `GET /stock/low-stock` (dengan status `habis`).
4. **Admin mengubah batas minimum menjadi 20.**
   ✅ `PUT /stock/settings` memperbarui baris tunggal di `stock_settings`.
   Karena seluruh endpoint (`getLowStockReport`, `getMinimumStock`) selalu
   membaca nilai terbaru dari tabel ini tanpa cache, seluruh pengecekan stok
   di Dashboard, Manajemen Produk, dan form Varian otomatis mengikuti nilai
   20 pada permintaan berikutnya — varian dengan stok 16–20 yang sebelumnya
   "Stok Aman" akan berubah menjadi "Stok Menipis".
5. **Klik salah satu notifikasi pada widget Stok Menipis.**
   ✅ `onClick` pada item widget memanggil `router.push
   ("/admin/produk?edit=<productId>")`. Di halaman Manajemen Produk,
   `useEffect` membaca parameter `edit` setelah daftar produk termuat,
   mencocokkan `productId`, lalu memanggil `setEditingProduct` +
   `setFormOpen(true)` sehingga modal Edit Produk untuk produk tersebut
   langsung terbuka, dan parameter `edit` dibersihkan dari URL.
