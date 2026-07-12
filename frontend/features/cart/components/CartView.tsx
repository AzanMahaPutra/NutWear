"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/shared/EmptyState";
import { CartItemRow } from "@/features/cart/components/CartItemRow";
import { OrderSummary } from "@/features/cart/components/OrderSummary";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { ROUTES } from "@/constants/routes";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";

/**
 * View utama halaman Keranjang. Membaca & memodifikasi state dari useCartStore
 * (sinkron dengan Cart API sungguhan) sehingga perubahan langsung tercermin di badge Navbar.
 */
export function CartView() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const isLoading = useCartStore((s) => s.isLoading);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const selectedIds = useCartStore((s) => s.selectedIds);
  const toggleSelect = useCartStore((s) => s.toggleSelect);
  const selectAll = useCartStore((s) => s.selectAll);
  const isAllSelected = useCartStore((s) => s.isAllSelected());
  const selectedCount = useCartStore((s) => s.selectedItems().length);
  const selectedTotalPrice = useCartStore((s) => s.selectedTotalPrice());
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleWishlist(productId: string) {
    try {
      await toggleWishlist(productId);
      showToast("Ditambahkan ke wishlist");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  async function handleRemove(itemId: string) {
    try {
      await removeItem(itemId);
      showToast("Produk dihapus dari keranjang");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  async function handleQuantityChange(itemId: string, quantity: number) {
    try {
      await updateQuantity(itemId, quantity);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal memperbarui jumlah — stok mungkin tidak mencukupi"), "error");
    }
  }

  function handleCheckoutClick() {
    // Update 5, Bagian B — validasi minimal satu produk dipilih sebelum lanjut ke Checkout.
    if (selectedCount === 0) {
      showToast("Pilih minimal satu produk untuk checkout", "error");
      return;
    }
    router.push(ROUTES.checkout);
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
        <h1 className="mb-6 text-3xl font-bold text-neutral-900">Keranjang Belanja</h1>
        <EmptyState
          title="Keranjang Anda kosong"
          description="Yuk mulai belanja dan temukan produk favoritmu."
          action={
            <Link href={ROUTES.produk} className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white">
              Belanja Sekarang
            </Link>
          }
        />
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <h1 className="mb-6 text-3xl font-bold text-neutral-900">Keranjang Belanja</h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <label className="mb-2 flex cursor-pointer items-center gap-2 border-b border-neutral-100 pb-4 text-sm font-semibold text-neutral-900">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={(e) => selectAll(e.target.checked)}
              aria-label="Pilih semua produk"
              className="h-4 w-4 rounded border-neutral-300 accent-neutral-900"
            />
            Pilih Semua
          </label>

          {items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onQuantityChange={(q) => handleQuantityChange(item.id, q)}
              onRemove={() => handleRemove(item.id)}
              onWishlist={() => handleWishlist(item.productId)}
              checked={selectedIds.has(item.id)}
              onToggleChecked={() => toggleSelect(item.id)}
            />
          ))}
        </div>

        <div>
          <OrderSummary itemCount={selectedCount} subtotal={selectedTotalPrice} />
          <button
            type="button"
            onClick={handleCheckoutClick}
            className="mt-4 w-full rounded-full bg-neutral-900 py-3.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={selectedCount === 0}
          >
            LANJUT KE CHECKOUT
          </button>
          <Link
            href={ROUTES.produk}
            className="mt-3 block w-full rounded-full border border-neutral-300 py-3.5 text-center text-sm font-semibold text-neutral-700"
          >
            KEMBALI KE HALAMAN SEBELUMNYA
          </Link>
        </div>
      </div>
    </Container>
  );
}
