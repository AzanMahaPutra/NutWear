/**
 * Memanggil route handler internal `/api/revalidate` (lihat
 * app/api/revalidate/route.ts) supaya Vercel langsung membuang cache halaman
 * Beranda setelah admin mengubah data banner / hero banner.
 *
 * Sengaja "fire and forget" (tidak dilempar ke pemanggil) — kalau panggilan
 * ini gagal, data di database tetap tersimpan dengan benar, hanya saja
 * tampilan publik akan ikut ter-update lewat jadwal ISR biasa (maks. 30
 * detik) alih-alih seketika. Jadi gagalnya endpoint ini tidak boleh membuat
 * aksi admin (tambah/edit/hapus/reorder) terlihat gagal.
 */
export async function revalidateHomepage() {
  try {
    await fetch("/api/revalidate", { method: "POST" });
  } catch {
    // Sengaja diabaikan — lihat catatan di atas.
  }
}
