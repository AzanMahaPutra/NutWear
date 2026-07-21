"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { RowActions } from "@/components/shared/RowActions";
import { StatusToggle } from "@/components/shared/StatusToggle";
import { StockStatusBadge, getStockStatus } from "@/components/shared/StockStatusBadge";
import { Modal } from "@/components/ui/Modal";
import { ProductForm } from "@/features/admin/components/ProductForm";
import { useAdminProductStore } from "@/stores/adminProductStore";
import { useAdminCategoryStore } from "@/stores/adminCategoryStore";
import { useToastStore } from "@/stores/toastStore";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { formatCurrency } from "@/utils/formatCurrency";
import { stockService, StockStatus } from "@/services/stockService";
import { Product } from "@/types/product";

const ALL_CATEGORIES = "all";

/**
 * Status stok terburuk di antara seluruh varian sebuah produk (dipakai kolom
 * "Stok" & filter "Tampilkan hanya stok menipis"). "habis" > "menipis" > "aman".
 * Produk tanpa varian mengembalikan null (kolom menampilkan "-").
 */
function worstVariantStockStatus(product: Product, minimumStock: number): StockStatus | null {
  if (!product.variants || product.variants.length === 0) return null;

  const statuses = product.variants.map((v) => getStockStatus(v.stok, minimumStock));
  if (statuses.includes("habis")) return "habis";
  if (statuses.includes("menipis")) return "menipis";
  return "aman";
}

/**
 * View Manajemen Produk Admin: tabel + modal tambah/edit (+ varian & upload gambar) + toggle status + hapus.
 * Semua terhubung ke Product API sungguhan lewat useAdminProductStore.
 *
 * UPDATE 3 — Search Bar (Nama Produk/SKU/Slug) + Filter Kategori di atas tabel.
 * Data produk sudah di-cache penuh di store (fetchProducts pageSize besar), jadi
 * pencarian & filter dilakukan di sisi client (tidak perlu request tambahan ke API)
 * dan bisa dipakai bersamaan tanpa memengaruhi alur Tambah/Edit/Hapus Produk yang sudah ada.
 */
export function ProductManagementView() {
  const products = useAdminProductStore((s) => s.products);
  const isLoading = useAdminProductStore((s) => s.isLoading);
  const fetchProducts = useAdminProductStore((s) => s.fetchProducts);
  const deleteProduct = useAdminProductStore((s) => s.deleteProduct);
  const toggleActive = useAdminProductStore((s) => s.toggleActive);

  const categories = useAdminCategoryStore((s) => s.categories);
  const fetchCategories = useAdminCategoryStore((s) => s.fetchCategories);

  const showToast = useToastStore((s) => s.showToast);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  // BAGIAN A & B — state Search Bar & Filter Kategori.
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);

  // UPDATE — Notifikasi Stok Menipis untuk Admin: filter "Tampilkan hanya
  // stok menipis" + Batas Minimum Stok (dipakai kolom "Stok" & filter).
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [minimumStock, setMinimumStock] = useState(15);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    stockService
      .getMinimumStock()
      .then(setMinimumStock)
      .catch(() => {
        // Diamkan: kolom Stok & filter tetap jalan dengan nilai default (15).
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UPDATE — Notifikasi Stok Menipis untuk Admin: klik item pada widget "Stok
  // Menipis" di Dashboard mengarahkan ke /admin/produk?edit=productId, di sini
  // dibaca sekali produk sudah termuat supaya modal Edit Produk langsung terbuka.
  useEffect(() => {
    if (isLoading || products.length === 0) return;

    const editId = new URLSearchParams(window.location.search).get("edit");
    if (!editId) return;

    const product = products.find((p) => p.id === editId);
    if (product) {
      setEditingProduct(product);
      setFormOpen(true);
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("edit");
    window.history.replaceState({}, "", url.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, products]);

  function openAdd() {
    setEditingProduct(undefined);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await deleteProduct(id);
      showToast("Produk dihapus");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  async function handleToggle(product: Product) {
    try {
      await toggleActive(product.id, product.isActive);
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  function handleResetFilter() {
    setSearchInput("");
    setCategoryFilter(ALL_CATEGORIES);
    setLowStockOnly(false);
  }

  const isFilterActive = debouncedSearch.trim().length > 0 || categoryFilter !== ALL_CATEGORIES || lowStockOnly;

  // Pencarian mencakup Nama Produk, Slug, dan SKU varian — tidak case-sensitive.
  // Filter Kategori & Filter Stok Menipis bisa dipakai bersamaan dengan Search
  // (semuanya AND, bukan OR).
  const filteredProducts = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();

    return products.filter((product) => {
      if (categoryFilter !== ALL_CATEGORIES && product.kategoriId !== categoryFilter) {
        return false;
      }

      if (lowStockOnly) {
        const status = worstVariantStockStatus(product, minimumStock);
        if (status !== "menipis" && status !== "habis") return false;
      }

      if (!keyword) return true;

      const matchesNama = product.namaProduk.toLowerCase().includes(keyword);
      const matchesSlug = (product.slug ?? "").toLowerCase().includes(keyword);
      const matchesSku = (product.variants ?? []).some((v) => (v.sku ?? "").toLowerCase().includes(keyword));

      return matchesNama || matchesSlug || matchesSku;
    });
  }, [products, debouncedSearch, categoryFilter, lowStockOnly, minimumStock]);

  const emptyTitle = isLoading
    ? "Memuat..."
    : products.length === 0
    ? "Belum ada produk"
    : "Tidak ada produk yang sesuai dengan pencarian.";

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama produk, SKU, atau slug..."
              className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-sm text-neutral-900 outline-none focus:border-neutral-900"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-900 sm:w-56"
          >
            <option value={ALL_CATEGORIES}>Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.namaKategori}
              </option>
            ))}
          </select>

          <label className="flex w-full items-center gap-2 whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium text-neutral-700 sm:w-auto">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="h-3.5 w-3.5 accent-neutral-900"
            />
            Tampilkan hanya stok menipis
          </label>

          {isFilterActive && (
            <button
              type="button"
              onClick={handleResetFilter}
              className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-neutral-200 px-3 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
            >
              <X className="h-3.5 w-3.5" /> Reset Filter
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" /> Tambah Produk
        </button>
      </div>

      <DataTable
        rowKey={(p) => p.id}
        data={filteredProducts}
        emptyTitle={emptyTitle}
        columns={[
          { key: "nama", header: "Nama Produk", render: (p) => p.namaProduk },
          {
            key: "kategori",
            header: "Kategori",
            render: (p) => categories.find((c) => c.id === p.kategoriId)?.namaKategori ?? "-",
          },
          { key: "harga", header: "Harga", render: (p) => formatCurrency(p.harga) },
          {
            key: "stok",
            header: "Stok",
            render: (p) => {
              const status = worstVariantStockStatus(p, minimumStock);
              return status ? <StockStatusBadge status={status} /> : "-";
            },
          },
          {
            key: "status",
            header: "Status",
            render: (p) => <StatusToggle active={p.isActive} onToggle={() => handleToggle(p)} />,
          },
          {
            key: "aksi",
            header: "Aksi",
            render: (p) => <RowActions onEdit={() => openEdit(p)} onDelete={() => handleDelete(p.id)} />,
          },
        ]}
      />

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingProduct ? "Edit Produk" : "Tambah Produk"}
        size="2xl"
      >
        <ProductForm
          key={editingProduct?.id ?? "new-product"}
          initialData={editingProduct}
          onSuccess={() => {
            setFormOpen(false);
            fetchProducts();
          }}
        />
      </Modal>
    </div>
  );
}
