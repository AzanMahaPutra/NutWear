import type { Metadata } from "next";
import { AdminTopbar } from "@/features/admin/components/AdminTopbar";
import { DashboardView } from "@/features/admin/components/DashboardView";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default function AdminDashboardPage() {
  return (
    <>
      <AdminTopbar title="Dashboard" />
      <DashboardView />
    </>
  );
}
