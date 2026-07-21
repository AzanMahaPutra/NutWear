"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PackageX } from "lucide-react";
import { stockService, LowStockReport } from "@/services/stockService";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";

interface LowStockRow {
  variantId: string;
  productId: string;
  namaProduk: string;
  warna: string;
  ukuran: string;
  stok: number;
}

/**
 * Widget "Stok Menipis" di Dashboard Admin.
 *
 * Menampilkan produk/varian yang stoknya sudah mencapai Batas Minimum Stok
 * (lihat Pengaturan Admin), supaya Admin tidak perlu membuka satu per satu
 * halaman produk untuk mengecek stok. Data dihitung real-time dari
 * GET /stock/low-stock (bukan tabel notifikasi tersendiri), jadi otomatis
 * ikut berubah begitu stok atau Batas Minimum Stok diperbarui.
 *
 * Klik salah satu item langsung membuka halaman edit produk terkait, lewat
 * query param ?edit=productId yang dibaca ProductManagementView.
 */
export function LowStockWidget() {
  const [report, setReport] = useState<LowStockReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    (async () => {
      try {
        const data = await stockService.getLowStock();
        setReport(data);
      } catch (err) {
        showToast(getApiErrorMessage(err, "Gagal memuat data stok menipis"), "error");
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows: LowStockRow[] = (report?.items ?? []).flatMap((product) =>
    product.variants.map((variant) => ({
      variantId: variant.variantId,
      productId: product.productId,
      namaProduk: product.namaProduk,
      warna: variant.warna,
      ukuran: variant.ukuran,
      stok: variant.stok,
    }))
  );

  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-neutral-900">Stok Menipis</h3>
        {report && <span className="text-xs text-neutral-400">Batas minimum: {report.minimumStock}</span>}
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-400">Memuat...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-neutral-400">Semua stok produk masih aman.</p>
      ) : (
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {rows.map((row) => (
            <button
              key={row.variantId}
              type="button"
              onClick={() => router.push(`/admin/produk?edit=${row.productId}`)}
              className="flex w-full items-center justify-between rounded-lg border border-neutral-100 px-3 py-2.5 text-left transition hover:bg-neutral-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50">
                  <PackageX className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{row.namaProduk}</p>
                  <p className="text-xs text-neutral-500">
                    {row.warna} - {row.ukuran} (Stok {row.stok})
                  </p>
                </div>
              </div>
              <span className="whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                Segera Restock
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
