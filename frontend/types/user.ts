// Tipe data untuk domain User, Alamat, Cart, Wishlist, dan Order.
// Field yang ditandai opsional adalah field UI-only yang tidak selalu
// dikembalikan API sungguhan (mis. wishlist tidak menyimpan varian warna/ukuran,
// hanya referensi ke produk).

export interface User {
  id: string;
  namaLengkap: string;
  email: string;
  noHp: string;
  role: "customer" | "admin";
}

export interface UserAddress {
  id: string;
  userId: string;
  receiverName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  address: string;
  isDefault: boolean;
}

export interface CartItem {
  id: string;
  variantId: string;
  productId: string;
  namaProduk: string;
  slug: string;
  imageUrl: string | null;
  warna: string;
  ukuran: string;
  harga: number;
  /** UPDATE 3 — Perbaikan bug harga promo di Cart: field promo ikut dikirim backend
   * supaya Cart bisa tampil & menghitung Subtotal/Total dengan cara yang sama seperti
   * Card Produk/Detail Produk, bukan selalu memakai harga normal. */
  hargaPromo?: number | null;
  hargaPromoColor?: string | null;
  isPromoActive?: boolean;
  /** Harga yang benar-benar dipakai untuk Subtotal/Total (promo kalau aktif, normal kalau tidak). */
  hargaEfektif?: number;
  quantity: number;
  stokTersedia?: number;
  fiturSingkat?: string[];
}

export interface WishlistItem {
  id: string;
  productId: string;
  namaProduk: string;
  kodeProduk?: string;
  slug: string;
  imageUrl: string | null;
  warna?: string;
  ukuran?: string;
  harga: number;
  hargaPromo?: number | null;
  hargaPromoColor?: string | null;
  isPromoActive?: boolean;
  fiturSingkat?: string[];
}

export type OrderStatus =
  | "menunggu_pembayaran"
  | "sudah_dibayar"
  | "diproses"
  | "dikemas"
  | "dikirim"
  | "selesai"
  | "dibatalkan"
  | "expired"
  | "refund";

/** Ulasan yang sudah pernah dibuat user untuk produk pada item pesanan ini (UPDATE 7). */
export interface OrderItemReview {
  id: string;
  rating: number;
  comment: string;
}

export interface OrderItem {
  id: string;
  productId?: string;
  variantId: string;
  namaProduk?: string;
  slug?: string;
  sku?: string;
  imageUrl?: string | null;
  warna?: string;
  ukuran?: string;
  harga: number;
  quantity: number;
  fiturSingkat?: string[];
  /** UPDATE 7 — null kalau user belum pernah memberi ulasan untuk produk ini pada
   * pesanan ini. Dipakai Riwayat Pesanan/Detail Pesanan untuk menentukan tombol
   * "Beri Ulasan" (belum ada) atau "Edit Ulasan" (sudah ada). */
  review?: OrderItemReview | null;
}

export interface OrderShippingAddress {
  receiverName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  address: string;
}

export interface OrderCustomer {
  namaLengkap: string;
  email: string;
  noHp?: string;
}

export interface OrderPayment {
  transactionStatus: string | null;
  paymentType: string | null;
  snapToken?: string | null;
  paidAt?: string | null;
}

export type NotificationType = "order_status" | "new_arrival" | "promo";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  referenceId?: string | null;
  isRead: boolean;
  createdAt: string;
}


export interface Order {
  id: string;
  userId: string;
  addressId?: string | null;
  items: OrderItem[];
  totalPrice: number;
  shippingCost: number;
  grandTotal: number;
  status: OrderStatus;
  createdAt: string;
  shippingAddress?: OrderShippingAddress | null;
  customer?: OrderCustomer | null;
  payment?: OrderPayment | null;
  /** Update 2, poin 7 — "user" jika dibatalkan sendiri lewat tombol Batalkan Pesanan,
   * "admin" jika diubah manual di halaman Manajemen Pesanan, null jika belum pernah dibatalkan. */
  cancelledBy?: "user" | "admin" | null;
}
