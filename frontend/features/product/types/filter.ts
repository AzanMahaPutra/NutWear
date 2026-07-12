export type SortOption = "terbaru" | "harga_termurah" | "harga_termahal";

export interface ProductFilterState {
  kategoriIds: string[];
  ukuran: string[];
  warna: string[];
  hargaMin?: number;
  hargaMax?: number;
  sort: SortOption;
  search: string;
  /** true = hanya tampilkan produk dengan status New Arrival. */
  newArrival: boolean;
}

export const DEFAULT_FILTER_STATE: ProductFilterState = {
  kategoriIds: [],
  ukuran: [],
  warna: [],
  sort: "terbaru",
  search: "",
  newArrival: false,
};

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "terbaru", label: "Produk Terbaru" },
  { value: "harga_termurah", label: "Harga Terendah" },
  { value: "harga_termahal", label: "Harga Tertinggi" },
];

export const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

/**
 * Opsi Gender Produk — dipakai dropdown wajib di Admin Product (ProductForm)
 * dan label tampilan di ProductCard ("Pria • S - 3XL", dst).
 */
export const GENDER_OPTIONS: { value: "pria" | "wanita" | "uniseks"; label: string }[] = [
  { value: "pria", label: "Pria" },
  { value: "wanita", label: "Wanita" },
  { value: "uniseks", label: "Uniseks" },
];
