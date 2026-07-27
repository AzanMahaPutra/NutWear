# UPDATE — Login dengan Google

Menambahkan Login dengan Google sebagai metode login tambahan, berdampingan
dengan Login Email & Password yang sudah ada (tidak diubah/dirusak). Tidak ada
refactor besar, struktur folder, maupun UI yang diubah selain menambahkan
tombol "Masuk dengan Google" di halaman Login.

**Kredensial Google (Client ID, Client Secret, Redirect URL) TIDAK ada di
mana pun dalam kode ini** — sesuai instruksi, semuanya dikonfigurasi langsung
di Supabase Dashboard & Google Cloud Console oleh Anda sendiri. Lihat bagian
"Langkah yang Perlu Anda Lakukan" di bawah.

---

## 1. File yang Diubah/Ditambahkan

### Backend
| File | Perubahan |
|---|---|
| `backend/src/database/migrations/20260727_add_user_google_oauth_fields.sql` | **Baru.** Menambah kolom `provider` (`'email'`\|`'google'`, default `'email'`) dan `avatar_url` pada tabel `users`. |
| `backend/src/services/authService.js` | Menambah `loginWithGoogle(accessToken)`. `toSafeUser()` kini menyertakan `avatarUrl`. |
| `backend/src/repositories/userRepository.js` | `create()` menerima `provider`/`avatarUrl` opsional (tidak memengaruhi Register biasa). |
| `backend/src/controllers/authController.js` | Menambah handler `googleLogin`. |
| `backend/src/routes/authRoutes.js` | Menambah route `POST /api/v1/auth/google`. |
| `backend/src/validators/authValidator.js` | Menambah `googleLoginValidator`. |
| `backend/src/services/userService.js` | `toResponse()` kini menyertakan `avatarUrl` (konsisten dengan `authService`, dipakai `/users/profile` & `/auth/me`). |

### Frontend
| File | Perubahan |
|---|---|
| `frontend/services/authService.ts` | Menambah `signInWithGoogle()` (memicu redirect OAuth) & `loginWithGoogle()` (sinkronisasi ke backend setelah redirect selesai). |
| `frontend/features/auth/components/LoginForm.tsx` | Menambah tombol **"Masuk dengan Google"** + pemisah "Atau", persis di bawah tombol "MASUK" (form Email & Password tidak diubah sama sekali). |
| `frontend/features/auth/components/GoogleCallbackHandler.tsx` | **Baru.** Komponen yang menyelesaikan OAuth flow setelah redirect balik dari Google. |
| `frontend/app/auth/callback/page.tsx` | **Baru.** Halaman `/auth/callback`, target redirect OAuth. |
| `frontend/components/ui/GoogleIcon.tsx` | **Baru.** Ikon resmi Google (SVG inline, 4 warna) untuk tombol. |
| `frontend/constants/routes.ts` | Menambah `ROUTES.authCallback = "/auth/callback"`. |
| `frontend/types/user.ts` | Menambah field opsional `avatarUrl` pada tipe `User`. |
| `frontend/next.config.ts` | Menambah `lh3.googleusercontent.com` ke `images.remotePatterns` (untuk foto profil Google, dipakai kalau nanti ditampilkan). |

**Tidak ada file yang dihapus. Tidak ada dependency baru** — backend & frontend
sudah sama-sama memakai `@supabase/supabase-js` sebelumnya (lihat
`backend/src/config/supabase.js` & `frontend/lib/supabaseClient.ts`).

---

## 2. Arsitektur Login Google

Alurnya murni memakai Supabase Auth bawaan (**tidak ada sistem session kedua**):

1. User klik "Masuk dengan Google" di `/login` →
   `authService.signInWithGoogle()` memanggil
   `supabaseClient.auth.signInWithOAuth({ provider: "google" })` → browser
   redirect ke Google, lalu Google redirect balik ke Supabase, lalu Supabase
   redirect balik ke `NEXT_PUBLIC_SITE_URL + /auth/callback`.
