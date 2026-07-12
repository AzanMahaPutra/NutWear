# CHANGELOG

## Konfigurasi Cloudflare Tunnel untuk Notification/Webhook Midtrans (Development)

### Ringkasan Perubahan

Tujuan: backend Express (`http://localhost:4000`) bisa menerima Notification/Webhook
dari server Midtrans Sandbox saat masih development lokal, tanpa hosting, menggunakan
Cloudflare Tunnel.

File yang diubah:

- `backend/.env`
  Menambahkan dua variabel baru:
  - `BACKEND_PUBLIC_URL` — URL publik backend saat ini (isi dengan URL Cloudflare Tunnel
    saat menguji webhook). Hanya dipakai untuk menampilkan URL Webhook yang benar di log
    saat server start, jadi kamu tidak perlu menghitung sendiri.
  - `TRUST_PROXY` — set `1` saat backend diakses lewat Cloudflare Tunnel (atau reverse
    proxy/tunnel lain) supaya Express membaca header `X-Forwarded-*` dengan benar.

- `backend/src/config/env.js`
  Membaca `BACKEND_PUBLIC_URL` dan `TRUST_PROXY` dari environment variable, serta
  mendukung `FRONTEND_URL` berisi lebih dari satu origin (dipisah koma) untuk CORS.

- `backend/src/app.js`
  - Menambahkan `app.set("trust proxy", 1)` (aktif jika `TRUST_PROXY=1`). Tanpa ini,
    `express-rate-limit` akan melempar error `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` begitu
    request lewat Cloudflare Tunnel membawa header `X-Forwarded-For`.
  - CORS sekarang membaca daftar origin dari `FRONTEND_URL` (mendukung multi-origin).

- `backend/src/server.js`
  Menampilkan URL Webhook Midtrans yang benar (dari `BACKEND_PUBLIC_URL`) di log saat
  server start, plus peringatan jika `BACKEND_PUBLIC_URL` masih mengarah ke `localhost`.

**Tidak ada perubahan** pada logika bisnis Midtrans (`utils/midtrans.js`,
`services/paymentService.js`, `controllers/paymentController.js`, `routes/paymentRoutes.js`):
kode-kode ini sudah tidak hardcode `localhost` — endpoint webhook
(`POST /api/v1/payments/midtrans/webhook`) menerima request apa adanya dari domain mana
pun yang mengarah ke proses Express yang sama, termasuk lewat Cloudflare Tunnel, dan
keamanannya sudah berdasarkan verifikasi `signature_key`, bukan origin/host. Redirect
`callbacks.finish` Snap tetap memakai `FRONTEND_URL` (frontend tetap dijalankan secara
lokal seperti biasa, tidak perlu ikut ditunnel).

---

### Cara Menjalankan Cloudflare Tunnel

#### 1. Install Cloudflared

- **Windows**: download installer dari
  https://github.com/cloudflare/cloudflared/releases (`cloudflared-windows-amd64.msi`).
- **macOS**: `brew install cloudflared`
- **Linux (Debian/Ubuntu)**:
  ```bash
  curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
  sudo dpkg -i cloudflared.deb
  ```

Verifikasi instalasi:

```bash
cloudflared --version
```

#### 2. Menjalankan Tunnel

Jalankan backend seperti biasa terlebih dahulu (`npm run dev` di folder `backend`, tetap
di port `4000`). Setelah backend aktif, di terminal terpisah jalankan:

```bash
cloudflared tunnel --url http://localhost:4000
```

Ini adalah **Quick Tunnel** (tidak perlu login/akun Cloudflare, cocok untuk testing
sandbox). URL yang dihasilkan acak dan berubah setiap kali `cloudflared` dijalankan
ulang — itu normal untuk mode ini.

#### 3. Mendapatkan URL Public

Cloudflared akan menampilkan log seperti:

```
Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):
https://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.trycloudflare.com
```

Salin URL `https://xxxxxxxx.trycloudflare.com` tersebut — ini yang akan dipakai di
langkah berikutnya.

#### 4. Mengubah Environment Variable

