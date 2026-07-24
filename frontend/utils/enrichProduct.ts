import { Product } from "@/types/product";
import { deriveHexFromColorName } from "@/utils/colorSwatch";

/**
 * Melengkapi Product dari API dengan field UI-only yang tidak ada di database:
 * - colors: di-derive dari daftar variants (unique warna + hex tebakan)
 * - kodeProduk: fallback ke 8 karakter awal id (tidak ada kolom kode_produk di skema)
 * - fiturSingkat: fallback generic badge (tidak ada kolom ini di skema)
 *
 * Dipakai ProductCard, Detail Produk, dsb supaya komponen tidak perlu tahu
 * field mana yang asli dari database dan mana yang derived.
 */
export function enrichProduct(product: Product): Product {
  const uniqueColorNames = Array.from(new Set(product.variants.map((v) => v.warna)));

  return {
    ...product,
    kodeProduk: product.kodeProduk ?? product.id.slice(0, 8).toUpperCase(),
    colors:
      product.colors ??
      uniqueColorNames.map((name) => ({ code: name, hex: deriveHexFromColorName(name) })),
    fiturSingkat: product.fiturSingkat ?? ["Uniseks"],
    // UPDATE — Card Produk: Rating & Total Terjual. Backend (productService)
    // sudah selalu mengirim kedua field ini, fallback ke 0 hanya jaring pengaman.
    rating: product.rating ?? 0,
    reviewCount: product.reviewCount ?? 0,
    totalTerjual: product.totalTerjual ?? 0,
  };
}
