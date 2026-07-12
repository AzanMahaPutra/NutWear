import { ORDER_STATUS_LABEL } from "@/constants/order";
import { OrderStatus } from "@/types/user";

interface OrderStatusSelectProps {
  value: OrderStatus;
  onChange: (status: OrderStatus) => void;
}

/**
 * Dropdown ubah status pesanan (manual oleh admin, mis. Diproses -> Dikemas -> Dikirim).
 * Status "Sudah Dibayar" akan diisi otomatis oleh Webhook Midtrans pada Fase 3,
 * jadi opsi ini tetap disediakan admin untuk override manual bila diperlukan.
 */
export function OrderStatusSelect({ value, onChange }: OrderStatusSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as OrderStatus)}
      className="rounded-md border border-neutral-200 px-2 py-1.5 text-xs"
    >
      {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((status) => (
        <option key={status} value={status}>
          {ORDER_STATUS_LABEL[status]}
        </option>
      ))}
    </select>
  );
}
