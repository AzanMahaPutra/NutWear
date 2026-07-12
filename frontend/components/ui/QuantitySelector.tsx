import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
}

/**
 * Selector jumlah (+/-) reusable — dipakai di Detail Produk, Keranjang, dan Riwayat Pesanan.
 */
export function QuantitySelector({ quantity, onChange, min = 1, max = 99 }: QuantitySelectorProps) {
  return (
    <div className="flex items-center gap-4 rounded-full bg-neutral-100 px-2 py-1.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={quantity <= min}
        className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-600 disabled:opacity-30"
        aria-label="Kurangi jumlah"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-4 text-center text-sm font-medium">{quantity}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
        className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-600 disabled:opacity-30"
        aria-label="Tambah jumlah"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
