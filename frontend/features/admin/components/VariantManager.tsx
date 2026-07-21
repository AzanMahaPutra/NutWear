"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Check, X, Wand2 } from "lucide-react";
import { ProductVariant } from "@/types/product";
import { productService } from "@/services/productService";
import { stockService } from "@/services/stockService";
import { getStockStatus, StockStatusBadge } from "@/components/shared/StockStatusBadge";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { AVAILABLE_SIZES } from "@/features/product/types/filter";

interface VariantManagerProps {
  productId: string;
  initialVariants: ProductVariant[];
}

interface EditableFields {
  ukuran: string;
  warna: string;
  sku: string;
  stok: number;
}

/**
 * Manajemen varian (ukuran, warna, SKU, stok) di dalam form produk Admin.
 *
 * Penambahan varian sekarang lewat "Generator Varian": admin memilih warna,
 * SKU Prefix, stok, dan mencentang ukuran-ukuran yang tersedia (checkbox,
 * bukan ketik manual) — sekali simpan otomatis membuat satu varian per
 * ukuran yang dicentang (tetap lewat endpoint POST /products/:id/variants
 * yang sudah ada, dipanggil berurutan per ukuran). SKU final = `SKU Prefix-Ukuran`
 * supaya tetap unik per ukuran (kolom sku bersifat unique di database),
 * sementara SKU Prefix sendiri tetap boleh sama untuk semua ukuran dalam
 * satu batch (sesuai maksud "SKU Prefix").
 *
 * Edit/hapus varian yang sudah ada langsung memanggil PUT/DELETE
 * /products/variants/:variantId — perubahan (mis. stok) tersimpan di baris
 * varian yang sama, tidak membuat varian baru.
 */
