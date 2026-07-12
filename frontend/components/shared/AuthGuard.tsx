"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { ROUTES } from "@/constants/routes";
import { Container } from "@/components/ui/Container";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";

interface AuthGuardProps {
  children: React.ReactNode;
  requireRole?: "admin" | "customer";
}

/**
 * Guard reusable untuk halaman yang butuh login (Profile, Riwayat Pesanan)
 * atau khusus role tertentu (Admin Dashboard). Menunggu AuthProvider selesai
 * silent-refresh (isInitializing) sebelum memutuskan redirect, supaya user
 * yang sudah login tidak sempat "dilempar" ke halaman login saat refresh halaman.
 */
export function AuthGuard({ children, requireRole }: AuthGuardProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      router.replace(ROUTES.login);
      return;
    }
    if (requireRole && user.role !== requireRole) {
      router.replace(ROUTES.home);
    }
  }, [isInitializing, user, requireRole, router]);

  if (isInitializing || !user || (requireRole && user.role !== requireRole)) {
    return (
      <Container className="py-10">
        <ProductCardSkeleton />
      </Container>
    );
  }

  return <>{children}</>;
}
