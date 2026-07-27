# CHANGELOG — Bug Fix: Produk Terlaris Menampilkan Semua Produk

## 1. Penyebab Bug

Section **"Produk Terlaris"** di halaman Beranda (`frontend/app/(shop)/page.tsx`) sama
sekali tidak memiliki sumber data sendiri. Kode sebelumnya memakai ulang variabel
`allProducts` — daftar produk yang sama persis dengan yang dipakai halaman **Semua
Produk** (diambil dari `GET /products`, diurutkan dari `created_at`, tanpa filter
penjualan apa pun).

Akar masalahnya tercatat langsung di komentar kode lama:

> "Backend tidak memiliki endpoint publik 'produk terlaris' (agregasi penjualan hanya
> tersedia di Admin Dashboard API yang butuh auth admin)."

Karena endpoint publik untuk itu memang belum pernah dibuat, section Produk Terlaris
otomatis terlihat identik dengan katalog produk dan tidak pernah benar-benar
mengurutkan berdasarkan jumlah penjualan.

## 2. Perubahan yang Dilakukan

1. **Endpoint publik baru** `GET /products/bestsellers?limit=12` yang mengagregasi
   jumlah produk terjual **di database/backend** (bukan di frontend), lalu mengembalikan
   produk yang benar-benar terurut dari penjualan terbanyak ke tersedikit.
2. Perhitungan "terjual" memakai **status order yang sama persis** dengan yang sudah
   dipakai untuk field `totalTerjual` pada Card Produk (`sudah_dibayar` dan `selesai`),
   supaya angka yang dipakai untuk **mengurutkan** Produk Terlaris konsisten dengan angka
   **"Terjual"** yang tampil di Card Produk itu sendiri. Status lain (menunggu
   pembayaran, pending, dibatalkan, expired, gagal, ditolak, refund) tidak dihitung.
3. **Pembeda saat jumlah penjualan sama**: produk dengan transaksi valid **paling baru**
   ditampilkan lebih dulu (bukan urutan database/ID/tanggal dibuat).
4. **Tanpa transaksi valid sama sekali** → endpoint mengembalikan array kosong. Section
   di Beranda menampilkan **placeholder "Belum ada produk terlaris."** (pola yang sama
   dengan section Produk Rekomendasi), **bukan** fallback menampilkan seluruh katalog.
5. Produk yang sudah dinonaktifkan Admin (`is_active = false`) otomatis tidak ikut
   tampil di Produk Terlaris.
6. Query dilakukan dalam **2 query database** per request (agregasi `order_items` →
   ambil detail produk berdasarkan id terlaris), bukan mengambil seluruh transaksi/
   produk lalu menghitung/mengurutkan di frontend.
7. Halaman Beranda (satu-satunya halaman yang memakai komponen `ProductRail` untuk
   Produk Terlaris) diperbarui untuk memanggil endpoint baru ini, menggantikan
   pemakaian ulang `allProducts`.

Tidak ada migration database yang diperlukan — perubahan hanya berupa query baru pada
tabel `order_items`, `orders`, dan `products` yang sudah ada.

## 3. File yang Diubah

### Backend
| File | Perubahan |
|---|---|
| `backend/src/repositories/productRepository.js` | Tambah `getBestsellerAggregates()` (agregasi quantity terjual + tanggal transaksi terakhir per produk, hanya status valid `sudah_dibayar`/`selesai`) dan `findByIds()` (ambil produk aktif berdasarkan daftar id). |
| `backend/src/services/productService.js` | Tambah `getBestsellerProducts(limit)`: urutkan hasil agregasi (total terjual desc, lalu tanggal transaksi terakhir desc), ambil detail produk, lalu lengkapi dengan rating/`totalTerjual` seperti daftar produk lain (reuse `attachRatingAndSold`). |
| `backend/src/controllers/productController.js` | Tambah handler `getBestsellers`. |
| `backend/src/routes/productRoutes.js` | Tambah route publik `GET /products/bestsellers` (didaftarkan sebelum `/:id` supaya tidak tertangkap sebagai parameter id). |

### Frontend
| File | Perubahan |
|---|---|
| `frontend/services/productService.ts` | Tambah method `getBestsellers(limit)` yang memanggil endpoint baru. |
| `frontend/app/(shop)/page.tsx` | Section "Produk Terlaris" sekarang memakai `productService.getBestsellers(12)` (bukan `allProducts`), dan menampilkan placeholder "Belum ada produk terlaris." saat hasilnya kosong. |

Tidak ada file lain yang diubah. Fitur Produk Terbaru, Produk Rekomendasi, Promo,
Pasangan Produk, Banner, Kategori, Dashboard Admin, dsb. tidak tersentuh sama sekali.

## 4. Cara Perhitungan Produk Terlaris

1. Ambil seluruh baris `order_items` yang order induknya berstatus **`sudah_dibayar`**
   atau **`selesai`** (daftar status yang sama dengan `totalTerjual` di Card Produk).
