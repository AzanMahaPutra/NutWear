"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Image as ImageIcon,
  GalleryHorizontal,
  ShoppingBag,
  Users,
  Star,
  Settings,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/utils/cn";

const ADMIN_NAV = [
  { label: "Dashboard", href: ROUTES.admin.dashboard, icon: LayoutDashboard },
  { label: "Produk", href: ROUTES.admin.produk, icon: Package },
  { label: "Kategori", href: ROUTES.admin.kategori, icon: FolderTree },
  { label: "Banner Produk", href: ROUTES.admin.banner, icon: ImageIcon },
  { label: "Hero Banner", href: ROUTES.admin.heroBanner, icon: GalleryHorizontal },
  { label: "Pesanan", href: ROUTES.admin.pesanan, icon: ShoppingBag },
  { label: "Pelanggan", href: ROUTES.admin.pelanggan, icon: Users },
  { label: "Review", href: ROUTES.admin.review, icon: Star },
  { label: "Pengaturan", href: ROUTES.admin.pengaturan, icon: Settings },
];

/**
 * Sidebar navigasi Admin — reusable dipakai di AdminLayout untuk semua halaman /admin/*.
 */
export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-neutral-100 bg-white lg:block">
      <div className="border-b border-neutral-100 p-6">
        <Logo />
        <p className="mt-1 text-xs text-neutral-400">Admin Panel</p>
      </div>
      <nav className="space-y-1 p-4">
        {ADMIN_NAV.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
