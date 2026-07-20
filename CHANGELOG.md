# CHANGELOG — Fitur Forgot Password (Implementasi Baru, Lengkap End-to-End)

## Penyebab email reset password tidak pernah terkirim

**Fitur Forgot Password sebelumnya belum pernah benar-benar diimplementasikan
— baik di frontend maupun backend.** Ini bukan bug pada kode yang sudah ada,
melainkan fitur yang masih berupa *stub* Fase 1:

- **Frontend** (`ForgotPasswordForm.tsx`): tombol "Kirim Link Reset Password"
  hanya menjalankan `console.log(...)` lalu menampilkan toast sukses palsu
  ("dummy"). Tidak pernah ada request ke backend sama sekali.
- **Backend**: tidak ada endpoint `/auth/forgot-password` atau
  `/auth/reset-password` — `authRoutes.js` hanya berisi `register`, `login`,
  `refresh`, `logout`, `me`. Tidak ada tabel untuk menyimpan reset token,
  tidak ada logic generate token, dan **tidak ada library pengiriman email
  sama sekali** (`nodemailer` belum terpasang di `package.json`).

Jadi begitu tombol ditekan, tidak ada proses generate token maupun proses
pengiriman email yang berjalan — itulah sebabnya email tidak pernah masuk ke
Gmail manapun.

Update ini mengimplementasikan seluruh alur Forgot Password dari nol, dari
halaman Forgot Password sampai penghapusan token setelah dipakai, sesuai
permintaan.

---

## Ringkasan alur sistem yang baru

1. User membuka `/forgot-password`, memasukkan email, klik "Kirim Link Reset
   Password".
2. Frontend memanggil `POST /api/v1/auth/forgot-password`.
3. Backend (`authService.requestPasswordReset`):
   - Mencari user berdasarkan email.
   - **Kalau email tidak ditemukan**: tidak melakukan apa pun selain
     mencatat log info di backend — request tetap dianggap "berhasil" ke
     mata user (lihat bagian Keamanan di bawah).
   - **Kalau email ditemukan**:
     - Menghapus token reset lama milik user itu yang belum dipakai (hanya
       satu link aktif dalam satu waktu).
     - Membuat token acak 32-byte (`crypto.randomBytes`, cryptographically
       secure) → di-hash dengan SHA-256 → hash inilah yang disimpan ke tabel
       `password_reset_tokens` (token asli **tidak pernah** ditulis ke
       database).
     - Token berlaku 30 menit (`PASSWORD_RESET_TOKEN_EXPIRES_MINUTES`, bisa
       diubah lewat `.env`).
     - Mengirim email berisi link
       `{FRONTEND_URL}/reset-password?token={token_asli}` ke **alamat email
       akun itu sendiri** — tidak ada parameter lain yang bisa mengubah
       tujuan email.
4. Endpoint `/auth/forgot-password` **selalu** membalas dengan pesan yang
   sama persis, apa pun hasilnya di langkah 3:
   > "Jika email yang Anda masukkan terdaftar pada sistem, kami akan
   > mengirimkan tautan untuk mengatur ulang password."
5. User membuka email, klik link, mendarat di `/reset-password?token=...`.
6. User mengisi Password Baru + Konfirmasi Password baru, submit.
7. Frontend memanggil `POST /api/v1/auth/reset-password` dengan
   `{ token, password, confirmPassword }`.
8. Backend (`authService.resetPassword`):
   - Hash token dari request, cari di `password_reset_tokens`.
   - Tolak (400) kalau: token tidak ditemukan / sudah pernah dipakai
     (`used_at` terisi) / sudah kedaluwarsa (`expires_at` < sekarang).
   - Kalau valid: hash password baru dengan bcrypt, update `users.password_hash`,
     tandai token sebagai terpakai (`used_at`), lalu hapus sisa token lain
     milik user tersebut yang belum dipakai.
9. User diarahkan ke halaman Login dengan notifikasi password berhasil
   diperbarui. Password lama otomatis tidak berlaku lagi karena kolom
   `password_hash` sudah ditimpa; link reset yang sama tidak bisa dipakai
   ulang karena `used_at` sudah terisi.

---

## File yang diubah/ditambahkan

### Backend
- **BARU** `src/database/migrations/20260720_create_password_reset_tokens.sql`
  — migration tabel `password_reset_tokens`.
