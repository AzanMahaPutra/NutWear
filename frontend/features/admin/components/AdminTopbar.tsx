"use client";

import { User } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

interface AdminTopbarProps {
  title: string;
}

/**
 * Topbar Admin reusable — menampilkan judul halaman aktif + nama admin yang sedang login
 * (dari authStore, diisi AuthProvider lewat GET /users/me/profile).
 */
export function AdminTopbar({ title }: AdminTopbarProps) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 bg-white px-4 py-4 sm:px-6">
      <h1 className="text-lg font-bold text-neutral-900 sm:text-xl">{title}</h1>
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100">
          <User className="h-4 w-4" />
        </div>
        <span className="max-w-[140px] truncate sm:max-w-none">{user?.namaLengkap ?? "Admin"}</span>
      </div>
    </header>
  );
}
