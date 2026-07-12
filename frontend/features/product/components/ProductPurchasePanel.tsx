"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Share2, Heart, Ruler } from "lucide-react";
import { Product } from "@/types/product";
import { formatCurrency } from "@/utils/formatCurrency";
import { isPromoActive } from "@/utils/promo";
import { RatingStars } from "@/components/ui/RatingStars";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { SizeChartModal } from "@/features/product/components/SizeChartModal";
import { cn } from "@/utils/cn";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useToastStore } from "@/stores/toastStore";
import { useAuthStore } from "@/stores/authStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { enrichProduct } from "@/utils/enrichProduct";
import { ROUTES } from "@/constants/routes";

interface ProductPurchasePanelProps {
  product: Product;
  /** Dikontrol dari parent (ProductDetailInteractive) supaya foto utama ikut berubah saat warna dipilih. */
  selectedColor: string;
  onSelectColor: (colorCode: string) => void;
}

/**
 * Panel pembelian di Detail Produk: pilih warna, ukuran, jumlah,
 * lalu tambah ke keranjang atau wishlist. Pemilihan warna dikontrol dari parent
 * (dipakai bersama komponen foto utama), sedangkan aksi akhirnya tetap memanggil
 * Cart/Wishlist API (lewat store) supaya konsisten dengan Navbar & halaman lain.
 */
export function ProductPurchasePanel({ product: rawProduct, selectedColor, onSelectColor }: ProductPurchasePanelProps) {
  const product = enrichProduct(rawProduct);
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [selectedSize, setSelectedSize] = useState(product.variants[0]?.ukuran ?? "");
  const [quantity, setQuantity] = useState(1);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addToCart = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));
  const showToast = useToastStore((s) => s.showToast);

  const availableSizes = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.ukuran))),
    [product.variants]
  );

  const selectedVariant = product.variants.find(
    (v) => v.ukuran === selectedSize && v.warna === selectedColor
  );

  function requireLogin() {
    if (!isAuthenticated) {
      showToast("Silakan masuk terlebih dahulu", "error");
      router.push(ROUTES.login);
      return true;
    }
    return false;
  }

  async function handleAddToCart() {
    if (requireLogin()) return;
    if (!selectedVariant) {
      showToast("Varian ukuran/warna ini belum tersedia", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      await addToCart(selectedVariant.id, quantity);
      showToast("Berhasil ditambahkan ke keranjang");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal menambahkan ke keranjang"), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleWishlist() {
    if (requireLogin()) return;
    try {
      await toggleWishlist(product.id);
      showToast(isWishlisted ? "Dihapus dari wishlist" : "Ditambahkan ke wishlist");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal memperbarui wishlist"), "error");
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <h1 className="text-2xl font-bold text-neutral-900">{product.namaProduk}</h1>
      </div>

      {(product.colors?.length ?? 0) > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-sm text-neutral-600">Warna: {selectedColor}</p>
          <div className="flex flex-wrap gap-2">
            {product.colors!.map((color) => (
              <button
                key={color.code}
                type="button"
                onClick={() => onSelectColor(color.code)}
                className={cn(
                  "h-8 w-8 rounded-full border-2",
                  selectedColor === color.code ? "border-neutral-900" : "border-transparent"
                )}
                style={{ backgroundColor: color.hex }}
                aria-label={color.code}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mb-5">
        <p className="mb-2 text-sm text-neutral-600">Ukuran: {selectedSize}</p>
        <div className="flex flex-wrap gap-2">
          {availableSizes.map((size) => {
            // Ukuran dianggap tidak tersedia untuk warna yang sedang dipilih kalau
            // tidak ada varian size+warna itu, atau stoknya 0 — ditampilkan disabled
            // dengan garis diagonal supaya user langsung tahu tanpa perlu klik dulu.
            const variantForSize = product.variants.find((v) => v.ukuran === size && v.warna === selectedColor);
            const isOutOfStock = !variantForSize || variantForSize.stok === 0;

            return (
              <button
                key={size}
                type="button"
                disabled={isOutOfStock}
                onClick={() => !isOutOfStock && setSelectedSize(size)}
                aria-label={isOutOfStock ? `Ukuran ${size} tidak tersedia` : `Pilih ukuran ${size}`}
                style={
                  isOutOfStock
                    ? {
                        backgroundImage:
                          "linear-gradient(to top right, transparent calc(50% - 1px), #d4d4d4 50%, transparent calc(50% + 1px))",
                      }
                    : undefined
                }
                className={cn(
                  "relative flex h-10 min-w-10 items-center justify-center rounded-md border px-3 text-sm font-medium",
                  isOutOfStock
                    ? "cursor-not-allowed border-neutral-200 text-neutral-300"
                    : selectedSize === size
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 text-neutral-700 hover:border-neutral-900"
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setSizeChartOpen(true)}
          className="mt-2 flex items-center gap-1 text-xs font-medium text-neutral-700 underline underline-offset-2"
        >
          <Ruler className="h-3.5 w-3.5" /> Ukuran
        </button>
      </div>

      <div className="mb-2 flex items-center gap-3">
        {isPromoActive(product) && product.hargaPromo != null ? (
          <div className="flex items-center gap-2">
            <span className="text-base text-neutral-400 line-through">{formatCurrency(product.harga)}</span>
            <span
              className="text-2xl font-bold"
              style={{ color: product.hargaPromoColor || "#dc2626" }}
            >
              {formatCurrency(product.hargaPromo)}
            </span>
          </div>
        ) : (
          <span className="text-2xl font-bold text-neutral-900">{formatCurrency(product.harga)}</span>
        )}
        {typeof product.rating === "number" && (
          <RatingStars rating={product.rating} reviewCount={product.reviewCount} size="md" />
        )}
      </div>
      {product.fiturSingkat && <p className="mb-6 text-sm text-neutral-500">{product.fiturSingkat.join(",  ")}</p>}

      <div className="mb-4 flex items-center gap-4">
        <QuantitySelector quantity={quantity} onChange={setQuantity} max={selectedVariant?.stok ?? 99} />
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isSubmitting || !selectedVariant || selectedVariant.stok === 0}
          className="flex-1 rounded-full bg-neutral-900 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
        >
          {selectedVariant?.stok === 0 ? "STOK HABIS" : isSubmitting ? "MEMPROSES..." : "TAMBAHKAN KE KERANJANG"}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300"
          aria-label="Bagikan"
        >
          <Share2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleToggleWishlist}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-neutral-300 py-3 text-sm font-semibold"
        >
          <Heart className={cn("h-4 w-4", isWishlisted && "fill-red-500 text-red-500")} />
          {isWishlisted ? "DIHAPUS DARI WISHLIST" : "TAMBAHKAN KE WISHLIST"}
        </button>
      </div>

      <SizeChartModal open={sizeChartOpen} onClose={() => setSizeChartOpen(false)} />
    </div>
  );
}
