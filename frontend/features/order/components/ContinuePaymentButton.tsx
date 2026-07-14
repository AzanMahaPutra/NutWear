"use client";

import { useState } from "react";
import { orderService, openMidtransSnap } from "@/services/orderService";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";

interface ContinuePaymentButtonProps {
  orderId: string;
  className?: string;
}

/**
 * Update 1 — tombol "Bayar Sekarang" untuk pesanan yang masih berstatus Menunggu
 * Pembayaran (mis. popup Midtrans sempat ditutup sebelum pembayaran selesai).
 * Dipakai di OrderCard (Riwayat Pesanan) & OrderDetailView (Detail Pesanan) supaya
 * user bisa membuka kembali popup Midtrans untuk pesanan yang sama — TIDAK membuat
 * order baru maupun transaksi pembayaran baru (lihat orderService.continuePayment
 * di backend). Status pesanan tetap diperbarui otomatis lewat Webhook Midtrans yang
 * sudah ada, sama seperti alur checkout biasa.
 */
export function ContinuePaymentButton({ orderId, className }: ContinuePaymentButtonProps) {
  const showToast = useToastStore((s) => s.showToast);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleContinuePayment() {
    setIsProcessing(true);
    try {
      const { snapToken } = await orderService.continuePayment(orderId);
      if (!snapToken) throw new Error("Snap Token tidak diterima dari server");

      openMidtransSnap(snapToken, {
        onSuccess: () => showToast("Pembayaran berhasil"),
        onPending: () => showToast("Menunggu pembayaran Anda"),
        onError: () => showToast("Pembayaran gagal, silakan coba lagi", "error"),
        onClose: () => showToast("Anda menutup popup pembayaran. Pesanan tetap Menunggu Pembayaran."),
      });
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal melanjutkan pembayaran"), "error");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleContinuePayment}
      disabled={isProcessing}
      className={
        className ??
        "rounded-full bg-neutral-900 px-6 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
      }
    >
      {isProcessing ? "MEMPROSES..." : "BAYAR SEKARANG"}
    </button>
  );
}
