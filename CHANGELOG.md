# UPDATE 1 — Perbaikan Bug Input Harga pada Halaman Banner Admin

## 1. Penyebab Bug

Ditemukan **dua akar masalah** yang saling berkaitan, tersebar di tiga titik pada
alur Form Banner → Request API → Tampilan Frontend (backend tidak diubah sama
sekali):

### a. Field "Harga Promo" diam-diam berubah jadi 0 saat dikosongkan

Skema validasi form (`BannerForm.tsx`) menandai `pricePromo` sebagai **wajib
diisi**, memakai `z.coerce.number()`. Kuirk JavaScript membuat `Number("")`
menghasilkan `0` (bukan error) — jadi kalau Admin membiarkan "Harga Promo"
kosong, validasi tidak menolak, dan nilai `0` yang tidak sengaja itu ikut
tersimpan ke database sebagai harga promo yang valid.

### b. Komponen banner selalu menonjolkan `pricePromo`, bukan `priceNormal`

`PromoBanner.tsx` (komponen yang menampilkan banner di Beranda) selalu
menampilkan `pricePromo.value` sebagai harga utama yang tebal, apa pun
kondisinya. Begitu `pricePromo` tersimpan sebagai `0` (akibat poin a), harga
yang tampil ke pembeli otomatis "Rp0" — padahal `priceNormal` di database
sudah benar terisi (mis. 677000), hanya saja tidak pernah dipakai untuk
ditampilkan pada kondisi ini.

### c. Bug turunan yang ikut ditemukan saat pengecekan menyeluruh

Saat menyusuri alur "Proses Update" sesuai instruksi, ditemukan bug terkait di
`bannerService.ts` (frontend): fungsi `toFormData()` **membuang total** field
apa pun yang bernilai `null` sebelum dikirim ke backend. Ini berarti kalau
Admin mengedit banner dan mengosongkan "Harga Sebelum Diskon" yang sebelumnya
terisi (bermaksud menghapusnya), field itu tidak pernah terkirim ke API sama
sekali — backend tidak tahu field itu harus di-null-kan, sehingga nilai lama
tetap tersimpan di database walau tampak sudah dihapus di form.

## 2. Perubahan yang Dilakukan

Seluruh perubahan hanya di frontend. Backend, struktur database, dan folder
project **tidak diubah** (sesuai aturan pengerjaan).

1. **`priceNormal` dibuat benar-benar wajib** — sebelumnya input kosong bisa
   lolos jadi `0` tanpa peringatan. Sekarang input kosong ditolak validasi
   dengan pesan "Harga normal wajib diisi", jadi `0` hanya bisa tersimpan
   kalau Admin memang mengetik `0`.
2. **`pricePromo` dijadikan benar-benar opsional** (sebelumnya wajib secara
   kode, padahal labelnya tidak menyebut "Opsional"). Kalau dikosongkan saat
   submit, nilainya otomatis diisi sama dengan `priceNormal` — bukan `0` —
   supaya kompatibel dengan backend yang masih mewajibkan field ini terisi
   saat create, tanpa perlu mengubah validator/database backend.
3. **Label & teks bantuan form diperbarui**: "Harga Promo" → "Harga Promo
   (Opsional)", dengan catatan bahwa mengosongkannya berarti banner akan
   menjual di Harga Normal.
4. **Logika tampilan harga di `PromoBanner.tsx` dibuat defensif**: promo hanya
   dianggap aktif kalau `pricePromo` adalah angka positif dan berbeda dari
   `priceNormal`. Kalau tidak, banner otomatis menampilkan `priceNormal`
   sebagai harga tunggal. Ini juga **otomatis memperbaiki tampilan banner
   lama** yang sempat tersimpan dengan `pricePromo = 0` akibat bug — tanpa
   perlu migrasi data manual.