- **UBAH** `src/database/schema.sql` — menambahkan tabel
  `password_reset_tokens` + index-nya, disinkronkan dengan migration di atas
  (mengikuti pola project ini untuk tabel-tabel lain).
- **BARU** `src/repositories/passwordResetRepository.js` — query Supabase
  khusus tabel `password_reset_tokens` (`create`, `findByTokenHash`,
  `markUsed`, `deleteUnusedForUser`).
- **BARU** `src/utils/mailer.js` — transporter SMTP (Nodemailer) + fungsi
  `sendPasswordResetEmail`. Memverifikasi koneksi SMTP saat pertama kali
  dipakai dan mencatat log error yang jelas untuk setiap kemungkinan
  kegagalan (Environment Variable kosong, autentikasi SMTP gagal, koneksi
  gagal, email ditolak provider, dll — lihat bagian Logging di bawah).
- **UBAH** `src/config/env.js` — menambahkan konfigurasi `smtp.*`
  (`SMTP_HOST/PORT/SECURE/USER/PASS/FROM`) dan `passwordReset.tokenExpiresMinutes`.
- **UBAH** `src/services/authService.js` — menambahkan `requestPasswordReset(email)`
  dan `resetPassword({ token, password })`, plus helper `hashResetToken`
  (SHA-256).
- **UBAH** `src/controllers/authController.js` — menambahkan handler
  `forgotPassword` dan `resetPassword`, termasuk pesan generik anti-enumerasi
  akun.
- **UBAH** `src/validators/authValidator.js` — menambahkan
  `forgotPasswordValidator` (email wajib & valid) dan `resetPasswordValidator`
  (token wajib, password ≥ 6 karakter, confirmPassword harus cocok).
- **UBAH** `src/routes/authRoutes.js` — menambahkan
  `POST /auth/forgot-password` dan `POST /auth/reset-password`, keduanya
  memakai `authLimiter` yang sama dengan login/register (mencegah brute
  force/spam).
- **UBAH** `package.json` / `package-lock.json` — menambahkan dependency
  `nodemailer`.
- **UBAH** `.env` — menambahkan variabel `SMTP_HOST`, `SMTP_PORT`,
  `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`,
  `PASSWORD_RESET_TOKEN_EXPIRES_MINUTES` (nilai `SMTP_*` masih kosong — WAJIB
  diisi manual, lihat bagian Konfigurasi SMTP di bawah).

### Frontend
- **UBAH** `services/authService.ts` — menambahkan `forgotPassword(payload)`
  dan `resetPassword(payload)` yang memanggil endpoint backend di atas.
- **UBAH** `features/auth/schemas/authSchemas.ts` — menambahkan
  `resetPasswordSchema` (Zod) untuk halaman Reset Password.
- **UBAH** `features/auth/components/ForgotPasswordForm.tsx` — mengganti
  `console.log` dummy dengan pemanggilan `authService.forgotPassword`
  sungguhan. Pesan sukses yang ditampilkan **selalu sama** apa pun hasilnya
  (lihat bagian Keamanan).
- **BARU** `features/auth/components/ResetPasswordForm.tsx` — form Password
  Baru + Konfirmasi Password Baru, membaca `token` dari query string URL,
  memanggil `authService.resetPassword`.
- **BARU** `app/(auth)/reset-password/page.tsx` — halaman baru
  `/reset-password`, dibungkus `Suspense` (wajib di Next.js App Router untuk
  komponen yang memakai `useSearchParams`) dan `GuestGuard` (user yang sudah
  login diarahkan ke Beranda, konsisten dengan halaman Login/Register).
- **UBAH** `constants/routes.ts` — menambahkan `ROUTES.resetPassword`.

---

## Keamanan

- **Anti-enumerasi akun**: endpoint `/auth/forgot-password` maupun form di
  frontend **tidak pernah** membedakan respons antara "email terdaftar" dan
  "email tidak terdaftar". Keduanya selalu mendapat pesan generik yang sama.
  Perbedaan hanya terjadi di log backend (untuk kebutuhan debugging Anda),
  tidak pernah bocor ke response API.
