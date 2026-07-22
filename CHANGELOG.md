# CHANGELOG — Update Notifikasi Banned User

Update ini menambahkan **notifikasi otomatis** kepada user saat Admin melakukan
tindakan terhadap akun mereka (Banned, Unban Disetujui, Unban Ditolak), lengkap
dengan identitas visual berbeda (ikon Segitiga Merah / Centang Hijau) dari
notifikasi biasa. Tidak ada refactor besar, struktur folder, maupun fitur lain
yang diubah — seluruh perubahan memakai komponen, service, dan struktur
database yang sudah ada (sistem Banned User & Unban Request, sistem Notifikasi
User).

---

## 1. Ringkasan Perubahan

1. **Kategori Notifikasi Baru** — ditambahkan dua kategori (`type`) baru pada
   sistem notifikasi yang sudah ada:
   - `account_warning` → Akun Dibanned & Permohonan Unban Ditolak
   - `account_success` → Permohonan Unban Disetujui
2. **Trigger Otomatis** — notifikasi otomatis dikirim ke user yang bersangkutan
   (bukan broadcast) saat:
   - Admin berhasil melakukan **Banned** pada satu user.
   - Admin **menyetujui** permohonan unban user.
   - Admin **menolak** permohonan unban user.
3. **Identitas Visual Khusus** — kategori `account_warning`/`account_success`
   tidak memakai ikon lonceng biasa, melainkan ikon **Segitiga Peringatan
   (merah)** / **Centang (hijau)** dari `lucide-react` (icon library yang
   sudah dipakai project), lengkap dengan badge "Penting" dan border merah
   tipis pada baris notifikasi di dropdown.
4. **Modal Detail Notifikasi** — komponen baru `NotificationDetailModal`
   menampilkan detail lengkap (ikon besar, judul, alasan banned, tanggal
   banned, penjelasan pembatasan akun) saat notifikasi dibuka, dengan tombol
   **"Ajukan Permohonan Unban"** yang langsung membuka form permohonan unban
   yang **sudah ada** di halaman Profile.
5. **Tidak ada migration database** — kolom `notifications.type` sudah berupa
   `varchar(20)` tanpa `check constraint`, sehingga nilai kategori baru bisa
   langsung dipakai tanpa perubahan skema. Komentar kolom pada `schema.sql`
   diperbarui sekadar sebagai dokumentasi.

---

## 2. File yang Diubah

### Backend

| File | Perubahan |
|---|---|
| `backend/src/services/notificationService.js` | Menambahkan 3 fungsi baru: `notifyAccountBanned(user)`, `notifyUnbanApproved(userId)`, `notifyUnbanRejected(userId)`. Masing-masing membuat satu baris notifikasi baru khusus untuk satu user (bukan broadcast), memakai kategori `account_warning`/`account_success`, judul & isi sesuai spesifikasi (termasuk alasan banned & tanggal banned yang diformat dalam Bahasa Indonesia memakai helper `formatDateLong` yang sudah ada). |
| `backend/src/services/userService.js` | `banUser()` sekarang memanggil `notificationService.notifyAccountBanned()` setelah proses banned berhasil disimpan ke database. Pemanggilan dibungkus `try/catch` supaya kegagalan pengiriman notifikasi (mis. gangguan sementara) **tidak** menggagalkan aksi banned itu sendiri. |
| `backend/src/services/unbanRequestService.js` | `approveRequest()` memanggil `notificationService.notifyUnbanApproved()` setelah status akun & permohonan berhasil diperbarui. `rejectRequest()` memanggil `notificationService.notifyUnbanRejected()` setelah status permohonan diperbarui. Sama seperti di atas, dibungkus `try/catch` agar tidak menggagalkan aksi approve/reject. |
| `backend/src/database/schema.sql` | Memperbarui komentar pada kolom `notifications.type` untuk mendokumentasikan dua nilai kategori baru (`account_warning`, `account_success`). Tidak ada perubahan struktur/tipe kolom — tidak diperlukan migration. |

### Frontend

