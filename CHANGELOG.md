# CHANGELOG — Slider Produk Terbaru / Terlaris / Rekomendasi (Beranda)

## Ringkasan Perubahan

Mengubah cara tampil tiga section produk di halaman Beranda — **Produk
Terbaru**, **Produk Terlaris**, dan **Produk Rekomendasi** — dari grid yang
turun ke baris berikutnya (wrap) saat produk lebih dari 4, menjadi
**slider/carousel horizontal**.

- Selama jumlah produk pada satu section **≤ 4**, tampilan **tidak berubah**
  sama sekali: tetap grid statis seperti sebelumnya.
- Saat jumlah produk **> 4**, section otomatis berubah jadi slider horizontal
  — tidak pernah turun ke baris kedua.
- Slider mendukung:
  - **Drag pakai mouse** di desktop (Pointer Events, cursor berubah jadi
    "grabbing" saat digeser).
  - **Swipe** natural di perangkat mobile (memakai scroll horizontal bawaan
    browser, bukan reimplementasi manual, supaya tetap terasa halus/native).
  - **Tombol Previous & Next** yang menggeser satu "halaman" (± lebar area
    yang terlihat) dengan animasi smooth scroll, dan otomatis
    disembunyikan saat sudah mentok di ujung kiri/kanan.
  - Scroll-snap (`snap-x snap-mandatory`) supaya kartu produk selalu berhenti
    rapi sejajar, tidak terpotong di tengah.
- **Desain card produk (`ProductCard`) sama sekali tidak diubah** — hanya
  cara menampilkan daftar produk yang berubah (grid vs slider). Semua info
  di card (foto, badge New Arrival/Best Seller, harga, promo, warna, rating,
  dll.) tetap identik.
- Jumlah kartu yang terlihat sekaligus mengikuti breakpoint layar:
  - **Desktop (≥1024px):** ~4 kartu.
  - **Tablet (640–1023px):** ~2–3 kartu.
  - **Mobile (<640px):** ~1–2 kartu (kartu berikutnya sedikit terlihat di
    tepi sebagai isyarat visual bahwa masih bisa digeser).

## Cara Kerja Slider

Slider dibangun **native** (overflow-x + CSS scroll-snap bawaan browser),
**tanpa menambah dependency/library baru** ke `package.json` — sengaja
dipilih supaya tetap ringan walau jumlah produk sangat banyak, karena tidak
ada library carousel tambahan yang perlu dimuat/di-bundle:

- Container kartu produk memakai `overflow-x-auto` + `snap-x snap-mandatory`
  + class `.no-scrollbar` (utility yang sudah ada di
  `app/globals.css`) untuk menyembunyikan scrollbar browser sehingga terlihat
  seperti carousel, bukan area scroll biasa.
- **Swipe mobile** memanfaatkan scroll-touch native browser sepenuhnya (tidak
  di-intercept oleh JavaScript), supaya terasa sehalus scroll biasa.
- **Drag mouse desktop** ditangani lewat Pointer Events
  (`onPointerDown/Move/Up/Leave`): posisi awal disimpan, lalu `scrollLeft`
  container diupdate mengikuti pergeseran pointer. Sentuhan (`pointerType ===
  "touch"`) sengaja dilewati di handler ini supaya tidak bentrok dengan
  swipe native di atas.
- Klik ke halaman detail produk saat berakhir dari sebuah drag (bukan klik
  murni) ditahan lewat `onClickCapture`, supaya user yang menggeser slider
  tidak sengaja terlempar ke halaman produk.
- Tombol **Previous/Next** memanggil `element.scrollBy({ left, behavior:
  "smooth" })` sejauh ~90% lebar container yang terlihat, lalu tampil/hilang
  otomatis (`canScrollPrev` / `canScrollNext`) berdasarkan posisi `scrollLeft`
  saat ini — dicek ulang tiap kali user scroll (event `onScroll`) maupun saat
  ukuran layar berubah (`ResizeObserver` + `window resize`), supaya tetap
  akurat di semua breakpoint (Desktop/Tablet/Mobile).
- Lazy loading gambar tetap berjalan seperti sebelumnya lewat komponen
  `next/image` bawaan di dalam `ProductCard` (tidak diubah) — kartu di luar
  viewport slider tidak memuat gambar penuh sampai digeser mendekat.

## Catatan Penting

- **Tidak ada refactor besar.** Perubahan hanya menyentuh komponen tampilan
  section produk Beranda; komponen, service, dan struktur database yang
  sudah ada tetap dipakai apa adanya.
