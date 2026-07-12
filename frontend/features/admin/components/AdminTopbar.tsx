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
    <header className="flex items-center justify-between border-b border-neutral-100 bg-white px-6 py-4">
      <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
          <User className="h-4 w-4" />
        </div>
        <span>{user?.namaLengkap ?? "Admin"}</span>
      </div>
    </header>
  );
}
