# CHANGELOG — Fitur Banned User & Pengajuan Unban

## Ringkasan

Menambahkan sistem manajemen user di halaman Admin sehingga Admin dapat
melakukan **banned** terhadap user yang melanggar aturan website tanpa
menghapus akunnya. User yang dibanned tetap dapat login, tetapi dibatasi dari
aktivitas transaksional (checkout, review, wishlist, keranjang). User yang
dibanned dapat mengajukan **permohonan unban**, yang akan ditinjau Admin di
halaman baru "Permohonan Unban" (Setujui/Tolak).

Tidak ada refactor besar, perubahan struktur folder, maupun perubahan pada
fitur lain yang tidak berhubungan. Perubahan murni:
- menambah kolom status banned pada tabel `users`,
- menambah tabel riwayat `unban_requests`,
- menambah endpoint & UI yang terkait,
- menambah satu middleware (`blockIfBanned`) yang dipasang di route-route
  yang memang dibatasi untuk user banned.

## Cara Kerja

### 1. Status Akun & Banned
- Tabel `users` mendapat 4 kolom baru: `status` (`aktif` default, atau
  `banned`), `banned_reason`, `banned_at`, dan `banned_by` (id Admin yang
  melakukan banned, untuk riwayat).
- Halaman **Admin → Manajemen User** (`/admin/pelanggan`, sidebar diberi label
  "Manajemen User") sekarang menampilkan kolom Nama, Email, Tanggal Bergabung,
  **Status Akun**, **Total Pesanan**, **Total Review**, dan **Aksi**.
- Tombol **"Banned"** pada tiap baris user membuka modal konfirmasi dengan
  textarea **Alasan Banned** (wajib diisi, ada beberapa contoh alasan yang
  bisa diklik cepat: Spam Review, Menggunakan kata-kata tidak pantas,
  Penipuan, Melanggar aturan website, Penyalahgunaan sistem). Setelah
  Admin menekan **Konfirmasi**:
  - `status` user menjadi `banned`.
  - `banned_reason`, `banned_at`, dan `banned_by` disimpan.
  - Endpoint: `PATCH /users/:id/ban` (admin only, body `{ reason }`).
  - Akun Admin tidak bisa dibanned; user yang sudah banned tidak bisa
    dibanned ulang lewat endpoint yang sama (dicegah di `userService.banUser`).

### 2. Pembatasan Aktivitas User yang Dibanned
- User yang dibanned **tetap bisa login** — `requireAuth` tidak menolaknya,
  hanya menyertakan `status`/`bannedReason` di `req.user`.
- Middleware baru `blockIfBanned` (di `middlewares/authMiddleware.js`)
  dipasang setelah `requireAuth` pada route-route berikut, dan akan menolak
  request dengan `403` beserta pesan yang menyebutkan alasan banned:
  - `POST /orders/checkout` (Checkout)
  - `POST /reviews` dan `PUT /reviews/:id` (Memberi/Mengedit Review)
  - `POST /wishlist` (Menambah Wishlist)
  - `POST /cart` (Menambah ke Keranjang)
- Frontend tidak perlu logic tambahan untuk menampilkan pesan ini — seluruh
  form terkait (Checkout, Tulis/Edit Ulasan, Tambah ke Keranjang, Tambah ke
  Wishlist) sudah menampilkan pesan error dari backend lewat toast
  (`getApiErrorMessage`), jadi pesan alasan banned otomatis muncul ke user.
- Di halaman **Profile**, user yang dibanned melihat banner peringatan berisi
  status & alasan banned, sekaligus tombol untuk mengajukan permohonan unban.
- Aktivitas yang **tetap diperbolehkan** untuk user banned tidak diubah sama
  sekali: melihat produk, melihat riwayat pesanan lama, mengedit profil,
  logout, dsb.

### 3. Pengajuan Unban
- Tabel baru `unban_requests`: `user_id`, `banned_reason_snapshot` (salinan
  alasan banned saat pengajuan dibuat), `request_reason`, `status`
  (`menunggu` default / `disetujui` / `ditolak`), `created_at`,
  `processed_at`, `processed_by`.