| File | Perubahan |
|---|---|
| `frontend/types/user.ts` | `NotificationType` diperluas dari `"order_status" \| "new_arrival" \| "promo"` menjadi menyertakan `"account_warning" \| "account_success"`. |
| `frontend/components/layout/NotificationBell.tsx` | Menambahkan ikon & warna untuk 2 kategori baru (`AlertTriangle` merah untuk `account_warning`, `CheckCircle2` hijau untuk `account_success`). Baris notifikasi kategori `account_warning` mendapat border kiri merah tipis + badge "Penting" agar langsung terlihat berbeda dari notifikasi biasa. Klik pada notifikasi kategori `account_warning`/`account_success` sekarang membuka `NotificationDetailModal`, bukan langsung pindah halaman seperti kategori lain. |
| `frontend/components/layout/NotificationDetailModal.tsx` **(baru)** | Modal detail notifikasi khusus untuk kategori `account_warning`/`account_success`: ikon besar Segitiga Merah/Centang Hijau, judul, isi notifikasi (alasan, tanggal banned, penjelasan pembatasan — semuanya sudah disusun backend di `message`), dan tombol **"Ajukan Permohonan Unban"** (hanya tampil untuk `account_warning`) yang mengarahkan ke `/profile?unban=1`. |
| `frontend/features/profile/components/ProfileView.tsx` | Membaca query parameter `?unban=1` lewat `useSearchParams`. Jika ada, akun sedang berstatus `banned`, dan tidak ada permohonan unban yang masih `menunggu`, form/modal **"Ajukan Pembukaan Blokir Akun"** yang sudah ada otomatis terbuka, lalu URL dibersihkan kembali ke `/profile` (`router.replace`). Tidak ada perubahan pada form/alur pengajuan unban itu sendiri. |
| `frontend/app/profile/page.tsx` | Dibungkus dengan `<Suspense>` (mengikuti pola yang sudah dipakai di `app/profile/riwayat-pesanan/page.tsx`) karena `ProfileView` sekarang memakai `useSearchParams`, yang oleh Next.js App Router mewajibkan boundary Suspense di komponen page. |

Tidak ada file lain yang diubah. Tidak ada migration database baru (lihat
Bagian 4).

---

## 3. Cara Kerja Sistem

### 3.1 Kategori Notifikasi

Sistem notifikasi sudah mendukung kategori (`type`) sejak awal (Update 1).
Update ini menambahkan 2 kategori baru ke daftar yang sudah ada:

| Kategori | Label | Ikon | Warna | Dipakai untuk |
|---|---|---|---|---|
| `order_status` | Status Pesanan | Package | Indigo | Update status pesanan (sudah ada) |
| `new_arrival` | Produk Baru | Sparkles | Emerald | Produk baru ditandai New Arrival (sudah ada) |
| `promo` | Promo | Tag | Merah | Promo produk (sudah ada) |
| `account_warning` | Peringatan Akun | **AlertTriangle (Segitiga)** | **Merah** | Akun Dibanned, Permohonan Unban Ditolak |
| `account_success` | Status Akun | **CheckCircle2 (Centang)** | **Hijau** | Permohonan Unban Disetujui |

Setiap kategori dipetakan ke ikon & warna berbeda di `NotificationBell.tsx`
lewat `TYPE_ICON`/`TYPE_ICON_STYLE` — mekanisme yang sama persis dengan yang
sudah dipakai 3 kategori sebelumnya, hanya ditambah 2 entri baru. Kategori
`account_warning` juga masuk daftar `IMPORTANT_TYPES` sehingga baris
notifikasinya mendapat border merah tipis + badge "Penting" di dropdown.

### 3.2 Notifikasi Banned & Unban

Alur end-to-end (tidak ada perubahan pada logic banned/unban yang sudah ada,
hanya ditambah pemanggilan notifikasi setelah aksi berhasil):

1. **Admin melakukan Banned** (`PATCH /users/:id/ban`, `userController.banUser`
   → `userService.banUser`) — setelah `status` user diubah menjadi `"banned"`
   di database, sistem otomatis membuat **satu** baris notifikasi baru untuk
   user tersebut (`notificationRepository.createForUser`, bukan broadcast),
   dengan:
   - Kategori: `account_warning`
   - Judul: **"Akun Anda Telah Diblokir"**
   - Isi: deskripsi pemblokiran + alasan yang diinput Admin (diambil dari
     `banned_reason`) + tanggal banned (diformat "DD Bulan YYYY") + penjelasan
     bahwa akun tidak bisa checkout/ulasan/wishlist/keranjang selama dibanned
     + ajakan mengajukan permohonan unban.
   - `link`: `/profile`

