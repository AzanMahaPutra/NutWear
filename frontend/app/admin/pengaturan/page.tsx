import type { Metadata } from "next";
import { AdminTopbar } from "@/features/admin/components/AdminTopbar";
import { StockSettingsForm } from "@/features/admin/components/StockSettingsForm";

export const metadata: Metadata = { title: "Pengaturan" };

/**
 * Halaman Pengaturan toko — dummy di Fase 1.
 * Akan disambungkan ke Admin Dashboard API (pengaturan umum) pada Fase 3.
 *
 * UPDATE — Notifikasi Stok Menipis untuk Admin: bagian "Batas Minimum Stok"
 * sudah terhubung ke Stock API sungguhan (lihat StockSettingsForm), field
 * lain di halaman ini masih dummy seperti sebelumnya.
 */
export default function AdminPengaturanPage() {
  return (
    <>
      <AdminTopbar title="Pengaturan" />
      <div className="max-w-xl space-y-4 p-6">
        <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3.5">
          <label className="mb-1 block text-xs font-semibold text-neutral-500">Nama Toko</label>
          <input defaultValue="NutWear" className="w-full text-sm outline-none" />
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3.5">
          <label className="mb-1 block text-xs font-semibold text-neutral-500">Email Toko</label>
          <input defaultValue="hello@nutwear.co" className="w-full text-sm outline-none" />
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3.5">
          <label className="mb-1 block text-xs font-semibold text-neutral-500">Nomor WhatsApp Toko</label>
          <input defaultValue="+62 812 3456 7890" className="w-full text-sm outline-none" />
        </div>
        <button type="button" className="w-full rounded-full bg-neutral-900 py-3 text-sm font-semibold text-white">
          Simpan Pengaturan
        </button>

        <StockSettingsForm />
      </div>
    </>
  );
}
