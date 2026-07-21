import { apiClient } from "@/lib/apiClient";
import { ApiResponse } from "@/lib/apiTypes";

/** UPDATE 7 — info pembelian sebenarnya (dari order_items) yang mendasari ulasan ini.
 * null untuk ulasan lama (dibuat sebelum UPDATE 7) yang belum tertaut ke pesanan. */
export interface ReviewPurchaseInfo {
  productName?: string | null;
  ukuran?: string | null;
  warna?: string | null;
  quantity?: number | null;
}

// UPDATE — Moderasi Review: status "ditampilkan" (tampil ke publik) atau
// "disembunyikan" (hanya terlihat di Review Admin).
export type ReviewStatus = "ditampilkan" | "disembunyikan";

interface ReviewApiItem {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string | null;
  productThumbnail?: string | null;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  orderId?: string | null;
  purchaseInfo?: ReviewPurchaseInfo | null;
  status: ReviewStatus;
}

interface ReviewSummary {
  average: number;
  count: number;
}

export const reviewService = {
  async getByProduct(productId: string) {
    const { data } = await apiClient.get<ApiResponse<ReviewApiItem[]> & { meta: ReviewSummary }>(
      `/reviews/product/${productId}`
    );
    return { items: data.data, summary: data.meta ?? { average: 0, count: 0 } };
  },

  /** UPDATE 7 — ulasan hanya bisa dibuat dari sebuah item pesanan (orderId + orderItemId)
   * yang produknya sudah dibeli & pesanannya berstatus Selesai (divalidasi backend). */
  async create(payload: { orderId: string; orderItemId: string; productId: string; rating: number; comment: string }) {
    const { data } = await apiClient.post<ApiResponse<ReviewApiItem>>("/reviews", payload);
    return data.data;
  },

  /** UPDATE 7 — Edit Ulasan: UPDATE terhadap ulasan yang sudah ada, bukan membuat baru. */
  async update(id: string, payload: { rating: number; comment: string }) {
    const { data } = await apiClient.put<ApiResponse<ReviewApiItem>>(`/reviews/${id}`, payload);
    return data.data;
  },

  // UPDATE — Filter Review berdasarkan Produk (Review Admin): `productId` opsional,
  // diteruskan sebagai query string dan difilter di backend/database, bukan di frontend,
  // supaya tetap ringan walau jumlah review sudah banyak. Bisa dipakai bersamaan
  // dengan filter `rating` yang sudah ada.
  async getAll(params: { rating?: number; productId?: string } = {}) {
    const { data } = await apiClient.get<ApiResponse<ReviewApiItem[]>>("/reviews", { params });
    return data.data;
  },

  async remove(id: string) {
    await apiClient.delete(`/reviews/${id}`);
  },

  // UPDATE — Moderasi Review: Admin menyembunyikan/menampilkan review tanpa
  // menghapusnya dari database.
  async updateStatus(id: string, status: ReviewStatus) {
    const { data } = await apiClient.patch<ApiResponse<ReviewApiItem>>(`/reviews/${id}/status`, { status });
    return data.data;
  },
};
