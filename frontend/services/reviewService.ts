import { apiClient } from "@/lib/apiClient";
import { ApiResponse } from "@/lib/apiTypes";

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

  async create(payload: { productId: string; rating: number; comment: string }) {
    const { data } = await apiClient.post<ApiResponse<ReviewApiItem>>("/reviews", payload);
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
