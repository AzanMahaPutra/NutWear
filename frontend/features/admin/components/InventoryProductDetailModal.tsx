"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { History, ImageOff, Pencil } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import {
  ProductStockBadge,
  StockStatusBadge,
  countStockStatuses,
  getStockStatus,
} from "@/components/shared/StockStatusBadge";
import { InventoryEditStockModal } from "@/features/admin/components/InventoryEditStockModal";
import { InventoryStockHistoryModal } from "@/features/admin/components/InventoryStockHistoryModal";
import {
  InventoryItem,
  InventoryProduct,
  InventoryProductDetail,
  InventoryVariant,
  StockStatus,
  StockStatusCounts,
  stockService,
} from "@/services/stockService";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { cn } from "@/utils/cn";

interface InventoryProductDetailModalProps {
  product: InventoryProduct | null;
  onClose: () => void;
  /** Dipanggil setelah stok varian berubah supaya baris produk di daftar ikut diperbarui tanpa refetch. */
  onProductChanged: (productId: string, counts: StockStatusCounts, totalStok: number) => void;
}

const STATUS_DOT: Record<StockStatus, string> = {
  aman: "bg-green-500",
  menipis: "bg-amber-500",
  habis: "bg-red-500",
};

const STAT_TILES: { key: "total" | StockStatus; label: string }[] = [
  { key: "total", label: "Total Variant" },
  { key: "aman", label: "Stok Aman" },
  { key: "menipis", label: "Stok Menipis" },
  { key: "habis", label: "Stok Habis" },
];

/**
 * Modal detail Inventory satu produk — pusat pengelolaan stok seluruh varian
 * produk tersebut (UPDATE #2: Inventory dikelompokkan per produk).
 *
 * Varian dimuat sekali saat modal dibuka (GET /stock/inventory/products/:id)
 * dan disimpan di state lokal. Statistik, status varian, dan status produk
 * SELALU dihitung dari state itu memakai getStockStatus/countStockStatuses
 * (satu sumber ambang batas minimum_stock), jadi setelah Edit Stok semuanya
 * ikut berubah tanpa refresh. Modal Edit Stok & Riwayat yang sudah ada dipakai
 * ulang, dirender setelah modal ini supaya tampil di atasnya.
 */
