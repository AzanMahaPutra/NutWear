import { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
}

/**
 * Kartu statistik reusable di Dashboard Admin (jumlah produk, pelanggan, pesanan, pendapatan).
 */
export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-neutral-500">{label}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
          <Icon className="h-4 w-4 text-neutral-700" />
        </div>
      </div>
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
      {trend && (
        <p className={cn("mt-1 text-xs font-medium", trend.positive ? "text-green-600" : "text-red-500")}>
          {trend.positive ? "▲" : "▼"} {trend.value}
        </p>
      )}
    </div>
  );
}
