"use client";

import { useEffect, useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { OrderStatusSelect } from "@/features/admin/components/OrderStatusSelect";
import { OrderDetailView } from "@/features/admin/components/OrderDetailView";
import { OrderSearchBar } from "@/features/admin/components/OrderSearchBar";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { YearPicker } from "@/components/ui/YearPicker";
import { orderService, OrderFilterParams } from "@/services/orderService";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { ORDER_STATUS_LABEL, MONTH_OPTIONS } from "@/constants/order";
import { Order, OrderStatus } from "@/types/user";

/**
 * View Manajemen Pesanan Admin — fetch dari Order API sungguhan (GET /orders) dengan
 * filter tanggal/bulan+tahun/status (server-side), status diubah lewat PATCH /orders/:id/status,
 * hapus satu/pesanan massal lewat DELETE /orders/:id dan DELETE /orders (Update 3).
 */
export function OrderManagementView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const showToast = useToastStore((s) => s.showToast);

  // Filter aktif — sengaja disimpan terpisah dari data hasil fetch supaya nilai filter
  // tetap dipertahankan walau hasil pencariannya kosong (poin 4).
  const [dateFilter, setDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  // UPDATE — Search Order ID: kata kunci sudah di-debounce di dalam OrderSearchBar,
  // jadi di sini tinggal dipakai langsung sebagai bagian dari filter aktif.
  const [searchFilter, setSearchFilter] = useState("");
  const [searchResetSignal, setSearchResetSignal] = useState(0);

  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const filters: OrderFilterParams = {
    date: dateFilter,
    month: dateFilter ? "" : monthFilter,
    year: dateFilter ? "" : yearFilter,
    status: statusFilter,
    search: searchFilter,
  };

  async function fetchOrders() {
    setIsLoading(true);
    try {
      const data = await orderService.getAllOrders(filters);
      setOrders(data);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal memuat pesanan"), "error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, monthFilter, yearFilter, statusFilter, searchFilter]);

  function resetFilters() {
    setDateFilter("");
    setMonthFilter("");
    setYearFilter("");
    setStatusFilter("");
    setSearchFilter("");
    // Memberi tahu OrderSearchBar (state pencariannya sendiri) untuk ikut dikosongkan.
    setSearchResetSignal((n) => n + 1);
  }

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    try {
      const updated = await orderService.updateStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      showToast(`Status pesanan #${orderId.slice(0, 8).toUpperCase()} diperbarui`);
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await orderService.deleteOrder(deleteTarget.id);
      setOrders((prev) => prev.filter((o) => o.id !== deleteTarget.id));
      showToast(`Pesanan #${deleteTarget.id.slice(0, 8).toUpperCase()} dihapus`);
      setDeleteTarget(null);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal menghapus pesanan"), "error");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleConfirmBulkDelete() {
    setIsBulkDeleting(true);
    try {
      const deletedCount = await orderService.deleteOrdersByFilter(filters);
      showToast(`${deletedCount} pesanan berhasil dihapus`);
      setBulkDeleteOpen(false);
      fetchOrders();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal menghapus pesanan"), "error");
    } finally {
      setIsBulkDeleting(false);
    }
  }

  const hasActiveFilter = Boolean(dateFilter || monthFilter || yearFilter || statusFilter || searchFilter);

  return (
    <div className="p-6">
      {/* UPDATE — Search Order ID: Search Bar di bagian atas halaman, bisa dikombinasikan
          dengan seluruh filter tanggal/bulan/tahun/status di bawahnya. */}
      <div className="mb-4">
        <OrderSearchBar onSearch={setSearchFilter} resetSignal={searchResetSignal} />
      </div>

      {/* Filter Tanggal / Bulan+Tahun / Status — semua bisa dikombinasikan sekaligus (poin 1-4) */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Tanggal</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Bulan</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              disabled={Boolean(dateFilter)}
              className="rounded-md border border-neutral-200 px-3 py-2 text-sm disabled:bg-neutral-50 disabled:text-neutral-400"
            >
              <option value="">Semua Bulan</option>
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <YearPicker value={yearFilter} onChange={setYearFilter} disabled={Boolean(dateFilter)} />

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Status Pesanan</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "")}
              className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
            >
              <option value="">Semua Status</option>
              {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((status) => (
                <option key={status} value={status}>
                  {ORDER_STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-md px-3 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-800"
            >
              Reset Filter
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setBulkDeleteOpen(true)}
          disabled={orders.length === 0}
          className="flex items-center gap-2 rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" /> Hapus Semua
        </button>
      </div>

      <DataTable
        rowKey={(o) => o.id}
        data={orders}
        emptyTitle={
          isLoading
            ? "Memuat..."
            : searchFilter
              ? "Tidak ada pesanan yang sesuai dengan pencarian."
              : hasActiveFilter
                ? "Tidak ada pesanan yang cocok dengan filter"
                : "Belum ada pesanan"
        }
        columns={[
          { key: "id", header: "Order ID", render: (o) => `#${o.id.slice(0, 8).toUpperCase()}` },
          { key: "tanggal", header: "Tanggal", render: (o) => formatDate(o.createdAt) },
          { key: "item", header: "Jumlah Item", render: (o) => o.items.length },
          { key: "total", header: "Total", render: (o) => formatCurrency(o.grandTotal) },
          {
            key: "status",
            header: "Status",
            render: (o) => (
              <div>
                <OrderStatusSelect value={o.status} onChange={(status) => handleStatusChange(o.id, status)} />
                {o.status === "dibatalkan" && o.cancelledBy === "user" && (
                  <p className="mt-1 text-[11px] font-medium text-neutral-400">Dibatalkan oleh customer</p>
                )}
              </div>
            ),
          },
          {
            key: "aksi",
            header: "Aksi",
            render: (o) => (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDetailOrder(o)}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                  aria-label="Detail Pesanan"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(o)}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-500 hover:bg-red-50"
                  aria-label="Hapus Pesanan"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={Boolean(detailOrder)}
        onClose={() => setDetailOrder(null)}
        title={detailOrder ? `Detail Pesanan #${detailOrder.id.slice(0, 8).toUpperCase()}` : "Detail Pesanan"}
        size="xl"
      >
        {detailOrder && <OrderDetailView order={detailOrder} />}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus Pesanan"
        description="Apakah Anda yakin ingin menghapus pesanan ini? Data yang sudah dihapus tidak dapat dikembalikan."
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Hapus Semua Pesanan"
        description="Menghapus seluruh pesanan yang sedang ditampilkan sesuai filter aktif (hanya status Selesai, Dibatalkan, atau Expired yang ikut terhapus). Pesanan yang masih aktif akan tetap aman. Lanjutkan?"
        isLoading={isBulkDeleting}
        onConfirm={handleConfirmBulkDelete}
        onClose={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}
