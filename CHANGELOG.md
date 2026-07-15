# CHANGELOG — Perbaikan Fitur Produk Agar Berlaku Per Produk

## 1. Audit yang Dilakukan

Sebelum melakukan perubahan apa pun, saya menelusuri seluruh alur data Fitur
Produk dari database sampai ke tampilan:

- **Database** (`product_features`): setiap baris fitur sudah memiliki kolom
  `product_id` dengan foreign key ke `products(id)` (lihat
  `backend/src/database/migrations/20260711_add_product_features.sql`). Relasi
  ini sudah benar — satu baris fitur hanya bisa menunjuk ke satu produk.
- **Backend** (`productRepository.js`, `productService.js`,
  `productController.js`, `productRoutes.js`): seluruh query
  tambah/ambil/edit/hapus fitur sudah difilter berdasarkan `product_id` atau
  `featureId` yang eksak, tidak ada query yang mengambil seluruh baris
  `product_features` tanpa filter.
- **Frontend Admin** (`ProductFeatureManager.tsx`, `ProductForm.tsx`,
  `ProductManagementView.tsx`) dan **Frontend Detail Produk**
  (`ProductDescription.tsx`): data fitur yang ditampilkan berasal dari
  `product.features` milik produk yang sedang dibuka, bukan dari sumber
  global.

Jadi secara struktur data, backend sudah menyimpan Fitur Produk secara
terpisah per produk. **Penyebab bug ada di sisi React (frontend), bukan di
database maupun API.**

## 2. Penyebab Bug

`ProductFeatureManager` menyimpan daftar fiturnya sendiri lewat
`useState(initialFeatures)`, dan `ProductForm` menyimpan produk yang sedang
dikelola lewat `useState(initialData)`. Kedua `useState` ini **hanya
dijalankan sekali saat komponen pertama kali dipasang (mount)** — bukan setiap
kali prop `productId` / `initialData` berubah.

Sebelumnya, `<ProductForm>` di `ProductManagementView.tsx` dan
`<ProductFeatureManager>` di `ProductForm.tsx` dirender **tanpa prop `key`**.
Tanpa `key` yang mengikat instance komponen ke produk yang sedang diedit,
React berpotensi memakai ulang instance komponen yang sama (beserta seluruh
state lokalnya) ketika Admin berpindah dari mengedit satu produk ke produk
lain — sehingga daftar Fitur Produk dari produk sebelumnya masih terbawa dan
ikut tampil/tersimpan seolah-olah milik produk yang baru dibuka. Ini adalah
penyebab paling umum dari bug "data satu item bocor ke item lain" pada
aplikasi React, dan cocok dengan gejala yang dilaporkan.

## 3. Perubahan yang Dilakukan

Menambahkan `key` eksplisit yang diikat ke ID produk pada dua titik render,
supaya React **selalu membuat instance komponen baru** (state lokal selalu
bersih) setiap kali produk yang dikelola berbeda:

- `frontend/features/admin/components/ProductManagementView.tsx`
  → `<ProductForm key={editingProduct?.id ?? "new-product"} .../>`
- `frontend/features/admin/components/ProductForm.tsx`
  → `<ProductFeatureManager key={savedProduct.id} .../>`

Tidak ada logika lain yang diubah. Tidak ada perubahan pada komponen,
service, atau struktur folder lain.

## 4. Penyesuaian Struktur Database

**Tidak ada.** Struktur tabel `product_features` (kolom `product_id` +
foreign key ke `products`) sudah benar dan tidak perlu migration baru.

## 5. File yang Diubah

- `frontend/features/admin/components/ProductManagementView.tsx`
- `frontend/features/admin/components/ProductForm.tsx`

## 6. Hasil Pengujian (ditelusuri lewat kode, per skenario)

1. **Admin menambahkan 4 fitur pada Produk A** → `ProductFeatureManager`
   dipasang dengan `key`/`productId` = ID Produk A; `addFeature` mengirim
   `POST /products/{Produk A}/features`; keempat fitur tersimpan dengan
   `product_id` = Produk A dan hanya tampil di Produk A. ✅
2. **Admin membuka Produk B (belum punya fitur)** → Modal Edit Produk
   di-remount dengan `key` = ID Produk B, sehingga `ProductFeatureManager`
   dipasang ulang dengan `initialFeatures` dari data Produk B (`[]`), bukan
   sisa state Produk A. Produk B tampil kosong. ✅
3. **Admin menambah 2 fitur pada Produk B** → tersimpan dengan `product_id`
   = Produk B saja; Produk A tetap memiliki 4 fitur miliknya (data di
   database tidak tersentuh). ✅
4. **Admin mengedit salah satu fitur Produk A** → `PUT
   /products/features/{featureId}` hanya meng-update baris dengan id
   tersebut (`product_id` tidak berubah); Produk B tidak terpengaruh. ✅
5. **Admin menghapus fitur Produk C** → `DELETE
   /products/features/{featureId}` hanya menghapus baris tersebut; fitur
   Produk lain tetap utuh. ✅

## Catatan

Karena bug ini bersifat state di sisi client (bukan data yang salah di
database), tidak ada data lama yang perlu diperbaiki/dimigrasikan. Disarankan
Admin melakukan hard refresh (Ctrl+Shift+R) setelah update ini di-deploy agar
build frontend terbaru yang dimuat.
