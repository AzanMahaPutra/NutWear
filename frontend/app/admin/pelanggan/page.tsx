import type { Metadata } from "next";
import { AdminTopbar } from "@/features/admin/components/AdminTopbar";
import { CustomerManagementView } from "@/features/admin/components/CustomerManagementView";

export const metadata: Metadata = { title: "Manajemen Pelanggan" };

export default function AdminPelangganPage() {
  return (
    <>
      <AdminTopbar title="Manajemen Pelanggan" />
      <CustomerManagementView />
    </>
  );
}
