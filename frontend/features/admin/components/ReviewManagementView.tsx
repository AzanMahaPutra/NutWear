"use client";

import { useEffect, useState } from "react";
import { Star, Eye, EyeOff, MessageSquare, MessageSquareText, Search, X } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { RowActions } from "@/components/shared/RowActions";
import { RatingStars } from "@/components/ui/RatingStars";
import { reviewService, ReviewStatus, ReviewAdminReply } from "@/services/reviewService";
import { useAdminCategoryStore } from "@/stores/adminCategoryStore";
import { useToastStore } from "@/stores/toastStore";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { formatDate } from "@/utils/formatDate";
import { cn } from "@/utils/cn";
import { ReviewReplyModal } from "@/features/admin/components/ReviewReplyModal";

interface AdminReviewItem {
  id: string;
  productName?: string;
  productSku?: string | null;
  productThumbnail?: string | null;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  status: ReviewStatus;
  // UPDATE — Balasan Review oleh Admin: null kalau review ini belum dibalas.
  adminReply: ReviewAdminReply | null;
}

// UPDATE — Moderasi Review: badge status di tabel Review Admin supaya Admin
// tahu review mana yang sedang aktif (tampil ke publik) dan mana yang disembunyikan.
const STATUS_LABEL: Record<ReviewStatus, string> = {
  ditampilkan: "Ditampilkan",
  disembunyikan: "Disembunyikan",
};

const STATUS_COLOR: Record<ReviewStatus, string> = {
  ditampilkan: "bg-emerald-50 text-emerald-700",
  disembunyikan: "bg-neutral-100 text-neutral-500",
};

type RatingFilter = "all" | 5 | 4 | 3 | 2 | 1;

const FILTERS: { value: RatingFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: 5, label: "Bintang 5" },
  { value: 4, label: "Bintang 4" },
  { value: 3, label: "Bintang 3" },
  { value: 2, label: "Bintang 2" },
  { value: 1, label: "Bintang 1" },
];

// UPDATE — Search & Filter Kategori: "all" berarti tidak difilter berdasarkan
// kategori (menampilkan review dari seluruh kategori produk seperti semula).
const ALL_CATEGORIES = "all";

/**
 * View Manajemen Review Admin — fetch dari Review API sungguhan (GET /reviews, admin only),
 * menampilkan produk yang direview (thumbnail, nama, SKU) + filter rating + moderasi
 * (sembunyikan/tampilkan, hapus) + balas review, lewat endpoint yang sudah ada.
 *
 * UPDATE — Peningkatan Search & Filter: Search Bar tunggal (tampilan sama dengan
 * `ProductManagementView`) mencari berdasarkan Nama Produk (sebagian kata), SKU
 * Produk, ATAU Nama User yang memberi review — plus dropdown Filter Kategori di
 * sebelahnya (diisi dari Category API, sama seperti di halaman Produk Admin).
 * Menggantikan dropdown "Produk" lama (daftar seluruh produk satu per satu jadi
 * tidak praktis begitu jumlah produk sangat banyak — sesuai keluhan yang diminta
 * untuk diperbaiki). Sama seperti sebelumnya, Search & Filter Kategori dikirim
 * sebagai query string ke GET /reviews dan diproses di backend/database (bukan
 * di frontend) — lihat reviewRepository.findAll — supaya tetap ringan walau
 * jumlah review sudah sangat banyak, dan tetap bisa dipakai bersamaan dengan
 * filter Rating & moderasi Status yang sudah ada (semuanya AND, tidak saling
 * merusak).
 */
