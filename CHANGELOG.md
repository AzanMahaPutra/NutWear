# CHANGELOG — Review Helpful & Balasan Review oleh Admin

Update ini berisi 2 fitur baru pada sistem Review Produk, sesuai permintaan:

1. **Review Helpful** — tombol "👍 Membantu" / "👎 Tidak Membantu" pada setiap
   review, satu vote per akun per review, tersimpan di database.
2. **Balasan Review oleh Admin** — Admin dapat membalas review customer
   (Balas/Edit/Hapus Balasan), balasan tampil dengan identitas visual "Official
   Store" di halaman Detail Produk, dan user pemilik review menerima
   notifikasi + bisa langsung diarahkan ke review yang dibalas.

Tidak ada refactor besar, struktur folder tidak berubah, dan tidak ada fitur
lain (Produk, Order, Payment, Wishlist, dll.) yang tersentuh di luar dua hal
di atas. Seluruh komponen, service, dan pola struktur yang sudah ada (Modal,
DataTable, RowActions, notificationService, dst.) dipakai ulang, bukan dibuat
dari nol.

**Catatan cakupan:** dokumen permintaan menyebut "Foto Review (jika ada)" pada
modal balasan Admin. Sistem Review di project ini **belum punya field foto
review** sama sekali (baik di database, API, maupun form Tulis Ulasan) — hanya
rating + komentar. Menambahkannya berarti membuat fitur upload foto review
baru dari nol, di luar cakupan "Balasan Review oleh Admin" yang diminta, jadi
bagian ini sengaja tidak ditambahkan supaya tidak melanggar aturan "jangan
melakukan refactor besar". Modal balasan tetap menampilkan Nama Customer, Nama
Produk, Isi Review, dan Rating seperti diminta.

---

## 1. File yang Diubah/Ditambahkan

### Backend
| File | Perubahan |
|---|---|
| `backend/src/database/migrations/20260727_add_review_helpful_votes.sql` | **Baru.** Tabel `review_votes` (review_id, user_id, vote, unique per user+review) untuk fitur Review Helpful. |
| `backend/src/database/migrations/20260727_add_review_admin_reply.sql` | **Baru.** Kolom `admin_reply`, `admin_reply_at`, `admin_reply_by` pada tabel `reviews` untuk fitur Balasan Admin. |
| `backend/src/middlewares/authMiddleware.js` | Tambah `attachUserIfPresent` — middleware login opsional (tidak menolak request tanpa token) supaya endpoint publik daftar review tetap bisa diakses semua orang, tapi tetap tahu `req.user` kalau pengunjungnya kebetulan sedang login. |
| `backend/src/repositories/reviewVoteRepository.js` | **Baru.** Query ke tabel `review_votes`: hitung jumlah vote per review (batch), ambil vote milik user tertentu (batch), simpan/ganti vote (upsert), hapus vote. |
| `backend/src/repositories/reviewRepository.js` | Select review sekarang menyertakan `admin_reply*` + nama Admin yang membalas (`admin_replier`, lewat FK `admin_reply_by`). FK ke `users` didisambiguasi eksplisit (`users!reviews_user_id_fkey` vs `users!reviews_admin_reply_by_fkey`) karena sekarang ada dua relasi `reviews -> users`. Tambah `setAdminReply()` & `removeAdminReply()`. |
| `backend/src/services/reviewService.js` | `toResponse()` sekarang menyertakan `helpfulVotes`, `myVote`, `adminReply`. `getReviewsByProduct()` menerima `currentUserId` opsional untuk menghitung `myVote`. Tambah `setVote()`, `removeVote()`, `replyToReview()` (juga mengirim notifikasi), `deleteReply()`. |
| `backend/src/services/notificationService.js` | Tambah `notifyReviewReplied()` — notifikasi "Review Anda Telah Dibalas" ke pemilik review, dengan link `/produk/{slug}?reviewId={id}`. |
| `backend/src/controllers/reviewController.js` | `getByProduct` meneruskan `req.user?.id`. Tambah handler `vote`, `removeVote`, `reply`, `deleteReply`. |
| `backend/src/validators/reviewValidator.js` | Tambah `voteValidator` (vote harus `membantu`/`tidak_membantu`) dan `replyValidator` (pesan wajib diisi, maks. 1000 karakter). |
| `backend/src/routes/reviewRoutes.js` | Tambah route `POST/DELETE /reviews/:id/vote` (login wajib) dan `POST/DELETE /reviews/:id/reply` (Admin saja). Route `GET /reviews/product/:productId` sekarang lewat `attachUserIfPresent`. |

