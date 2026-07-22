import type { Metadata } from "next";
import { AdminTopbar } from "@/features/admin/components/AdminTopbar";
import { TransactionReportView } from "@/features/admin/components/TransactionReportView";

// UPDATE — Halaman Laporan Transaksi & Export Excel (Admin).
export const metadata: Metadata = { title: "Laporan Transaksi" };

export default function AdminLaporanTransaksiPage() {
  return (
    <>
      <AdminTopbar title="Laporan Transaksi" />
      <TransactionReportView />
    </>
  );
}
