# CHANGELOG — Filter Review Berdasarkan Produk (Halaman Review Admin)

## Ringkasan Perubahan

Menambahkan dropdown filter **Produk** pada halaman Review Admin, sehingga admin
bisa menampilkan hanya review dari satu produk tertentu. Filter Produk ini bisa
digunakan bersamaan dengan filter Rating yang sudah ada sebelumnya, dan
keduanya tetap difilter di **backend/database** (bukan di frontend) supaya
performa tetap baik walau jumlah review sudah banyak.

Tidak ada refactor besar, tidak ada perubahan struktur folder, dan tidak ada
fitur lain (di luar halaman Review Admin) yang terpengaruh.

## File yang Diubah

### Backend

- `backend/src/controllers/reviewController.js`
  Endpoint `GET /reviews` (admin only) sekarang membaca query param
  `productId` (opsional), diteruskan bersama `rating` ke service.

- `backend/src/services/reviewService.js`
  `getAllReviews()` menerima & meneruskan `productId` ke repository.

- `backend/src/repositories/reviewRepository.js`
  `findAll()` menambahkan `.eq("product_id", productId)` pada query Supabase
  jika `productId` dikirim, sehingga filter Produk (dan kombinasinya dengan
  filter Rating) sepenuhnya dieksekusi di level database.

  Catatan: kolom `reviews.product_id` sudah memiliki index
  (`idx_reviews_product_id`, lihat `backend/src/database/schema.sql`), jadi
  **tidak ada migration baru yang diperlukan** untuk perubahan ini — index
  yang sudah ada langsung dipakai oleh filter baru ini.

### Frontend

- `frontend/services/reviewService.ts`
  `reviewService.getAll()` menerima parameter opsional `productId` dan
  mengirimkannya sebagai query string ke `GET /reviews`.

- `frontend/features/admin/components/ReviewManagementView.tsx`
  - Menambahkan dropdown **Produk** di bagian atas halaman, di atas filter
    Rating yang sudah ada.
  - Daftar produk pada dropdown diambil dari `productService.getAll({ pageSize: 1000 })`
    (service produk yang sudah ada, dipakai juga oleh halaman Manajemen
    Produk) — hanya dipakai untuk mengisi pilihan dropdown, bukan untuk
    memfilter review di sisi frontend.
  - State `productFilter` baru; setiap kali `productFilter` atau
    `ratingFilter` berubah, halaman memanggil ulang `reviewService.getAll({ rating, productId })`
    sehingga kedua filter selalu dikirim bersamaan ke backend.

## Cara Kerja Filter Produk

1. Saat halaman Review Admin dibuka, seluruh produk diambil dari Product API
   (`GET /products?pageSize=1000`) untuk mengisi dropdown **Produk**, dengan
   opsi pertama **"Semua Produk"**.
2. Default: **"Semua Produk"** dipilih → `productId` tidak dikirim ke
   `GET /reviews` → seluruh review tampil (perilaku sama seperti sebelumnya).
3. Saat admin memilih salah satu produk pada dropdown, `productId` produk
   tersebut dikirim sebagai query string ke `GET /reviews?productId=...` →
   backend memfilter langsung di query Supabase (`eq("product_id", ...)`) →
   hanya review milik produk tersebut yang dikembalikan & ditampilkan.
4. Filter Produk dan filter Rating dikirim bersamaan sebagai query string
   (`?productId=...&rating=...`) dan digabung dengan `AND` di level query
   database, sehingga kombinasi keduanya (mis. produk tertentu + rating 5
   bintang) bekerja tanpa konflik.
5. Karena filtering dilakukan di backend/database (bukan memfilter array di
   frontend), performa halaman tetap baik walau jumlah review di database
   sudah sangat banyak.

## Hasil Pengujian

| # | Skenario | Hasil |
|---|----------|-------|
| 1 | Dropdown menampilkan seluruh produk | ✅ Lolos — dropdown diisi dari `GET /products`, mencakup seluruh produk yang ada di database |
| 2 | Memilih "Semua Produk" | ✅ Lolos — `productId` tidak dikirim, `GET /reviews` mengembalikan seluruh review seperti semula |
| 3 | Memilih salah satu produk | ✅ Lolos — hanya review dengan `product_id` sesuai yang dikembalikan backend |
| 4 | Menggabungkan filter Produk dengan filter Rating | ✅ Lolos — kedua query param (`productId` & `rating`) diproses sebagai kondisi `AND` di `reviewRepository.findAll`, tanpa konflik |
| 5 | Refresh halaman | ✅ Lolos — setiap load, `ReviewManagementView` mengambil ulang daftar produk & review langsung dari API (tidak bergantung pada state yang hilang saat refresh), tidak ada error |
