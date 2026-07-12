"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/shared/EmptyState";
import { OrderCard } from "@/features/order/components/OrderCard";
import { orderService } from "@/services/orderService";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { ORDER_STATUS_LABEL } from "@/constants/order";
import { Order, OrderStatus } from "@/types/user";
import { cn } from "@/utils/cn";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";

const TABS: { value: OrderStatus | "semua"; label: string }[] = [
  { value: "semua", label: "Semua" },
  ...(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((status) => ({
    value: status,
    label: ORDER_STATUS_LABEL[status],
  })),
];

/**
 * View halaman Riwayat Pesanan — fetch dari Order API sungguhan (GET /orders/my)
 * dengan tab filter status di sisi client.
 */
export function OrderHistoryView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderStatus | "semua">("semua");
  const showToast = useToastStore((s) => s.showToast);
  // BUG 5 — id pesanan yang baru saja selesai dibayar, dikirim lewat query string
  // ?order=... setelah redirect dari Midtrans (lihat CheckoutView), supaya Detail
  // Pesanan-nya langsung terbuka begitu user kembali ke halaman ini.
  const searchParams = useSearchParams();
  const autoOpenOrderId = searchParams.get("order");

  useEffect(() => {
    (async () => {
      try {
        const data = await orderService.getMyOrders();
        setOrders(data);
      } catch (err) {
        showToast(getApiErrorMessage(err, "Gagal memuat riwayat pesanan"), "error");
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // BUG 2 — status pesanan (mis. Settlement dari Midtrans) diperbarui backend lewat Webhook
  // secara asinkron, bisa datang setelah user sudah kembali ke halaman ini. Sebelumnya
  // halaman hanya fetch sekali saat mount, jadi status baru hanya tampil setelah user
  // me-refresh manual. Poll ringan (mirip pola di notificationStore) selama masih ada
  // pesanan berstatus "Menunggu Pembayaran", supaya status otomatis ter-update begitu
  // Webhook selesai diproses, tanpa perlu refresh manual.
  useEffect(() => {
    const hasPendingPayment = orders.some((o) => o.status === "menunggu_pembayaran");
    if (!hasPendingPayment) return;

    const timer = setInterval(async () => {
      try {
        const data = await orderService.getMyOrders();
        setOrders(data);
      } catch {
        // Diamkan kegagalan poll — akan dicoba lagi di interval berikutnya.
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (activeTab === "semua") return orders;
    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">Riwayat Pesanan</h1>

      <div className="mb-6 flex gap-2 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-xs font-medium",
              activeTab === tab.value
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 text-neutral-600"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <ProductCardSkeleton />
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState title="Belum ada pesanan" description="Riwayat pesanan dengan status ini belum tersedia." />
      ) : (
        filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            autoOpenDetail={order.id === autoOpenOrderId}
            onOrderCancelled={(updated) =>
              setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
            }
          />
        ))
      )}
    </div>
  );
}
