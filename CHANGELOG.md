# CHANGELOG — Migrasi ke Supabase Auth (Login, Register, Session, Forgot Password)

## 0. Temuan Awal (penting dibaca dulu)

Sebelum melakukan perubahan apa pun, project ini diperiksa dan ternyata **tidak
memakai Supabase Auth sama sekali**, walaupun `@supabase/supabase-js` sudah
terpasang. Supabase sebelumnya hanya dipakai sebagai database Postgres +
storage biasa. Autentikasi (Register, Login, Session, Forgot Password)
sepenuhnya custom:

- Password di-hash sendiri pakai `bcrypt` (`backend/src/utils/password.js`)
- Access & refresh token JWT diterbitkan sendiri (`backend/src/utils/jwt.js`)
- Reset password pakai tabel `password_reset_tokens` buatan sendiri + token
  acak yang dikirim lewat SMTP sendiri (`backend/src/utils/mailer.js`)

Ini sudah dikonfirmasi ke Anda sebelum lanjut, dan Anda memilih untuk
**migrasi penuh ke Supabase Auth asli**. Dokumen ini mencatat migrasi
tersebut.

## 1. Penyebab Email Reset Password Tidak Terkirim (akar masalah lama)

Di `backend/.env`, variabel berikut kosong: `SMTP_HOST`, `SMTP_USER`,
`SMTP_PASS`, `SMTP_FROM`. `utils/mailer.js` sudah didesain untuk gagal secara
"diam-diam" kalau ini kosong (supaya server tetap bisa start, dan supaya
respons ke user tetap pesan generik demi anti-enumerasi-akun) — kegagalannya
hanya tercatat di log backend, tidak pernah sampai ke user. Karena itu tombol
"Kirim Link Reset Password" selalu terlihat "berhasil" di frontend padahal
email-nya tidak pernah benar-benar terkirim.

**Perbaikan ini tidak lagi relevan** karena SMTP custom sudah dihapus total —
pengiriman email sekarang jadi tanggung jawab Supabase Auth (lihat §3).

## 2. Ringkasan Perubahan Arsitektur

| Sebelumnya | Sekarang |
|---|---|
| Password di-hash sendiri (bcrypt) | Disimpan & di-hash oleh Supabase Auth (`auth.users`) |
| Access/refresh token JWT buatan sendiri | Access/refresh token asli dari Supabase Auth |
| Tabel `users` = akun lengkap (termasuk `password_hash`) | Tabel `users` = profil tambahan (`nama_lengkap`, `no_hp`, `role`) yang `id`-nya sama dengan `auth.users.id` |
| Tabel `password_reset_tokens` + SMTP sendiri | `supabase.auth.resetPasswordForEmail` (Supabase yang kirim email) |
| `POST /auth/reset-password` (backend) | Dihapus — diganti `supabase.auth.updateUser()` langsung dari browser |

Login, Register, dan Refresh Token **tetap lewat backend** (`/auth/*`) seperti
sebelumnya — supaya seluruh bagian aplikasi lain (AuthGuard, GuestGuard,
AuthProvider, cookie httpOnly refresh token, dsb.) tidak perlu dirombak — hanya
saja di baliknya backend sekarang memanggil API resmi Supabase Auth, bukan
logic sendiri lagi.

Khusus **Reset Password (langkah 2)**, wajib dipindah ke frontend, karena
Supabase mengirim session recovery lewat URL link email yang hanya bisa dibaca
oleh browser — bukan lewat backend. Ini juga persis pola yang direkomendasikan
dokumentasi resmi Supabase Auth untuk Next.js.

## 3. Konfigurasi Supabase Auth yang WAJIB Anda Lakukan

Kode saja tidak cukup — bagian ini **wajib** dikerjakan manual di Supabase
Dashboard & `.env` sebelum fitur berfungsi:

### 3.1 Environment Variable baru
- Backend `.env` → isi `SUPABASE_ANON_KEY` (Project Settings → API → `anon public`)
- Frontend `.env` → isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3.2 Authentication → URL Configuration
- **Site URL**: isi dengan domain production frontend Anda (mis.
  `https://nutwear.vercel.app`) — jangan `localhost` kalau sudah deploy.
- **Redirect URLs**: tambahkan `https://<domain-frontend-anda>/reset-password`
  (dan versi `localhost:3000/reset-password` untuk development). Supabase akan
  MENOLAK redirect ke URL yang tidak ada di daftar ini.

### 3.3 Authentication → Email Templates
- Cek template **"Reset Password"** — pastikan tombol/link di dalamnya memakai
  variabel bawaan `{{ .ConfirmationURL }}` (default Supabase sudah begini,
  hanya perlu dicek belum pernah diubah manual jadi salah).

### 3.4 Email Provider / SMTP
- Secara default Supabase mengirim lewat mail server bawaannya sendiri
  (cukup untuk testing, ada rate limit ketat — beberapa email/jam).
- Untuk production, sangat disarankan aktifkan **Custom SMTP** di
  Authentication → Settings → SMTP Settings (bisa pakai kredensial Gmail App
  Password/provider lain yang tadinya ada di `.env` — sekarang pindah
  konfigurasinya ke Dashboard Supabase, bukan lagi di kode/`.env` project).

