/**
 * Format angka menjadi format Rupiah, contoh: 249000 -> "Rp249.000"
 * Reusable di seluruh halaman yang menampilkan harga (Home, Shop, Detail, Cart, Checkout, Admin).
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
