"use client";

import { useEffect, useState } from "react";
import { Shirt, Trash2 } from "lucide-react";
import { PairedProduct, productService } from "@/services/productService";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { formatCurrency } from "@/utils/formatCurrency";

interface ProductPairingManagerProps {
  productId: string;
}

/**
 * "Pasangan Produk" — admin memasangkan produk ini dengan produk lain lewat SKU
 * varian produk tsb (mis. KAOS-BLUE-AB dipasangkan dengan BAWAHAN-DARKBROWN-AB).
 * Relasi dua arah, dipakai halaman Detail Produk untuk menampilkan rekomendasi outfit.
 */
export function ProductPairingManager({ productId }: ProductPairingManagerProps) {
  const [pairs, setPairs] = useState<PairedProduct[]>([]);
  const [sku, setSku] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    productService
      .getPairs(productId)
      .then(setPairs)
      .catch(() => setPairs([]))
      .finally(() => setIsLoading(false));
  }, [productId]);

  async function handleAddPair() {
    if (!sku.trim()) {
      showToast("Masukkan SKU produk pasangan", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const updated = await productService.addPair(productId, sku.trim());
      setPairs(updated);
      setSku("");
      showToast("Pasangan produk berhasil ditambahkan");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemovePair(pairedProductId: string) {
    try {
      const updated = await productService.removePair(productId, pairedProductId);
      setPairs(updated);
      showToast("Pasangan produk dihapus");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  return (
    <div>
      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-neutral-800">
        <Shirt className="h-4 w-4" /> Pasangan Produk
      </h4>

      {!isLoading && pairs.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {pairs.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 rounded-md bg-neutral-50 px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                {p.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.namaProduk} className="h-8 w-8 rounded-md object-cover" />
                )}
                <span>
                  {p.namaProduk} · {formatCurrency(p.harga)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemovePair(p.id)}
                aria-label="Hapus pasangan"
                className="rounded-md border border-red-200 p-1 text-red-500 hover:bg-white"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="SKU produk pasangan (mis. BAWAHAN-DARKBROWN-AB)"
          className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none"
        />
        <button
          type="button"
          onClick={handleAddPair}
          disabled={isSubmitting}
          aria-label="Tambahkan pasangan produk"
          className="flex items-center gap-1 rounded-md border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 disabled:opacity-60"
        >
          <Shirt className="h-3.5 w-3.5" /> Pasangkan
        </button>
      </div>
    </div>
  );
}