### 3.5 Authentication → Providers → Email
- Pastikan **"Confirm email"** sesuai kebutuhan. Kode Register sekarang
  memakai `email_confirm: true` (langsung aktif tanpa verifikasi email),
  supaya perilaku sama seperti sebelumnya (bisa langsung Login setelah
  Register). Kalau Anda justru ingin mewajibkan verifikasi email, ini perlu
  disesuaikan lagi di kode (`backend/src/services/authService.js`, fungsi
  `register`) sekaligus setting di Dashboard.

### 3.6 Database — jalankan migrasi SQL
- Jalankan `backend/migrations/20260720_migrate_to_supabase_auth.sql` lewat
  Supabase Dashboard → SQL Editor.
- **BACA catatan di bagian bawah file SQL tersebut** sebelum menjalankan kalau
  project ini sudah punya user asli terdaftar — ada langkah migrasi data yang
  wajib dilakukan dulu (akun lama tidak otomatis punya akun Supabase Auth, dan
  password bcrypt lama tidak bisa dipindahkan langsung).

## 4. File yang Diubah

**Backend**
- `backend/src/config/supabase.js` — tambah client anon key untuk operasi Auth
- `backend/src/config/env.js` — hapus config JWT/SMTP/password-reset yang sudah tidak dipakai
- `backend/src/repositories/userRepository.js` — `users` jadi tabel profil, `create()` menerima `id` eksplisit
- `backend/src/services/authService.js` — ditulis ulang total memakai Supabase Auth
- `backend/src/middlewares/authMiddleware.js` — verifikasi token lewat `supabase.auth.getUser()`
- `backend/src/controllers/authController.js` — `register` tidak lagi set cookie session; `resetPassword` dihapus
- `backend/src/routes/authRoutes.js` — route `/auth/reset-password` dihapus
- `backend/src/validators/authValidator.js` — `resetPasswordValidator` dihapus
- `backend/package.json` — hapus dependency `bcrypt`, `jsonwebtoken`, `nodemailer`
- `backend/.env` — tambah `SUPABASE_ANON_KEY`, hapus variabel JWT/SMTP/password-reset yang sudah tidak dipakai

**Frontend**
- `frontend/lib/supabaseClient.ts` — **baru**, client Supabase untuk browser (khusus alur Reset Password)
- `frontend/services/authService.ts` — `resetPassword` sekarang memanggil Supabase Auth langsung
- `frontend/features/auth/components/ResetPasswordForm.tsx` — ditulis ulang untuk membaca link recovery asli Supabase (`?code=...` atau URL fragment), bukan `?token=...` custom lagi
- `frontend/lib/apiTypes.ts` — `getApiErrorMessage` sekarang juga menangani error dari Supabase Auth
- `frontend/package.json` — tambah dependency `@supabase/supabase-js`
- `frontend/.env` dan `.env.local.example` — tambah `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Baru**
- `backend/migrations/20260720_migrate_to_supabase_auth.sql`

## 5. File yang HARUS Dihapus Manual (tidak ada di ZIP ini)

ZIP ini hanya berisi file yang berubah/baru, sesuai instruksi. File berikut
**sudah tidak dipakai sama sekali** setelah migrasi dan aman untuk dihapus
manual dari project Anda:

- `backend/src/repositories/passwordResetRepository.js`
- `backend/src/utils/mailer.js`
- `backend/src/utils/jwt.js`
- `backend/src/utils/password.js`

## 6. Hasil Pengujian

**Sudah diverifikasi di sandbox ini (tanpa akses internet/Supabase project asli):**
- Seluruh file `.js` backend yang diubah lolos `node --check` (bebas syntax error).
- Review manual alur data end-to-end (Register → profil tersimpan; Login →
  token Supabase dipakai; Refresh → `refreshSession`; Forgot Password →
  `resetPasswordForEmail`; Reset Password → `updateUser` di browser) sudah
  konsisten dengan dokumentasi resmi Supabase Auth.

**BELUM bisa diuji di sini** karena sandbox ini tidak mempunyai akses jaringan
ke Supabase project Anda maupun `npm install` (tidak ada koneksi internet).
Setelah Anda `npm install` di kedua folder dan mengisi environment variable +
konfigurasi Dashboard di §3, mohon jalankan pengujian manual berikut (persis
6 skenario yang Anda minta):

1. **Kirim reset password ke email terdaftar** → cek email benar-benar masuk
   (termasuk folder Spam) dalam beberapa menit.
2. **Buka link dari email** → halaman `/reset-password` menampilkan form
   (bukan pesan "link tidak valid").
3. **Ganti password** → submit form berhasil, redirect ke halaman Login.
4. **Login pakai password lama** → harus gagal ("Email atau password salah").
5. **Login pakai password baru** → harus berhasil.
6. **Buka link email yang sama lagi, coba pakai ulang** → Supabase Auth secara
   bawaan menandai link recovery sudah dipakai/kedaluwarsa setelah sesi
   ditutup (lihat `supabaseClient.auth.signOut()` yang dipanggil setelah
   sukses reset) — link lama seharusnya tidak bisa dipakai lagi untuk
   mengganti password kedua kalinya.

Kalau ada satu pun skenario di atas yang tidak sesuai harapan saat Anda coba,
kabari saya detail errornya (dari log backend & console browser) supaya bisa
saya bantu telusuri lebih lanjut.