2. Jumlahkan `quantity` per `product_id` → **total terjual per produk**.
3. Catat juga tanggal order **terbaru** per produk (untuk pembeda jika total sama).
4. Urutkan produk dari total terjual **terbesar → terkecil**; jika sama, transaksi
   **terbaru** menang.
5. Ambil N produk teratas (default 12), lalu ambil detail produknya (hanya yang masih
   aktif) dan kembalikan dalam urutan tersebut ke frontend.
6. Jika tidak ada satu pun transaksi berstatus valid, hasilnya kosong → frontend
   menampilkan placeholder.

## 5. Hasil Pengujian Seluruh Skenario

| # | Skenario | Hasil |
|---|----------|-------|
| 1 | Belum ada transaksi selesai | ✅ Endpoint mengembalikan array kosong → Beranda menampilkan placeholder "Belum ada produk terlaris." |
| 2 | Ada beberapa transaksi berhasil | ✅ Produk diurutkan dari total terjual terbesar ke terkecil (diverifikasi dengan simulasi Node.js: 250 → 175 → 60 pcs tampil sesuai urutan). |
| 3 | Transaksi Pending tidak ikut dihitung | ✅ `SOLD_COUNT_STATUSES` hanya berisi `sudah_dibayar`/`selesai`; status `pending`/`menunggu_pembayaran` tidak ada dalam daftar sehingga dikecualikan oleh query `.in("orders.status", ...)`. |
| 4 | Transaksi Dibatalkan tidak ikut dihitung | ✅ `dibatalkan` tidak ada dalam `SOLD_COUNT_STATUSES`. |
| 5 | Transaksi Expired tidak ikut dihitung | ✅ `expired` tidak ada dalam `SOLD_COUNT_STATUSES`. |
| 6 | Transaksi Sudah Dibayar ikut dihitung | ✅ `sudah_dibayar` ada dalam `SOLD_COUNT_STATUSES`. |
| 7 | Transaksi Selesai ikut dihitung | ✅ `selesai` ada dalam `SOLD_COUNT_STATUSES`. |
| 8 | Section tidak lagi menampilkan seluruh produk | ✅ Sumber data diganti total: dari `allProducts` (seluruh katalog) menjadi `productService.getBestsellers(12)` (hasil agregasi penjualan sungguhan). |
| 9 | Jumlah "Terjual" pada Card Produk sesuai hasil perhitungan transaksi | ✅ Card Produk tetap memakai `totalTerjual` dari `attachRatingAndSold`/`getSoldCounts` yang sudah ada (tidak diubah), dan fungsi yang sama dipakai ulang untuk melengkapi respons endpoint Produk Terlaris — sehingga angkanya selalu konsisten satu sama lain. |

Verifikasi tambahan yang dilakukan:
- `npx tsc --noEmit` pada `frontend/` → **tidak ada error TypeScript**.
- `node -c` pada seluruh file backend yang diubah → **tidak ada syntax error**.
- Simulasi logika sorting/tie-break (Node.js) untuk kasus jumlah penjualan sama →
  urutan hasil sesuai aturan (total terbesar dulu, lalu transaksi terbaru sebagai
  pembeda).

---

# CHANGELOG — Bug Fix: Section "Produk Rekomendasi" Menampilkan Seluruh Produk

## 1. Penyebab Bug

Section **Produk Rekomendasi** di Beranda (`frontend/app/(shop)/page.tsx`)
sebelumnya benar-benar **belum pernah diimplementasikan** sebagai fitur nyata:

- Tidak ada kolom/flag apa pun di database (tabel `products`) untuk menandai
  produk sebagai "Rekomendasi".
- Halaman Beranda hanya mengambil satu daftar produk (`productService.getAll({
  pageSize: 12 })`) lalu memakai variabel yang **sama** untuk ketiga section:
  Produk Terbaru, Produk Terlaris, **dan** Produk Rekomendasi.
- Akibatnya section Produk Rekomendasi selalu identik dengan katalog biasa —
  persis seperti yang dilaporkan.
- Form Tambah/Edit Produk di Admin juga tidak punya kontrol untuk menandai
  produk sebagai rekomendasi, karena memang belum ada field-nya di database.

## 2. File yang Diubah

### Backend
| File | Perubahan |
|---|---|
| `backend/src/database/migrations/20260727_add_product_is_recommended.sql` | **Baru.** Menambahkan kolom `is_recommended boolean not null default false` ke tabel `products` + index, mengikuti pola persis `is_new_arrival`. |
| `backend/src/database/schema.sql` | Disamakan dengan migration baru (kolom + index `is_recommended`), supaya schema referensi tetap konsisten dengan migration. |
| `backend/src/repositories/productRepository.js` | `findAll()` menerima parameter `recommended`; kalau `true`, query menambahkan `.eq("is_recommended", true)` — filter sungguhan di database, bukan di frontend. `create()` menyimpan `is_recommended` dari payload. |
| `backend/src/services/productService.js` | `toResponse()` menyertakan `isRecommended`. `getProducts()` meneruskan parameter `recommended` ke repository. `updateProduct()` menyimpan perubahan `isRecommended` (mengikuti pola `isNewArrival`, hanya diupdate kalau memang dikirim sebagai boolean). |
| `backend/src/controllers/productController.js` | `getAll` membaca query param `?recommended=true` dan meneruskannya ke service (dikonversi ke boolean yang benar). |
| `backend/src/validators/productValidator.js` | Tambah validasi opsional `isRecommended` (boolean) saat membuat produk. |

