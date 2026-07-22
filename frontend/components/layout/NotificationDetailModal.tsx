"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { formatNotificationTime } from "@/utils/formatDate";
import { AppNotification } from "@/types/user";

interface NotificationDetailModalProps {
  notification: AppNotification | null;
  onClose: () => void;
}

/**
 * UPDATE — Notifikasi Banned User: modal detail yang tampil saat user membuka
 * notifikasi kategori "account_warning" (Akun Dibanned / Permohonan Unban
 * Ditolak) atau "account_success" (Permohonan Unban Disetujui). Memakai ikon
 * besar Segitiga Merah/Centang Hijau sesuai kategori, bukan lonceng biasa,
 * supaya identitas visualnya berbeda dari notifikasi lain (order/promo/produk).
 *
 * Untuk kategori "account_warning", tombol "Ajukan Permohonan Unban" langsung
 * mengarahkan ke halaman Profile (?unban=1) yang otomatis membuka form
 * permohonan unban yang sudah ada di sana (lihat ProfileView.tsx).
 */
export function NotificationDetailModal({ notification, onClose }: NotificationDetailModalProps) {
  const router = useRouter();

  if (!notification) return null;
  const isWarning = notification.type === "account_warning";
  const isSuccess = notification.type === "account_success";
  if (!isWarning && !isSuccess) return null;

  function handleAjukanUnban() {
    onClose();
    router.push("/profile?unban=1");
  }

  return (
    <Modal open={!!notification} onClose={onClose} title={isWarning ? "Peringatan Akun" : "Status Akun"}>
      <div className="flex flex-col items-center text-center">
        <span
          className={
            isWarning
              ? "flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600"
              : "flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600"
          }
        >
          {isWarning ? <AlertTriangle className="h-8 w-8" /> : <CheckCircle2 className="h-8 w-8" />}
        </span>

        <h4 className="mt-4 text-base font-bold text-neutral-900">{notification.title}</h4>
        <p className="mt-1 text-xs text-neutral-400">{formatNotificationTime(notification.createdAt)}</p>

        <p className="mt-4 whitespace-pre-line text-left text-sm leading-relaxed text-neutral-700">
          {notification.message}
        </p>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          Tutup
        </button>
        {isWarning && (
          <button
            type="button"
            onClick={handleAjukanUnban}
            className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Ajukan Permohonan Unban
          </button>
        )}
      </div>
    </Modal>
  );
}
