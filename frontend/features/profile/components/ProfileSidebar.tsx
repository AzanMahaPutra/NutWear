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
    <nav className="flex w-full shrink-0 flex-row gap-4 overflow-x-auto pb-4 pt-2 text-sm md:w-48 md:flex-col md:gap-0 md:space-y-3 md:overflow-visible md:pb-0">
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
