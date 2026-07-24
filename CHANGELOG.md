# CHANGELOG — Perbaikan Bug Harga Normal & Harga Promo

## Penyebab Bug

Bug ada di **satu titik**: skema validasi Zod pada form Admin Produk
(`ProductForm.tsx`), bukan di backend, database, maupun logika tampilan
website (semua bagian itu sudah menangani `NULL` dengan benar).

Field Harga Promo divalidasi dengan:

```
hargaPromo: z.union([z.coerce.number().min(0), z.literal("")]).optional()
```

Saat admin membiarkan field Harga Promo **kosong**, React Hook Form mengirim
nilai string kosong (`""`) ke Zod. Zod mencoba anggota union **secara
berurutan** dan memakai hasil pertama yang berhasil. Karena
`z.coerce.number()` mengubah `""` menjadi `Number("")`, dan `Number("")`
di JavaScript bernilai `0` (bukan `NaN`), maka validasi `min(0)` **lolos**
dengan hasil `0` — union berhenti di situ dan `z.literal("")` (opsi kedua)
tidak pernah tercapai.

Akibatnya, field yang sengaja dikosongkan Admin **berubah otomatis menjadi
angka `0`** tepat di tahap validasi form, sebelum sempat diproses lebih
lanjut oleh `onSubmit`. Nilai `0` ini kemudian:

- Tidak dianggap "kosong" oleh `onSubmit` (`values.hargaPromo === ""` →
  `false`, karena nilainya sudah jadi angka `0`), sehingga dikirim ke API
  sebagai `hargaPromo: 0`, bukan `null`.
- Disimpan Backend sebagai `harga_promo = 0` di database (backend memang
  sudah benar: hanya mengubah jadi `NULL` kalau menerima `null`/`""`, tapi
  yang diterima memang sudah `0`).
- Dibaca sebagai "promo aktif" oleh `isPromoActive()` (frontend & backend),
  karena keduanya mengecek `hargaPromo == null` — dan `0 == null` bernilai
  `false`. Maka harga normal ditampilkan dicoret dan `Rp0` muncul sebagai
  harga promo, padahal Admin tidak pernah mengisi promo sama sekali.

Semua lapisan lain (validator Express, `productService.js`,
`productRepository.js`, `utils/promo.ts`, `utils/promo.js`, `ProductCard`,
`ProductPurchasePanel`) sudah memeriksa `null`/`""` dengan benar dan tidak
diubah, karena akar masalahnya murni di pengurutan union Zod tersebut.

## Perubahan yang Dilakukan

Menukar urutan union pada field `hargaPromo` di skema Zod: `z.literal("")`
dicoba **lebih dulu** sebelum `z.coerce.number()`. Dengan urutan ini:

- Input kosong (`""`) tetap dikenali sebagai `""` (bukan dipaksa jadi
  angka), lalu diteruskan `onSubmit` menjadi `null` seperti seharusnya.
- Input angka biasa (`"250000"`) tetap divalidasi & dikonversi ke number
  seperti sebelumnya — tidak ada perubahan perilaku untuk kasus ini.
- Input angka `"0"` yang **sengaja** diketik Admin tetap valid sebagai `0`
  (sesuai requirement: kalau Admin betul-betul mengisi 0, baru boleh
  tersimpan & tampil sebagai Rp0).

Tidak ada perubahan pada backend (validator, controller, service,
repository), skema database, maupun komponen tampilan (`ProductCard`,
`ProductPurchasePanel`, `utils/promo.ts`, `utils/promo.js`) karena semuanya
sudah benar — bug murni terjadi sebelum data itu meninggalkan form.

*Catatan:* pola union yang sama (`z.union([z.coerce.number()...,
z.literal("")])`) juga dipakai di `BannerForm.tsx` untuk field
`priceBeforeDiscount`/`pricePromo`. Field tersebut milik fitur **Banner**,
bukan sistem harga produk, jadi sengaja **tidak** ikut diubah pada update
ini sesuai batasan tugas (perubahan dibatasi hanya pada sistem harga
produk).

