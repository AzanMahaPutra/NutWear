import type { Metadata } from "next";
import { AdminTopbar } from "@/features/admin/components/AdminTopbar";
import { BannerManagementView } from "@/features/admin/components/BannerManagementView";

export const metadata: Metadata = { title: "Manajemen Banner" };

export default function AdminBannerPage() {
  return (
    <>
      <AdminTopbar title="Manajemen Banner" />
      <BannerManagementView />
    </>
  );
}
