import Image from "next/image";
import { ImageOff } from "lucide-react";
import { CartItem } from "@/types/user";
import { formatCurrency } from "@/utils/formatCurrency";
import { getEffectivePrice } from "@/utils/promo";

/**
 * Daftar item pesanan (read-only) di halaman Checkout — reuse tipe CartItem
 * supaya tidak perlu tipe baru untuk representasi yang sama.
 */
export function CheckoutItemsList({ items }: { items: CartItem[] }) {
  return (
    <div>
      <h2 className="mb-3 text-base font-bold text-neutral-900">Ringkasan Pesanan</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="relative flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-neutral-50">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.namaProduk} fill sizes="64px" className="object-cover" />
              ) : (
                <ImageOff className="h-5 w-5 text-neutral-300" />
              )}
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium text-neutral-900">{item.namaProduk}</p>
              <p className="text-xs text-neutral-500">
                {item.warna} · {item.ukuran} · x{item.quantity}
              </p>
            </div>
            <span className="text-sm font-semibold text-neutral-900">
              {formatCurrency(getEffectivePrice(item) * item.quantity)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