- **Token reset password**:
  - Dibuat dengan `crypto.randomBytes(32)` (256 bit entropi, cryptographically
    secure, bukan `Math.random()`).
  - Disimpan di database **dalam bentuk hash SHA-256**, bukan plain text —
    kalau database bocor, token asli tetap tidak bisa direkonstruksi.
  - Berlaku 30 menit (dapat diubah lewat `PASSWORD_RESET_TOKEN_EXPIRES_MINUTES`).
  - Hanya bisa dipakai satu kali (`used_at`); langsung tidak berlaku begitu
    dipakai untuk reset password yang berhasil.
  - Diinvalidasi otomatis begitu ada permintaan reset baru untuk user yang
    sama (hanya satu link aktif dalam satu waktu).
- **Tujuan email tidak bisa diubah**: link reset selalu dikirim ke
  `user.email` hasil lookup dari database (bukan dari input/parameter apa
  pun yang dikirim client) — tidak ada cara bagi client untuk mengarahkan
  email ke alamat lain.
- Endpoint `forgot-password` dan `reset-password` memakai `authLimiter` yang
  sama dengan login (20 percobaan / 15 menit per IP) untuk mencegah spam
  maupun brute-force menebak token.

---

## Logging kegagalan pengiriman email

`src/utils/mailer.js` mencatat log `[mailer]` yang jelas untuk setiap skenario
kegagalan berikut, supaya penyebabnya bisa langsung dilihat dari log backend:

- `SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS belum diset` — saat Environment
  Variable SMTP kosong/belum diisi.
- `Verifikasi koneksi SMTP gagal` — dicek otomatis begitu transporter pertama
  kali dibuat (host salah, port diblokir firewall, kredensial salah, dll).
- `Gagal mengirim email reset password` — mencatat `error.message`,
  `error.code`, `error.command`, dan `error.responseCode` dari Nodemailer,
  mis. saat email ditolak provider (Gmail) atau autentikasi SMTP gagal saat
  proses `sendMail`.

Catatan penting: kegagalan pengiriman email **tidak pernah** membuat endpoint
`/auth/forgot-password` mengembalikan error ke user (lihat bagian Keamanan) —
untuk mengetahui apakah email benar-benar terkirim, periksa log backend,
bukan response API.

---

## Konfigurasi SMTP yang diperlukan