### Frontend
| File | Perubahan |
|---|---|
| `frontend/services/reviewService.ts` | Tambah tipe `ReviewVote`, `ReviewHelpfulVotes`, `ReviewAdminReply`. `ReviewApiItem` menyertakan `helpfulVotes`, `myVote`, `adminReply`. Tambah method `vote()`, `removeVote()`, `reply()`, `deleteReply()`. |
| `frontend/features/review/components/ReviewCard.tsx` | Tambah tombol "👍 Membantu / 👎 Tidak Membantu" (klik tombol yang sedang aktif untuk membatalkan vote; belum login diarahkan ke halaman Login). Tambah card "Balasan dari [Nama Toko]" dengan badge "Official Store" kalau review sudah dibalas Admin. Tambah prop `highlighted` untuk sorotan sementara saat dibuka dari notifikasi. |
| `frontend/features/review/components/ProductReviewsSection.tsx` | Terima prop `highlightReviewId` (dari query string), scroll otomatis + sorot review terkait, lalu sorotan hilang setelah beberapa detik. Refetch review lewat browser saat user login supaya `myVote` akurat (halaman ini dirender di server tanpa access token). |
| `frontend/app/(shop)/produk/[slug]/page.tsx` | Terima `searchParams.reviewId`, diteruskan ke `ProductReviewsSection`. |
| `frontend/features/admin/components/ReviewReplyModal.tsx` | **Baru.** Modal "Balas Ulasan" — menampilkan Nama Customer, Nama Produk, Isi Review, Rating, textarea balasan, tombol Kirim Balasan/Batal, dan tombol Hapus Balasan kalau sedang mengedit balasan yang sudah ada. |
| `frontend/features/admin/components/ReviewManagementView.tsx` | Tambah tombol "Balas" (berubah jadi "Edit Balasan" kalau review sudah dibalas) di kolom Aksi, terhubung ke `ReviewReplyModal`. |

Tidak ada file lain yang diubah. Fitur Moderasi Review, Filter Produk/Rating,
dan seluruh halaman Admin lainnya tetap seperti semula.

---

## 2. Struktur Database Baru

### Tabel `review_votes` (Review Helpful)
```
id           uuid primary key
review_id    uuid  -> reviews(id) on delete cascade
user_id      uuid  -> users(id) on delete cascade
vote         varchar(20)  check ('membantu' | 'tidak_membantu')
created_at   timestamp
updated_at   timestamp
unique (review_id, user_id)
```
Satu baris = satu vote milik satu user pada satu review. Unique index
`(review_id, user_id)` adalah jaring pengaman utama supaya satu akun tidak
mungkin punya lebih dari satu vote pada review yang sama (mencegah spam vote
di level database, bukan hanya di frontend).

### Kolom baru pada `reviews` (Balasan Admin)
```
admin_reply     text        -- isi balasan, null = belum dibalas
admin_reply_at  timestamp   -- waktu dibuat/terakhir diedit
admin_reply_by  uuid -> users(id) on delete set null
```
Balasan disimpan langsung sebagai kolom di `reviews` (bukan tabel terpisah)
karena relasinya murni satu review = maksimal satu balasan. Baik "Balas" baru
maupun "Edit Balasan" memakai endpoint & fungsi yang sama (`setAdminReply`) —
selalu UPDATE kolom yang sama, tidak pernah membuat baris balasan kedua.

---

## 3. Cara Kerja Review Helpful

1. Setiap review di Detail Produk menampilkan dua tombol dengan jumlah vote:
   `👍 Membantu (n)` dan `👎 Tidak Membantu (n)`.
