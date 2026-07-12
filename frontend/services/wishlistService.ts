import { apiClient } from "@/lib/apiClient";
import { ApiResponse } from "@/lib/apiTypes";

export interface WishlistApiItem {
  id: string;
  productId: string;
  namaProduk: string;
  slug: string;
  harga: number;
  hargaPromo: number | null;
  hargaPromoColor: string;
  isPromoActive: boolean;
  imageUrl: string | null;
  createdAt: string;
}

export const wishlistService = {
  async getAll() {
    const { data } = await apiClient.get<ApiResponse<WishlistApiItem[]>>("/wishlist");
    return data.data;
  },

  async add(productId: string) {
    await apiClient.post("/wishlist", { productId });
  },

  async remove(productId: string) {
    await apiClient.delete(`/wishlist/${productId}`);
  },
};