Isi variabel berikut di `backend/.env` (sudah ditambahkan dengan nilai
kosong, tinggal diisi):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=adminsikma67@gmail.com
SMTP_PASS=<App Password 16 karakter, BUKAN password akun Gmail biasa>
SMTP_FROM=adminsikma67@gmail.com
```

Karena akun contoh yang disebutkan menggunakan Gmail, dan Gmail **tidak lagi
mengizinkan login SMTP memakai password akun biasa**, langkah yang perlu
dilakukan di sisi Google:

1. Aktifkan 2-Step Verification pada akun Gmail tersebut (wajib, kalau belum
   aktif App Password tidak akan muncul sebagai opsi).
2. Buka Google Account → Security → App Passwords → buat App Password baru
   (pilih app "Mail", device bebas) → salin password 16 karakter yang
   diberikan.
3. Isi `SMTP_PASS` dengan App Password tersebut (bukan password Gmail biasa).
4. Restart backend. Saat start, `mailer.js` otomatis memverifikasi koneksi
   SMTP dan mencatat hasilnya (`[mailer] Koneksi SMTP berhasil diverifikasi`
   atau pesan error yang menjelaskan penyebabnya) — cek log ini dulu sebelum
   mencoba fitur Forgot Password dari UI.

`FRONTEND_URL` di `backend/.env` (sudah ada sebelumnya) dipakai untuk
membangun link reset (`{FRONTEND_URL}/reset-password?token=...`) — pastikan
nilainya sudah sesuai domain frontend Anda saat production.

---

## Hasil pengujian seluruh skenario

Migration SQL sudah disertakan (`20260720_create_password_reset_tokens.sql`)
tapi **belum dijalankan terhadap database Supabase Anda** — silakan jalankan
lewat Supabase SQL Editor terlebih dahulu. Kredensial SMTP juga masih kosong
di `.env` (lihat di atas). Karena dua hal ini butuh akses ke Supabase project
dan akun Gmail Anda yang sebenarnya, saya tidak bisa menjalankan pengujian
end-to-end sungguhan (kirim email asli, buka link, dst) dari sandbox ini.
Yang sudah saya lakukan sebagai verifikasi di level kode:

| # | Skenario | Status |
|---|----------|--------|
| 1 | Alur lengkap route → controller → service → repository → mailer tersambung dengan benar, tanpa gap (tidak ada langkah yang terlewat) | ✅ Diperiksa manual, seluruh 8 titik yang diminta (Halaman Forgot Password, Route API, Controller, Service, Generate Token, Penyimpanan Token, Pengiriman Email, Halaman Reset Password, Update Password, Penghapusan Token) sudah diimplementasikan dan saling terhubung |
| 2 | Seluruh file backend baru/diubah lolos `node --check` (syntax valid) | ✅ |
| 3 | Struktur brace/paren pada file frontend baru/diubah seimbang (indikasi tidak ada JSX/TS yang rusak) | ✅ |
| 4 | Email reset benar-benar terkirim & masuk ke Gmail | ⏳ Butuh `SMTP_USER`/`SMTP_PASS` asli diisi dulu di `.env` — tidak bisa diuji dari sandbox ini |
| 5 | Link reset dapat dibuka, password baru tersimpan | ⏳ Butuh migration dijalankan dulu di Supabase project Anda |
| 6 | Password lama tidak bisa dipakai lagi, password baru bisa login | ⏳ Sama seperti di atas — logic sudah diimplementasikan (`resetPassword` menimpa `password_hash`), tapi verifikasi end-to-end butuh database & SMTP asli |
| 7 | Link reset yang sama tidak bisa dipakai dua kali | ✅ Diverifikasi lewat pembacaan kode: `used_at` dicek di awal `resetPassword`, ditulis begitu berhasil |
| 8 | Kegagalan SMTP/provider menghasilkan log error yang jelas | ✅ Diverifikasi lewat pembacaan kode `mailer.js` (3 skenario log dijelaskan di atas) |

**Yang perlu Anda lakukan setelah menerima ZIP ini:**
1. Jalankan `src/database/migrations/20260720_create_password_reset_tokens.sql`
   di Supabase SQL Editor.
2. Isi `SMTP_USER` dan `SMTP_PASS` (App Password Gmail) di `backend/.env`.
3. `npm install` di folder `backend` (menambahkan `nodemailer`).
4. Jalankan backend, cek log `[mailer]` saat startup untuk memastikan koneksi
   SMTP berhasil diverifikasi.
5. Uji dari UI: `/forgot-password` → cek email masuk → buka link → set
   password baru → login dengan password baru.

Saya juga **tidak bisa menjalankan `npm run build` / `tsc` penuh** di sandbox
ini (tidak ada `node_modules` frontend ter-install), jadi mohon jalankan
`npm run build` di lingkungan Anda sebelum deploy sebagai langkah verifikasi
terakhir.

---

# CHANGELOG — Investigasi & Perbaikan Menyeluruh Sistem Autentikasi

Update ini adalah lanjutan dari perbaikan Logout sebelumnya. Kali ini seluruh
alur autentikasi ditelusuri ulang secara menyeluruh (bukan hanya menambal
gejala): Login, Register, Refresh, Logout, `authMiddleware` (backend),
`AuthProvider`, `AuthGuard`, `apiClient`, `authStore` (frontend), sampai ke
opsi cookie yang dikirim backend.

---

## AKAR PENYEBAB YANG DITEMUKAN

### 1. Root cause utama (sudah diperbaiki di update sebelumnya, dikonfirmasi ulang)
`handleLogout()` di `ProfileView.tsx` menghapus token & cookie, tapi **tidak
pernah mengosongkan state `user` di `authStore` (Zustand)**. Karena
`AuthGuard` dan Navbar mengambil keputusan dari `authStore` — bukan dari ada/
tidaknya token — seluruh UI tetap menganggap user login sampai ada request
API lain yang gagal 401. Ini adalah penyebab semua gejala yang dilaporkan
sebelumnya (logout "tidak benar-benar keluar", tombol Back setelah logout
masih bisa "menembus" halaman terproteksi, dan kesan tiba-tiba dilempar ke
Login).

Perbaikan (sudah ada di update sebelumnya, tidak diubah lagi): `setUser(null)`
sekarang selalu dipanggil di blok `finally` saat logout.

### 2. Root cause baru #1 — cookie refresh token tidak dihapus dengan atribut yang cocok (backend)
`authController.logout()` sebelumnya memanggil:
```
res.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/" })
```
Padahal cookie itu di-*set* (saat login/register/refresh) dengan atribut
lebih lengkap: `httpOnly`, `secure` (true di production), dan
`sameSite: "none"` di production (wajib untuk skenario cross-site
Vercel↔Railway). Instruksi hapus-cookie yang tidak membawa atribut
`secure`/`sameSite` yang sama berisiko **gagal menghapus cookie tersebut di
beberapa browser**, khususnya kombinasi `SameSite=None` di production —
cookie lama bisa tetap tersimpan di browser meskipun endpoint
`/auth/logout` sudah dipanggil dan mengembalikan sukses.

**Ini kandidat kuat lain untuk gejala "logout terlihat berhasil tapi
sesi masih tersimpan"**, khususnya di lingkungan production, terpisah dari
root cause #1 di atas yang levelnya di state client.

**Perbaikan:** menambah `getClearRefreshCookieOptions()` di
`backend/src/utils/cookie.js` yang mengembalikan atribut cookie yang PERSIS
sama dengan saat di-set (`httpOnly`, `secure`, `sameSite`, `path`), minus
`maxAge`. `authController.logout()` sekarang memakai opsi ini saat memanggil
`res.clearCookie(...)`, supaya instruksi hapus cookie ke browser konsisten
dengan cara cookie itu awalnya dibuat.

### 3. Root cause baru #2 — tidak ada proteksi supaya user yang sudah login tidak bisa membuka halaman Login/Register
Ini bukan bug regresi, tapi memang **belum pernah diimplementasikan sama
sekali**: halaman `/login` dan `/register` selalu bisa diakses siapa saja,
termasuk user yang sedang login. Ini persis skenario yang Anda minta di poin
3, dan berpotensi menjadi sumber kebingungan "kok saya masih bisa ke halaman
Login padahal sudah login" yang terasa seperti bug redirect.

**Perbaikan:** komponen baru `frontend/components/shared/GuestGuard.tsx`
(kebalikan dari `AuthGuard`) — dipasang di `app/(auth)/login/page.tsx` dan
`app/(auth)/register/page.tsx`. Kalau `authStore` menunjukkan user sudah
login (dan `AuthProvider` sudah selesai silent-refresh), user otomatis
di-redirect ke Beranda dan form Login/Register tidak sempat tampil.
Halaman Lupa Password sengaja **tidak** ikut diberi guard ini (di luar
lingkup permintaan, dan secara wajar tetap harus bisa diakses kapan saja).

### 4. Root cause baru #3 — access token "menggantung" setelah Register (state tidak konsisten)
`authService.register()` di frontend memanggil `setAccessToken(accessToken)`
padahal alur produk yang sebenarnya (dilihat dari `RegisterForm.tsx`)
mengharuskan user login ulang secara manual setelah daftar akun — `authStore`
tidak pernah diisi (`setUser` tidak dipanggil) dan user diarahkan ke halaman
Login, bukan Beranda. Akibatnya ada access token valid yang tersimpan
in-memory dan akan otomatis dilampirkan `apiClient` ke request berikutnya,
padahal `authStore` menganggap user **belum login**. Ini state yang tidak
konsisten dan berisiko menimbulkan perilaku aneh (mis. request tertentu
"berhasil" seakan-akan login, padahal UI menampilkan kondisi belum login).

**Perbaikan:** `authService.register()` tidak lagi memanggil
`setAccessToken()`. Perilaku yang terlihat user tidak berubah (tetap
diarahkan ke halaman Login setelah daftar akun berhasil), tapi sekarang
state di client benar-benar konsisten: belum ada token tersimpan sampai
user benar-benar login.

---

## SOAL POIN 1 (Redirect ke Login persis setelah Login berhasil) — hasil investigasi mendalam

Saya menelusuri ulang seluruh rantai `LoginForm.onSubmit` →
`authService.login()` → `apiClient` (interceptor request/response) →
`authStore.setUser()` → `router.push(ROUTES.home)`, termasuk:

- Apakah halaman Beranda (`/`) dibungkus `AuthGuard`? **Tidak** —
  `app/(shop)/layout.tsx` tidak memakai `AuthGuard` sama sekali.
- Apakah ada `middleware.ts` di root Next.js yang bisa mencegat request?
  **Tidak ada file `middleware.ts` di project ini.**
- Apakah `AuthProvider` bisa "menimpa" state setelah login sukses (race
  condition)? **Tidak** — `AuthProvider` hanya berjalan sekali saat
  `RootLayout` pertama kali mount (dependency array kosong), dan `RootLayout`
  tidak remount saat pindah halaman lewat `router.push` (App Router).
- Apakah opsi cookie (`secure`/`sameSite`) di development bermasalah?
  **Tidak** — `NODE_ENV=development` di `.env` backend lokal, sehingga
  `secure: false, sameSite: "lax"` (benar untuk `http://localhost`).

