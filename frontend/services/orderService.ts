import { apiClient } from "@/lib/apiClient";
import { ApiResponse } from "@/lib/apiTypes";
import { Order, OrderCustomer, OrderShippingAddress, OrderStatus } from "@/types/user";

interface OrderApiResponse {
  id: string;
  userId: string;
  addressId: string;
  totalPrice: number;
  shippingCost: number;
  grandTotal: number;
  status: OrderStatus;
  createdAt: string;
  items: {
    id: string;
    variantId: string;
    quantity: number;
    price: number;
    namaProduk?: string;
    slug?: string;
    sku?: string;
    imageUrl?: string | null;
    warna?: string;
    ukuran?: string;
  }[];
  shippingAddress?: OrderShippingAddress | null;
  customer?: OrderCustomer | null;
  payment: {
    snapToken: string | null;
    transactionStatus: string | null;
    paymentType?: string | null;
    paidAt?: string | null;
  } | null;
  cancelledBy?: "user" | "admin" | null;
}

/** Filter halaman Pesanan Admin: tanggal spesifik, atau bulan(+tahun), dan/atau status. */
export interface OrderFilterParams {
  date?: string;
  month?: string;
  year?: string;
  status?: OrderStatus | "";
}

function toOrder(raw: OrderApiResponse): Order {
  return {
    id: raw.id,
    userId: raw.userId,
    addressId: raw.addressId,
    totalPrice: raw.totalPrice,
    shippingCost: raw.shippingCost,
    grandTotal: raw.grandTotal,
    status: raw.status,
    createdAt: raw.createdAt,
    shippingAddress: raw.shippingAddress ?? null,
    customer: raw.customer ?? null,
    cancelledBy: raw.cancelledBy ?? null,
    payment: raw.payment
      ? {
          transactionStatus: raw.payment.transactionStatus,
          paymentType: raw.payment.paymentType ?? null,
          paidAt: raw.payment.paidAt ?? null,
        }
      : null,
    items: raw.items.map((i) => ({
      id: i.id,
      variantId: i.variantId,
      namaProduk: i.namaProduk,
      slug: i.slug,
      sku: i.sku,
      imageUrl: i.imageUrl,
      warna: i.warna,
      ukuran: i.ukuran,
      harga: i.price,
      quantity: i.quantity,
    })),
  };
}

/** Menghapus key filter yang kosong supaya tidak ikut terkirim sebagai query string. */
function cleanFilterParams(filters?: OrderFilterParams) {
  if (!filters) return undefined;
  const entries = Object.entries(filters).filter(([, value]) => value !== undefined && value !== "");
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

/**
 * Service Order & Checkout. `checkout()` mengembalikan snapToken yang dipakai
 * memanggil window.snap.pay() di sisi frontend (lihat CheckoutView).
 */
export const orderService = {
  /**
   * `cartItemIds` opsional — dikirim dari Cart (Update 5, Bagian B) supaya hanya item
   * yang dicentang user yang diproses backend menjadi pesanan. Jika tidak dikirim,
   * seluruh isi keranjang diproses (perilaku lama tetap kompatibel).
   */
  async checkout(addressId: string, cartItemIds?: string[]) {
    const { data } = await apiClient.post<ApiResponse<OrderApiResponse>>("/orders/checkout", {
      addressId,
      ...(cartItemIds && cartItemIds.length > 0 ? { cartItemIds } : {}),
    });
    return { order: toOrder(data.data), snapToken: data.data.payment?.snapToken ?? null };
  },

  async getMyOrders() {
    const { data } = await apiClient.get<ApiResponse<OrderApiResponse[]>>("/orders/my");
    return data.data.map(toOrder);
  },

  /** Update 2, poin 1-3 — tombol "Batalkan Pesanan" di Riwayat Pesanan (hanya status Menunggu Pembayaran). */
  async cancelOrder(orderId: string) {
    const { data } = await apiClient.post<ApiResponse<OrderApiResponse>>(`/orders/my/${orderId}/cancel`);
    return toOrder(data.data);
  },

  /**
   * Update 1 — tombol "Bayar Sekarang"/"Lanjutkan Pembayaran" untuk pesanan yang masih
   * berstatus Menunggu Pembayaran. Backend TIDAK membuat order/transaksi baru — snapToken
   * yang dikembalikan dipakai lagi untuk membuka popup Midtrans Snap yang sama (lihat
   * openMidtransSnap di bawah).
   */
  async continuePayment(orderId: string) {
    const { data } = await apiClient.post<ApiResponse<{ orderId: string; snapToken: string | null }>>(
      `/orders/my/${orderId}/continue-payment`
    );
    return { orderId: data.data.orderId, snapToken: data.data.snapToken };
  },

  async getAllOrders(filters?: OrderFilterParams) {
    const { data } = await apiClient.get<ApiResponse<OrderApiResponse[]>>("/orders", {
      params: cleanFilterParams(filters),
    });
    return data.data.map(toOrder);
  },

  async updateStatus(orderId: string, status: OrderStatus) {
    const { data } = await apiClient.patch<ApiResponse<OrderApiResponse>>(`/orders/${orderId}/status`, { status });
    return toOrder(data.data);
  },

  async deleteOrder(orderId: string) {
    await apiClient.delete<ApiResponse<null>>(`/orders/${orderId}`);
  },

  /** Menghapus seluruh pesanan yang cocok dengan filter aktif (tombol "Hapus Semua"). */
  async deleteOrdersByFilter(filters?: OrderFilterParams) {
    const { data } = await apiClient.delete<ApiResponse<{ deletedCount: number }>>("/orders", {
      params: cleanFilterParams(filters),
    });
    return data.data.deletedCount;
  },
};

/**
 * Memuat script Midtrans Snap.js secara dinamis (hanya sekali) lalu membuka
 * popup pembayaran. Dipanggil dari CheckoutView setelah checkout() sukses.
 */
export function openMidtransSnap(
  snapToken: string,
  callbacks: { onSuccess?: () => void; onPending?: () => void; onError?: () => void; onClose?: () => void }
) {
  const w = window as typeof window & { snap?: { pay: (token: string, cb: unknown) => void } };

  function pay() {
    w.snap?.pay(snapToken, {
      onSuccess: callbacks.onSuccess,
      onPending: callbacks.onPending,
      onError: callbacks.onError,
      onClose: callbacks.onClose,
    });
  }

  if (w.snap) {
    pay();
    return;
  }

  const script = document.createElement("script");
  const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
  script.src = isProduction ? "https://app.midtrans.com/snap/snap.js" : "https://app.sandbox.midtrans.com/snap/snap.js";
  script.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "");
  script.onload = pay;
  document.body.appendChild(script);
}
