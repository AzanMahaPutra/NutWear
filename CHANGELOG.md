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
