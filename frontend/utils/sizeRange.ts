import { ProductVariant } from "@/types/product";
import { AVAILABLE_SIZES } from "@/features/product/types/filter";

/**
 * Menghitung rentang ukuran ("S - 3XL") dari daftar varian produk, memakai
 * urutan baku AVAILABLE_SIZES (XS, S, M, L, XL, XXL, 3XL) supaya ukuran
 * terkecil & terbesar akurat, bukan urutan string/insert biasa.
 *
 * - Ukuran di luar AVAILABLE_SIZES (data lama/tidak baku) diabaikan dari
 *   perhitungan rentang, tapi tidak menyebabkan error.
 * - 1 ukuran unik -> tampilkan satu ukuran saja (mis. "M").
 * - Tidak ada varian/ukuran valid -> null (ProductCard tidak menampilkan baris ini).
 */
export function getSizeRangeLabel(variants: ProductVariant[]): string | null {
  const uniqueSizes = Array.from(new Set(variants.map((v) => v.ukuran)));
  const knownSizes = uniqueSizes
    .filter((size) => AVAILABLE_SIZES.includes(size))
    .sort((a, b) => AVAILABLE_SIZES.indexOf(a) - AVAILABLE_SIZES.indexOf(b));

  if (knownSizes.length === 0) return null;

  const smallest = knownSizes[0];
  const largest = knownSizes[knownSizes.length - 1];

  return smallest === largest ? smallest : `${smallest} - ${largest}`;
}
