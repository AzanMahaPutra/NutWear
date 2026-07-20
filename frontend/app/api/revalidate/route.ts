import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Endpoint internal (bukan bagian dari backend Railway) yang dipanggil oleh
 * frontend sendiri setelah admin berhasil tambah/edit/hapus/reorder banner
 * atau hero banner. Tujuannya: membuang cache halaman Beranda ("/") saat itu
 * juga, supaya perubahan langsung tampil tanpa menunggu jadwal ISR
 * (revalidate = 30 detik di app/(shop)/page.tsx) ataupun redeploy manual.
 *
 * Catatan jujur soal keamanan: endpoint ini SENGAJA tidak diberi secret,
 * karena store admin yang memanggilnya berjalan di client component — kalau
 * secret-nya disimpan lewat env var NEXT_PUBLIC_*, secret itu otomatis ikut
 * ter-bundle ke JS yang dikirim ke browser, jadi bukan rahasia lagi. Ini
 * cukup aman untuk dibiarkan terbuka karena `revalidatePath` murah dan
 * idempoten (dampak terburuk kalau disalahgunakan cuma memicu Vercel fetch
 * ulang data dari Railway lebih sering, bukan kebocoran/perubahan data).
 * Kalau nanti mau diperketat, cara yang benar adalah memverifikasi cookie
 * refresh token admin (bukan secret statis di kode client).
 */
export async function POST() {
  revalidatePath("/");
  return NextResponse.json({ revalidated: true, path: "/", now: Date.now() });
}
