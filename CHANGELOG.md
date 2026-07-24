# CHANGELOG — Update Card Produk: Rating & Total Terjual

## Ringkasan Perubahan

Informasi gender ("Uniseks") yang sebelumnya tampil di bawah Pilihan Warna pada
Card Produk sudah dihapus. Sebagai gantinya, Card Produk sekarang menampilkan
**Rating Produk** (bintang) dan **Total Terjual**, diambil dari data
Review dan Order yang sesungguhnya (bukan data dummy/placeholder).

Urutan tampilan Card Produk sekarang:

```
Gambar Produk
Pilihan Warna
Rating Produk + Total Terjual   <-- baru, menggantikan teks "Uniseks"
Nama Produk
Harga
```

Perubahan ini berlaku otomatis di seluruh halaman yang memakai komponen
`ProductCard` yang sama: Home (Produk Terbaru/Terlaris/Rekomendasi), Halaman
Semua Produk, Halaman Kategori, Halaman Pencarian, dan Related Product di
Detail Produk.

Catatan: Wishlist (halaman Wishlist) memakai layout baris (`WishlistItemRow`)
yang berbeda dari Card Produk dan tidak pernah menampilkan teks "Uniseks",
jadi tidak ada perubahan tampilan di sana. Halaman "Pasangan Produk" di Detail
Produk juga memakai layout kartu tersendiri (`PairedProductsSection`, bukan
`ProductCard`) yang juga tidak pernah menampilkan info gender — dibiarkan
tidak berubah sesuai aturan "jangan mengubah fitur yang tidak berhubungan".

## File yang Diubah

### Backend

- **`backend/src/repositories/reviewRepository.js`**
  Tambah fungsi `getAverageRatings(productIds)` — versi batch dari
  `getAverageRating()` yang sudah ada, mengambil rata-rata rating & jumlah
  review untuk banyak produk sekaligus dalam satu query (bukan satu query per
  produk), supaya Card Produk yang tampil dalam jumlah banyak tetap ringan.

- **`backend/src/repositories/productRepository.js`**
  Tambah fungsi `getSoldCounts(productIds)` — menghitung total quantity
  `order_items` per produk, HANYA dari order berstatus `sudah_dibayar` atau
  `selesai` (lihat bagian "Cara Pengambilan Data" di bawah).

- **`backend/src/services/productService.js`**
  Tambah fungsi `attachRatingAndSold()` yang memanggil kedua fungsi di atas
  secara paralel lalu menyisipkan field `rating`, `reviewCount`, dan
  `totalTerjual` ke setiap response produk. Dipasang di tiga endpoint publik
  yang memasok data ke Card Produk: `getProducts()` (list/grid/search/kategori),
  `getProductById()`, dan `getProductBySlug()` (Detail Produk, termasuk Related
  Product). `createProduct()`/`updateProduct()` (dipakai Admin) tidak disentuh
  karena responsnya tidak dipakai Card Produk.

### Frontend

- **`frontend/types/product.ts`**
  Tambah field opsional `totalTerjual?: number` pada tipe `Product`.

- **`frontend/utils/formatSoldCount.ts`** *(file baru)*
  Util format angka Total Terjual: pemisah ribuan titik untuk angka wajar
  (`1.250`, `15.200`), disingkat `rb+`/`jt+` untuk angka sangat besar
  (`100 rb+`, `1 jt+`) supaya tidak membuat Card melebar/tumpuk.

- **`frontend/utils/enrichProduct.ts`**
  Tambah fallback `rating ?? 0`, `reviewCount ?? 0`, `totalTerjual ?? 0`
  sebagai jaring pengaman (backend sudah selalu mengirim ketiganya). Default
  `fiturSingkat` (dipakai Purchase Panel & Wishlist, bukan Card Produk) TIDAK
  diubah supaya tampilan di luar Card Produk tidak ikut berubah.

- **`frontend/components/shared/ProductCard.tsx`**
  - Menghapus baris info gender ("Uniseks"/"Pria"/"Wanita") dan teks fallback
    "Uniseks" yang sebelumnya tampil di bawah Pilihan Warna.
  - Menyusun ulang urutan tampilan menjadi: Gambar -> Pilihan Warna -> Rating +
    Total Terjual -> Nama Produk -> Harga (rentang ukuran/`sizeRangeLabel`
    tetap dipertahankan sebagai baris kecil di bawah warna karena merupakan
    fitur terpisah yang tidak berhubungan dengan info gender).
  - Menambah baris Rating (ikon bintang, komponen `RatingStars` yang sudah
    ada) + `"{jumlah} Terjual"` (via `formatSoldCount`).
  - Baris ini dibungkus `flex items-center` + `truncate` pada teks Terjual
    supaya tetap satu baris rapi di Desktop, Tablet, maupun Mobile (tidak
    bertumpuk/keluar dari Card).

## Cara Pengambilan Data

**Rating Produk** — rata-rata kolom `rating` dari tabel `reviews`, HANYA
baris dengan `status = 'ditampilkan'` (review yang disembunyikan Admin tidak
ikut dihitung — logika ini sama persis dengan `getAverageRating()` yang sudah
dipakai halaman Detail Produk). Produk tanpa review sama sekali -> rating
`0` (Card menampilkan ⭐ 0.0).

**Total Terjual** — jumlah `quantity` dari `order_items` yang `product_id`-nya
cocok, HANYA untuk order dengan `status` `sudah_dibayar` atau `selesai`.
Order dengan status `menunggu_pembayaran`, `dibatalkan`, `expired`, `diproses`,
`dikemas`, `dikirim`, `refund`, maupun status pembayaran gagal TIDAK dihitung
(sesuai permintaan). Produk yang belum pernah terjual -> `0` (Card
menampilkan "Terjual 0").

## Hasil Pengujian

| # | Skenario | Hasil |
|---|----------|-------|
| 1 | Teks "Uniseks" tidak muncul lagi di Card Produk | ✅ Baris gender & fallback "Uniseks" dihapus dari `ProductCard.tsx` |
| 2 | Rating produk tampil sesuai data review (hanya review `ditampilkan`) | ✅ `getAverageRatings()` diverifikasi filter `status = 'ditampilkan'`, dipasang di seluruh endpoint publik |
| 3 | Total Terjual sesuai transaksi valid (`sudah_dibayar`/`selesai` saja) | ✅ `getSoldCounts()` diverifikasi filter status via join `orders!inner(status)` |
| 4 | Produk tanpa review tetap rapi (⭐ 0.0) | ✅ Fallback `rating ?? 0` di `enrichProduct` + backend selalu mengirim `0` kalau tidak ada key rating |
| 5 | Produk tanpa penjualan tampil "Terjual 0" | ✅ Fallback `totalTerjual ?? 0`, `formatSoldCount(0)` -> `"0"` |
| 6 | Seluruh halaman yang memakai Card Produk konsisten | ✅ Semua memakai satu komponen `ProductCard` yang sama; data dipasok lewat `getProducts`/`getProductById`/`getProductBySlug` yang sama |
| 7 | Responsive Desktop/Tablet/Mobile, teks tidak tumpuk/keluar Card | ✅ Baris Rating+Terjual pakai `flex items-center` + `truncate`, konsisten dengan pola elemen lain di Card yang sudah responsive |

**Verifikasi teknis tambahan:**
- `npx tsc --noEmit` pada seluruh project frontend: **0 error**.
- `node --check` pada seluruh file backend yang diubah: **valid, tanpa syntax error**.
- Tidak ada migration database yang diperlukan — seluruh data (rating, status
  review, status order, quantity) sudah tersedia di skema yang sudah ada.
