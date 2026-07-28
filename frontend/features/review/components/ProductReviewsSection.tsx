"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types/product";
import { RatingStars } from "@/components/ui/RatingStars";
import { ReviewCard, ReviewCardData } from "@/features/review/components/ReviewCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { reviewService } from "@/services/reviewService";
import { useAuthStore } from "@/stores/authStore";

interface ProductReviewsSectionProps {
  product: Product;
  reviews: ReviewCardData[];
  /** UPDATE — Balasan Review oleh Admin (Notifikasi): id review yang dituju saat
   * user menekan notifikasi "Review Anda Telah Dibalas" (dari query string
   * `?reviewId=...`, lihat page.tsx). Review ini otomatis di-scroll ke tampilan
   * & di-highlight sementara supaya mudah ditemukan. */
  highlightReviewId?: string;
}

// Highlight otomatis hilang setelah beberapa saat supaya tidak permanen mengubah
// tampilan review — cukup membantu user menemukannya sesaat setelah membuka notifikasi.
const HIGHLIGHT_DURATION_MS = 4000;

/**
 * Section "Ulasan" di Detail Produk: ringkasan rating + daftar review.
 *
 * UPDATE 7 — Perbaikan Sistem Ulasan Produk: tombol "Tulis ulasan" langsung dari
 * halaman ini sudah DIHAPUS. User hanya dapat memberi ulasan lewat Riwayat Pesanan,
 * pada produk yang benar-benar sudah dibeli & berstatus Selesai (lihat
 * OrderItemReviewAction di features/order). Section ini sekarang murni menampilkan
 * ulasan yang sudah ada beserta info pembelian aslinya (lihat ReviewCard).
 */
export function ProductReviewsSection({ product, reviews: initialReviews, highlightReviewId }: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [activeHighlightId, setActiveHighlightId] = useState<string | undefined>(highlightReviewId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const average =
    reviews.length > 0 ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)) : 0;

  // UPDATE — Review Helpful: halaman ini dirender di server (tanpa access token
  // browser), jadi `myVote` dari SSR selalu null. Kalau user ternyata sedang
  // login, ambil ulang daftar review lewat browser (yang membawa access token)
  // supaya tombol vote menampilkan pilihan yang benar sejak awal.
  useEffect(() => {
    if (!isAuthenticated) return;
    reviewService
      .getByProduct(product.id)
      .then(({ items }) => setReviews(items))
      .catch(() => {});
  }, [isAuthenticated, product.id]);

  // UPDATE — Balasan Review oleh Admin (Notifikasi): scroll ke review yang dituju
  // begitu section ini tampil, lalu hapus highlight-nya setelah beberapa saat.
  useEffect(() => {
    if (!highlightReviewId) return;

    const el = document.getElementById(`review-${highlightReviewId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });

    const timer = setTimeout(() => setActiveHighlightId(undefined), HIGHLIGHT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [highlightReviewId]);

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
            <ReviewCard key={review.id} review={review} highlighted={review.id === activeHighlightId} />
          ))}
        </div>
      )}
    </div>
  );
}
