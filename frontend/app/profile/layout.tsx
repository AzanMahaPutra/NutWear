import { MainLayout } from "@/components/layout/MainLayout";
import { Container } from "@/components/ui/Container";
import { ProfileSidebar } from "@/features/profile/components/ProfileSidebar";
import { AuthGuard } from "@/components/shared/AuthGuard";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout>
      <AuthGuard>
        <Container className="flex flex-col gap-10 py-8 md:flex-row">
          <ProfileSidebar />
          <div className="flex-1">{children}</div>
        </Container>
      </AuthGuard>
    </MainLayout>
  );
}
