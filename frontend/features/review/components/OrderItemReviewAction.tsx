"use client";

import { useState } from "react";
import { PenLine, SquarePen } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { WriteReviewForm } from "@/features/review/components/WriteReviewForm";
import { OrderItem, OrderItemReview } from "@/types/user";

interface OrderItemReviewActionProps {
  orderId: string;
  item: OrderItem;
  /** true hanya kalau pesanan berstatus "Selesai" (UPDATE 7) — selain itu tombol
   * ulasan tidak boleh muncul sama sekali. */
  canReview: boolean;
  onReviewChange: (itemId: string, review: OrderItemReview) => void;
}

/**
 * UPDATE 7 — Tombol "Beri Ulasan"/"Edit Ulasan" untuk satu produk pada satu pesanan,
 * dipakai di OrderCard (Riwayat Pesanan) & OrderDetailView (Detail Pesanan).
 *
 * - Tidak muncul sama sekali kalau `canReview` false (status pesanan bukan "Selesai")
 *   atau item tidak punya productId (data pesanan lama yang tidak bisa ditautkan
 *   ke produk manapun lagi).
 * - Menampilkan "Beri Ulasan" kalau item.review masih null, "Edit Ulasan" kalau
 *   sudah pernah dibuat — keduanya membuka form yang sama, hanya beda mode
 *   create/edit di WriteReviewForm.
 */
export function OrderItemReviewAction({ orderId, item, canReview, onReviewChange }: OrderItemReviewActionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!canReview || !item.productId) return null;

  const hasReview = Boolean(item.review);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
      >
        {hasReview ? <SquarePen className="h-3.5 w-3.5" /> : <PenLine className="h-3.5 w-3.5" />}
        {hasReview ? "Edit Ulasan" : "Beri Ulasan"}
      </button>

      <Modal open={isOpen} onClose={() => setIsOpen(false)} title={hasReview ? "Edit Ulasan" : "Beri Ulasan"}>
        <WriteReviewForm
          productId={item.productId}
          orderId={orderId}
          orderItemId={item.id}
          initialReview={item.review ?? null}
          onSuccess={(review) => {
            onReviewChange(item.id, review);
            setIsOpen(false);
          }}
        />
      </Modal>
    </>
  );
}