2. **Admin menyetujui permohonan unban**
   (`PATCH /unban-requests/:id/approve`, `unbanRequestController.approve` →
   `unbanRequestService.approveRequest`) — setelah `status` user dikembalikan
   ke `"aktif"` dan status permohonan menjadi `"disetujui"`, sistem otomatis
   membuat notifikasi baru:
   - Kategori: `account_success`
   - Judul: **"Permohonan Unban Disetujui"**
   - Isi: permohonan disetujui, akun aktif kembali, seluruh fitur bisa dipakai.

3. **Admin menolak permohonan unban**
   (`PATCH /unban-requests/:id/reject`, `unbanRequestController.reject` →
   `unbanRequestService.rejectRequest`) — setelah status permohonan menjadi
   `"ditolak"` (status akun tetap `"banned"`), sistem otomatis membuat
   notifikasi baru:
   - Kategori: `account_warning`
   - Judul: **"Permohonan Unban Ditolak"**
   - Isi: permohonan belum disetujui, ajakan membaca kembali alasan banned
     dan mengajukan permohonan baru setelah permohonan sebelumnya selesai
     diproses.

Semua pemanggilan notifikasi di atas dibungkus `try/catch` di service layer —
kalau pengiriman notifikasi gagal (mis. gangguan koneksi sesaat ke tabel
`notifications`), aksi ban/approve/reject yang sudah berhasil tersimpan
**tidak ikut gagal/di-rollback**.

### 3.3 Hak Akses & Penyimpanan (tidak berubah, memakai mekanisme yang sudah ada)

- Notifikasi disimpan **per user** (`notifications.user_id`), bukan tabel
  global — setiap query (`findAllByUser`, `countUnread`, `markRead`, dll)
  selalu difilter `eq("user_id", userId)` dari user yang sedang login lewat
  JWT (`req.user.id`), jadi user lain maupun Admin tidak bisa mengambil
  notifikasi milik user lain lewat endpoint yang sama.
- Notifikasi tersimpan permanen di database (bukan in-memory/session), jadi
  tetap ada walaupun user logout lalu login kembali.
- Status baca (`is_read`) & waktu (`created_at`) sudah ada dari skema
  sebelumnya dan dipakai apa adanya; tidak ada kolom "waktu dibaca" terpisah
  karena `is_read` + `created_at` sudah cukup untuk kebutuhan saat ini (badge
  unread count tetap dihitung dari `is_read = false`).

### 3.4 Detail Notifikasi & Tombol "Ajukan Permohonan Unban"

Saat user membuka (klik) notifikasi kategori `account_warning`/
`account_success` di dropdown Notifikasi (`NotificationBell`), notifikasi
otomatis ditandai sudah dibaca lalu **modal detail** (`NotificationDetailModal`)
terbuka menampilkan ikon besar, judul, dan seluruh isi notifikasi (alasan,
tanggal, penjelasan). Untuk kategori `account_warning`, tersedia tombol
**"Ajukan Permohonan Unban"** yang menutup modal lalu mengarahkan ke
`/profile?unban=1`. Di halaman Profile, query `unban=1` dibaca sekali untuk
otomatis membuka form **"Ajukan Pembukaan Blokir Akun"** yang sudah ada
sebelumnya (dipakai juga oleh banner banned di halaman Profile) — tidak ada
form/endpoint baru yang dibuat, seluruhnya memakai `unbanRequestService`
(frontend & backend) yang sudah ada.

---

## 4. Struktur Database

**Tidak ada migration baru.** Tabel `notifications` (dibuat pada migration
`20260709_add_notifications_and_promo_period.sql`) sudah mendefinisikan kolom
`type` sebagai `varchar(20) not null` **tanpa** `check constraint`, berbeda
dengan kolom `users.status` atau `unban_requests.status` yang memang dibatasi
lewat constraint. Karena itu, dua nilai kategori baru (`account_warning`,
`account_success` — masing-masing di bawah batas 20 karakter) bisa langsung
dipakai tanpa mengubah skema.

Satu-satunya perubahan pada `schema.sql` adalah pembaruan **komentar**
dokumentasi kolom (bukan perubahan tipe/struktur):

```sql
type varchar(20) not null, -- 'order_status' | 'new_arrival' | 'promo' | 'account_warning' | 'account_success'
```

---

## 5. Hasil Pengujian Skenario