export function ReviewManagementView() {
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");

  // UPDATE — Search Bar (Nama Produk/SKU/Nama User) + Filter Kategori.
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);

  const [replyingReview, setReplyingReview] = useState<AdminReviewItem | null>(null);
  const showToast = useToastStore((s) => s.showToast);

  // UPDATE — Filter Kategori: dropdown diisi dari Category API sungguhan (bukan
  // ditulis manual), pakai store yang sama persis dengan halaman Produk Admin
  // supaya konsisten & tidak ada request tambahan kalau store ini sudah pernah dimuat.
  const categories = useAdminCategoryStore((s) => s.categories);
  const fetchCategories = useAdminCategoryStore((s) => s.fetchCategories);

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setIsLoading(true);
    reviewService
      .getAll({
        rating: ratingFilter === "all" ? undefined : ratingFilter,
        categoryId: categoryFilter === ALL_CATEGORIES ? undefined : categoryFilter,
        search: debouncedSearch.trim() || undefined,
      })
      .then(setReviews)
      .catch((err) => showToast(getApiErrorMessage(err, "Gagal memuat ulasan"), "error"))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratingFilter, categoryFilter, debouncedSearch]);

  async function handleDelete(id: string) {
    try {
      await reviewService.remove(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      showToast("Ulasan dihapus");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  // UPDATE — Moderasi Review: sembunyikan/tampilkan review tanpa menghapusnya
  // dari database. Status baru langsung dipakai untuk update state lokal
  // supaya badge & tombol di tabel langsung berubah tanpa perlu refetch.
  async function handleToggleStatus(review: AdminReviewItem) {
    const nextStatus: ReviewStatus = review.status === "ditampilkan" ? "disembunyikan" : "ditampilkan";
    try {
      const updated = await reviewService.updateStatus(review.id, nextStatus);
      setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, status: updated.status } : r)));
      showToast(updated.status === "disembunyikan" ? "Ulasan disembunyikan" : "Ulasan ditampilkan kembali");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  // UPDATE — Balasan Review oleh Admin: dipanggil ReviewReplyModal setelah
  // balasan berhasil dikirim/diedit/dihapus, supaya tabel langsung update
  // tanpa perlu refetch seluruh daftar review.
  function handleReplySaved(reviewId: string, adminReply: ReviewAdminReply | null) {
    setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, adminReply } : r)));
    setReplyingReview(null);
  }

  function handleResetFilter() {
    setSearchInput("");
    setCategoryFilter(ALL_CATEGORIES);
    setRatingFilter("all");
  }

  const isFilterActive = debouncedSearch.trim().length > 0 || categoryFilter !== ALL_CATEGORIES || ratingFilter !== "all";

  const emptyTitle = isLoading
    ? "Memuat..."
    : isFilterActive
    ? "Tidak ada ulasan yang sesuai dengan pencarian."
    : "Belum ada ulasan";

  return (
    <div className="p-6">
      {/* UPDATE — Search Bar (Nama Produk/SKU/Nama User) + Filter Kategori:
          Desktop → Search Bar di kiri, dropdown Kategori di kanan (flex-row).
          Mobile → ditumpuk vertikal (flex-col) kalau ruang tidak cukup, sama
          persis dengan pola layout di ProductManagementView. */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari nama produk, SKU, atau nama pengguna..."
            className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-sm text-neutral-900 outline-none focus:border-neutral-900"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-900 sm:w-56"
        >
          <option value={ALL_CATEGORIES}>Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.namaKategori}
            </option>
          ))}
        </select>

        {isFilterActive && (
          <button
            type="button"
            onClick={handleResetFilter}
            className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-neutral-200 px-3 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 sm:w-auto"
          >
            <X className="h-3.5 w-3.5" /> Reset Filter
          </button>
        )}
      </div>

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
        emptyTitle={emptyTitle}
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
          {
            key: "komentar",
            header: "Komentar",
            render: (r) => (
              <span className={cn("line-clamp-2 max-w-xs", r.status === "disembunyikan" && "text-neutral-400")}>
                {r.comment}
              </span>
            ),
          },
          { key: "tanggal", header: "Tanggal", render: (r) => formatDate(r.createdAt) },
          {
            key: "status",
            header: "Status",
            render: (r) => (
              <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", STATUS_COLOR[r.status])}>
                {STATUS_LABEL[r.status]}
              </span>
            ),
          },
          {
            key: "aksi",
            header: "Aksi",
            render: (r) => (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(r)}
                  className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-100"
                >
                  {r.status === "disembunyikan" ? (
                    <>
                      <Eye className="h-3.5 w-3.5" /> Tampilkan Review
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5" /> Sembunyikan Review
                    </>
                  )}
                </button>
                {/* UPDATE — Balasan Review oleh Admin: tombol berubah menjadi
                    "Edit Balasan" kalau review ini sudah pernah dibalas. */}
                <button
                  type="button"
                  onClick={() => setReplyingReview(r)}
                  className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-100"
                >
                  {r.adminReply ? (
                    <>
                      <MessageSquareText className="h-3.5 w-3.5" /> Edit Balasan
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-3.5 w-3.5" /> Balas
                    </>
                  )}
                </button>
                <RowActions onDelete={() => handleDelete(r.id)} />
              </div>
            ),
          },
        ]}
      />

      <ReviewReplyModal review={replyingReview} onClose={() => setReplyingReview(null)} onSaved={handleReplySaved} />
    </div>
  );
}