2. **Belum login** → menekan salah satu tombol menampilkan toast "Silakan
   masuk terlebih dahulu untuk memberi vote" dan mengarahkan ke halaman Login
   (pola yang sama dengan tombol Wishlist/Keranjang yang sudah ada di
   `ProductPurchasePanel.tsx`).
3. **Sudah login, belum pernah vote** → `POST /reviews/:id/vote { vote }`
   menyimpan vote baru. Tombol yang dipilih langsung menyala.
4. **Sudah vote, ganti pilihan** → menekan tombol yang berbeda memanggil
   endpoint yang sama; backend melakukan **upsert** (`onConflict:
   review_id,user_id`), jadi baris vote lama otomatis diperbarui, bukan
   ditambah baris baru. Jumlah di kedua tombol langsung ikut berubah sesuai
   data asli (dihitung ulang dari tabel `review_votes`, bukan increment/
   decrement manual).
5. **Hapus vote** → menekan tombol yang **sedang aktif** memanggil `DELETE
   /reviews/:id/vote`, menghapus baris vote milik user tersebut. Jumlah vote
   ikut berkurang.
6. Vote tersimpan di database (bukan state browser), jadi tetap ada walau
   user logout lalu login kembali — saat Detail Produk dibuka lagi, backend
   mengembalikan `myVote` sesuai data di `review_votes`.
7. Satu akun hanya bisa punya satu vote per review — dijaga dua lapis:
   validasi di `reviewService.setVote` + unique index database
   `(review_id, user_id)` sebagai jaring pengaman terakhir kalau ada race
   condition.

---

## 4. Cara Kerja Balasan Review oleh Admin

1. Di halaman **Review Admin**, setiap baris review punya tombol **"Balas"**
   (atau **"Edit Balasan"** kalau review itu sudah pernah dibalas).
2. Tombol membuka modal `ReviewReplyModal` berisi Nama Customer, Nama Produk,
   Isi Review, Rating, textarea balasan (maks. 1000 karakter), tombol **Kirim
   Balasan** dan **Batal** — serta tombol **Hapus Balasan** kalau sedang
   mengedit balasan yang sudah ada.
3. **Kirim Balasan** memanggil `POST /reviews/:id/reply { message }`. Endpoint
   ini dipakai untuk balasan baru maupun edit balasan — keduanya sama-sama
   UPDATE kolom `admin_reply*` pada baris review yang sama, sesuai aturan
   "setiap review maksimal satu balasan resmi dari Admin".
4. **Hapus Balasan** memanggil `DELETE /reviews/:id/reply`, mengosongkan
   kembali kolom `admin_reply*` tanpa menghapus review itu sendiri.
5. Hanya Admin (`requireRole("admin")`) yang bisa mengakses ketiga endpoint
   ini — user biasa tidak mendapat opsi apa pun untuk mengubah balasan Admin.
6. Di halaman **Detail Produk**, review yang sudah dibalas menampilkan card
   balasan dengan tampilan berbeda dari review customer: latar warna
   berbeda, badge **"Official Store"**, ikon centang verifikasi (`BadgeCheck`),
   nama toko yang membalas ("Balasan dari NutWear Official"), dan tanggal
   balasan.

---

## 5. Cara Kerja Notifikasi Balasan Review

1. Setelah `replyToReview` berhasil menyimpan balasan (baru maupun edit),
   `notificationService.notifyReviewReplied()` dipanggil secara
   fire-and-forget (gagal kirim notifikasi tidak boleh membuat balasan gagal
   tersimpan) — hanya untuk balasan **baru/diedit**, bukan saat Hapus
   Balasan.
2. Notifikasi dikirim khusus ke user pemilik review (bukan broadcast), dengan
   judul **"Review Anda Telah Dibalas"** dan isi menyebutkan nama produk yang
   direview, mengikuti pola `notifyOrderStatus`/`notifyAccountBanned` yang
   sudah ada di `notificationService.js`.
3. `link` notifikasi mengarah ke `/produk/{slug}?reviewId={id}`. Saat user
   menekan notifikasi di `NotificationBell`, router langsung membuka Detail
   Produk tersebut (perilaku klik notifikasi yang sudah ada, tidak diubah).
