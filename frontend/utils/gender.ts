import { ProductGender } from "@/types/product";
import { GENDER_OPTIONS } from "@/features/product/types/filter";

/**
 * Util Gender Produk (Multi Select) — dipakai ProductCard (label gender utama
 * + badge Uniseks di bawah harga) dan Detail Produk (daftar seluruh gender
 * yang dipilih Admin).
 *
 * Produk sekarang bisa punya lebih dari satu gender (mis. Pria + Uniseks).
 * Card Produk tetap hanya menampilkan SATU gender di baris "Pria | S-3XL"
 * dst supaya ringkas, dengan prioritas: Pria > Wanita > Uniseks (mengikuti
 * urutan GENDER_OPTIONS). Kalau produk juga ditandai Uniseks selain
 * Pria/Wanita, info itu ditampilkan terpisah lewat badge kecil di bawah
 * harga (lihat shouldShowUniseksBadge).
 */

const GENDER_PRIORITY: ProductGender[] = GENDER_OPTIONS.map((g) => g.value);

const GENDER_LABEL = Object.fromEntries(GENDER_OPTIONS.map((g) => [g.value, g.label])) as Record<
  ProductGender,
  string
>;

export function getGenderLabel(gender: ProductGender): string {
  return GENDER_LABEL[gender];
}

/** Gender utama untuk baris "Pria | S-3XL" dst di Card Produk. */
export function getPrimaryGender(genders: ProductGender[]): ProductGender {
  return GENDER_PRIORITY.find((g) => genders.includes(g)) ?? "uniseks";
}

/**
 * Badge "Uniseks" di bawah harga hanya muncul kalau produk juga ditandai
 * Uniseks TAPI gender utamanya bukan Uniseks (mis. Pria + Uniseks, Wanita +
 * Uniseks). Kalau produk hanya Uniseks sendirian, info itu sudah tampil di
 * baris utama jadi badge tidak perlu diulang. Kalau kombinasinya Pria +
 * Wanita (tanpa Uniseks), badge juga tidak muncul.
 */
export function shouldShowUniseksBadge(genders: ProductGender[]): boolean {
  return genders.includes("uniseks") && getPrimaryGender(genders) !== "uniseks";
}

/** Label lengkap untuk Halaman Detail Produk, mis. "Pria • Wanita • Uniseks". */
export function getGenderListLabel(genders: ProductGender[]): string {
  return GENDER_PRIORITY.filter((g) => genders.includes(g))
    .map(getGenderLabel)
    .join(" • ");
}