- Di halaman **Profile**, banner banned menampilkan tombol **"Ajukan
  Pembukaan Blokir Akun"** yang membuka modal dengan textarea **Alasan
  Permohonan Unban** (wajib diisi).
- User hanya boleh punya **satu permohonan berstatus "menunggu"** dalam satu
  waktu — kalau masih ada yang menunggu, endpoint submit menolak dengan
  `409` dan pesan yang jelas (`unbanRequestService.submitRequest`).
- Endpoint:
  - `POST /unban-requests` (customer, body `{ requestReason }`) — mengirim
    permohonan baru. Ditolak (`400`) kalau akun tidak sedang `banned`.
  - `GET /unban-requests/my/latest` (customer) — permohonan terbaru milik
    user yang login, dipakai Profile untuk tahu status permohonan yang
    sedang berjalan (menunggu/ditolak/disetujui) dan menonaktifkan tombol
    "Ajukan" kalau masih menunggu.

### 4. Halaman Admin — Permohonan Unban
- Menu sidebar baru **"Permohonan Unban"** (`/admin/permohonan-unban`).
- Menampilkan tabel: Nama User, Email, Tanggal Permohonan, Alasan Banned,
  Alasan Permohonan Unban, Status Permohonan, dan Aksi.
- Tombol **Setujui** (`PATCH /unban-requests/:id/approve`):
  - `status` akun user kembali `aktif`.
  - `banned_reason`, `banned_at`, `banned_by` dikosongkan.
  - `status` permohonan menjadi `disetujui`, `processed_at`/`processed_by`
    dicatat.
  - Seluruh fitur (checkout, review, wishlist, keranjang) otomatis bisa
    dipakai lagi karena `blockIfBanned` membaca `status` user secara
    langsung — tidak perlu perubahan lain.
- Tombol **Tolak** (`PATCH /unban-requests/:id/reject`):
  - `status` akun **tetap** `banned`.
  - `status` permohonan menjadi `ditolak`.
  - Karena permohonan itu sudah tidak lagi `menunggu`, user otomatis bisa
    mengirim permohonan baru kapan saja setelahnya.
- Permohonan yang sudah diproses (disetujui/ditolak) tidak lagi menampilkan
  tombol Setujui/Tolak — hanya keterangan "Sudah diproses".

### 5. Riwayat
Seluruh riwayat tersimpan permanen di database, tidak pernah dihapus:
- Siapa yang dibanned & kapan → `users.banned_at`.
- Alasan banned → `users.banned_reason` (dan disalin ke
  `unban_requests.banned_reason_snapshot` tiap kali pengajuan dibuat, supaya
  riwayat pengajuan tidak berubah walau Admin membanned ulang dengan alasan
  berbeda di kemudian hari).
- Admin yang melakukan banned → `users.banned_by`.
- Riwayat permohonan unban & status masing-masing → tabel `unban_requests`
  lengkap (tidak pernah dihapus, hanya `status`-nya yang berubah).

## File yang Diubah / Ditambahkan

### Database
- `backend/src/database/migrations/20260721_add_user_ban_system.sql` **(baru)**
  Menambahkan 4 kolom banned di `users` + tabel `unban_requests` + index
  terkait. Aman dijalankan berkali-kali (`if not exists` / `drop constraint
  if exists`).
- `backend/src/database/schema.sql`
  Diperbarui supaya jadi cerminan skema final (kolom `users` baru + tabel
  `unban_requests` + index tambahan), tanpa mengubah tabel lain.

### Backend
- `backend/src/repositories/userRepository.js`
  - `findAllCustomers` kini ikut mengambil `status`, `banned_reason`,
    `banned_at`.
  - Tambah `banUser(id, { reason, bannedBy })` dan `unbanUser(id)`.
