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
