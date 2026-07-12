/**
 * UPDATE 3 — Util promo di sisi frontend.
 *
 * Backend (productService/cartService/wishlistService) sekarang sudah mengirim field
 * `isPromoActive` yang sudah tervalidasi periode promo — util ini dipakai supaya seluruh
 * komponen (ProductCard, Detail Produk, Pasangan Produk, Wishlist, Cart) membaca status
 * promo dengan cara yang sama persis, bukan masing-masing menebak sendiri dari
 * `hargaPromo != null` (yang sebelumnya tidak memvalidasi tanggal promo sama sekali).
 *
 * `isPromoActive` dibuat opsional pada tipe data supaya util ini tetap aman dipakai kalau
 * suatu saat ada response API lama/berbeda yang belum menyertakan field tsb — dalam kasus
 * itu, fallback menghitung ulang dari hargaPromo + promoMulai/promoSelesai.
 */

export interface PromoAwareProduct {
  harga: number;
  hargaPromo?: number | null;
  promoMulai?: string | null;
  promoSelesai?: string | null;
  isPromoActive?: boolean;
}

export function isPromoActive(product: PromoAwareProduct): boolean {
  if (typeof product.isPromoActive === "boolean") return product.isPromoActive;

  if (product.hargaPromo == null) return false;
  const today = new Date().toISOString().slice(0, 10);
  if (product.promoMulai && product.promoMulai > today) return false;
  if (product.promoSelesai && product.promoSelesai < today) return false;
  return true;
}

/** Harga yang benar-benar dipakai untuk perhitungan Subtotal/Total: promo kalau aktif, normal kalau tidak. */
export function getEffectivePrice(product: PromoAwareProduct): number {
  return isPromoActive(product) && product.hargaPromo != null ? product.hargaPromo : product.harga;
}