**Kesimpulan:** tidak ditemukan kode yang secara langsung melempar user
kembali ke halaman Login setelah login berhasil. Kombinasi 3 perbaikan di
atas (khususnya #1 dan #3) adalah kandidat penyebab paling mungkin dari
gejala ini — begitu `authStore` bisa "salah" menganggap status login (baik
karena logout tidak tuntas, maupun karena state menggantung dari alur lain),
`AuthGuard`/`GuestGuard` bisa membuat user terasa "dilempar-lempar" antara
Login dan halaman lain. Dengan `authStore` sekarang selalu konsisten dengan
status login yang sebenarnya di setiap titik (login, logout, register),
gejala ini seharusnya sudah tidak muncul lagi.

Jika **masih** terjadi persis setelah deploy ke production, kemungkinan
besar penyebabnya ada di luar kode aplikasi — konfigurasi environment
(`FRONTEND_URL` di backend vs domain Vercel aktual, `NEXT_PUBLIC_API_URL` di
frontend vs domain Railway aktual, atau clock skew server yang membuat JWT
langsung dianggap kedaluwarsa). Ini tidak bisa diverifikasi lewat kode saja
— tolong share URL production & waktu tepat kejadian kalau masih muncul,
supaya saya bisa periksa lebih spesifik.

---

## File yang diubah/ditambahkan (kumulatif, termasuk update logout sebelumnya)

### Frontend
- `frontend/features/profile/components/ProfileView.tsx` — logout selalu
  mengosongkan `authStore` (`setUser(null)`) di blok `finally`, apa pun
  hasil request ke server, sebelum redirect ke Login.
- `frontend/services/authService.ts` —
  - `logout()`: `setAccessToken(null)` dipindah ke blok `finally` (selalu
    jalan walau request gagal).
  - `register()`: tidak lagi memanggil `setAccessToken()` (menghindari
    access token menggantung — lihat Root Cause #3 di atas).
- `frontend/features/auth/components/LoginForm.tsx` — tombol "Kembali ke
  Beranda" di atas form (tidak mengubah tampilan form yang sudah ada).
- `frontend/features/auth/components/RegisterForm.tsx` — tombol "Kembali ke
  Beranda", pola sama seperti Login.
- `frontend/components/shared/GuestGuard.tsx` **(baru)** — guard kebalikan
  `AuthGuard`; redirect user yang sudah login ke Beranda saat mencoba
  membuka Login/Register.
- `frontend/app/(auth)/login/page.tsx` — dibungkus `GuestGuard`.
- `frontend/app/(auth)/register/page.tsx` — dibungkus `GuestGuard`.

### Backend
- `backend/src/utils/cookie.js` — tambah `getClearRefreshCookieOptions()`
  supaya atribut cookie saat dihapus (logout) sama persis dengan saat
  di-set (login/register/refresh).
- `backend/src/controllers/authController.js` — `logout()` memakai
  `getClearRefreshCookieOptions()` alih-alih opsi minimal `{ path: "/" }`.

Tidak ada perubahan skema database, jadi **tidak ada file migration** di
paket ini. `localStorage`/`sessionStorage` sudah dipastikan (lewat
pencarian di seluruh source frontend) **tidak dipakai sama sekali** di
project ini — baik untuk auth maupun fitur lain — jadi tidak ada yang perlu
dibersihkan di sana; desain aslinya memang sengaja hanya memakai in-memory
token + httpOnly cookie (lebih aman dari XSS).

---

## Cara kerja sistem autentikasi setelah seluruh perbaikan ini

1. **Login** — access token in-memory, cookie refresh httpOnly di-set
   backend, `authStore.user` diisi → redirect ke Beranda.
2. **Register** — akun dibuat, cookie refresh tetap di-set backend
   (konsisten dengan Login/Refresh), tapi **frontend sengaja tidak
   menyimpan access token maupun mengisi `authStore`** → user diarahkan ke
   halaman Login untuk login manual, sesuai pesan "silakan masuk".
3. **Refresh halaman / buka tab baru** — `AuthProvider` mencoba
   `/auth/refresh` pakai cookie httpOnly; kalau valid, `authStore` diisi
   ulang tanpa user perlu login lagi (persistent login, berlaku sampai 7
   hari sesuai `maxAge` cookie, atau sampai Logout).
4. **Pindah halaman** — `authStore` tetap konsisten (client-side navigation,
   tidak ada remount `AuthProvider`), `AuthGuard`/`GuestGuard` membaca
   status yang sama di semua halaman.
5. **Logout** — cookie dihapus di server (dengan atribut yang cocok),
   access token in-memory dihapus, **dan** `authStore` dikosongkan tanpa
   syarat → status login benar-benar berakhir di semua tempat (Navbar,
   AuthGuard, GuestGuard) secara bersamaan.
6. **Login kembali** — alur sama seperti poin 1, tidak ada state basi yang
   tersisa dari sesi sebelumnya karena semuanya sudah dikosongkan saat
   logout.
7. **Tutup browser lalu buka lagi** — cookie refresh token httpOnly
   (`maxAge` 7 hari) tetap tersimpan oleh browser selama belum Logout dan
   belum kedaluwarsa → `AuthProvider` auto-login lewat silent refresh saat
   aplikasi dibuka lagi. Ini best-effort "persistent login" yang memang
   sudah didesain sejak awal lewat refresh token, bukan lewat
   localStorage/sessionStorage.
8. **Login/Register saat sudah login** — `GuestGuard` langsung redirect ke
   Beranda; form tidak bisa diakses lagi kecuali sudah Logout.

---

## Hasil pengujian (verifikasi lewat penelusuran kode end-to-end)

Catatan: sandbox ini tidak memiliki akses ke database/Supabase maupun
registry npm, sehingga aplikasi tidak bisa benar-benar dijalankan
(`npm run dev` / browser sungguhan). Verifikasi dilakukan dengan menelusuri
setiap baris kode yang terlibat di tiap skenario, termasuk kondisi race dan
opsi konfigurasi (cookie, CORS, env).

| # | Skenario | Hasil |
|---|----------|-------|
| 1 | Login → redirect ke Beranda | ✅ Tidak ada kode yang mengembalikan ke Login; sudah ditelusuri baris per baris |
| 2 | Refresh halaman | ✅ `AuthProvider` silent-refresh via cookie httpOnly, `isInitializing` mencegah `AuthGuard` sempat redirect prematur |
| 3 | Pindah halaman | ✅ `authStore` persisten selama sesi SPA, `AuthGuard`/`GuestGuard` konsisten di semua route |
| 4 | Login/Register tidak bisa diakses saat sudah login | ✅ **Baru diimplementasikan** via `GuestGuard` |
| 5 | Logout menghapus session/token/cookie | ✅ `authStore` dikosongkan + access token in-memory dihapus (dengan `finally`) + cookie dihapus dengan atribut yang cocok (backend) |
| 6 | Tombol Back setelah Logout tidak bisa akses halaman terproteksi | ✅ `authStore` (bukan cache halaman) sudah kosong sebelum redirect terjadi, jadi `AuthGuard` langsung menolak |
| 7 | Login kembali setelah Logout | ✅ Tidak ada state basi tersisa (lihat poin 5) |
| 8 | Tutup & buka browser (persistent login) | ✅ Bergantung pada cookie refresh token httpOnly (`maxAge` 7 hari), bukan localStorage — sudah sesuai desain awal |

---

## Yang perlu diperhatikan

- Sama seperti update sebelumnya: saya **tidak bisa menjalankan
  `npm run build` / `tsc` / `eslint`** di sandbox ini (tidak ada akses
  internet untuk `npm install`). Semua perubahan sudah diperiksa manual
  (termasuk cek `node --check` untuk file backend) dan konsisten dengan pola
  TypeScript/JavaScript yang sudah dipakai di project ini. Tolong jalankan
  `npm run build` di lingkungan Anda sebelum deploy.
- `GuestGuard` sengaja tidak dipasang di halaman Lupa Password — kalau Anda
  ingin halaman itu juga tidak bisa diakses saat sudah login, beri tahu
  saya.
- Kalau Bug #1 (redirect ke Login setelah Login sukses) **masih** terjadi
  persis di production setelah update ini di-deploy, kemungkinan besar
  penyebabnya di konfigurasi environment (domain/CORS/cookie), bukan lagi
  di kode aplikasi — saya butuh detail production (URL & waktu kejadian)
  untuk investigasi lebih lanjut.