## File yang Diubah

- `frontend/features/admin/components/ProductForm.tsx` — perbaikan urutan
  union pada skema Zod field `hargaPromo` (satu baris).

Tidak ada file baru dan tidak ada migration database yang diperlukan,
karena kolom `harga_promo` di tabel `products` memang sudah bertipe
nullable sejak awal (`migrations/20260708_add_product_promo_price_and_new_arrival.sql`)
dan seluruh kode backend sudah mendukung `NULL` dengan benar.

## Hasil Pengujian

Karena environment ini tidak menjalankan browser, alur `onSubmit` disimulasikan
langsung memakai skema Zod yang sudah diperbaiki (nilai yang sama persis
seperti yang dikirim `react-hook-form` dari input `type="number"`):

| Input di field Harga Promo | Hasil parse Zod (sebelum fix) | Hasil parse Zod (setelah fix) | Nilai dikirim ke API |
|---|---|---|---|
| kosong (`""`)              | `0` ❌ (bug)                   | `""` ✅                        | `null` ✅ |
| `"250000"`                 | `250000` ✅                    | `250000` ✅                    | `250000` ✅ |
| `"0"` (sengaja diisi 0)    | `0`                            | `0` ✅                         | `0` ✅ |
| tidak diisi (`undefined`)  | `undefined` ✅                 | `undefined` ✅                 | `null` ✅ |

Pemetaan ke 5 skenario pengujian yang diminta:

1. **Admin hanya mengisi Harga Normal** → Harga Promo kosong divalidasi
   sebagai `""` → dikirim sebagai `hargaPromo: null` → backend menyimpan
   `harga_promo = NULL` → `isPromoActive()` mengembalikan `false` →
   website hanya menampilkan Harga Normal, tidak ada Rp0. ✅
2. **Admin menambahkan Promo** (Harga Normal 300000, Harga Promo 250000)
   → tidak terpengaruh perubahan ini (jalur angka biasa tidak berubah) →
   Harga Normal tampil dicoret, Harga Promo tampil menonjol. ✅
3. **Admin menghapus Promo** (mengosongkan kembali field Harga Promo) →
   sama seperti skenario 1, field kosong divalidasi sebagai `""` → dikirim
   `null` → tersimpan `NULL` → website kembali hanya menampilkan Harga
   Normal. ✅
4. **Tidak ada lagi Harga Promo otomatis menjadi Rp0** saat field memang
   dikosongkan — ini akar bug yang diperbaiki (lihat baris "kosong" pada
   tabel di atas: `0` ❌ → `""` ✅). ✅
5. **Data harga tetap benar setelah produk diedit berkali-kali** — karena
   perbaikan ini murni di lapisan validasi form (bukan mengubah cara data
   dibaca/disimpan), field yang sudah terisi promo tetap terbaca & tersimpan
   seperti biasa pada edit berulang; field yang dikosongkan konsisten
   menjadi `null`, bukan tertukar/menumpuk jadi `0`. ✅

**Pengecekan TypeScript & Lint:**

- `npx tsc --noEmit` dijalankan untuk seluruh project frontend → **0 error**
  (termasuk pada `ProductForm.tsx` yang diubah). Tipe hasil union
  (`"" | number | undefined`) tidak berubah dari sebelumnya, hanya urutan
  pengecekan yang ditukar, sehingga tidak ada dampak ke tipe di tempat lain
  yang memakai `ProductFormValues`.
- `next lint` / ESLint tidak dapat dijalankan di environment ini karena
  project memang **belum memiliki file konfigurasi ESLint** sama sekali
  (`.eslintrc*` / `eslint.config.*` tidak ditemukan) — kondisi ini sudah ada
  sebelum perubahan ini dan tidak disebabkan oleh update ini. Perubahan yang
  dilakukan hanya menukar urutan dua anggota union Zod (satu baris), tanpa
  menambah sintaks atau pola baru, sehingga tidak berisiko menimbulkan
  masalah lint di luar apa yang sudah ada di project.
