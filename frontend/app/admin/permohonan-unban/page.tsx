import type { Metadata } from "next";
import { AdminTopbar } from "@/features/admin/components/AdminTopbar";
import { UnbanRequestManagementView } from "@/features/admin/components/UnbanRequestManagementView";

export const metadata: Metadata = { title: "Permohonan Unban" };

export default function AdminPermohonanUnbanPage() {
  return (
    <>
      <AdminTopbar title="Permohonan Unban" />
      <UnbanRequestManagementView />
    </>
  );
}