export function VariantManager({ productId, initialVariants }: VariantManagerProps) {
  const [variants, setVariants] = useState(initialVariants);

  // UPDATE — Notifikasi Stok Menipis untuk Admin: badge status stok per varian
  // mengikuti Batas Minimum Stok yang berlaku (lihat Pengaturan Admin).
  const [minimumStock, setMinimumStock] = useState(15);

  useEffect(() => {
    stockService
      .getMinimumStock()
      .then(setMinimumStock)
      .catch(() => {
        // Diamkan: badge tetap tampil dengan nilai default (15) kalau gagal fetch.
      });
  }, []);

  const [warna, setWarna] = useState("");
  const [skuPrefix, setSkuPrefix] = useState("");
  const [stok, setStok] = useState(0);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditableFields | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const showToast = useToastStore((s) => s.showToast);

  function toggleSize(size: string) {
    setSelectedSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
  }

  async function handleGenerateVariants() {
    if (!warna || !skuPrefix) {
      showToast("Warna dan SKU Prefix wajib diisi", "error");
      return;
    }
    if (selectedSizes.length === 0) {
      showToast("Pilih minimal satu ukuran", "error");
      return;
    }

    setIsGenerating(true);
    const created: ProductVariant[] = [];
    const failed: string[] = [];

    try {
      for (const ukuran of selectedSizes) {
        const sku = `${skuPrefix}-${ukuran}`;
        try {
          const variant = await productService.addVariant(productId, { ukuran, warna, sku, stok });
          created.push(variant);
        } catch (err) {
          failed.push(`${ukuran} (${getApiErrorMessage(err)})`);
        }
      }

      if (created.length > 0) {
        setVariants((prev) => [...prev, ...created]);
      }
      if (failed.length > 0) {
        showToast(`Sebagian varian gagal dibuat: ${failed.join(", ")}`, "error");
      } else {
        showToast(`${created.length} varian berhasil dibuat`);
      }

      setWarna("");
      setSkuPrefix("");
      setStok(0);
      setSelectedSizes([]);
    } finally {
      setIsGenerating(false);
    }
  }

  function startEdit(variant: ProductVariant) {
    setEditingId(variant.id);
    setEditValues({ ukuran: variant.ukuran, warna: variant.warna, sku: variant.sku, stok: variant.stok });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues(null);
  }

  async function handleSaveEdit(variantId: string) {
    if (!editValues) return;
    if (!editValues.ukuran || !editValues.warna || !editValues.sku) {
      showToast("Ukuran, warna, dan SKU wajib diisi", "error");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await productService.updateVariant(variantId, editValues);
      setVariants((prev) => prev.map((v) => (v.id === variantId ? updated : v)));
      showToast("Varian berhasil diperbarui");
      cancelEdit();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteVariant(variantId: string) {
    try {
      await productService.removeVariant(variantId);
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
      showToast("Varian berhasil dihapus");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-neutral-800">Varian (Ukuran / Warna / SKU / Stok)</h4>

      {variants.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {variants.map((v) => {
            const isEditing = editingId === v.id;
            return (
              <div key={v.id} className="rounded-md bg-neutral-50 px-3 py-2 text-xs">
                {isEditing && editValues ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <select
                        value={editValues.ukuran}
                        onChange={(e) => setEditValues({ ...editValues, ukuran: e.target.value })}
                        className="w-full rounded-md border border-neutral-200 px-2 py-1.5 outline-none"
                      >
                        {AVAILABLE_SIZES.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                      <input
                        value={editValues.warna}
                        onChange={(e) => setEditValues({ ...editValues, warna: e.target.value })}
                        placeholder="Warna"
                        className="w-full rounded-md border border-neutral-200 px-2 py-1.5 outline-none"
                      />
                      <input
                        value={editValues.sku}
                        onChange={(e) => setEditValues({ ...editValues, sku: e.target.value })}
                        placeholder="SKU"
                        className="w-full rounded-md border border-neutral-200 px-2 py-1.5 outline-none"
                      />
                      <input
                        type="number"
                        value={editValues.stok}
                        onChange={(e) => setEditValues({ ...editValues, stok: Number(e.target.value) })}
                        placeholder="Stok"
                        className="w-full rounded-md border border-neutral-200 px-2 py-1.5 outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="flex items-center gap-1 rounded-md border border-neutral-300 px-2 py-1 font-semibold text-neutral-600"
                      >
                        <X className="h-3 w-3" /> Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(v.id)}
                        disabled={isSaving}
                        className="flex items-center gap-1 rounded-md bg-neutral-900 px-2 py-1 font-semibold text-white disabled:opacity-60"
                      >
                        <Check className="h-3 w-3" /> Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span>
                      {v.ukuran} · {v.warna} · SKU: {v.sku}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Stok: {v.stok}</span>
                      <StockStatusBadge status={getStockStatus(v.stok, minimumStock)} />
                      <button
                        type="button"
                        onClick={() => startEdit(v)}
                        aria-label="Edit varian"
                        className="rounded-md border border-neutral-200 p-1 text-neutral-600 hover:bg-white"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVariant(v.id)}
                        aria-label="Hapus varian"
                        className="rounded-md border border-red-200 p-1 text-red-500 hover:bg-white"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 p-3">
        <h5 className="mb-2 text-xs font-bold text-neutral-900">Generator Varian (Multiple Ukuran Sekaligus)</h5>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            value={warna}
            onChange={(e) => setWarna(e.target.value)}
            placeholder="Color (mis. 00 WHITE)"
            className="w-full rounded-md border border-neutral-200 px-3 py-2.5 text-sm outline-none"
          />
          <input
            value={skuPrefix}
            onChange={(e) => setSkuPrefix(e.target.value)}
            placeholder="SKU Prefix (mis. KAOS-WHITE-A)"
            className="w-full rounded-md border border-neutral-200 px-3 py-2.5 text-sm outline-none"
          />
          <input
            type="number"
            value={stok}
            onChange={(e) => setStok(Number(e.target.value))}
            placeholder="Stock"
            className="w-full rounded-md border border-neutral-200 px-3 py-2.5 text-sm outline-none sm:col-span-2"
          />
        </div>

        <p className="mb-1.5 mt-3 text-xs font-semibold text-neutral-600">Ukuran yang dipilih</p>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_SIZES.map((size) => {
            const checked = selectedSizes.includes(size);
            return (
              <label
                key={size}
                className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium ${
                  checked ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 text-neutral-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSize(size)}
                  className="h-3.5 w-3.5 accent-neutral-900"
                />
                {size}
              </label>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleGenerateVariants}
          disabled={isGenerating}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-md bg-neutral-900 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          <Wand2 className="h-3.5 w-3.5" />
          {isGenerating ? "Membuat varian..." : "Generate Varian"}
        </button>
        <p className="mt-2 text-[11px] text-neutral-500">
          Setiap ukuran yang dicentang otomatis dibuat sebagai varian terpisah dengan SKU {"`"}
          {skuPrefix || "SKU-Prefix"}-UKURAN{"`"} dan stok yang sama.
        </p>
      </div>
    </div>
  );
}
