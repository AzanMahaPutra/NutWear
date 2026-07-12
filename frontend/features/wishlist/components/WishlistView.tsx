"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/shared/EmptyState";
import { WishlistItemRow } from "@/features/wishlist/components/WishlistItemRow";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useCartStore } from "@/stores/cartStore";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { ROUTES } from "@/constants/routes";
import { productService } from "@/services/productService";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";

/**
 * View utama halaman Wishlist, sinkron dengan Wishlist API sungguhan.
 * Karena wishlist hanya menyimpan referensi produk (bukan varian spesifik),
 * "Tambahkan ke Keranjang" mengambil varian pertama yang stoknya tersedia.
 */
export function WishlistView() {
  const items = useWishlistStore((s) => s.items);
  const isLoading = useWishlistStore((s) => s.isLoading);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const addToCart = useCartStore((s) => s.addItem);
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    fetchWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRemove(productId: string) {
    try {
      await removeItem(productId);
      showToast("Dihapus dari wishlist");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  async function handleAddToCart(productId: string) {
    try {
      const product = await productService.getById(productId);
      const availableVariant = product.variants.find((v) => v.stok > 0);
      if (!availableVariant) {
        showToast("Stok produk ini sedang habis", "error");
        return;
      }
      await addToCart(availableVariant.id, 1);
      showToast("Ditambahkan ke keranjang");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  if (isLoading && items.length === 0) {
    return (
      <Container className="space-y-4 py-8">
        <ProductCardSkeleton />
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container className="py-8">
        <h1 className="mb-6 text-3xl font-bold text-neutral-900">WishList</h1>
        <EmptyState
          title="Wishlist Anda kosong"
          description="Simpan produk favoritmu di sini supaya mudah ditemukan lagi."
          action={
            <Link href={ROUTES.produk} className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white">
              Jelajahi Produk
            </Link>
          }
        />
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <h1 className="mb-6 text-3xl font-bold text-neutral-900">WishList</h1>

      {items.map((item) => (
        <WishlistItemRow
          key={item.id}
          item={item}
          onRemove={() => handleRemove(item.productId)}
          onAddToCart={() => handleAddToCart(item.productId)}
        />
      ))}
    </Container>
  );
}