5. **Form edit "menyembuhkan" data lama secara otomatis**: kalau banner yang
   dibuka untuk diedit memiliki `pricePromo` bernilai `0` (bekas bug), field
   "Harga Promo" ditampilkan kosong di form (bukan "0"), konsisten dengan
   makna baru "kosong = tidak ada promo". Begitu Admin menyimpan ulang
   (meski tanpa mengubah apa pun), data lama otomatis terkoreksi.
6. **Perbaikan `toFormData()` di `bannerService.ts`**: nilai `null` (dipakai
   untuk menandai "kosongkan field ini") sekarang dikirim sebagai string
   kosong `""` ke backend, bukan dibuang begitu saja. Backend
   (`buildFieldsFromPayload` di `bannerService.js`, tidak diubah) sudah lama
   bisa menangani `""` sebagai instruksi "set kolom ini ke NULL" — jadi
   perbaikan ini murni di sisi pengiriman data, tidak menyentuh backend.

## 3. File yang Diubah

| File | Jenis Perubahan |
|---|---|
| `frontend/features/admin/components/BannerForm.tsx` | Validasi `priceNormal` & `pricePromo`, default form saat edit, label & teks bantuan |
| `frontend/features/home/components/PromoBanner.tsx` | Logika tampilan harga dibuat defensif (fallback ke Harga Normal) |
| `frontend/services/bannerService.ts` | Perbaikan `toFormData()` agar nilai "kosongkan field" (`null`) benar-benar terkirim ke backend |

Tidak ada file backend, migration database, maupun struktur folder yang diubah.

## 4. Hasil Pengujian Skenario

Pengujian dilakukan dengan pembacaan-ulang alur kode secara menyeluruh
(form → validasi → request API → controller/service backend → database →
response → tampilan frontend) dan verifikasi sintaks (`tsc --noEmit`) pada
setiap file yang diubah. Tidak ditemukan error TypeScript maupun error
sintaks pada ketiga file.

| # | Skenario | Hasil |
|---|---|---|
| 1 | Admin hanya mengisi Harga Normal (677000), simpan banner baru | ✅ `pricePromo` otomatis diisi = `priceNormal` di balik layar; `PromoBanner` menampilkan **Rp677.000**, bukan Rp0 |
| 2 | Admin mengisi Harga Promo dan Harga Sebelum Diskon | ✅ Banner menampilkan Harga Promo (tebal) + Harga Sebelum Diskon (strikethrough), seperti konsep sebelumnya |
| 3 | Admin mengedit banner yang sudah tersimpan | ✅ Seluruh field harga terisi sesuai data di database; banner dengan `pricePromo = 0` bekas bug lama otomatis tampil kosong di form (siap disembuhkan saat disimpan ulang) |
| 4 | Admin membuat banner baru tanpa promo | ✅ Harga Normal tampil benar; tidak ada lagi kondisi Rp0 |
| 5 | Admin mengosongkan Harga Sebelum Diskon yang sebelumnya terisi, lalu simpan (update) | ✅ Field sekarang benar-benar terhapus di database (sebelumnya nilai lama tidak pernah terhapus karena dibuang oleh `toFormData`) |
| 6 | Admin sengaja mengetik `0` di Harga Normal atau Harga Promo | ✅ Nilai `0` tetap tersimpan apa adanya (dianggap input sengaja, bukan bug) |

## 5. Catatan untuk Deploy

- Cukup replace 3 file di atas pada repo frontend, lalu deploy ulang di Vercel.
- Tidak perlu redeploy backend di Railway (tidak ada perubahan backend).
- Tidak perlu migration database.
- Banner lama yang sempat menampilkan harga Rp0 akan otomatis tampil benar
  begitu deploy selesai (karena perbaikan di `PromoBanner.tsx` bersifat
  langsung, tanpa perlu edit ulang data). Mengedit & menyimpan ulang banner
  tersebut di Admin bersifat opsional, hanya untuk merapikan data di database.
