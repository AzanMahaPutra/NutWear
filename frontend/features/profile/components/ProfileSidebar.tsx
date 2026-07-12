"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/utils/cn";

const PROFILE_NAV = [
  { label: "Profile", href: ROUTES.profile },
  { label: "Riwayat Pesanan", href: ROUTES.riwayatPesanan },
];

/**
 * Sidebar navigasi akun (Profile / Riwayat Pesanan) sesuai desain.
 * Reusable dipakai di semua halaman dalam /profile.
 */
export function ProfileSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-48 shrink-0 space-y-3 pt-2 text-sm">
      {PROFILE_NAV.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block text-neutral-500 transition-colors hover:text-neutral-900",
              isActive && "font-semibold text-neutral-900 underline underline-offset-4"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
