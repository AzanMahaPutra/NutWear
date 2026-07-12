import type { Metadata } from "next";
import { AdminTopbar } from "@/features/admin/components/AdminTopbar";
import { ProductManagementView } from "@/features/admin/components/ProductManagementView";

export const metadata: Metadata = { title: "Manajemen Produk" };

export default function AdminProdukPage() {
  return (
    <>
      <AdminTopbar title="Manajemen Produk" />
      <ProductManagementView />
    </>
  );
}