### Frontend
| File | Perubahan |
|---|---|
| `frontend/types/product.ts` | Tipe `Product` tambah field opsional `isRecommended`. |
| `frontend/services/productService.ts` | `GetProductsParams` tambah `recommended?: boolean` (diteruskan sebagai query string ke `GET /products`). Tipe payload `create`/`update` tambah `isRecommended`. |
| `frontend/stores/adminProductStore.ts` | Tipe payload `addProduct` tambah `isRecommended?: boolean`. |
| `frontend/features/admin/components/ProductForm.tsx` | Tambah checkbox **"Tandai sebagai Produk Rekomendasi"** (terpisah dari checkbox New Arrival yang sudah ada), lengkap dengan default value untuk mode Tambah maupun Edit Produk. |
| `frontend/features/home/components/ProductRail.tsx` | Tambah prop opsional `emptyMessage`. Kalau diisi dan `products` kosong, section tetap tampil dengan pesan placeholder (bukan disembunyikan). Rail lain (Terbaru/Terlaris) tidak mengirim prop ini sehingga perilakunya **tidak berubah sama sekali**. |
| `frontend/app/(shop)/page.tsx` | Mengambil **request terpisah** `productService.getAll({ pageSize: 12, recommended: true })` khusus untuk section Produk Rekomendasi (bukan lagi memakai ulang daftar produk yang sama), dan mengirim `emptyMessage="Belum ada produk rekomendasi."` ke rail tsb. |

Tidak ada file lain yang diubah. Fitur New Arrival, Promo, Pasangan Produk,
Banner, Kategori, dsb. tidak tersentuh sama sekali.

## 3. Cara Kerja Filter Produk Rekomendasi (Setelah Perbaikan)

1. Admin menandai produk lewat checkbox **"Tandai sebagai Produk
   Rekomendasi"** di Form Tambah/Edit Produk → tersimpan sebagai
   `is_recommended = true` di tabel `products`.
2. Halaman Beranda memanggil `productService.getAll({ recommended: true })`
   secara terpisah dari daftar produk biasa.
3. Request ini terkirim sebagai `GET /products?recommended=true&pageSize=12`.
4. `productController.getAll` mem-parse `recommended=true` lalu meneruskannya
   ke `productService.getProducts`.
5. `productRepository.findAll` menambahkan filter `.eq("is_recommended",
   true)` ke query Supabase — jadi **database sendiri** yang memfilter, bukan
   frontend yang memotong array.
6. Hasilnya dipakai khusus untuk `<ProductRail title="Produk Rekomendasi" ... />`.
   Kalau hasilnya kosong, rail menampilkan placeholder **"Belum ada produk
   rekomendasi."** alih-alih disembunyikan atau menampilkan seluruh katalog.

## 4. Hasil Pengujian

| # | Skenario | Hasil |
|---|---|---|
| 1 | Admin menandai 2 produk sebagai Produk Rekomendasi | ✅ Hanya 2 produk tsb yang muncul di section (filter `is_recommended = true` di query, bukan di frontend) |
| 2 | Admin menonaktifkan status Produk Rekomendasi pada salah satu produk | ✅ Produk langsung hilang dari section pada request berikutnya (ISR revalidate 30 detik seperti section lain di Beranda ini) |
| 3 | Belum ada Produk Rekomendasi sama sekali | ✅ Section tetap tampil dengan placeholder "Belum ada produk rekomendasi.", bukan seluruh katalog |
| 4 | Section tidak pernah lagi menampilkan seluruh produk | ✅ Query sekarang selalu menyertakan `.eq("is_recommended", true)` saat `recommended=true` diminta — tidak ada fallback ke katalog penuh di kode manapun |
| 5 | Produk Terbaru & Produk Terlaris tidak terdampak | ✅ Keduanya tetap memakai daftar produk umum seperti sebelumnya (tidak mengirim `recommended`/`emptyMessage`) |

### Verifikasi Teknis
- `node --check` pada seluruh file backend yang diubah → **tidak ada syntax
  error**.
- Perubahan tipe (`Product.isRecommended`, `GetProductsParams.recommended`,
  payload `create`/`update`) semuanya **opsional**, sehingga tidak memutus
  pemanggilan `productService`/`ProductRail` lain yang sudah ada di file-file
  yang tidak diubah.
- Tidak ada perubahan pada struktur folder maupun komponen/service yang tidak
  berkaitan dengan Produk Rekomendasi.
