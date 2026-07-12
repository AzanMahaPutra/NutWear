/**
 * Menerka kode warna hex dari nama warna varian (mis. "65 BLUE" -> biru).
 * Database hanya menyimpan nama warna (product_variants.warna), bukan hex,
 * jadi ini murni bantuan visual di frontend, reusable di ProductCard & Detail Produk.
 */
const COLOR_KEYWORDS: Record<string, string> = {
  blue: "#5B7C99",
  navy: "#243B53",
  white: "#F5F5F0",
  black: "#1A1A1A",
  red: "#A6303B",
  beige: "#D8CBB8",
  cream: "#E6D9BE",
  gray: "#5A5A5A",
  grey: "#5A5A5A",
  olive: "#9C8A5B",
  green: "#4B6B4A",
  brown: "#4A3B2C",
  yellow: "#E8C547",
  pink: "#E0A9B8",
  orange: "#D3722A",
  purple: "#6B4C7A",
};

export function deriveHexFromColorName(colorName: string): string {
  const lower = colorName.toLowerCase();
  const match = Object.keys(COLOR_KEYWORDS).find((keyword) => lower.includes(keyword));
  return match ? COLOR_KEYWORDS[match] : "#A3A3A3";
}
