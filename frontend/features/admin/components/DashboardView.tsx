"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Package, Users, ShoppingBag, Wallet } from "lucide-react";
import { StatCard } from "@/features/admin/components/StatCard";
import { DataTable } from "@/components/shared/DataTable";
import { dashboardService, DashboardSummary } from "@/services/dashboardService";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { formatCurrency } from "@/utils/formatCurrency";

/**
 * SalesChart di-lazy-load (code splitting) karena recharts adalah library berat
 * yang hanya dibutuhkan di halaman Dashboard Admin — tidak perlu ikut ke bundle
 * halaman lain. ssr: false karena chart butuh ResponsiveContainer (butuh window).
 */
const SalesChart = dynamic(
  () => import("@/features/admin/components/SalesChart").then((mod) => mod.SalesChart),
  { ssr: false, loading: () => <div className="h-[280px] animate-pulse rounded-xl bg-neutral-100" /> }
);

/**
 * View utama Dashboard Admin — fetch dari Admin Dashboard API sungguhan
 * (GET /admin/dashboard/summary), menggantikan dummy data Fase 1.
 */
export function DashboardView() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    (async () => {
      try {
        const data = await dashboardService.getSummary();
        setSummary(data);
      } catch (err) {
        showToast(getApiErrorMessage(err, "Gagal memuat ringkasan dashboard"), "error");
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading || !summary) {
    return <div className="p-6 text-sm text-neutral-400">Memuat dashboard...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Jumlah Produk" value={summary.stats.totalProduk.toString()} icon={Package} />
        <StatCard label="Jumlah Pelanggan" value={summary.stats.totalPelanggan.toString()} icon={Users} />
        <StatCard label="Jumlah Pesanan" value={summary.stats.totalPesanan.toString()} icon={ShoppingBag} />
        <StatCard label="Pendapatan" value={formatCurrency(summary.stats.pendapatan)} icon={Wallet} />
      </div>

      <SalesChart data={summary.salesChart} />

      <div>
        <h3 className="mb-3 text-base font-bold text-neutral-900">Produk Terlaris</h3>
        <DataTable
          rowKey={(p) => p.productId}
          data={summary.bestsellers}
          emptyTitle="Belum ada data penjualan"
          columns={[
            { key: "nama", header: "Nama Produk", render: (p) => p.namaProduk },
            { key: "terjual", header: "Total Terjual", render: (p) => p.totalTerjual },
          ]}
        />
      </div>
    </div>
  );
}
