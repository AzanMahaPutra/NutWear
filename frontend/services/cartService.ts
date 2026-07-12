import { apiClient } from "@/lib/apiClient";
import { ApiResponse } from "@/lib/apiTypes";

export interface CartApiItem {
  id: string;
  variantId: string;
  productId: string;
  namaProduk: string;
  slug: string;
  imageUrl: string | null;
  warna: string;
  ukuran: string;
  harga: number;
  hargaPromo: number | null;
  hargaPromoColor: string;
  isPromoActive: boolean;
  hargaEfektif: number;
  quantity: number;
  stokTersedia: number;
}

export const cartService = {
  async getAll() {
    const { data } = await apiClient.get<ApiResponse<CartApiItem[]>>("/cart");
    return data.data;
  },

  async add(payload: { variantId: string; quantity: number }) {
    await apiClient.post("/cart", payload);
  },

  async updateQuantity(cartId: string, quantity: number) {
    const { data } = await apiClient.put<ApiResponse<unknown>>(`/cart/${cartId}`, { quantity });
    return data.data;
  },

  async remove(cartId: string) {
    await apiClient.delete(`/cart/${cartId}`);
  },

  async clear() {
    await apiClient.delete("/cart");
  },
};
