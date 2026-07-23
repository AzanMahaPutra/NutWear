"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { InventoryItem, StockLogEntry, stockService } from "@/services/stockService";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { formatDateTime } from "@/utils/formatDate";

interface InventoryStockHistoryModalProps {
  item: InventoryItem | null;
  onClose: () => void;
}

/**
 * Modal "Riwayat Perubahan Stok" — Halaman Inventory Stock Admin.
 *
 * Menampilkan histori satu varian: Stok Lama, Stok Baru, Selisih Perubahan,
 * Admin yang mengubah, dan Tanggal Perubahan (lihat GET /stock/:variantId/logs,
 * data tidak pernah dihapus — stockRepository.js hanya pernah INSERT ke
 * stock_logs, tidak ada operasi DELETE/UPDATE atas baris log).
 */
export function InventoryStockHistoryModal({ item, onClose }: InventoryStockHistoryModalProps) {
  const [logs, setLogs] = useState<StockLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    if (!item) return;
    setIsLoading(true);
    stockService
      .getLogs(item.variantId)
      .then(setLogs)
      .catch((err) => showToast(getApiErrorMessage(err, "Gagal memuat riwayat stok"), "error"))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.variantId]);

  if (!item) return null;

  return (
    <Modal open={Boolean(item)} onClose={onClose} title="Riwayat Perubahan Stok" size="xl">
      <div className="mb-4 rounded-lg bg-neutral-50 p-3 text-sm">
        <p className="font-semibold text-neutral-900">{item.namaProduk}</p>
        <p className="mt-0.5 text-neutral-500">
          {item.warna} · {item.ukuran} {item.sku && `· SKU: ${item.sku}`}
        </p>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-sm text-neutral-400">Memuat riwayat...</p>
      ) : logs.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-400">Belum ada riwayat perubahan stok untuk varian ini.</p>
      ) : (
        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2.5 text-sm">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    log.selisih >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  }`}
                >
                  {log.selisih >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                </div>
                <div>
                  <p className="font-medium text-neutral-800">
                    {log.stokSebelum ?? "-"} → {log.stokSesudah ?? "-"}{" "}
                    <span className={log.selisih >= 0 ? "text-green-600" : "text-red-600"}>
                      ({log.selisih >= 0 ? "+" : ""}
                      {log.selisih})
                    </span>
                  </p>
                  <p className="text-xs text-neutral-400">
                    {log.adminNama ?? "Sistem"} · {formatDateTime(log.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
