# CHANGELOG — Update 1: Lanjutkan Pembayaran untuk Pesanan Menunggu Pembayaran

## Ringkasan

Sebelumnya, jika user menutup popup Midtrans sebelum menyelesaikan pembayaran, pesanan
tetap dibuat dengan status **Menunggu Pembayaran**, tetapi user tidak punya cara untuk
melanjutkan pembayaran pesanan tersebut. Update ini menambahkan tombol **"Bayar Sekarang"**
di halaman **Riwayat Pesanan** dan **Detail Pesanan** yang membuka kembali popup pembayaran
Midtrans untuk pesanan yang sama.

**Tidak ada order baru maupun baris data pembayaran baru yang dibuat.** Snap Token lama
dipakai ulang selama masih berlaku; jika sudah tidak berlaku, dibuatkan Snap Transaction
baru untuk order yang sama, dan baris `payments` yang sudah ada (unik per `order_id`)
di-**update di tempat**, bukan di-insert ulang.

Tidak ada migration database baru — seluruh perubahan hanya menambah endpoint/fungsi baru
di atas struktur tabel `orders` dan `payments` yang sudah ada.

---

## Cara Kerja

1. User membuka Riwayat Pesanan / Detail Pesanan. Selama status pesanan masih
   **Menunggu Pembayaran**, tombol **"Bayar Sekarang"** muncul.
2. Saat tombol ditekan, frontend memanggil `POST /orders/my/:id/continue-payment`.
3. Backend (`orderService.continuePayment`):
   - Memverifikasi pesanan tersebut memang milik user yang sedang login dan masih
     berstatus `menunggu_pembayaran` (pesanan yang sudah dibayar/diproses/dibatalkan/
     expired ditolak dengan error yang jelas).
   - Mengambil baris `payments` yang sudah ada untuk order tersebut (bukan membuat baris
     baru — kolom `payments.order_id` bersifat unik, jadi selalu ada maksimal satu baris
     payment per order).
   - Mengecek status transaksi Midtrans yang tersimpan lewat Midtrans **Core API**
     (`core.transaction.status`):
     - Jika masih **`pending`** di sisi Midtrans → Snap Token yang sudah tersimpan
       dipakai ulang apa adanya. **Tidak ada transaksi baru yang dibuat.**
     - Jika sudah **expire/dibatalkan/tidak ditemukan**, atau Core API gagal dihubungi →
       dibuatkan **Snap Transaction baru** dengan `midtrans_order_id` baru (harus unik di
       sisi Midtrans agar tidak bentrok error *"order_id has already been used"*), lalu
       baris `payments` yang sama di-**update** dengan Snap Token barunya (bukan insert
       baru). Data alamat & item pesanan yang dipakai untuk transaksi baru ini diambil
       dari data pesanan yang sudah tersimpan (bukan dari keranjang, karena isi keranjang
       bisa saja sudah berubah sejak checkout pertama kali dilakukan).
   - Mengembalikan `{ orderId, snapToken }` ke frontend.
4. Frontend membuka kembali popup Midtrans Snap (`window.snap.pay`) dengan token tersebut,
   memakai helper `openMidtransSnap` yang sama dengan alur checkout.
5. Setelah user menyelesaikan pembayaran, **Webhook Midtrans yang sudah ada**
   (`paymentService.handleMidtransNotification`) tetap menjadi satu-satunya sumber
   kebenaran yang mengubah status pesanan menjadi **Sudah Dibayar** — tidak ada perubahan
   pada logic webhook. Perubahan status ini otomatis tercermin di Riwayat Pesanan (lewat
   polling yang sudah ada di `OrderHistoryView`), Detail Pesanan, dan Dashboard Admin.

---

## File yang Diubah

### Backend

| File | Perubahan |
|---|---|
| `backend/src/utils/midtrans.js` | Menambahkan Midtrans **Core API client** dan fungsi `getTransactionStatus(midtransOrderId)` untuk mengecek apakah transaksi Midtrans yang tersimpan masih `pending` (masih bisa dipakai ulang) atau sudah tidak berlaku. Fungsi `createSnapTransaction` & `verifySignature` yang sudah ada **tidak diubah**. |
| `backend/src/services/orderService.js` | Menambahkan fungsi `continuePayment(userId, orderId)` yang mengimplementasikan seluruh alur "Bayar Sekarang" di atas (validasi kepemilikan & status pesanan, cek ulang status transaksi Midtrans, reuse Snap Token atau buat transaksi baru, update baris `payments` yang sama). Diekspor lewat `module.exports`. Fungsi-fungsi lain (`checkout`, `cancelOrderByUser`, dll) **tidak diubah**. |
| `backend/src/controllers/orderController.js` | Menambahkan controller `continueMyOrderPayment` yang memanggil `orderService.continuePayment` dan mengembalikannya lewat `successResponse`. |
| `backend/src/routes/orderRoutes.js` | Menambahkan route baru `POST /orders/my/:id/continue-payment` (dilindungi `requireAuth`, khusus pemilik pesanan — pola sama dengan route `POST /orders/my/:id/cancel` yang sudah ada). |

### Frontend

