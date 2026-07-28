"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { RatingStars } from "@/components/ui/RatingStars";
import { reviewService, ReviewAdminReply } from "@/services/reviewService";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";

export interface ReviewToReply {
  id: string;
  userName: string;
  productName?: string;
  rating: number;
  comment: string;
  adminReply?: ReviewAdminReply | null;
}

interface ReviewReplyModalProps {
  review: ReviewToReply | null;
  onClose: () => void;
  onSaved: (reviewId: string, adminReply: ReviewAdminReply | null) => void;
}

/**
 * Modal "Balas Ulasan" — Halaman Review Admin (UPDATE — Balasan Review oleh
 * Admin). Dipakai untuk balasan baru maupun Edit Balasan (endpoint API yang
 * sama, POST /reviews/:id/reply), dan Hapus Balasan (DELETE /reviews/:id/reply).
 * Setiap review maksimal punya satu balasan resmi — mengirim balasan baru saat
 * review sudah punya balasan akan mengganti balasan lama (bukan menambah baris
 * baru), sesuai perilaku backend (reviewService.replyToReview).
 */
export function ReviewReplyModal({ review, onClose, onSaved }: ReviewReplyModalProps) {
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const showToast = useToastStore((s) => s.showToast);

  const isEditing = Boolean(review?.adminReply);

  useEffect(() => {
    setMessage(review?.adminReply?.message ?? "");
  }, [review]);

  if (!review) return null;

  async function handleSend() {
    if (!message.trim()) {
      showToast("Isi balasan wajib diisi", "error");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await reviewService.reply(review!.id, message.trim());
      showToast(isEditing ? "Balasan berhasil diperbarui" : "Balasan berhasil dikirim");
      onSaved(review!.id, updated.adminReply);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal mengirim balasan"), "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteReply() {
    setIsDeleting(true);
    try {
      const updated = await reviewService.deleteReply(review!.id);
      showToast("Balasan berhasil dihapus");
      onSaved(review!.id, updated.adminReply);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal menghapus balasan"), "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Modal open={Boolean(review)} onClose={onClose} title={isEditing ? "Edit Balasan" : "Balas Ulasan"}>
      <div className="space-y-4">
        <div className="rounded-lg bg-neutral-50 p-3 text-sm">
          <p className="font-semibold text-neutral-900">{review.userName}</p>
          <p className="mt-0.5 text-neutral-500">Produk: {review.productName ?? "-"}</p>
          <div className="mt-1.5">
            <RatingStars rating={review.rating} />
          </div>
          <p className="mt-2 text-neutral-700">{review.comment}</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Balasan Toko</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={1000}
            placeholder="Tulis balasan resmi dari NutWear Official..."
            className="w-full rounded-md border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
          />
          <p className="mt-1 text-right text-xs text-neutral-400">{message.length}/1000</p>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          {isEditing ? (
            <button
              type="button"
              onClick={handleDeleteReply}
              disabled={isSaving || isDeleting}
              className="flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isDeleting ? "Menghapus..." : "Hapus Balasan"}
            </button>
          ) : (
            <span />
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isDeleting}
              className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={isSaving || isDeleting}
              className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {isSaving ? "Mengirim..." : "Kirim Balasan"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
