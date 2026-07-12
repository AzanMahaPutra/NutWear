"use client";

import { X } from "lucide-react";
import { cn } from "@/utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "md" | "xl" | "2xl";
}

const SIZE_CLASS: Record<NonNullable<ModalProps["size"]>, string> = {
  md: "max-w-md",
  xl: "max-w-3xl",
  "2xl": "max-w-5xl",
};

/**
 * Modal generic reusable — dipakai untuk form Edit Profile, Tambah Alamat, dll.
 * `size="xl"` dipakai untuk form yang lebih kompleks (mis. Banner Builder).
 * `size="2xl"` dipakai untuk form yang sangat kompleks dengan banyak section
 * berdampingan (mis. Tambah/Edit Produk yang punya section Harga, Variant,
 * Fitur, dan Detail Produk sekaligus) supaya field tidak saling bertumpuk.
 */
export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className={cn("max-h-[90vh] w-full overflow-y-auto rounded-lg bg-white p-6", SIZE_CLASS[size])}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-neutral-900">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
