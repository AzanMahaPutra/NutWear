import { apiClient } from "@/lib/apiClient";
import { ApiResponse } from "@/lib/apiTypes";

export type StockStatus = "aman" | "menipis" | "habis";

export interface LowStockVariant {
  variantId: string;
  ukuran: string;
  warna: string;
  sku: string;
  stok: number;
  status: StockStatus;
}

export interface LowStockProduct {
  productId: string;
  namaProduk: string;
  slug: string;
  variants: LowStockVariant[];
}

export interface LowStockReport {
  minimumStock: number;
  items: LowStockProduct[];
}

/**
 * Service Stok — dipakai widget "Stok Menipis" di Dashboard Admin, filter
 * "Tampilkan hanya stok menipis" di Manajemen Produk, dan Pengaturan Batas
 * Minimum Stok. Bentuk response backend sudah camelCase (lihat
 * stockController.js/stockService.js backend).
 */
export const stockService = {
  async getLowStock() {
    const { data } = await apiClient.get<ApiResponse<LowStockReport>>("/stock/low-stock");
    return data.data;
  },

  async getMinimumStock() {
    const { data } = await apiClient.get<ApiResponse<{ minimumStock: number }>>("/stock/settings");
    return data.data.minimumStock;
  },

  async updateMinimumStock(minimumStock: number) {
    const { data } = await apiClient.put<ApiResponse<{ minimumStock: number }>>("/stock/settings", { minimumStock });
    return data.data.minimumStock;
  },
};
