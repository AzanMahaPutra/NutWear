import type { Metadata } from "next";
import { AdminTopbar } from "@/features/admin/components/AdminTopbar";
import { CategoryManagementView } from "@/features/admin/components/CategoryManagementView";

export const metadata: Metadata = { title: "Manajemen Kategori" };

export default function AdminKategoriPage() {
  return (
    <>
      <AdminTopbar title="Manajemen Kategori" />
      <CategoryManagementView />
    </>
  );
}
