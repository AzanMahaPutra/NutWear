import Image from "next/image";
import Link from "next/link";
import { Heart, ImageOff } from "lucide-react";
import { WishlistItem } from "@/types/user";
import { formatCurrency } from "@/utils/formatCurrency";
import { isPromoActive } from "@/utils/promo";
import { ROUTES } from "@/constants/routes";

interface WishlistItemRowProps {
  item: WishlistItem;
  onRemove: () => void;
  onAddToCart: () => void;
}

/**
 * Baris item wishlist reusable — dipakai di halaman Wishlist.
 * Wishlist hanya menyimpan referensi produk (bukan varian), jadi warna/ukuran/kodeProduk
 * bersifat opsional dan hanya ditampilkan kalau tersedia.
 */
export function WishlistItemRow({ item, onRemove, onAddToCart }: WishlistItemRowProps) {
  const promoActive = isPromoActive(item);

  return (
    <div className="flex flex-col gap-4 border-b border-neutral-100 py-6 sm:flex-row sm:items-start">
      <Link href={ROUTES.produkDetail(item.slug)} className="relative flex h-40 w-32 shrink-0 items-center justify-center overflow-hidden rounded-md bg-neutral-50">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.namaProduk} fill sizes="128px" className="object-cover" />
        ) : (
          <ImageOff className="h-6 w-6 text-neutral-300" />
        )}
      </Link>

      <div className="flex-1">
        <div className="mb-1 flex items-start justify-between">
          <Link href={ROUTES.produkDetail(item.slug)} className="text-base font-semibold text-neutral-900">
            {item.namaProduk}
          </Link>
          <button type="button" onClick={onRemove} aria-label="Hapus dari wishlist">
            <Heart className="h-5 w-5 fill-red-500 text-red-500" />
          </button>
        </div>
        {item.warna && <p className="text-xs text-neutral-500">Warna: {item.warna}</p>}
        {item.ukuran && <p className="mb-2 text-xs text-neutral-500">Ukuran: {item.ukuran}</p>}

        {promoActive && item.hargaPromo != null ? (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm text-neutral-400 line-through">{formatCurrency(item.harga)}</span>
            <span className="text-lg font-bold" style={{ color: item.hargaPromoColor || "#dc2626" }}>
              {formatCurrency(item.hargaPromo)}
            </span>
          </div>
        ) : (
          <p className="mb-2 text-lg font-bold text-neutral-900">{formatCurrency(item.harga)}</p>
        )}

        {item.fiturSingkat && <p className="text-xs text-neutral-400">{item.fiturSingkat.join(", ")}</p>}
      </div>

      <button
        type="button"
        onClick={onAddToCart}
        className="h-fit shrink-0 self-end rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white sm:self-start"
      >
        TAMBAHKAN KE KERANJANG
      </button>
    </div>
  );
}
