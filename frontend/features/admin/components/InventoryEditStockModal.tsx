"use client";

import { useEffect, useState } from "react";
import { History, Minus, Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { InventoryItem, stockService } from "@/services/stockService";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";

interface InventoryEditStockModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onSaved: (variantId: string, stokBaru: number) => void;
  onViewHistory: (item: InventoryItem) => void;
}

const QUICK_ADJUSTMENTS = [5, 10, -5, -10];

/**
 * Modal "Edit Stok" — Halaman Inventory Stock Admin.
 *
 * Menampilkan Nama Produk, Warna, Ukuran, dan Stok Saat Ini (info, bukan
 * input), lalu input "Stok Baru" yang bisa diisi manual ATAU lewat tombol
 * Quick Adjustment (+5/+10/-5/-10, tinggal menambah/mengurangi dari stok yang
 * sedang ditampilkan) — keduanya menulis ke input yang sama supaya Admin
 * tetap bisa mengedit manual setelah menekan Quick Adjustment. Validasi
 * (wajib angka, tidak boleh negatif/kosong) sesuai dokumen permintaan bagian
 * "VALIDASI"; validasi akhir tetap dilakukan lagi di backend
 * (stockValidator.js) sebagai sumber kebenaran.
 */
export function InventoryEditStockModal({ item, onClose, onSaved, onViewHistory }: InventoryEditStockModalProps) {
  const [value, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    if (item) setValue(String(item.stok));
  }, [item]);

  if (!item) return null;

  function applyQuickAdjustment(delta: number) {
    const current = Number(value);
    const base = Number.isFinite(current) ? current : item!.stok;
    const next = Math.max(base + delta, 0);
    setValue(String(next));
  }

  function handleChange(raw: string) {
    // Hanya menerima digit (angka bulat) — mencegah huruf/simbol sejak awal pengetikan.
    if (raw === "" || /^\d+$/.test(raw)) {
      setValue(raw);
    }
  }

  async function handleSave() {
    if (value.trim() === "") {
      showToast("Stok wajib diisi", "error");
      return;
    }
    const stokBaru = Number(value);
    if (!Number.isInteger(stokBaru) || stokBaru < 0) {
      showToast("Stok harus berupa angka dan tidak boleh negatif", "error");
      return;
    }

    setIsSaving(true);
    try {
      await stockService.setStock(item!.variantId, stokBaru);
      showToast("Stok berhasil diperbarui");
      onSaved(item!.variantId, stokBaru);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal memperbarui stok"), "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal open={Boolean(item)} onClose={onClose} title="Edit Stok">
      <div className="space-y-4">
        <div className="rounded-lg bg-neutral-50 p-3 text-sm">
          <p className="font-semibold text-neutral-900">{item.namaProduk}</p>
          <p className="mt-0.5 text-neutral-500">
            {item.warna} · {item.ukuran} {item.sku && `· SKU: ${item.sku}`}
          </p>
          <p className="mt-1 text-neutral-600">
            Stok Saat Ini: <span className="font-semibold">{item.stok}</span>
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Stok Baru</label>
          <input
            type="text"
            inputMode="numeric"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full rounded-md border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
            placeholder="Masukkan jumlah stok"
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-neutral-500">Quick Adjustment</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ADJUSTMENTS.map((delta) => (
              <button
                key={delta}
                type="button"
                onClick={() => applyQuickAdjustment(delta)}
                className="flex items-center gap-1 rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
              >
                {delta > 0 ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                {Math.abs(delta)}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onViewHistory(item)}
          className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800"
        >
          <History className="h-3.5 w-3.5" /> Lihat Riwayat Perubahan Stok
        </button>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {isSaving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
