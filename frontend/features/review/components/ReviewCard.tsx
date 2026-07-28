"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp, ThumbsDown, BadgeCheck } from "lucide-react";
import { RatingStars } from "@/components/ui/RatingStars";
import { formatDate, formatDateTime } from "@/utils/formatDate";
import {
  ReviewAdminReply,
  ReviewHelpfulVotes,
  ReviewPurchaseInfo,
  ReviewVote,
  reviewService,
} from "@/services/reviewService";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/utils/cn";

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
  /** UPDATE — Review Helpful: jumlah vote & pilihan vote milik user yang sedang
   * login (null kalau belum login/belum vote). */
  helpfulVotes: ReviewHelpfulVotes;
  myVote: ReviewVote | null;
  /** UPDATE — Balasan Review oleh Admin: null kalau review ini belum dibalas. */
  adminReply: ReviewAdminReply | null;
}

interface ReviewCardProps {
  review: ReviewCardData;
  /** UPDATE — Balasan Review oleh Admin (Notifikasi): true sesaat setelah user
   * membuka Detail Produk lewat notifikasi "Review Anda Telah Dibalas", supaya
   * review ini langsung terlihat menonjol & mudah ditemukan (lihat
   * ProductReviewsSection.tsx). */
  highlighted?: boolean;
}

/**
 * Kartu ulasan reusable — dipakai di section Ulasan Detail Produk.
 * UPDATE 7 — menampilkan info pembelian sebenarnya (dari order_items pesanan
 * yang menjadi sumber ulasan ini, bukan data statis/hardcode) di bawah komentar.
 * UPDATE — Review Helpful: tombol Membantu/Tidak Membantu di bagian bawah review,
 * satu user hanya boleh punya satu vote (klik tombol yang sedang aktif untuk
 * membatalkan vote). Mengarahkan ke halaman Login kalau user belum login.
 * UPDATE — Balasan Review oleh Admin: menampilkan card balasan resmi toko (bila
 * ada) di bawah tombol vote, dengan tampilan berbeda dari review customer.
 */
export function ReviewCard({ review, highlighted = false }: ReviewCardProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const showToast = useToastStore((s) => s.showToast);

  const [helpfulVotes, setHelpfulVotes] = useState(review.helpfulVotes);
  const [myVote, setMyVote] = useState(review.myVote);
  const [isVoting, setIsVoting] = useState(false);

  async function handleVote(vote: ReviewVote) {
    if (!isAuthenticated) {
      showToast("Silakan masuk terlebih dahulu untuk memberi vote", "error");
      router.push(ROUTES.login);
      return;
    }
    if (isVoting) return;

    setIsVoting(true);
    try {
      // UPDATE — Review Helpful: menekan tombol yang sedang aktif membatalkan
      // (menghapus) vote milik user. Menekan tombol lain mengganti pilihan.
      const result =
        myVote === vote ? await reviewService.removeVote(review.id) : await reviewService.vote(review.id, vote);
      setHelpfulVotes(result.helpfulVotes);
      setMyVote(result.myVote);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal menyimpan vote"), "error");
    } finally {
      setIsVoting(false);
    }
  }

  return (
    <div
      id={`review-${review.id}`}
      className={cn(
        "border-b border-neutral-100 py-6 transition-colors duration-500",
        highlighted && "rounded-lg border border-neutral-900/10 bg-amber-50/70 px-4"
      )}
    >
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

      {/* UPDATE — Review Helpful */}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-xs text-neutral-500">Apakah ulasan ini membantu?</span>
        <button
          type="button"
          onClick={() => handleVote("membantu")}
          disabled={isVoting}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-60",
            myVote === "membantu"
              ? "border-emerald-600 bg-emerald-50 text-emerald-700"
              : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
          )}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          Membantu ({helpfulVotes.membantu})
        </button>
        <button
          type="button"
          onClick={() => handleVote("tidak_membantu")}
          disabled={isVoting}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-60",
            myVote === "tidak_membantu"
              ? "border-red-500 bg-red-50 text-red-600"
              : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
          )}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
          Tidak Membantu ({helpfulVotes.tidakMembantu})
        </button>
      </div>

      {/* UPDATE — Balasan Review oleh Admin: tampilan berbeda dari review
          customer (background & badge "Official Store") supaya customer langsung
          tahu ini balasan resmi toko. */}
      {review.adminReply && (
        <div className="mt-4 rounded-lg border border-neutral-900/10 bg-neutral-50 p-4">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <BadgeCheck className="h-4 w-4 text-neutral-900" />
            <span className="text-sm font-semibold text-neutral-900">Balasan dari {review.adminReply.repliedByName}</span>
            <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Official Store
            </span>
          </div>
          <p className="mb-2 text-xs text-neutral-400">📅 {formatDateTime(review.adminReply.repliedAt)}</p>
          <p className="whitespace-pre-line text-sm text-neutral-700">{review.adminReply.message}</p>
        </div>
      )}
    </div>
  );
}
