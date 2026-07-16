# CHANGELOG — UPDATE 8: Keranjang Baru Dikosongkan Setelah Pembayaran Berhasil

## Ringkasan

Sebelumnya (Update 2), item keranjang langsung dihapus begitu **checkout dibuat**
(order berstatus Menunggu Pembayaran), tanpa menunggu pembayaran selesai. Kalau
pembayaran gagal/terputus, item tersebut sudah hilang dari keranjang padahal
pesanannya belum pernah lunas.

Diubah sesuai permintaan: item keranjang sekarang baru dihapus setelah
pembayaran **BENAR-BENAR BERHASIL** (status pesanan menjadi "Sudah Dibayar"),
bukan lagi segera saat checkout. Selama pesanan masih "Menunggu Pembayaran",
produk yang sudah di-checkout tetap terlihat di keranjang.

## File yang diubah

### `backend/src/repositories/cartRepository.js`
- Menambah `deleteByVariantIds(userId, variantIds)` — menghapus baris keranjang
  berdasarkan `variant_id`, dibatasi milik user tersebut. Dipakai untuk
  membersihkan keranjang berdasarkan varian yang ada di pesanan yang baru lunas
  (bukan berdasarkan id keranjang seperti sebelumnya, karena pada titik ini kita
  hanya tahu pesanan & variannya, bukan id baris keranjang aslinya lagi).

### `backend/src/services/orderService.js`
- `checkout()`: **tidak lagi** memanggil penghapusan keranjang segera setelah
  order dibuat. Item tetap ada di keranjang selama pesanan Menunggu Pembayaran.
- **`clearCartForPaidOrder(order)`** (baru, diekspor) — mengambil `variant_id`
  dari seluruh `order_items` pesanan, lalu menghapus baris keranjang milik user
  yang sama dengan varian tersebut. Item keranjang varian/produk lain tidak ikut
  terhapus.
- `updateOrderStatus()` (dipakai endpoint admin `PATCH /orders/:id/status`):
  sekarang mengambil ulang data order lengkap (`order_items` termasuk
  `variant_id`) setelah update status, dan memanggil `clearCartForPaidOrder`
  kalau status baru adalah "sudah_dibayar" — supaya kalau admin menandai
  pesanan lunas secara manual (mis. transfer manual), keranjang tetap ikut
  terbersihkan secara konsisten, sama seperti lewat Webhook Midtrans.

### `backend/src/services/paymentService.js`
- `handleMidtransNotification()` (Webhook Midtrans — jalur normal pembayaran
  Snap): setelah status order berhasil diperbarui menjadi `"sudah_dibayar"`,
  memanggil `orderService.clearCartForPaidOrder(order)`. Kegagalan pembersihan
  keranjang **tidak** menggagalkan pemrosesan webhook itu sendiri (hanya
  dicatat lewat `logger.warn`), supaya Midtrans tetap menerima respons sukses
  dan tidak retry terus-menerus.

### `frontend/features/checkout/components/CheckoutView.tsx`
- Hanya perbaikan komentar (tidak ada perubahan logic) — komentar lama
  menyebutkan "backend sudah mengosongkan keranjang saat checkout", yang sudah
  tidak akurat lagi. `fetchCartAfterOrder()` tetap dipanggil seperti sebelumnya
  (untuk sinkronisasi umum), tapi sekarang akan menampilkan item yang baru
  di-checkout **tetap ada** di keranjang sampai pembayarannya berhasil — sesuai
  perilaku baru di backend, tanpa perlu perubahan kode di sisi frontend.

## Kenapa tidak ada perubahan lain di frontend

Halaman Keranjang & Navbar selalu mengambil data keranjang langsung dari
backend (`GET /cart`) setiap kali dibuka/disinkronkan — jadi begitu backend
berhenti menghapus item saat checkout, tampilan di frontend otomatis ikut
benar tanpa perlu disentuh.

## Yang perlu diperhatikan

- Karena item checkout kini tetap terlihat di keranjang selama menunggu
  pembayaran, secara teori user bisa meng-checkout item yang sama dua kali
  sebelum membayar yang pertama (membuat 2 pesanan terpisah). Ini **belum**
  diblokir secara eksplisit — tapi stok sudah dikurangi begitu order pertama
  dibuat, jadi checkout kedua untuk varian yang sama akan otomatis ditolak
  kalau stoknya sudah tidak cukup lagi. Kalau perilaku ini perlu diperketat
  lebih lanjut (mis. mengunci/menyembunyikan item yang sedang ada pesanan
  aktif), beri tahu saya — itu perubahan terpisah yang lebih besar.

---

## Catatan terpisah: Error "Endpoint POST .../continue-payment tidak ditemukan"

Ini **bukan bug di kode** — sudah dicek langsung:
- `backend/src/routes/orderRoutes.js` baris 21 sudah mendaftarkan
  `router.post("/my/:id/continue-payment", orderController.continueMyOrderPayment)`.
- `orderController.continueMyOrderPayment` ada & sudah diekspor dengan benar.
- Route ini ter-mount lewat `/orders` → `/api/v1`, jadi path lengkapnya persis
  sama dengan yang gagal tadi.

Pesan errornya sendiri ("Endpoint ... tidak ditemukan") adalah pesan baku dari
`notFoundHandler.js`, yang **hanya** muncul kalau Express benar-benar tidak
menemukan route yang cocok sama sekali. Karena route-nya sudah benar di kode
ini, kesimpulannya: **backend yang sedang diakses saat error itu terjadi
belum menjalankan kode terbaru** (belum di-redeploy/restart setelah endpoint
ini ditambahkan). Redeploy backend dengan kode di ZIP ini seharusnya
menyelesaikannya — tidak ada perubahan kode yang diperlukan untuk masalah ini.