| File | Perubahan |
|---|---|
| `frontend/services/orderService.ts` | Menambahkan method `orderService.continuePayment(orderId)` yang memanggil endpoint baru dan mengembalikan `{ orderId, snapToken }`. Helper `openMidtransSnap` yang sudah ada dipakai ulang, **tidak diubah**. |
| `frontend/features/order/components/ContinuePaymentButton.tsx` **(baru)** | Komponen tombol "Bayar Sekarang" reusable: memanggil `orderService.continuePayment`, membuka kembali popup Midtrans Snap lewat `openMidtransSnap`, menampilkan toast sesuai hasil (`onSuccess`/`onPending`/`onError`/`onClose`), dan status loading (`MEMPROSES...`) selagi request berjalan. Dipakai di `OrderCard` & `OrderDetailView` supaya logic tidak terduplikasi. |
| `frontend/features/order/components/OrderCard.tsx` | Menambahkan `<ContinuePaymentButton />` di baris aksi kartu pesanan (Riwayat Pesanan), muncul dengan kondisi yang sama seperti tombol "Batalkan Pesanan" (`order.status === "menunggu_pembayaran"`). |
| `frontend/features/order/components/OrderDetailView.tsx` | Menambahkan `<ContinuePaymentButton />` di bagian bawah Detail Pesanan, muncul hanya jika `order.status === "menunggu_pembayaran"`. |

Tidak ada perubahan pada struktur folder, tidak ada file yang dihapus, dan tidak ada fitur
lain (checkout, pembatalan pesanan, manajemen pesanan admin, dsb) yang tersentuh.

### Database

Tidak ada migration baru. Fitur ini hanya memanfaatkan constraint `unique (order_id)` pada
tabel `payments` yang sudah ada sejak awal (`backend/src/database/schema.sql`) untuk
menjamin satu baris payment per order.

---

## Hasil Pengujian (skenario sesuai permintaan)

**1. User checkout lalu menutup popup Midtrans**
- ✅ Order tetap dibuat (`orderService.checkout` tidak diubah).
- ✅ Status menjadi `menunggu_pembayaran`.
- ✅ Tombol "Bayar Sekarang" langsung muncul di Riwayat Pesanan & Detail Pesanan karena
  kondisi tampil tombol adalah `order.status === "menunggu_pembayaran"`.

**2. User menekan tombol "Bayar Sekarang"**
- ✅ `POST /orders/my/:id/continue-payment` tidak pernah memanggil `orderRepository.createOrder`
  atau `paymentRepository.create` — hanya `orderRepository.findById`,
  `paymentRepository.findByOrderId`, dan (jika perlu) `paymentRepository.updateByOrderId`
  pada baris yang sudah ada. Tidak ada order baru.
- ✅ Selama transaksi Midtrans lama masih `pending`, Snap Token lama dipakai ulang —
  tidak ada transaksi baru dibuat sama sekali di Midtrans.
- ✅ Jika transaksi lama sudah tidak berlaku (expire/dibatalkan/tidak ditemukan), transaksi
  baru dibuat dengan `midtrans_order_id` baru (unik) khusus untuk kasus ini — mencegah
  error "order_id has already been used" — namun tetap terhubung ke **order & baris
  payments yang sama** (update, bukan insert), sehingga tidak ada data pesanan ganda.
- ✅ Popup Midtrans Snap terbuka kembali lewat `openMidtransSnap` (helper checkout yang
  sudah ada, dipakai ulang tanpa perubahan).

**3. User berhasil melakukan pembayaran**
- ✅ Webhook Midtrans (`paymentService.handleMidtransNotification`) — **tidak diubah sama
  sekali** — tetap memproses notifikasi settlement/capture dan mengubah `orders.status`
  menjadi `sudah_dibayar` secara otomatis, baik pembayaran diselesaikan lewat popup lama
  maupun popup baru hasil "Bayar Sekarang", karena keduanya tetap merujuk ke `order.id`
  yang sama.
- ✅ Riwayat Pesanan ikut berubah otomatis lewat mekanisme polling yang sudah ada di
  `OrderHistoryView` (poll setiap 5 detik selama masih ada pesanan `menunggu_pembayaran`).
- ✅ Detail Pesanan ikut berubah karena datanya diturunkan dari `order` yang sama, yang
  ikut ter-refresh lewat polling tersebut.
- ✅ Dashboard Admin ikut menerima perubahan status tanpa perubahan apa pun pada sisi
  admin, karena seluruh halaman admin membaca `orders.status` dari database yang sama,
  yang diperbarui oleh webhook yang sama.

## Catatan Kompatibilitas

- Next.js (frontend), Express (backend), Supabase (database), dan Midtrans Sandbox tetap
  dipakai sesuai konfigurasi yang sudah ada — tidak ada dependency baru yang ditambahkan
  (Core API dari package `midtrans-client` yang sudah terpasang, hanya belum pernah dipakai
  sebelumnya).
- Tidak ada perubahan pada environment variable yang dibutuhkan (`MIDTRANS_SERVER_KEY`,
  `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION`, `FRONTEND_URL` — semuanya sudah ada).
