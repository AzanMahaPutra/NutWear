// Tipe data untuk domain Produk.
// Field inti (id, kategoriId, namaProduk, slug, harga, hargaPromo, hargaPromoColor,
// isNewArrival, deskripsi, berat, isActive, images, variants) mengikuti persis skema
// tabel products/product_images/product_variants di database - ini yang dikembalikan
// Product API sungguhan.
//
// Field lain (rating, reviewCount, hargaAsli, fiturSingkat, isBestseller,
// colors[].hex) TIDAK ada di skema database. Field-field itu opsional dan
// dipakai/di-derive di sisi UI saja (mis. rating dari Review API, colors dari variants).

export interface ProductColor {
  code: string;
  hex: string;
}

/** Target gender produk. Wajib dipilih admin di form Produk (dropdown). */
export type ProductGender = "pria" | "wanita" | "uniseks";

export interface ProductVariant {
  id: string;
  ukuran: string;
  warna: string;
  sku: string;
  stok: number;
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  sortOrder: number;
  warna?: string | null;
  /** UPDATE 3 — true kalau foto ini punya pasangan produk (lihat product_image_pairs). */
  hasPairs?: boolean;
}

/**
 * Fitur Produk dengan Gambar (UPDATE 4, layout direvisi UPDATE 6). Satu produk
 * bisa punya banyak fitur, masing-masing dengan gambar dan deskripsi —
 * ditampilkan grid 2 kolom (gambar kiri, deskripsi kanan) pada Detail Produk.
 *
 * UPDATE 6 — Judul Fitur sudah tidak dipakai lagi (dihapus dari form Admin dan
 * tidak ditampilkan di frontend). `judul` dibiarkan opsional supaya data lama
 * yang masih menyimpan nilai judul di database tidak menyebabkan error tipe,
 * tapi nilainya diabaikan sepenuhnya di UI.
 */
export interface ProductFeature {
  id: string;
  imageUrl: string;
  /** @deprecated Tidak lagi digunakan/ditampilkan — lihat UPDATE 6. */
  judul?: string;
  deskripsi: string;
  sortOrder: number;
}

export interface ProductReview {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  fitFeedback?: "Ketat" | "Ukuran pas" | "Longgar";
  createdAt: string;
  sizeBought?: string;
  colorBought?: string;
}

export interface Category {
  id: string;
  namaKategori: string;
  /** URL gambar kategori dari Supabase Storage (null = belum ada gambar). */
  imageUrl?: string | null;
  createdAt?: string;
}

export interface Product {
  id: string;
  namaProduk: string;
  slug: string;
  kategoriId: string;
  harga: number;
  /** Harga promo (opsional). Jika diisi, harga (normal) tampil strikethrough. */
  hargaPromo?: number | null;
  /** Warna teks Harga Promo (hex), dipilih admin lewat color picker. Default merah. */
  hargaPromoColor?: string | null;
  /** Periode promo (opsional, format ISO date). Ditampilkan pada Notifikasi Promo Produk. */
  promoMulai?: string | null;
  promoSelesai?: string | null;
  /** UPDATE 3 — dihitung backend (satu sumber kebenaran): true kalau hargaPromo terisi
   * DAN tanggal sekarang ada di antara promoMulai/promoSelesai. Pakai field ini (lewat
   * utils/promo.ts) daripada mengecek `hargaPromo != null` saja supaya promo yang sudah
   * berakhir otomatis kembali tampil sebagai harga normal di seluruh halaman. */
  isPromoActive?: boolean;
  /** Status New Arrival, dikontrol admin di halaman Edit Produk. */
  isNewArrival?: boolean;
  /** Target gender produk (Pria/Wanita/Uniseks), wajib dipilih admin di form Produk. */
  gender: ProductGender;
  deskripsi: string;
  berat: number;
  isActive: boolean;
  createdAt: string;
  images: ProductImage[];
  variants: ProductVariant[];
  /** UPDATE 4 — Fitur Produk dengan Gambar. Array kosong pada produk lama (fallback ke teks `deskripsi`). */
  features?: ProductFeature[];

  // --- UPDATE 5 — Detail Produk dapat Dikelola per Produk ---
  // Isi accordion Detail/Material/Pengiriman/Produksi di Detail Produk, diisi admin
  // per produk. null/undefined pada produk lama -> frontend tampilkan "Informasi belum tersedia.".
  detailInfo?: string | null;
  materialCareInfo?: string | null;
  shippingReturnInfo?: string | null;
  productionInfo?: string | null;

  // --- UI-only / derived ---
  kodeProduk?: string;
  hargaAsli?: number;
  fiturSingkat?: string[];
  isBestseller?: boolean;
  rating?: number;
  reviewCount?: number;
  colors?: ProductColor[];
  pairedProductIds?: string[];
}
