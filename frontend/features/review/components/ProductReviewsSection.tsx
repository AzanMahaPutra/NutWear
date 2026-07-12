"use client";

import { useState } from "react";
import { PenLine } from "lucide-react";
import { Product } from "@/types/product";
import { RatingStars } from "@/components/ui/RatingStars";
import { ReviewCard, ReviewCardData } from "@/features/review/components/ReviewCard";
import { WriteReviewForm } from "@/features/review/components/WriteReviewForm";
import { EmptyState } from "@/components/shared/EmptyState";
import { Modal } from "@/components/ui/Modal";

interface ProductReviewsSectionProps {
  product: Product;
  reviews: ReviewCardData[];
}

/**
 * Section "Ulasan" di Detail Produk: ringkasan rating + daftar review + form kirim ulasan.
 * Data awal dari Review API (server-fetched di page.tsx), ulasan baru ditambahkan
 * secara optimistic ke state lokal setelah berhasil dikirim.
 */
export function ProductReviewsSection({ product, reviews: initialReviews }: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [formOpen, setFormOpen] = useState(false);

  const average =
    reviews.length > 0 ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)) : 0;

  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-900">Ulasan</h2>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-1 text-sm font-medium text-neutral-700 underline"
        >
          <PenLine className="h-4 w-4" /> Tulis ulasan
        </button>
      </div>

      <RatingStars rating={average} reviewCount={reviews.length} size="md" />

      {reviews.length === 0 ? (
        <EmptyState title="Belum ada ulasan" description="Jadilah yang pertama memberi ulasan untuk produk ini." />
      ) : (
        <div className="mt-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Tulis Ulasan">
        <WriteReviewForm
          productId={product.id}
          onSuccess={(review) => {
            setReviews((prev) => [review, ...prev]);
            setFormOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
