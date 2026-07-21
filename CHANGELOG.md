# CHANGELOG — Fitur Menyembunyikan Review yang Tidak Pantas

## Ringkasan

Menambahkan fitur moderasi pada halaman **Review Admin**: Admin sekarang bisa
menyembunyikan review yang mengandung kata tidak pantas, spam, promosi, atau
isi yang tidak sesuai — **tanpa menghapus review tersebut dari database**.
Review yang disembunyikan tetap tersimpan penuh dan tetap terlihat di halaman
Review Admin (dengan indikator status), tetapi tidak akan tampil lagi di
halaman manapun yang dilihat pengunjung/user, dan tidak ikut dihitung dalam
rata-rata rating produk.

Tidak ada refactor besar, struktur folder, atau fitur lain yang diubah.
Perubahan murni menambah kolom `status` pada tabel `reviews` beserta
endpoint & UI untuk mengubahnya.

## Cara Kerja

1. Setiap review sekarang memiliki kolom `status` dengan dua nilai:
   - `ditampilkan` (default) — tampil ke publik & ikut dihitung dalam rating.
   - `disembunyikan` — hanya terlihat di halaman Review Admin.
2. Di halaman **Review Admin**, setiap baris review punya tombol:
   - **"Sembunyikan Review"** saat status `ditampilkan`.
   - **"Tampilkan Review"** saat status `disembunyikan`.
   Menekan tombol memanggil `PATCH /reviews/:id/status` (admin only) yang
   mengubah kolom `status` review tersebut — baris review itu sendiri tidak
   pernah dihapus (`DELETE` dari database tidak dipanggil).
3. Kolom **Status** baru di tabel Review Admin menampilkan badge
   "Ditampilkan" (hijau) atau "Disembunyikan" (abu-abu, teks komentar juga
   diredupkan) supaya Admin langsung tahu review mana yang aktif.
4. Query publik (`GET /reviews/product/:productId`, dipakai halaman Detail
   Produk & jadi sumber review yang dilihat user) sekarang selalu memfilter
   `status = 'ditampilkan'` di level database (Supabase query), sehingga
   review yang disembunyikan otomatis dianggap tidak ada bagi pengunjung.
5. Perhitungan rata-rata rating & jumlah review (`getAverageRating`) juga
   difilter `status = 'ditampilkan'`, jadi rating produk hanya mencerminkan
   review yang benar-benar tampil ke publik.
6. Halaman `GET /reviews` (admin, dipakai Review Admin) tidak difilter
   berdasarkan status — Admin tetap melihat seluruh review apa pun
   statusnya, lengkap dengan badge status di atas.

## File yang Diubah / Ditambahkan

### Database
- `backend/src/database/migrations/20260721_add_review_status.sql` **(baru)**
  Menambahkan kolom `reviews.status` (`ditampilkan` / `disembunyikan`,
  default `ditampilkan`, dengan check constraint) + index untuk mempercepat
  filter query publik. Aman dijalankan berkali-kali (`if not exists`).

### Backend
- `backend/src/repositories/reviewRepository.js`
  - `findByProduct` (dipakai Detail Produk / halaman user) kini memfilter
    `status = 'ditampilkan'`.
  - `getAverageRating` kini memfilter `status = 'ditampilkan'`.
  - Tambah fungsi `updateStatus(id, status)` — UPDATE kolom `status` saja,
    tidak pernah menghapus baris.
- `backend/src/services/reviewService.js`
  - `toResponse` kini menyertakan field `status` pada setiap review.
  - Tambah fungsi `setReviewStatus(id, status)` — validasi nilai status,
    memastikan review ada (404 jika tidak), lalu memanggil
    `reviewRepository.updateStatus`.
- `backend/src/controllers/reviewController.js`
  - Tambah handler `updateStatus` untuk endpoint moderasi baru.
- `backend/src/validators/reviewValidator.js`
  - Tambah `updateStatusValidator` — memvalidasi `status` hanya boleh
    `'ditampilkan'` atau `'disembunyikan'`.
- `backend/src/routes/reviewRoutes.js`
  - Tambah route `PATCH /reviews/:id/status` (khusus admin, via
    `requireAuth` + `requireRole("admin")`).

### Frontend
- `frontend/services/reviewService.ts`
  - Tambah tipe `ReviewStatus` dan field `status` pada `ReviewApiItem`.
  - Tambah fungsi `reviewService.updateStatus(id, status)` yang memanggil
    `PATCH /reviews/:id/status`.
- `frontend/features/admin/components/ReviewManagementView.tsx`
  - Tambah kolom **Status** (badge "Ditampilkan"/"Disembunyikan") pada tabel
    Review Admin.
  - Tambah tombol **"Sembunyikan Review"** / **"Tampilkan Review"** pada
    kolom Aksi, di samping tombol Hapus yang sudah ada.
  - Komentar review yang berstatus disembunyikan ditampilkan dengan warna
    lebih redup sebagai indikator visual tambahan.
  - State review di-update langsung dari response API setelah toggle,
    tanpa perlu refetch seluruh daftar.

## Penyesuaian Perhitungan Rating

Rata-rata rating produk (`reviewRepository.getAverageRating`, dipakai oleh
`reviewService.getReviewsByProduct` yang menjadi sumber data halaman Detail
Produk) sekarang **hanya menghitung review berstatus `ditampilkan`**. Review
yang disembunyikan Admin tidak lagi ikut menyumbang ke rata-rata rating
maupun jumlah review yang ditampilkan ke publik, sesuai permintaan.

## Hasil Pengujian Skenario

1. **Admin menyembunyikan review → Review hilang dari halaman user.**
   ✅ `findByProduct` (sumber data Detail Produk) memfilter
   `status = 'ditampilkan'`, jadi begitu status diubah menjadi
   `disembunyikan`, review tidak lagi muncul di response API yang dipakai
   halaman Detail Produk / Review User.

2. **Admin membuka halaman Review Admin → Review tetap ada dengan status "Disembunyikan".**
   ✅ `GET /reviews` (endpoint admin) tidak memfilter berdasarkan status,
   dan setiap review kini membawa field `status` yang ditampilkan sebagai
   badge di tabel.

3. **Admin menampilkan kembali review → Review muncul kembali di Detail Produk.**
   ✅ Menekan "Tampilkan Review" memanggil `PATCH /reviews/:id/status` dengan
   `status: "ditampilkan"`, yang langsung membuat review lolos lagi dari
   filter `findByProduct`.

4. **Rata-rata rating mengikuti status review yang sedang ditampilkan.**
   ✅ `getAverageRating` memfilter `status = 'ditampilkan'` sehingga review
   yang disembunyikan tidak ikut dihitung, dan langsung ikut terhitung lagi
   begitu ditampilkan kembali.

5. **Tidak ada data review yang terhapus dari database.**
   ✅ Fitur sembunyikan/tampilkan hanya melakukan `UPDATE ... SET status = ...`
   (`reviewRepository.updateStatus`). Fungsi `deleteById` / endpoint
   `DELETE /reviews/:id` yang sudah ada sebelumnya sama sekali tidak
   disentuh atau dipanggil oleh fitur ini.

## Cara Menjalankan Migration

Buka Supabase SQL Editor pada project ini, jalankan isi file
`backend/src/database/migrations/20260721_add_review_status.sql`. Migration
aman dijalankan berkali-kali dan tidak memengaruhi data review yang sudah
ada (semua review lama otomatis mendapat status `ditampilkan`).
