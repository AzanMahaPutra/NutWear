import type { Metadata } from "next";
import { AdminTopbar } from "@/features/admin/components/AdminTopbar";
import { OrderManagementView } from "@/features/admin/components/OrderManagementView";

export const metadata: Metadata = { title: "Manajemen Pesanan" };

export default function AdminPesananPage() {
  return (
    <>
      <AdminTopbar title="Manajemen Pesanan" />
      <OrderManagementView />
    </>
  );
}
