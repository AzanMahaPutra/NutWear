import { RatingStars } from "@/components/ui/RatingStars";
import { formatDate } from "@/utils/formatDate";

export interface ReviewCardData {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

/**
 * Kartu ulasan reusable — dipakai di section Ulasan Detail Produk.
 * Field disesuaikan dengan skema tabel `reviews` sungguhan (user, rating, comment,
 * created_at saja — tidak ada kolom ukuran/warna yang dibeli atau fit feedback).
 */
export function ReviewCard({ review }: { review: ReviewCardData }) {
  return (
    <div className="border-b border-neutral-100 py-6">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-neutral-900">{review.userName}</h4>
        <span className="text-xs text-neutral-400">{formatDate(review.createdAt)}</span>
      </div>

      <RatingStars rating={review.rating} />

      <p className="mt-3 text-sm text-neutral-700">{review.comment}</p>
    </div>
  );
}
