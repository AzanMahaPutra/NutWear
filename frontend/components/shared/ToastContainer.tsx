"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useToastStore } from "@/stores/toastStore";
import { cn } from "@/utils/cn";

/**
 * Menampilkan seluruh toast aktif dari useToastStore.
 * Dipasang sekali di RootLayout supaya bisa dipicu dari halaman mana pun.
 */
export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg",
            toast.type === "success" ? "bg-neutral-900" : "bg-red-600"
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {toast.message}
        </div>
      ))}
    </div>
  );
}
