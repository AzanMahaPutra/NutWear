import Image from "next/image";
import { ImageOff } from "lucide-react";
import { Order, OrderItemReview } from "@/types/user";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { PAYMENT_STATUS_LABEL, PAYMENT_TYPE_LABEL } from "@/constants/order";
import { ContinuePaymentButton } from "@/features/order/components/ContinuePaymentButton";
import { OrderItemReviewAction } from "@/features/review/components/OrderItemReviewAction";

interface OrderDetailViewProps {
  order: Order;
  /** UPDATE 7 — dipanggil setelah user berhasil membuat/mengedit ulasan lewat modal
   * ini, supaya parent (OrderCard) bisa memperbarui status tombol Beri/Edit Ulasan
   * tanpa perlu fetch ulang seluruh Riwayat Pesanan. Opsional — kalau tidak
   * disediakan, tombol ulasan tetap muncul tapi perubahan tidak ter-sinkron ke
   * parent (dipakai kalau OrderDetailView dirender tanpa OrderCard). */
  onReviewChange?: (itemId: string, review: OrderItemReview) => void;
}

/**
 * Konten Detail Pesanan di Riwayat Pesanan User (Update 5, Bagian A) — menampilkan
 * info pesanan lengkap (termasuk metode & status pembayaran), seluruh produk yang
 * dipesan (thumbnail, SKU, varian, qty, harga, subtotal), dan info pengiriman.
 * Dipakai di dalam Modal generic yang sudah ada (lihat OrderHistoryView).
 */
export function OrderDetailView({ order, onReviewChange }: OrderDetailViewProps) {
  const totalItem = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const paymentTypeLabel = order.payment?.paymentType
    ? PAYMENT_TYPE_LABEL[order.payment.paymentType] ?? order.payment.paymentType
    : "-";
  const paymentStatusLabel = order.payment?.transactionStatus
    ? PAYMENT_STATUS_LABEL[order.payment.transactionStatus] ?? order.payment.transactionStatus
    : "Belum ada transaksi";

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-3 text-sm font-bold text-neutral-900">Informasi Pesanan</h4>
        <div className="grid grid-cols-1 gap-3 rounded-lg bg-neutral-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-neutral-400">Order ID</p>
            <p className="font-semibold text-neutral-900">#{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Status Pesanan</p>
            <OrderStatusBadge status={order.status} />
          </div>
          <div>
            <p className="text-xs text-neutral-400">Tanggal Pemesanan</p>
            <p className="font-semibold text-neutral-900">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Total Item</p>
            <p className="font-semibold text-neutral-900">{totalItem} item</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Metode Pembayaran</p>
            <p className="font-semibold text-neutral-900">{paymentTypeLabel}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Status Pembayaran</p>
            <p className="font-semibold text-neutral-900">{paymentStatusLabel}</p>
          </div>
          <div className="col-span-2 border-t border-neutral-200 pt-3">
            <p className="text-xs text-neutral-400">Total Harga</p>
            <p className="text-base font-bold text-neutral-900">{formatCurrency(order.grandTotal)}</p>
          </div>
        </div>

        {order.status === "menunggu_pembayaran" && (
          <div className="mt-4">
            <ContinuePaymentButton orderId={order.id} className="w-full rounded-full bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50" />
          </div>
        )}
      </div>

      <div>
        <h4 className="mb-3 text-sm font-bold text-neutral-900">Daftar Produk</h4>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3 rounded-lg border border-neutral-100 p-3">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-neutral-50">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.namaProduk ?? ""} fill sizes="64px" className="object-cover" />
                ) : (
                  <ImageOff className="h-5 w-5 text-neutral-300" />
                )}
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-neutral-900">{item.namaProduk ?? "Produk tidak ditemukan"}</p>
                  <OrderItemReviewAction
                    orderId={order.id}
                    item={item}
                    canReview={order.status === "selesai"}
                    onReviewChange={(itemId, review) => onReviewChange?.(itemId, review)}
                  />
                </div>
                {item.sku && <p className="text-xs text-neutral-400">SKU: {item.sku}</p>}
                <p className="text-xs text-neutral-500">
                  Warna: {item.warna ?? "-"} · Ukuran: {item.ukuran ?? "-"}
                </p>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-neutral-500">
                    {item.quantity} x {formatCurrency(item.harga)}
                  </span>
                  <span className="font-bold text-neutral-900">{formatCurrency(item.harga * item.quantity)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-bold text-neutral-900">Informasi Pengiriman</h4>
        {order.shippingAddress ? (
          <div className="rounded-lg border border-neutral-100 p-4 text-sm text-neutral-700">
            <p className="font-semibold text-neutral-900">{order.shippingAddress.receiverName}</p>
            <p className="text-neutral-500">{order.shippingAddress.phone}</p>
            <p className="mt-2">{order.shippingAddress.address}</p>
            <p>
              {order.shippingAddress.district}, {order.shippingAddress.city}
            </p>
            <p>
              {order.shippingAddress.province} {order.shippingAddress.postalCode}
            </p>
          </div>
        ) : (
          <p className="text-sm text-neutral-400">Alamat pengiriman tidak tersedia.</p>
        )}
      </div>

      <div className="space-y-1 border-t border-neutral-100 pt-4 text-sm">
        <div className="flex justify-between text-neutral-500">
          <span>Subtotal Produk</span>
          <span>{formatCurrency(order.totalPrice)}</span>
        </div>
        <div className="flex justify-between text-neutral-500">
          <span>Ongkos Kirim</span>
          <span>{formatCurrency(order.shippingCost)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-neutral-900">
          <span>Total</span>
          <span>{formatCurrency(order.grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
