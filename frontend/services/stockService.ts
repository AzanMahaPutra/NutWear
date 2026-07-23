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

// --- UPDATE — Halaman Inventory Stock Admin ---

/** Satu baris varian pada tabel Inventory Stock (lihat stockService.js:getInventory backend). */
export interface InventoryItem {
  variantId: string;
  productId: string;
  namaProduk: string;
  slug: string | null;
  warna: string;
  ukuran: string;
  sku: string;
  stok: number;
  status: StockStatus;
  imageUrl: string | null;
}

export interface InventoryListMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface InventoryFilterParams {
  search?: string;
  status?: StockStatus | "";
  page?: number;
  pageSize?: number;
}

/** Satu baris Riwayat Perubahan Stok (lihat stockService.js:getStockLogs backend). */
export interface StockLogEntry {
  id: string;
  variantId: string;
  namaProduk: string | null;
  ukuran: string | null;
  warna: string | null;
  sku: string | null;
  quantity: number;
  type: "in" | "out" | "adjustment";
  stokSebelum: number | null;
  stokSesudah: number | null;
  selisih: number;
  adminNama: string | null;
  createdAt: string;
}

/**
 * Service Stok — dipakai widget "Stok Menipis" di Dashboard Admin, filter
 * "Tampilkan hanya stok menipis" di Manajemen Produk, Pengaturan Batas
 * Minimum Stok, dan halaman Inventory Stock Admin. Bentuk response backend
 * sudah camelCase (lihat stockController.js/stockService.js backend).
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

  /**
   * Halaman Inventory Stock Admin — search (real-time, debounce di komponen
   * pemanggil), filter Status Stok, dan pagination seluruhnya diproses
   * backend/database (lihat stockRepository.js:findInventory), jadi aman
   * dipanggil ulang di setiap perubahan filter tanpa memuat seluruh data.
   */
  async getInventory(params: InventoryFilterParams = {}) {
    const { data } = await apiClient.get<
      ApiResponse<{ items: InventoryItem[]; minimumStock: number }> & { meta: InventoryListMeta }
    >("/stock/inventory", { params });
    return { items: data.data.items, minimumStock: data.data.minimumStock, meta: data.meta };
  },

  /** Modal Edit Stok (input manual) & tombol Quick Adjustment (+5/+10/-5/-10, dihitung di komponen pemanggil). */
  async setStock(variantId: string, stokBaru: number) {
    const { data } = await apiClient.patch<ApiResponse<{ id: string; stok: number; status: StockStatus }>>(
      `/stock/${variantId}/set`,
      { stokBaru }
    );
    return data.data;
  },

  /** Riwayat Perubahan Stok satu varian, ditampilkan di modal Riwayat. */
  async getLogs(variantId: string) {
    const { data } = await apiClient.get<ApiResponse<StockLogEntry[]>>(`/stock/${variantId}/logs`);
    return data.data;
  },
};
