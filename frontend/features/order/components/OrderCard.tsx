"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { Order } from "@/types/user";
import { formatCurrency } from "@/utils/formatCurrency";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { ROUTES } from "@/constants/routes";
import { useCartStore } from "@/stores/cartStore";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { OrderDetailView } from "@/features/order/components/OrderDetailView";
import { ContinuePaymentButton } from "@/features/order/components/ContinuePaymentButton";
import { orderService } from "@/services/orderService";

interface OrderCardProps {
  order: Order;
  /** Dipanggil setelah pesanan berhasil dibatalkan supaya parent (OrderHistoryView) bisa
   * memperbarui data pesanan di state tanpa perlu fetch ulang seluruh riwayat. */
  onOrderCancelled?: (updatedOrder: Order) => void;
  /** BUG 5 — true jika pesanan ini baru saja selesai dibayar (dikirim dari OrderHistoryView
   * lewat query string ?order=...), supaya modal Detail Pesanan langsung terbuka otomatis. */
  autoOpenDetail?: boolean;
}

/**
 * Kartu pesanan di Riwayat Pesanan — menampilkan item & status, tombol "Lihat Detail"
 * yang membuka modal Detail Pesanan (Update 5, Bagian A), serta aksi yang menyesuaikan
 * status pesanan (Update 2):
 * - "Batalkan Pesanan" hanya muncul selagi status Menunggu Pembayaran, dengan dialog
 *   konfirmasi (bukan window.confirm) sebelum benar-benar membatalkan lewat Order API.
 * - "Beli Lagi" hanya muncul untuk pesanan Selesai, menambahkan seluruh produk pada
 *   pesanan tersebut (varian, warna, ukuran, jumlah yang sama) ke Cart sekaligus.
 *   Produk yang variannya sudah tidak tersedia/stok habis dilewati, sisanya tetap masuk.
 */
export function OrderCard({ order, onOrderCancelled, autoOpenDetail }: OrderCardProps) {
  const addToCart = useCartStore((s) => s.addItem);
  const showToast = useToastStore((s) => s.showToast);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isBuyingAgain, setIsBuyingAgain] = useState(false);

  // BUG 5 — buka otomatis sekali saat kartu ini adalah pesanan yang baru saja dibayar.
  useEffect(() => {
    if (autoOpenDetail) setIsDetailOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenDetail]);

  const canCancel = order.status === "menunggu_pembayaran";
  const canBuyAgain = order.status === "selesai";

  async function handleConfirmCancel() {
    setIsCancelling(true);
    try {
      const updated = await orderService.cancelOrder(order.id);
      showToast("Pesanan berhasil dibatalkan");
      onOrderCancelled?.(updated);
      setIsCancelDialogOpen(false);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal membatalkan pesanan"), "error");
    } finally {
      setIsCancelling(false);
    }
  }

  async function handleBuyAgain() {
    setIsBuyingAgain(true);
    try {
      let successCount = 0;
      let failedCount = 0;

      for (const item of order.items) {
        try {
          await addToCart(item.variantId, item.quantity);
          successCount += 1;
        } catch {
          failedCount += 1;
        }
      }

      if (successCount > 0 && failedCount === 0) {
        showToast("Seluruh produk berhasil ditambahkan ke keranjang");
      } else if (successCount > 0 && failedCount > 0) {
        showToast(
          "Sebagian produk tidak dapat ditambahkan karena stok sudah habis atau varian sudah tidak tersedia",
          "error"
        );
      } else {
        showToast(
          "Produk tidak dapat ditambahkan karena stok sudah habis atau varian sudah tidak tersedia",
          "error"
        );
      }
    } finally {
      setIsBuyingAgain(false);
    }
  }

  return (
    <div className="mb-6 rounded-lg border border-neutral-100 p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs text-neutral-400">Order #{order.id.slice(0, 8).toUpperCase()}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsDetailOpen(true)}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Lihat Detail
          </button>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {order.items.map((item) => (
        <div key={item.id} className="flex gap-4 border-b border-neutral-100 py-4 last:border-0">
          <Link
            href={item.slug ? ROUTES.produkDetail(item.slug) : "#"}
            className="relative flex h-32 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-neutral-50"
          >
            {item.imageUrl ? (
              <Image src={item.imageUrl} alt={item.namaProduk ?? ""} fill sizes="96px" className="object-cover" />
            ) : (
              <ImageOff className="h-5 w-5 text-neutral-300" />
            )}
          </Link>

          <div className="flex-1">
            <Link href={item.slug ? ROUTES.produkDetail(item.slug) : "#"} className="text-sm font-semibold text-neutral-900">
              {item.namaProduk ?? "Produk tidak ditemukan"}
            </Link>
            <p className="text-xs text-neutral-500">Warna: {item.warna}</p>
            <p className="mb-2 text-xs text-neutral-500">Ukuran: {item.ukuran}</p>
            <p className="mb-1 text-base font-bold text-neutral-900">{formatCurrency(item.harga)}</p>
            <p className="text-sm">
              Subtotal: <span className="font-bold">{formatCurrency(item.harga * item.quantity)}</span>
            </p>
          </div>
        </div>
      ))}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          {canCancel && <ContinuePaymentButton orderId={order.id} />}

          {canCancel && (
            <button
              type="button"
              onClick={() => setIsCancelDialogOpen(true)}
              className="rounded-full border border-red-200 px-6 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              BATALKAN PESANAN
            </button>
          )}

          {canBuyAgain && (
            <button
              type="button"
              onClick={handleBuyAgain}
              disabled={isBuyingAgain}
              className="rounded-full bg-neutral-900 px-6 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {isBuyingAgain ? "MEMPROSES..." : "BELI LAGI"}
            </button>
          )}
        </div>

        <div className="text-sm font-bold text-neutral-900">Total: {formatCurrency(order.grandTotal)}</div>
      </div>

      <Modal open={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detail Pesanan" size="xl">
        <OrderDetailView order={order} />
      </Modal>

      <ConfirmDialog
        open={isCancelDialogOpen}
        title="Batalkan Pesanan?"
        description="Pesanan yang telah dibatalkan tidak dapat diproses kembali."
        confirmLabel="Ya, Batalkan Pesanan"
        cancelLabel="Kembali"
        isLoading={isCancelling}
        onConfirm={handleConfirmCancel}
        onClose={() => setIsCancelDialogOpen(false)}
      />
    </div>
  );
}
