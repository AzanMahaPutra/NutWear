import { apiClient } from "@/lib/apiClient";
import { ApiResponse } from "@/lib/apiTypes";

export interface DashboardSummary {
  stats: {
    totalProduk: number;
    totalPelanggan: number;
    totalPesanan: number;
    pendapatan: number;
  };
  salesChart: { bulan: string; total: number }[];
  bestsellers: { productId: string; namaProduk: string; totalTerjual: number }[];
}

export const dashboardService = {
  async getSummary() {
    const { data } = await apiClient.get<ApiResponse<DashboardSummary>>("/admin/dashboard/summary");
    return data.data;
  },
};
