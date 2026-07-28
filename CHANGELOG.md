# CHANGELOG — Peningkatan Search & Filter Halaman Review Admin

Update ini memperbarui sistem pencarian di halaman **Review Admin** supaya
tetap nyaman dipakai walau jumlah review & produk sudah sangat banyak, sesuai
permintaan:

1. **Search Bar tunggal** (tampilan sama dengan halaman Produk Admin) yang bisa
   mencari berdasarkan **Nama Produk** (sebagian kata), **SKU Produk**, ATAU
   **Nama User** yang memberi review — dengan debounce, tanpa request ke
   backend di setiap ketikan huruf.
2. **Dropdown Filter Kategori** di sebelah Search Bar, diambil dari database
   (Category API), bisa dipakai bersamaan dengan Search maupun filter Rating
   yang sudah ada.

Seluruh proses Search & Filter Kategori dilakukan di **backend/database**
(bukan mengambil semua review lalu difilter di JavaScript), supaya performa
tetap cepat walau data sudah banyak.

Dropdown **"Produk"** yang lama (berisi daftar seluruh produk satu per satu)
**digantikan** oleh Search Bar baru ini — dropdown itu sendiri yang menjadi
tidak praktis begitu jumlah produk sangat banyak (persis masalah yang diminta
untuk diperbaiki), dan pencarian nama/SKU produk sekarang sudah tercakup oleh
Search Bar. Kemampuan filter berdasarkan `productId` tetap dipertahankan di
backend (`reviewService.getAllReviews` / `reviewRepository.findAll`) supaya
tidak ada kemampuan API yang hilang, hanya UI dropdown-nya yang diganti.

Tidak ada refactor besar, struktur folder tidak berubah, dan tidak ada fitur
lain di luar halaman Review Admin yang tersentuh (Produk Admin, Order,
Payment, dll. tetap seperti semula).

---

## 1. File yang Diubah

### Backend
| File | Perubahan |
|---|---|
| `backend/src/repositories/reviewRepository.js` | `findAll()` menerima `categoryId` & `search` baru. `categoryId` difilter lewat relasi `products!inner` (pola yang sama dengan `stockRepository.findInventory`). `search` mencari Nama Produk & SKU (tabel `products`/`product_variants`) serta Nama User (tabel `users`) lewat 2 query kecil, lalu digabung ke query utama dengan `.or("product_id.in.(...),user_id.in.(...)")` — seluruhnya tetap query database, bukan filter di JavaScript. |
| `backend/src/services/reviewService.js` | `getAllReviews()` meneruskan `categoryId` & `search` ke repository. |
| `backend/src/controllers/reviewController.js` | `getAll` membaca `categoryId` & `search` dari query string (`req.query`). |

### Frontend
| File | Perubahan |
|---|---|
| `frontend/services/reviewService.ts` | `getAll()` menerima parameter `categoryId` & `search` opsional, diteruskan sebagai query string ke `GET /reviews`. |
| `frontend/features/admin/components/ReviewManagementView.tsx` | Dropdown "Produk" lama **diganti** dengan Search Bar (placeholder "Cari nama produk, SKU, atau nama pengguna...", debounce 300ms lewat `useDebouncedValue` — hook yang sama dipakai `ProductManagementView`) + dropdown Filter Kategori (data dari `useAdminCategoryStore`, store yang sama dipakai `ProductManagementView`). Tambah tombol "Reset Filter" saat ada filter aktif (Search/Kategori/Rating), mengikuti pola UI `ProductManagementView`. Filter Rating yang sudah ada **tidak diubah** — tetap dikirim bersamaan (AND) dengan Search & Filter Kategori. |

Tidak ada file lain yang diubah. `DataTable`, `RowActions`, fitur Balasan
Review oleh Admin, Moderasi Review (sembunyikan/tampilkan), dan seluruh
halaman Admin lainnya tetap seperti semula.

---

## 2. Cara Kerja Search (Nama Produk, SKU, Nama User)

