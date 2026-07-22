import { apiClient } from "@/lib/apiClient";
import { ApiResponse } from "@/lib/apiTypes";
import { Order } from "@/types/user";
import { OrderApiResponse, toOrder } from "@/services/orderService";

/**
 * UPDATE — Halaman Laporan Transaksi & Export Excel (Admin). Service baru, terpisah
 * dari orderService.ts (halaman Pesanan) tapi memakai ulang `OrderApiResponse`/`toOrder`
 * dari sana (lihat orderService.ts) supaya bentuk satu baris transaksi tetap konsisten
 * dengan tipe `Order` yang sudah dikenal di seluruh admin.
 */

/** 8 opsi filter sesuai dokumen — harus sinkron dengan REPORT_FILTER_TYPES di backend
 * (backend/src/validators/transactionReportValidator.js). Kosong/undefined berarti
 * "Semua Transaksi" (tanpa batas tanggal). */
export type TransactionReportFilterType =
  | ""
  | "today"
  | "yesterday"
  | "this_week"
  | "this_month"
  | "this_year"
  | "range"
  | "specific_month"
  | "specific_year";

export interface TransactionReportFilterParams {
  filterType?: TransactionReportFilterType;
  startDate?: string;
  endDate?: string;
  month?: string;
  year?: string;
}

export interface TransactionReportSummary {
  totalTransaksi: number;
  totalPendapatan: number;
  totalProdukTerjual: number;
  rataRataNilaiTransaksi: number;
}

export interface TransactionReportMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TransactionReportResult {
  data: Order[];
  meta: TransactionReportMeta;
  summary: TransactionReportSummary;
}

/** Menghapus key filter yang kosong supaya tidak ikut terkirim sebagai query string
 * (pola yang sama dengan cleanFilterParams di orderService.ts). */
function cleanParams(params: Record<string, unknown>) {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== "" && value !== null);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

type ReportMetaResponse = TransactionReportMeta & { summary: TransactionReportSummary };

export const transactionReportService = {
  /** Data tabel + kartu ringkasan halaman Laporan Transaksi — server-side pagination
   * (tidak pernah memuat seluruh transaksi ke frontend, lihat dokumen "Performa"). */
  async getReport(filters: TransactionReportFilterParams, page: number, limit: number): Promise<TransactionReportResult> {
    const { data } = await apiClient.get<ApiResponse<OrderApiResponse[]>>("/transaction-reports", {
      params: cleanParams({ ...filters, page, limit }),
    });
    const meta = (data.meta ?? {}) as unknown as ReportMetaResponse;
    return {
      data: data.data.map(toOrder),
      meta: { page: meta.page, limit: meta.limit, total: meta.total, totalPages: meta.totalPages },
      summary: meta.summary,
    };
  },

  /**
   * Export Excel — `scope: "all"` mengekspor SELURUH transaksi yang sudah berhasil
   * dibayar (mengabaikan filter tanggal aktif), `scope: "filtered"` mengikuti filter
   * yang sedang aktif. Backend meng-stream file .xlsx (lihat transactionReportService.js
   * di backend) — di sini responsenya diambil sebagai blob lalu di-download lewat link
   * sementara, tanpa pernah menahan data mentahnya di state React.
   */
  async exportExcel(filters: TransactionReportFilterParams, scope: "filtered" | "all") {
    const response = await apiClient.get<Blob>("/transaction-reports/export", {
      params: cleanParams({ ...filters, scope }),
      responseType: "blob",
    });

    const disposition = response.headers?.["content-disposition"] as string | undefined;
    const match = disposition?.match(/filename="?([^"]+)"?/);
    const filename = match?.[1] ?? `laporan-transaksi-${new Date().toISOString().slice(0, 10)}.xlsx`;

    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