- `backend/src/repositories/orderRepository.js`
  - Tambah `countByUser(userId)` — total pesanan per user (kolom "Total
    Pesanan" di Manajemen User).
- `backend/src/repositories/reviewRepository.js`
  - Tambah `countByUser(userId)` — total review per user (kolom "Total
    Review" di Manajemen User).
- `backend/src/repositories/unbanRequestRepository.js` **(baru)**
  Query CRUD untuk tabel `unban_requests` (`findPendingByUser`,
  `findLatestByUser`, `findAll`, `findById`, `create`, `updateStatus`).
- `backend/src/services/userService.js`
  - `toResponse` kini menyertakan `status`, `bannedReason`, `bannedAt`.
  - `getAllCustomers` kini menyertakan `status`, `bannedReason`, `bannedAt`,
    `orderCount`, `reviewCount` per user.
  - Tambah `banUser(adminId, userId, reason)` — validasi target bukan admin
    & belum banned, lalu memanggil repository.
- `backend/src/services/unbanRequestService.js` **(baru)**
  Business logic pengajuan unban: `submitRequest`, `getMyLatestRequest`,
  `getAllRequests`, `approveRequest`, `rejectRequest` — termasuk aturan
  "hanya satu permohonan menunggu dalam satu waktu" dan "permohonan yang
  sudah diproses tidak bisa diproses ulang".
- `backend/src/services/authService.js`
  - `toSafeUser` kini menyertakan `status` & `bannedReason`, supaya
    tersedia langsung setelah login (`POST /auth/login`).
- `backend/src/middlewares/authMiddleware.js`
  - `requireAuth` kini menyertakan `status`/`bannedReason` di `req.user`.
  - Tambah middleware `blockIfBanned` — dipasang di route yang dibatasi
    untuk user banned (lihat bagian "Cara Kerja" di atas).
- `backend/src/controllers/userController.js`
  - Tambah `banUser` (mendelegasikan ke `userService.banUser`).
- `backend/src/controllers/unbanRequestController.js` **(baru)**
  `submit`, `getMyLatest` (customer), `getAll`, `approve`, `reject` (admin).
- `backend/src/validators/userValidator.js`
  - Tambah `banUserValidator` — `reason` wajib diisi, maksimal 500 karakter.
- `backend/src/validators/unbanRequestValidator.js` **(baru)**
  `submitUnbanRequestValidator` — `requestReason` wajib diisi, maksimal 500
  karakter.
- `backend/src/routes/userRoutes.js`
  - Tambah `PATCH /users/:id/ban` (admin only).
- `backend/src/routes/unbanRequestRoutes.js` **(baru)**
  `POST /unban-requests`, `GET /unban-requests/my/latest` (customer),
  `GET /unban-requests`, `PATCH /unban-requests/:id/approve`,
  `PATCH /unban-requests/:id/reject` (admin).
- `backend/src/routes/index.js`
  - Mendaftarkan `unbanRequestRoutes` di path `/unban-requests`.
- `backend/src/routes/orderRoutes.js`, `routes/cartRoutes.js`,
  `routes/wishlistRoutes.js`, `routes/reviewRoutes.js`
  - Memasang `blockIfBanned` pada route Checkout / Tambah Keranjang /
    Tambah Wishlist / Buat & Edit Review.

### Frontend
- `frontend/types/user.ts`
  - Tambah `UserAccountStatus` (`"aktif" | "banned"`) dan field
    `status`/`bannedReason` pada `User`.
- `frontend/services/userService.ts`
  - `AdminCustomer` diperluas dengan `status`, `bannedReason`, `bannedAt`,
    `orderCount`, `reviewCount`.
  - Tambah `banUser(id, reason)`.
- `frontend/services/unbanRequestService.ts` **(baru)**
  `submit`, `getMyLatest` (customer), `getAll`, `approve`, `reject` (admin).
- `frontend/constants/routes.ts`
  - Tambah `admin.permohonanUnban`.
- `frontend/features/admin/components/AdminSidebar.tsx`
  - Label menu "Pelanggan" → "Manajemen User" + menu baru "Permohonan
    Unban".
- `frontend/features/admin/components/CustomerManagementView.tsx`
  - Sekarang menjadi halaman **Manajemen User** lengkap: kolom Status Akun,
    Total Pesanan, Total Review, tombol Banned + modal alasan banned
    (dengan contoh alasan yang bisa diklik cepat).
- `frontend/features/admin/components/UnbanRequestManagementView.tsx` **(baru)**
  Tabel Permohonan Unban + tombol Setujui/Tolak.
- `frontend/app/admin/pelanggan/page.tsx`
  - Judul halaman diubah menjadi "Manajemen User".
- `frontend/app/admin/permohonan-unban/page.tsx` **(baru)**
  Halaman Admin "Permohonan Unban".
- `frontend/features/profile/components/ProfileView.tsx`
  - Menampilkan banner peringatan saat akun `banned` (beserta alasan) dan
    tombol/modal "Ajukan Pembukaan Blokir Akun" (textarea Alasan Permohonan
    Unban). Tombol otomatis nonaktif/berganti pesan kalau masih ada
    permohonan yang menunggu, dan berubah jadi "ajukan permohonan baru"
    kalau permohonan sebelumnya ditolak.

## Hasil Pengujian Seluruh Skenario

1. **Admin melakukan banned terhadap User A.**
   Admin membuka Manajemen User → tombol "Banned" pada baris User A → modal
   muncul → isi Alasan Banned → Konfirmasi → `PATCH /users/:id/ban` sukses →
   baris User A langsung menampilkan badge **Banned** dan tombol Aksi
   berubah jadi "Sudah dibanned". ✅ Status berubah menjadi Banned.

2. **User A login.**
   `POST /auth/login` tetap berhasil (tidak ditolak oleh status banned) dan
   mengembalikan `status: "banned"` + `bannedReason`. Di halaman Profile,
   banner peringatan langsung tampil. Saat User A mencoba Checkout / Tulis
   Ulasan / Tambah ke Wishlist / Tambah ke Keranjang, backend menolak dengan
   `403` dan pesan berisi alasan banned, yang langsung muncul sebagai toast
   di form terkait. Melihat produk & riwayat pesanan lama tetap berjalan
   normal. ✅ Masih dapat login tetapi tidak dapat melakukan aktivitas yang
   dibatasi.

3. **User A mengirim permohonan unban.**
   Dari banner di Profile, User A membuka modal "Ajukan Pembukaan Blokir
   Akun", mengisi Alasan Permohonan Unban, kirim → `POST /unban-requests`
   sukses (`201`), baris baru masuk ke tabel `unban_requests` berstatus
   `menunggu`, banner di Profile berubah jadi "sedang menunggu diproses
   Admin". Mencoba mengirim permohonan kedua selagi yang pertama masih
   `menunggu` ditolak dengan `409` beserta pesan yang jelas. ✅ Permohonan
   berhasil dikirim.

4. **Admin menyetujui permohonan.**
   Di halaman Admin "Permohonan Unban", tombol "Setujui" pada baris User A →
   `PATCH /unban-requests/:id/approve` sukses → status akun User A kembali
   `aktif`, badge di Manajemen User kembali "Aktif", baris permohonan
   berstatus "Disetujui" dan tombol Aksi hilang. User A login ulang (atau
   refresh profil) dan seluruh fitur (checkout, review, wishlist, keranjang)
   kembali bisa dipakai tanpa error. ✅ Status akun kembali Aktif, seluruh
   fitur dapat digunakan kembali.

5. **Admin menolak permohonan.**
   Diuji dengan User B: Admin banned User B → User B mengirim permohonan
   unban → Admin menekan "Tolak" pada permohonan tersebut →
   `PATCH /unban-requests/:id/reject` sukses → status akun User B **tetap**
   `banned`, baris permohonan berstatus "Ditolak". Karena permohonan
   sebelumnya sudah tidak `menunggu` lagi, User B langsung bisa mengirim
   permohonan baru dari Profile (tombol berubah jadi "Ajukan permohonan
   baru" dan berhasil mengirim `POST /unban-requests` lagi tanpa ditolak
   `409`). ✅ Status tetap Banned, User dapat mengirim permohonan baru
   setelah permohonan sebelumnya selesai diproses.
