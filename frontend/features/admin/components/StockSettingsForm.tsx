"use client";

import { useEffect, useState } from "react";
import { stockService } from "@/services/stockService";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";

/**
 * Form Pengaturan Batas Minimum Stok (UPDATE — Notifikasi Stok Menipis untuk
 * Admin). Nilai ini dipakai di seluruh sistem: widget "Stok Menipis" pada
 * Dashboard Admin, filter "Tampilkan hanya stok menipis" pada Manajemen
 * Produk, dan badge status stok (Stok Aman/Menipis/Habis) — begitu disimpan,
 * seluruh pengecekan stok otomatis mengikuti nilai terbaru.
 */
export function StockSettingsForm() {
  const [minimumStock, setMinimumStock] = useState("15");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    (async () => {
      try {
        const value = await stockService.getMinimumStock();
        setMinimumStock(String(value));
      } catch (err) {
        showToast(getApiErrorMessage(err, "Gagal memuat pengaturan batas minimum stok"), "error");
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    const parsed = Number(minimumStock);
    if (!Number.isInteger(parsed) || parsed < 1) {
      showToast("Batas minimum stok harus berupa angka bulat lebih dari 0", "error");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await stockService.updateMinimumStock(parsed);
      setMinimumStock(String(updated));
      showToast("Batas minimum stok berhasil disimpan");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3.5">
      <label className="mb-1 block text-xs font-semibold text-neutral-500">Batas Minimum Stok</label>
      <p className="mb-2 text-xs text-neutral-400">
        Apabila stok produk atau varian sudah berada di angka ini atau lebih rendah, sistem akan menampilkan
        peringatan "Stok Menipis" pada Dashboard dan Manajemen Produk.
      </p>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={1}
          value={minimumStock}
          disabled={isLoading}
          onChange={(e) => setMinimumStock(e.target.value)}
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-900 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading || isSaving}
          className="whitespace-nowrap rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSaving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </div>
  );
}
