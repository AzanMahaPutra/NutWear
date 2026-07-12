import type { Metadata } from "next";
import { AdminTopbar } from "@/features/admin/components/AdminTopbar";
import { ReviewManagementView } from "@/features/admin/components/ReviewManagementView";

export const metadata: Metadata = { title: "Manajemen Review" };

export default function AdminReviewPage() {
  return (
    <>
      <AdminTopbar title="Manajemen Review" />
      <ReviewManagementView />
    </>
  );
}
