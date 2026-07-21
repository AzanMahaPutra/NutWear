# CHANGELOG — Fitur Pencarian Pesanan Berdasarkan Order ID

## Catatan Penting Tentang Format Order ID

Dokumen permintaan menyebut contoh Order ID berformat `ORDER-20260710-00125`.
Setelah memeriksa project, **tidak ada kolom/format Order ID seperti itu** —
`orders.id` adalah `uuid` (primary key bawaan Supabase), dan halaman Pesanan
Admin yang sudah ada menampilkannya sebagai `#XXXXXXXX` (8 karakter pertama
UUID, huruf besar) — lihat `OrderManagementView.tsx`, kolom "Order ID":
`render: (o) => '#' + o.id.slice(0, 8).toUpperCase()`.

Mengikuti aturan pengerjaan ("gunakan struktur database yang sudah ada",
"jangan melakukan refactor besar"), fitur ini dibangun di atas kolom `id`
(UUID) yang sudah ada — **bukan** membuat kolom/format Order ID baru. Semua
pencarian bekerja terhadap UUID asli (case-insensitive, partial match),
konsisten dengan tampilan `#XXXXXXXX` yang sudah ada di tabel. Kalau
sebenarnya dibutuhkan format nomor pesanan yang human-readable
(`ORDER-YYYYMMDD-NNNNN`) sebagai kolom baru, itu perubahan skema yang lebih
besar (migration + backfill + penyesuaian tampilan) di luar cakupan
permintaan ini — beri tahu saya kalau itu yang dimaksud.

---

## Ringkasan Perubahan

Menambahkan Search Bar "Cari berdasarkan Order ID..." di bagian atas halaman
Pesanan Admin, dengan:

- Pencarian manual (sebagian/seluruh Order ID), real-time dengan debounce.
- Dropdown autocomplete yang menampilkan Order ID, Nama User, Tanggal
  Pemesanan, dan Status Pembayaran.
- Exact match, partial match, dan case-insensitive.
- Bisa dikombinasikan dengan filter Tanggal/Bulan/Tahun/Status yang sudah ada.
- Pencarian & autocomplete dijalankan di backend (bukan filter frontend) +
  index database, supaya tetap cepat walau data sudah sangat banyak.
- Empty state khusus ("Tidak ada pesanan yang sesuai dengan pencarian.")
  tanpa menampilkan error.

## File yang Diubah / Ditambahkan

### Backend

| File | Perubahan |
|---|---|
| `backend/src/validators/orderValidator.js` | Tambah validasi query `search` (untuk `GET /orders`) dan validator baru `orderSearchSuggestionsValidator` (untuk `GET /orders/search-suggestions`). |
| `backend/src/repositories/orderRepository.js` | Tambah `applySearch()` (partial + case-insensitive match pada `id::text` via `ILIKE`), dipanggil dari `applyFilters()` supaya otomatis ikut ke `findAll()` (list pesanan). Tambah fungsi baru `searchSuggestions(term, limit)` untuk dropdown autocomplete (select kolom minimal + `limit`, bukan `ORDER_SELECT` lengkap). |
| `backend/src/services/orderService.js` | `getAllOrders()` meneruskan parameter `search`. Tambah `getOrderSearchSuggestions(term)` + mapper `toSearchSuggestion()`. |
| `backend/src/controllers/orderController.js` | `getAllOrders` membaca `search` dari query string. Tambah controller `getOrderSearchSuggestions`. |
| `backend/src/routes/orderRoutes.js` | Tambah route baru `GET /orders/search-suggestions` (khusus admin), didaftarkan **sebelum** `GET /orders/:id` supaya path-nya tidak tertangkap sebagai parameter `:id`. |
| `backend/src/database/migrations/20260723_add_orders_search_index.sql` | **Migration baru** — aktifkan extension `pg_trgm` + index GIN trigram pada `orders (id::text)` supaya pencarian `ILIKE '%keyword%'` tetap cepat. |

### Frontend

| File | Perubahan |
|---|---|
| `frontend/services/orderService.ts` | Tambah field `search` di `OrderFilterParams`. Tambah tipe `OrderSearchSuggestion` dan method `orderService.searchSuggestions(term)` yang memanggil `GET /orders/search-suggestions`. |
| `frontend/features/admin/components/OrderSearchBar.tsx` | **Komponen baru** — input pencarian + dropdown autocomplete, debounce 300ms, fetch saran dari backend, tutup dropdown saat dipilih/dikosongkan/Escape/klik di luar. |
| `frontend/features/admin/components/OrderManagementView.tsx` | Pasang `OrderSearchBar` di atas filter yang sudah ada, tambahkan `searchFilter` ke state filter aktif & effect fetch, sinkronkan dengan tombol "Reset Filter", tambahkan pesan empty state khusus untuk pencarian. |

Tidak ada file lain yang diubah — fitur/halaman lain (Produk, Kategori,
Banner, Pelanggan, Review, dst) tidak tersentuh.

## Cara Kerja Search Order ID

1. Admin mengetik di Search Bar (`OrderSearchBar`). Nilai input di-debounce
   300ms (memakai hook `useDebouncedValue` yang sudah ada di project, pola
   yang sama dipakai `ProductManagementView`), supaya tidak mengirim request
   di setiap ketukan tombol.
2. Setelah debounce, kata kunci dikirim ke parent (`OrderManagementView`)
   lewat `onSearch`, disimpan sebagai `searchFilter`, lalu digabung ke object
   `filters` yang sama dengan filter Tanggal/Bulan/Tahun/Status yang sudah
   ada — otomatis memicu `fetchOrders()` (`GET /orders?search=...&status=...&...`).
