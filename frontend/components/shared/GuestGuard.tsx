"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { ROUTES } from "@/constants/routes";

interface GuestGuardProps {
  children: React.ReactNode;
}

/**
 * Kebalikan dari AuthGuard: dipakai di halaman Login & Register supaya user
 * yang SUDAH login tidak bisa mengakses halaman tersebut lagi kecuali sudah
 * Logout terlebih dahulu. Sama seperti AuthGuard, menunggu AuthProvider
 * selesai silent-refresh (isInitializing) dulu sebelum memutuskan, supaya
 * user yang sudah login tidak sempat melihat form Login/Register sekilas
 * sebelum di-redirect ke Beranda.
 */
export function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);

  useEffect(() => {
    if (isInitializing) return;
    if (user) {
      router.replace(ROUTES.home);
    }
  }, [isInitializing, user, router]);

  if (isInitializing || user) {
    // Placeholder ringan, mengikuti palet warna & lebar form Login/Register
    // yang sudah ada (max-w-md dari AuthLayout) — bukan skeleton produk,
    // supaya tidak "meminjam" tampilan bagian lain dari website.
    return (
      <div className="animate-pulse space-y-4">
        <div className="mx-auto h-8 w-40 rounded bg-neutral-100" />
        <div className="h-11 rounded-lg bg-neutral-100" />
        <div className="h-11 rounded-lg bg-neutral-100" />
        <div className="h-12 rounded-full bg-neutral-100" />
      </div>
    );
  }

  return <>{children}</>;
}
