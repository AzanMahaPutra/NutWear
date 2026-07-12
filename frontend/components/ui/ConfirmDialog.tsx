"use client";

import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Dialog konfirmasi generic reusable (dibangun di atas Modal yang sudah ada) —
 * dipakai sebelum aksi destruktif seperti hapus pesanan, supaya tidak memakai
 * `window.confirm` bawaan browser.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Ya, Hapus",
  cancelLabel = "Batal",
  isLoading = false,
  variant = "danger",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            variant === "danger" ? "bg-red-50 text-red-500" : "bg-neutral-100 text-neutral-600"
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="pt-2 text-sm text-neutral-600">{description}</p>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
            variant === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-neutral-900 hover:bg-neutral-800"
          }`}
        >
          {isLoading ? "Memproses..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
