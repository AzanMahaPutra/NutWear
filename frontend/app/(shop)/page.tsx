import type { Metadata } from "next";
import { HeroBanner } from "@/features/home/components/HeroBanner";
import { CategoryGrid } from "@/features/home/components/CategoryGrid";
import { PromoBanner } from "@/features/home/components/PromoBanner";
import { ProductRail } from "@/features/home/components/ProductRail";
import { productService } from "@/services/productService";
import { bannerService } from "@/services/bannerService";
import { heroBannerService } from "@/services/heroBannerService";

export const metadata: Metadata = {
  title: "Beranda",
  description: "Belanja koleksi terbaru pakaian kasual pria dan wanita di NutWear.",
};

/**
 * PENTING — soal caching/statis:
 * Tanpa baris `revalidate` di bawah ini, Next.js akan menganggap halaman ini
 * 100% statis (tidak ada cookies/headers/searchParams yang dipakai), lalu
 * Vercel akan me-render-nya SEKALI saat `next build` dan membekukan hasilnya
 * jadi HTML statis. Efeknya: banner/hero banner yang ditambah, dihapus, atau
 * diubah urutannya lewat Admin Dashboard TIDAK PERNAH muncul di Beranda
 * sampai ada deploy ulang manual di Vercel — karena halaman publik tidak
 * pernah fetch ulang ke backend Railway.
 *
 * `revalidate = 30` mengaktifkan ISR (Incremental Static Regeneration):
 * Next.js tetap menyajikan HTML yang sudah di-cache (cepat), tapi setiap kali
 * ada request setelah 30 detik berlalu sejak render terakhir, Next.js akan
 * fetch ulang data dari backend di background lalu memperbarui cache untuk
 * request berikutnya. Jadi perubahan dari Admin Dashboard akan otomatis
 * tampil di Beranda dalam waktu maksimal ~30 detik, tanpa perlu redeploy.
 */
export const revalidate = 30;

/**
 * Server Component — data diambil langsung dari Product API, Banner Produk
 * API, dan Hero Banner API sungguhan (dua API terpisah, lihat UPDATE 2:
 * Hero Banner tidak lagi berbagi data dengan Banner Produk).
 *
 * Catatan jujur soal keterbatasan data publik:
 * Backend tidak memiliki endpoint publik "produk terlaris" (agregasi penjualan
 * hanya tersedia di Admin Dashboard API yang butuh auth admin). Karena itu,
 * "Produk Terbaru" diurutkan dari created_at, sedangkan "Produk Terlaris" dan
 * "Produk Rekomendasi" untuk saat ini menampilkan katalog yang sama dengan
 * urutan berbeda. Ini bisa ditingkatkan nanti dengan endpoint publik
 * `/products?sort=terlaris` di backend tanpa mengubah struktur halaman ini.
 */
export default async function HomePage() {
  const [{ items: products }, banners, heroBanners] = await Promise.all([
    productService.getAll({ pageSize: 12 }),
    bannerService.getAll({ activeOnly: true }).catch(() => []),
    heroBannerService.getAll({ activeOnly: true }).catch(() => []),
  ]);

  const sortedBanners = [...banners].sort((a, b) => a.sortOrder - b.sortOrder);
  const sortedHeroBanners = [...heroBanners].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <HeroBanner banners={sortedHeroBanners} />
      <CategoryGrid />

      {sortedBanners.length > 0 && (
        <div className="flex flex-col gap-6 py-6 md:gap-10 md:py-10">
          {sortedBanners.map((banner) => (
            <PromoBanner key={banner.id} banner={banner} />
          ))}
        </div>
      )}

      <ProductRail title="Produk Terbaru" products={products} />
      <ProductRail title="Produk Terlaris" products={products} />
      <ProductRail title="Produk Rekomendasi" products={products} />
    </>
  );
}