| # | Skenario | Hasil |
|---|---|---|
| 1 | Admin melakukan Banned kepada User A | ✅ `userService.banUser` memanggil `notifyAccountBanned` setelah update `status = 'banned'` berhasil; notifikasi baru dibuat khusus untuk `user_id` = User A lewat `createForUser` (bukan broadcast), sehingga hanya muncul di akun User A. |
| 2 | Notifikasi menggunakan ikon Segitiga Merah | ✅ Kategori `account_warning` dipetakan ke `AlertTriangle` (lucide-react) dengan `bg-red-100 text-red-600` di `TYPE_ICON`/`TYPE_ICON_STYLE`, ditambah border kiri merah + badge "Penting" pada baris dropdown, dan ikon besar merah yang sama di `NotificationDetailModal`. |
| 3 | Isi notifikasi menampilkan alasan banned sesuai input Admin | ✅ `notifyAccountBanned(user)` menyisipkan `user.bannedReason` (hasil `reason` yang diinput Admin lewat form Banned) langsung ke dalam `message`, ditampilkan apa adanya (whitespace-pre-line) di modal detail. |
| 4 | Klik tombol "Ajukan Permohonan Unban" → langsung membuka halaman Permohonan Unban | ✅ Tombol di `NotificationDetailModal` memanggil `router.push("/profile?unban=1")`; `ProfileView` membaca query tersebut dan otomatis men-set `unbanModalOpen = true`, membuka form "Ajukan Pembukaan Blokir Akun" yang sudah ada. |
| 5 | Admin menyetujui permohonan → user menerima notifikasi dengan ikon Centang Hijau | ✅ `unbanRequestService.approveRequest` memanggil `notifyUnbanApproved(request.user_id)` setelah `unbanUser` & `updateStatus("disetujui")` berhasil; kategori `account_success` dipetakan ke `CheckCircle2` hijau. |
| 6 | Admin menolak permohonan → user menerima notifikasi dengan ikon Segitiga Merah | ✅ `unbanRequestService.rejectRequest` memanggil `notifyUnbanRejected(request.user_id)` setelah `updateStatus("ditolak")` berhasil; kategori tetap `account_warning` (Segitiga Merah), sesuai spesifikasi. |
| 7 | Badge jumlah notifikasi belum dibaca diperbarui otomatis | ✅ Notifikasi baru dibuat dengan `is_read = false` (default kolom); `unreadCount` di store (`fetchUnreadCount`/polling 60 detik yang sudah ada) otomatis ikut bertambah tanpa perubahan pada mekanisme polling/badge yang sudah ada. |
| 8 | Seluruh notifikasi tetap tersimpan setelah logout & login kembali | ✅ Notifikasi disimpan permanen di tabel `notifications` (bukan state client/session); `findAllByUser` selalu mengambil ulang dari database berdasarkan `user_id` dari sesi login yang aktif — tidak ada mekanisme baru yang menghapus data pada logout. |
| 9 | User lain tidak dapat melihat notifikasi tersebut | ✅ Seluruh query notifikasi (list, unread-count, mark-read, mark-all-read) di `notificationRepository`/`notificationController` sudah difilter `user_id` dari token JWT user yang sedang login (`req.user.id`) — tidak diubah oleh update ini, dan `createForUser` hanya menyasar satu `user_id` spesifik (bukan broadcast) untuk ketiga notifikasi baru ini.

---

## 6. Catatan Tambahan

- Tidak ada perubahan pada middleware `blockIfBanned`, alur login/logout,
  maupun endpoint Banned/Unban yang sudah ada — update ini murni menambahkan
  *side effect* (pengiriman notifikasi) setelah aksi-aksi tersebut berhasil.
- Kategori `review` yang disebutkan sebagai kategori minimal pada dokumen
  requirement **belum** memiliki trigger notifikasi otomatis di sistem yang
  ada saat ini (tidak ditemukan pemanggilan notifikasi dari fitur Review) dan
  berada di luar cakupan "Banned User & Notifikasi" pada update ini, sehingga
  sengaja tidak ditambahkan triggernya agar tidak melebar ke fitur lain yang
  tidak diminta. Struktur kategori (`NotificationType`, `TYPE_ICON`,
  `TYPE_ICON_STYLE`) sudah dirancang generik sehingga kategori `review` bisa
  ditambahkan kapan pun tanpa refactor, mengikuti pola yang sama seperti
  `account_warning`/`account_success` di update ini.