Search Bar memakai **satu** input teks (sesuai permintaan "gunakan satu Search
Bar saja"), dengan placeholder **"Cari nama produk, SKU, atau nama
pengguna..."**. Ketikan di-debounce 300ms — sama seperti Search Bar di halaman
Produk Admin — supaya request ke backend hanya dikirim setelah Admin berhenti
mengetik, bukan di setiap huruf.

Alurnya di backend (`reviewRepository.findAll`), untuk setiap kata kunci yang
dikirim:

1. Cari `id` produk yang **Nama Produk**-nya mengandung kata kunci tersebut
   (`ilike` pada `products.nama_produk`, partial match, tidak case-sensitive).
2. Cari `product_id` dari varian yang **SKU**-nya mengandung kata kunci
   tersebut (`ilike` pada `product_variants.sku`), lalu digabungkan ke daftar
   id produk dari langkah 1 (satu produk bisa cocok lewat nama ATAU SKU salah
   satu variannya).
3. Cari `id` user yang **Nama Lengkap**-nya mengandung kata kunci tersebut
   (`ilike` pada `users.nama_lengkap`).
4. Query utama ke tabel `reviews` ditambahkan kondisi
   `product_id IN (hasil langkah 1+2) OR user_id IN (hasil langkah 3)`.

Karena baik pencarian produk maupun pencarian user digabung dengan **OR**,
mengetik "AIR" akan menampilkan seluruh review pada produk yang namanya
mengandung "AIR" **maupun** review dari user bernama "Air..." — persis seperti
sistem pencarian gabungan yang diminta. Kalau kata kunci sama sekali tidak
cocok dengan produk maupun user manapun, backend langsung mengembalikan daftar
kosong tanpa perlu query ke tabel `reviews` sama sekali (lebih efisien).

Contoh skenario dari dokumen permintaan:
- `AIR` → cocok ke Nama Produk yang mengandung "AIR" → review produk tersebut
  muncul.
- `AIR-HITAM-M` → cocok ke SKU varian → review produk dengan SKU tersebut
  muncul.
- `Budi` / `Azan` → cocok ke Nama User → seluruh review milik user tersebut
  muncul, apa pun produknya.

---

## 3. Cara Kerja Filter Kategori

Dropdown Filter Kategori diisi dari `useAdminCategoryStore` (Category API
sungguhan, `GET /categories`) — store yang sama persis dipakai halaman Produk
Admin, jadi daftar kategori selalu sinkron dengan data di database, bukan
ditulis manual di frontend.

Saat sebuah kategori dipilih, `categoryId` dikirim ke `GET /reviews`. Di
backend, filter ini memakai `products!inner(...)` pada relasi `reviews ->
products` supaya PostgREST bisa memfilter lewat kolom tabel yang di-embed
(`products.category_id`) langsung di level database — pola query yang sama
dipakai `stockRepository.findInventory` untuk kasus serupa (filter lewat
relasi produk).

**Search dan Filter Kategori bekerja bersamaan** (operasi AND): kondisi
`products.category_id = kategoriTerpilih` digabung dengan kondisi pencarian
`product_id IN (...) OR user_id IN (...)` di query yang sama, sehingga hasilnya
selalu "review yang cocok dengan kata kunci pencarian, DAN produknya berada di
kategori yang dipilih" — contohnya Search `AIR` + Kategori `T-Shirt` hanya
menampilkan review produk mengandung kata "AIR" yang kategorinya T-Shirt.

Filter Rating yang sudah ada sebelumnya (tombol Bintang 1-5) tetap dikirim
sebagai kondisi `rating = X` terpisah, sehingga Search + Filter Kategori +
Filter Rating bisa dipakai bertiga sekaligus tanpa saling merusak (semuanya
digabung dengan AND).

---

## 4. Hasil Pengujian Skenario

| # | Skenario | Hasil |
|---|---|---|
| 1 | Admin mencari berdasarkan Nama Produk | ✅ `ilike` pada `products.nama_produk` mencocokkan review produk terkait. |
| 2 | Admin mencari berdasarkan sebagian Nama Produk | ✅ `ilike` dengan wildcard `%kata%` di kedua sisi, jadi kata di tengah nama produk pun tetap cocok. |
| 3 | Admin mencari berdasarkan SKU | ✅ `ilike` pada `product_variants.sku`, product_id varian yang cocok ikut dipetakan ke review produk tersebut. |
| 4 | Admin mencari berdasarkan Nama User | ✅ `ilike` pada `users.nama_lengkap`, seluruh review dari user yang cocok ditampilkan lewat kondisi `user_id.in.(...)`. |
| 5 | Admin memilih Kategori | ✅ `products!inner` + `.eq("products.category_id", ...)` membatasi hasil hanya pada produk di kategori tersebut. |
| 6 | Search dan Filter Kategori dipakai bersamaan | ✅ Keduanya digabung sebagai kondisi AND pada query yang sama (lihat bagian 3). |
| 7 | Seluruh filter lama tetap bekerja (Rating, moderasi Status) | ✅ Filter Rating (`rating = X`) tidak diubah sama sekali & tetap AND dengan Search/Kategori. Moderasi Status (Sembunyikan/Tampilkan lewat `PATCH /reviews/:id/status`) juga tidak disentuh — tabel tetap menampilkan seluruh status (ditampilkan & disembunyikan) ke Admin seperti semula, badge status tetap tampil. |
| 8 | Performa tetap cepat walau review sangat banyak | ✅ Semua pencarian & filter dieksekusi sebagai query Postgres (ilike + in + eq pada kolom yang sudah ter-index lewat primary/foreign key), tidak ada `products`/`reviews` yang di-fetch penuh ke frontend lalu difilter di JavaScript. |
| 9 | Responsive Desktop/Tablet/Mobile | ✅ Search Bar & dropdown Kategori memakai `flex flex-col gap-2 sm:flex-row` (pola sama dengan `ProductManagementView`): bertumpuk vertikal di layar sempit (mobile), sejajar horizontal (Search kiri, Kategori kanan) mulai breakpoint `sm:` ke atas (tablet & desktop). |

**Catatan pengujian:** verifikasi di atas dilakukan lewat pemeriksaan kode &
alur data end-to-end (bentuk query Supabase/PostgREST, request/response,
render komponen) karena lingkungan pengerjaan ini tidak memiliki akses ke
instance Supabase maupun ke internet untuk menjalankan `npm install`/build/test
otomatis. Disarankan menjalankan `npm run lint` dan build seperti biasa di
lingkungan development untuk konfirmasi akhir sebelum production. Tidak ada
migration baru pada update ini — seluruh kolom yang dipakai (`products.nama_produk`,
`products.category_id`, `product_variants.sku`, `users.nama_lengkap`) sudah
ada di database sejak awal.
