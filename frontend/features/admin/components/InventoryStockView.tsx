"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Eye, ImageOff, Search, X } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { ProductStockBadge, getProductStockStatus } from "@/components/shared/StockStatusBadge";
import { InventoryProductDetailModal } from "@/features/admin/components/InventoryProductDetailModal";
import {
  InventoryListMeta,
  InventoryProduct,
  StockStatus,
  StockStatusCounts,
  stockService,
} from "@/services/stockService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";

const PAGE_SIZE = 20;

// Filter bekerja di level PRODUK (lihat inventory_products di database):
// "menipis"/"habis" = produk dengan minimal satu varian berstatus itu,
// "aman" = produk yang seluruh variannya aman.
const STATUS_FILTERS: { value: StockStatus | ""; label: string }[] = [
  { value: "", label: "Semua Produk" },
  { value: "aman", label: "Semua Aman" },
  { value: "menipis", label: "Ada Variant Menipis" },
  { value: "habis", label: "Ada Variant Habis" },
];

/**
 * View utama Halaman Inventory Stock Admin — satu baris per PRODUK.
 *
 * Varian tidak lagi ditampilkan sebagai baris utama: tombol "Lihat Detail"
 * membuka InventoryProductDetailModal yang menjadi pusat pengelolaan stok
 * varian produk tersebut (statistik, pilih variant, Edit Stok, Riwayat).
 * Search (nama produk/SKU, debounce), filter status, dan pagination tetap
 * diproses backend/database lewat GET /stock/inventory/products sehingga
 * halaman ini tidak pernah memuat seluruh varian ke browser.
 *
 * Setelah stok varian diubah di modal, baris produk di tabel diperbarui lewat
 * handleProductChanged (ringkasan & status produk) tanpa refresh halaman.
 */
export function InventoryStockView() {
  const [items, setItems] = useState<InventoryProduct[]>([]);
  const [meta, setMeta] = useState<InventoryListMeta>({ page: 1, pageSize: PAGE_SIZE, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const showToast = useToastStore((s) => s.showToast);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState<StockStatus | "">("");
  const [page, setPage] = useState(1);

  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const requestId = useRef(0);

  async function fetchInventory() {
    const currentRequest = ++requestId.current;
    setIsLoading(true);
    try {
      const result = await stockService.getInventoryProducts({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      if (currentRequest !== requestId.current) return; // respons usang (filter sudah berubah lagi)
      setItems(result.items);
      setMeta(result.meta);
    } catch (err) {
      if (currentRequest !== requestId.current) return;
      showToast(getApiErrorMessage(err, "Gagal memuat data Inventory Stock"), "error");
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false);
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

  // Stok varian diubah dari modal -> perbarui ringkasan & status baris produk
  // (baris tidak dihapus walau tak lagi cocok filter; akan hilang di refetch berikutnya).
  function handleProductChanged(productId: string, counts: StockStatusCounts, totalStok: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, counts, totalStok, status: getProductStockStatus(counts) }
          : item
      )
    );
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
        rowKey={(row) => row.productId}
        data={items}
        emptyTitle={
          isLoading ? "Memuat..." : debouncedSearch || statusFilter ? "Tidak ada produk yang sesuai" : "Belum ada produk"
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
          { key: "variant", header: "Variant", render: (row) => `${row.totalVariants} variant` },
          { key: "stok", header: "Total Stok", render: (row) => <span className="font-semibold">{row.totalStok}</span> },
          {
            key: "status",
            header: "Status Stok",
            render: (row) => (
              <div className="flex flex-col items-start gap-1">
                <ProductStockBadge counts={row.counts} />
                {(row.counts.menipis > 0 || row.counts.habis > 0) && (
                  <span className="text-xs text-neutral-500">
                    {[
                      row.counts.menipis > 0 && `${row.counts.menipis} menipis`,
                      row.counts.habis > 0 && `${row.counts.habis} habis`,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
              </div>
            ),
          },
          {
            key: "aksi",
            header: "Aksi",
            render: (row) => (
              <button
                type="button"
                onClick={() => setSelectedProduct(row)}
                className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
              >
                <Eye className="h-3.5 w-3.5" /> Lihat Detail
              </button>
            ),
          },
        ]}
      />

      <Pagination currentPage={meta.page} totalPages={totalPages} onPageChange={setPage} />

      <InventoryProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onProductChanged={handleProductChanged}
      />
    </div>
  );
}
