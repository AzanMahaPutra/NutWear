"use client";

import { useEffect, useState } from "react";
import { Star, Eye, EyeOff } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { RowActions } from "@/components/shared/RowActions";
import { RatingStars } from "@/components/ui/RatingStars";
import { reviewService, ReviewStatus } from "@/services/reviewService";
import { productService } from "@/services/productService";
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
  status: ReviewStatus;
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

// UPDATE — Filter Review berdasarkan Produk. "all" berarti tidak difilter
// berdasarkan produk (menampilkan review dari seluruh produk seperti semula).
const ALL_PRODUCTS = "all";

interface ProductOption {
  id: string;
  namaProduk: string;
}

/**
 * View Manajemen Review Admin — fetch dari Review API sungguhan (GET /reviews, admin only),
 * menampilkan produk yang direview (thumbnail, nama, SKU) + filter berdasarkan rating,
 * moderasi (hapus) lewat DELETE /reviews/:id.
 *
 * UPDATE — Filter berdasarkan Produk: dropdown "Produk" diisi dari seluruh produk
 * di database (Product API, GET /products). Filter Produk & filter Rating dikirim
 * bersamaan sebagai query string ke GET /reviews dan difilter di backend/database
 * (bukan di frontend) supaya performa tetap baik walau jumlah review sudah banyak.
 */
export function ReviewManagementView() {
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [productFilter, setProductFilter] = useState<string>(ALL_PRODUCTS);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const showToast = useToastStore((s) => s.showToast);

  // UPDATE — Ambil seluruh produk (pageSize besar) sekali di awal untuk mengisi
  // dropdown "Produk". Ini hanya untuk isi dropdown, tidak dipakai memfilter review
  // di frontend — filter review tetap dilakukan lewat query ke backend di bawah.
  useEffect(() => {
    productService
      .getAll({ pageSize: 1000 })
      .then(({ items }) => setProductOptions(items.map((p) => ({ id: p.id, namaProduk: p.namaProduk }))))
      .catch((err) => showToast(getApiErrorMessage(err, "Gagal memuat daftar produk"), "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setIsLoading(true);
    reviewService
      .getAll({
        rating: ratingFilter === "all" ? undefined : ratingFilter,
        productId: productFilter === ALL_PRODUCTS ? undefined : productFilter,
      })
      .then(setReviews)
      .catch((err) => showToast(getApiErrorMessage(err, "Gagal memuat ulasan"), "error"))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratingFilter, productFilter]);

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

  return (
    <div className="p-6">
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-semibold text-neutral-600">Produk</label>
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-900 sm:w-80"
        >
          <option value={ALL_PRODUCTS}>Semua Produk</option>
          {productOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.namaProduk}
            </option>
          ))}
        </select>
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
                <RowActions onDelete={() => handleDelete(r.id)} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