Buka `backend/.env`, isi `BACKEND_PUBLIC_URL` dengan URL Cloudflare Tunnel yang didapat:

```
BACKEND_PUBLIC_URL=https://xxxxxxxx.trycloudflare.com
TRUST_PROXY=1
```

#### 5. Mengatur Notification URL pada Dashboard Midtrans Sandbox

1. Login ke https://dashboard.sandbox.midtrans.com
2. Buka **Settings > Configuration**.
3. Isi **Payment Notification URL** dengan:
   ```
   https://xxxxxxxx.trycloudflare.com/api/v1/payments/midtrans/webhook
   ```
   (ganti `xxxxxxxx.trycloudflare.com` dengan domain tunnel kamu sendiri — lihat juga
   log server pada langkah 6 di bawah, backend menampilkan URL ini secara otomatis).
4. Simpan (**Save/Update**).

Finish Redirect URL tidak perlu diubah — itu tetap dikirim per-transaksi ke Snap lewat
`FRONTEND_URL` (biarkan mengarah ke `http://localhost:3000`, tidak perlu ikut ditunnel).

#### 6. Restart Backend

Setelah mengubah `.env`, restart proses backend (`npm run dev`) supaya environment
variable baru terbaca. Perhatikan log saat start, backend akan menampilkan:

```
Midtrans Webhook URL: https://xxxxxxxx.trycloudflare.com/api/v1/payments/midtrans/webhook
```

Cocokkan URL ini dengan yang sudah diisi di Midtrans Dashboard pada langkah 5.

#### 7. Cara Menguji Apakah Webhook Berhasil Diterima

1. Lakukan checkout & pembayaran seperti biasa lewat frontend (`http://localhost:3000`,
   tetap jalan lokal seperti biasa) menggunakan simulator Sandbox Midtrans (VA/QRIS/dst).
2. Perhatikan log terminal backend — begitu Midtrans mengirim notifikasi, akan muncul
   baris log berawalan `[midtrans:webhook]`, contoh:
   ```
   [midtrans:webhook] request masuk ke POST /payments/midtrans/webhook
   [midtrans:webhook] hasil verifikasi signature { valid: true }
   [midtrans:webhook] status order berhasil diperbarui
   ```
3. Cek juga terminal `cloudflared` — setiap request yang masuk akan tercatat di sana
   (menandakan request dari Midtrans benar-benar sampai ke tunnel).
4. Refresh halaman **Riwayat Pesanan** di frontend — status pesanan harus berubah
   otomatis (mis. menjadi "Sudah Dibayar") tanpa perlu refresh manual status di backend.
5. Jika baris log `[midtrans:webhook]` **tidak pernah muncul** sama sekali:
   - Pastikan Notification URL di Midtrans Dashboard sudah benar dan memakai `https://`
     domain tunnel (bukan `localhost`).
   - Pastikan `cloudflared` masih berjalan (tunnel quick akan mati kalau terminalnya
     ditutup) dan backend masih berjalan di port `4000`.
   - Coba tes manual dengan `curl` dari luar jaringan lokal ke
     `https://xxxxxxxx.trycloudflare.com/api/v1/health` — harus mengembalikan
     `{"success":true,...}`.

### Setelah Update — Ringkasan Langkah Sehari-hari

1. Jalankan Frontend (`npm run dev` di folder `frontend`).
2. Jalankan Backend (`npm run dev` di folder `backend`).
3. Jalankan Cloudflare Tunnel: `cloudflared tunnel --url http://localhost:4000`.
4. Salin URL tunnel, isi ke `BACKEND_PUBLIC_URL` di `backend/.env`, set `TRUST_PROXY=1`,
   lalu restart backend.
5. Isi Notification URL di Midtrans Sandbox Dashboard dengan
   `<URL_TUNNEL>/api/v1/payments/midtrans/webhook`.
6. Uji pembayaran — Notification/Webhook otomatis memperbarui status pesanan.

> Catatan: setiap kali `cloudflared` di-restart tanpa akun Cloudflare (Quick Tunnel),
> URL publiknya akan **berubah**. Itu berarti langkah 4 dan 5 di atas perlu diulang
> dengan URL yang baru.
