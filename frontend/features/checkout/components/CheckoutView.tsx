"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/shared/EmptyState";
import { AddressSelector } from "@/features/checkout/components/AddressSelector";
import { CheckoutItemsList } from "@/features/checkout/components/CheckoutItemsList";
import { OrderSummary } from "@/features/cart/components/OrderSummary";
import { useCartStore } from "@/stores/cartStore";
import { useAddressStore } from "@/stores/addressStore";
import { useToastStore } from "@/stores/toastStore";
import { orderService, openMidtransSnap } from "@/services/orderService";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { ROUTES } from "@/constants/routes";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { getEffectivePrice } from "@/utils/promo";

/**
 * View utama halaman Checkout — terintegrasi penuh dengan Order API & Midtrans Snap:
 * 1. POST /orders/checkout — backend validasi stok/harga/varian & ongkir, buat order,
 *    kurangi stok, lalu minta Snap Token ke Midtrans.
 * 2. Frontend menerima snapToken, membuka popup Midtrans Snap (`window.snap.pay`).
 * 3. Setelah user membayar, Midtrans mengirim Webhook ke backend yang otomatis
 *    mengubah status order (lihat paymentService.js di backend) — frontend
 *    hanya perlu mengarahkan user ke Riwayat Pesanan untuk memantau status terbaru.
 */
export function CheckoutView() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const isCartLoading = useCartStore((s) => s.isLoading);
  const fetchCart = useCartStore((s) => s.fetchCart);
  // Update 5, Bagian B — Checkout hanya memproses item yang dicentang di Cart.
  // NOTE: `selectedItems()`/`selectedTotalPrice()` di store membuat array/nilai BARU setiap
  // dipanggil. Kalau dipanggil langsung di dalam selector `useCartStore((s) => s.selectedItems())`,
  // referensinya akan selalu berubah setiap render -> memicu "getSnapshot should be cached" dan
  // akhirnya "Maximum update depth exceeded". Solusinya: ambil data mentah (items & selectedIds)
  // dari store, lalu turunkan checkoutItems/checkoutTotalPrice pakai useMemo di komponen supaya
  // referensinya stabil selama datanya tidak berubah.
  const selectedIds = useCartStore((s) => s.selectedIds);
  const fetchCartAfterOrder = useCartStore((s) => s.fetchCart);

  const checkoutItems = useMemo(
    () => items.filter((i) => selectedIds.has(i.id)),
    [items, selectedIds]
  );
  const checkoutTotalPrice = useMemo(
    () => checkoutItems.reduce((sum, i) => sum + getEffectivePrice(i) * i.quantity, 0),
    [checkoutItems]
  );

  const { addresses, isLoading: isAddressLoading, fetchAddresses } = useAddressStore();
  const showToast = useToastStore((s) => s.showToast);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchCart();
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
    if (defaultAddress && !selectedAddressId) setSelectedAddressId(defaultAddress.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses]);

  if (isCartLoading || isAddressLoading) {
    return (
      <Container className="space-y-4 py-8">
        <ProductCardSkeleton />
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container className="py-8">
        <h1 className="mb-6 text-3xl font-bold text-neutral-900">Checkout</h1>
        <EmptyState
          title="Tidak ada produk untuk di-checkout"
          description="Tambahkan produk ke keranjang terlebih dahulu."
          action={
            <Link href={ROUTES.produk} className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white">
              Belanja Sekarang
            </Link>
          }
        />
      </Container>
    );
  }

  // Update 5, Bagian B — cart masih berisi produk, tapi tidak ada yang dicentang
  // (mis. user membuka /checkout langsung setelah melepas semua centang di Cart).
  if (checkoutItems.length === 0) {
    return (
      <Container className="py-8">
        <h1 className="mb-6 text-3xl font-bold text-neutral-900">Checkout</h1>
        <EmptyState
          title="Belum ada produk yang dipilih"
          description="Kembali ke Keranjang dan centang produk yang ingin dibeli terlebih dahulu."
          action={
            <Link href={ROUTES.keranjang} className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white">
              Kembali ke Keranjang
            </Link>
          }
        />
      </Container>
    );
  }

  async function handlePay() {
    if (!selectedAddressId) {
      showToast("Pilih alamat pengiriman terlebih dahulu", "error");
      return;
    }
    setIsProcessing(true);
    try {
      const cartItemIds = checkoutItems.map((i) => i.id);
      const { order, snapToken } = await orderService.checkout(selectedAddressId, cartItemIds);
      if (!snapToken) throw new Error("Snap Token tidak diterima dari server");

      // BUG 5 — sertakan id pesanan supaya Riwayat Pesanan bisa langsung membuka
      // Detail Pesanan yang baru saja dibayar (lihat OrderHistoryView).
      const riwayatPesananWithOrder = `${ROUTES.riwayatPesanan}?order=${order.id}`;

      openMidtransSnap(snapToken, {
        onSuccess: () => {
          showToast("Pembayaran berhasil");
          router.push(riwayatPesananWithOrder);
        },
        onPending: () => {
          showToast("Menunggu pembayaran Anda");
          router.push(riwayatPesananWithOrder);
        },
        onError: () => {
          showToast("Pembayaran gagal, silakan coba lagi", "error");
        },
        onClose: () => {
          showToast("Anda menutup popup pembayaran. Pesanan tetap tersimpan di Riwayat Pesanan.");
          router.push(riwayatPesananWithOrder);
        },
      });

      // UPDATE 8 — Backend TIDAK lagi mengosongkan keranjang di sini; item yang baru
      // saja di-checkout baru dihapus dari keranjang setelah pembayaran BERHASIL (lihat
      // orderService.clearCartForPaidOrder di backend). fetchCart tetap dipanggil supaya
      // Navbar/halaman Keranjang tersinkron dengan kondisi terbaru dari server (mis. kalau
      // stok berubah di antara checkout & sekarang), bukan untuk mengosongkan keranjang.
      await fetchCartAfterOrder();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Checkout gagal, silakan coba lagi"), "error");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Container className="py-8">
      <h1 className="mb-6 text-3xl font-bold text-neutral-900">Checkout</h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <AddressSelector addresses={addresses} selectedId={selectedAddressId} onSelect={setSelectedAddressId} />
          <CheckoutItemsList items={checkoutItems} />
        </div>

        <div>
          <OrderSummary itemCount={checkoutItems.length} subtotal={checkoutTotalPrice} shippingCost={null} />
          <button
            type="button"
            onClick={handlePay}
            disabled={isProcessing}
            className="mt-4 w-full rounded-full bg-neutral-900 py-3.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
          >
            {isProcessing ? "Memproses..." : "BAYAR SEKARANG"}
          </button>
          <p className="mt-2 text-center text-xs text-neutral-400">
            Ongkos kirim final dihitung backend saat checkout diproses.
          </p>
        </div>
      </div>
    </Container>
  );
}
