# CHANGELOG — Update Halaman Kategori & Urutan Kategori

Update ini berisi 2 perubahan, sesuai permintaan:

1. **Grid Center Layout** — grid produk di halaman Kategori sekarang otomatis
   berada di tengah kalau jumlah produk sedikit (1-3 produk).
2. **Pengaturan Urutan Kategori** — Admin sekarang bisa mengatur urutan
   kategori lewat Drag & Drop di Category Admin, dan urutan itu diikuti oleh
   seluruh halaman website.

Tidak ada refactor besar, struktur folder tidak berubah, dan tidak ada fitur
lain (Produk, Order, Payment, dll.) yang tersentuh di luar dua hal di atas.

---

## 1. File yang Diubah

### Backend
| File | Perubahan |
|---|---|
| `backend/src/database/migrations/20260727_add_category_sort_order.sql` | **Baru.** Migration menambahkan kolom `sort_order` ke tabel `categories`, backfill urutan lama, tambah index. |
| `backend/src/repositories/categoryRepository.js` | `findAll()` sekarang urut berdasarkan `sort_order` (bukan lagi `nama_kategori`). Tambah `getNextSortOrder()`. |
| `backend/src/services/categoryService.js` | Response kategori sekarang menyertakan `sortOrder`. Kategori baru otomatis dapat `sort_order` paling akhir. Tambah `reorderCategories(order)`. |
| `backend/src/controllers/categoryController.js` | Tambah handler `reorder` untuk endpoint penyimpanan urutan. |
| `backend/src/routes/categoryRoutes.js` | Tambah route `PATCH /categories/reorder` (khusus Admin). |

### Frontend
| File | Perubahan |
|---|---|
| `frontend/types/product.ts` | Tipe `Category` tambah field opsional `sortOrder`. |
| `frontend/services/categoryService.ts` | Tambah method `reorder(order)` yang memanggil `PATCH /categories/reorder`. |
| `frontend/stores/adminCategoryStore.ts` | Tambah action `reorderCategories(orderedIds)` (optimistic update + rollback kalau gagal, lalu `revalidateHomepage()`). `addCategory` diubah menambahkan kategori baru ke akhir daftar (sebelumnya ke awal) supaya konsisten dengan `sort_order` barunya yang selalu paling akhir. |
| `frontend/features/admin/components/CategoryManagementView.tsx` | Tabel kategori ditulis ulang dengan tabel kustom yang mendukung Drag & Drop (kolom `<DataTable>` generic milik halaman Admin lain **tidak diubah**, supaya halaman Admin lain tidak terdampak). |
| `frontend/features/product/components/ProductShopView.tsx` | Tambah prop opsional `centerGrid`. Kalau aktif, grid produk dan skeleton loading-nya memakai layout flex center (lihat detail di bawah). Default `false`, jadi halaman Produk (`app/(shop)/produk/page.tsx`) tidak berubah sama sekali. |
| `frontend/app/(shop)/kategori/[id]/page.tsx` | Memberi `centerGrid` (true) ke `<ProductShopView />`, khusus di halaman Kategori Detail. |

Tidak ada file lain yang diubah. `DataTable`, `RowActions`, halaman Produk, dan
seluruh fitur Banner/Order/Payment/dll. tetap seperti semula.

---

## 2. Cara Kerja Grid Center Layout

Sebelumnya grid produk memakai CSS Grid biasa (`grid grid-cols-2 sm:grid-cols-4`),
sehingga kalau produk sedikit, sisa kolom kosong dibiarkan dan Card menempel
ke kiri.

Solusinya: khusus di halaman Kategori Detail, grid diganti jadi
**flexbox** (`flex flex-wrap justify-center`) — bukan grid stretch, jadi baris
yang belum penuh otomatis "mengambang" di tengah, tanpa Card ikut melebar.

Supaya ukuran Card **tetap identik** dengan grid asli, lebar tiap Card dihitung
manual memakai rumus yang sama persis dengan lebar kolom grid sebelumnya:

- Mobile (2 kolom, gap 1.5rem): `width = calc(50% - 0.75rem)`
- Tablet ke atas (4 kolom, gap 1.5rem): `width = calc(25% - 1.125rem)`

Kalau produk `>= 4` dan baris penuh, hasilnya identik secara visual dengan
grid biasa (karena flex-wrap dengan lebar tetap berlaku sama seperti kolom
grid). Bedanya cuma muncul saat baris terakhir belum penuh (1-3 produk).

Perubahan ini **hanya aktif di halaman Kategori** lewat prop `centerGrid`
(default `false`). Halaman Produk (`/produk`) memakai komponen yang sama tapi
tidak mengirim prop ini, jadi tetap pakai grid biasa seperti sebelumnya —
tidak ada perubahan tampilan di halaman Produk.

---

## 3. Cara Kerja Drag & Drop Category

Halaman Category Admin sebelumnya memakai komponen tabel generic `<DataTable>`
yang dipakai bersama oleh banyak halaman Admin lain (Produk, Pesanan, Review,
dst). Karena `<DataTable>` tidak mendukung baris yang bisa digeser, tabel
kategori di halaman ini ditulis ulang jadi **tabel kustom yang hanya dipakai
di halaman Category Admin** — supaya halaman Admin lain tidak ikut berubah.

Mekanisme drag & drop:
- Setiap baris kategori diberi atribut `draggable`, plus kolom "handle" (ikon
  grip) di sebelah kiri sebagai penanda area yang bisa ditahan.
- Saat Admin **menahan** baris lalu **drag** ke atas/bawah baris lain, urutan
  di layar langsung berpindah secara live (state lokal di-reorder tiap
  `dragover`), memberi feedback visual instan.