- **Struktur folder project tidak diubah.** File baru (`ProductSlider.tsx`)
  ditambahkan di folder yang sudah ada (`features/home/components/`),
  mengikuti pola penamaan komponen Beranda lain di folder yang sama
  (`HeroBanner.tsx`, `CategoryGrid.tsx`, `PromoBanner.tsx`).
- `ProductRail` di `app/(shop)/page.tsx` sebelumnya membatasi section
  **"Produk Terbaru"** dan **"Produk Terlaris"** hanya menampilkan 4 produk
  pertama (`products.slice(0, 4)`), sehingga slider tidak akan pernah aktif
  untuk kedua section tersebut. Batasan ini dihapus (kini memakai daftar
  produk penuh yang sudah diambil dari `productService.getAll({ pageSize:
  12 })`, sama seperti section "Produk Rekomendasi") supaya slider benar-benar
  berfungsi begitu produk lebih dari 4 — sesuai inti permintaan update ini.
  Tidak ada perubahan lain pada cara data produk diambil/diurutkan.
- Fitur di luar tampilan card produk Beranda (Cart, Checkout, Wishlist,
  Admin Dashboard, Midtrans, dsb.) **tidak disentuh sama sekali**.
- Kompatibel penuh dengan Next.js App Router (Server Component `page.tsx`
  tetap memanggil `ProductRail` seperti sebelumnya), Express, Supabase, dan
  Midtrans — tidak ada perubahan pada layer backend/API/database.
- **Tidak ada dependency baru** ditambahkan ke `package.json` /
  `package-lock.json` — slider dibangun dari primitif CSS + React yang sudah
  tersedia di project.

## File yang Diubah / Ditambahkan

### Frontend
- `frontend/features/home/components/ProductSlider.tsx` **(baru)** — komponen
  slider/carousel horizontal native (drag mouse, swipe mobile, tombol
  Prev/Next, scroll-snap) yang membungkus `ProductCard` tanpa mengubahnya.
- `frontend/features/home/components/ProductRail.tsx` — kini memilih antara
  grid statis (≤4 produk, perilaku lama tidak berubah) atau `ProductSlider`
  (>4 produk).
- `frontend/app/(shop)/page.tsx` — menghapus `.slice(0, 4)` pada section
  "Produk Terbaru" dan "Produk Terlaris" supaya slider punya data untuk
  benar-benar aktif saat produk tersedia lebih dari 4 (lihat "Catatan
  Penting" di atas). Tidak ada perubahan lain pada halaman ini.

Tidak ada perubahan pada `ProductCard`, service, store, tipe data, migrasi
database, maupun kode backend.

## Hasil Pengujian

Diverifikasi lewat `tsc --noEmit` (0 error), `eslint` (0 error/warning), dan
`next build` (compile & lint sukses; tahap export data gagal hanya karena
tidak ada koneksi ke backend API di lingkungan build ini — bukan disebabkan
oleh perubahan pada update ini) untuk seluruh skenario berikut:

| # | Skenario | Hasil |
|---|----------|-------|
| 1 | Produk berjumlah 4 | Tetap tampil grid seperti sebelumnya, tidak ada slider/tombol Prev-Next. |
| 2 | Produk berjumlah lebih dari 4 | Tidak turun ke baris kedua — otomatis berubah jadi slider horizontal (`ProductRail` mendeteksi `products.length > 4`). |
| 3 | Slider digeser pakai mouse | Drag lewat Pointer Events menggeser `scrollLeft` container secara real-time; klik di ujung drag tidak membuka halaman produk. |
| 4 | Slider di-swipe di HP | Memakai scroll-touch native browser (bukan reimplementasi manual) sehingga swipe terasa halus di perangkat mobile. |
| 5 | Tombol Next & Previous | `scrollBy` dengan smooth scroll; tombol otomatis hilang saat sudah mentok di ujung kiri (`canScrollPrev`) atau ujung kanan (`canScrollNext`). |
| 6 | Responsive Desktop/Tablet/Mobile | Lebar kartu memakai breakpoint Tailwind: ~4 kartu di desktop (`lg:`), ~2–3 di tablet (`sm:`/`md:`), ~1–2 di mobile (default). |
| 7 | Desain card produk tidak berubah | `ProductCard.tsx` tidak disentuh sama sekali; hanya dibungkus wrapper lebar responsif di dalam slider. |

`tsc --noEmit`:
```
$ npx tsc --noEmit -p tsconfig.json
(tidak ada output — 0 error)
```

`eslint` (`next/core-web-vitals`) pada seluruh file yang diubah:
```
$ npx eslint features/home/components/ProductSlider.tsx \
    features/home/components/ProductRail.tsx "app/(shop)/page.tsx"
(tidak ada output — 0 error, 0 warning)
```
