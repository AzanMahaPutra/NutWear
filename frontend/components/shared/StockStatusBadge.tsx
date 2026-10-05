import { cn } from "@/utils/cn";
import { StockStatus } from "@/services/stockService";

const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  aman: "Stok Aman",
  menipis: "Stok Menipis",
  habis: "Stok Habis",
};

const STOCK_STATUS_COLOR: Record<StockStatus, string> = {
  aman: "bg-green-100 text-green-700",
  menipis: "bg-amber-100 text-amber-700",
  habis: "bg-red-100 text-red-700",
};

/**
 * Menentukan status stok dari nilai stok & Batas Minimum Stok yang berlaku
 * (lihat Pengaturan Admin). Dipakai bersama <StockStatusBadge /> di tabel
 * Manajemen Produk dan tabel Varian pada form Produk Admin.
 */
export function getStockStatus(stok: number, minimumStock: number): StockStatus {
  if (stok <= 0) return "habis";
  if (stok <= minimumStock) return "menipis";
  return "aman";
}

/**
 * Badge status stok (Stok Aman/Stok Menipis/Stok Habis) reusable.
 */
export function StockStatusBadge({ status }: { status: StockStatus }) {
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STOCK_STATUS_COLOR[status])}>
      {STOCK_STATUS_LABEL[status]}
    </span>
  );
}
