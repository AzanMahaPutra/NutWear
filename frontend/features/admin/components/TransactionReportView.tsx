"use client";

import { useEffect, useState } from "react";
import { Eye, FileSpreadsheet, Receipt, Wallet, Package, TrendingUp } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { Modal } from "@/components/ui/Modal";
import { StatCard } from "@/features/admin/components/StatCard";
import { TransactionDetailView } from "@/features/admin/components/TransactionDetailView";
import {
  transactionReportService,
  TransactionReportFilterType,
  TransactionReportSummary,
  TransactionReportMeta,
} from "@/services/transactionReportService";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { MONTH_OPTIONS, PAYMENT_TYPE_LABEL, PAYMENT_STATUS_LABEL } from "@/constants/order";
import { Order } from "@/types/user";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => String(CURRENT_YEAR - 4 + i));
const PAGE_SIZE = 10;

const FILTER_OPTIONS: { value: TransactionReportFilterType; label: string }[] = [
  { value: "", label: "Semua Transaksi" },
  { value: "today", label: "Hari Ini" },
  { value: "yesterday", label: "Kemarin" },
  { value: "this_week", label: "Minggu Ini" },
  { value: "this_month", label: "Bulan Ini" },
  { value: "this_year", label: "Tahun Ini" },
  { value: "range", label: "Rentang Tanggal" },
  { value: "specific_month", label: "Pilih Bulan" },
  { value: "specific_year", label: "Pilih Tahun" },
];

const EMPTY_SUMMARY: TransactionReportSummary = {
  totalTransaksi: 0,
  totalPendapatan: 0,
  totalProdukTerjual: 0,
  rataRataNilaiTransaksi: 0,
};

/**
 * UPDATE — Halaman Laporan Transaksi & Export Excel (Admin).
 *
 * Pusat laporan transaksi yang pembayarannya SUDAH BERHASIL (Sudah Dibayar/Settlement
 * s.d. Selesai — lihat backend/src/repositories/dashboardRepository.js:PAID_ORDER_STATUSES,
 * dipakai ulang oleh transactionReportRepository supaya definisi "sudah dibayar" sama
 * persis dengan Pendapatan Dashboard Admin). Berbeda dari halaman Pesanan
 * (OrderManagementView) yang menampilkan SELURUH status pesanan untuk dikelola admin.
 *
 * Filter tanggal, tabel, dan ringkasan seluruhnya dihitung backend (server-side
 * pagination lewat `.range()`) — halaman ini TIDAK PERNAH memuat seluruh transaksi
 * sekaligus ke frontend, sesuai poin "Performa" pada dokumen permintaan.
 */
