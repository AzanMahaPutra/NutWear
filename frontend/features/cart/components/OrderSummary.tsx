import { formatCurrency } from "@/utils/formatCurrency";

interface OrderSummaryProps {
  itemCount: number;
  subtotal: number;
  shippingCost?: number | null; // null/undefined = TBD (belum dihitung)
  taxRate?: number; // contoh: 0.11 untuk PPN 11%
}

/**
 * Ringkasan pesanan reusable — dipakai di halaman Keranjang dan Checkout.
 */
export function OrderSummary({ itemCount, subtotal, shippingCost, taxRate = 0.11 }: OrderSummaryProps) {
  const grandTotal = subtotal + (shippingCost ?? 0);
  const includedTax = Math.round((subtotal * taxRate) / (1 + taxRate));

  return (
    <div className="rounded-lg bg-neutral-50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-neutral-900">Ringkasan pesanan</h3>
        <span className="text-sm text-neutral-500">{itemCount} Produk</span>
      </div>

      <div className="space-y-3 border-b border-neutral-200 pb-4 text-sm">
        <div className="flex justify-between text-neutral-600">
          <span>Total Item</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>Pengiriman</span>
          <span>{shippingCost ? formatCurrency(shippingCost) : "TBD"}</span>
        </div>
      </div>

      <div className="flex items-center justify-between py-4 text-base font-bold text-neutral-900">
        <span>Total pesanan</span>
        <span>{formatCurrency(grandTotal)}</span>
      </div>

      <div className="flex justify-between border-t border-neutral-200 pt-3 text-sm text-neutral-500">
        <span>Termasuk PPN</span>
        <span>{formatCurrency(includedTax)}</span>
      </div>
    </div>
  );
}
