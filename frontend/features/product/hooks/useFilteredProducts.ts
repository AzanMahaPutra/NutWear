import { useMemo } from "react";
import { Product } from "@/types/product";
import { ProductFilterState } from "@/features/product/types/filter";

/**
 * Hook reusable untuk menerapkan filter, sorting, dan search pada daftar produk
 * yang sudah diambil dari Product API sungguhan. Filtering/sorting tetap dilakukan
 * di client karena backend Product API belum mendukung query filter/sort selain
 * categoryId & search — bisa dipindah ke query parameter nanti tanpa mengubah
 * pemanggil hook ini.
 */
export function useFilteredProducts(products: Product[], filter: ProductFilterState) {
  return useMemo(() => {
    let result = [...products];

    if (filter.search.trim()) {
      const q = filter.search.trim().toLowerCase();
      result = result.filter((p) => p.namaProduk.toLowerCase().includes(q));
    }

    if (filter.kategoriIds.length > 0) {
      result = result.filter((p) => filter.kategoriIds.includes(p.kategoriId));
    }

    if (filter.ukuran.length > 0) {
      result = result.filter((p) => p.variants.some((v) => filter.ukuran.includes(v.ukuran)));
    }

    if (filter.warna.length > 0) {
      const selectedWarna = filter.warna.map((w) => w.trim().toLowerCase());
      result = result.filter((p) =>
        p.variants.some((v) => selectedWarna.includes(v.warna.trim().toLowerCase()))
      );
    }

    if (filter.newArrival) {
      result = result.filter((p) => p.isNewArrival);
    }

    if (typeof filter.hargaMin === "number") {
      result = result.filter((p) => p.harga >= filter.hargaMin!);
    }
    if (typeof filter.hargaMax === "number") {
      result = result.filter((p) => p.harga <= filter.hargaMax!);
    }

    switch (filter.sort) {
      case "harga_termurah":
        result.sort((a, b) => a.harga - b.harga);
        break;
      case "harga_termahal":
        result.sort((a, b) => b.harga - a.harga);
        break;
      case "terbaru":
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [products, filter]);
}
