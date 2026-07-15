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

  async getAll(params: { rating?: number } = {}) {
    const { data } = await apiClient.get<ApiResponse<ReviewApiItem[]>>("/reviews", { params });
    return data.data;
  },

  async remove(id: string) {
    await apiClient.delete(`/reviews/${id}`);
  },
};
