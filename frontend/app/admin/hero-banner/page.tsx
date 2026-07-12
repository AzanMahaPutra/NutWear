import type { Metadata } from "next";
import { AdminTopbar } from "@/features/admin/components/AdminTopbar";
import { HeroBannerManagementView } from "@/features/admin/components/HeroBannerManagementView";

export const metadata: Metadata = { title: "Manajemen Hero Banner" };

export default function AdminHeroBannerPage() {
  return (
    <>
      <AdminTopbar title="Manajemen Hero Banner" />
      <HeroBannerManagementView />
    </>
  );
}
