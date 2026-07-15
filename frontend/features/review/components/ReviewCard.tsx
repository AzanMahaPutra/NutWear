import { RatingStars } from "@/components/ui/RatingStars";
import { formatDate } from "@/utils/formatDate";
import { ReviewPurchaseInfo } from "@/services/reviewService";

export interface ReviewCardData {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  /** UPDATE 7 — info pembelian sebenarnya (Nama Produk/Ukuran/Warna/Jumlah Dibeli)
   * dari pesanan yang menjadi sumber ulasan ini. null untuk ulasan lama yang belum
   * tertaut ke pesanan. */
  purchaseInfo?: ReviewPurchaseInfo | null;
}

/**
 * Kartu ulasan reusable — dipakai di section Ulasan Detail Produk.
 * UPDATE 7 — menampilkan info pembelian sebenarnya (dari order_items pesanan
 * yang menjadi sumber ulasan ini, bukan data statis/hardcode) di bawah komentar.
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

      {review.purchaseInfo && (
        <div className="mt-3 space-y-0.5 rounded-md bg-neutral-50 p-3 text-xs text-neutral-500">
          <p>
            Nama Produk: <span className="font-medium text-neutral-700">{review.purchaseInfo.productName ?? "-"}</span>
          </p>
          <p>
            Ukuran: <span className="font-medium text-neutral-700">{review.purchaseInfo.ukuran ?? "-"}</span>
          </p>
          <p>
            Warna: <span className="font-medium text-neutral-700">{review.purchaseInfo.warna ?? "-"}</span>
          </p>
          <p>
            Jumlah Dibeli: <span className="font-medium text-neutral-700">{review.purchaseInfo.quantity ?? "-"}</span>
          </p>
        </div>
      )}
    </div>
  );
}
