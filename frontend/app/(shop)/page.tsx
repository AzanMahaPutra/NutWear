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
 * BUG FIX — "Produk Rekomendasi" SEBELUMNYA ikut memakai `products` yang sama
 * di atas (bug: section itu jadi identik dengan halaman Semua Produk). Sekarang
 * diambil lewat request terpisah dengan filter `recommended: true`, yang benar-
 * benar difilter di backend (`is_recommended = true`, lihat
 * productRepository.findAll), sehingga hanya produk yang ditandai Admin sebagai
 * Produk Rekomendasi yang tampil di section ini.
 *
 * BUG FIX — "Produk Terlaris" SEBELUMNYA ikut memakai daftar produk yang sama
 * dengan halaman Semua Produk (urutan created_at, tanpa filter penjualan sama
 * sekali), sehingga section itu terlihat identik dengan katalog dan fitur Produk
 * Terlaris tidak berfungsi. Sekarang diambil lewat endpoint publik terpisah
 * `/products/bestsellers`, yang diagregasi & diurutkan di backend berdasarkan
 * jumlah penjualan sungguhan dari transaksi berstatus valid (lihat
 * productRepository.getBestsellerAggregates / productService.getBestsellerProducts).
 */
export default async function HomePage() {
  const [
    { items: newArrivalProducts },
    { items: bestsellerProducts },
    { items: recommendedProducts },
    banners,
    heroBanners,
  ] = await Promise.all([
    productService.getAll({ pageSize: 12, newArrival: true }),
    // BUG FIX — Produk Terlaris: request terpisah ke endpoint agregasi penjualan,
    // BUKAN memakai ulang daftar seluruh produk seperti sebelumnya.
    productService.getBestsellers(12),
    // BUG FIX — Produk Rekomendasi: request terpisah dengan filter is_recommended,
    // BUKAN memakai ulang `products` di atas seperti sebelumnya.
    productService.getAll({ pageSize: 12, recommended: true }),
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

      <ProductRail title="Produk Terbaru" products={newArrivalProducts} emptyMessage="Belum ada produk terbaru." />
      <ProductRail
        title="Produk Terlaris"
        products={bestsellerProducts}
        emptyMessage="Belum ada produk terlaris."
      />
      <ProductRail
        title="Produk Rekomendasi"
        products={recommendedProducts}
        emptyMessage="Belum ada produk rekomendasi."
      />
    </>
  );
}

