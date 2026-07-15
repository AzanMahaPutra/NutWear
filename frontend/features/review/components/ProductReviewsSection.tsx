"use client";

import { Product } from "@/types/product";
import { RatingStars } from "@/components/ui/RatingStars";
import { ReviewCard, ReviewCardData } from "@/features/review/components/ReviewCard";
import { EmptyState } from "@/components/shared/EmptyState";

interface ProductReviewsSectionProps {
  product: Product;
  reviews: ReviewCardData[];
}

/**
 * Section "Ulasan" di Detail Produk: ringkasan rating + daftar review.
 *
 * UPDATE 7 — Perbaikan Sistem Ulasan Produk: tombol "Tulis ulasan" langsung dari
 * halaman ini sudah DIHAPUS. User hanya dapat memberi ulasan lewat Riwayat Pesanan,
 * pada produk yang benar-benar sudah dibeli & berstatus Selesai (lihat
 * OrderItemReviewAction di features/order). Section ini sekarang murni menampilkan
 * ulasan yang sudah ada beserta info pembelian aslinya (lihat ReviewCard).
 */
export function ProductReviewsSection({ product, reviews }: ProductReviewsSectionProps) {
  const average =
    reviews.length > 0 ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)) : 0;

  return (
    <div className="mt-10">
      <h2 className="mb-4 text-xl font-bold text-neutral-900">Ulasan</h2>

      <RatingStars rating={average} reviewCount={reviews.length} size="md" />

      {reviews.length === 0 ? (
        <EmptyState
          title="Belum ada ulasan"
          description={`Ulasan untuk ${product.namaProduk} akan tampil di sini setelah pembeli memberi ulasan lewat Riwayat Pesanan.`}
        />
      ) : (
        <div className="mt-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