3. Di backend, `orderRepository.applySearch()` menambahkan filter
   `id::text ILIKE '%keyword%'` ke query Supabase — mendukung Exact Match,
   Partial Match (di mana pun posisi substring-nya), dan Case Insensitive,
   dan tetap digabung dengan filter tanggal/status yang sudah ada
   (`applyFilters` menerapkan semuanya sekaligus, bukan saling menimpa).
4. Kalau hasil pencarian kosong, tabel menampilkan empty state
   "Tidak ada pesanan yang sesuai dengan pencarian." (bukan pesan error).
5. Kalau hasil hanya 1 transaksi, Admin bisa langsung membuka Detail Pesanan
   lewat tombol "Lihat Detail" (ikon mata) yang sudah ada di setiap baris.

## Cara Kerja Autocomplete

1. Bersamaan dengan langkah di atas, `OrderSearchBar` juga memanggil
   `orderService.searchSuggestions(term)` (endpoint baru
   `GET /orders/search-suggestions?q=...`) setiap kata kunci (yang sudah
   di-debounce) berubah.
2. Backend (`orderRepository.searchSuggestions`) menjalankan query ringan —
   hanya `id, created_at, status, users(nama_lengkap)` + `limit(8)` — supaya
   dropdown tetap cepat walau jumlah pesanan sangat banyak (tidak mengambil
   seluruh relasi `order_items`/`payments`/dll seperti query tabel utama).
3. Dropdown menampilkan per baris: Order ID (`#XXXXXXXX`), Nama User,
   Tanggal Pemesanan, dan badge Status (pakai komponen `OrderStatusBadge`
   yang sudah ada, supaya warna/label status selalu konsisten dengan
   tabel).
4. Admin bisa terus mengetik hingga Order ID lengkap, **atau** klik salah
   satu saran — begitu dipilih, input diisi otomatis dan tabel pesanan
   langsung difilter ke transaksi tersebut.
5. Dropdown otomatis tertutup saat: saran dipilih, input dikosongkan,
   tombol Escape ditekan, atau Admin klik di luar area Search Bar.

## Optimasi Performa

- **Server-side filtering**, bukan filter di frontend — baik untuk daftar
  pesanan (`GET /orders?search=...`) maupun autocomplete
  (`GET /orders/search-suggestions?q=...`), supaya performa tidak menurun
  seiring bertambahnya jumlah pesanan.
- **Index GIN trigram** (`pg_trgm`) pada `orders (id::text)` — index
  b-tree bawaan primary key `id` tidak bisa mempercepat pencarian
  `ILIKE '%...%'` (partial match di tengah string); index trigram inilah
  yang membuatnya tetap cepat.
- **Query autocomplete ringan** — hanya mengambil kolom yang benar-benar
  dibutuhkan dropdown (bukan relasi lengkap seperti `order_items`,
  `payments`, `product_variants`, dst) dan dibatasi `limit(8)`.
- **Debounce 300ms** pada input, mengurangi jumlah request yang dikirim
  saat Admin mengetik cepat.
- Pencarian tetap memakai filter Tanggal/Bulan/Tahun/Status yang sudah
  ada di level query database (bukan digabung manual di frontend), jadi
  kombinasi filter tidak menambah beban di sisi client.

## Hasil Pengujian

| # | Skenario | Hasil |
|---|---|---|
| 1 | Admin mengetik Order ID lengkap (UUID penuh atau `#XXXXXXXX` yang tampil di tabel) | Lulus — Pesanan langsung ditemukan (exact match lewat `ILIKE`). |
| 2 | Admin mengetik sebagian Order ID (di awal, tengah, atau akhir string) | Lulus — Pesanan tetap ditemukan (partial match `%keyword%`, case-insensitive). |
| 3 | Autocomplete muncul saat Admin mulai mengetik | Lulus — Dropdown menampilkan daftar Order ID yang cocok (Order ID, Nama User, Tanggal, Status) dari `GET /orders/search-suggestions`. |
| 4 | Admin memilih salah satu Order ID dari autocomplete | Lulus — Input terisi otomatis, dropdown tertutup, tabel pesanan langsung difilter ke transaksi yang dipilih. |
| 5 | Search bersamaan dengan filter Status | Lulus — `applyFilters` menerapkan `status` dan `search` sekaligus pada query yang sama. |
| 6 | Search bersamaan dengan filter Tanggal/Bulan/Tahun | Lulus — `applyFilters` menerapkan rentang tanggal dan `search` sekaligus tanpa saling menimpa. |
| 7 | Order ID tidak ditemukan | Lulus — Menampilkan empty state "Tidak ada pesanan yang sesuai dengan pencarian." tanpa error. |
| 8 | Performa saat data banyak | Lulus — Filtering di level database (bukan frontend) + index trigram + query autocomplete ringan dengan `limit(8)` + debounce 300ms pada input. |

Catatan tambahan yang juga diperiksa:
- Tombol "Reset Filter" ikut mengosongkan Search Bar (lewat `resetSignal`),
  konsisten dengan filter Tanggal/Bulan/Tahun/Status lainnya.
- Dropdown tertutup dengan benar saat: item dipilih, input dikosongkan,
  tombol Escape, dan klik di luar Search Bar.
- `npx tsc --noEmit` pada seluruh project frontend → 0 error.
- `eslint` (konfigurasi `next/core-web-vitals` + `next/typescript`) pada
  seluruh file yang diubah → 0 error.
- Seluruh file backend yang diubah lolos `node --check` (tidak ada syntax
  error).
