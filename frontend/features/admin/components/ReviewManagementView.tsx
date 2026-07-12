"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { RowActions } from "@/components/shared/RowActions";
import { RatingStars } from "@/components/ui/RatingStars";
import { reviewService } from "@/services/reviewService";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { formatDate } from "@/utils/formatDate";
import { cn } from "@/utils/cn";

interface AdminReviewItem {
  id: string;
  productName?: string;
  productSku?: string | null;
  productThumbnail?: string | null;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

type RatingFilter = "all" | 5 | 4 | 3 | 2 | 1;

const FILTERS: { value: RatingFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: 5, label: "Bintang 5" },
  { value: 4, label: "Bintang 4" },
  { value: 3, label: "Bintang 3" },
  { value: 2, label: "Bintang 2" },
  { value: 1, label: "Bintang 1" },
];

/**
 * View Manajemen Review Admin — fetch dari Review API sungguhan (GET /reviews, admin only),
 * menampilkan produk yang direview (thumbnail, nama, SKU) + filter berdasarkan rating,
 * moderasi (hapus) lewat DELETE /reviews/:id.
 */
export function ReviewManagementView() {
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    setIsLoading(true);
    reviewService
      .getAll({ rating: ratingFilter === "all" ? undefined : ratingFilter })
      .then(setReviews)
      .catch((err) => showToast(getApiErrorMessage(err, "Gagal memuat ulasan"), "error"))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratingFilter]);

  async function handleDelete(id: string) {
    try {
      await reviewService.remove(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      showToast("Ulasan dihapus");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setRatingFilter(f.value)}
            className={cn(
              "flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              ratingFilter === f.value
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
            )}
          >
            {f.value !== "all" && <Star className="h-3 w-3 fill-current" />}
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        rowKey={(r) => r.id}
        data={reviews}
        emptyTitle={isLoading ? "Memuat..." : "Belum ada ulasan"}
        columns={[
          {
            key: "produk",
            header: "Produk",
            render: (r) => (
              <div className="flex items-center gap-2.5">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                  {r.productThumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.productThumbnail} alt={r.productName ?? "Produk"} className="h-full w-full object-cover" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-neutral-900">{r.productName ?? "-"}</p>
                  <p className="text-xs text-neutral-500">SKU: {r.productSku ?? "-"}</p>
                </div>
              </div>
            ),
          },
          { key: "user", header: "Pengguna", render: (r) => r.userName },
          { key: "rating", header: "Rating", render: (r) => <RatingStars rating={r.rating} /> },
          { key: "komentar", header: "Komentar", render: (r) => <span className="line-clamp-2 max-w-xs">{r.comment}</span> },
          { key: "tanggal", header: "Tanggal", render: (r) => formatDate(r.createdAt) },
          {
            key: "aksi",
            header: "Aksi",
            render: (r) => <RowActions onDelete={() => handleDelete(r.id)} />,
          },
        ]}
      />
    </div>
  );
}
