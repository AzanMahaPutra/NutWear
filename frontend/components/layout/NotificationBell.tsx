"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Package, Sparkles, Tag, CheckCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { useNotificationStore } from "@/stores/notificationStore";
import { formatNotificationTime } from "@/utils/formatDate";
import { AppNotification, NotificationType } from "@/types/user";
import { NotificationDetailModal } from "@/components/layout/NotificationDetailModal";

const TYPE_ICON: Record<NotificationType, typeof Package> = {
  order_status: Package,
  new_arrival: Sparkles,
  promo: Tag,
  // UPDATE — Notifikasi Banned User: ikon khusus (bukan lonceng biasa) supaya
  // user langsung menyadari notifikasi ini penting/berkaitan dengan keamanan akun.
  account_warning: AlertTriangle,
  account_success: CheckCircle2,
};

const TYPE_ICON_STYLE: Record<NotificationType, string> = {
  order_status: "bg-indigo-100 text-indigo-600",
  new_arrival: "bg-emerald-100 text-emerald-600",
  promo: "bg-red-100 text-red-600",
  account_warning: "bg-red-100 text-red-600",
  account_success: "bg-green-100 text-green-600",
};

/** Kategori yang memakai identitas visual "penting" (badge & border merah tipis
 * pada baris notifikasi), bukan hanya ikon — sesuai permintaan agar notifikasi
 * keamanan akun langsung terlihat berbeda dari notifikasi biasa. */
const IMPORTANT_TYPES: NotificationType[] = ["account_warning"];

/**
 * Icon Notifikasi (Bell) di Navbar User — Update 1: Sistem Notifikasi User.
 * Posisi di sebelah kanan icon Keranjang. Badge merah menampilkan jumlah
 * notifikasi belum dibaca, dan dropdown menampilkan daftar notifikasi terbaru
 * (Status Pesanan, New Arrival, Promo Produk) tanpa perlu pindah halaman.
 */
export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const items = useNotificationStore((s) => s.items);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isLoading = useNotificationStore((s) => s.isLoading);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  // UPDATE — Notifikasi Banned User: notifikasi kategori account_warning/
  // account_success membuka modal detail (ikon besar + alasan/tanggal + tombol
  // Ajukan Permohonan Unban) alih-alih langsung pindah halaman seperti kategori lain.
  const [detailNotification, setDetailNotification] = useState<AppNotification | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications();
  }

  async function handleItemClick(notification: AppNotification) {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    if (notification.type === "account_warning" || notification.type === "account_success") {
      setOpen(false);
      setDetailNotification(notification);
      return;
    }
    setOpen(false);
    if (notification.link) router.push(notification.link);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifikasi"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-800 transition-colors hover:bg-neutral-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-lg border border-neutral-100 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <p className="text-sm font-semibold text-neutral-900">Notifikasi</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Tandai Semua Sudah Dibaca
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <p className="p-4 text-center text-sm text-neutral-400">Memuat notifikasi...</p>
            ) : items.length === 0 ? (
              <p className="p-6 text-center text-sm text-neutral-400">Belum ada notifikasi</p>
            ) : (
              items.map((notification) => {
                const Icon = TYPE_ICON[notification.type];
                const isImportant = IMPORTANT_TYPES.includes(notification.type);
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleItemClick(notification)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-l-2 border-neutral-50 border-l-transparent px-4 py-3 text-left last:border-b-0 hover:bg-neutral-50",
                      !notification.isRead && "bg-neutral-50/80",
                      isImportant && "border-l-red-500 bg-red-50/40 hover:bg-red-50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        TYPE_ICON_STYLE[notification.type]
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "truncate text-sm text-neutral-900",
                            !notification.isRead && "font-semibold"
                          )}
                        >
                          {notification.title}
                        </span>
                        {isImportant && (
                          <span className="shrink-0 rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                            Penting
                          </span>
                        )}
                        {!notification.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-red-600" />}
                      </span>
                      <span className="mt-0.5 block text-xs text-neutral-600 line-clamp-2">{notification.message}</span>
                      <span className="mt-1 block text-[11px] text-neutral-400">
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      <NotificationDetailModal
        notification={detailNotification}
        onClose={() => setDetailNotification(null)}
      />
    </div>
  );
}
