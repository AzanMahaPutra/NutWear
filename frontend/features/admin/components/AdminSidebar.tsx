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
  FileSpreadsheet,
  Users,
  UserX,
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
  // UPDATE — Laporan Transaksi & Export Excel: menu baru, khusus transaksi yang
  // pembayarannya sudah berhasil (Sudah Dibayar/Settlement), ditempatkan tepat
  // di bawah "Pesanan" karena sama-sama seputar data order.
  { label: "Laporan Transaksi", href: ROUTES.admin.laporanTransaksi, icon: FileSpreadsheet },
  { label: "Manajemen User", href: ROUTES.admin.pelanggan, icon: Users },
  // UPDATE — Pengajuan Unban: menu baru khusus permohonan pembukaan blokir akun.
  { label: "Permohonan Unban", href: ROUTES.admin.permohonanUnban, icon: UserX },
  { label: "Review", href: ROUTES.admin.review, icon: Star },
  { label: "Pengaturan", href: ROUTES.admin.pengaturan, icon: Settings },
];

/**
 * Sidebar navigasi Admin — reusable dipakai di AdminLayout untuk semua halaman /admin/*.
 */
export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 border-b border-neutral-100 bg-white lg:w-64 lg:border-b-0 lg:border-r lg:block">
      <div className="flex items-center justify-between border-b border-neutral-100 p-4 lg:block lg:p-6">
        <div>
          <Logo />
          <p className="mt-1 text-xs text-neutral-400">Admin Panel</p>
        </div>
      </div>
      <nav className="flex w-full flex-row space-x-2 overflow-x-auto p-4 lg:flex-col lg:space-x-0 lg:space-y-1">
        {ADMIN_NAV.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
