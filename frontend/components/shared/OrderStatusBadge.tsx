import { OrderStatus } from "@/types/user";
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/constants/order";
import { cn } from "@/utils/cn";

/**
 * Badge status pesanan reusable — dipakai di Riwayat Pesanan (user)
 * dan Manajemen Pesanan (admin) supaya tampilan status selalu konsisten.
 */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", ORDER_STATUS_COLOR[status])}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