4. Di Detail Produk, `ProductReviewsSection` membaca `reviewId` dari query
   string, otomatis **scroll** ke review tersebut dan memberi **sorotan
   sementara** (latar kuning pudar) selama beberapa detik supaya mudah
   ditemukan, lalu sorotan hilang dengan sendirinya.

---

## 6. Hasil Pengujian Skenario

| # | Skenario | Hasil |
|---|---|---|
| 1 | User dapat memberikan vote "Membantu" | ✅ `POST /reviews/:id/vote {vote:"membantu"}` menyimpan baris baru, tombol Membantu langsung menyala & angkanya bertambah. |
| 2 | User dapat memberikan vote "Tidak Membantu" | ✅ Sama seperti di atas dengan `vote:"tidak_membantu"`. |
| 3 | User hanya dapat memiliki satu vote per review | ✅ Dijaga unique index `(review_id, user_id)` + endpoint memakai upsert (`onConflict`), bukan insert biasa. |
| 4 | User dapat mengganti pilihan vote | ✅ Menekan tombol lain memanggil `setVote` lagi → upsert mengganti baris vote yang sama; jumlah kedua tombol ikut update sesuai data asli. |
| 5 | User dapat menghapus vote miliknya | ✅ Menekan tombol yang sedang aktif memanggil `DELETE /reviews/:id/vote`; `myVote` kembali `null`, jumlah vote berkurang. |
| 6 | Jumlah vote selalu sesuai data di database | ✅ `helpfulVotes` selalu dihitung ulang lewat `reviewVoteRepository.getCountsForReviews`, tidak ada counter terpisah yang bisa tidak sinkron. |
| 7 | Admin dapat membalas review | ✅ `POST /reviews/:id/reply` (role admin) menyimpan `admin_reply*`, response menyertakan `adminReply` yang langsung tampil di tabel & Detail Produk. |
| 8 | Admin dapat mengedit balasan | ✅ Endpoint yang sama dipanggil ulang dengan pesan baru; kolom `admin_reply*` di-UPDATE (bukan baris baru), `admin_reply_at` ikut diperbarui. |
| 9 | Admin dapat menghapus balasan | ✅ `DELETE /reviews/:id/reply` mengosongkan `admin_reply*`; card balasan hilang dari Detail Produk, tombol admin kembali jadi "Balas". |
| 10 | Balasan tampil di halaman Detail Produk | ✅ `ReviewCard` merender card balasan di bawah tombol vote kalau `review.adminReply` tidak `null`. |
| 11 | Balasan punya tampilan resmi berbeda | ✅ Card balasan pakai latar & border berbeda, badge "Official Store", ikon verifikasi, nama toko, dan tanggal. |
| 12 | User menerima notifikasi saat review dibalas | ✅ `notifyReviewReplied` mengirim notifikasi ke `review.user_id` setiap balasan baru/diedit tersimpan. |
| 13 | Klik notifikasi langsung membuka review yang dibalas | ✅ `link` notifikasi = `/produk/{slug}?reviewId={id}`; halaman Detail Produk scroll & menyorot review tersebut otomatis. |
| 14 | Tampilan tetap responsif (Desktop/Tablet/Mobile) | ✅ Seluruh elemen baru (tombol vote, card balasan, modal Admin) memakai kelas Tailwind `flex flex-wrap`/`w-full`/ukuran teks & spasi yang konsisten dengan komponen sekitarnya yang sudah responsif (`ReviewCard`, `Modal`, `DataTable`), tanpa lebar/posisi tetap (fixed width) yang bisa merusak tampilan di layar kecil. |

**Catatan pengujian:** verifikasi di atas dilakukan lewat pemeriksaan kode &
alur data end-to-end (request/response, query database, render komponen)
karena lingkungan pengerjaan ini tidak memiliki akses ke instance Supabase
maupun ke internet untuk menjalankan `npm install`/build/test otomatis.
Sebelum deploy, jalankan kedua file migration lewat Supabase SQL Editor
terlebih dahulu, lalu disarankan menjalankan `npm run lint`/build seperti
biasa di lingkungan development untuk konfirmasi akhir.
