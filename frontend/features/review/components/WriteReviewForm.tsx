"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { reviewService } from "@/services/reviewService";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { cn } from "@/utils/cn";
import { ReviewCardData } from "@/features/review/components/ReviewCard";

const reviewSchema = z.object({
  comment: z.string().min(5, "Ulasan minimal 5 karakter").max(1000),
});
type ReviewFormValues = z.infer<typeof reviewSchema>;

interface WriteReviewFormProps {
  productId: string;
  onSuccess: (review: ReviewCardData) => void;
}

/**
 * Form kirim ulasan (rating bintang + komentar) — memanggil Review API sungguhan.
 */
export function WriteReviewForm({ productId, onSuccess }: WriteReviewFormProps) {
  const [rating, setRating] = useState(5);
  const showToast = useToastStore((s) => s.showToast);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormValues>({ resolver: zodResolver(reviewSchema) });

  async function onSubmit(values: ReviewFormValues) {
    try {
      const review = await reviewService.create({ productId, rating, comment: values.comment });
      showToast("Ulasan berhasil dikirim");
      onSuccess({
        id: review.id,
        userName: review.userName,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      });
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal mengirim ulasan"), "error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button key={i} type="button" onClick={() => setRating(i + 1)}>
            <Star className={cn("h-6 w-6", i < rating ? "fill-neutral-900 text-neutral-900" : "text-neutral-300")} />
          </button>
        ))}
      </div>

      <textarea
        {...register("comment")}
        rows={4}
        placeholder="Bagikan pengalamanmu dengan produk ini..."
        className="w-full rounded-lg border border-neutral-200 p-3 text-sm outline-none focus:border-neutral-900"
      />
      {errors.comment && <p className="text-xs text-red-500">{errors.comment.message}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isSubmitting ? "Mengirim..." : "Kirim Ulasan"}
      </button>
    </form>
  );
}
