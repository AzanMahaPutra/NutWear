import { AdminSidebar } from "@/features/admin/components/AdminSidebar";
import { AuthGuard } from "@/components/shared/AuthGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireRole="admin">
      <div className="flex min-h-screen bg-neutral-50">
        <AdminSidebar />
        <div className="flex-1">{children}</div>
      </div>
    </AuthGuard>
  );
}
