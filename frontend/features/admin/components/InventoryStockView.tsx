"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImageOff, Pencil, Search, X } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { StockStatusBadge, getStockStatus } from "@/components/shared/StockStatusBadge";
import { InventoryEditStockModal } from "@/features/admin/components/InventoryEditStockModal";
import { InventoryStockHistoryModal } from "@/features/admin/components/InventoryStockHistoryModal";
import { InventoryItem, InventoryListMeta, StockStatus, stockService } from "@/services/stockService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";

const PAGE_SIZE = 20;

const STATUS_FILTERS: { value: StockStatus | ""; label: string }[] = [
  { value: "", label: "Semua Stok" },
  { value: "aman", label: "Stok Aman" },
  { value: "menipis", label: "Stok Menipis" },
  { value: "habis", label: "Stok Habis" },
];

/**
 * View utama Halaman Inventory Stock Admin.
 *
 * Menampilkan seluruh varian produk (foto, nama produk, warna, ukuran, SKU,
 * stok, status stok) dalam satu tabel — bukan halaman Produk/Edit Produk,
 * khusus untuk memantau & mengedit stok tanpa harus membuka produk satu per
 * satu. Search (nama produk/SKU, real-time dengan debounce), filter Status
 * Stok, dan pagination seluruhnya diproses backend/database lewat
 * GET /stock/inventory (lihat stockService.ts / stockRepository.js) supaya
 * tetap cepat walau produk sudah ribuan dan varian puluhan ribu — halaman
 * ini TIDAK PERNAH memuat seluruh data ke frontend sekaligus.
 *
 * Edit stok (manual maupun Quick Adjustment) langsung memperbarui baris yang
 * bersangkutan di state lokal setelah tersimpan (lihat handleStockSaved),
 * jadi status stok & angka di tabel berubah tanpa perlu refresh halaman.
 */
export function InventoryStockView() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [minimumStock, setMinimumStock] = useState(15);
  const [meta, setMeta] = useState<InventoryListMeta>({ page: 1, pageSize: PAGE_SIZE, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const showToast = useToastStore((s) => s.showToast);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState<StockStatus | "">("");
  const [page, setPage] = useState(1);

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);

  async function fetchInventory() {
    setIsLoading(true);
    try {
      const result = await stockService.getInventory({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setItems(result.items);
      setMinimumStock(result.minimumStock);
      setMeta(result.meta);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal memuat data Inventory Stock"), "error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, page]);

  // Reset ke halaman 1 setiap kali filter (bukan halaman itu sendiri) berubah.
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter]);

  // UPDATE STOK — memperbarui baris terkait secara langsung di state (tanpa
  // refresh halaman); status stok ikut dihitung ulang dari stok baru.
  function handleStockSaved(variantId: string, stokBaru: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.variantId === variantId ? { ...item, stok: stokBaru, status: getStockStatus(stokBaru, minimumStock) } : item
      )
    );
    setEditingItem(null);
  }

  const totalPages = Math.max(Math.ceil(meta.total / meta.pageSize), 1);

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="w-full max-w-sm">
          <label className="mb-1 block text-xs font-medium text-neutral-500">Search</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama produk atau SKU..."
              className="w-full rounded-md border border-neutral-200 py-2 pl-9 pr-9 text-sm outline-none focus:border-neutral-400"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label="Bersihkan pencarian"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Filter Stok</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StockStatus | "")}
            className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        rowKey={(row) => row.variantId}
        data={items}
        emptyTitle={
          isLoading ? "Memuat..." : debouncedSearch || statusFilter ? "Tidak ada varian yang sesuai" : "Belum ada produk"
        }
        columns={[
          {
            key: "foto",
            header: "Foto",
            render: (row) => (
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-neutral-50">
                {row.imageUrl ? (
                  <Image src={row.imageUrl} alt={row.namaProduk} fill sizes="48px" className="object-cover" />
                ) : (
                  <ImageOff className="h-4 w-4 text-neutral-300" />
                )}
              </div>
            ),
          },
          { key: "namaProduk", header: "Nama Produk", render: (row) => <span className="font-medium text-neutral-900">{row.namaProduk}</span> },
          { key: "warna", header: "Warna", render: (row) => row.warna },
          { key: "ukuran", header: "Ukuran", render: (row) => row.ukuran },
          { key: "sku", header: "SKU", render: (row) => row.sku || "-" },
          { key: "stok", header: "Stok", render: (row) => <span className="font-semibold">{row.stok}</span> },
          { key: "status", header: "Status", render: (row) => <StockStatusBadge status={row.status} /> },
          {
            key: "aksi",
            header: "Aksi",
            render: (row) => (
              <button
                type="button"
                onClick={() => setEditingItem(row)}
                className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            ),
          },
        ]}
      />

      <Pagination currentPage={meta.page} totalPages={totalPages} onPageChange={setPage} />

      <InventoryEditStockModal
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSaved={handleStockSaved}
        onViewHistory={(item) => {
          setEditingItem(null);
          setHistoryItem(item);
        }}
      />

      <InventoryStockHistoryModal item={historyItem} onClose={() => setHistoryItem(null)} />
    </div>
  );
}