export function TransactionReportView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<TransactionReportMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
  const [summary, setSummary] = useState<TransactionReportSummary>(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(true);
  const showToast = useToastStore((s) => s.showToast);

  const [filterType, setFilterType] = useState<TransactionReportFilterType>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [page, setPage] = useState(1);

  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const filters = {
    filterType,
    startDate: filterType === "range" ? startDate : undefined,
    endDate: filterType === "range" ? endDate : undefined,
    month: filterType === "specific_month" ? month : undefined,
    year: filterType === "specific_month" || filterType === "specific_year" ? year : undefined,
  };

  // Filter Rentang Tanggal/Pilih Bulan/Pilih Tahun butuh kelengkapan input tertentu
  // sebelum request dikirim (sinkron dengan validasi backend) — supaya tidak spam
  // request 422 saat admin baru memilih filter tapi belum mengisi field pendukungnya.
  const isFilterReady =
    filterType !== "range" || Boolean(startDate && endDate);
  const isMonthFilterReady = filterType !== "specific_month" || Boolean(month && year);
  const isYearFilterReady = filterType !== "specific_year" || Boolean(year);
  const canFetch = isFilterReady && isMonthFilterReady && isYearFilterReady;

  async function fetchReport() {
    if (!canFetch) return;
    setIsLoading(true);
    try {
      const result = await transactionReportService.getReport(filters, page, PAGE_SIZE);
      setOrders(result.data);
      setMeta(result.meta);
      setSummary(result.summary);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal memuat laporan transaksi"), "error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, startDate, endDate, month, year, page]);

  // Reset ke halaman 1 setiap kali filter (bukan halaman itu sendiri) berubah.
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, startDate, endDate, month, year]);

  function handleFilterTypeChange(value: TransactionReportFilterType) {
    setFilterType(value);
    setStartDate("");
    setEndDate("");
    setMonth("");
    setYear("");
  }

  async function handleExport(scope: "filtered" | "all") {
    setIsExporting(true);
    try {
      await transactionReportService.exportExcel(filters, scope);
      showToast("File Excel berhasil diunduh");
      setExportModalOpen(false);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal mengekspor laporan"), "error");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="p-6">
      {/* Ringkasan Laporan — mengikuti filter yang sedang aktif */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Transaksi" value={String(summary.totalTransaksi)} icon={Receipt} />
        <StatCard label="Total Pendapatan" value={formatCurrency(summary.totalPendapatan)} icon={Wallet} />
        <StatCard label="Total Produk Terjual" value={String(summary.totalProdukTerjual)} icon={Package} />
        <StatCard label="Rata-rata Nilai Transaksi" value={formatCurrency(summary.rataRataNilaiTransaksi)} icon={TrendingUp} />
      </div>

      {/* Filter Laporan */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Filter Laporan</label>
            <select
              value={filterType}
              onChange={(e) => handleFilterTypeChange(e.target.value as TransactionReportFilterType)}
              className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {filterType === "range" && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-500">Tanggal Awal</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-500">Tanggal Akhir</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
            </>
          )}

          {filterType === "specific_month" && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-500">Bulan</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
                >
                  <option value="">Pilih Bulan</option>
                  {MONTH_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-500">Tahun</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
                >
                  <option value="">Pilih Tahun</option>
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {filterType === "specific_year" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Tahun</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
              >
                <option value="">Pilih Tahun</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          <FileSpreadsheet className="h-4 w-4" /> Export Excel
        </button>
      </div>

      <DataTable
        rowKey={(o) => o.id}
        data={orders}
        emptyTitle={isLoading ? "Memuat..." : "Belum ada transaksi yang sesuai dengan filter"}
        columns={[
          { key: "id", header: "Order ID", render: (o) => `#${o.id.slice(0, 8).toUpperCase()}` },
          { key: "customer", header: "Nama Customer", render: (o) => o.customer?.namaLengkap ?? "-" },
          { key: "email", header: "Email Customer", render: (o) => o.customer?.email ?? "-" },
          { key: "phone", header: "Nomor Telepon", render: (o) => o.customer?.noHp ?? "-" },
          { key: "tanggal", header: "Tanggal Transaksi", render: (o) => formatDate(o.createdAt) },
          {
            key: "metode",
            header: "Metode Pembayaran",
            render: (o) =>
              o.payment?.paymentType ? (PAYMENT_TYPE_LABEL[o.payment.paymentType] ?? o.payment.paymentType) : "-",
          },
          {
            key: "statusPembayaran",
            header: "Status Pembayaran",
            render: (o) =>
              o.payment?.transactionStatus
                ? (PAYMENT_STATUS_LABEL[o.payment.transactionStatus] ?? o.payment.transactionStatus)
                : "-",
          },
          { key: "totalItem", header: "Total Item", render: (o) => o.items.length },
          { key: "totalBelanja", header: "Total Belanja", render: (o) => formatCurrency(o.grandTotal) },
          {
            key: "aksi",
            header: "Aksi",
            render: (o) => (
              <button
                type="button"
                onClick={() => setDetailOrder(o)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                aria-label="Lihat Detail"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            ),
          },
        ]}
      />

      <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />

      <Modal
        open={Boolean(detailOrder)}
        onClose={() => setDetailOrder(null)}
        title={detailOrder ? `Detail Transaksi #${detailOrder.id.slice(0, 8).toUpperCase()}` : "Detail Transaksi"}
        size="xl"
      >
        {detailOrder && <TransactionDetailView order={detailOrder} />}
      </Modal>

      <Modal open={exportModalOpen} onClose={() => setExportModalOpen(false)} title="Export Excel" size="md">
        <div className="space-y-4 text-sm">
          <p className="text-neutral-600">Pilih data transaksi yang ingin diekspor ke file Excel:</p>
          <div className="space-y-2">
            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleExport("filtered")}
              className="w-full rounded-lg border border-neutral-200 p-3 text-left hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <p className="font-semibold text-neutral-900">Data Sesuai Filter Aktif</p>
              <p className="text-xs text-neutral-500">
                {filterType ? FILTER_OPTIONS.find((o) => o.value === filterType)?.label : "Semua Transaksi"} —{" "}
                {summary.totalTransaksi} transaksi
              </p>
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleExport("all")}
              className="w-full rounded-lg border border-neutral-200 p-3 text-left hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <p className="font-semibold text-neutral-900">Seluruh Transaksi Berhasil Dibayar</p>
              <p className="text-xs text-neutral-500">Mengabaikan filter yang sedang aktif</p>
            </button>
          </div>
          {isExporting && <p className="text-center text-xs text-neutral-400">Menyiapkan file Excel...</p>}
        </div>
      </Modal>
    </div>
  );
}