2. Halaman `/auth/callback` (`GoogleCallbackHandler.tsx`) menukar `?code=...`
   jadi session Supabase di browser (pola yang **sama persis** dengan flow
   `ResetPasswordForm.tsx` yang sudah ada), lalu mengirim
   `access_token`/`refresh_token` sesi tsb ke backend lewat
   `POST /api/v1/auth/google`.
3. Backend (`authService.loginWithGoogle`) memverifikasi `access_token` lewat
   `supabase.auth.getUser()` — **fungsi yang sama** yang dipakai
   `authMiddleware.requireAuth` untuk memverifikasi token Login Email &
   Password. Karena itu, session hasil Login Google **otomatis kompatibel**
   dengan seluruh sistem auth yang sudah ada — tidak ada JWT/session custom
   kedua yang dibuat.
4. Baris profil `users` dicari berdasarkan `auth.users.id`:
   - **Sudah ada** → dipakai apa adanya. Role, status banned, dan seluruh
     data lain (nama, no HP, dst) **tidak pernah ditimpa**.
   - **Belum ada** → dibuat baru: `nama_lengkap` (dari nama Google),
     `email`, `no_hp = null`, `role = "customer"`, `provider = "google"`,
     `avatar_url` (dari foto profil Google kalau ada). `avatar_url` hanya
     diisi **sekali saat pembuatan** — login berikutnya tidak pernah
     menimpanya, sehingga kalau nanti ada fitur ganti foto profil manual,
     foto tsb aman dari tertimpa balik oleh foto Google.
5. Kalau `status === "banned"` → **login ditolak** (`403`, membawa
   `banned_reason`), user diarahkan balik ke `/login` dengan toast pesan
   error dari backend.
6. Backend set cookie `nutwear_refresh_token` (httpOnly) yang sama persis
   dengan Login Email & Password → refresh sesi (`/auth/refresh`, dipanggil
   `AuthProvider` saat reload halaman) bekerja identik untuk kedua metode.
7. `GoogleCallbackHandler` memanggil `supabaseClient.auth.signOut()` di akhir
   (baik sukses maupun gagal) — sesi Supabase di browser hanya dipakai
   sebagai **jembatan sesaat** untuk mendapatkan token, bukan sumber
   kebenaran sesi aplikasi (sumber kebenarannya tetap `authStore` + cookie
   refresh token backend, sama seperti sebelumnya).

### Penautan Akun (Email & Password ↔ Google)

Kalau sebuah email sudah pernah Register lewat Email & Password lalu user
login pakai Google dengan email yang sama: **Supabase Auth sendiri yang
otomatis menautkan identitas Google tsb ke `auth.users.id` yang sama**
("Automatic Identity Linking" — fitur bawaan Supabase Auth, aktif secara
default, syaratnya email sudah terverifikasi — di project ini selalu
terverifikasi karena `authService.register()` memakai `email_confirm: true`).
Karena penautannya terjadi di level `auth.users.id`, lookup profil kita yang
berbasis `id` otomatis menemukan baris profil lama yang sama → **tidak pernah
ada akun kedua**, role Admin tidak pernah berubah, dan seluruh data
(Wishlist, Keranjang, Riwayat Pesanan, Alamat, Review, Notifikasi, Voucher)
otomatis tetap nyambung ke akun yang sama karena `user_id`-nya tidak berubah.

### Perbedaan yang Disengaja: Banned User

Sesuai permintaan fitur ini secara eksplisit, **Login Google menolak total
akun banned** (`authService.loginWithGoogle`). Ini **berbeda** dari perilaku
Login Email & Password yang sudah ada (`authService.login`), yang masih
mengizinkan user banned login lalu baru dibatasi per-aksi lewat
`authMiddleware.blockIfBanned` (Checkout, Review, Wishlist, Keranjang).
Perbedaan ini disengaja mengikuti spesifikasi update ini — beri tahu saya
kalau ternyata Anda ingin perilakunya diseragamkan.

---

## 3. Langkah yang Perlu Anda Lakukan

### A. Google Cloud Console
1. Buat OAuth Client ID (tipe **Web application**).
2. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
   (ambil dari Supabase Dashboard → Authentication → Providers → Google,
   nilainya sudah disediakan di sana).