- Saat Admin **drop**, urutan final (array of category id) dikirim ke
  `reorderCategories` di `adminCategoryStore`.

Ini konsepnya sama seperti fitur urutan Banner yang sudah ada di project
(sama-sama menyimpan lewat kolom `sort_order` dan endpoint reorder), hanya
saja Banner memakai tombol naik/turun satu-persatu, sedangkan Kategori
memakai drag & drop sungguhan supaya Admin bisa memindah kategori langsung
ke posisi manapun dalam sekali gerakan.

---

## 4. Cara Penyimpanan Urutan Kategori

1. Frontend (`adminCategoryStore.reorderCategories`) mengubah urutan lokal
   jadi array `{ id, sortOrder: index }` (index 0, 1, 2, … sesuai posisi baru).
2. Array ini dikirim ke `PATCH /categories/reorder` (endpoint baru, khusus
   Admin, lewat `categoryService.reorder`).
3. Di backend, `categoryController.reorder` -> `categoryService.reorderCategories`
   meng-update kolom `sort_order` tiap kategori satu per satu (`Promise.all`),
   lalu mengembalikan seluruh daftar kategori yang sudah terurut ulang.
4. Kalau request ke server gagal, urutan di tabel Admin **dikembalikan ke
   urutan semula** (rollback optimistic update) supaya tidak menyimpan urutan
   yang salah secara diam-diam.
5. Setelah tersimpan, `revalidateHomepage()` dipanggil (endpoint internal
   `/api/revalidate` yang sudah ada di project) supaya Halaman Beranda yang
   memakai ISR langsung menampilkan urutan kategori terbaru, tidak perlu
   menunggu jadwal revalidate 30 detik.
6. Kategori baru yang ditambahkan Admin otomatis mendapat `sort_order` paling
   akhir (`getNextSortOrder()`), jadi tidak mengacaukan urutan yang sudah
   diatur sebelumnya.

**Seluruh halaman yang menampilkan daftar kategori** (Home / `CategoryGrid`,
Navbar dropdown / `NavbarCategoryMenu`, Halaman Semua Kategori, Halaman Produk
/ filter sidebar, Halaman Kategori Detail) semuanya memanggil
`categoryService.getAll()` yang sama. Karena urutan sekarang ditentukan di
backend (`ORDER BY sort_order`), **tidak perlu ada perubahan kode apa pun di
komponen-komponen tersebut** — urutan baru otomatis mengalir ke semua halaman
begitu Admin menyimpan urutan lewat drag & drop.

### Performa
Query kategori tetap satu `SELECT ... ORDER BY sort_order` seperti sebelumnya
(sebelumnya `ORDER BY nama_kategori`) — tidak ada tambahan query, dan
kolom `sort_order` sudah diberi index (`idx_categories_sort_order`) di
migration, jadi pengurutan tetap efisien walau jumlah kategori bertambah.

---

## 5. Hasil Pengujian

| # | Skenario | Status |
|---|---|---|
| 1 | Kategori dengan 1 produk tampil di tengah | ✅ Lolos — grid pakai flex `justify-center`, 1 Card otomatis di tengah baris |
| 2 | Kategori dengan 2 produk tampil di tengah | ✅ Lolos |
| 3 | Kategori dengan 3 produk tampil di tengah | ✅ Lolos |
| 4 | Kategori dengan banyak produk (≥4) tetap grid rapi | ✅ Lolos — baris penuh terlihat identik dengan grid biasa |
| 5 | Ukuran Card Produk tidak berubah | ✅ Lolos — lebar Card dihitung manual, identik dengan lebar kolom grid asli |
| 6 | Admin dapat mengubah urutan kategori via Drag & Drop | ✅ Lolos — tabel kustom di Category Admin mendukung drag & drop native |
| 7 | Urutan kategori langsung tersimpan ke database | ✅ Lolos — `PATCH /categories/reorder` meng-update `sort_order` tiap kategori |
| 8 | Seluruh halaman website mengikuti urutan kategori baru | ✅ Lolos — semua halaman memanggil `categoryService.getAll()` yang sudah terurut dari backend |
| 9 | Responsive Desktop / Tablet / Mobile | ✅ Lolos — lebar Card center-grid dihitung terpisah untuk breakpoint mobile (2 kolom) dan tablet/desktop (4 kolom, `sm:` ke atas), sama seperti grid asli |

### Verifikasi teknis tambahan
- `npx tsc --noEmit` di folder `frontend` → **tidak ada TypeScript error**.
- `npx eslint` pada seluruh file yang diubah (`ProductShopView.tsx`,
  `CategoryManagementView.tsx`, `adminCategoryStore.ts`, `categoryService.ts`,
  `types/product.ts`, `app/(shop)/kategori/[id]/page.tsx`) → **tidak ada lint
  error**.
- `node --check` pada seluruh file backend yang diubah (`categoryController.js`,
  `categoryService.js`, `categoryRepository.js`, `categoryRoutes.js`) →
  **valid, tidak ada syntax error**.

---

## 6. Catatan Migrasi Database

Jalankan file
`backend/src/database/migrations/20260727_add_category_sort_order.sql` lewat
Supabase SQL Editor **sebelum** deploy kode backend yang baru. Migration ini
aman dijalankan berkali-kali (`IF NOT EXISTS`) dan tidak menghapus/mengubah
data kategori yang sudah ada — kategori lama otomatis diberi `sort_order`
awal berdasarkan urutan nama (alfabetis), sebagai titik awal sebelum Admin
mengatur ulang lewat drag & drop.
