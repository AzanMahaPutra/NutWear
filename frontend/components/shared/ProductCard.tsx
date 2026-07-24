import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/product";
import { ROUTES } from "@/constants/routes";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatSoldCount } from "@/utils/formatSoldCount";
import { isPromoActive } from "@/utils/promo";
import { RatingStars } from "@/components/ui/RatingStars";
import { cn } from "@/utils/cn";
import { enrichProduct } from "@/utils/enrichProduct";
import { getSizeRangeLabel } from "@/utils/sizeRange";

interface ProductCardProps {
  product: Product;
  className?: string;
}

/**
 * Kartu produk reusable — dipakai di Beranda (rail), halaman Produk (grid),
 * Wishlist, dan Related Product di Detail Produk.
 * Field yang tidak ada di skema database (colors, fiturSingkat) di-derive lewat
 * enrichProduct/tampil kondisional supaya komponen tetap aman dipakai dengan
 * data API sungguhan maupun data yang belum lengkap. `rating`/`reviewCount`/
 * `totalTerjual` SUDAH dihitung backend (lihat productService.attachRatingAndSold)
 * dari data Review & Order yang sesungguhnya.
 *
 * UPDATE — Card Produk: Rating & Total Terjual. Info gender ("Uniseks", dsb.)
 * sudah tidak ditampilkan lagi di Card Produk; digantikan Rating Produk +
 * Total Terjual yang jauh lebih berguna bagi calon pembeli. Urutan tampilan:
 * Gambar -> Pilihan Warna -> Rating + Total Terjual -> Nama Produk -> Harga.
 */
export function ProductCard({ product: rawProduct, className }: ProductCardProps) {
  const product = enrichProduct(rawProduct);
  const cover = product.images[0]?.imageUrl;
  const colors = product.colors ?? [];
  const mainColor = colors[0];
  const sizeRangeLabel = getSizeRangeLabel(product.variants);
  const rating = product.rating ?? 0;
  const totalTerjual = product.totalTerjual ?? 0;

  return (
    <Link href={ROUTES.produkDetail(product.slug)} className={cn("group block", className)}>
      <div className="relative mb-3 aspect-[3/4] overflow-hidden rounded-lg bg-neutral-50">
        {cover && (
          <Image
            src={cover}
            alt={product.namaProduk}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {product.isNewArrival && (
          <span className="absolute left-2 top-2 rounded bg-neutral-900/90 px-2 py-1 text-[10px] font-semibold text-white">
            New Arrival
          </span>
        )}
        {product.isBestseller && (
          <span className="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-[10px] font-semibold text-neutral-800">
            Best Seller
          </span>
        )}
      </div>

      {colors.length > 0 && (
        <div className="mb-1.5 flex items-center gap-1.5">
          {colors.slice(0, 8).map((color) => (
            <span
              key={color.code}
              className={cn(
                "h-3.5 w-3.5 rounded-full border",
                color.code === mainColor?.code ? "ring-1 ring-neutral-900 ring-offset-1" : "border-neutral-200"
              )}
              style={{ backgroundColor: color.hex }}
            />
          ))}
        </div>
      )}

      {sizeRangeLabel && <p className="mb-1 text-xs text-neutral-500">{sizeRangeLabel}</p>}

      <div className="mb-1 flex min-w-0 items-center gap-1.5">
        <RatingStars rating={rating} size="sm" />
        <span className="text-xs text-neutral-300">•</span>
        <span className="truncate text-xs text-neutral-500">{formatSoldCount(totalTerjual)} Terjual</span>
      </div>

      <h3 className="mb-1 line-clamp-2 text-sm font-medium text-neutral-900">{product.namaProduk}</h3>

      <div className="flex items-center gap-2">
        {isPromoActive(product) && product.hargaPromo != null ? (
          <>
            <span className="text-xs text-neutral-400 line-through">{formatCurrency(product.harga)}</span>
            <span className="text-sm font-semibold" style={{ color: product.hargaPromoColor || "#dc2626" }}>
              {formatCurrency(product.hargaPromo)}
            </span>
          </>
        ) : (
          <span className="text-sm font-semibold text-neutral-900">{formatCurrency(product.harga)}</span>
        )}
      </div>
    </Link>
  );
}