### B. Supabase Dashboard
1. Authentication → Providers → **Google** → aktifkan, isi **Client ID** &
   **Client Secret** dari langkah A.
2. Authentication → URL Configuration:
   - **Site URL**: sesuai `NEXT_PUBLIC_SITE_URL` (mis. domain production Anda).
   - **Redirect URLs**: tambahkan `<SITE_URL>/auth/callback` (dan versi
     `localhost:3000/auth/callback` untuk development).
3. Pastikan **Confirm email** aktif untuk provider Email (sudah demikian di
   project ini) — ini prasyarat Automatic Identity Linking di atas bekerja
   dengan aman.

### C. Environment Variable
**Tidak ada environment variable baru yang perlu ditambahkan.** Frontend
sudah punya `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`
(dipakai `supabaseClient.ts`, sebelumnya hanya untuk halaman Reset Password —
sekarang dipakai juga untuk Login Google). Backend sudah punya
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Pastikan
saja `NEXT_PUBLIC_SITE_URL` (frontend) selalu sesuai domain yang benar-benar
diakses user, karena dipakai sebagai `redirectTo` OAuth.

### D. Database
Jalankan migration baru di Supabase SQL Editor:
```
backend/src/database/migrations/20260727_add_user_google_oauth_fields.sql
```

---

## 4. Hasil Pengujian

| # | Skenario | Status |
|---|---|---|
| 1 | Tombol Login Google muncul pada halaman Login | ✅ Ditambahkan di `LoginForm.tsx`, tepat di bawah tombol "MASUK", tampilan mengikuti desain (rounded-full, palet neutral yang sama) & responsive (Tailwind, tidak ada breakpoint khusus yang dibutuhkan karena form sudah `w-full`) |
| 2 | Struktur OAuth sudah siap dihubungkan ke Supabase Auth | ✅ Memakai `supabaseClient.auth.signInWithOAuth`/`exchangeCodeForSession` (SDK resmi), tidak ada credential yang di-hardcode |
| 3 | User baru otomatis dibuat apabila belum memiliki akun | ✅ `authService.loginWithGoogle` → `userRepository.create` saat `findById` kosong |
| 4 | User lama tidak dibuatkan akun baru | ✅ Profil ditemukan lewat `findById`, dipakai apa adanya |
| 5 | Email yang sama tidak menghasilkan akun duplikat | ✅ Bergantung pada Automatic Identity Linking Supabase Auth (lihat bagian 2) + lookup berbasis `auth.users.id` yang sama |
| 6 | Role Admin tetap menjadi Admin | ✅ Profil yang sudah ada tidak pernah ditimpa field apa pun, termasuk `role` |
| 7 | User yang dibanned tetap tidak dapat login menggunakan Google | ✅ Dicek eksplisit di `authService.loginWithGoogle`, melempar `403` dengan `banned_reason` |
| 8 | Session Login Google menggunakan sistem autentikasi yang sama dengan Login Email & Password | ✅ Keduanya memverifikasi lewat `supabase.auth.getUser()` yang sama & memakai cookie `nutwear_refresh_token` yang sama |
| 9 | Wishlist, Keranjang, Review, Alamat, Riwayat Pesanan tetap satu akun | ✅ Konsekuensi langsung dari poin 5 & 8 — `user_id` di seluruh tabel tersebut tidak pernah berubah |

**Validasi kode:**
- `npx tsc --noEmit` (frontend) → **0 error**.
- `node --check` pada seluruh file backend yang diubah → **OK**, tidak ada
  syntax error.
- Tidak ada konfigurasi lint (`.eslintrc`) di project ini baik sebelum maupun
  sesudah update — `next lint`/`eslint` tidak bisa dijalankan karena memang
  belum pernah dikonfigurasi di project, bukan akibat perubahan ini.
- `next build` gagal pada tahap *static export* halaman Beranda
  (`/(shop)/page`) karena mencoba fetch ke `http://localhost:4000` yang tidak
  berjalan di sandbox pengujian ini — ini **tidak terkait** perubahan Login
  Google (tidak menyentuh halaman/route tersebut sama sekali); silakan build
  ulang di lingkungan Anda dengan backend yang aktif untuk verifikasi akhir.