export function InventoryProductDetailModal({ product, onClose, onProductChanged }: InventoryProductDetailModalProps) {
  const [detail, setDetail] = useState<InventoryProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [history, setHistory] = useState<InventoryItem | null>(null);
  const showToast = useToastStore((s) => s.showToast);

  const productId = product?.productId;

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    setDetail(null);
    setSelectedId(null);
    setIsLoading(true);
    stockService
      .getInventoryProductDetail(productId)
      .then((result) => {
        if (cancelled) return;
        setDetail(result);
        setSelectedId(result.variants[0]?.variantId ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        showToast(getApiErrorMessage(err, "Gagal memuat detail inventory produk"), "error");
        onClose();
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const variants = detail?.variants ?? [];
  const minimumStock = detail?.minimumStock ?? 15;
  const counts = useMemo(
    () => countStockStatuses(variants.map((v) => v.stok), minimumStock),
    [variants, minimumStock]
  );
  const selected = variants.find((v) => v.variantId === selectedId) ?? null;
  const warnaList = useMemo(() => Array.from(new Set(variants.map((v) => v.warna))), [variants]);
  const sizesForColor = selected ? variants.filter((v) => v.warna === selected.warna) : [];

  function selectWarna(warna: string) {
    const sameSize = variants.find((v) => v.warna === warna && v.ukuran === selected?.ukuran);
    const next = sameSize ?? variants.find((v) => v.warna === warna);
    if (next) setSelectedId(next.variantId);
  }

  function toItem(v: InventoryVariant): InventoryItem {
    return {
      variantId: v.variantId,
      productId: detail!.productId,
      namaProduk: detail!.namaProduk,
      slug: detail!.slug,
      warna: v.warna,
      ukuran: v.ukuran,
      sku: v.sku,
      stok: v.stok,
      status: v.status,
      imageUrl: detail!.imageUrl,
    };
  }

  function handleStockSaved(variantId: string, stokBaru: number) {
    if (!detail) return;
    const nextVariants = detail.variants.map((v) =>
      v.variantId === variantId ? { ...v, stok: stokBaru, status: getStockStatus(stokBaru, minimumStock) } : v
    );
    setDetail({ ...detail, variants: nextVariants });
    onProductChanged(
      detail.productId,
      countStockStatuses(nextVariants.map((v) => v.stok), minimumStock),
      nextVariants.reduce((sum, v) => sum + v.stok, 0)
    );
    setEditing(null);
  }

  const imageUrl = detail?.imageUrl ?? product?.imageUrl ?? null;
  const total = variants.length;

  return (
    <>
      <Modal open={Boolean(product)} onClose={onClose} title="Detail Inventory" size="xl">
        {product && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-50">
                {imageUrl ? (
                  <Image src={imageUrl} alt={product.namaProduk} fill sizes="64px" className="object-cover" />
                ) : (
                  <ImageOff className="h-5 w-5 text-neutral-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-neutral-900">{product.namaProduk}</p>
                <p className="mt-0.5 text-sm text-neutral-500">
                  {isLoading ? "Memuat varian..." : `${total} variant · total stok ${variants.reduce((s, v) => s + v.stok, 0)}`}
                </p>
              </div>
              {!isLoading && total > 0 && <ProductStockBadge counts={counts} />}
            </div>

            {isLoading ? (
              <p className="py-10 text-center text-sm text-neutral-400">Memuat detail inventory...</p>
            ) : total === 0 ? (
              <p className="py-10 text-center text-sm text-neutral-400">Produk ini belum memiliki variant.</p>
            ) : (
              <>
                {/* Statistik ringkas — CSS saja, tanpa library chart. */}
                <section aria-label="Ringkasan inventory" className="rounded-lg border border-neutral-100 p-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {STAT_TILES.map((tile) => (
                      <div key={tile.key}>
                        <p className="flex items-center gap-1.5 text-xs text-neutral-500">
                          {tile.key !== "total" && <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[tile.key])} />}
                          {tile.label}
                        </p>
                        <p className="mt-0.5 text-2xl font-bold text-neutral-900">
                          {tile.key === "total" ? total : counts[tile.key]}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div
                    role="img"
                    aria-label={`${counts.aman} aman, ${counts.menipis} menipis, ${counts.habis} habis dari ${total} variant`}
                    className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-100"
                  >
                    {(["aman", "menipis", "habis"] as StockStatus[]).map(
                      (status) =>
                        counts[status] > 0 && (
                          <div
                            key={status}
                            className={cn("h-full transition-all duration-300", STATUS_DOT[status])}
                            style={{ width: `${(counts[status] / total) * 100}%` }}
                          />
                        )
                    )}
                  </div>
                </section>

                {/* Pilih variant: Warna → Ukuran, atau langsung lewat SKU. */}
                <section aria-label="Pilih variant" className="space-y-3">
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-neutral-500">Warna</p>
                    <div className="flex flex-wrap gap-2">
                      {warnaList.map((warna) => (
                        <button
                          key={warna}
                          type="button"
                          onClick={() => selectWarna(warna)}
                          aria-pressed={selected?.warna === warna}
                          className={cn(
                            "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                            selected?.warna === warna
                              ? "border-neutral-900 bg-neutral-900 text-white"
                              : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                          )}
                        >
                          {warna}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-xs font-medium text-neutral-500">Ukuran</p>
                    <div className="flex flex-wrap gap-2">
                      {sizesForColor.map((v) => (
                        <button
                          key={v.variantId}
                          type="button"
                          onClick={() => setSelectedId(v.variantId)}
                          aria-pressed={selectedId === v.variantId}
                          className={cn(
                            "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                            selectedId === v.variantId
                              ? "border-neutral-900 bg-neutral-900 text-white"
                              : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                          )}
                        >
                          <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[v.status])} />
                          {v.ukuran}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="inventory-sku-select" className="mb-1.5 block text-xs font-medium text-neutral-500">
                      SKU
                    </label>
                    <select
                      id="inventory-sku-select"
                      value={selectedId ?? ""}
                      onChange={(e) => setSelectedId(e.target.value)}
                      className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm sm:max-w-xs"
                    >
                      {variants.map((v) => (
                        <option key={v.variantId} value={v.variantId}>
                          {v.sku || "(tanpa SKU)"} — {v.warna} / {v.ukuran}
                        </option>
                      ))}
                    </select>
                  </div>
                </section>

                {selected && (
                  <section aria-label="Detail variant" className="rounded-lg bg-neutral-50 p-4">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
                      <div>
                        <dt className="text-xs text-neutral-500">SKU</dt>
                        <dd className="mt-0.5 break-all font-medium text-neutral-900">{selected.sku || "-"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-neutral-500">Warna</dt>
                        <dd className="mt-0.5 font-medium text-neutral-900">{selected.warna}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-neutral-500">Ukuran</dt>
                        <dd className="mt-0.5 font-medium text-neutral-900">{selected.ukuran}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-neutral-500">Stok Saat Ini</dt>
                        <dd className="mt-0.5 text-lg font-bold text-neutral-900">{selected.stok}</dd>
                      </div>
                    </dl>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <StockStatusBadge status={selected.status} />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setHistory(toItem(selected))}
                          className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                        >
                          <History className="h-3.5 w-3.5" /> Riwayat
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(toItem(selected))}
                          className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit Stok
                        </button>
                      </div>
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      <InventoryEditStockModal
        item={editing}
        onClose={() => setEditing(null)}
        onSaved={handleStockSaved}
        onViewHistory={(item) => {
          setEditing(null);
          setHistory(item);
        }}
      />
      <InventoryStockHistoryModal item={history} onClose={() => setHistory(null)} />
    </>
  );
}
