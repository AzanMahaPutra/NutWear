/**
 * Format angka Total Terjual pada Card Produk supaya rapi dan tidak
 * membuat Card menjadi lebar/tumpuk, mengikuti pola yang umum dipakai di
 * website (pemisah ribuan titik untuk angka wajar, disingkat "rb+"/"jt+"
 * untuk angka yang sangat besar).
 *
 * Contoh:
 *   0        -> "0"
 *   1250     -> "1.250"
 *   15200    -> "15.200"
 *   100000   -> "100 rb+"
 *   1500000  -> "1 jt+"
 */
export function formatSoldCount(count: number): string {
  const value = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;

  if (value >= 1_000_000) {
    return `${Math.floor(value / 1_000_000)} jt+`;
  }

  if (value >= 100_000) {
    return `${Math.floor(value / 100_000) * 100} rb+`;
  }

  return new Intl.NumberFormat("id-ID").format(value);
}
