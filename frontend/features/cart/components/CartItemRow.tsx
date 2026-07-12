import Image from "next/image";
import Link from "next/link";
import { Heart, ImageOff } from "lucide-react";
import { CartItem } from "@/types/user";
import { formatCurrency } from "@/utils/formatCurrency";
import { isPromoActive, getEffectivePrice } from "@/utils/promo";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { ROUTES } from "@/constants/routes";

interface CartItemRowProps {
  item: CartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onWishlist?: () => void;
  /** Status centang item (Update 5, Bagian B — fitur check item pada Cart). */
  checked?: boolean;
  onToggleChecked?: () => void;
}

/**
 * Baris item keranjang reusable — dipakai di halaman Keranjang.
 */
export function CartItemRow({
  item,
  onQuantityChange,
  onRemove,
  onWishlist,
  checked = true,
  onToggleChecked,
}: CartItemRowProps) {
  const promoActive = isPromoActive(item);
  const effectivePrice = getEffectivePrice(item);

  return (
    <div className="flex gap-4 border-b border-neutral-100 py-6">
      {onToggleChecked && (
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggleChecked}
          aria-label={`Pilih ${item.namaProduk}`}
          className="mt-1 h-4 w-4 shrink-0 rounded border-neutral-300 accent-neutral-900"
        />
      )}
      <Link href={ROUTES.produkDetail(item.slug)} className="relative flex h-32 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-neutral-50">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.namaProduk} fill sizes="96px" className="object-cover" />
        ) : (
          <ImageOff className="h-5 w-5 text-neutral-300" />
        )}
      </Link>

      <div className="flex-1">
        <div className="mb-1 flex items-start justify-between">
          <Link href={ROUTES.produkDetail(item.slug)} className="text-sm font-semibold text-neutral-900">
            {item.namaProduk}
          </Link>
          {onWishlist && (
            <button type="button" onClick={onWishlist} aria-label="Pindah ke wishlist">
              <Heart className="h-4 w-4 text-neutral-400 hover:text-red-500" />
            </button>
          )}
        </div>
        <p className="text-xs text-neutral-500">Warna: {item.warna}</p>
        <p className="mb-2 text-xs text-neutral-500">Ukuran: {item.ukuran}</p>

        {promoActive && item.hargaPromo != null ? (
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs text-neutral-400 line-through">{formatCurrency(item.harga)}</span>
            <span className="text-base font-bold" style={{ color: item.hargaPromoColor || "#dc2626" }}>
              {formatCurrency(item.hargaPromo)}
            </span>
          </div>
        ) : (
          <p className="mb-1 text-base font-bold text-neutral-900">{formatCurrency(item.harga)}</p>
        )}

        <QuantitySelector quantity={item.quantity} onChange={onQuantityChange} max={item.stokTersedia ?? 99} />

        <div className="mt-3 flex items-center gap-3">
          <button type="button" onClick={onRemove} className="text-sm font-medium text-blue-600 hover:underline">
            Hapus
          </button>
        </div>
        <p className="mt-1 text-sm">
          Subtotal: <span className="font-bold">{formatCurrency(effectivePrice * item.quantity)}</span>
        </p>
      </div>
    </div>
  );
}
