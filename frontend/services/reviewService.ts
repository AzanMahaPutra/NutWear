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

// UPDATE — Review Helpful: pilihan vote "Membantu" atau "Tidak Membantu".
export type ReviewVote = "membantu" | "tidak_membantu";

export interface ReviewHelpfulVotes {
  membantu: number;
  tidakMembantu: number;
}

// UPDATE — Balasan Review oleh Admin: null kalau review ini belum dibalas.
export interface ReviewAdminReply {
  message: string;
  repliedAt: string;
  repliedByName: string;
}

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
  helpfulVotes: ReviewHelpfulVotes;
  myVote: ReviewVote | null;
  adminReply: ReviewAdminReply | null;
}

interface ReviewSummary {
  average: number;
  count: number;
}

interface VoteResult {
  reviewId: string;
  helpfulVotes: ReviewHelpfulVotes;
  myVote: ReviewVote | null;
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

  // UPDATE — Review Helpful: beri vote baru ATAU ganti pilihan vote yang sudah ada.
  async vote(reviewId: string, vote: ReviewVote) {
    const { data } = await apiClient.post<ApiResponse<VoteResult>>(`/reviews/${reviewId}/vote`, { vote });
    return data.data;
  },

  // UPDATE — Review Helpful: hapus vote milik user yang sedang login pada review ini.
  async removeVote(reviewId: string) {
    const { data } = await apiClient.delete<ApiResponse<VoteResult>>(`/reviews/${reviewId}/vote`);
    return data.data;
  },

  // UPDATE — Balasan Review oleh Admin: kirim balasan baru ATAU edit balasan
  // yang sudah ada (endpoint yang sama).
  async reply(reviewId: string, message: string) {
    const { data } = await apiClient.post<ApiResponse<ReviewApiItem>>(`/reviews/${reviewId}/reply`, { message });
    return data.data;
  },

  // UPDATE — Balasan Review oleh Admin: Hapus Balasan.
  async deleteReply(reviewId: string) {
    const { data } = await apiClient.delete<ApiResponse<ReviewApiItem>>(`/reviews/${reviewId}/reply`);
    return data.data;
  },
};
